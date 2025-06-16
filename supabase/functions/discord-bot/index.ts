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

// Your handlers here (unchanged)
async function handleBumpCommand(interaction: any) { /* ... */ }
async function handleSetupCommand(interaction: any) { /* ... */ }

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
