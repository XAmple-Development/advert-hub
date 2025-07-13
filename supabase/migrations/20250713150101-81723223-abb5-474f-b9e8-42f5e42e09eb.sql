-- Advanced Analytics Tables
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  referrer TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_views INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0
);

-- Gamification Tables
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Social Features Tables
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  listing_id UUID REFERENCES listings(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  review_id UUID REFERENCES user_reviews(id) NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- Moderation Tables
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user', 'review', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance tracking
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on new tables only
DO $$
BEGIN
    -- Analytics sessions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_sessions') THEN
        ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own analytics" ON analytics_sessions FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    -- User points
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_points') THEN
        ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own points" ON user_points FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    -- User badges
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_badges') THEN
        ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view all badges" ON user_badges FOR SELECT USING (true);
    END IF;
    
    -- User reviews
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_reviews') THEN
        ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view all reviews" ON user_reviews FOR SELECT USING (true);
        CREATE POLICY "Users can manage their own reviews" ON user_reviews FOR ALL USING (user_id = auth.uid());
    END IF;
    
    -- Review votes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_votes') THEN
        ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can vote on reviews" ON review_votes FOR ALL USING (user_id = auth.uid());
    END IF;
    
    -- Reports
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports') THEN
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
        CREATE POLICY "Admins can manage reports" ON reports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
    END IF;
    
    -- Performance metrics
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics') THEN
        ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Admins can view performance metrics" ON performance_metrics FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
    END IF;
END $$;