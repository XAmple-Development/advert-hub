
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
  const corsResponse = handleOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    let bearerToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7);
    }

    if (!bearerToken) {
      return new Response(JSON.stringify({
        error: 'Missing Bearer token in Authorization header', 
        code: 'NO_AUTH_HEADER',
        details: 'Please ensure you are logged in and try again.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 401 
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(bearerToken);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication failed', 
        code: 'AUTH_ERROR',
        details: userError?.message || 'Unable to verify user authentication'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const isDiscord = user.app_metadata?.provider === 'discord' || 
                     user.app_metadata?.providers?.includes('discord');

    if (!isDiscord) {
      return new Response(JSON.stringify({
        error: 'Discord authentication required', 
        code: 'NOT_DISCORD_USER',
        details: 'Please sign in with Discord to use this feature'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('discord_access_token')
      .eq('id', user.id)
      .single();

    let discordAccessToken = profile?.discord_access_token ||
      user.user_metadata?.provider_token ||
      (user.identities?.find((i: any) => i.provider === 'discord')?.access_token);

    if (!discordAccessToken) {
      return new Response(JSON.stringify({
        error: 'Discord access token not found', 
        code: 'NO_DISCORD_TOKEN',
        details: 'Your Discord session may have expired. Please sign out and sign back in with Discord to refresh your authentication.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch (e) {
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

    if (action === 'fetch') {
      // First verify the token is still valid
      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${discordAccessToken}` }
      });
      if (!userRes.ok) {
        return new Response(JSON.stringify({
          error: 'Discord token expired',
          code: 'DISCORD_TOKEN_EXPIRED',
          details: 'Your Discord authentication has expired. Please sign out and sign back in with Discord.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        });
      }

      const discordUser = await userRes.json();
      console.log('Discord user ID:', discordUser.id);

      // Fetch guilds
      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${discordAccessToken}` }
      });

      const guilds = guildsRes.ok ? await guildsRes.json() : [];
      const manageableServers = guilds.filter((g: any) => g.owner || (parseInt(g.permissions) & 0x20));

      // For bots, we need to fetch applications owned by this user
      // This uses a different approach - we'll look for applications where the user is the owner
      let applications = [];
      
      try {
        // Try to get applications via the applications endpoint
        const appsRes = await fetch('https://discord.com/api/v10/applications', {
          headers: { Authorization: `Bearer ${discordAccessToken}` }
        });
        
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          applications = appsData;
          console.log('Found applications via /applications endpoint:', applications.length);
        } else {
          console.log('Applications endpoint failed:', appsRes.status, appsRes.statusText);
          
          // Alternative approach: Try to get applications that the user owns
          // by checking OAuth2 applications
          const oauth2AppsRes = await fetch('https://discord.com/api/v10/oauth2/applications/@me', {
            headers: { Authorization: `Bearer ${discordAccessToken}` }
          });
          
          if (oauth2AppsRes.ok) {
            const oauth2Data = await oauth2AppsRes.json();
            applications = [oauth2Data]; // This returns a single application
            console.log('Found application via OAuth2 endpoint');
          } else {
            console.log('OAuth2 applications endpoint also failed:', oauth2AppsRes.status);
            
            // Last resort: Try to find applications through team endpoints if available
            const teamsRes = await fetch('https://discord.com/api/v10/teams', {
              headers: { Authorization: `Bearer ${discordAccessToken}` }
            });
            
            if (teamsRes.ok) {
              const teams = await teamsRes.json();
              console.log('Found teams:', teams.length);
              
              // Get applications for each team
              for (const team of teams) {
                try {
                  const teamAppsRes = await fetch(`https://discord.com/api/v10/teams/${team.id}/applications`, {
                    headers: { Authorization: `Bearer ${discordAccessToken}` }
                  });
                  
                  if (teamAppsRes.ok) {
                    const teamApps = await teamAppsRes.json();
                    applications.push(...teamApps);
                  }
                } catch (error) {
                  console.log('Error fetching team applications:', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('Error fetching applications:', error);
      }

      // If we still don't have applications, try one more approach using the user's connections
      if (applications.length === 0) {
        try {
          const connectionsRes = await fetch('https://discord.com/api/v10/users/@me/connections', {
            headers: { Authorization: `Bearer ${discordAccessToken}` }
          });
          
          if (connectionsRes.ok) {
            const connections = await connectionsRes.json();
            console.log('User connections:', connections.length);
            // Note: This won't directly give us applications, but might provide insight
          }
        } catch (error) {
          console.log('Error fetching connections:', error);
        }
      }

      const formattedBots = applications.map((app: any) => ({
        id: app.id,
        name: app.name,
        icon: app.icon,
        description: app.description || 'Discord bot application',
        public: app.bot_public !== false // Default to true if not specified
      }));

      console.log('Final bot applications found:', formattedBots.length);

      return new Response(JSON.stringify({
        servers: manageableServers,
        bots: formattedBots,
        debug: {
          user_id: discordUser.id,
          applications_found: applications.length,
          endpoints_tried: ['applications', 'oauth2/applications/@me', 'teams']
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action',
      code: 'INVALID_ACTION',
      details: 'Action must be either "fetch" or "import"'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  } catch (error: any) {
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
