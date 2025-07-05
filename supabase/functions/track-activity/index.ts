import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { activity_type, target_type, target_id, metadata, user_id } = await req.json()

    // Create live activity entry
    const { error } = await supabaseClient
      .from('live_activity')
      .insert({
        user_id,
        activity_type,
        target_type,
        target_id,
        metadata: metadata || {},
        is_public: true
      })

    if (error) {
      console.error('Error creating activity:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean up old activities (keep only last 100)
    await supabaseClient
      .from('live_activity')
      .delete()
      .not('id', 'in', `(
        SELECT id FROM live_activity 
        ORDER BY created_at DESC 
        LIMIT 100
      )`)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
