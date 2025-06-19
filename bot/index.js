
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder
} = require('discord.js');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_APPLICATION_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BUMP_COOLDOWN_MINUTES = 120; // 2 hours

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
        ),
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure the bot for posting new listings')
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel where new listings will be posted').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show top servers by bump count')
        .addIntegerOption(option =>
            option.setName('limit').setDescription('Number of servers to show (max 10)').setMinValue(1).setMaxValue(10)
        ),
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show your server listing statistics'),
    new SlashCommandBuilder()
        .setName('featured')
        .setDescription('Show featured server listings'),
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
});

// --- Cooldown Management ---
async function canBump(userId) {
    const { data, error } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bump cooldown:', error);
        return false;
    }

    if (!data) return true;

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const diff = now - lastBump;
    return diff >= BUMP_COOLDOWN_MINUTES * 60 * 1000;
}

async function timeUntilNextBump(userId) {
    const { data, error } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', userId)
        .single();

    if (error || !data) return 0;

    const lastBump = new Date(data.last_bump_at);
    const now = new Date();
    const diff = now - lastBump;
    return BUMP_COOLDOWN_MINUTES * 60 * 1000 - diff;
}

// --- Interaction Handling ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (interaction.commandName === 'bump') {
        if (!(await canBump(userId))) {
            const msLeft = await timeUntilNextBump(userId);
            const hours = Math.floor(msLeft / 3600000);
            const min = Math.floor((msLeft % 3600000) / 60000);
            return interaction.reply({ content: `⏳ Wait ${hours}h ${min}m to bump again.`, ephemeral: true });
        }

        // Find user's listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, name')
            .eq('discord_id', guildId)
            .single();

        if (listingError || !listing) {
            return interaction.reply({ 
                content: '❌ No listing found for this server. Please create a listing first on our website.', 
                ephemeral: true 
            });
        }

        const now = new Date().toISOString();

        // Update cooldown
        const { error: cooldownError } = await supabase
            .from('bump_cooldowns')
            .upsert({ 
                user_discord_id: userId, 
                listing_id: listing.id,
                last_bump_at: now 
            }, { onConflict: 'user_discord_id,listing_id' });

        if (cooldownError) {
            console.error('Error updating bump cooldown:', cooldownError);
            return interaction.reply({ content: '❌ Error registering your bump.', ephemeral: true });
        }

        // Create bump record
        const { error: bumpError } = await supabase
            .from('bumps')
            .insert({
                listing_id: listing.id,
                user_id: userId,
                bump_type: 'discord'
            });

        if (bumpError) {
            console.error('Error creating bump record:', bumpError);
            return interaction.reply({ content: '❌ Error registering your bump.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🚀 Server Bumped!')
            .setDescription(`**${listing.name}** has been bumped to the top of the list!`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'bumpstatus') {
        if (await canBump(userId)) {
            return interaction.reply({ content: '✅ You can bump now!', ephemeral: true });
        }

        const msLeft = await timeUntilNextBump(userId);
        const hours = Math.floor(msLeft / 3600000);
        const min = Math.floor((msLeft % 3600000) / 60000);
        return interaction.reply({ content: `⏳ Wait ${hours}h ${min}m to bump again.`, ephemeral: true });

    } else if (interaction.commandName === 'search') {
        const query = interaction.options.getString('query');

        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, description, featured, member_count, created_at')
            .ilike('name', `%${query}%`)
            .eq('status', 'approved')
            .limit(5);

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '🔍 No results found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Search results for "${query}"`)
            .setColor('#0099ff')
            .setTimestamp();

        listings.forEach(listing => {
            embed.addFields({
                name: `${listing.name} ${listing.featured ? '✨ [Featured]' : ''}`,
                value: `${listing.description.substring(0, 100)}...\n👥 ${listing.member_count || 0} members | Listed <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:R>`,
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

    } else if (interaction.commandName === 'leaderboard') {
        const limit = interaction.options.getInteger('limit') || 5;

        const { data: listings, error } = await supabase
            .from('listings')
            .select('name, bump_count, last_bumped_at, featured')
            .eq('status', 'approved')
            .order('bump_count', { ascending: false })
            .order('last_bumped_at', { ascending: false })
            .limit(limit);

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '📊 No listings found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top Servers by Bump Count')
            .setColor('#FFD700')
            .setTimestamp();

        listings.forEach((listing, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const lastBumped = listing.last_bumped_at ? `<t:${Math.floor(new Date(listing.last_bumped_at).getTime() / 1000)}:R>` : 'Never';
            
            embed.addFields({
                name: `${medal} ${listing.name} ${listing.featured ? '✨' : ''}`,
                value: `🚀 ${listing.bump_count || 0} bumps | Last bumped: ${lastBumped}`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'stats') {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('name, bump_count, view_count, join_count, last_bumped_at, created_at, featured')
            .eq('discord_id', guildId)
            .single();

        if (error || !listing) {
            return interaction.reply({ 
                content: '❌ No listing found for this server. Create one on our website first!', 
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
            .eq('status', 'approved')
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

    } else if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Discord Bot Commands')
            .setDescription('Here are all the available commands:')
            .setColor('#0099ff')
            .addFields(
                { name: '🚀 /bump', value: 'Bump your server listing to the top (2hr cooldown)', inline: false },
                { name: '⏰ /bumpstatus', value: 'Check your bump cooldown status', inline: false },
                { name: '🔍 /search <query>', value: 'Search for server listings by name', inline: false },
                { name: '⚙️ /setup <channel>', value: 'Configure where new listings are posted (Admin only)', inline: false },
                { name: '🏆 /leaderboard [limit]', value: 'Show top servers by bump count', inline: false },
                { name: '📊 /stats', value: 'Show your server listing statistics', inline: false },
                { name: '✨ /featured', value: 'Show featured server listings', inline: false },
                { name: '❓ /help', value: 'Show this help message', inline: false }
            )
            .setFooter({ text: 'Bot created for Discord Server Listings' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

// Start the bot
client.login(TOKEN);
