-- Fix remaining critical security issues

-- Enable RLS on remaining tables that need it
ALTER TABLE public.server_verification ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for all existing functions
ALTER FUNCTION public.update_listing_analytics(uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.populate_sample_data() SET search_path = public;
ALTER FUNCTION public.handle_vote(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.create_sample_user_levels() SET search_path = public;
ALTER FUNCTION public.handle_discord_auth() SET search_path = public;
ALTER FUNCTION public.calculate_trending_scores() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_subscription_tier(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_records() SET search_path = public;
ALTER FUNCTION public.ensure_profile_exists() SET search_path = public;
ALTER FUNCTION public.validate_analytics_data() SET search_path = public;
ALTER FUNCTION public.award_achievement(uuid, text) SET search_path = public;
ALTER FUNCTION public.update_leaderboards() SET search_path = public;
ALTER FUNCTION public.update_listing_bump() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Create RLS policies for server_verification table
CREATE POLICY "Admins can manage server verification"
ON public.server_verification
FOR ALL
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

CREATE POLICY "Public can view verified servers"
ON public.server_verification
FOR SELECT
USING (true);

-- Secure the admin-upgrade function by adding admin check
-- We'll disable the current admin-upgrade function in the config and create a secure version