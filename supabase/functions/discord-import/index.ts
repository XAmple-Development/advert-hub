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

  try {
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
      return new Response(JSON.stringify({
        error: 'Missing Bearer token in Authorization header', 
        code: 'NO_AUTH_HEADER',
        details: 'Please ensure you are logged in and try again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 401 
      });
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
      return new Response(JSON.stringify({
        error: 'Authentication failed', 
        code: 'AUTH_ERROR',
        details: userError?.message || 'Unable to verify user authentication'
      }), {
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
      return new Response(JSON.stringify({
        error: 'Discord authentication required', 
        code: 'NOT_DISCORD_USER',
        details: 'Please sign in with Discord to use this feature'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 7. Get Discord access token from user metadata
    const discordAccessToken = user.user_metadata?.provider_token || user.identities?.[0]?.access_token;
    console.log('[discord-import] Discord token available:', !!discordAccessToken);
    console.log('[discord-import] User metadata:', user.user_metadata);
    console.log('[discord-import] User identities:', user.identities);

    if (!discordAccessToken) {
      console.error('[discord-import][ERROR] No Discord access token found');
      return new Response(JSON.stringify({
        error: 'Discord access token not found', 
        code: 'NO_DISCORD_TOKEN',
        details: 'Your Discord session may have expired. Please sign out and sign back in with Discord to refresh your authentication.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 8. Parse JSON body first to check action
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('[discord-import][ERROR] Invalid request body:', e);
      return new Response(JSON.stringify({
        error: 'Invalid request body', 
        code: 'BAD_REQUEST',
        details: 'Request body must be valid JSON'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { action } = requestBody;
    console.log('[discord-import] action:', action);

    if (action === 'fetch') {
      try {
        console.log('[discord-import] Fetching real Discord data...');

        // Test Discord token validity first
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('[discord-import][ERROR] Discord user API failed:', userResponse.status, errorText);
          
          if (userResponse.status === 401) {
            return new Response(JSON.stringify({
              error: 'Discord token expired',
              code: 'DISCORD_TOKEN_EXPIRED',
              details: 'Your Discord authentication has expired. Please sign out and sign back in with Discord.'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401
            });
          }
          
          throw new Error(`Discord API authentication failed: ${userResponse.status} - ${errorText}`);
        }

        const discordUser = await userResponse.json();
        console.log('[discord-import] Discord user verified:', discordUser.username);

        // Fetch user's Discord guilds (servers)
        const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!guildsResponse.ok) {
          const errorText = await guildsResponse.text();
          console.error('[discord-import][ERROR] Failed to fetch guilds:', guildsResponse.status, errorText);
          
          if (guildsResponse.status === 403) {
            return new Response(JSON.stringify({
              error: 'Insufficient Discord permissions',
              code: 'DISCORD_PERMISSIONS_ERROR',
              details: 'Missing guilds scope. Please re-authenticate with Discord to grant server access permissions.'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403
            });
          }
          
          throw new Error(`Failed to fetch Discord servers: ${guildsResponse.status} - ${errorText}`);
        }

        const guilds = await guildsResponse.json();
        console.log('[discord-import] Fetched guilds:', guilds.length);

        // Filter servers where user has MANAGE_GUILD permission (0x20) or is owner
        const manageableServers = guilds.filter((guild: any) => {
          const hasManagePermission = (parseInt(guild.permissions) & 0x20) === 0x20;
          return guild.owner || hasManagePermission;
        });

        // Fetch user's Discord applications (bots)
        const appsResponse = await fetch('https://discord.com/api/v10/applications', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        let applications = [];
        if (appsResponse.ok) {
          applications = await appsResponse.json();
          console.log('[discord-import] Fetched applications:', applications.length);
        } else {
          const errorText = await appsResponse.text();
          console.log('[discord-import] Could not fetch applications:', appsResponse.status, errorText);
          
          if (appsResponse.status === 403) {
            console.log('[discord-import] Missing applications.builds.read scope - this is normal for most users');
          }
        }

        // For servers, we need to get member counts
        const serversWithCounts = await Promise.all(
          manageableServers.map(async (guild: any) => {
            try {
              // Try to get approximate member count from guild object first
              let memberCount = guild.approximate_member_count || 0;
              
              // If not available, try to fetch from guild endpoint (requires bot permissions)
              if (!memberCount) {
                const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.id}?with_counts=true`, {
                  headers: {
                    'Authorization': `Bearer ${discordAccessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (guildResponse.ok) {
                  const guildData = await guildResponse.json();
                  memberCount = guildData.approximate_member_count || 0;
                }
              }

              return {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                permissions: guild.permissions,
                member_count: memberCount,
                owner: guild.owner
              };
            } catch (error) {
              console.error(`[discord-import] Error fetching data for guild ${guild.id}:`, error);
              return {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                permissions: guild.permissions,
                member_count: 0,
                owner: guild.owner
              };
            }
          })
        );

        // Format bots data
        const bots = applications.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon,
          description: app.description || 'A Discord bot application',
          public: app.bot_public || false
        }));

        console.log('[discord-import] Returning real Discord data:', {
          servers: serversWithCounts.length,
          bots: bots.length
        });

        return new Response(JSON.stringify({
          servers: serversWithCounts,
          bots: bots
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });

      } catch (error: any) {
        console.error('[discord-import][ERROR] Failed to fetch Discord data:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch Discord data',
          message: error.message,
          code: 'DISCORD_API_ERROR',
          details: 'There was an error communicating with Discord\'s API. Please try again or check your Discord authentication.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    if (action === 'import') {
      console.log('[discord-import] Starting import process...');
      const { servers: selectedServerIds, bots: selectedBotIds } = requestBody;
      
      try {
        // Fetch the real data again to import
        const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!guildsResponse.ok) {
          throw new Error(`Failed to fetch Discord servers: ${guildsResponse.status}`);
        }

        const guilds = await guildsResponse.json();
        const manageableServers = guilds.filter((guild: any) => {
          const hasManagePermission = (parseInt(guild.permissions) & 0x20) === 0x20;
          return guild.owner || hasManagePermission;
        });

        const appsResponse = await fetch('https://discord.com/api/v10/applications', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        let applications = [];
        if (appsResponse.ok) {
          applications = await appsResponse.json();
        }

        let importedServers = 0;
        let importedBots = 0;

        // Import selected servers
        if (selectedServerIds && selectedServerIds.length > 0) {
          const serversToImport = manageableServers.filter((server: any) => selectedServerIds.includes(server.id));
          
          for (const server of serversToImport) {
            // Get member count
            let memberCount = server.approximate_member_count || 0;
            try {
              const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${server.id}?with_counts=true`, {
                headers: {
                  'Authorization': `Bearer ${discordAccessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (guildResponse.ok) {
                const guildData = await guildResponse.json();
                memberCount = guildData.approximate_member_count || memberCount;
              }
            } catch (error) {
              console.error(`Error fetching member count for ${server.id}:`, error);
            }

            const { error: serverError } = await supabaseClient
              .from('listings')
              .insert({
                user_id: user.id,
                type: 'server',
                name: server.name,
                description: `Discord server with ${memberCount} members. ${server.owner ? 'You are the owner of this server.' : 'You have manage permissions.'}`,
                member_count: memberCount,
                view_count: 0,
                bump_count: 0,
                status: 'active',
                avatar_url: server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null,
                discord_id: server.id,
                invite_url: null // Will need to be set manually by user
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
          const botsToImport = applications.filter((bot: any) => selectedBotIds.includes(bot.id));
          
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
                discord_id: bot.id,
                invite_url: null // Will need to be set manually by user
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
          code: 'IMPORT_ERROR',
          details: 'Failed to import selected items. Please try again.'
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
      code: 'INVALID_ACTION',
      details: 'Action must be either "fetch" or "import"'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error: any) {
    console.error('[discord-import][FATAL ERROR] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR',
      details: 'An unexpected error occurred. Please try again later.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
