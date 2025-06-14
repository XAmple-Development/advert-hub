// Edge Function: discord-import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('[discord-import] Starting request processing...');

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[discord-import][ERROR] Missing or invalid Authorization header');
      return new Response(JSON.stringify({
        error: 'Missing Bearer token in Authorization header',
        code: 'NO_AUTH_HEADER',
        details: 'Please ensure you are logged in and try again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
    const bearerToken = authHeader.substring(7);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Validate user with Supabase auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(bearerToken);
    if (userError || !user) {
      console.error('[discord-import][ERROR] User authentication failed:', userError);
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: userError?.message || 'Unable to verify user authentication'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Confirm user authenticated with Discord provider
    const isDiscord = user.app_metadata?.provider === 'discord' ||
                      user.app_metadata?.providers?.includes('discord');
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

    // Retrieve Discord access token from multiple possible locations
    let discordAccessToken = null;

    // Try profiles table first
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('discord_access_token')
      .eq('id', user.id)
      .single();

    if (profile?.discord_access_token) {
      discordAccessToken = profile.discord_access_token;
    } else if (user.user_metadata?.provider_token) {
      discordAccessToken = user.user_metadata.provider_token;
    } else if (user.identities?.length) {
      const discordIdentity = user.identities.find(i => i.provider === 'discord');
      discordAccessToken = discordIdentity?.access_token ?? null;
    }

    if (!discordAccessToken) {
      console.error('[discord-import][ERROR] No Discord access token found');
      return new Response(JSON.stringify({
        error: 'Discord access token not found',
        code: 'NO_DISCORD_TOKEN',
        details: 'Your Discord session may have expired. Please sign out and sign back in with Discord.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Parse request body JSON
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('[discord-import][ERROR] Invalid JSON body:', e);
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

    // Handle fetch action
    if (action === 'fetch') {
      // Validate Discord token by fetching user info
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bearer ${discordAccessToken}` }
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('[discord-import][ERROR] Discord API user fetch failed:', userResponse.status, errorText);

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

      // Fetch user guilds
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { 'Authorization': `Bearer ${discordAccessToken}` }
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

      // Filter guilds where user is owner or has manage permissions (0x20)
      const manageableServers = guilds.filter((guild: any) => {
        const hasManagePermission = (parseInt(guild.permissions) & 0x20) === 0x20;
        return guild.owner || hasManagePermission;
      });

      // Attempt to fetch user's bot applications (may fail for most users)
      let applications = [];
      try {
        const appsResponse = await fetch('https://discord.com/api/v10/applications', {
          headers: { 'Authorization': `Bearer ${discordAccessToken}` }
        });
        if (appsResponse.ok) {
          applications = await appsResponse.json();
        } else {
          console.info('[discord-import] Could not fetch applications (normal for most users)');
        }
      } catch {
        console.info('[discord-import] Applications fetch failed (normal for most users)');
      }

      // Format servers and bots for response
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

      return new Response(JSON.stringify({ servers, bots }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Handle import action
    if (action === 'import') {
      const { servers: selectedServerIds = [], bots: selectedBotIds = [] } = requestBody;

      if (selectedServerIds.length === 0 && selectedBotIds.length === 0) {
        return new Response(JSON.stringify({
          error: 'No items selected for import',
          code: 'NO_SELECTION',
          details: 'Please select at least one server or bot to import.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      let importedServers = 0;
      let importedBots = 0;

      // Import selected servers into Supabase
      for (const serverId of selectedServerIds) {
        // Fetch server details again to get full info (optional optimization: cache guilds)
        const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
          headers: { 'Authorization': `Bearer ${discordAccessToken}` }
        });

        if (!guildResponse.ok) {
          console.warn(`[discord-import] Failed to fetch guild ${serverId}, skipping import.`);
          continue;
        }

        const guildData = await guildResponse.json();

        // Insert or update the server listing in Supabase
        const { error: insertError } = await supabaseClient
          .from('listings')
          .upsert({
            discord_server_id: guildData.id,
            discord_server_name: guildData.name,
            discord_server_icon: guildData.icon,
            owner_id: user.id,
            verified: false
          }, { onConflict: 'discord_server_id' });

        if (!insertError) {
          importedServers++;
        } else {
          console.warn(`[discord-import] Failed to insert guild ${serverId}:`, insertError);
        }
      }

      // Import selected bots into Supabase
      for (const botId of selectedBotIds) {
        // Fetch bot application details
        const appResponse = await fetch(`https://discord.com/api/v10/applications/${botId}`, {
          headers: { 'Authorization': `Bearer ${discordAccessToken}` }
        });

        if (!appResponse.ok) {
          console.warn(`[discord-import] Failed to fetch bot application ${botId}, skipping import.`);
          continue;
        }

        const appData = await appResponse.json();

        // Insert or update the bot listing in Supabase
        const { error: insertError } = await supabaseClient
          .from('listings')
          .upsert({
            discord_bot_id: appData.id,
            discord_bot_name: appData.name,
            discord_bot_icon: appData.icon,
            owner_id: user.id,
            verified: false
          }, { onConflict: 'discord_bot_id' });

        if (!insertError) {
          importedBots++;
        } else {
          console.warn(`[discord-import] Failed to insert bot ${botId}:`, insertError);
        }
      }

      return new Response(JSON.stringify({
        message: `Imported ${importedServers} server(s) and ${importedBots} bot(s) successfully.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Unknown action
    return new Response(JSON.stringify({
      error: 'Invalid action',
      code: 'INVALID_ACTION',
      details: 'Supported actions are: fetch, import'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error('[discord-import][ERROR] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message || String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
