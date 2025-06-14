
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
  owner?: boolean;
}

interface DiscordApplication {
  id: string;
  name: string;
  icon: string | null;
  description: string;
  bot_public: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Discord Import Function Started ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user's session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: userError.message,
          code: 'AUTH_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }
    
    if (!user) {
      console.error('No user found in session')
      return new Response(
        JSON.stringify({ 
          error: 'User not authenticated',
          details: 'No user session found',
          code: 'NO_USER'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // MASK and log user + session for debugging
    const mask = (obj) => {
      if (!obj) return obj;
      const clone = { ...obj }
      // Overwrite tokens if present
      Object.keys(clone).forEach(k => {
        if (k.includes('token')) clone[k] = clone[k] ? `***MASKED (${typeof clone[k]})***` : null;
      });
      return clone;
    };

    console.log('User object (masked):', JSON.stringify(mask(user), null, 2));
    console.log('User provider:', user.app_metadata?.provider);
    console.log('User providers:', user.app_metadata?.providers);
    console.log('Full user metadata:', JSON.stringify(mask(user.app_metadata), null, 2));

    // Check if user signed in with Discord
    const isDiscordUser = user.app_metadata?.provider === 'discord' || 
                         user.app_metadata?.providers?.includes('discord');
    
    if (!isDiscordUser) {
      console.error('User not signed in with Discord');
      return new Response(
        JSON.stringify({ 
          error: 'Discord authentication required',
          details: 'You must sign in with Discord to import servers and bots. Please sign out and sign back in using Discord.',
          code: 'NOT_DISCORD_USER'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get fresh session to access provider token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return new Response(
        JSON.stringify({ 
          error: 'Session error',
          details: sessionError.message,
          code: 'SESSION_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    if (!session) {
      console.error('No session found');
      return new Response(
        JSON.stringify({ 
          error: 'No session found',
          details: 'Please sign out and sign back in with Discord.',
          code: 'NO_SESSION'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // MASK and log session
    console.log('Session (masked):', JSON.stringify(mask(session), null, 2));
    console.log('Session provider token present:', !!session.provider_token);

    // Try to get Discord token (try all known places)
    let discordToken = session.provider_token;

    if (!discordToken) {
      console.warn('No session.provider_token; trying session.access_token');
      if (session.access_token && (user.app_metadata?.provider === 'discord' || user.app_metadata?.providers?.includes('discord'))) {
        // may be valid for Discord API
        discordToken = session.access_token;
      }
    }

    if (!discordToken && user.user_metadata?.provider_token) {
      console.warn('No token in session; trying user.user_metadata.provider_token');
      discordToken = user.user_metadata?.provider_token;
    }
    
    // LAST RESORT: output everything
    if (!discordToken) {
      console.error('No Discord token found after all attempts.');
      return new Response(
        JSON.stringify({ 
          error: 'Discord token not found',
          details: 'Discord access token not available. ' +
                   'Please try the following steps: ' +
                   '1. Sign out completely of all accounts. 2. Clear browser storage (localStorage/sessionStorage). 3. Sign in again using ONLY the Discord login button. 4. If using multiple Supabase projects in the past, ensure no old "supabase.auth.*" or "sb-" localStorage keys are leftover. 5. Check in a private/incognito window. ' +
                   'Make sure you always allow Discord OAuth permissions fully when prompted.',
          code: 'NO_DISCORD_TOKEN',
          debug: {
            hasSession: !!session,
            provider: user.app_metadata?.provider,
            providers: user.app_metadata?.providers,
            keysInSession: Object.keys(session),
            sessionSummary: {
              access_token: session.access_token ? 'present' : 'missing',
              provider_token: session.provider_token ? 'present' : 'missing',
              provider_refresh_token: session.provider_refresh_token ? 'present' : 'missing'
            },
            userMetadata: Object.keys(user.user_metadata || {}),
            appMetadata: Object.keys(user.app_metadata || {})
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Discord token found, length:', discordToken.length)

    const requestBody = await req.json()
    const { action } = requestBody
    console.log('Action requested:', action)

    if (action === 'fetch') {
      console.log('Fetching Discord data...')
      
      // Test the token first
      try {
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bearer ${discordToken}`,
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Discord user API response status:', userResponse.status)
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error('Discord user API error:', errorText)
          return new Response(
            JSON.stringify({ 
              error: 'Discord token is invalid or expired',
              details: `Discord API returned status ${userResponse.status}. Please sign out and sign back in with Discord to refresh your tokens.`,
              code: 'INVALID_DISCORD_TOKEN',
              status: userResponse.status,
              response: errorText
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
        
        const userData = await userResponse.json()
        console.log('Discord user verified:', userData.username)
      } catch (error) {
        console.error('Discord user verification failed:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to verify Discord authentication',
            details: error.message,
            code: 'DISCORD_VERIFICATION_FAILED'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }
      
      // Fetch user's Discord guilds
      try {
        const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${discordToken}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('Discord guilds response status:', guildsResponse.status)

        if (!guildsResponse.ok) {
          const errorText = await guildsResponse.text()
          console.error('Discord guilds API error:', errorText)
          
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch Discord servers',
              details: `Discord API returned status ${guildsResponse.status}: ${errorText}`,
              code: 'DISCORD_GUILDS_FAILED',
              status: guildsResponse.status
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const guilds: DiscordGuild[] = await guildsResponse.json()
        console.log('Found guilds:', guilds.length)

        // Filter guilds where user has manage permissions
        const manageableGuilds = guilds.filter(guild => {
          const permissions = BigInt(guild.permissions)
          const manageGuild = 0x20n // MANAGE_GUILD permission
          const administrator = 0x8n // ADMINISTRATOR permission
          return (permissions & (manageGuild | administrator)) !== 0n || guild.owner
        })

        console.log('Manageable guilds:', manageableGuilds.length)

        // Try to fetch applications (often fails for regular users)
        let applications: DiscordApplication[] = []
        
        try {
          const appsResponse = await fetch('https://discord.com/api/v10/applications', {
            headers: {
              'Authorization': `Bearer ${discordToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (appsResponse.ok) {
            applications = await appsResponse.json()
            console.log('Found applications:', applications.length)
          } else {
            console.log('Could not fetch applications (normal for most users):', appsResponse.status)
          }
        } catch (error) {
          console.log('Error fetching applications (non-critical):', error)
        }

        return new Response(
          JSON.stringify({
            servers: manageableGuilds.map(guild => ({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              permissions: guild.permissions,
              member_count: guild.approximate_member_count,
              owner: guild.owner
            })),
            bots: applications.map(app => ({
              id: app.id,
              name: app.name,
              icon: app.icon,
              description: app.description,
              public: app.bot_public
            }))
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } catch (error) {
        console.error('Unexpected error fetching guilds:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Unexpected error occurred',
            details: error.message,
            code: 'UNEXPECTED_ERROR'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }
    }

    if (action === 'import') {
      const { servers, bots } = await req.json()
      console.log('Importing servers:', servers?.length || 0, 'bots:', bots?.length || 0)

      const importedListings = []

      // Import selected servers
      if (servers && servers.length > 0) {
        for (const serverId of servers) {
          console.log('Importing server:', serverId)
          
          let guildData: any = {}
          try {
            const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}?with_counts=true`, {
              headers: {
                'Authorization': `Bearer ${discordToken}`,
                'Content-Type': 'application/json',
              },
            })

            if (guildResponse.ok) {
              guildData = await guildResponse.json()
              console.log('Guild data fetched for:', guildData.name)
            } else {
              console.log(`Could not fetch detailed info for guild ${serverId}:`, guildResponse.status)
            }
          } catch (error) {
            console.error('Error fetching guild details:', error)
          }

          // Create listing in database
          const { data: listing, error: listingError } = await supabaseClient
            .from('listings')
            .insert({
              user_id: user.id,
              type: 'server',
              name: guildData.name || `Server ${serverId}`,
              description: guildData.description || 'Imported from Discord',
              discord_id: serverId,
              member_count: guildData.approximate_member_count || 0,
              online_count: guildData.approximate_presence_count || 0,
              boost_level: guildData.premium_tier || 0,
              verification_level: guildData.verification_level?.toString(),
              nsfw: guildData.nsfw_level > 0,
              avatar_url: guildData.icon ? `https://cdn.discordapp.com/icons/${serverId}/${guildData.icon}.png` : null,
              banner_url: guildData.banner ? `https://cdn.discordapp.com/banners/${serverId}/${guildData.banner}.png` : null,
              status: 'active'
            })
            .select()
            .single()

          if (!listingError && listing) {
            importedListings.push(listing)
            console.log('Server listing created:', listing.id)
          } else {
            console.error('Error creating server listing:', listingError)
          }
        }
      }

      // Import selected bots
      if (bots && bots.length > 0) {
        for (const botId of bots) {
          console.log('Importing bot:', botId)
          
          let botData: any = {}
          try {
            const botResponse = await fetch(`https://discord.com/api/v10/applications/${botId}`, {
              headers: {
                'Authorization': `Bearer ${discordToken}`,
                'Content-Type': 'application/json',
              },
            })

            if (botResponse.ok) {
              botData = await botResponse.json()
              console.log('Bot data fetched for:', botData.name)
            } else {
              console.log(`Could not fetch detailed info for bot ${botId}:`, botResponse.status)
            }
          } catch (error) {
            console.error('Error fetching bot details:', error)
          }

          // Create listing in database
          const { data: listing, error: listingError } = await supabaseClient
            .from('listings')
            .insert({
              user_id: user.id,
              type: 'bot',
              name: botData.name || `Bot ${botId}`,
              description: botData.description || 'Imported Discord bot',
              discord_id: botId,
              avatar_url: botData.icon ? `https://cdn.discordapp.com/app-icons/${botId}/${botData.icon}.png` : null,
              status: 'active'
            })
            .select()
            .single()

          if (!listingError && listing) {
            importedListings.push(listing)
            console.log('Bot listing created:', listing.id)
          } else {
            console.error('Error creating bot listing:', listingError)
          }
        }
      }

      console.log('Import completed. Total imported:', importedListings.length)

      return new Response(
        JSON.stringify({ success: true, imported: importedListings.length }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Invalid action',
        details: `Action '${action}' is not supported`,
        code: 'INVALID_ACTION'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('Discord import function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        code: 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
