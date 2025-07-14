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

    const { listing_id } = await req.json();

    if (!listing_id) {
      throw new Error('Listing ID is required');
    }

    // Get listing data and analytics
    const { data: listing } = await supabaseClient
      .from('listings')
      .select(`
        *,
        listing_analytics(*),
        trending_metrics!left(*),
        bumps(count),
        reviews(rating)
      `)
      .eq('id', listing_id)
      .single();

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Calculate insights
    const insights = [];

    // Growth insights
    const recentMetrics = listing.trending_metrics?.filter(m => 
      new Date(m.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || [];

    if (recentMetrics.length > 0) {
      const avgGrowth = recentMetrics.reduce((sum, m) => sum + (m.member_growth || 0), 0) / recentMetrics.length;
      
      if (avgGrowth > 10) {
        insights.push({
          type: 'growth_acceleration',
          title: 'Strong Growth Momentum',
          description: `Your server is growing ${avgGrowth.toFixed(1)} members per day on average`,
          confidence: 0.9,
          actionable: true,
          recommendations: [
            'Consider increasing your posting frequency to capitalize on this growth',
            'Engage with new members to improve retention',
            'Share your success story to attract more members'
          ]
        });
      } else if (avgGrowth < -5) {
        insights.push({
          type: 'growth_decline',
          title: 'Member Growth Slowing',
          description: `Member growth has decreased by ${Math.abs(avgGrowth).toFixed(1)} per day`,
          confidence: 0.8,
          actionable: true,
          recommendations: [
            'Review your recent content and engagement strategies',
            'Consider running a community event or contest',
            'Ask for feedback from active members'
          ]
        });
      }
    }

    // Engagement insights
    const recentAnalytics = listing.listing_analytics?.filter(a => 
      new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ) || [];

    if (recentAnalytics.length > 0) {
      const totalViews = recentAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalJoins = recentAnalytics.reduce((sum, a) => sum + (a.joins || 0), 0);
      const conversionRate = totalViews > 0 ? (totalJoins / totalViews) * 100 : 0;

      if (conversionRate > 15) {
        insights.push({
          type: 'high_conversion',
          title: 'Excellent Conversion Rate',
          description: `${conversionRate.toFixed(1)}% of visitors join your server`,
          confidence: 0.95,
          actionable: false,
          recommendations: ['Keep doing what you\'re doing! Your server description and preview are very effective']
        });
      } else if (conversionRate < 5) {
        insights.push({
          type: 'low_conversion',
          title: 'Low Visitor Conversion',
          description: `Only ${conversionRate.toFixed(1)}% of visitors join your server`,
          confidence: 0.85,
          actionable: true,
          recommendations: [
            'Update your server description to be more compelling',
            'Add a better server banner or icon',
            'Include clear information about what members can expect',
            'Consider adding server rules and guidelines'
          ]
        });
      }
    }

    // Review insights
    const reviews = listing.reviews || [];
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      if (avgRating >= 4.5) {
        insights.push({
          type: 'excellent_reviews',
          title: 'Outstanding Community Rating',
          description: `Average rating of ${avgRating.toFixed(1)}/5 from ${reviews.length} reviews`,
          confidence: 0.9,
          actionable: false,
          recommendations: ['Consider featuring positive reviews in your server description']
        });
      } else if (avgRating < 3.0) {
        insights.push({
          type: 'poor_reviews',
          title: 'Review Score Needs Attention',
          description: `Average rating of ${avgRating.toFixed(1)}/5 suggests member dissatisfaction`,
          confidence: 0.8,
          actionable: true,
          recommendations: [
            'Review recent feedback and address common complaints',
            'Improve moderation and community guidelines',
            'Engage more actively with your community',
            'Consider surveying members for specific improvement areas'
          ]
        });
      }
    }

    // Use AI for advanced insights if available
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (openAIKey && insights.length > 0) {
      try {
        const aiPrompt = `
          Analyze this Discord server's performance data and provide additional insights:
          
          Server: ${listing.name}
          Description: ${listing.description}
          Members: ${listing.member_count}
          Type: ${listing.type}
          
          Current insights: ${JSON.stringify(insights.map(i => ({ type: i.type, title: i.title })))}
          
          Provide 1-2 additional unique insights in JSON format:
          {
            "insights": [
              {
                "type": "insight_type",
                "title": "Short title",
                "description": "Detailed explanation",
                "confidence": 0.8,
                "actionable": true,
                "recommendations": ["action1", "action2"]
              }
            ]
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
                content: 'You are an expert Discord server growth analyst. Provide actionable insights based on server data. Always respond with valid JSON.' 
              },
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.4,
          }),
        });

        const aiData = await openAIResponse.json();
        const aiInsights = JSON.parse(aiData.choices[0].message.content);
        
        if (aiInsights.insights) {
          insights.push(...aiInsights.insights);
        }
      } catch (aiError) {
        console.log('AI insights generation failed:', aiError);
      }
    }

    // Store insights in database
    for (const insight of insights) {
      await supabaseClient
        .from('analytics_insights')
        .insert({
          listing_id,
          insight_type: insight.type,
          insight_data: insight,
          confidence_score: insight.confidence
        });
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});