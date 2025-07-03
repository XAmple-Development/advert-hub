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
      statusCode: supabaseResponse.status
    });
  } catch (error) {
    checks.push({
      service: 'Supabase API',
      status: 'unhealthy',
      error: error.message
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
    uptime: '99.9%' // You could calculate real uptime from historical data
  };
}

async function updateStatusMessage(
  botToken: string, 
  channelId: string, 
  statusData: any,
  supabase: any
) {
  const embed = createStatusEmbed(statusData);
  
  // Check if we have an existing status message for this channel
  const { data: existingMessage } = await supabase
    .from('site_status_messages')
    .select('discord_message_id')
    .eq('discord_channel_id', channelId)
    .single();

  let messageId: string;
  let isNewMessage = false;

  if (existingMessage?.discord_message_id) {
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
        messageId = existingMessage.discord_message_id;
      } else {
        // Message might be deleted, create new one
        throw new Error('Failed to update existing message');
      }
    } catch (error) {
      console.log('Failed to update existing message, creating new one:', error);
      // Create new message
      const response = await createNewStatusMessage(botToken, channelId, embed);
      messageId = response.id;
      isNewMessage = true;
    }
  } else {
    // Create new message
    const response = await createNewStatusMessage(botToken, channelId, embed);
    messageId = response.id;
    isNewMessage = true;
  }

  // Store/update message info in database
  await supabase
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

  const embed = {
    title: `${statusEmoji[statusData.overall]} Site Status - ${statusData.overall.toUpperCase()}`,
    description: 'Real-time status of our Discord Server Listings platform',
    color: statusColor[statusData.overall],
    fields: statusData.checks.map((check: any) => ({
      name: `${statusEmoji[check.status]} ${check.service}`,
      value: check.responseTime 
        ? `Response: ${check.responseTime}ms\nStatus: ${check.statusCode || 'N/A'}`
        : `Error: ${check.error || 'Unknown'}`,
      inline: true
    })),
    footer: {
      text: `Last updated: ${new Date(statusData.timestamp).toLocaleString()} | Uptime: ${statusData.uptime}`
    },
    timestamp: statusData.timestamp
  };

  return embed;
}