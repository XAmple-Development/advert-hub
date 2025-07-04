-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, category, points_reward, rarity, conditions) VALUES
('First Steps', 'Create your first Discord server listing', '🎯', 'listings', 50, 'common', '{"type": "listings_created", "count": 1}'),
('Community Builder', 'Create 5 Discord server listings', '🏗️', 'listings', 200, 'rare', '{"type": "listings_created", "count": 5}'),
('Server Master', 'Create 10 Discord server listings', '👑', 'listings', 500, 'epic', '{"type": "listings_created", "count": 10}'),
('Social Butterfly', 'Get 10 followers', '🦋', 'social', 100, 'common', '{"type": "followers_gained", "count": 10}'),
('Popular Creator', 'Get 50 followers', '⭐', 'social', 300, 'rare', '{"type": "followers_gained", "count": 50}'),
('Influencer', 'Get 100 followers', '🌟', 'social', 750, 'epic', '{"type": "followers_gained", "count": 100}'),
('Celebrity', 'Get 500 followers', '💎', 'social', 2000, 'legendary', '{"type": "followers_gained", "count": 500}'),
('Helpful Reviewer', 'Leave 5 helpful reviews', '📝', 'reviews', 75, 'common', '{"type": "helpful_reviews", "count": 5}'),
('Review Master', 'Leave 25 helpful reviews', '🏆', 'reviews', 250, 'rare', '{"type": "helpful_reviews", "count": 25}'),
('Bump Champion', 'Bump a listing 10 times', '🚀', 'activity', 150, 'common', '{"type": "bumps_created", "count": 10}'),
('Engagement King', 'Get 100 total views on your listings', '👁️', 'listings', 100, 'common', '{"type": "total_views", "count": 100}'),
('Viral Success', 'Get 1000 total views on your listings', '🔥', 'listings', 500, 'rare', '{"type": "total_views", "count": 1000}'),
('Early Adopter', 'One of the first 100 users to sign up', '🌅', 'special', 100, 'rare', '{"type": "early_user", "rank": 100}'),
('Long Time Member', 'Active for 6 months', '📅', 'activity', 200, 'rare', '{"type": "account_age_months", "count": 6}'),
('Veteran', 'Active for 1 year', '🎖️', 'activity', 500, 'epic', '{"type": "account_age_months", "count": 12}'),
('Comment Champion', 'Post 50 comments', '💬', 'social', 150, 'common', '{"type": "comments_posted", "count": 50}'),
('Event Organizer', 'Create your first server event', '🎪', 'events', 100, 'common', '{"type": "events_created", "count": 1}'),
('Party Planner', 'Create 5 server events', '🎉', 'events', 300, 'rare', '{"type": "events_created", "count": 5}'),
('Network Builder', 'Follow 25 other users', '🤝', 'social', 75, 'common', '{"type": "users_followed", "count": 25}'),
('Premium Member', 'Subscribe to premium for the first time', '⭐', 'premium', 200, 'rare', '{"type": "premium_subscription", "count": 1}');

-- Insert initial bot commands
INSERT INTO public.bot_commands (command_name, description, usage_example, category, permissions_required, cooldown_seconds) VALUES
('list', 'Create a new server listing', '/list name:My Server description:A cool server', 'listings', ARRAY['SEND_MESSAGES'], 30),
('bump', 'Bump your server to the top', '/bump server_id:123456789', 'listings', ARRAY['SEND_MESSAGES'], 3600),
('search', 'Search for servers by category or keyword', '/search query:gaming', 'utility', ARRAY['SEND_MESSAGES'], 5),
('stats', 'View your server statistics', '/stats server_id:123456789', 'utility', ARRAY['SEND_MESSAGES'], 10),
('leaderboard', 'View the top servers or users', '/leaderboard type:servers', 'utility', ARRAY['SEND_MESSAGES'], 10),
('profile', 'View user profile and achievements', '/profile user:@username', 'utility', ARRAY['SEND_MESSAGES'], 5),
('events', 'List upcoming server events', '/events server_id:123456789', 'utility', ARRAY['SEND_MESSAGES'], 10),
('report', 'Report inappropriate content', '/report type:spam target_id:123456789', 'moderation', ARRAY['SEND_MESSAGES'], 60),
('warn', 'Warn a user (moderators only)', '/warn user:@username reason:Spam', 'moderation', ARRAY['MODERATE_MEMBERS'], 0),
('ban', 'Ban a user from listings (admins only)', '/ban user:@username reason:Violation', 'moderation', ARRAY['BAN_MEMBERS'], 0),
('approve', 'Approve a pending listing (moderators only)', '/approve listing_id:123456789', 'moderation', ARRAY['MODERATE_MEMBERS'], 0),
('feature', 'Feature a listing (admins only)', '/feature listing_id:123456789 duration:24h', 'moderation', ARRAY['ADMINISTRATOR'], 0),
('invite', 'Get an invite link for a server', '/invite server_id:123456789', 'utility', ARRAY['SEND_MESSAGES'], 10),
('random', 'Get a random server recommendation', '/random category:gaming', 'fun', ARRAY['SEND_MESSAGES'], 30),
('help', 'Show help for bot commands', '/help command:list', 'utility', ARRAY['SEND_MESSAGES'], 0);

-- Insert auto moderation rules
INSERT INTO public.auto_moderation_rules (rule_name, rule_type, conditions, actions, severity) VALUES
('Spam Detection', 'spam_detection', 
 '{"keywords": ["discord.gg", "http://", "https://"], "max_links": 2, "repeated_content_threshold": 3}', 
 '{"type": "flag", "notify_mods": true, "auto_delete": false}', 2),
('Profanity Filter', 'profanity_filter', 
 '{"blocked_words": ["spam", "fake", "scam"], "severity_threshold": 3}', 
 '{"type": "delete", "notify_mods": true, "warn_user": true}', 3),
('Suspicious Links', 'link_validation', 
 '{"blocked_domains": ["bit.ly", "tinyurl.com"], "check_redirects": true}', 
 '{"type": "flag", "notify_mods": true, "quarantine": true}', 2);

-- Functions for gamification
CREATE OR REPLACE FUNCTION public.award_achievement(p_user_id UUID, p_achievement_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    achievement_record RECORD;
    user_level_record RECORD;
BEGIN
    -- Get achievement details
    SELECT * INTO achievement_record
    FROM public.achievements
    WHERE name = p_achievement_name AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user already has this achievement
    IF EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id AND achievement_id = achievement_record.id
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Award the achievement
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (p_user_id, achievement_record.id);
    
    -- Get or create user level record
    INSERT INTO public.user_levels (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Add experience points
    UPDATE public.user_levels
    SET 
        experience_points = experience_points + achievement_record.points_reward,
        total_points_earned = total_points_earned + achievement_record.points_reward,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Check for level up
    SELECT * INTO user_level_record
    FROM public.user_levels
    WHERE user_id = p_user_id;
    
    -- Simple level calculation: level = sqrt(experience_points / 100)
    DECLARE
        new_level INTEGER;
    BEGIN
        new_level := GREATEST(1, FLOOR(SQRT(user_level_record.experience_points / 100.0)));
        
        IF new_level > user_level_record.level THEN
            UPDATE public.user_levels
            SET 
                level = new_level,
                level_up_at = now(),
                updated_at = now()
            WHERE user_id = p_user_id;
            
            -- Create notification for level up
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                p_user_id,
                'achievement',
                'Level Up!',
                'Congratulations! You reached level ' || new_level || '!',
                jsonb_build_object('level', new_level, 'previous_level', user_level_record.level)
            );
        END IF;
    END;
    
    -- Create notification for achievement
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        p_user_id,
        'achievement',
        'Achievement Unlocked!',
        'You earned the "' || achievement_record.name || '" achievement!',
        jsonb_build_object('achievement', achievement_record.name, 'points', achievement_record.points_reward)
    );
    
    RETURN TRUE;
END;
$$;

-- Function to update leaderboards
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear existing leaderboards
    DELETE FROM public.leaderboards;
    
    -- Experience leaderboard
    INSERT INTO public.leaderboards (user_id, category, score, rank, period)
    SELECT 
        user_id,
        'experience',
        experience_points,
        ROW_NUMBER() OVER (ORDER BY experience_points DESC),
        'all_time'
    FROM public.user_levels
    ORDER BY experience_points DESC
    LIMIT 100;
    
    -- Listings leaderboard
    INSERT INTO public.leaderboards (user_id, category, score, rank, period)
    SELECT 
        user_id,
        'listings',
        COUNT(*),
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        'all_time'
    FROM public.listings
    WHERE status = 'active'
    GROUP BY user_id
    ORDER BY COUNT(*) DESC
    LIMIT 100;
    
    -- Reviews leaderboard
    INSERT INTO public.leaderboards (user_id, category, score, rank, period)
    SELECT 
        user_id,
        'reviews',
        COUNT(*),
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        'all_time'
    FROM public.reviews
    GROUP BY user_id
    ORDER BY COUNT(*) DESC
    LIMIT 100;
    
    -- Followers leaderboard
    INSERT INTO public.leaderboards (user_id, category, score, rank, period)
    SELECT 
        following_id as user_id,
        'followers',
        COUNT(*),
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        'all_time'
    FROM public.user_follows
    GROUP BY following_id
    ORDER BY COUNT(*) DESC
    LIMIT 100;
END;
$$;