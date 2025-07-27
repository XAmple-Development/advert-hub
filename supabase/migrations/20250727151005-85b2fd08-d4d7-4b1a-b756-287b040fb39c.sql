-- Phase 1: Critical RLS Policy Implementation

-- First, let's create a secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles
  WHERE id = user_id;
$$;

-- Enable RLS on critical tables that are missing it
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bump_cooldowns ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for listings table
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can view all listings" ON public.listings;

CREATE POLICY "Public can view active listings"
ON public.listings
FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can view own listings"
ON public.listings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all listings"
ON public.listings
FOR SELECT
USING (public.is_user_admin());

CREATE POLICY "Users can insert own listings"
ON public.listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
ON public.listings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any listing"
ON public.listings
FOR UPDATE
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

CREATE POLICY "Users can delete own listings"
ON public.listings
FOR DELETE
USING (auth.uid() = user_id);

-- Secure notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role') = 'service_role' OR
  public.is_user_admin()
);

-- Secure bump_cooldowns table
DROP POLICY IF EXISTS "Service role can manage cooldowns" ON public.bump_cooldowns;
DROP POLICY IF EXISTS "Users can view bump cooldowns" ON public.bump_cooldowns;

CREATE POLICY "Users can view own listing cooldowns"
ON public.bump_cooldowns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = bump_cooldowns.listing_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Service can manage cooldowns"
ON public.bump_cooldowns
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can manage cooldowns"
ON public.bump_cooldowns
FOR ALL
USING (public.is_user_admin());

-- Phase 2: Admin Access Control - Remove the insecure admin-upgrade function
-- We'll comment it out but keep the file for reference, then create a secure version
-- The admin-upgrade function will be secured in the next migration