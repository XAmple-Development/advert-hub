
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
    console.log('[discord-import] Starting request processing...');

    // 2. Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    let bearerToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7);
    }

    if (!bearerToken) {
      console.error('[discord-import][ERROR] Missing Authorization header');
      return new Response(JSON.stringify({
        error: 'Missing Bearer token in Authorization header', 
        code: 'NO_AUTH_HEADER',
        details: 'Please ensure you are logged in and try again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 401 
      });
    }

    // 3. Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 4. Get user via Supabase JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(bearerToken);
    console.log('[discord-import] User authentication result:', !!user, userError?.message);
    
    if (userError || !user) {
      console.error('[discord-import][ERROR] User auth failed:', userError);
      return new Response(JSON.stringify({
        error: 'Authentication failed', 
        code: 'AUTH_ERROR',
        details: userError?.message || 'Unable to verify user authentication'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // 5. Check if user signed in with Discord
    const isDiscord = user.app_metadata?.provider === 'discord' || 
                     user.app_metadata?.providers?.includes('discord');
    console.log('[discord-import] Discord provider check:', isDiscord, 'providers:', user.app_metadata?.providers);

    if (!isDiscord) {
      console.error('[discord-import][ERROR] User not authenticated with Discord');
      return new Response(JSON.stringify({
        error: 'Discord authentication required', 
        code: 'NOT_DISCORD_USER',
        details: 'Please sign in with Discord to use this feature'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 6. Get Discord access token - try multiple sources
    console.log('[discord-import] Attempting to retrieve Discord access token...');
    
    // First try to get from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('discord_access_token')
      .eq('id', user.id)
      .single();

    let discordAccessToken = profile?.discord_access_token;
    console.log('[discord-import] Profile token available:', !!discordAccessToken);

    // Fallback to user metadata
    if (!discordAccessToken) {
      discordAccessToken = user.user_metadata?.provider_token;
      console.log('[discord-import] Metadata token available:', !!discordAccessToken);
    }

    // Last resort - try identities
    if (!discordAccessToken && user.identities && user.identities.length > 0) {
      const discordIdentity = user.identities.find(identity => identity.provider === 'discord');
      if (discordIdentity) {
        discordAccessToken = discordIdentity.access_token;
        console.log('[discord-import] Identity token available:', !!discordAccessToken);
      }
    }

    if (!discordAccessToken) {
      console.error('[discord-import][ERROR] No Discord access token found in any location');
      return new Response(JSON.stringify({
        error: 'Discord access token not found', 
        code: 'NO_DISCORD_TOKEN',
        details: 'Your Discord session may have expired. Please sign out and sign back in with Discord to refresh your authentication.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 7. Parse request body
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
    console.log('[discord-import] Action requested:', action);

    if (action === 'fetch') {
      try {
        console.log('[discord-import] Testing Discord API connection...');

        // Test Discord token validity first
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bearer ${discordAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('[discord-import][ERROR] Discord API test failed:', userResponse.status, errorText);
          
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
          
          return new Response(JSON.stringify({
            error: 'Discord API error',
            code: 'DISCORD_API_ERROR',
            details: `Discord API returned ${userResponse.status}: ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }

        const discordUser = await userResponse.json();
        console.log('[discord-import] Discord user verified:', discordUser.username);

        // Fetch guilds
        console.log('[discord-import] Fetching Discord guilds...');
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
          
          return new Response(JSON.stringify({
            error: 'Failed to fetch Discord servers',
            code: 'DISCORD_GUILDS_ERROR',
            details: `Could not retrieve your Discord servers: ${guildsResponse.status} - ${errorText}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }

        const guilds = await guildsResponse.json();
        console.log('[discord-import] Fetched guilds:', guilds.length);

        // Filter servers where user has MANAGE_GUILD permission or is owner
        const manageableServers = guilds.filter((guild: any) => {
          const hasManagePermission = (parseInt(guild.permissions) & 0x20) === 0x20;
          return guild.owner || hasManagePermission;
        });

        console.log('[discord-import] Manageable servers:', manageableServers.length);

        // Try to fetch applications (bots) - this might fail for users without the right scope
        let applications = [];
        try {
          const appsResponse = await fetch('https://discord.com/api/v10/applications', {
            headers: {
              'Authorization': `Bearer ${discordAccessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (appsResponse.ok) {
            applications = await appsResponse.json();
            console.log('[discord-import] Fetched applications:', applications.length);
          } else {
            console.log('[discord-import] Could not fetch applications (this is normal for most users)');
          }
        } catch (error) {
          console.log('[discord-import] Applications fetch failed (this is normal):', error);
        }

        // Format response data
        const servers = manageableServers.map((guild: any) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          permissions: guild.permissions,
          member_count: guild.approximate_member_count || 0,
          owner: guild.owner
        }));

        const bots = applications.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon,
          description: app.description || 'A Discord bot application',
          public: app.bot_public || false
        }));

        console.log('[discord-import] Returning data:', { servers: servers.length, bots: bots.length });

        return new Response(JSON.stringify({
          servers: servers,
          bots: bots
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });

      } catch (error: any) {
        console.error('[discord-import][ERROR] Fetch failed:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch Discord data',
          message: error.message,
          code: 'DISCORD_FETCH_ERROR',
          details: 'There was an error communicating with Discord\'s API. Please try again.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    // Handle import action
    if (action === 'import') {
      console.log('[discord-import] Starting import process...');
      const { servers: selectedServerIds, bots: selectedBotIds } = requestBody;
      
      if (!selectedServerIds?.length && !selectedBotIds?.length) {
        return new Response(JSON.stringify({
          error: 'No items selected for import',
          code: 'NO_SELECTION',
          details: 'Please select at least one server or bot to import.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      try {
        let importedServers = 0;
        let importedBots = 0;

        // Import selected servers
        if (selectedServerIds?.length > 0) {
          // Re-fetch guild data for import
          const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
              'Authorization': `Bearer ${discordAccessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (guildsResponse.ok) {
            const guilds = await guildsResponse.json();
            const serversToImport = guilds.filter((server: any) => selectedServerIds.includes(server.id));
            
            for (const server of serversToImport) {
              const { error: serverError } = await supabaseClient
                .from('listings')
                .insert({
                  user_id: user.id,
                  type: 'server',
                  name: server.name,
                  description: `Discord server with ${server.approximate_member_count || 0} members. ${server.owner ? 'You are the owner of this server.' : 'You have manage permissions.'}`,
                  member_count: server.approximate_member_count || 0,
                  view_count: 0,
                  bump_count: 0,
                  status: 'active',
                  avatar_url: server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null,
                  discord_id: server.id,
                  invite_url: null
                });

              if (serverError) {
                console.error('[discord-import][ERROR] Failed to import server:', server.name, serverError);
              } else {
                importedServers++;
                console.log('[discord-import] Successfully imported server:', server.name);
              }
            }
          }
        }

        // Import selected bots
        if (selectedBotIds?.length > 0) {
          try {
            const appsResponse = await fetch('https://discord.com/api/v10/applications', {
              headers: {
                'Authorization': `Bearer ${discordAccessToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (appsResponse.ok) {
              const applications = await appsResponse.json();
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
                    invite_url: null
                  });

                if (botError) {
                  console.error('[discord-import][ERROR] Failed to import bot:', bot.name, botError);
                } else {
                  importedBots++;
                  console.log('[discord-import] Successfully imported bot:', bot.name);
                }
              }
            }
          } catch (error) {
            console.error('[discord-import][ERROR] Bot import failed:', error);
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

    // Invalid action
    return new Response(JSON.stringify({
      error: 'Invalid action',
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
