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
const BUMP_COOLDOWN_MINUTES = 60;

const commands = [
    new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bump your server listing if cooldown expired'),
    new SlashCommandBuilder()
        .setName('bumpstatus')
        .setDescription('Check your bump cooldown status'),
    new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search server listings by name')
        .addStringOption(option =>
            option.setName('query').setDescription('Name or part of the server name to search').setRequired(true)
        ),
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
        .from('bumps')
        .select('last_bump')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bump cooldown:', error);
        return false;
    }

    if (!data) return true;

    const lastBump = new Date(data.last_bump);
    const now = new Date();
    const diff = now - lastBump;
    return diff >= BUMP_COOLDOWN_MINUTES * 60 * 1000;
}

async function timeUntilNextBump(userId) {
    const { data, error } = await supabase
        .from('bumps')
        .select('last_bump')
        .eq('user_id', userId)
        .single();

    if (error || !data) return 0;

    const lastBump = new Date(data.last_bump);
    const now = new Date();
    const diff = now - lastBump;
    return BUMP_COOLDOWN_MINUTES * 60 * 1000 - diff;
}

// --- Interaction Handling ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;

    if (interaction.commandName === 'bump') {
        if (!(await canBump(userId))) {
            const msLeft = await timeUntilNextBump(userId);
            const min = Math.floor(msLeft / 60000);
            const sec = Math.floor((msLeft % 60000) / 1000);
            return interaction.reply({ content: `⏳ Wait ${min}m ${sec}s to bump again.`, ephemeral: true });
        }

        const now = new Date().toISOString();

        const { error } = await supabase
            .from('bumps')
            .upsert({ user_id: userId, last_bump: now }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating bump time:', error);
            return interaction.reply({ content: '❌ Error registering your bump.', ephemeral: true });
        }

        await interaction.reply({ content: '✅ Server bumped!', ephemeral: true });

    } else if (interaction.commandName === 'bumpstatus') {
        if (await canBump(userId)) {
            return interaction.reply({ content: '✅ You can bump now!', ephemeral: true });
        }

        const msLeft = await timeUntilNextBump(userId);
        const min = Math.floor(msLeft / 60000);
        const sec = Math.floor((msLeft % 60000) / 1000);
        return interaction.reply({ content: `⏳ Wait ${min}m ${sec}s to bump again.`, ephemeral: true });

    } else if (interaction.commandName === 'search') {
        const query = interaction.options.getString('query');

        const { data: listings, error } = await supabase
            .from('listings')
            .select('id, name, featured, created_at')
            .ilike('name', `%${query}%`)
            .limit(5);

        if (error || !listings || listings.length === 0) {
            return interaction.reply({ content: '🔍 No results found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Search results for "${query}"`)
            .setColor('#0099ff')
            .setTimestamp(new Date());

        listings.forEach(listing => {
            embed.addFields({
                name: `${listing.name} ${listing.featured ? '✅ [Featured]' : ''}`,
                value: `Listed on <t:${Math.floor(new Date(listing.created_at).getTime() / 1000)}:d>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

// --- New Listing Notifications ---
let lastCheck = new Date();

async function notifyNewListings() {
    try {
        const { data: newListings, error: listingError } = await supabase
            .from('listings')
            .select('id, name, featured, created_at')
            .gt('created_at', lastCheck.toISOString());

        if (listingError) {
            console.error('Error fetching listings:', listingError);
            return;
        }

        if (!newListings || newListings.length === 0) return;

        console.log(`🆕 Found ${newListings.length} new listing(s).`);

        const { data: configs, error: configError } = await supabase
            .from('discord_bot_configs')
            .select('discord_server_id, listing_channel_id');

        if (configError) {
            console.error('Error fetching configs:', configError);
            return;
        }

        for (const config of configs) {
            try {
                const channel = await client.channels.fetch(config.listing_channel_id);
                if (!channel?.isTextBased()) continue;

                for (const listing of newListings) {
                    const embed = new EmbedBuilder()
                        .setTitle(`${listing.name} ${listing.featured ? '✅ [Featured]' : ''}`)
                        .setDescription(`A new server listing has been added!`)
                        .setColor(listing.featured ? '#00FF00' : '#0099ff')
                        .setTimestamp(new Date(listing.created_at));

                    await channel.send({ embeds: [embed] });
                }

                console.log(`✅ Sent ${newListings.length} to guild ${config.discord_server_id}`);
            } catch (err) {
                console.error(`❌ Failed to send to channel ${config.listing_channel_id}:`, err.message);
            }
        }

        const newestTime = newListings
            .map(l => new Date(l.created_at))
            .sort((a, b) => b - a)[0];
        lastCheck = new Date(newestTime.getTime() + 1000);

    } catch (err) {
        console.error('Unexpected error in notifyNewListings:', err);
    }
}

// Run every 10 seconds
setInterval(notifyNewListings, 10 * 1000);

// Start the bot
client.login(TOKEN);
