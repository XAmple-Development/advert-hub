-- Create more realistic fake users (without auth constraints) and distribute listings
DO $$
DECLARE
    existing_user_ids uuid[];
    fake_user_data jsonb[] := ARRAY[
        '{"username": "GamerPro2024", "discord_username": "GamerPro2024#1337"}',
        '{"username": "MusicMaestro", "discord_username": "MusicMaestro#4567"}',
        '{"username": "DevWizard", "discord_username": "DevWizard#7890"}',
        '{"username": "ArtisticVision", "discord_username": "ArtisticVision#2468"}',
        '{"username": "StudyBuddy", "discord_username": "StudyBuddy#1357"}',
        '{"username": "BotCreator", "discord_username": "BotCreator#9876"}',
        '{"username": "CommunityLeader", "discord_username": "CommunityLeader#5432"}',
        '{"username": "MinecraftMaster", "discord_username": "MinecraftMaster#8765"}',
        '{"username": "AnimeExpert", "discord_username": "AnimeExpert#4321"}',
        '{"username": "TechGuru", "discord_username": "TechGuru#6789"}',
        '{"username": "StreamerLife", "discord_username": "StreamerLife#3456"}',
        '{"username": "GameModerator", "discord_username": "GameModerator#7890"}',
        '{"username": "CreativeGenius", "discord_username": "CreativeGenius#1234"}',
        '{"username": "CodingNinja", "discord_username": "CodingNinja#5678"}',
        '{"username": "DiscordAdmin", "discord_username": "DiscordAdmin#9012"}',
        '{"username": "ServerOwner", "discord_username": "ServerOwner#3456"}',
        '{"username": "BotDeveloper", "discord_username": "BotDeveloper#7890"}',
        '{"username": "CommunityBuilder", "discord_username": "CommunityBuilder#1234"}',
        '{"username": "EventOrganizer", "discord_username": "EventOrganizer#5678"}',
        '{"username": "HelpfulMod", "discord_username": "HelpfulMod#9012"}'
    ];
    user_data jsonb;
    total_listings integer;
    listings_per_user integer;
    current_listing_count integer := 0;
    user_index integer := 1;
    listing_record RECORD;
BEGIN
    -- Get existing user IDs
    SELECT ARRAY(SELECT id FROM public.profiles ORDER BY created_at) INTO existing_user_ids;
    
    -- Update existing profiles with more realistic names
    FOR i IN 1..LEAST(array_length(existing_user_ids, 1), array_length(fake_user_data, 1)) LOOP
        user_data := fake_user_data[i];
        
        UPDATE public.profiles 
        SET 
            username = user_data->>'username',
            discord_username = user_data->>'discord_username',
            subscription_tier = CASE WHEN random() < 0.1 THEN 'platinum'::subscription_tier
                                     WHEN random() < 0.3 THEN 'gold'::subscription_tier
                                     ELSE 'free'::subscription_tier END
        WHERE id = existing_user_ids[i];
    END LOOP;
    
    -- Get total number of listings
    SELECT COUNT(*) INTO total_listings FROM public.listings;
    listings_per_user := CEIL(total_listings::float / array_length(existing_user_ids, 1));
    
    -- Redistribute all listings among existing users randomly
    FOR listing_record IN 
        SELECT id FROM public.listings ORDER BY random()
    LOOP
        UPDATE public.listings 
        SET user_id = existing_user_ids[user_index]
        WHERE id = listing_record.id;
        
        current_listing_count := current_listing_count + 1;
        
        -- Move to next user after distributing listings_per_user listings
        IF current_listing_count >= listings_per_user THEN
            user_index := user_index + 1;
            current_listing_count := 0;
            
            -- Reset to first user if we've used all users
            IF user_index > array_length(existing_user_ids, 1) THEN
                user_index := 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % existing users and distributed % listings among them', 
                 array_length(existing_user_ids, 1), total_listings;
END $$;