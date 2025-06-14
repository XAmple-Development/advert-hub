
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
    console.log('=== Discord Import Function Called ===')
    
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
    if (userError || !user) {
      console.error('Auth error:', userError)
      throw new Error('User not authenticated')
    }

    console.log('User authenticated:', user.id)
    console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2))
    console.log('App metadata:', JSON.stringify(user.app_metadata, null, 2))

    // Enhanced token detection - try multiple approaches
    let discordToken = null;
    
    // Method 1: Check user metadata
    discordToken = user.user_metadata?.provider_token || 
                  user.user_metadata?.access_token ||
                  user.app_metadata?.provider_token ||
                  user.app_metadata?.provider_access_token;

    console.log('Token from metadata:', !!discordToken)

    // Method 2: Get fresh session
    if (!discordToken) {
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
      console.log('Session error:', sessionError)
      console.log('Session data:', session ? 'exists' : 'null')
      
      if (session) {
        discordToken = session.provider_token || 
                      session.access_token ||
                      (session as any).provider_access_token;
        console.log('Token from session:', !!discordToken)
      }
    }

    // Method 3: Try to refresh the session to get fresh tokens
    if (!discordToken) {
      console.log('Attempting to refresh session...')
      const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession()
      console.log('Refresh error:', refreshError)
      
      if (refreshData?.session) {
        discordToken = refreshData.session.provider_token ||
                      refreshData.session.access_token ||
                      (refreshData.session as any).provider_access_token;
        console.log('Token from refresh:', !!discordToken)
      }
    }

    if (!discordToken) {
      console.error('No Discord token found after all attempts')
      throw new Error('Discord access token not found. Please sign out and sign back in with Discord to refresh your authentication. Make sure you\'re using Discord OAuth login.')
    }

    const { action } = await req.json()
    console.log('Action requested:', action)

    if (action === 'fetch') {
      console.log('Fetching Discord guilds with token length:', discordToken.length)
      
      // Test the token first with a simple user info call
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
          throw new Error(`Discord token is invalid. Status: ${userResponse.status}. Please sign out and sign back in with Discord.`)
        }
        
        const userData = await userResponse.json()
        console.log('Discord user verified:', userData.username)
      } catch (error) {
        console.error('Discord user verification failed:', error)
        throw new Error('Failed to verify Discord authentication. Please sign out and sign back in with Discord.')
      }
      
      // Fetch user's Discord guilds
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
        
        if (guildsResponse.status === 401) {
          throw new Error('Discord authentication expired. Please sign out and sign back in with Discord.')
        }
        
        throw new Error(`Failed to fetch Discord servers: ${guildsResponse.status} ${errorText}`)
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

      // Try to fetch applications (this often fails for regular users)
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
          console.log('Could not fetch applications (this is normal for most users):', appsResponse.status)
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

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Discord import error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
