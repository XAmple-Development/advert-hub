-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create analytics table for premium features
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'click', 'favorite', 'bump'
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Policy for analytics - users can view their own listing analytics
CREATE POLICY "view_own_analytics" ON public.analytics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.listings 
  WHERE listings.id = analytics.listing_id 
  AND listings.user_id = auth.uid()
));

-- Policy for analytics - anyone can insert events
CREATE POLICY "insert_analytics" ON public.analytics
FOR INSERT
WITH CHECK (true);

-- Create custom themes table
CREATE TABLE public.custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  theme_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on custom themes
ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;

-- Policy for custom themes
CREATE POLICY "manage_own_themes" ON public.custom_themes
FOR ALL
USING (user_id = auth.uid());

-- Add premium columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS premium_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_ranking INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_analytics_listing_id ON public.analytics(listing_id);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at);
CREATE INDEX idx_listings_premium_featured ON public.listings(premium_featured);
CREATE INDEX idx_listings_priority_ranking ON public.listings(priority_ranking);