import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.38.0';

// Environment variables
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingNotificationRequest {
    listingId: string;
}

// Post new listing notification to Discord channels
async function postListingToDiscordChannels(listing: any) {
    try {
        console.log(`Posting new listing notification for ${listing.id} (${listing.name})`);
        
        if (!DISCORD_BOT_TOKEN) {
            console.error('Discord bot token not configured');
            return;
        }

        // Get all configured Discord servers that should receive new listing notifications
        const { data: configs, error } = await supabase
            .from('discord_bot_configs')
            .select('discord_server_id, listing_channel_id')
            .eq('active', true)
            .not('listing_channel_id', 'is', null);

        if (error) {
            console.error('Error fetching Discord configs:', error);
            return;
        }

        if (!configs || configs.length === 0) {
            console.log('No listing channels configured');
            return;
        }

        // Create embed for new listing notification
        const embed = {
            title: `✨ New ${listing.type === 'server' ? 'Server' : 'Bot'} Listed!`,
            description: `**${listing.name}** has been added to our listings!\n\n${listing.description}`,
            color: listing.premium_featured ? 0xFFD700 : 0x0099ff,
            fields: [
                {
                    name: '👥 Members',
                    value: (listing.member_count || 0).toString(),
                    inline: true
                },
                {
                    name: '📊 Type',
                    value: listing.type === 'server' ? 'Discord Server' : 'Discord Bot',
                    inline: true
                },
                {
                    name: '🏷️ Status',
                    value: listing.premium_featured ? '✨ Premium Featured' : '🆕 New Listing',
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Discord Server Listings'
            }
        };

        if (listing.avatar_url) {
            embed.thumbnail = { url: listing.avatar_url };
        }

        // Add invite button if available
        const components = listing.invite_url ? [{
            type: 1, // Action Row
            components: [{
                type: 2, // Button
                style: 5, // Link
                label: `Join ${listing.type === 'server' ? 'Server' : 'Bot'}`,
                url: listing.invite_url
            }]
        }] : [];

        // Post to each configured channel
        for (const config of configs) {
            try {
                console.log(`Posting to channel ${config.listing_channel_id} in server ${config.discord_server_id}`);
                
                const response = await fetch(`https://discord.com/api/v10/channels/${config.listing_channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        embeds: [embed],
                        components: components
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to post to channel ${config.listing_channel_id}:`, response.status, errorText);
                } else {
                    console.log(`Successfully posted new listing notification to channel ${config.listing_channel_id}`);
                }
            } catch (channelError) {
                console.error(`Error posting to channel ${config.listing_channel_id}:`, channelError);
            }
        }
    } catch (error) {
        console.error('Error in postListingToDiscordChannels:', error);
    }
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body: ListingNotificationRequest = await req.json();
        const { listingId } = body;

        if (!listingId) {
            return new Response(
                JSON.stringify({ error: 'Missing listing ID' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`Processing new listing notification for ${listingId}`);

        // Get the listing details
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            console.error('Listing not found:', listingError);
            return new Response(
                JSON.stringify({ error: 'Listing not found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Post new listing notification to Discord channels
        await postListingToDiscordChannels(listing);

        return new Response(
            JSON.stringify({ success: true, message: 'New listing notification sent' }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('Error in discord-listing-notification:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});