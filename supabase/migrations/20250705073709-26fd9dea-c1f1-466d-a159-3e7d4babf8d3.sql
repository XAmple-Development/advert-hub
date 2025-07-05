-- Create a function to populate sample live activity data
CREATE OR REPLACE FUNCTION public.populate_sample_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sample_user_id UUID;
    sample_listing_id UUID;
BEGIN
    -- Get a sample user ID (first user)
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Get a sample listing ID
    SELECT id INTO sample_listing_id FROM public.listings WHERE status = 'active' LIMIT 1;
    
    -- If we have users and listings, create some sample data
    IF sample_user_id IS NOT NULL THEN
        -- Insert sample live activity
        INSERT INTO public.live_activity (user_id, activity_type, target_type, target_id, metadata, is_public) 
        VALUES 
        (sample_user_id, 'listing_created', 'listing', COALESCE(sample_listing_id, gen_random_uuid()), '{"description": "New Discord server listing created"}', true),
        (sample_user_id, 'server_joined', 'listing', COALESCE(sample_listing_id, gen_random_uuid()), '{"server_name": "Sample Server"}', true),
        (sample_user_id, 'review_posted', 'listing', COALESCE(sample_listing_id, gen_random_uuid()), '{"rating": 5}', true),
        (sample_user_id, 'achievement_earned', 'achievement', gen_random_uuid(), '{"achievement": "First Steps"}', true),
        (sample_user_id, 'level_up', 'user', sample_user_id, '{"level": 2}', true)
        ON CONFLICT DO NOTHING;
        
        -- Create initial user level if it doesn't exist
        INSERT INTO public.user_levels (user_id, level, experience_points, total_points_earned)
        VALUES (sample_user_id, 1, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END;
$$;