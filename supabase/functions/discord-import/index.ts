
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

  // 4. Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // 5. Get user via Supabase JWT (bearerToken)
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

  // 7. Parse JSON body first to check action
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
    // For now, return mock data since the Discord OAuth token issue is preventing real API calls
    // This will allow the UI to work while we resolve the token storage issue
    console.log('[discord-import] Returning mock data due to Discord token limitations');
    
    const mockServers = [
      {
        id: '123456789012345678',
        name: 'My Gaming Server',
        icon: null,
        permissions: '8',
        member_count: 150,
        owner: true
      },
      {
        id: '234567890123456789',
        name: 'Community Hub',
        icon: null,
        permissions: '8',
        member_count: 75,
        owner: false
      }
    ];

    const mockBots = [
      {
        id: '345678901234567890',
        name: 'My Bot',
        icon: null,
        description: 'A helpful Discord bot',
        public: false
      }
    ];

    return new Response(JSON.stringify({
      servers: mockServers,
      bots: mockBots,
      note: 'This is mock data. Discord OAuth token storage needs to be configured properly for real data.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }

  if (action === 'import') {
    // Mock import success
    console.log('[discord-import] Mock import payload:', JSON.stringify(requestBody));
    return new Response(JSON.stringify({
      success: true,
      message: 'Mock import completed successfully. Real import will work once Discord OAuth is properly configured.',
      imported: {
        servers: requestBody.servers?.length || 0,
        bots: requestBody.bots?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
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
