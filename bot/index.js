
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType
} = require('discord.js');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_APPLICATION_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BUMP_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const commands = [
    new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bump your server listing to the top of the list'),
    new SlashCommandBuilder()
        .setName('bumpstatus')
        .setDescription('Check your bump cooldown status'),
    new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search server listings by name')
        .addStringOption(option =>
            option.setName('query').setDescription('Name or part of the server name to search').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type').setDescription('Filter by listing type')
            .addChoices(
                { name: 'Servers', value: 'server' },
                { name: 'Bots', value: 'bot' }
            )
        ),
    new SlashCommandBuilder()
        .setName('trending')
        .setDescription('Show trending servers and bots')
        .addStringOption(option =>
            option.setName('type').setDescription('Filter by listing type')
            .addChoices(
                { name: 'All', value: 'all' },
                { name: 'Servers', value: 'server' },
                { name: 'Bots', value: 'bot' }
            )
        ),
    new SlashCommandBuilder()
        .setName('random')
        .setDescription('Discover a random server or bot')
        .addStringOption(option =>
            option.setName('type').setDescription('Type of listing to discover')
            .addChoices(
                { name: 'Server', value: 'server' },
                { name: 'Bot', value: 'bot' }
            )
        ),
    new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for a server or bot')
        .addStringOption(option =>
            option.setName('name').setDescription('Name of the server/bot to vote for').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure the bot for posting new listings')
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel where new listings will be posted').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('setbumpchannel')
        .setDescription('Set the channel for bump notifications')
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel where bump notifications will be posted').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('setstatuschannel')
        .setDescription('Set the channel for system status updates')
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel where system status updates will be posted').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show top servers by bump count')
        .addIntegerOption(option =>
            option.setName('limit').setDescription('Number of servers to show (max 10)').setMinValue(1).setMaxValue(10)
        )
        .addStringOption(option =>
            option.setName('type').setDescription('Filter by listing type')
            .addChoices(
                { name: 'All', value: 'all' },
                { name: 'Servers', value: 'server' },
                { name: 'Bots', value: 'bot' }
            )
        ),
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show your server listing statistics'),
    new SlashCommandBuilder()
        .setName('featured')
        .setDescription('Show featured server listings'),
    new SlashCommandBuilder()
        .setName('mylistings')
        .setDescription('Show your server/bot listings'),
    new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Show premium features and subscription info'),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show bot commands and usage information'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔄 Registering slash commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash commands registered.');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
})();

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`🌐 Bot is serving ${client.guilds.cache.size} servers`);
    
    // Set bot activity
    client.user.setActivity('Discord Server Listings | /help', { type: 'WATCHING' });
});

// --- Cooldown Management ---
async function canBump(userId, listingId) {
    console.log(`Checking bump cooldown for user ${userId} and listing ${listingId}`);
    
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
    
    console.log(`Last bump: ${lastBump.toISOString()}, Now: ${now.toISOString()}, Time diff: ${timeDiff}ms, Required: ${BUMP_COOLDOWN_MS}ms`);
    
    const canBumpNow = timeDiff >= BUMP_COOLDOWN_MS;
    console.log(`Can bump: ${canBumpNow}`);
    
    return canBumpNow;
}

async function timeUntilNextBump(userId, listingId) {
    const { data, error } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .eq('listing_id', listingId)
        .single();

    if (error || !data) return 0;

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastBump.getTime();
    const timeLeft = BUMP_COOLDOWN_MS - timeDiff;
    
    return Math.max(0, timeLeft);
}

// --- Discord Posting Functions ---
async function postBumpToDiscordChannels(listing, bumpType = 'discord') {
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
        const embed = new EmbedBuilder()
            .setTitle(`🚀 ${listing.type === 'server' ? 'Server' : 'Bot'} Bumped!`)
            .setDescription(`**${listing.name}** has been bumped to the top!\n\n${listing.description || 'No description available.'}`)
            .setColor(listing.premium_featured ? '#FFD700' : '#00FF00')
            .addFields(
                { name: '👥 Members', value: (listing.member_count || 0).toString(), inline: true },
                { name: '🚀 Total Bumps', value: (listing.bump_count || 0).toString(), inline: true },
                { name: '📊 Bump Source', value: bumpType === 'discord' ? 'Discord Bot' : 'Website', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Discord Server Listings' });

        if (listing.avatar_url) {
            embed.setThumbnail(listing.avatar_url);
        }

        // Post to each configured channel
        for (const config of configs) {
            try {
                console.log(`Posting to channel ${config.bump_channel_id} in server ${config.discord_server_id}`);
                
                const channel = await client.channels.fetch(config.bump_channel_id);
                if (channel && channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
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

// --- Interaction Handling ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (interaction.commandName === 'bump') {
        console.log(`Bump command received from user ${userId} in guild ${guildId}`);
        
        // Find user's listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, name, bump_count')
            .eq('discord_id', guildId)
            .eq('status', 'active')
            .single();

        if (listingError || !listing) {
            console.log('No active listing found for guild:', guildId);
            return interaction.reply({ 
                content: '❌ No active listing found for this server. Please create a listing first on our website.', 
                ephemeral: true 
            });
        }

        console.log(`Found listing: ${listing.name} (${listing.id})`);

        // Check cooldown with listing ID
        const canUserBump = await canBump(userId, listing.id);
        if (!canUserBump) {
            const msLeft = await timeUntilNextBump(userId, listing.id);
            const hours = Math.floor(msLeft / (60 * 60 * 1000));
            const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            console.log(`User cannot bump, ${hours}h ${minutes}m remaining`);
            return interaction.reply({ 
                content: `⏳ You must wait ${hours}h ${minutes}m before bumping again.`, 
                ephemeral: true 
            });
        }

        const now = new Date();

        try {
            // Update cooldown with proper conflict resolution
            const { error: cooldownError } = await supabase
                .from('bump_cooldowns')
                .upsert({ 
                    user_discord_id: userId, 
                    listing_id: listing.id,
                    last_bump_at: now.toISOString() 
                }, { 
                    onConflict: 'user_discord_id,listing_id',
                    ignoreDuplicates: false 
                });

            if (cooldownError) {
                console.error('Error updating bump cooldown:', cooldownError);
                // Show user-friendly error instead of technical database error
                return interaction.reply({ 
                    content: '⚠️ Unable to process your bump right now. Please try again in a moment.', 
                    ephemeral: true 
                });
            }

            // Update listing bump count and timestamp
            const { error: listingUpdateError } = await supabase
                .from('listings')
                .update({
                    last_bumped_at: now.toISOString(),
                    bump_count: (listing.bump_count || 0) + 1,
                    updated_at: now.toISOString()
                })
                .eq('id', listing.id);

            if (listingUpdateError) {
                console.error('Error updating listing:', listingUpdateError);
            }

            // Create bump record
            const { error: bumpError } = await supabase
                .from('bumps')
                .insert({
                    listing_id: listing.id,
                    user_id: userId,
                    bump_type: 'discord',
                    bumped_at: now.toISOString()
                });

            if (bumpError) {
                console.error('Error creating bump record:', bumpError);
                return interaction.reply({ content: '❌ Error registering your bump.', ephemeral: true });
            }

            console.log(`Bump successful for listing ${listing.id}`);

            // Get full listing data for Discord posting
            const { data: fullListing } = await supabase
                .from('listings')
                .select('*')
                .eq('id', listing.id)
                .single();

            // Post bump notification to Discord channels
            if (fullListing) {
                await postBumpToDiscordChannels(fullListing, 'discord');
            }

            const embed = new EmbedBuilder()
                .setTitle('🚀 Server Bumped!')
                .setDescription(`**${listing.name}** has been bumped to the top of the list!\n\nNext bump available in 2 hours.`)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in bump process:', error);
            return interaction.reply({ content: '❌ An error occurred while processing your bump.', ephemeral: true });
        }

    } else if (interaction.commandName === 'bumpstatus') {
        // Find user's listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, name')
            .eq('discord_id', guildId)
            .eq('status', 'active')
            .single();

        if (listingError || !listing) {
            return interaction.reply({ 
                content: '❌ No active listing found for this server.', 
                ephemeral: true 
            });
        }

        const canUserBump = await canBump(userId, listing.id);
        if (canUserBump) {
            return interaction.reply({ content: '✅ You can bump now!', ephemeral: true });
        }

        const msLeft = await timeUntilNextBump(userId, listing.id);
        const hours = Math.floor(msLeft / (60 * 60 * 1000));
        const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
        return interaction.reply({ 
            content: `⏳ You must wait ${hours}h ${minutes}m before bumping again.`, 
            ephemeral: true 
        });

    } else if (interaction.commandName === 'trending') {
        const type = interaction.options.getString('type') || 'all';
        
        // Get trending data from trending_metrics table
        let query = supabase
            .from('trending_metrics')
            .select(`
                listing_id,
                trending_score,
                member_growth,
                vote_growth,
                view_growth,
                listings (
                    id, name, description, type, member_count, avatar_url, featured
                )
            `)
            .order('trending_score', { ascending: false })
            .limit(10);
            
        if (type !== 'all') {
            query = query.eq('listings.type', type);
        }
        
        const { data: trendingData, error } = await query;
        
        if (error || !trendingData || trendingData.length === 0) {
            return interaction.reply({ content: '📈 No trending data available right now.', ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`📈 Trending ${type === 'all' ? 'Listings' : type === 'server' ? 'Servers' : 'Bots'}`)
            .setColor('#FF6B35')
            .setDescription('Based on recent growth in members, votes, and views')
            .setTimestamp();
            
        trendingData.slice(0, 5).forEach((item, index) => {
            const listing = item.listings;
            const trend = item.member_growth > 0 ? '📈' : item.member_growth < 0 ? '📉' : '➡️';
            
            embed.addFields({
                name: `${index + 1}. ${listing.name} ${listing.featured ? '✨' : ''} ${trend}`,
                value: `${listing.description?.substring(0, 80)}...\n👥 ${listing.member_count || 0} members | 🔥 ${Math.round(item.trending_score)} trending score`,
                inline: false
            });
        });
        
        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'random') {
        const type = interaction.options.getString('type') || (Math.random() > 0.5 ? 'server' : 'bot');
        
        // Get random listing
        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, description, type, member_count, avatar_url, invite_url, website_url, featured')
            .eq('type', type)
            .eq('status', 'active')
            .limit(50); // Get more and pick randomly for better randomization
            
        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: `🎲 No ${type}s found.`, ephemeral: true });
        }
        
        const randomListing = listings[Math.floor(Math.random() * listings.length)];
        
        const embed = new EmbedBuilder()
            .setTitle(`🎲 Random ${type.charAt(0).toUpperCase() + type.slice(1)} Discovery`)
            .setColor('#9B59B6')
            .addFields(
                { name: `${randomListing.featured ? '✨ ' : ''}${randomListing.name}`, value: randomListing.description || 'No description available.', inline: false },
                { name: '👥 Members', value: (randomListing.member_count || 0).toString(), inline: true },
                { name: '📊 Type', value: randomListing.type, inline: true }
            )
            .setTimestamp();
            
        if (randomListing.avatar_url) {
            embed.setThumbnail(randomListing.avatar_url);
        }
        
        // Add action buttons
        const row = new ActionRowBuilder();
        if (randomListing.invite_url) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Join/Invite')
                    .setStyle(ButtonStyle.Link)
                    .setURL(randomListing.invite_url)
                    .setEmoji('🚀')
            );
        }
        if (randomListing.website_url) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL(randomListing.website_url)
                    .setEmoji('🌐')
            );
        }
        
        const response = { embeds: [embed] };
        if (row.components.length > 0) {
            response.components = [row];
        }
        
        await interaction.reply(response);

    } else if (interaction.commandName === 'vote') {
        const name = interaction.options.getString('name');
        
        // Search for the listing
        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, type, vote_count')
            .ilike('name', `%${name}%`)
            .eq('status', 'active')
            .limit(5);
            
        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: `❌ No listings found matching "${name}".`, ephemeral: true });
        }
        
        if (listings.length === 1) {
            // Direct vote
            const listing = listings[0];
            
            // Check if user already voted today
            const { data: existingVote } = await supabase
                .from('votes')
                .select('id')
                .eq('user_id', userId)
                .eq('target_id', listing.id)
                .gte('voted_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
                .single();
                
            if (existingVote) {
                return interaction.reply({ content: `❌ You've already voted for ${listing.name} today!`, ephemeral: true });
            }
            
            // Add vote
            const { error: voteError } = await supabase
                .from('votes')
                .insert({
                    user_id: userId,
                    target_id: listing.id,
                    target_type: 'listing'
                });
                
            if (voteError) {
                return interaction.reply({ content: '❌ Error recording your vote.', ephemeral: true });
            }
            
            // Update vote count
            await supabase
                .from('listings')
                .update({ vote_count: (listing.vote_count || 0) + 1 })
                .eq('id', listing.id);
                
            const embed = new EmbedBuilder()
                .setTitle('✅ Vote Recorded!')
                .setDescription(`Thanks for voting for **${listing.name}**!\n\nYou can vote again tomorrow.`)
                .setColor('#00FF00')
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } else {
            // Multiple results - show selection
            const embed = new EmbedBuilder()
                .setTitle(`🗳️ Multiple results for "${name}"`)
                .setDescription('Please be more specific or choose from these results:')
                .setColor('#FFA500');
                
            listings.forEach((listing, index) => {
                embed.addFields({
                    name: `${index + 1}. ${listing.name}`,
                    value: `Type: ${listing.type} | Votes: ${listing.vote_count || 0}`,
                    inline: false
                });
            });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } else if (interaction.commandName === 'search') {
        const query = interaction.options.getString('query');
        const type = interaction.options.getString('type');

        let dbQuery = supabase
            .from('listings')
            .select('id, name, description, type, featured, member_count, created_at, invite_url, website_url')
            .ilike('name', `%${query}%`)
            .eq('status', 'active')
            .limit(5);
            
        if (type) {
            dbQuery = dbQuery.eq('type', type);
        }

        const { data: listings, error } = await dbQuery;

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '🔍 No results found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Search results for "${query}"${type ? ` (${type}s)` : ''}`)
            .setColor('#0099ff')
            .setTimestamp();

        listings.forEach(listing => {
            embed.addFields({
                name: `${listing.name} ${listing.featured ? '✨ [Featured]' : ''} (${listing.type})`,
                value: `${(listing.description || 'No description').substring(0, 100)}...\n👥 ${listing.member_count || 0} members | Listed <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.commandName === 'setup') {
        const channel = interaction.options.getChannel('channel');
        
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
        }

        const { error } = await supabase
            .from('discord_bot_configs')
            .upsert({
                discord_server_id: guildId,
                listing_channel_id: channel.id,
                admin_user_id: userId,
                active: true
            }, { onConflict: 'discord_server_id' });

        if (error) {
            console.error('Error setting up bot config:', error);
            return interaction.reply({ content: '❌ Error configuring bot.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Bot Configuration Updated')
            .setDescription(`New listings will now be posted to ${channel}`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'setbumpchannel') {
        const channel = interaction.options.getChannel('channel');
        
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
        }

        // Check if a config exists, update or create
        const { data: existingConfig } = await supabase
            .from('discord_bot_configs')
            .select('*')
            .eq('discord_server_id', guildId)
            .single();

        if (existingConfig) {
            // Update existing configuration
            const { error } = await supabase
                .from('discord_bot_configs')
                .update({
                    bump_channel_id: channel.id,
                    updated_at: new Date().toISOString()
                })
                .eq('discord_server_id', guildId);

            if (error) {
                console.error('Error updating bump channel config:', error);
                return interaction.reply({ content: '❌ Error configuring bump channel.', ephemeral: true });
            }
        } else {
            // Create new configuration
            const { error } = await supabase
                .from('discord_bot_configs')
                .insert({
                    discord_server_id: guildId,
                    bump_channel_id: channel.id,
                    admin_user_id: userId,
                    active: true
                });

            if (error) {
                console.error('Error creating bump channel config:', error);
                return interaction.reply({ content: '❌ Error configuring bump channel.', ephemeral: true });
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('📢 Bump Channel Set')
            .setDescription(`Bump notifications will now be posted to ${channel}\n\nWhenever a server/bot is bumped on our website or via the bot, it will be announced in this channel.`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'setstatuschannel') {
        const channel = interaction.options.getChannel('channel');
        
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return interaction.reply({ content: '❌ You need Manage Server permission to use this command.', ephemeral: true });
        }

        // Check if a config exists, update or create
        const { data: existingConfig } = await supabase
            .from('discord_bot_configs')
            .select('*')
            .eq('discord_server_id', guildId)
            .single();

        if (existingConfig) {
            // Update existing configuration
            const { error } = await supabase
                .from('discord_bot_configs')
                .update({
                    status_channel_id: channel.id,
                    updated_at: new Date().toISOString()
                })
                .eq('discord_server_id', guildId);

            if (error) {
                console.error('Error updating status channel config:', error);
                return interaction.reply({ content: '❌ Error configuring status channel.', ephemeral: true });
            }
        } else {
            // Create new configuration
            const { error } = await supabase
                .from('discord_bot_configs')
                .insert({
                    discord_server_id: guildId,
                    status_channel_id: channel.id,
                    admin_user_id: userId,
                    active: true
                });

            if (error) {
                console.error('Error creating status channel config:', error);
                return interaction.reply({ content: '❌ Error configuring status channel.', ephemeral: true });
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔧 Status Channel Set')
            .setDescription(`System status updates will now be posted to ${channel}\n\nAutomated status messages with platform health and performance metrics will be posted here every 30 minutes.`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'leaderboard') {
        const limit = interaction.options.getInteger('limit') || 5;
        const type = interaction.options.getString('type') || 'all';

        let query = supabase
            .from('listings')
            .select('name, type, bump_count, last_bumped_at, featured, vote_count')
            .eq('status', 'active')
            .order('bump_count', { ascending: false })
            .order('last_bumped_at', { ascending: false })
            .limit(limit);
            
        if (type !== 'all') {
            query = query.eq('type', type);
        }

        const { data: listings, error } = await query;

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '📊 No listings found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Top ${type === 'all' ? 'Listings' : type === 'server' ? 'Servers' : 'Bots'} by Bump Count`)
            .setColor('#FFD700')
            .setTimestamp();

        listings.forEach((listing, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const lastBumped = listing.last_bumped_at ? `<t:${Math.floor(new Date(listing.last_bumped_at).getTime() / 1000)}:R>` : 'Never';
            
            embed.addFields({
                name: `${medal} ${listing.name} ${listing.featured ? '✨' : ''} (${listing.type})`,
                value: `🚀 ${listing.bump_count || 0} bumps | 🗳️ ${listing.vote_count || 0} votes | Last: ${lastBumped}`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'stats') {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('name, bump_count, view_count, join_count, last_bumped_at, created_at, featured')
            .eq('discord_id', guildId)
            .eq('status', 'active')
            .single();

        if (error || !listing) {
            return interaction.reply({ 
                content: '❌ No active listing found for this server. Create one on our website first!', 
                ephemeral: true 
            });
        }

        const lastBumped = listing.last_bumped_at ? `<t:${Math.floor(new Date(listing.last_bumped_at).getTime() / 1000)}:R>` : 'Never';
        const created = `<t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:D>`;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Stats for ${listing.name}`)
            .setColor(listing.featured ? '#FFD700' : '#0099ff')
            .addFields(
                { name: '🚀 Total Bumps', value: (listing.bump_count || 0).toString(), inline: true },
                { name: '👀 Total Views', value: (listing.view_count || 0).toString(), inline: true },
                { name: '🎯 Total Joins', value: (listing.join_count || 0).toString(), inline: true },
                { name: '⏰ Last Bumped', value: lastBumped, inline: true },
                { name: '📅 Listed Since', value: created, inline: true },
                { name: '✨ Featured', value: listing.featured ? 'Yes' : 'No', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'featured') {
        const { data: listings, error } = await supabase
            .from('listings')
            .select('name, description, member_count, created_at')
            .eq('featured', true)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '✨ No featured listings found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('✨ Featured Server Listings')
            .setColor('#FFD700')
            .setTimestamp();

        listings.forEach(listing => {
            embed.addFields({
                name: `✨ ${listing.name}`,
                value: `${listing.description.substring(0, 100)}...\n👥 ${listing.member_count || 0} members | Listed <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'mylistings') {
        // Get user's profile to find their listings
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', userId)
            .single();
            
        if (!profile) {
            return interaction.reply({ 
                content: '❌ No profile found. Please create an account on our website first.', 
                ephemeral: true 
            });
        }
        
        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, type, status, bump_count, vote_count, created_at, featured')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
            
        if (error || !listings || listings.length === 0) {
            return interaction.reply({ 
                content: '📋 You don\'t have any listings yet. Create one on our website!', 
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📋 Your Listings')
            .setColor('#0099ff')
            .setTimestamp();
            
        listings.slice(0, 10).forEach(listing => {
            const statusEmoji = listing.status === 'active' ? '✅' : listing.status === 'pending' ? '⏳' : '❌';
            
            embed.addFields({
                name: `${statusEmoji} ${listing.name} ${listing.featured ? '✨' : ''} (${listing.type})`,
                value: `🚀 ${listing.bump_count || 0} bumps | 🗳️ ${listing.vote_count || 0} votes | Created <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
                inline: false
            });
        });
        
        if (listings.length > 10) {
            embed.setFooter({ text: `Showing 10 of ${listings.length} listings` });
        }
        
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.commandName === 'premium') {
        const embed = new EmbedBuilder()
            .setTitle('⭐ Premium Features')
            .setDescription('Unlock powerful features to grow your Discord community!')
            .setColor('#FFD700')
            .addFields(
                { name: '🚀 Auto-Bump', value: 'Automatic bumping every 2 hours', inline: true },
                { name: '✨ Featured Listing', value: 'Stand out with a featured badge', inline: true },
                { name: '📊 Advanced Analytics', value: 'Detailed statistics and insights', inline: true },
                { name: '🎨 Custom Styling', value: 'Customize your listing appearance', inline: true },
                { name: '⚡ Priority Support', value: 'Get help faster with priority support', inline: true },
                { name: '🔥 No Cooldowns', value: 'Reduced bump cooldowns', inline: true }
            )
            .setFooter({ text: 'Visit our website to upgrade your account!' })
            .setTimestamp();
            
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Upgrade Now')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord-server-listings.lovable.app/pricing')
                    .setEmoji('⭐')
            );
            
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    } else if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Discord Bot Commands')
            .setDescription('Here are all the available commands:')
            .setColor('#0099ff')
            .addFields(
                { name: '🚀 /bump', value: 'Bump your server listing to the top (2hr cooldown)', inline: false },
                { name: '⏰ /bumpstatus', value: 'Check your bump cooldown status', inline: false },
                { name: '🔍 /search <query> [type]', value: 'Search for server/bot listings by name', inline: false },
                { name: '📈 /trending [type]', value: 'Show trending servers and bots', inline: false },
                { name: '🎲 /random [type]', value: 'Discover a random server or bot', inline: false },
                { name: '🗳️ /vote <name>', value: 'Vote for a server or bot', inline: false },
                { name: '🏆 /leaderboard [limit] [type]', value: 'Show top listings by bump count', inline: false },
                { name: '📊 /stats', value: 'Show your server listing statistics', inline: false },
                { name: '✨ /featured', value: 'Show featured server listings', inline: false },
                { name: '📋 /mylistings', value: 'Show your server/bot listings', inline: false },
                { name: '⭐ /premium', value: 'Show premium features and upgrade info', inline: false }
            )
            .addFields(
                { name: '⚙️ Admin Commands', value: '`/setup` - Configure listing channel\n`/setbumpchannel` - Set bump notifications\n`/setstatuschannel` - Set status updates', inline: false }
            )
            .setFooter({ text: 'Bot created for Discord Server Listings | Visit our website for more!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

// Handle button interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    // Handle any future button interactions here
    console.log(`Button interaction: ${interaction.customId}`);
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    client.destroy();
    process.exit(0);
});

// Start the bot
client.login(TOKEN);
