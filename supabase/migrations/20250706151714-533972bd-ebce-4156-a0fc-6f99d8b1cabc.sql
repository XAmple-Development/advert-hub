-- Add voting system (simplified version)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('server', 'bot')),
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_address TEXT,
  UNIQUE(user_id, target_id, vote_date)
);

-- Add bot listings support
ALTER TABLE public.listings 
ADD COLUMN bot_id TEXT,
ADD COLUMN bot_permissions BIGINT,
ADD COLUMN library TEXT,
ADD COLUMN github_url TEXT,
ADD COLUMN commands_count INTEGER DEFAULT 0,
ADD COLUMN guilds_count INTEGER DEFAULT 0,
ADD COLUMN certified_bot BOOLEAN DEFAULT false,
ADD COLUMN vote_count INTEGER DEFAULT 0,
ADD COLUMN monthly_votes INTEGER DEFAULT 0;

-- Add user following system
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add user reputation system
CREATE TABLE public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  reputation_score INTEGER DEFAULT 0,
  total_votes_received INTEGER DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add premium subscriptions
CREATE TABLE public.premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('featured', 'priority', 'custom_theme', 'analytics_plus')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add API keys for webhooks
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['vote_webhook'],
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add community forums
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Votes policies
CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Following policies
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- Reputation policies
CREATE POLICY "Anyone can view reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "System can manage reputation" ON public.user_reputation FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Premium features policies
CREATE POLICY "Anyone can view active premium features" ON public.premium_features FOR SELECT USING (expires_at > now() OR expires_at IS NULL);
CREATE POLICY "Admins can manage premium features" ON public.premium_features FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- API keys policies
CREATE POLICY "Users can manage their API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- Forum policies
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view forum topics" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their topics" ON public.forum_topics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id);

-- Foreign key constraints
ALTER TABLE public.votes ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_follows ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_follows ADD CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_reputation ADD CONSTRAINT user_reputation_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.premium_features ADD CONSTRAINT premium_features_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Additional indexes for performance
CREATE INDEX idx_votes_target ON public.votes(target_id, target_type);
CREATE INDEX idx_votes_date ON public.votes(vote_date);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_premium_features_listing ON public.premium_features(listing_id, expires_at);
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category_id, last_reply_at DESC);
CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id, created_at);

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, icon, sort_order) VALUES
('Announcements', 'Platform announcements and updates', 'Megaphone', 0),
('General Discussion', 'General chat and discussions', 'MessageCircle', 1),
('Server Showcase', 'Show off your Discord servers', 'Server', 2),
('Bot Showcase', 'Share your Discord bots', 'Bot', 3),
('Support & Help', 'Get help with the platform', 'HelpCircle', 4);

-- Functions for vote management
CREATE OR REPLACE FUNCTION public.handle_vote(p_user_id UUID, p_target_id UUID, p_target_type TEXT, p_ip_address TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the vote (will fail if already voted today due to unique constraint)
    INSERT INTO public.votes (user_id, target_id, target_type, ip_address)
    VALUES (p_user_id, p_target_id, p_target_type, p_ip_address);
    
    -- Update vote counts
    UPDATE public.listings 
    SET 
        vote_count = vote_count + 1,
        monthly_votes = (
            SELECT COUNT(*) FROM public.votes v 
            WHERE v.target_id = p_target_id 
            AND v.voted_at >= date_trunc('month', now())
        )
    WHERE id = p_target_id;
    
    RETURN TRUE;
EXCEPTION 
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$;