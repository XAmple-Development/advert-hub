-- Create trending algorithm table
CREATE TABLE public.trending_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  growth_velocity DECIMAL(10,4) DEFAULT 0,
  engagement_score DECIMAL(10,4) DEFAULT 0,
  trending_score DECIMAL(10,4) DEFAULT 0,
  member_growth INTEGER DEFAULT 0,
  vote_growth INTEGER DEFAULT 0,
  view_growth INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, date)
);

-- Create server verification table
CREATE TABLE public.server_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'premium', 'partner')),
  verification_criteria JSONB DEFAULT '{}',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'interest_match',
  confidence_score DECIMAL(5,4) DEFAULT 0,
  reasoning TEXT,
  metadata JSONB DEFAULT '{}',
  shown_to_user BOOLEAN DEFAULT false,
  user_interaction TEXT CHECK (user_interaction IN ('clicked', 'dismissed', 'joined', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- Create discovery categories table
CREATE TABLE public.discovery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_category_id UUID REFERENCES public.discovery_categories(id),
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create geographic regions table
CREATE TABLE public.geographic_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region_type TEXT NOT NULL CHECK (region_type IN ('country', 'continent', 'timezone')),
  parent_region_id UUID REFERENCES public.geographic_regions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create server networks table
CREATE TABLE public.server_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  network_type TEXT DEFAULT 'gaming' CHECK (network_type IN ('gaming', 'education', 'community', 'business', 'creative')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create network memberships table
CREATE TABLE public.network_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.server_networks(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(network_id, listing_id)
);

-- Create community challenges table
CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('growth', 'engagement', 'quality', 'special_event')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reward_type TEXT DEFAULT 'badge' CHECK (reward_type IN ('badge', 'premium', 'featured', 'custom')),
  reward_metadata JSONB DEFAULT '{}',
  participation_criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create challenge participations table
CREATE TABLE public.challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, listing_id)
);

-- Create analytics insights table
CREATE TABLE public.analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS on all new tables
ALTER TABLE public.trending_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Trending metrics - readable by all, writable by service
CREATE POLICY "Anyone can view trending metrics" ON public.trending_metrics FOR SELECT USING (true);
CREATE POLICY "Service can manage trending metrics" ON public.trending_metrics FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Server verification - readable by all, admin manageable
CREATE POLICY "Anyone can view verification status" ON public.server_verification FOR SELECT USING (true);
CREATE POLICY "Admins can manage verification" ON public.server_verification FOR ALL USING (get_user_role(auth.uid()) = true);

-- AI recommendations - user specific
CREATE POLICY "Users see their own recommendations" ON public.ai_recommendations FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Service can manage recommendations" ON public.ai_recommendations FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Discovery categories - readable by all, admin manageable
CREATE POLICY "Anyone can view discovery categories" ON public.discovery_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.discovery_categories FOR ALL USING (get_user_role(auth.uid()) = true);

-- Geographic regions - readable by all
CREATE POLICY "Anyone can view regions" ON public.geographic_regions FOR SELECT USING (true);

-- Server networks - public viewable, owner manageable
CREATE POLICY "Anyone can view public networks" ON public.server_networks FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "Owners can manage their networks" ON public.server_networks FOR ALL USING (owner_id = auth.uid());

-- Network memberships - network members can view
CREATE POLICY "Network members can view memberships" ON public.network_memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.server_networks WHERE id = network_id AND (is_public = true OR owner_id = auth.uid()))
);
CREATE POLICY "Network admins can manage memberships" ON public.network_memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM public.server_networks WHERE id = network_id AND owner_id = auth.uid())
);

-- Community challenges - readable by all, admin manageable
CREATE POLICY "Anyone can view active challenges" ON public.community_challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage challenges" ON public.community_challenges FOR ALL USING (get_user_role(auth.uid()) = true);

-- Challenge participations - participants can view own
CREATE POLICY "Users can view their participations" ON public.challenge_participations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their participations" ON public.challenge_participations FOR ALL USING (user_id = auth.uid());

-- Analytics insights - listing owners can view
CREATE POLICY "Listing owners can view insights" ON public.analytics_insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Service can manage insights" ON public.analytics_insights FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create indexes for performance
CREATE INDEX idx_trending_metrics_listing_date ON public.trending_metrics(listing_id, date);
CREATE INDEX idx_trending_metrics_score ON public.trending_metrics(trending_score DESC);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id, created_at DESC);
CREATE INDEX idx_ai_recommendations_listing ON public.ai_recommendations(listing_id);
CREATE INDEX idx_network_memberships_network ON public.network_memberships(network_id);
CREATE INDEX idx_challenge_participations_challenge ON public.challenge_participations(challenge_id, rank);
CREATE INDEX idx_analytics_insights_listing ON public.analytics_insights(listing_id, generated_at DESC);

-- Insert initial geographic regions
INSERT INTO public.geographic_regions (name, code, region_type) VALUES
('North America', 'NA', 'continent'),
('Europe', 'EU', 'continent'),
('Asia', 'AS', 'continent'),
('South America', 'SA', 'continent'),
('Africa', 'AF', 'continent'),
('Oceania', 'OC', 'continent');

-- Insert initial discovery categories
INSERT INTO public.discovery_categories (name, description, icon, color, sort_order) VALUES
('Gaming', 'Gaming communities and servers', 'gamepad-2', '#8b5cf6', 1),
('Technology', 'Tech discussions and programming', 'code', '#06b6d4', 2),
('Creative', 'Art, music, and creative content', 'palette', '#f59e0b', 3),
('Education', 'Learning and educational content', 'graduation-cap', '#10b981', 4),
('Social', 'General social and hangout servers', 'users', '#ef4444', 5),
('Business', 'Professional and business networking', 'briefcase', '#6366f1', 6);

-- Create function to calculate trending scores
CREATE OR REPLACE FUNCTION public.calculate_trending_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  listing_record RECORD;
  growth_velocity DECIMAL;
  engagement_score DECIMAL;
  trending_score DECIMAL;
BEGIN
  FOR listing_record IN 
    SELECT l.id, l.member_count, l.vote_count, l.view_count, l.created_at,
           COALESCE(prev_analytics.member_count, 0) as prev_member_count,
           COALESCE(prev_analytics.vote_count, 0) as prev_vote_count,
           COALESCE(prev_analytics.view_count, 0) as prev_view_count
    FROM public.listings l
    LEFT JOIN (
      SELECT listing_id, member_count, vote_count, view_count
      FROM public.trending_metrics
      WHERE date = CURRENT_DATE - INTERVAL '1 day'
    ) prev_analytics ON prev_analytics.listing_id = l.id
    WHERE l.status = 'active'
  LOOP
    -- Calculate growth velocity (weighted by recency)
    growth_velocity := (
      (listing_record.member_count - listing_record.prev_member_count) * 0.5 +
      (listing_record.vote_count - listing_record.prev_vote_count) * 0.3 +
      (listing_record.view_count - listing_record.prev_view_count) * 0.2
    );
    
    -- Calculate engagement score
    engagement_score := (
      CASE WHEN listing_record.member_count > 0 
        THEN (listing_record.vote_count::DECIMAL / listing_record.member_count) * 100
        ELSE 0 
      END
    );
    
    -- Calculate final trending score (growth velocity + engagement + recency bonus)
    trending_score := growth_velocity + engagement_score + 
      CASE WHEN listing_record.created_at > (now() - INTERVAL '30 days') THEN 10 ELSE 0 END;
    
    -- Insert or update trending metrics
    INSERT INTO public.trending_metrics (
      listing_id, date, growth_velocity, engagement_score, trending_score,
      member_growth, vote_growth, view_growth
    ) VALUES (
      listing_record.id, CURRENT_DATE, growth_velocity, engagement_score, trending_score,
      listing_record.member_count - listing_record.prev_member_count,
      listing_record.vote_count - listing_record.prev_vote_count,
      listing_record.view_count - listing_record.prev_view_count
    )
    ON CONFLICT (listing_id, date) DO UPDATE SET
      growth_velocity = EXCLUDED.growth_velocity,
      engagement_score = EXCLUDED.engagement_score,
      trending_score = EXCLUDED.trending_score,
      member_growth = EXCLUDED.member_growth,
      vote_growth = EXCLUDED.vote_growth,
      view_growth = EXCLUDED.view_growth,
      updated_at = now();
  END LOOP;
END;
$$;