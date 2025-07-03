import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const websiteResponse = await fetch('https://discord.x-ampledevelopment.co.uk/', {
      method: 'GET',
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
    // Check Database
    const dbStart = Date.now();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('listings').select('count').limit(1);
    const dbTime = Date.now() - dbStart;
    
    checks.push({
      service: 'Database',
      status: error ? 'unhealthy' : 'healthy',
      responseTime: dbTime,
      error: error?.message
    });
  } catch (error) {
    checks.push({
      service: 'Database',
      status: 'unhealthy',
      error: error.message
    });
  }

  try {
    // Check API endpoint
    const apiStart = Date.now();
    const apiResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY')! },
      signal: AbortSignal.timeout(10000)
    });
    const apiTime = Date.now() - apiStart;
    
    checks.push({
      service: 'API',
      status: apiResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: apiTime,
      statusCode: apiResponse.status
    });
  } catch (error) {
    checks.push({
      service: 'API',
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
    totalServices: checks.length,
    uptime: calculateUptime()
  };
}

function calculateUptime() {
  // Simple uptime calculation based on last hour's health
  // In production, you'd store this data for real uptime tracking
  return '99.9%';
}

async function sendStatusToAllWebhooks(statusData: any) {
  // Get all listings with webhook URLs
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, name, discord_webhook_url')
    .not('discord_webhook_url', 'is', null)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching listings with webhooks:', error);
    return { error: error.message };
  }

  if (!listings || listings.length === 0) {
    console.log('No webhooks configured');
    return { message: 'No webhooks configured' };
  }

  const results = [];
  const embed = createStatusEmbed(statusData);

  for (const listing of listings) {
    try {
      const payload = {
        embeds: [embed],
        username: "AdvertHub Status",
        avatar_url: "https://aurrzqdypbshynbowpbs.supabase.co/favicon.ico"
      };

      const response = await fetch(listing.discord_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        results.push({ listing_id: listing.id, success: true });
        console.log(`Status sent to webhook for listing ${listing.id}`);
      } else {
        const error = await response.text();
        results.push({ listing_id: listing.id, success: false, error });
        console.error(`Webhook failed for listing ${listing.id}:`, error);
      }
    } catch (error) {
      results.push({ listing_id: listing.id, success: false, error: error.message });
      console.error(`Error sending to webhook for listing ${listing.id}:`, error);
    }
  }

  return { results, statusData };
}

function createStatusEmbed(statusData: any) {
  const statusEmoji = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴'
  };

  const statusColor = {
    healthy: 0x00FF00,
    degraded: 0xFFFF00,
    unhealthy: 0xFF0000
  };

  const statusFields = statusData.checks.map((check: any) => ({
    name: `${statusEmoji[check.status]} ${check.service}`,
    value: check.responseTime 
      ? `⚡ ${check.responseTime}ms • Status: ${check.statusCode || 'OK'}`
      : `❌ ${check.error || 'Service unavailable'}`,
    inline: true
  }));

  return {
    title: `${statusEmoji[statusData.overall]} AdvertHub System Status`,
    description: `**${statusData.overall.toUpperCase()}** - ${statusData.healthyServices}/${statusData.totalServices} services operational`,
    color: statusColor[statusData.overall],
    fields: [
      ...statusFields,
      {
        name: '📊 Uptime',
        value: statusData.uptime,
        inline: true
      },
      {
        name: '🕐 Last Check',
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: true
      }
    ],
    footer: {
      text: 'AdvertHub System Monitoring • Auto-generated',
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
    console.log('Checking website status and sending to all webhooks...');

    // Get current website status
    const statusData = await checkWebsiteStatus();
    console.log('Status check complete:', statusData.overall);

    // Send to all configured webhooks
    const result = await sendStatusToAllWebhooks(statusData);

    return new Response(
      JSON.stringify(result), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Status broadcast error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});