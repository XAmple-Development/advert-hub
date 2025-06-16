
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Discord interaction types
const INTERACTION_TYPES = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};

const INTERACTION_RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
};

async function handleBumpCommand(interaction: any) {
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const guildId = interaction.guild_id;
  
  console.log('Handling bump command for user:', userId, 'in guild:', guildId);

  // Check if server has any listings
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*')
    .eq('discord_id', guildId)
    .eq('status', 'active');

  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    return {
      type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Error checking server listings. Please try again.',
        flags: 64, // ephemeral
      },
    };
  }

  if (!listings || listings.length === 0) {
    return {
      type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'This server has no active listings on our website. Create a listing first at our website!',
        flags: 64, // ephemeral
      },
    };
  }

  // Check cooldown (1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  for (const listing of listings) {
    const { data: cooldown } = await supabase
      .from('bump_cooldowns')
      .select('*')
      .eq('user_discord_id', userId)
      .eq('listing_id', listing.id)
      .gte('last_bump_at', oneHourAgo)
      .single();

    if (cooldown) {
      const nextBump = new Date(new Date(cooldown.last_bump_at).getTime() + 60 * 60 * 1000);
      return {
        type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You can bump **${listing.name}** again <t:${Math.floor(nextBump.getTime() / 1000)}:R>`,
          flags: 64, // ephemeral
        },
      };
    }
  }

  // Perform the bump for all server listings
  for (const listing of listings) {
    // Insert bump record
    await supabase.from('bumps').insert({
      listing_id: listing.id,
      user_id: listing.user_id,
      bump_type: 'discord'
    });

    // Update or insert cooldown
    await supabase.from('bump_cooldowns').upsert({
      user_discord_id: userId,
      listing_id: listing.id,
      last_bump_at: new Date().toISOString(),
    });
  }

  const listingNames = listings.map(l => `**${l.name}**`).join(', ');
  
  return {
    type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🚀 Successfully bumped ${listingNames}! Your listing${listings.length > 1 ? 's have' : ' has'} been moved to the top of the list.`,
    },
  };
}

async function handleSetupCommand(interaction: any) {
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const guildId = interaction.guild_id;
  const channelId = interaction.options?.[0]?.value;

  console.log('Handling setup command for user:', userId, 'in guild:', guildId, 'channel:', channelId);

  // Check if user has permission (server admin or listing owner)
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('discord_id', guildId);

  if (!listings || listings.length === 0) {
    return {
      type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'This server has no listings on our website. Create a listing first!',
        flags: 64, // ephemeral
      },
    };
  }

  // Update or create bot config
  const { error } = await supabase.from('discord_bot_configs').upsert({
    discord_server_id: guildId,
    listing_channel_id: channelId,
    admin_user_id: userId,
    active: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error updating bot config:', error);
    return {
      type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Error setting up the bot. Please try again.',
        flags: 64, // ephemeral
      },
    };
  }

  return {
    type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `✅ Bot setup complete! New listings will be posted to <#${channelId}>`,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received Discord interaction:', body);

    // Handle Discord ping
    if (body.type === INTERACTION_TYPES.PING) {
      return new Response(JSON.stringify({ type: INTERACTION_RESPONSE_TYPES.PONG }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle slash commands
    if (body.type === INTERACTION_TYPES.APPLICATION_COMMAND) {
      const { name } = body.data;
      
      let response;
      if (name === 'bump') {
        response = await handleBumpCommand(body);
      } else if (name === 'setup') {
        response = await handleSetupCommand(body);
      } else {
        response = {
          type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Unknown command.',
            flags: 64, // ephemeral
          },
        };
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Invalid interaction type', { status: 400 });
  } catch (error) {
    console.error('Discord bot error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
