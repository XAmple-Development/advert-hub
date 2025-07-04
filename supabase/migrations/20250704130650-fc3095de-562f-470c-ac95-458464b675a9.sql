-- Enable pg_net extension for edge functions and cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure all required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add missing unique constraints and indexes for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Create missing triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables missing updated_at auto-update
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_themes_updated_at
    BEFORE UPDATE ON public.custom_themes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reputation_updated_at
    BEFORE UPDATE ON public.user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fix potential RLS policy conflicts by creating security definer functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles
  WHERE id = user_id
$$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_date ON public.listing_analytics(date);

-- Ensure listing_analytics has proper unique constraint
ALTER TABLE public.listing_analytics 
DROP CONSTRAINT IF EXISTS listing_analytics_listing_id_date_key;

ALTER TABLE public.listing_analytics 
ADD CONSTRAINT listing_analytics_listing_id_date_key 
UNIQUE (listing_id, date);

-- Add check constraints for data validation
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_rating_check 
CHECK (rating >= 1 AND rating <= 5);

-- Ensure proper foreign key constraints with cascading
ALTER TABLE public.user_follows 
DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;

ALTER TABLE public.user_follows 
DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;

-- Note: We can't add foreign keys to auth.users directly, but we can add constraints to profiles
ALTER TABLE public.user_reputation 
DROP CONSTRAINT IF EXISTS user_reputation_user_id_fkey;

-- Add constraint to ensure user_reputation references existing profiles
ALTER TABLE public.user_reputation 
ADD CONSTRAINT user_reputation_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure activities reference existing profiles
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE public.activities 
ADD CONSTRAINT activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix any data integrity issues
UPDATE public.listings 
SET join_count = COALESCE(join_count, 0) 
WHERE join_count IS NULL;

UPDATE public.listings 
SET view_count = COALESCE(view_count, 0) 
WHERE view_count IS NULL;

UPDATE public.listings 
SET bump_count = COALESCE(bump_count, 0) 
WHERE bump_count IS NULL;

-- Add missing NOT NULL constraints where appropriate
ALTER TABLE public.listings 
ALTER COLUMN join_count SET DEFAULT 0,
ALTER COLUMN view_count SET DEFAULT 0,
ALTER COLUMN bump_count SET DEFAULT 0;

-- Create function to safely get user subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(subscription_tier::text, 'free')
  FROM public.profiles
  WHERE id = user_id
$$;

-- Add indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_bumps_bumped_at ON public.bumps(bumped_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON public.listings(updated_at DESC);

-- Ensure RLS is enabled on all tables that need it
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bump_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_status_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;