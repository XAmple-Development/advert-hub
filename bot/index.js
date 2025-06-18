
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Environment variables
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_APPLICATION_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Commands
const commands = [
    new SlashCommandBuilder()
        .setName('bump')
        .setDescription('Bump your server listing to the top of the list'),
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the Discord bot for posting new listings')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where new listings will be posted')
                .setRequired(true)
        ),
];

// Register commands
async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');

        const rest = new REST().setToken(DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(DISCORD_CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Handle bump command
async function handleBumpCommand(interaction) {
    console.log('Processing bump command:', interaction.user.id, interaction.guild.id);
    
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    try {
        // Find listing for this server
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('discord_id', guildId)
            .single();

        if (listingError || !listing) {
            return await interaction.reply({
                content: 'No listing found for this server. Please create a listing first at our website.',
                ephemeral: true
            });
        }

        // Check cooldown (2 hours)
        const { data: cooldown } = await supabase
            .from('bump_cooldowns')
            .select('*')
            .eq('user_discord_id', userId)
            .eq('listing_id', listing.id)
            .single();

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        if (cooldown && new Date(cooldown.last_bump_at) > twoHoursAgo) {
            const nextBumpTime = new Date(new Date(cooldown.last_bump_at).getTime() + 2 * 60 * 60 * 1000);
            const timestamp = Math.floor(nextBumpTime.getTime() / 1000);
            return await interaction.reply({
                content: `⏰ You can bump again <t:${timestamp}:R>`,
                ephemeral: true
            });
        }

        // Update cooldown
        await supabase
            .from('bump_cooldowns')
            .upsert({
                user_discord_id: userId,
                listing_id: listing.id,
                last_bump_at: now.toISOString(),
            });

        // Update listing
        await supabase
            .from('listings')
            .update({
                last_bumped_at: now.toISOString(),
                bump_count: listing.bump_count + 1,
                updated_at: now.toISOString(),
            })
            .eq('id', listing.id);

        const nextBumpTimestamp = Math.floor((now.getTime() + 2 * 60 * 60 * 1000) / 1000);
        await interaction.reply({
            content: `🚀 **${listing.name}** has been bumped to the top!\n\nNext bump available <t:${nextBumpTimestamp}:R>`
        });
    } catch (error) {
        console.error('Error in bump command:', error);
        await interaction.reply({
            content: 'An error occurred while processing the bump command.',
            ephemeral: true
        });
    }
}

// Handle setup command
async function handleSetupCommand(interaction) {
    console.log('Processing setup command:', interaction.user.id, interaction.guild.id);
    
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('channel');
    
    try {
        // Save bot configuration
        await supabase
            .from('discord_bot_configs')
            .upsert({
                discord_server_id: guildId,
                listing_channel_id: channel.id,
                admin_user_id: userId,
                active: true,
                updated_at: new Date().toISOString(),
            });

        await interaction.reply({
            content: `✅ Bot setup complete! New listings will be posted to ${channel}.`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in setup command:', error);
        await interaction.reply({
            content: 'An error occurred while setting up the bot.',
            ephemeral: true
        });
    }
}

// Event handlers
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'bump') {
            await handleBumpCommand(interaction);
        } else if (commandName === 'setup') {
            await handleSetupCommand(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        const reply = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// Login
client.login(DISCORD_TOKEN);
