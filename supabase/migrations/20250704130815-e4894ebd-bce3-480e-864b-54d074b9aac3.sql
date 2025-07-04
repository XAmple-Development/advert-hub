-- Add missing foreign key constraints safely
DO $$
BEGIN
    -- Add constraint to ensure user_reputation references existing profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reputation_user_id_fkey' 
        AND table_name = 'user_reputation'
    ) THEN
        ALTER TABLE public.user_reputation 
        ADD CONSTRAINT user_reputation_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Ensure activities reference existing profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'activities_user_id_fkey' 
        AND table_name = 'activities'
    ) THEN
        ALTER TABLE public.activities 
        ADD CONSTRAINT activities_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create a function to clean up orphaned records
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean up analytics records for non-existent listings
    DELETE FROM public.analytics 
    WHERE listing_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.listings WHERE id = analytics.listing_id);
    
    -- Clean up listing_analytics for non-existent listings
    DELETE FROM public.listing_analytics 
    WHERE NOT EXISTS (SELECT 1 FROM public.listings WHERE id = listing_analytics.listing_id);
    
    -- Clean up user_favorites for non-existent listings
    DELETE FROM public.user_favorites 
    WHERE NOT EXISTS (SELECT 1 FROM public.listings WHERE id = user_favorites.listing_id);
    
    -- Clean up bumps for non-existent listings
    DELETE FROM public.bumps 
    WHERE NOT EXISTS (SELECT 1 FROM public.listings WHERE id = bumps.listing_id);
    
    -- Clean up reviews for non-existent listings
    DELETE FROM public.reviews 
    WHERE NOT EXISTS (SELECT 1 FROM public.listings WHERE id = reviews.listing_id);
END;
$$;

-- Run the cleanup function
SELECT public.cleanup_orphaned_records();

-- Create a function to ensure data consistency
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure a profile exists for the user before creating related records
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.user_id, 'Unknown User')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to ensure profiles exist before creating dependent records
DROP TRIGGER IF EXISTS ensure_profile_before_activity ON public.activities;
CREATE TRIGGER ensure_profile_before_activity
    BEFORE INSERT ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_exists();

DROP TRIGGER IF EXISTS ensure_profile_before_reputation ON public.user_reputation;
CREATE TRIGGER ensure_profile_before_reputation
    BEFORE INSERT ON public.user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_exists();

-- Create function to validate analytics data
CREATE OR REPLACE FUNCTION public.validate_analytics_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure listing_id exists if provided
    IF NEW.listing_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.listings WHERE id = NEW.listing_id) THEN
            RAISE EXCEPTION 'Listing with id % does not exist', NEW.listing_id;
        END IF;
    END IF;
    
    -- Validate event_type
    IF NEW.event_type NOT IN ('view', 'join', 'bump', 'favorite', 'click') THEN
        RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for analytics validation
DROP TRIGGER IF EXISTS validate_analytics_insert ON public.analytics;
CREATE TRIGGER validate_analytics_insert
    BEFORE INSERT ON public.analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_analytics_data();