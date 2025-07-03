import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkWebsiteStatus() {
  const checks = [];
  const supabaseUrl = SUPABASE_URL;
  
  try {
    // Check main website
    const websiteStart = Date.now();
    const websiteResponse = await fetch('https://aurrzqdypbshynbowpbs.lovable.app/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });
    const websiteTime = Date.now() - websiteStart;
    
    checks.push({
      service: 'Website',
      status: websiteResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: websiteTime,
      statusCode: websiteResponse.status
    });
  } catch (error) {
    checks.push({
      service: 'Website',
      status: 'unhealthy',
      error: error.message
    });
  }

  try {
    // Check Supabase API
    const supabaseStart = Date.now();
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY')! },
      signal: AbortSignal.timeout(10000)
    });
    const supabaseTime = Date.now() - supabaseStart;
    
    checks.push({
      service: 'Database API',
      status: supabaseResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: supabaseTime,
      statusCode: supabaseResponse.status
    });
  } catch (error) {
    checks.push({
      service: 'Database API',
      status: 'unhealthy',
      error: error.message
    });
  }

  try {
    // Check Edge Functions
    const functionsStart = Date.now();
    const functionsResponse = await fetch(`${supabaseUrl}/functions/v1/`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
      signal: AbortSignal.timeout(10000)
    });
    const functionsTime = Date.now() - functionsStart;
    
    checks.push({
      service: 'Edge Functions',
      status: functionsResponse.status < 500 ? 'healthy' : 'unhealthy',
      responseTime: functionsTime,
      statusCode: functionsResponse.status
    });
  } catch (error) {
    checks.push({
      service: 'Edge Functions',
      status: 'unhealthy',
      error: error.message
    });
  }

  const healthyCount = checks.filter(check => check.status === 'healthy').length;
  const overallStatus = healthyCount === checks.length ? 'healthy' : 
                       healthyCount > 0 ? 'degraded' : 'unhealthy';

  return {
    overall: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    healthyServices: healthyCount,
    totalServices: checks.length
  };
}

async function sendWebhookNotification(listing: any, eventType: string = 'new_listing') {
  if (!listing.discord_webhook_url) {
    console.log('No webhook URL configured for listing:', listing.id);
    return { success: false, reason: 'No webhook URL' };
  }

  // Get live website status
  const statusData = await checkWebsiteStatus();
  const embeds = [createListingEmbed(listing, eventType)];
  
  // Add status embed if this is a status update or if there are issues
  if (eventType === 'status_update' || statusData.overall !== 'healthy') {
    embeds.push(createStatusEmbed(statusData));
  }
  
  const payload = {
    embeds: embeds,
    username: "AdvertHub",
    avatar_url: "https://aurrzqdypbshynbowpbs.supabase.co/favicon.ico"
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
    return { success: true, statusData };
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
      icon_url: "https://aurrzqdypbshynbowpbs.supabase.co/favicon.ico"
    },
    url: `https://aurrzqdypbshynbowpbs.supabase.co/listings/${listing.id}`
  };
}

function createStatusEmbed(statusData: any) {
  const statusEmoji = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴'
  };

  const statusColor = {
    healthy: 0x00FF00,  // Green
    degraded: 0xFFFF00, // Yellow
    unhealthy: 0xFF0000 // Red
  };

  const statusFields = statusData.checks.map((check: any) => ({
    name: `${statusEmoji[check.status]} ${check.service}`,
    value: check.responseTime 
      ? `Response: ${check.responseTime}ms\nStatus: ${check.statusCode || 'N/A'}`
      : `Error: ${check.error || 'Unknown'}`,
    inline: true
  }));

  return {
    title: `${statusEmoji[statusData.overall]} Live Website Status - ${statusData.overall.toUpperCase()}`,
    description: `System health check: ${statusData.healthyServices}/${statusData.totalServices} services operational`,
    color: statusColor[statusData.overall],
    fields: statusFields,
    footer: {
      text: `Last checked: ${new Date(statusData.timestamp).toLocaleString()} | AdvertHub Monitoring`,
      icon_url: "https://aurrzqdypbshynbowpbs.supabase.co/favicon.ico"
    },
    timestamp: statusData.timestamp
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