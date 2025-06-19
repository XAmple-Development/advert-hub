
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import nacl from "https://esm.sh/tweetnacl@1.0.3";

// Environment variables
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp',
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

// Verify Discord request signature
function verifyDiscordRequest(req: Request, body: string): boolean {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");
    
    if (!signature || !timestamp) return false;

    const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(timestamp + body),
        hexToUint8Array(signature),
        hexToUint8Array(DISCORD_PUBLIC_KEY),
    );

    return isVerified;
}

function hexToUint8Array(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

// Check if user can bump (2 hour cooldown)
async function canBump(userId: string, listingId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .eq('listing_id', listingId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bump cooldown:', error);
        return false;
    }

    if (!data) return true;

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const diff = now.getTime() - lastBump.getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    
    return diff >= twoHoursInMs;
}

// Get time until next bump
async function getTimeUntilNextBump(userId: string, listingId: string): Promise<string> {
    const { data } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .eq('listing_id', listingId)
        .single();

    if (!data) return '0h 0m';

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const timeSinceLastBump = now.getTime() - lastBump.getTime();
    const timeLeft = twoHoursInMs - timeSinceLastBump;

    if (timeLeft <= 0) return '0h 0m';

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return `${hours}h ${minutes}m`;
}

// Handle bump command
async function handleBumpCommand(interaction: any) {
    console.log('Processing bump command:', interaction);
    
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const guildId = interaction.guild_id;
    
    if (!userId || !guildId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Unable to identify user or server.',
                flags: 64, // Ephemeral
            },
        };
    }

    try {
        // Find listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('discord_id', guildId)
            .eq('status', 'approved')
            .single();

        if (listingError || !listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No approved listing found for this server. Please create a listing first at our website.',
                    flags: 64,
                },
            };
        }

        // Check cooldown
        const canUserBump = await canBump(userId, listing.id);
        if (!canUserBump) {
            const timeLeft = await getTimeUntilNextBump(userId, listing.id);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `⏳ You can bump again in ${timeLeft}.`,
                    flags: 64,
                },
            };
        }

        const now = new Date();

        // Update cooldown
        await supabase
            .from('bump_cooldowns')
            .upsert({
                user_discord_id: userId,
                listing_id: listing.id,
                last_bump_at: now.toISOString(),
            });

        // Update listing
        await supabase
            .from('listings')
            .update({
                last_bumped_at: now.toISOString(),
                bump_count: (listing.bump_count || 0) + 1,
                updated_at: now.toISOString(),
            })
            .eq('id', listing.id);

        // Create bump record
        await supabase
            .from('bumps')
            .insert({
                listing_id: listing.id,
                user_id: userId,
                bump_type: 'discord',
                bumped_at: now.toISOString(),
            });

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🚀 Server Bumped!',
                    description: `**${listing.name}** has been bumped to the top of the list!\n\nNext bump available in 2 hours.`,
                    color: 0x00FF00,
                    timestamp: now.toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in bump command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while processing the bump command.',
                flags: 64,
            },
        };
    }
}

// Handle bumpstatus command
async function handleBumpStatusCommand(interaction: any) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const guildId = interaction.guild_id;
    
    if (!userId || !guildId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Unable to identify user or server.',
                flags: 64,
            },
        };
    }

    try {
        const { data: listing } = await supabase
            .from('listings')
            .select('id, name')
            .eq('discord_id', guildId)
            .eq('status', 'approved')
            .single();

        if (!listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No approved listing found for this server.',
                    flags: 64,
                },
            };
        }

        const canUserBump = await canBump(userId, listing.id);
        
        if (canUserBump) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '✅ You can bump now!',
                    flags: 64,
                },
            };
        }

        const timeLeft = await getTimeUntilNextBump(userId, listing.id);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `⏳ You can bump again in ${timeLeft}.`,
                flags: 64,
            },
        };
    } catch (error) {
        console.error('Error in bumpstatus command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while checking bump status.',
                flags: 64,
            },
        };
    }
}

// Handle search command
async function handleSearchCommand(interaction: any) {
    const query = interaction.data?.options?.[0]?.value;
    
    if (!query) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Please provide a search term.',
                flags: 64,
            },
        };
    }

    try {
        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, description, featured, member_count, created_at')
            .ilike('name', `%${query}%`)
            .eq('status', 'approved')
            .order('bump_count', { ascending: false })
            .limit(5);

        if (error || !listings || listings.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `🔍 No results found for "${query}".`,
                    flags: 64,
                },
            };
        }

        const fields = listings.map(listing => ({
            name: `${listing.name} ${listing.featured ? '✨ [Featured]' : ''}`,
            value: `${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}\n👥 ${listing.member_count || 0} members | Listed <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
            inline: false
        }));

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: `🔍 Search results for "${query}"`,
                    color: 0x0099ff,
                    fields: fields,
                    timestamp: new Date().toISOString(),
                }],
                flags: 64,
            },
        };
    } catch (error) {
        console.error('Error in search command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while searching.',
                flags: 64,
            },
        };
    }
}

// Handle leaderboard command
async function handleLeaderboardCommand(interaction: any) {
    const limit = Math.min(interaction.data?.options?.[0]?.value || 5, 10);
    
    try {
        const { data: listings, error } = await supabase
            .from('listings')
            .select('name, bump_count, last_bumped_at, featured')
            .eq('status', 'approved')
            .order('bump_count', { ascending: false })
            .order('last_bumped_at', { ascending: false })
            .limit(limit);

        if (error || !listings || listings.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '📊 No listings found.',
                    flags: 64,
                },
            };
        }

        const fields = listings.map((listing, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const lastBumped = listing.last_bumped_at ? `<t:${Math.floor(new Date(listing.last_bumped_at).getTime() / 1000)}:R>` : 'Never';
            
            return {
                name: `${medal} ${listing.name} ${listing.featured ? '✨' : ''}`,
                value: `🚀 ${listing.bump_count || 0} bumps | Last bumped: ${lastBumped}`,
                inline: false
            };
        });

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🏆 Top Servers by Bump Count',
                    color: 0xFFD700,
                    fields: fields,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in leaderboard command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while fetching leaderboard.',
                flags: 64,
            },
        };
    }
}

// Handle featured command
async function handleFeaturedCommand(interaction: any) {
    try {
        const { data: listings, error } = await supabase
            .from('listings')
            .select('name, description, member_count, created_at')
            .eq('featured', true)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !listings || listings.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '✨ No featured listings found.',
                    flags: 64,
                },
            };
        }

        const fields = listings.map(listing => ({
            name: `✨ ${listing.name}`,
            value: `${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}\n👥 ${listing.member_count || 0} members | Listed <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
            inline: false
        }));

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '✨ Featured Server Listings',
                    color: 0xFFD700,
                    fields: fields,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in featured command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while fetching featured listings.',
                flags: 64,
            },
        };
    }
}

// Handle stats command
async function handleStatsCommand(interaction: any) {
    const guildId = interaction.guild_id;
    
    if (!guildId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Unable to identify server.',
                flags: 64,
            },
        };
    }

    try {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('name, bump_count, view_count, join_count, last_bumped_at, created_at, featured')
            .eq('discord_id', guildId)
            .eq('status', 'approved')
            .single();

        if (error || !listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No approved listing found for this server. Create one on our website first!',
                    flags: 64,
                },
            };
        }

        const lastBumped = listing.last_bumped_at ? `<t:${Math.floor(new Date(listing.last_bumped_at).getTime() / 1000)}:R>` : 'Never';
        const created = `<t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:D>`;

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: `📊 Stats for ${listing.name}`,
                    color: listing.featured ? 0xFFD700 : 0x0099ff,
                    fields: [
                        { name: '🚀 Total Bumps', value: (listing.bump_count || 0).toString(), inline: true },
                        { name: '👀 Total Views', value: (listing.view_count || 0).toString(), inline: true },
                        { name: '🎯 Total Joins', value: (listing.join_count || 0).toString(), inline: true },
                        { name: '⏰ Last Bumped', value: lastBumped, inline: true },
                        { name: '📅 Listed Since', value: created, inline: true },
                        { name: '✨ Featured', value: listing.featured ? 'Yes' : 'No', inline: true },
                    ],
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in stats command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while fetching stats.',
                flags: 64,
            },
        };
    }
}

// Handle help command
async function handleHelpCommand(interaction: any) {
    return {
        type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🤖 Discord Bot Commands',
                description: 'Here are all the available commands:',
                color: 0x0099ff,
                fields: [
                    { name: '🚀 /bump', value: 'Bump your server listing to the top (2hr cooldown)', inline: false },
                    { name: '⏰ /bumpstatus', value: 'Check your bump cooldown status', inline: false },
                    { name: '🔍 /search <query>', value: 'Search for server listings by name', inline: false },
                    { name: '⚙️ /setup <channel>', value: 'Configure where new listings are posted (Admin only)', inline: false },
                    { name: '🏆 /leaderboard [limit]', value: 'Show top servers by bump count', inline: false },
                    { name: '📊 /stats', value: 'Show your server listing statistics', inline: false },
                    { name: '✨ /featured', value: 'Show featured server listings', inline: false },
                    { name: '❓ /help', value: 'Show this help message', inline: false },
                ],
                footer: { text: 'Bot created for Discord Server Listings' },
                timestamp: new Date().toISOString(),
            }],
            flags: 64,
        },
    };
}

// Handle setup command
async function handleSetupCommand(interaction: any) {
    console.log('Processing setup command:', interaction);
    
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const guildId = interaction.guild_id;
    const channelId = interaction.data?.options?.[0]?.value;
    
    if (!userId || !guildId || !channelId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Missing required information.',
                flags: 64,
            },
        };
    }

    try {
        // Save bot configuration
        await supabase
            .from('discord_bot_configs')
            .upsert({
                discord_server_id: guildId,
                listing_channel_id: channelId,
                admin_user_id: userId,
                active: true,
                updated_at: new Date().toISOString(),
            });

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '⚙️ Bot Configuration Updated',
                    description: `New listings will now be posted to <#${channelId}>`,
                    color: 0x00FF00,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in setup command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while setting up the bot.',
                flags: 64,
            },
        };
    }
}

// Main handler
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const rawBody = await req.text();
    
    // Verify request signature
    if (!verifyDiscordRequest(req, rawBody)) {
        return new Response("Invalid request signature", { status: 401 });
    }

    try {
        const body = JSON.parse(rawBody);
        console.log('Received Discord interaction:', body);

        // Handle ping
        if (body.type === INTERACTION_TYPES.PING) {
            return new Response(JSON.stringify({ type: INTERACTION_RESPONSE_TYPES.PONG }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Handle commands
        if (body.type === INTERACTION_TYPES.APPLICATION_COMMAND) {
            const { name } = body.data;

            let response;
            switch (name) {
                case 'bump':
                    response = await handleBumpCommand(body);
                    break;
                case 'bumpstatus':
                    response = await handleBumpStatusCommand(body);
                    break;
                case 'search':
                    response = await handleSearchCommand(body);
                    break;
                case 'stats':
                    response = await handleStatsCommand(body);
                    break;
                case 'leaderboard':
                    response = await handleLeaderboardCommand(body);
                    break;
                case 'featured':
                    response = await handleFeaturedCommand(body);
                    break;
                case 'help':
                    response = await handleHelpCommand(body);
                    break;
                case 'setup':
                    response = await handleSetupCommand(body);
                    break;
                default:
                    response = {
                        type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            content: 'Unknown command.',
                            flags: 64,
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
