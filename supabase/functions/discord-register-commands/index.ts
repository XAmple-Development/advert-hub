
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_APPLICATION_ID = Deno.env.get('DISCORD_APPLICATION_ID');

const commands = [
  {
    name: 'bump',
    description: 'Bump your server listing to the top of the list',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'setup',
    description: 'Setup the Discord bot for posting new listings',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'channel',
        description: 'Channel where new listings will be posted',
        type: 7, // CHANNEL
        required: true,
        channel_types: [0], // GUILD_TEXT
      },
    ],
  },
];

serve(async (req) => {
  try {
    if (!DISCORD_BOT_TOKEN || !DISCORD_APPLICATION_ID) {
      return new Response('Missing Discord credentials', { status: 400 });
    }

    const response = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to register commands:', error);
      return new Response(`Failed to register commands: ${error}`, { status: response.status });
    }

    const result = await response.json();
    console.log('Successfully registered commands:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      commands: result,
      message: 'Discord slash commands registered successfully!'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error registering Discord commands:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
