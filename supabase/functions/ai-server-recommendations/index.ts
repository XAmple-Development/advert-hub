import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get user's activity and preferences
    const { data: userActivities } = await supabaseClient
      .from('activities')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: userFavorites } = await supabaseClient
      .from('user_favorites')
      .select('listing_id, listings(*)')
      .eq('user_id', user_id);

    const { data: userVotes } = await supabaseClient
      .from('votes')
      .select('target_id')
      .eq('user_id', user_id)
      .limit(20);

    // Get all active listings with their categories
    const { data: listings } = await supabaseClient
      .from('listings')
      .select(`
        *,
        listing_categories(categories(*)),
        trending_metrics!left(trending_score)
      `)
      .eq('status', 'active')
      .limit(100);

    if (!listings) {
      throw new Error('No listings found');
    }

    // Analyze user interests using OpenAI (if API key is available)
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    let aiRecommendations = [];

    if (openAIKey && userActivities?.length > 0) {
      try {
        const userInterestPrompt = `
          Based on this user's Discord server activity, identify their interests and recommend server types:
          
          Activities: ${JSON.stringify(userActivities.slice(0, 10))}
          Favorited servers: ${JSON.stringify(userFavorites?.map(f => f.listings?.name) || [])}
          
          Respond with a JSON object containing:
          {
            "interests": ["interest1", "interest2", ...],
            "preferred_server_types": ["gaming", "tech", "creative", ...],
            "reasoning": "Brief explanation"
          }
        `;

        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are an AI that analyzes Discord user behavior to recommend servers. Always respond with valid JSON.' 
              },
              { role: 'user', content: userInterestPrompt }
            ],
            temperature: 0.3,
          }),
        });

        const aiData = await openAIResponse.json();
        const aiAnalysis = JSON.parse(aiData.choices[0].message.content);
        
        // Score listings based on AI analysis
        const scoredListings = listings.map(listing => {
          let score = 0;
          
          // Interest matching
          if (aiAnalysis.interests) {
            const listingText = `${listing.name} ${listing.description} ${listing.tags?.join(' ') || ''}`.toLowerCase();
            aiAnalysis.interests.forEach(interest => {
              if (listingText.includes(interest.toLowerCase())) {
                score += 3;
              }
            });
          }
          
          // Server type matching
          if (aiAnalysis.preferred_server_types?.includes(listing.type)) {
            score += 2;
          }
          
          // Trending bonus
          const trendingScore = listing.trending_metrics?.[0]?.trending_score || 0;
          score += Math.min(trendingScore / 10, 2);
          
          // Diversity bonus (avoid recommending similar servers)
          if (!userFavorites?.some(f => f.listing_id === listing.id)) {
            score += 1;
          }
          
          return {
            ...listing,
            recommendation_score: score,
            reasoning: aiAnalysis.reasoning
          };
        });

        aiRecommendations = scoredListings
          .filter(l => l.recommendation_score > 2)
          .sort((a, b) => b.recommendation_score - a.recommendation_score)
          .slice(0, 10);

      } catch (aiError) {
        console.log('AI analysis failed, falling back to basic recommendations:', aiError);
      }
    }

    // Fallback: Basic recommendation algorithm
    if (aiRecommendations.length === 0) {
      const favoritedCategories = userFavorites?.flatMap(f => 
        f.listings?.listing_categories?.map(lc => lc.categories?.name) || []
      ) || [];

      aiRecommendations = listings
        .filter(listing => {
          // Don't recommend already favorited servers
          if (userFavorites?.some(f => f.listing_id === listing.id)) return false;
          
          // Don't recommend servers user already voted for
          if (userVotes?.some(v => v.target_id === listing.id)) return false;
          
          return true;
        })
        .map(listing => {
          let score = 0;
          
          // Category matching
          listing.listing_categories?.forEach(lc => {
            if (favoritedCategories.includes(lc.categories?.name)) {
              score += 2;
            }
          });
          
          // Trending score
          const trendingScore = listing.trending_metrics?.[0]?.trending_score || 0;
          score += Math.min(trendingScore / 10, 2);
          
          // Member count (popularity but not too crowded)
          if (listing.member_count > 100 && listing.member_count < 5000) {
            score += 1;
          }
          
          return {
            ...listing,
            recommendation_score: score,
            reasoning: 'Based on your favorite categories and trending servers'
          };
        })
        .sort((a, b) => b.recommendation_score - a.recommendation_score)
        .slice(0, 10);
    }

    // Store recommendations in database
    for (const recommendation of aiRecommendations) {
      await supabaseClient
        .from('ai_recommendations')
        .insert({
          user_id,
          listing_id: recommendation.id,
          recommendation_type: 'interest_match',
          confidence_score: Math.min(recommendation.recommendation_score / 10, 1),
          reasoning: recommendation.reasoning,
          metadata: {
            interests: recommendation.interests || [],
            score: recommendation.recommendation_score
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        recommendations: aiRecommendations.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          member_count: r.member_count,
          avatar_url: r.avatar_url,
          type: r.type,
          score: r.recommendation_score,
          reasoning: r.reasoning
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-server-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});