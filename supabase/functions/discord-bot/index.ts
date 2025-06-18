
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import nacl from "https://esm.sh/tweetnacl@1.0.3";

// Env vars
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp',
};

// Discord constants
const INTERACTION_TYPES = {
    PING: 1,
    APPLICATION_COMMAND: 2,
};

const INTERACTION_RESPONSE_TYPES = {
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
};

// Signature verification helper
function verifyDiscordRequest(req: Request, body: string): boolean {
    const signature = req.headers.get("x-signature-ed25519")!;
    const timestamp = req.headers.get("x-signature-timestamp")!;

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

// Bump command handler
async function handleBumpCommand(interaction: any) {
    console.log('Handling bump command for interaction:', interaction);
    
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
        // Check if user has a listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('discord_id', guildId)
            .single();

        if (listingError || !listing) {
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'No listing found for this server. Please create a listing first.',
                    flags: 64, // Ephemeral
                },
            };
        }

        // Check bump cooldown (2 hours = 7200 seconds)
        const { data: cooldown, error: cooldownError } = await supabase
            .from('bump_cooldowns')
            .select('*')
            .eq('user_discord_id', userId)
            .eq('listing_id', listing.id)
            .single();

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        if (cooldown && new Date(cooldown.last_bump_at) > twoHoursAgo) {
            const nextBumpTime = new Date(new Date(cooldown.last_bump_at).getTime() + 2 * 60 * 60 * 1000);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `You can bump again <t:${Math.floor(nextBumpTime.getTime() / 1000)}:R>`,
                    flags: 64, // Ephemeral
                },
            };
        }

        // Update or insert bump cooldown
        const { error: upsertError } = await supabase
            .from('bump_cooldowns')
            .upsert({
                user_discord_id: userId,
                listing_id: listing.id,
                last_bump_at: now.toISOString(),
            });

        if (upsertError) {
            console.error('Error updating bump cooldown:', upsertError);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Error updating bump cooldown.',
                    flags: 64, // Ephemeral
                },
            };
        }

        // Update listing's last_bumped_at and bump_count
        const { error: updateError } = await supabase
            .from('listings')
            .update({
                last_bumped_at: now.toISOString(),
                bump_count: listing.bump_count + 1,
                updated_at: now.toISOString(),
            })
            .eq('id', listing.id);

        if (updateError) {
            console.error('Error updating listing:', updateError);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Error updating listing.',
                    flags: 64, // Ephemeral
                },
            };
        }

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `🚀 **${listing.name}** has been bumped to the top of the list!\n\nNext bump available <t:${Math.floor((now.getTime() + 2 * 60 * 60 * 1000) / 1000)}:R>`,
            },
        };
    } catch (error) {
        console.error('Error in bump command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while processing the bump command.',
                flags: 64, // Ephemeral
            },
        };
    }
}

// Setup command handler
async function handleSetupCommand(interaction: any) {
    console.log('Handling setup command for interaction:', interaction);
    
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const guildId = interaction.guild_id;
    const channelId = interaction.data?.options?.[0]?.value;
    
    if (!userId || !guildId || !channelId) {
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Error: Missing required information.',
                flags: 64, // Ephemeral
            },
        };
    }

    try {
        // Check if user has admin permissions (this is a simplified check)
        // In a real implementation, you'd verify Discord permissions
        
        // Upsert bot configuration
        const { error: configError } = await supabase
            .from('discord_bot_configs')
            .upsert({
                discord_server_id: guildId,
                listing_channel_id: channelId,
                admin_user_id: userId,
                active: true,
                updated_at: new Date().toISOString(),
            });

        if (configError) {
            console.error('Error updating bot config:', configError);
            return {
                type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Error setting up bot configuration.',
                    flags: 64, // Ephemeral
                },
            };
        }

        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `✅ Bot setup complete! New listings will be posted to <#${channelId}>.`,
                flags: 64, // Ephemeral
            },
        };
    } catch (error) {
        console.error('Error in setup command:', error);
        return {
            type: INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'An error occurred while setting up the bot.',
                flags: 64, // Ephemeral
            },
        };
    }
}

// Entry point
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const rawBody = await req.text();

    if (!verifyDiscordRequest(req, rawBody)) {
        return new Response("Invalid request signature", { status: 401 });
    }

    try {
        const body = JSON.parse(rawBody);
        console.log('Received Discord interaction:', body);

        if (body.type === INTERACTION_TYPES.PING) {
            return new Response(JSON.stringify({ type: INTERACTION_RESPONSE_TYPES.PONG }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

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
