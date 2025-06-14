
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility for CORS preflight
function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

serve(async (req: Request) => {
  // Handle preflight for CORS
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  // Create Supabase client for Edge Functions
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  // Check user session
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    });
  }

  // Verify Discord login
  const isDiscord = user.app_metadata?.provider === 'discord' ||
    user.app_metadata?.providers?.includes('discord');

  if (!isDiscord) {
    return new Response(JSON.stringify({
      error: 'Discord authentication required',
      code: 'NOT_DISCORD_USER'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  // Get raw session to access tokens
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError || !session) {
    return new Response(JSON.stringify({
      error: 'No active session',
      code: 'NO_SESSION'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    });
  }

  // Attempt to obtain Discord OAuth token
  let discordToken: string | undefined = session.provider_token
    || session.access_token
    || user.user_metadata?.provider_token;

  if (!discordToken) {
    return new Response(JSON.stringify({
      error: 'No Discord token found. Please sign out completely and sign in only with Discord.',
      code: 'NO_DISCORD_TOKEN'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  // Parse action
  let requestBody: any = {};
  try {
    requestBody = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({
      error: 'Invalid request body',
      code: 'BAD_REQUEST'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  const { action } = requestBody;

  if (action === 'fetch') {
    // Example: test Discord OAuth, fetch user object
    try {
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!userResponse.ok) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch Discord profile',
          code: 'DISCORD_PROFILE_FAIL'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const discordUser = await userResponse.json();
      // Minimal working return (expand as needed)
      return new Response(JSON.stringify({
        discord_user: discordUser
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Could not connect to Discord API',
        details: e.message,
        code: 'DISCORD_API_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  // Skeleton for import action (not implemented)
  if (action === 'import') {
    // Place import logic here
    return new Response(JSON.stringify({
      success: false,
      message: 'Import logic not implemented in starter template.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 501
    });
  }

  return new Response(JSON.stringify({
    error: 'Invalid action.',
    code: 'INVALID_ACTION'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400
  });
});
