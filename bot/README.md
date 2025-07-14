
# Discord Server Listing Bot

A powerful Discord bot that helps server owners promote their communities and discover new servers/bots.

## 🌟 Features

### Core Commands
- `/bump` - Bump your server listing to the top (2-hour cooldown)
- `/bumpstatus` - Check your bump cooldown status
- `/search <query> [type]` - Search for servers/bots by name with type filtering
- `/trending [type]` - Show trending servers and bots based on growth metrics
- `/random [type]` - Discover random servers or bots
- `/vote <name>` - Vote for servers/bots (daily voting)
- `/leaderboard [limit] [type]` - Show top listings by bump count
- `/stats` - Show your server's listing statistics
- `/featured` - Browse featured listings
- `/mylistings` - View all your listings
- `/premium` - Learn about premium features

### Admin Commands
- `/setup <channel>` - Configure which channel receives new listing notifications
- `/setbumpchannel <channel>` - Set channel for bump notifications
- `/setstatuschannel <channel>` - Set channel for system status updates

### Interactive Features
- Button-based interactions for quick actions
- Rich embeds with server information
- Real-time trending analysis
- Vote tracking and leaderboards

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

## 📋 Command Reference

### 🚀 Promotion Commands
- **`/bump`** - Bump your server to the top of listings (2hr cooldown)
- **`/vote <name>`** - Vote for a server/bot (once per day per listing)

### 🔍 Discovery Commands  
- **`/search <query> [type]`** - Search listings by name (optional type filter)
- **`/trending [type]`** - View trending servers/bots based on growth
- **`/random [type]`** - Get a random server/bot recommendation
- **`/featured`** - Browse featured listings

### 📊 Statistics & Info
- **`/leaderboard [limit] [type]`** - Top listings by bump count
- **`/stats`** - Your server's listing statistics  
- **`/mylistings`** - View all your listings
- **`/bumpstatus`** - Check bump cooldown status
- **`/premium`** - Premium features and upgrade info

### ⚙️ Server Configuration (Admin Only)
- **`/setup <channel>`** - Set channel for new listing notifications
- **`/setbumpchannel <channel>`** - Set channel for bump notifications  
- **`/setstatuschannel <channel>`** - Set channel for system status updates

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
