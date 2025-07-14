ed_at', { ascending: false })
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
