
-- Add admin role to the existing subscription_tier enum or create a new role system
-- First, let's add an admin flag to profiles for simplicity
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create an admin_actions table to track review actions
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can create admin actions
CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Update listings RLS policy to allow admins to see all listings including pending ones
CREATE POLICY "Admins can view all listings" ON public.listings
  FOR SELECT USING (
    status = 'active' OR 
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to update listing status
CREATE POLICY "Admins can update listing status" ON public.listings
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create indexes for better performance
CREATE INDEX idx_admin_actions_listing_id ON public.admin_actions(listing_id);
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
