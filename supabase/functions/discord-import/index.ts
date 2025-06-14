
// Edge Function: discord-import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

serve(async (req: Request) => {
  // 1. CORS preflight
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  // 2. Logging request headers
  console.log('[discord-import] Request headers:', Object.fromEntries(req.headers.entries()));

  // 3. Extract Bearer token from Authorization header (robustly)
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7);
  }

  if (!bearerToken) {
    console.error('[discord-import][ERROR] Missing Authorization header (Bearer required)');
    return new Response(JSON.stringify({error: 'Missing Bearer token in Authorization header', code: 'NO_AUTH_HEADER'}),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }
  console.log('[discord-import] Bearer token received:', !!bearerToken);

  // 4. Create Supabase client (no automatic user context—we'll use bearerToken directly)
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // 5. Get user and validate with token
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(bearerToken);
  console.log('[discord-import] user:', JSON.stringify(user));
  if (userError || !user) {
    console.error('[discord-import][ERROR] user auth failed:', userError);
    return new Response(JSON.stringify({error: 'Authentication failed', code: 'AUTH_ERROR'}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    });
  }

  // 6. Discord provider check
  const isDiscord = user.app_metadata?.provider === 'discord'
    || user.app_metadata?.providers?.includes('discord');
  console.log('[discord-import] isDiscord:', isDiscord, 'app_metadata:', user.app_metadata);

  if (!isDiscord) {
    console.error('[discord-import][ERROR] Not a Discord user');
    return new Response(JSON.stringify({error: 'Discord authentication required', code: 'NOT_DISCORD_USER'}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  // 7. At this point, bearerToken *is* the Discord token
  const discordToken = bearerToken;
  console.log('[discord-import] discordToken:', discordToken ? '[REDACTED]' : null);

  // 8. Parse JSON body
  let requestBody: any = {};
  try {
    requestBody = await req.json();
  } catch (e) {
    console.error('[discord-import][ERROR] Invalid request body:', e);
    return new Response(JSON.stringify({error: 'Invalid request body', code: 'BAD_REQUEST'}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }

  const { action } = requestBody;
  console.log('[discord-import] action:', action);

  if (action === 'fetch') {
    // 9. Fetch Discord profile (as test/proof-of-token)
    try {
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json',
        }
      });
      const text = await userResponse.text();
      console.log('[discord-import] Discord API /users/@me status:', userResponse.status, 'body:', text);

      if (!userResponse.ok) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch Discord profile',
          code: 'DISCORD_PROFILE_FAIL',
          details: text,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const discordUser = JSON.parse(text);
      // Proof it works: just return this user
      return new Response(JSON.stringify({
        discord_user: discordUser
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (e) {
      console.error('[discord-import][ERROR] Could not connect to Discord API:', e);
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

  if (action === 'import') {
    // 10. Import logic stub
    console.log('[discord-import] import payload:', JSON.stringify(requestBody));
    return new Response(JSON.stringify({
      success: false,
      message: 'Import logic not implemented.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 501
    });
  }

  // Fallback for invalid actions
  console.error('[discord-import][ERROR] Invalid action:', action);
  return new Response(JSON.stringify({
    error: 'Invalid action.',
    code: 'INVALID_ACTION'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400
  });
});

