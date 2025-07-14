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

    console.log('Starting trending calculation...');

    // Call the database function to calculate trending scores
    const { error } = await supabaseClient.rpc('calculate_trending_scores');

    if (error) {
      console.error('Error calculating trending scores:', error);
      throw error;
    }

    // Get top trending servers for response
    const { data: trending } = await supabaseClient
      .from('trending_metrics')
      .select(`
        listing_id,
        trending_score,
        growth_velocity,
        engagement_score,
        member_growth,
        vote_growth,
        view_growth,
        listings(name, member_count, type)
      `)
      .eq('date', new Date().toISOString().split('T')[0])
      .order('trending_score', { ascending: false })
      .limit(20);

    console.log(`Calculated trending scores for ${trending?.length || 0} listings`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trending scores calculated successfully',
        top_trending: trending || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-trending function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});