
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.38.0';
import nacl from "https://cdn.skypack.dev/tweetnacl@1.0.3";

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

const FREE_BUMP_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours for free users
const PREMIUM_BUMP_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours for premium users

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

// Check if user can bump with subscription-aware cooldown
async function canBump(userId: string, listingId: string): Promise<boolean> {
    console.log(`Checking bump cooldown for user ${userId} and listing ${listingId}`);
    
    // Get listing to find the user
    const { data: listing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

    if (!listing) {
        console.log('Listing not found');
        return false;
    }

    // Get user's subscription tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', listing.user_id)
        .single();

    const isPremium = profile?.subscription_tier === 'premium';
    const cooldownMs = isPremium ? PREMIUM_BUMP_COOLDOWN_MS : FREE_BUMP_COOLDOWN_MS;
    
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

    if (!data) {
        console.log('No previous bump found, user can bump');
        return true;
    }

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastBump.getTime();
    
    console.log(`Last bump: ${lastBump.toISOString()}, Now: ${now.toISOString()}, Time diff: ${timeDiff}ms, Required: ${cooldownMs}ms (${isPremium ? 'premium' : 'free'} user)`);
    
    const canBumpNow = timeDiff >= cooldownMs;
    console.log(`Can bump: ${canBumpNow}`);
    
    return canBumpNow;
}

// Get time until next bump with subscription-aware cooldown
async function getTimeUntilNextBump(userId: string, listingId: string): Promise<string> {
    // Get listing to find the user
    const { data: listing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

    if (!listing) return '0h 0m';

    // Get user's subscription tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', listing.user_id)
        .single();

    const isPremium = profile?.subscription_tier === 'premium';
    const cooldownMs = isPremium ? PREMIUM_BUMP_COOLDOWN_MS : FREE_BUMP_COOLDOWN_MS;

    const { data } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .eq('listing_id', listingId)
        .single();

    if (!data) return '0h 0m';

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastBump.getTime();
    const timeLeft = cooldownMs - timeDiff;

    if (timeLeft <= 0) return '0h 0m';

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return `${hours}h ${minutes}m`;
}

// Post bump notification to Discord channels
async function postBumpToDiscordChannels(listing: any, bumpType: string) {
    try {
        console.log(`Posting bump notification for listing ${listing.id} (${listing.name})`);
        
        // Get all configured Discord servers that should receive bump notifications
        const { data: configs, error } = await supabase
            .from('discord_bot_configs')
            .select('discord_server_id, bump_channel_id')
            .eq('active', true)
            .not('bump_channel_id', 'is', null);

        if (error) {
            console.error('Error fetching Discord configs:', error);
            return;
        }

        if (!configs || configs.length === 0) {
            console.log('No bump channels configured');
            return;
        }

        // Create embed for bump notification
        const embed = {
            title: `🚀 ${listing.type === 'server' ? 'Server' : 'Bot'} Bumped!`,
            description: `**${listing.name}** has been bumped to the top!\n\n${listing.description}`,
            color: listing.premium_featured ? 0xFFD700 : 0x00FF00,
            fields: [
                {
                    name: '👥 Members',
                    value: (listing.member_count || 0).toString(),
                    inline: true
                },
                {
                    name: '🚀 Total Bumps',
                    value: (listing.bump_count || 0).toString(),
                    inline: true
                },
                {
                    name: '📊 Bump Source',
                    value: bumpType === 'discord' ? 'Discord Bot' : 'Website',
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

        // Post to each configured channel
        for (const config of configs) {
            try {
                console.log(`Posting to channel ${config.bump_channel_id} in server ${config.discord_server_id}`);
                
                const response = await fetch(`https://discord.com/api/v10/channels/${config.bump_channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        embeds: [embed]
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to post to channel ${config.bump_channel_id}:`, response.status, errorText);
                } else {
                    console.log(`Successfully posted bump notification to channel ${config.bump_channel_id}`);
                }
            } catch (channelError) {
                console.error(`Error posting to channel ${config.bump_channel_id}:`, channelError);
            }
        }
    } catch (error) {
        console.error('Error in postBumpToDiscordChannels:', error);
    }
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

    console.log(`Bump command from user ${userId} in guild ${guildId}`);

    try {
        // Find listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('discord_id', guildId)
            .eq('status', 'active')
            .single();

        if (listingError || !listing) {
            console.log('No active listing found for guild:', guildId);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No active listing found for this server. Please create a listing first at our website.',
                    flags: 64,
                },
            };
        }

        console.log(`Found listing: ${listing.name} (${listing.id})`);

        // Check cooldown
        const canUserBump = await canBump(userId, listing.id);
        if (!canUserBump) {
            const timeLeft = await getTimeUntilNextBump(userId, listing.id);
            console.log(`User cannot bump, ${timeLeft} remaining`);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `⏳ You must wait ${timeLeft} before bumping again.`,
                    flags: 64,
                },
            };
        }

        const now = new Date();

        // Update cooldown with proper conflict resolution
        const { error: cooldownError } = await supabase
            .from('bump_cooldowns')
            .upsert({
                user_discord_id: userId,
                listing_id: listing.id,
                last_bump_at: now.toISOString(),
            }, {
                onConflict: 'user_discord_id,listing_id',
                ignoreDuplicates: false
            });

        if (cooldownError) {
            console.error('Error updating cooldown:', cooldownError);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ Error updating cooldown.',
                    flags: 64,
                },
            };
        }

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

        console.log(`Bump successful for listing ${listing.id}`);

        // Post bump notification to configured channels
        await postBumpToDiscordChannels(listing, 'discord');

        // Get user's subscription tier for success message
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', listing.user_id)
            .single();

        const isPremium = profile?.subscription_tier === 'premium';
        const nextBumpHours = isPremium ? 2 : 6;

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🚀 Server Bumped!',
                    description: `**${listing.name}** has been bumped to the top of the list!\n\nNext bump available in ${nextBumpHours} hours.`,
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
            .eq('status', 'active')
            .single();

        if (!listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No active listing found for this server.',
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
                content: `⏳ You must wait ${timeLeft} before bumping again.`,
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
            .eq('status', 'active')
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
            .eq('status', 'active')
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
            .eq('status', 'active')
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
            .eq('status', 'active')
            .single();

        if (error || !listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No active listing found for this server. Create one on our website first!',
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
                    { name: '🚀 /bump', value: 'Bump your server listing to the top (6hr free, 2hr premium)', inline: false },
                    { name: '⏰ /bumpstatus', value: 'Check your bump cooldown status', inline: false },
                    { name: '🔍 /search <query>', value: 'Search for server listings by name', inline: false },
                    { name: '⚙️ /setup <channel>', value: 'Configure where new listings are posted (Admin only)', inline: false },
                    { name: '📢 /setbumpchannel <channel>', value: 'Set channel for bump notifications (Admin only)', inline: false },
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

// Handle setbumpchannel command
async function handleSetBumpChannelCommand(interaction: any) {
    console.log('Processing setbumpchannel command:', interaction);
    
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
        // Check if user has permission (admin or manage channels)
        // For now, we'll trust Discord's permission system
        
        // Update or create bot configuration for bump channel
        const { data: existingConfig } = await supabase
            .from('discord_bot_configs')
            .select('*')
            .eq('discord_server_id', guildId)
            .single();

        if (existingConfig) {
            // Update existing configuration
            await supabase
                .from('discord_bot_configs')
                .update({
                    bump_channel_id: channelId,
                    updated_at: new Date().toISOString(),
                })
                .eq('discord_server_id', guildId);
        } else {
            // Create new configuration
            await supabase
                .from('discord_bot_configs')
                .insert({
                    discord_server_id: guildId,
                    bump_channel_id: channelId,
                    admin_user_id: userId,
                    active: true,
                    updated_at: new Date().toISOString(),
                });
        }

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '📢 Bump Channel Set',
                    description: `Bump notifications will now be posted to <#${channelId}>\n\nWhenever a server/bot is bumped on our website or via the bot, it will be announced in this channel.`,
                    color: 0x00FF00,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in setbumpchannel command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while setting up the bump channel.',
                flags: 64,
            },
        };
    }
}

// Handle trending command
async function handleTrendingCommand(interaction: any) {
    const typeFilter = interaction.data?.options?.[0]?.value || 'all';
    
    try {
        let query = supabase
            .from('trending_metrics')
            .select(`
                listing_id,
                trending_score,
                listings!inner(id, name, description, type, member_count, featured, created_at)
            `)
            .order('trending_score', { ascending: false })
            .limit(5);

        if (typeFilter !== 'all') {
            query = query.eq('listings.type', typeFilter);
        }

        const { data: trending, error } = await query;

        if (error || !trending || trending.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '📈 No trending listings found.',
                    flags: 64,
                },
            };
        }

        const fields = trending.map((item, index) => {
            const listing = item.listings;
            const emoji = index === 0 ? '🔥' : index === 1 ? '📈' : '⭐';
            
            return {
                name: `${emoji} ${listing.name} ${listing.featured ? '✨' : ''}`,
                value: `${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}\n👥 ${listing.member_count || 0} members | Trending Score: ${Math.round(item.trending_score)}`,
                inline: false
            };
        });

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: `📈 Trending ${typeFilter === 'all' ? 'Listings' : typeFilter === 'server' ? 'Servers' : 'Bots'}`,
                    color: 0xFF6B35,
                    fields: fields,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in trending command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while fetching trending listings.',
                flags: 64,
            },
        };
    }
}

// Handle random command
async function handleRandomCommand(interaction: any) {
    const typeFilter = interaction.data?.options?.[0]?.value;
    
    try {
        let query = supabase
            .from('listings')
            .select('name, description, type, member_count, featured, created_at, avatar_url')
            .eq('status', 'active');

        if (typeFilter) {
            query = query.eq('type', typeFilter);
        }

        const { data: listings, error } = await query;

        if (error || !listings || listings.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '🎲 No listings found.',
                    flags: 64,
                },
            };
        }

        const randomListing = listings[Math.floor(Math.random() * listings.length)];
        
        const embed = {
            title: `🎲 Random ${randomListing.type === 'server' ? 'Server' : 'Bot'} Discovery`,
            color: 0x9B59B6,
            fields: [
                {
                    name: `${randomListing.featured ? '✨ ' : ''}${randomListing.name}`,
                    value: randomListing.description,
                    inline: false
                },
                {
                    name: '👥 Members',
                    value: (randomListing.member_count || 0).toString(),
                    inline: true
                },
                {
                    name: '📅 Listed',
                    value: `<t:${Math.floor(new Date(randomListing.created_at).getTime() / 1000)}:R>`,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
        };

        if (randomListing.avatar_url) {
            embed.thumbnail = { url: randomListing.avatar_url };
        }

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    } catch (error) {
        console.error('Error in random command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while finding a random listing.',
                flags: 64,
            },
        };
    }
}

// Handle vote command  
async function handleVoteCommand(interaction: any) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const serverName = interaction.data?.options?.[0]?.value;
    
    if (!userId || !serverName) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Missing required information.',
                flags: 64,
            },
        };
    }

    try {
        // Find listing by name
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, name, vote_count')
            .ilike('name', `%${serverName}%`)
            .eq('status', 'active')
            .single();

        if (listingError || !listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `❌ No listing found with name "${serverName}".`,
                    flags: 64,
                },
            };
        }

        // Check if user already voted today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingVote } = await supabase
            .from('votes')
            .select('id')
            .eq('user_id', userId)
            .eq('target_id', listing.id)
            .gte('voted_at', today)
            .single();

        if (existingVote) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '⏳ You can only vote once per day for each listing.',
                    flags: 64,
                },
            };
        }

        // Add vote
        await supabase
            .from('votes')
            .insert({
                user_id: userId,
                target_id: listing.id,
                target_type: 'listing'
            });

        // Update vote count
        await supabase
            .from('listings')
            .update({
                vote_count: (listing.vote_count || 0) + 1
            })
            .eq('id', listing.id);

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🗳️ Vote Successful!',
                    description: `Thank you for voting for **${listing.name}**!\n\nYour vote helps them climb the rankings. Come back tomorrow to vote again!`,
                    color: 0x00FF00,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in vote command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while processing your vote.',
                flags: 64,
            },
        };
    }
}

// Handle mylistings command
async function handleMyListingsCommand(interaction: any) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    
    if (!userId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Unable to identify user.',
                flags: 64,
            },
        };
    }

    try {
        // Get user's profile to find their listings
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', userId)
            .single();
            
        if (!profile) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ No profile found. Please create an account on our website first.',
                    flags: 64,
                },
            };
        }
        
        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, type, status, bump_count, vote_count, created_at, featured')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
            
        if (error || !listings || listings.length === 0) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '📋 You don\'t have any listings yet. Create one on our website!',
                    flags: 64,
                },
            };
        }
        
        const fields = listings.slice(0, 10).map(listing => {
            const statusEmoji = listing.status === 'active' ? '✅' : listing.status === 'pending' ? '⏳' : '❌';
            
            return {
                name: `${statusEmoji} ${listing.name} ${listing.featured ? '✨' : ''} (${listing.type})`,
                value: `🚀 ${listing.bump_count || 0} bumps | 🗳️ ${listing.vote_count || 0} votes | Created <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
                inline: false
            };
        });
        
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '📋 Your Listings',
                    color: 0x0099ff,
                    fields: fields,
                    footer: {
                        text: `Showing ${Math.min(listings.length, 10)} of ${listings.length} listings`
                    },
                    timestamp: new Date().toISOString(),
                }],
                flags: 64,
            },
        };
    } catch (error) {
        console.error('Error in mylistings command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while fetching your listings.',
                flags: 64,
            },
        };
    }
}

// Handle premium command
async function handlePremiumCommand(interaction: any) {
    return {
        type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✨ Premium Features',
                description: 'Upgrade to Premium and unlock exclusive benefits!',
                color: 0xFFD700,
                fields: [
                    {
                        name: '🚀 Faster Bumping',
                        value: 'Bump every 2 hours instead of 6 hours',
                        inline: false
                    },
                    {
                        name: '⭐ Priority Support',
                        value: 'Get priority customer support',
                        inline: false
                    },
                    {
                        name: '📊 Advanced Analytics',
                        value: 'Detailed insights about your server performance',
                        inline: false
                    },
                    {
                        name: '🎨 Custom Styling',
                        value: 'Customize your listing appearance',
                        inline: false
                    },
                    {
                        name: '✨ Featured Listing',
                        value: 'Get your server featured in special sections',
                        inline: false
                    }
                ],
                footer: {
                    text: 'Visit our website to upgrade to Premium!'
                },
                timestamp: new Date().toISOString(),
            }],
        },
    };
}

// Handle setstatuschannel command
async function handleSetStatusChannelCommand(interaction: any) {
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
        // Update or create bot configuration for status channel
        const { data: existingConfig } = await supabase
            .from('discord_bot_configs')
            .select('*')
            .eq('discord_server_id', guildId)
            .single();

        if (existingConfig) {
            // Update existing configuration
            await supabase
                .from('discord_bot_configs')
                .update({
                    status_channel_id: channelId,
                    updated_at: new Date().toISOString(),
                })
                .eq('discord_server_id', guildId);
        } else {
            // Create new configuration
            await supabase
                .from('discord_bot_configs')
                .insert({
                    discord_server_id: guildId,
                    status_channel_id: channelId,
                    admin_user_id: userId,
                    active: true,
                    updated_at: new Date().toISOString(),
                });
        }

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '🔧 Status Channel Set',
                    description: `System status updates will now be posted to <#${channelId}>\n\nThis includes maintenance notifications, new features, and important announcements.`,
                    color: 0x00FF00,
                    timestamp: new Date().toISOString(),
                }],
            },
        };
    } catch (error) {
        console.error('Error in setstatuschannel command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while setting up the status channel.',
                flags: 64,
            },
        };
    }
}
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
                case 'trending':
                    response = await handleTrendingCommand(body);
                    break;
                case 'random':
                    response = await handleRandomCommand(body);
                    break;
                case 'vote':
                    response = await handleVoteCommand(body);
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
                case 'mylistings':
                    response = await handleMyListingsCommand(body);
                    break;
                case 'premium':
                    response = await handlePremiumCommand(body);
                    break;
                case 'help':
                    response = await handleHelpCommand(body);
                    break;
                case 'setup':
                    response = await handleSetupCommand(body);
                    break;
                case 'setbumpchannel':
                    response = await handleSetBumpChannelCommand(body);
                    break;
                case 'setstatuschannel':
                    response = await handleSetStatusChannelCommand(body);
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
