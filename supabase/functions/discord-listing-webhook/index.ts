
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

async function postToDiscord(listing: any, botConfig: any) {
  const embed = {
    title: `New ${listing.type === 'server' ? 'Server' : 'Bot'} Listed: ${listing.name}`,
    description: listing.description,
    color: listing.type === 'server' ? 0x5865F2 : 0x57F287, // Discord blue for servers, green for bots
    fields: [
      {
        name: 'Type',
        value: listing.type === 'server' ? '🖥️ Discord Server' : '🤖 Discord Bot',
        inline: true,
      },
      {
        name: 'Members',
        value: listing.member_count?.toString() || 'Unknown',
        inline: true,
      },
      {
        name: 'Join',
        value: listing.invite_url ? `[Click here](${listing.invite_url})` : 'No invite available',
        inline: true,
      },
    ],
    thumbnail: listing.avatar_url ? { url: listing.avatar_url } : undefined,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'AdvertHub',
    },
  };

  const payload = {
    embeds: [embed],
  };

  const response = await fetch(`https://discord.com/api/v10/channels/${botConfig.listing_channel_id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to post to Discord:', error);
    throw new Error(`Discord API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing_id } = await req.json();
    
    console.log('Processing Discord webhook for listing:', listing_id);

    // Get the listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      console.error('Error fetching listing:', listingError);
      return new Response('Listing not found', { status: 404 });
    }

    // Get bot configuration for this Discord server
    const { data: botConfig, error: configError } = await supabase
      .from('discord_bot_configs')
      .select('*')
      .eq('discord_server_id', listing.discord_id)
      .eq('active', true)
      .single();

    if (configError || !botConfig || !botConfig.listing_channel_id) {
      console.log('No active bot configuration found for server:', listing.discord_id);
      return new Response('No bot configuration found', { status: 200 }); // Not an error, just no config
    }

    // Post to Discord
    await postToDiscord(listing, botConfig);

    console.log('Successfully posted listing to Discord channel');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
