
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
    console.log('[discord-import] Starting import process...');
    const { servers: selectedServerIds, bots: selectedBotIds } = requestBody;
    
    // Mock data to match what we return in fetch
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

    try {
      let importedServers = 0;
      let importedBots = 0;

      // Import selected servers
      if (selectedServerIds && selectedServerIds.length > 0) {
        const serversToImport = mockServers.filter(server => selectedServerIds.includes(server.id));
        
        for (const server of serversToImport) {
          const { error: serverError } = await supabaseClient
            .from('listings')
            .insert({
              user_id: user.id,
              type: 'server',
              name: server.name,
              description: `Discord server with ${server.member_count} members. ${server.owner ? 'You are the owner of this server.' : 'You have manage permissions.'}`,
              member_count: server.member_count,
              view_count: 0,
              bump_count: 0,
              status: 'active',
              avatar_url: server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null,
              discord_id: server.id
            });

          if (serverError) {
            console.error('[discord-import][ERROR] Failed to import server:', server.name, serverError);
          } else {
            importedServers++;
            console.log('[discord-import] Successfully imported server:', server.name);
          }
        }
      }

      // Import selected bots
      if (selectedBotIds && selectedBotIds.length > 0) {
        const botsToImport = mockBots.filter(bot => selectedBotIds.includes(bot.id));
        
        for (const bot of botsToImport) {
          const { error: botError } = await supabaseClient
            .from('listings')
            .insert({
              user_id: user.id,
              type: 'bot',
              name: bot.name,
              description: bot.description || 'A Discord bot application',
              member_count: 0,
              view_count: 0,
              bump_count: 0,
              status: 'active',
              avatar_url: bot.icon ? `https://cdn.discordapp.com/app-icons/${bot.id}/${bot.icon}.png` : null,
              discord_id: bot.id
            });

          if (botError) {
            console.error('[discord-import][ERROR] Failed to import bot:', bot.name, botError);
          } else {
            importedBots++;
            console.log('[discord-import] Successfully imported bot:', bot.name);
          }
        }
      }

      console.log('[discord-import] Import completed:', { importedServers, importedBots });

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully imported ${importedServers} servers and ${importedBots} bots.`,
        imported: {
          servers: importedServers,
          bots: importedBots
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (error: any) {
      console.error('[discord-import][ERROR] Import failed:', error);
      return new Response(JSON.stringify({
        error: 'Import failed',
        message: error.message,
        code: 'IMPORT_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
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
