-- Create analytics and community features tables

-- Enhanced analytics tracking
CREATE TABLE public.listing_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  joins INTEGER DEFAULT 0,
  bumps INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  geographic_data JSONB DEFAULT '{}',
  referrer_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, date)
);

-- User following system
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Activity feed
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('listing_created', 'listing_updated', 'listing_bumped', 'review_posted', 'user_followed')),
  target_id UUID, -- Can reference different entities based on activity_type
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced reviews with photos
ALTER TABLE public.reviews 
ADD COLUMN photos TEXT[],
ADD COLUMN helpful_count INTEGER DEFAULT 0,
ADD COLUMN verified_purchase BOOLEAN DEFAULT false;

-- Review helpfulness tracking
CREATE TABLE public.review_helpfulness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- User reputation system
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reputation_score INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  total_reviews INTEGER DEFAULT 0,
  helpful_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced filtering and categories
CREATE TABLE public.listing_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Featured listings queue
CREATE TABLE public.featured_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('premium_featured', 'trending', 'staff_pick')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_analytics
CREATE POLICY "Listing owners can view analytics" ON public.listing_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_analytics.listing_id 
    AND listings.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage analytics" ON public.listing_analytics
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows" ON public.user_follows
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
FOR ALL USING (auth.uid() = follower_id);

-- RLS Policies for activities
CREATE POLICY "Users can view activities from people they follow" ON public.activities
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = auth.uid() AND following_id = activities.user_id
  )
);

CREATE POLICY "Users can create their own activities" ON public.activities
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for review_helpfulness
CREATE POLICY "Anyone can view review helpfulness" ON public.review_helpfulness
FOR SELECT USING (true);

CREATE POLICY "Users can manage their own helpfulness votes" ON public.review_helpfulness
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_reputation
CREATE POLICY "Anyone can view user reputation" ON public.user_reputation
FOR SELECT USING (true);

CREATE POLICY "Users can view their own reputation" ON public.user_reputation
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for listing_tags
CREATE POLICY "Anyone can view tags" ON public.listing_tags
FOR SELECT USING (true);

-- RLS Policies for featured_queue
CREATE POLICY "Anyone can view active featured listings" ON public.featured_queue
FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage featured queue" ON public.featured_queue
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create indexes for performance
CREATE INDEX idx_listing_analytics_listing_date ON public.listing_analytics(listing_id, date);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_activities_user_created ON public.activities(user_id, created_at DESC);
CREATE INDEX idx_review_helpfulness_review ON public.review_helpfulness(review_id);
CREATE INDEX idx_featured_queue_active ON public.featured_queue(active, start_date, end_date);

-- Create function to update analytics
CREATE OR REPLACE FUNCTION public.update_listing_analytics(
  p_listing_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update daily analytics
  INSERT INTO public.listing_analytics (listing_id, date, views, joins, bumps)
  VALUES (
    p_listing_id, 
    CURRENT_DATE,
    CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'join' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'bump' THEN 1 ELSE 0 END
  )
  ON CONFLICT (listing_id, date)
  DO UPDATE SET
    views = listing_analytics.views + CASE WHEN p_event_type = 'view' THEN 1 ELSE 0 END,
    joins = listing_analytics.joins + CASE WHEN p_event_type = 'join' THEN 1 ELSE 0 END,
    bumps = listing_analytics.bumps + CASE WHEN p_event_type = 'bump' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;