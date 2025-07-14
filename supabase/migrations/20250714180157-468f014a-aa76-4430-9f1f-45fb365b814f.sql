-- Generate 1200+ realistic server and bot listings using existing user profiles
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
        'College Students', 'High School Hangout', 'Teachers Lounge', 'Parent Support', 'Kids Zone',
        'Apex Legends Hub', 'Call of Duty Elite', 'CS:GO Pros', 'Overwatch Heroes', 'Rainbow Six Squad',
        'World of Warcraft', 'Final Fantasy XIV', 'Genshin Impact', 'Pokemon Masters', 'Animal Crossing',
        'Creative Writing', 'Poetry Corner', 'Book Reviews', 'Short Stories', 'Writing Workshop',
        'Digital Art Hub', 'Traditional Art', 'Art Critique', 'Drawing Practice', 'Painting Studio',
        'Electronic Music', 'Hip Hop Beats', 'Rock & Metal', 'Classical Music', 'Jazz Lounge',
        'Web Development', 'Mobile Apps', 'Game Development', 'AI & Machine Learning', 'Cybersecurity',
        'Math Study Group', 'Physics Forum', 'Chemistry Lab', 'Biology Research', 'Engineering Hub',
        'Spanish Learning', 'French Culture', 'Japanese Language', 'Korean Pop', 'Chinese Study',
        'Mental Wellness', 'Meditation Circle', 'Therapy Support', 'Self Improvement', 'Life Coaching',
        'Cat Lovers', 'Dog Owners', 'Bird Watchers', 'Reptile Keepers', 'Fish Tank Club',
        'Gardening Tips', 'Indoor Plants', 'Succulent Care', 'Flower Arrangements', 'Vegetable Garden',
        'Sports Cars', 'Motorcycles', 'Classic Cars', 'Electric Vehicles', 'Racing Enthusiasts',
        'Mountain Biking', 'Road Cycling', 'BMX Tricks', 'Cycling Tours', 'Bike Maintenance',
        'Marathon Training', 'Casual Jogging', 'Trail Running', 'Sprint Training', 'Running Gear',
        'Hatha Yoga', 'Vinyasa Flow', 'Meditation Practice', 'Mindfulness', 'Spiritual Growth'
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
        'Playlist Manager', 'Sound Effects', 'Voice Recorder', 'Text to Speech', 'AI Chatbot',
        'Embed Creator', 'Role Manager', 'Channel Manager', 'Message Logger', 'Join Logger',
        'Ban Manager', 'Warn System', 'Mute Manager', 'Kick Assistant', 'Timeout Bot',
        'Giveaway Bot', 'Event Planner', 'Birthday Bot', 'Reminder Pro', 'Schedule Assistant',
        'Spotify Player', 'YouTube Bot', 'SoundCloud', 'Radio Stream', 'Karaoke Bot',
        'Dice Roller', 'Card Games', 'Trivia Master', 'Word Games', 'Number Puzzle',
        'Image Editor', 'Photo Filter', 'Meme Maker', 'Avatar Generator', 'Logo Creator',
        'Server Backup', 'Data Export', 'Import Tool', 'Migration Helper', 'Clone Bot',
        'Analytics Bot', 'Activity Tracker', 'User Monitor', 'Channel Stats', 'Message Counter'
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
        'Welcoming space where creativity flourishes and friendships are built to last forever.',
        'Dedicated community with experienced moderators and helpful members ready to assist newcomers.',
        'Established server with a strong focus on quality content and meaningful conversations.',
        'Interactive community featuring regular contests, workshops, and collaborative projects.',
        'Supportive environment where members help each other achieve their goals and aspirations.',
        'Dynamic server with diverse channels covering multiple topics and interests for everyone.',
        'Exclusive community offering premium resources, expert guidance, and networking opportunities.',
        'Well-organized server with clear rules, active moderation, and a respectful atmosphere.',
        'Growing hub for enthusiasts to share experiences, learn new skills, and build lasting friendships.',
        'Professional network focused on career development, skill sharing, and industry insights.',
        'Creative space where artists, writers, and innovators come together to inspire each other.'
    ];
    
    random_discord_id bigint;
    random_member_count integer;
    random_online_count integer;
    random_description text;
    random_name text;
    random_created_at timestamp;
    listing_type text;
    random_tags text[];
    all_tags text[] := ARRAY['gaming', 'music', 'art', 'coding', 'study', 'anime', 'memes', 'chill', 'active', 'friendly', 'events', 'giveaways', 'community', 'social', 'fun', 'competitive', 'casual', 'helpful', 'welcoming', 'creative', 'professional', 'educational', 'entertainment', 'sports', 'tech', 'lifestyle', 'support', 'international', 'english', 'moderated'];
BEGIN
    -- Get existing user IDs from profiles
    SELECT ARRAY(SELECT id FROM public.profiles ORDER BY created_at LIMIT 50) INTO user_ids;
    
    -- If no users exist, create a default user
    IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) = 0 THEN
        -- Insert a default profile if none exist
        INSERT INTO public.profiles (id, username, discord_username) 
        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'SystemUser', 'SystemUser#0000');
        user_ids := ARRAY['00000000-0000-0000-0000-000000000000'::uuid];
    END IF;
    
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
            random_description || ' We offer premium features, 24/7 support, and an amazing community experience. Join us today and discover what makes our ' || listing_type || ' special! Our dedicated team works around the clock to ensure the best possible experience for all members.',
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
    END LOOP;
END $$;