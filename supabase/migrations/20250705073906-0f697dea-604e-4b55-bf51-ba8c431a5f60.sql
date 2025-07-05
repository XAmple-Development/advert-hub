-- Update the leaderboard update function to include experience points
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear existing leaderboards
    DELETE FROM public.leaderboards;
    
    -- Experience leaderboard (from user_levels table)
    INSERT INTO public.leaderboards (user_id, category, score, rank, period)
    SELECT 
        user_id,
        'experience',
        experience_points,
        ROW_NUMBER() OVER (ORDER BY experience_points DESC),
        'all_time'
    FROM public.user_levels
    WHERE experience_points > 0
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
    HAVING COUNT(*) > 0
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
    HAVING COUNT(*) > 0
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
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC
    LIMIT 100;
END;
$$;

-- Run the updated function
SELECT public.update_leaderboards();