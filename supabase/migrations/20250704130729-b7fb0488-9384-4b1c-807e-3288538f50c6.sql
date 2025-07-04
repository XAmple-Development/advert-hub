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

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_custom_themes_updated_at ON public.custom_themes;
DROP TRIGGER IF EXISTS update_user_reputation_updated_at ON public.user_reputation;

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

-- Add indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_bumps_bumped_at ON public.bumps(bumped_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON public.listings(updated_at DESC);

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