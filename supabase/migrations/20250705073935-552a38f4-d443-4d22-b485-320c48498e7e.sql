-- Add some sample user levels with experience points for testing
CREATE OR REPLACE FUNCTION public.create_sample_user_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Create user levels for existing users who have listings or activities
    FOR user_record IN 
        SELECT DISTINCT user_id FROM public.listings 
        UNION 
        SELECT DISTINCT user_id FROM public.live_activity WHERE user_id IS NOT NULL
    LOOP
        INSERT INTO public.user_levels (user_id, level, experience_points, total_points_earned)
        VALUES (
            user_record.user_id, 
            1 + floor(random() * 5)::int, -- Random level 1-5
            100 + floor(random() * 1000)::int, -- Random XP 100-1100
            100 + floor(random() * 1000)::int -- Random total points
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            experience_points = GREATEST(user_levels.experience_points, 100 + floor(random() * 1000)::int),
            level = GREATEST(user_levels.level, 1 + floor(random() * 3)::int);
    END LOOP;
END;
$$;

-- Run the function
SELECT public.create_sample_user_levels();

-- Update leaderboards again with the new data
SELECT public.update_leaderboards();