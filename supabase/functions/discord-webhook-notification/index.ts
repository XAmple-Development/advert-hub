import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWebhookNotification(listing: any, eventType: string = 'new_listing') {
  if (!listing.discord_webhook_url) {
    console.log('No webhook URL configured for listing:', listing.id);
    return { success: false, reason: 'No webhook URL' };
  }

  const embed = createListingEmbed(listing, eventType);
  
  const payload = {
    embeds: [embed],
    username: "AdvertHub",
    avatar_url: "https://your-domain.com/logo.png" // Replace with your actual logo
  };

  try {
    const response = await fetch(listing.discord_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Webhook failed:', error);
      throw new Error(`Webhook error: ${response.status} - ${error}`);
    }

    console.log(`Successfully sent ${eventType} webhook for listing:`, listing.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending webhook:', error);
    throw error;
  }
}

function createListingEmbed(listing: any, eventType: string) {
  const eventEmojis = {
    new_listing: '🆕',
    listing_updated: '📝',
    listing_bumped: '🚀',
    listing_featured: '⭐'
  };

  const eventTitles = {
    new_listing: 'New Listing Added',
    listing_updated: 'Listing Updated',
    listing_bumped: 'Listing Bumped',
    listing_featured: 'Featured Listing'
  };

  return {
    title: `${eventEmojis[eventType]} ${eventTitles[eventType]}: ${listing.name}`,
    description: listing.description || 'No description provided',
    color: listing.featured ? 0xFFD700 : listing.type === 'server' ? 0x5865F2 : 0x57F287, // Gold for featured, Discord blue for servers, green for bots
    fields: [
      {
        name: '📊 Type',
        value: listing.type === 'server' ? '🖥️ Discord Server' : '🤖 Discord Bot',
        inline: true,
      },
      {
        name: '👥 Members',
        value: listing.member_count?.toString() || 'Unknown',
        inline: true,
      },
      {
        name: '🚀 Bumps',
        value: listing.bump_count?.toString() || '0',
        inline: true,
      },
      {
        name: '🔗 Invite',
        value: listing.invite_url ? `[Join Server](${listing.invite_url})` : 'No invite available',
        inline: false,
      }
    ],
    thumbnail: listing.avatar_url ? { url: listing.avatar_url } : undefined,
    timestamp: new Date().toISOString(),
    footer: {
      text: `AdvertHub • ID: ${listing.id}`,
      icon_url: "https://your-domain.com/favicon.ico" // Replace with your actual favicon
    },
    url: `https://your-domain.com/listings/${listing.id}` // Replace with your actual domain
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing_id, event_type = 'new_listing' } = await req.json();
    
    console.log(`Processing webhook notification for listing ${listing_id}, event: ${event_type}`);

    // Get the listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      console.error('Error fetching listing:', listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found' }), 
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Send webhook notification
    const result = await sendWebhookNotification(listing, event_type);

    return new Response(
      JSON.stringify(result), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});