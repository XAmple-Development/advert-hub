-- Add voting system only (user_follows already exists)
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

-- Add bot listings support to existing listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS bot_id TEXT,
ADD COLUMN IF NOT EXISTS bot_permissions BIGINT,
ADD COLUMN IF NOT EXISTS library TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS commands_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS guilds_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS certified_bot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_votes INTEGER DEFAULT 0;

-- Add user reputation system
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  reputation_score INTEGER DEFAULT 0,
  total_votes_received INTEGER DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add premium features
CREATE TABLE IF NOT EXISTS public.premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('featured', 'priority', 'custom_theme', 'analytics_plus')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add API keys for webhooks
CREATE TABLE IF NOT EXISTS public.api_keys (
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
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_topics (
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

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "System can manage reputation" ON public.user_reputation FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Anyone can view active premium features" ON public.premium_features FOR SELECT USING (expires_at > now() OR expires_at IS NULL);
CREATE POLICY "Admins can manage premium features" ON public.premium_features FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can manage their API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view forum topics" ON public.forum_topics FOR SELECT USING (true);
CREATE POLICY "Users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their topics" ON public.forum_topics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.votes ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_reputation ADD CONSTRAINT user_reputation_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.premium_features ADD CONSTRAINT premium_features_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_votes_target ON public.votes(target_id, target_type);
CREATE INDEX idx_votes_date ON public.votes(vote_date);
CREATE INDEX idx_premium_features_listing ON public.premium_features(listing_id, expires_at);
CREATE INDEX idx_forum_topics_category ON public.forum_topics(category_id, last_reply_at DESC);
CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id, created_at);

-- Insert default forum categories (only if they don't exist)
INSERT INTO public.forum_categories (name, description, icon, sort_order) 
SELECT 'Announcements', 'Platform announcements and updates', 'Megaphone', 0
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Announcements');

INSERT INTO public.forum_categories (name, description, icon, sort_order) 
SELECT 'General Discussion', 'General chat and discussions', 'MessageCircle', 1
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'General Discussion');

INSERT INTO public.forum_categories (name, description, icon, sort_order) 
SELECT 'Server Showcase', 'Show off your Discord servers', 'Server', 2
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Server Showcase');

INSERT INTO public.forum_categories (name, description, icon, sort_order) 
SELECT 'Bot Showcase', 'Share your Discord bots', 'Bot', 3
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Bot Showcase');

INSERT INTO public.forum_categories (name, description, icon, sort_order) 
SELECT 'Support & Help', 'Get help with the platform', 'HelpCircle', 4
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Support & Help');

-- Function for vote management
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
        vote_count = COALESCE(vote_count, 0) + 1,
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