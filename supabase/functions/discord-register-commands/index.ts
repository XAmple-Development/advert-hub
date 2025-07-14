
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
    name: 'bumpstatus',
    description: 'Check your bump cooldown status',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'search',
    description: 'Search server listings by name',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'query',
        description: 'Name or part of the server name to search',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'type',
        description: 'Filter by listing type',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Servers', value: 'server' },
          { name: 'Bots', value: 'bot' }
        ]
      },
    ],
  },
  {
    name: 'trending',
    description: 'Show trending servers and bots',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'type',
        description: 'Filter by listing type',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'All', value: 'all' },
          { name: 'Servers', value: 'server' },
          { name: 'Bots', value: 'bot' }
        ]
      },
    ],
  },
  {
    name: 'random',
    description: 'Discover a random server or bot',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'type',
        description: 'Type of listing to discover',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Server', value: 'server' },
          { name: 'Bot', value: 'bot' }
        ]
      },
    ],
  },
  {
    name: 'vote',
    description: 'Vote for a server or bot',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'name',
        description: 'Name of the server/bot to vote for',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'setup',
    description: 'Configure the bot for posting new listings',
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
  {
    name: 'setbumpchannel',
    description: 'Set the channel for bump notifications',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'channel',
        description: 'Channel where bump notifications will be posted',
        type: 7, // CHANNEL
        required: true,
        channel_types: [0], // GUILD_TEXT
      },
    ],
  },
  {
    name: 'setstatuschannel',
    description: 'Set the channel for system status updates',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'channel',
        description: 'Channel where system status updates will be posted',
        type: 7, // CHANNEL
        required: true,
        channel_types: [0], // GUILD_TEXT
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'Show top servers by bump count',
    type: 1, // CHAT_INPUT
    options: [
      {
        name: 'limit',
        description: 'Number of servers to show (max 10)',
        type: 4, // INTEGER
        required: false,
        min_value: 1,
        max_value: 10,
      },
      {
        name: 'type',
        description: 'Filter by listing type',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'All', value: 'all' },
          { name: 'Servers', value: 'server' },
          { name: 'Bots', value: 'bot' }
        ]
      },
    ],
  },
  {
    name: 'stats',
    description: 'Show your server listing statistics',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'featured',
    description: 'Show featured server listings',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'mylistings',
    description: 'View your personal listings',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'premium',
    description: 'Learn about premium features',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'help',
    description: 'Show bot commands and usage information',
    type: 1, // CHAT_INPUT
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
