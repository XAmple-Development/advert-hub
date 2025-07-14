-- Create realistic sample users first
INSERT INTO public.profiles (id, username, discord_username, discord_id, discord_avatar, created_at) VALUES
(gen_random_uuid(), 'GamerKing2024', 'GamerKing2024', '123456789012345678', 'https://cdn.discordapp.com/avatars/123456789012345678/a1b2c3d4e5f6.png', now() - interval '2 years'),
(gen_random_uuid(), 'MusicMaster', 'MusicMaster#1234', '234567890123456789', 'https://cdn.discordapp.com/avatars/234567890123456789/b2c3d4e5f6a1.png', now() - interval '1.5 years'),
(gen_random_uuid(), 'CodeWizard', 'CodeWizard#5678', '345678901234567890', 'https://cdn.discordapp.com/avatars/345678901234567890/c3d4e5f6a1b2.png', now() - interval '1 year'),
(gen_random_uuid(), 'ArtisticSoul', 'ArtisticSoul#9012', '456789012345678901', 'https://cdn.discordapp.com/avatars/456789012345678901/d4e5f6a1b2c3.png', now() - interval '8 months'),
(gen_random_uuid(), 'StudyBuddy', 'StudyBuddy#3456', '567890123456789012', 'https://cdn.discordapp.com/avatars/567890123456789012/e5f6a1b2c3d4.png', now() - interval '6 months'),
(gen_random_uuid(), 'BotDeveloper', 'BotDev#7890', '678901234567890123', 'https://cdn.discordapp.com/avatars/678901234567890123/f6a1b2c3d4e5.png', now() - interval '3 years'),
(gen_random_uuid(), 'CommunityBuilder', 'ComBuilder#1111', '789012345678901234', 'https://cdn.discordapp.com/avatars/789012345678901234/a1b2c3d4e5f7.png', now() - interval '2.5 years'),
(gen_random_uuid(), 'MinecraftPro', 'MCPro#2222', '890123456789012345', 'https://cdn.discordapp.com/avatars/890123456789012345/b2c3d4e5f6a8.png', now() - interval '4 months'),
(gen_random_uuid(), 'AnimeExpert', 'AnimeExp#3333', '901234567890123456', 'https://cdn.discordapp.com/avatars/901234567890123456/c3d4e5f6a1b9.png', now() - interval '1.2 years'),
(gen_random_uuid(), 'TechGuru', 'TechGuru#4444', '012345678901234567', 'https://cdn.discordapp.com/avatars/012345678901234567/d4e5f6a1b2c0.png', now() - interval '9 months')
ON CONFLICT (id) DO NOTHING;

-- Generate 1000+ realistic server and bot listings
DO $$
DECLARE
    user_ids uuid[];
    current_user_id uuid;
    i integer;
    server_names text[] := ARRAY[
        'Epic Gaming Central', 'Chill Lounge', 'Minecraft Masters', 'Study Together', 'Art Gallery', 
        'Music Production Hub', 'Coding Bootcamp', 'Anime Paradise', 'Fitness Motivation', 'Book Club Elite',
        'Valorant Champions', 'League Legends Pro', 'Fortnite Victory', 'Among Us Crew', 'Rocket League Stars',
        'Chess Masters', 'Photography Zone', 'Cooking Community', 'Travel Adventures', 'Movie Night Club',
        'Tech Talk', 'Startup Founders', 'Crypto Traders', 'Stock Market', 'Real Estate Investors',
        'Language Learning', 'Science Nerds', 'History Buffs', 'Philosophy Corner', 'Psychology Hub',
        'Mental Health Support', 'Pet Lovers', 'Plant Parents', 'Car Enthusiasts', 'Bike Riders',
        'Runners Club', 'Yoga & Meditation', 'Weight Lifting', 'Soccer Fans', 'Basketball Court',
        'Baseball Diamond', 'Football Arena', 'Hockey Rink', 'Tennis Club', 'Golf Course',
        'Streaming Squad', 'YouTube Creators', 'TikTok Stars', 'Podcast Network', 'Blog Writers',
        'Freelancers Hub', 'Remote Workers', 'Digital Nomads', 'Side Hustle', 'Entrepreneurs',
        'College Students', 'High School Hangout', 'Teachers Lounge', 'Parent Support', 'Kids Zone'
    ];
    
    bot_names text[] := ARRAY[
        'ModBot Pro', 'Music Master', 'Game Stats', 'Utility Helper', 'Fun Commands',
        'Auto Moderator', 'Welcome Bot', 'Reaction Roles', 'Ticket Tool', 'Economy Bot',
        'Leveling System', 'Custom Commands', 'Meme Generator', 'Weather Info', 'Translation Bot',
        'Reminder Assistant', 'Poll Creator', 'Quiz Master', 'Trivia Night', 'Random Facts',
        'Daily Quotes', 'Horoscope Bot', 'News Updates', 'Stock Prices', 'Crypto Tracker',
        'Calculator Pro', 'Unit Converter', 'QR Generator', 'URL Shortener', 'Password Gen',
        'Image Search', 'GIF Finder', 'Color Picker', 'Base64 Encoder', 'JSON Formatter',
        'Server Stats', 'Member Counter', 'Voice Manager', 'Auto Role', 'Anti Spam',
        'Backup Manager', 'Audit Logger', 'Invite Tracker', 'Temp Channels', 'Music Queue',
        'Playlist Manager', 'Sound Effects', 'Voice Recorder', 'Text to Speech', 'AI Chatbot'
    ];
    
    descriptions text[] := ARRAY[
        'A vibrant community where members share their passion and connect with like-minded individuals.',
        'Join our amazing server for daily events, friendly conversations, and tons of fun activities!',
        'Professional community focused on growth, learning, and building meaningful connections.',
        'Active server with dedicated moderators, custom bots, and engaging weekly competitions.',
        'Friendly environment perfect for beginners and experts alike. Everyone is welcome here!',
        'Growing community with regular events, giveaways, and an incredibly supportive member base.',
        'The ultimate destination for enthusiasts looking to share knowledge and make new friends.',
        'Join thousands of active members in our well-organized server with something for everyone.',
        'Premium community experience with exclusive channels, expert advice, and daily discussions.',
        'Welcoming space where creativity flourishes and friendships are built to last forever.'
    ];
    
    random_discord_id bigint;
    random_member_count integer;
    random_online_count integer;
    random_description text;
    random_name text;
    random_created_at timestamp;
    listing_type text;
    random_tags text[];
    all_tags text[] := ARRAY['gaming', 'music', 'art', 'coding', 'study', 'anime', 'memes', 'chill', 'active', 'friendly', 'events', 'giveaways', 'community', 'social', 'fun', 'competitive', 'casual', 'helpful', 'welcoming', 'creative'];
BEGIN
    -- Get existing user IDs
    SELECT ARRAY(SELECT id FROM public.profiles LIMIT 10) INTO user_ids;
    
    FOR i IN 1..1200 LOOP
        -- Select random user
        current_user_id := user_ids[1 + (i % array_length(user_ids, 1))];
        
        -- Generate random data
        random_discord_id := 100000000000000000 + floor(random() * 900000000000000000)::bigint;
        random_created_at := now() - interval '1 day' * floor(random() * 365 * 3);
        
        -- Determine if server or bot (70% servers, 30% bots)
        IF random() < 0.7 THEN
            listing_type := 'server';
            random_name := server_names[1 + floor(random() * array_length(server_names, 1))];
            random_member_count := 50 + floor(random() * 50000)::integer;
            random_online_count := floor(random_member_count * (0.1 + random() * 0.4))::integer;
        ELSE
            listing_type := 'bot';
            random_name := bot_names[1 + floor(random() * array_length(bot_names, 1))];
            random_member_count := 1000 + floor(random() * 100000)::integer; -- Server count for bots
            random_online_count := 0; -- Bots don't have online count
        END IF;
        
        random_description := descriptions[1 + floor(random() * array_length(descriptions, 1))];
        
        -- Generate random tags (2-5 tags per listing)
        random_tags := ARRAY[]::text[];
        FOR j IN 1..(2 + floor(random() * 4)) LOOP
            random_tags := array_append(random_tags, all_tags[1 + floor(random() * array_length(all_tags, 1))]);
        END LOOP;
        
        INSERT INTO public.listings (
            user_id,
            name,
            description,
            long_description,
            discord_id,
            type,
            member_count,
            online_count,
            tags,
            status,
            featured,
            nsfw,
            verification_level,
            boost_level,
            vote_count,
            view_count,
            join_count,
            bump_count,
            monthly_votes,
            created_at,
            updated_at,
            last_bumped_at,
            avatar_url,
            invite_url,
            website_url,
            support_server_url,
            github_url,
            library,
            commands_count,
            guilds_count,
            certified_bot,
            verified_badge,
            premium_featured,
            priority_ranking
        ) VALUES (
            current_user_id,
            random_name || CASE WHEN i > 100 THEN ' ' || chr(65 + (i % 26)) ELSE '' END,
            random_description,
            random_description || ' We offer premium features, 24/7 support, and an amazing community experience. Join us today and discover what makes our ' || listing_type || ' special!',
            random_discord_id::text,
            listing_type::listing_type,
            random_member_count,
            random_online_count,
            random_tags,
            'active'::listing_status,
            random() < 0.05, -- 5% featured
            random() < 0.02, -- 2% NSFW
            CASE WHEN random() < 0.3 THEN 'low' WHEN random() < 0.6 THEN 'medium' WHEN random() < 0.9 THEN 'high' ELSE 'very_high' END,
            floor(random() * 4)::integer, -- 0-3 boost level
            floor(random() * 1000)::integer, -- 0-999 votes
            floor(random() * 10000)::integer, -- 0-9999 views
            floor(random() * 5000)::integer, -- 0-4999 joins
            floor(random() * 100)::integer, -- 0-99 bumps
            floor(random() * 500)::integer, -- 0-499 monthly votes
            random_created_at,
            random_created_at + interval '1 day' * floor(random() * 30),
            CASE WHEN random() < 0.8 THEN random_created_at + interval '1 day' * floor(random() * 7) ELSE NULL END,
            'https://cdn.discordapp.com/icons/' || random_discord_id || '/' || substr(md5(random()::text), 1, 32) || '.png',
            CASE WHEN listing_type = 'server' THEN 'https://discord.gg/' || substr(md5(random()::text), 1, 8) ELSE NULL END,
            CASE WHEN random() < 0.3 THEN 'https://' || lower(regexp_replace(random_name, '[^A-Za-z0-9]', '', 'g')) || '.com' ELSE NULL END,
            CASE WHEN random() < 0.2 THEN 'https://discord.gg/' || substr(md5(random()::text), 1, 8) ELSE NULL END,
            CASE WHEN listing_type = 'bot' AND random() < 0.4 THEN 'https://github.com/' || lower(regexp_replace(random_name, '[^A-Za-z0-9]', '', 'g')) ELSE NULL END,
            CASE WHEN listing_type = 'bot' THEN 
                CASE WHEN random() < 0.3 THEN 'discord.js' 
                     WHEN random() < 0.6 THEN 'discord.py' 
                     WHEN random() < 0.8 THEN 'JDA' 
                     ELSE 'eris' END 
            ELSE NULL END,
            CASE WHEN listing_type = 'bot' THEN 5 + floor(random() * 50)::integer ELSE NULL END,
            CASE WHEN listing_type = 'bot' THEN random_member_count ELSE NULL END,
            listing_type = 'bot' AND random() < 0.1, -- 10% certified bots
            random() < 0.15, -- 15% verified
            random() < 0.03, -- 3% premium featured
            CASE WHEN random() < 0.1 THEN floor(random() * 10)::integer ELSE 0 END
        );
        
        -- Occasionally add some analytics data
        IF random() < 0.3 THEN
            INSERT INTO public.listing_analytics (
                listing_id,
                date,
                views,
                joins,
                bumps,
                unique_visitors
            ) SELECT 
                l.id,
                CURRENT_DATE - (floor(random() * 30)::integer),
                floor(random() * 100)::integer,
                floor(random() * 20)::integer,
                floor(random() * 5)::integer,
                floor(random() * 80)::integer
            FROM public.listings l 
            WHERE l.discord_id = random_discord_id::text
            LIMIT 1;
        END IF;
    END LOOP;
END $$;