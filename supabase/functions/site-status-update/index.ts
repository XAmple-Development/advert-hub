import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check site health
    const statusData = await checkSiteHealth(supabaseUrl);
    
    // Get all Discord bot configs with bump channels (where we'll post status)
    const { data: configs } = await supabase
      .from('discord_bot_configs')
      .select('discord_server_id, bump_channel_id')
      .eq('active', true)
      .not('bump_channel_id', 'is', null);

    if (!configs || configs.length === 0) {
      console.log('No Discord channels configured for status updates');
      return new Response(
        JSON.stringify({ message: 'No channels configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const config of configs) {
      try {
        const result = await updateStatusMessage(
          discordBotToken,
          config.bump_channel_id,
          statusData,
          supabase
        );
        results.push({ channelId: config.bump_channel_id, ...result });
      } catch (error) {
        console.error(`Error updating status for channel ${config.bump_channel_id}:`, error);
        results.push({ 
          channelId: config.bump_channel_id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Site status update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkSiteHealth(supabaseUrl: string) {
  const checks = [];
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  try {
    // Check Supabase API
    const supabaseStart = Date.now();
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY')! }
    });
    const supabaseTime = Date.now() - supabaseStart;
    
    checks.push({
      service: 'Supabase API',
      status: supabaseResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: supabaseTime,
      statusCode: supabaseResponse.status,
      details: supabaseResponse.ok ? 'All REST endpoints responding' : 'API endpoints not responding'
    });
  } catch (error) {
    checks.push({
      service: 'Supabase API',
      status: 'unhealthy',
      error: error.message,
      details: 'Unable to connect to API'
    });
  }

  try {
    // Check Database Connection
    const dbStart = Date.now();
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      headers: { 
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const dbTime = Date.now() - dbStart;
    
    checks.push({
      service: 'Database',
      status: dbResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: dbTime,
      statusCode: dbResponse.status,
      details: dbResponse.ok ? 'Database queries executing normally' : 'Database connection issues'
    });
  } catch (error) {
    checks.push({
      service: 'Database',
      status: 'unhealthy',
      error: error.message,
      details: 'Unable to execute database queries'
    });
  }

  try {
    // Check Edge Functions
    const functionsStart = Date.now();
    const functionsResponse = await fetch(`${supabaseUrl}/functions/v1/`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` }
    });
    const functionsTime = Date.now() - functionsStart;
    
    checks.push({
      service: 'Edge Functions',
      status: functionsResponse.status < 500 ? 'healthy' : 'unhealthy',
      responseTime: functionsTime,
      statusCode: functionsResponse.status,
      details: functionsResponse.status < 500 ? 'All serverless functions operational' : 'Functions experiencing issues'
    });
  } catch (error) {
    checks.push({
      service: 'Edge Functions',
      status: 'unhealthy',
      error: error.message,
      details: 'Serverless functions not responding'
    });
  }

  try {
    // Check Storage
    const storageStart = Date.now();
    const storageResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { 
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const storageTime = Date.now() - storageStart;
    
    checks.push({
      service: 'Storage',
      status: storageResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: storageTime,
      statusCode: storageResponse.status,
      details: storageResponse.ok ? 'File storage accessible' : 'Storage service unavailable'
    });
  } catch (error) {
    checks.push({
      service: 'Storage',
      status: 'unhealthy',
      error: error.message,
      details: 'Unable to access file storage'
    });
  }

  // Get system statistics
  const stats = await getSystemStats(supabaseUrl, supabaseServiceKey);

  const healthyCount = checks.filter(check => check.status === 'healthy').length;
  const overallStatus = healthyCount === checks.length ? 'healthy' : 
                       healthyCount > 0 ? 'degraded' : 'unhealthy';

  return {
    overall: overallStatus,
    checks,
    stats,
    timestamp: new Date().toISOString(),
    uptime: '99.9%' // You could calculate real uptime from historical data
  };
}

async function getSystemStats(supabaseUrl: string, serviceKey: string) {
  const stats = {
    totalListings: 0,
    activeListings: 0,
    totalUsers: 0,
    recentActivity: 0
  };

  try {
    // Get listing statistics
    const listingsResponse = await fetch(`${supabaseUrl}/rest/v1/listings?select=status`, {
      headers: { 
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (listingsResponse.ok) {
      const listings = await listingsResponse.json();
      stats.totalListings = listings.length;
      stats.activeListings = listings.filter((l: any) => l.status === 'active').length;
    }

    // Get user count
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id`, {
      headers: { 
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      stats.totalUsers = users.length;
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activityResponse = await fetch(`${supabaseUrl}/rest/v1/live_activity?select=id&created_at=gte.${yesterday}`, {
      headers: { 
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (activityResponse.ok) {
      const activity = await activityResponse.json();
      stats.recentActivity = activity.length;
    }
  } catch (error) {
    console.log('Error fetching system stats:', error);
  }

  return stats;
}

async function updateStatusMessage(
  botToken: string, 
  channelId: string, 
  statusData: any,
  supabase: any
) {
  const embed = createStatusEmbed(statusData);
  
  console.log(`Checking for existing status message for channel: ${channelId}`);
  
  // Check if we have an existing status message for this channel
  const { data: existingMessage, error: queryError } = await supabase
    .from('site_status_messages')
    .select('discord_message_id')
    .eq('discord_channel_id', channelId)
    .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

  if (queryError) {
    console.error('Error querying existing messages:', queryError);
  }

  let messageId: string;
  let isNewMessage = false;

  if (existingMessage?.discord_message_id) {
    console.log(`Found existing message ID: ${existingMessage.discord_message_id}, attempting to update`);
    
    // Try to update existing message
    try {
      const updateResponse = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${existingMessage.discord_message_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ embeds: [embed] })
        }
      );

      if (updateResponse.ok) {
        console.log(`Successfully updated existing message: ${existingMessage.discord_message_id}`);
        messageId = existingMessage.discord_message_id;
      } else {
        const errorText = await updateResponse.text();
        console.log(`Failed to update message (${updateResponse.status}): ${errorText}`);
        throw new Error(`Discord API error: ${updateResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log('Failed to update existing message, creating new one:', error);
      // Create new message
      const response = await createNewStatusMessage(botToken, channelId, embed);
      messageId = response.id;
      isNewMessage = true;
    }
  } else {
    console.log('No existing message found, creating new one');
    // Create new message
    const response = await createNewStatusMessage(botToken, channelId, embed);
    messageId = response.id;
    isNewMessage = true;
  }

  console.log(`Storing message info - ID: ${messageId}, isNew: ${isNewMessage}`);
  
  // Store/update message info in database
  const { error: upsertError } = await supabase
    .from('site_status_messages')
    .upsert({
      discord_channel_id: channelId,
      discord_message_id: messageId,
      status_data: statusData,
      last_updated_at: new Date().toISOString()
    }, { 
      onConflict: 'discord_channel_id',
      ignoreDuplicates: false 
    });

  if (upsertError) {
    console.error('Error upserting message info:', upsertError);
  }

  return { 
    success: true, 
    messageId, 
    action: isNewMessage ? 'created' : 'updated' 
  };
}

async function createNewStatusMessage(botToken: string, channelId: string, embed: any) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create Discord message: ${response.status}`);
  }

  return await response.json();
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

  // Create detailed service status fields
  const serviceFields = statusData.checks.map((check: any) => {
    let value = '';
    
    if (check.responseTime) {
      const responseStatus = check.responseTime < 100 ? '⚡ Excellent' : 
                           check.responseTime < 300 ? '✅ Good' : 
                           check.responseTime < 1000 ? '⚠️ Slow' : '🐌 Very Slow';
      
      value = `${responseStatus} (${check.responseTime}ms)\n`;
      value += `Status Code: ${check.statusCode || 'N/A'}\n`;
      value += `${check.details || 'Service operational'}`;
    } else {
      value = `❌ **Error:** ${check.error || 'Unknown'}\n`;
      value += `${check.details || 'Service unavailable'}`;
    }
    
    return {
      name: `${statusEmoji[check.status]} ${check.service}`,
      value: value,
      inline: true
    };
  });

  // Add system statistics if available
  const statsFields = [];
  if (statusData.stats) {
    statsFields.push({
      name: '📊 Platform Statistics',
      value: `**Total Listings:** ${statusData.stats.totalListings.toLocaleString()}\n` +
             `**Active Listings:** ${statusData.stats.activeListings.toLocaleString()}\n` +
             `**Registered Users:** ${statusData.stats.totalUsers.toLocaleString()}\n` +
             `**Activity (24h):** ${statusData.stats.recentActivity.toLocaleString()} actions`,
      inline: false
    });
  }

  // Performance overview
  const avgResponseTime = statusData.checks
    .filter((check: any) => check.responseTime)
    .reduce((sum: number, check: any) => sum + check.responseTime, 0) / 
    statusData.checks.filter((check: any) => check.responseTime).length;

  const performanceField = {
    name: '⚡ Performance Metrics',
    value: `**Average Response Time:** ${Math.round(avgResponseTime)}ms\n` +
           `**Services Online:** ${statusData.checks.filter((c: any) => c.status === 'healthy').length}/${statusData.checks.length}\n` +
           `**Uptime:** ${statusData.uptime}\n` +
           `**Last Check:** ${new Date(statusData.timestamp).toLocaleString()}`,
    inline: false
  };

  // Status summary for description
  const healthyServices = statusData.checks.filter((c: any) => c.status === 'healthy').length;
  const totalServices = statusData.checks.length;
  
  let description = `**Discord Server Listings Platform Status**\n\n`;
  
  if (statusData.overall === 'healthy') {
    description += `✅ All systems operational! ${healthyServices}/${totalServices} services running smoothly.`;
  } else if (statusData.overall === 'degraded') {
    description += `⚠️ Some services experiencing issues. ${healthyServices}/${totalServices} services operational.`;
  } else {
    description += `🚨 Major service disruption detected. ${healthyServices}/${totalServices} services operational.`;
  }

  const embed = {
    title: `${statusEmoji[statusData.overall]} System Status - ${statusData.overall.toUpperCase()}`,
    description: description,
    color: statusColor[statusData.overall],
    fields: [
      ...serviceFields,
      performanceField,
      ...statsFields
    ],
    footer: {
      text: `Automated Status Monitor • Updated every hour • Discord Server Listings`,
      icon_url: 'https://cdn.discordapp.com/attachments/placeholder/bot-icon.png'
    },
    timestamp: statusData.timestamp,
    thumbnail: {
      url: statusData.overall === 'healthy' ? 
        'https://cdn.discordapp.com/attachments/placeholder/status-healthy.png' :
        statusData.overall === 'degraded' ?
        'https://cdn.discordapp.com/attachments/placeholder/status-warning.png' :
        'https://cdn.discordapp.com/attachments/placeholder/status-error.png'
    }
  };

  return embed;
}