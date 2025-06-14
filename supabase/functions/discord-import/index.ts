
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
      throw new Error('User not authenticated')
    }

    // Get Discord access token from user metadata or session
    const discordToken = user.user_metadata?.provider_token
    if (!discordToken) {
      throw new Error('Discord access token not found. Please re-authenticate with Discord.')
    }

    const { action } = await req.json()

    if (action === 'fetch') {
      // Fetch user's Discord guilds
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!guildsResponse.ok) {
        throw new Error('Failed to fetch Discord servers')
      }

      const guilds: DiscordGuild[] = await guildsResponse.json()

      // Filter guilds where user has manage permissions (permission bit 32)
      const manageableGuilds = guilds.filter(guild => {
        const permissions = BigInt(guild.permissions)
        const manageGuild = 0x20n // MANAGE_GUILD permission
        const administrator = 0x8n // ADMINISTRATOR permission
        return (permissions & (manageGuild | administrator)) !== 0n || guild.owner
      })

      // Fetch user's Discord applications (bots)
      const appsResponse = await fetch('https://discord.com/api/v10/applications', {
        headers: {
          'Authorization': `Bearer ${discordToken}`,
          'Content-Type': 'application/json',
        },
      })

      let applications: DiscordApplication[] = []
      if (appsResponse.ok) {
        applications = await appsResponse.json()
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

      const importedListings = []

      // Import selected servers
      for (const serverId of servers) {
        // Get detailed server info
        const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}?with_counts=true`, {
          headers: {
            'Authorization': `Bot ${discordToken}`, // Note: This might need a bot token instead
            'Content-Type': 'application/json',
          },
        })

        let guildData: any = {}
        if (guildResponse.ok) {
          guildData = await guildResponse.json()
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
        }
      }

      // Import selected bots
      for (const botId of bots) {
        // Get detailed bot info
        const botResponse = await fetch(`https://discord.com/api/v10/applications/${botId}`, {
          headers: {
            'Authorization': `Bearer ${discordToken}`,
            'Content-Type': 'application/json',
          },
        })

        let botData: any = {}
        if (botResponse.ok) {
          botData = await botResponse.json()
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
        }
      }

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
