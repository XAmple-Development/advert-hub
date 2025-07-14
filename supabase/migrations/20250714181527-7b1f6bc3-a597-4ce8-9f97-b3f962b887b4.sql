-- Create realistic fake users for the listings
DO $$
DECLARE
    fake_user_data jsonb[] := ARRAY[
        '{"username": "GamerPro2024", "discord_username": "GamerPro2024#1337", "discord_id": "123456789012345001", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345001/a1b2c3d4e5f6.png"}',
        '{"username": "MusicMaestro", "discord_username": "MusicMaestro#4567", "discord_id": "123456789012345002", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345002/b2c3d4e5f6a1.png"}',
        '{"username": "DevWizard", "discord_username": "DevWizard#7890", "discord_id": "123456789012345003", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345003/c3d4e5f6a1b2.png"}',
        '{"username": "ArtisticVision", "discord_username": "ArtisticVision#2468", "discord_id": "123456789012345004", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345004/d4e5f6a1b2c3.png"}',
        '{"username": "StudyBuddy", "discord_username": "StudyBuddy#1357", "discord_id": "123456789012345005", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345005/e5f6a1b2c3d4.png"}',
        '{"username": "BotCreator", "discord_username": "BotCreator#9876", "discord_id": "123456789012345006", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345006/f6a1b2c3d4e5.png"}',
        '{"username": "CommunityLeader", "discord_username": "CommunityLeader#5432", "discord_id": "123456789012345007", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345007/a1b2c3d4e5f7.png"}',
        '{"username": "MinecraftMaster", "discord_username": "MinecraftMaster#8765", "discord_id": "123456789012345008", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345008/b2c3d4e5f6a8.png"}',
        '{"username": "AnimeExpert", "discord_username": "AnimeExpert#4321", "discord_id": "123456789012345009", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345009/c3d4e5f6a1b9.png"}',
        '{"username": "TechGuru", "discord_username": "TechGuru#6789", "discord_id": "123456789012345010", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345010/d4e5f6a1b2c0.png"}',
        '{"username": "StreamerLife", "discord_username": "StreamerLife#3456", "discord_id": "123456789012345011", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345011/e5f6a1b2c3d1.png"}',
        '{"username": "GameModerator", "discord_username": "GameModerator#7890", "discord_id": "123456789012345012", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345012/f6a1b2c3d4e2.png"}',
        '{"username": "CreativeGenius", "discord_username": "CreativeGenius#1234", "discord_id": "123456789012345013", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345013/a1b2c3d4e5f3.png"}',
        '{"username": "CodingNinja", "discord_username": "CodingNinja#5678", "discord_id": "123456789012345014", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345014/b2c3d4e5f6a4.png"}',
        '{"username": "DiscordAdmin", "discord_username": "DiscordAdmin#9012", "discord_id": "123456789012345015", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345015/c3d4e5f6a1b5.png"}',
        '{"username": "ServerOwner", "discord_username": "ServerOwner#3456", "discord_id": "123456789012345016", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345016/d4e5f6a1b2c6.png"}',
        '{"username": "BotDeveloper", "discord_username": "BotDeveloper#7890", "discord_id": "123456789012345017", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345017/e5f6a1b2c3d7.png"}',
        '{"username": "CommunityBuilder", "discord_username": "CommunityBuilder#1234", "discord_id": "123456789012345018", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345018/f6a1b2c3d4e8.png"}',
        '{"username": "EventOrganizer", "discord_username": "EventOrganizer#5678", "discord_id": "123456789012345019", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345019/a1b2c3d4e5f9.png"}',
        '{"username": "HelpfulMod", "discord_username": "HelpfulMod#9012", "discord_id": "123456789012345020", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345020/b2c3d4e5f6aa.png"}',
        '{"username": "PixelArtist", "discord_username": "PixelArtist#3456", "discord_id": "123456789012345021", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345021/c3d4e5f6a1bb.png"}',
        '{"username": "MusicProducer", "discord_username": "MusicProducer#7890", "discord_id": "123456789012345022", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345022/d4e5f6a1b2cc.png"}',
        '{"username": "GameStreamer", "discord_username": "GameStreamer#1234", "discord_id": "123456789012345023", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345023/e5f6a1b2c3dd.png"}',
        '{"username": "TechReviewer", "discord_username": "TechReviewer#5678", "discord_id": "123456789012345024", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345024/f6a1b2c3d4ee.png"}',
        '{"username": "ContentCreator", "discord_username": "ContentCreator#9012", "discord_id": "123456789012345025", "discord_avatar": "https://cdn.discordapp.com/avatars/123456789012345025/a1b2c3d4e5ff.png"}'
    ];
    user_data jsonb;
    new_user_id uuid;
    fake_user_ids uuid[] := ARRAY[]::uuid[];
    total_listings integer;
    listings_per_user integer;
    current_listing_count integer := 0;
    user_index integer := 1;
    listing_record RECORD;
BEGIN
    -- Create fake users
    FOREACH user_data IN ARRAY fake_user_data LOOP
        new_user_id := gen_random_uuid();
        fake_user_ids := array_append(fake_user_ids, new_user_id);
        
        INSERT INTO public.profiles (
            id, 
            username, 
            discord_username, 
            discord_id, 
            discord_avatar,
            subscription_tier,
            created_at
        ) VALUES (
            new_user_id,
            user_data->>'username',
            user_data->>'discord_username',
            user_data->>'discord_id',
            user_data->>'discord_avatar',
            CASE WHEN random() < 0.1 THEN 'platinum'::subscription_tier
                 WHEN random() < 0.3 THEN 'gold'::subscription_tier
                 ELSE 'free'::subscription_tier END,
            now() - interval '1 day' * floor(random() * 365 * 2)
        );
    END LOOP;
    
    -- Get total number of listings
    SELECT COUNT(*) INTO total_listings FROM public.listings;
    listings_per_user := CEIL(total_listings::float / array_length(fake_user_ids, 1));
    
    -- Update listings to distribute among fake users
    FOR listing_record IN 
        SELECT id FROM public.listings ORDER BY created_at
    LOOP
        UPDATE public.listings 
        SET user_id = fake_user_ids[user_index]
        WHERE id = listing_record.id;
        
        current_listing_count := current_listing_count + 1;
        
        -- Move to next user after distributing listings_per_user listings
        IF current_listing_count >= listings_per_user THEN
            user_index := user_index + 1;
            current_listing_count := 0;
            
            -- Reset to first user if we've used all users
            IF user_index > array_length(fake_user_ids, 1) THEN
                user_index := 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % fake users and distributed % listings among them', 
                 array_length(fake_user_ids, 1), total_listings;
END $$;