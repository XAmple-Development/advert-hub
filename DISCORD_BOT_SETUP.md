
# Discord Bot Setup Guide

## Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your bot a name (e.g., "Discord Boost Bot")
4. Go to the "Bot" section in the left sidebar
5. Click "Add Bot"
6. Copy the Bot Token - you'll need this for Supabase secrets

## Step 2: Configure Bot Permissions

1. In the "Bot" section, scroll down to "Privileged Gateway Intents"
2. Enable "Server Members Intent" if you need member information
3. Go to the "OAuth2" > "URL Generator" section
4. Select "bot" and "applications.commands" scopes
5. Select these permissions:
   - Send Messages
   - Use Slash Commands
   - Read Message History
   - View Channels
   - Embed Links

## Step 3: Get Your Application Details

From the "General Information" section, copy:
- Application ID
- Public Key

## Step 4: Configure Supabase Secrets

You need to add these secrets to your Supabase project:
- `DISCORD_APPLICATION_ID`: Your Discord Application ID
- `DISCORD_PUBLIC_KEY`: Your Discord Application Public Key  
- `DISCORD_BOT_TOKEN`: Your Discord Bot Token

## Step 5: Set Interactions Endpoint URL

1. In Discord Developer Portal, go to "General Information"
2. Set "Interactions Endpoint URL" to:
   `https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/discord-bot`

## Step 6: Register Slash Commands

After setting up the secrets, you can register your bot's slash commands by calling:
`https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/discord-register-commands`

## Step 7: Invite Bot to Your Server

Use the OAuth2 URL you generated in Step 2 to invite the bot to your Discord server.

## Available Commands

- `/bump` - Bump your server listing (2-hour cooldown)
- `/setup <channel>` - Configure where new listings are posted

## Troubleshooting

- Make sure all environment variables are set correctly
- Check the Edge Function logs in Supabase for any errors
- Verify the bot has the necessary permissions in your Discord server
