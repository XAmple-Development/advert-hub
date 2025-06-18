
# Discord Server Listing Bot

A Discord bot that allows server owners to bump their listings and manage server promotions.

## Features

- `/bump` - Bump your server listing to the top (2-hour cooldown)
- `/setup` - Configure which channel receives new listing notifications

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd bot
   npm install
   ```

2. **Create Discord Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Go to "Bot" section and create a bot
   - Copy the bot token

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in your Discord bot token and application ID
   - Add your Supabase URL and service role key

4. **Invite Bot to Server**
   - Go to OAuth2 > URL Generator in Discord Developer Portal
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`
   - Use the generated URL to invite the bot

5. **Run the Bot**
   ```bash
   npm start
   ```

## Development

For development with auto-restart:
```bash
npm run dev
```

## Commands

### /bump
Bumps your server listing to the top of the list. Has a 2-hour cooldown per user per server.

### /setup
Configures the bot to post new listings to a specific channel. Only needs to be run once per server.

## Database Requirements

The bot requires these Supabase tables:
- `listings` - Server/bot listings
- `bump_cooldowns` - Tracks bump cooldowns
- `discord_bot_configs` - Bot configuration per server

## Deployment

You can deploy this bot to:
- Railway
- Heroku
- DigitalOcean App Platform
- Any VPS with Node.js support

Make sure to set the environment variables in your deployment platform.
