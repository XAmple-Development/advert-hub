-- Create only the essential new tables for voting system
DO $$
BEGIN
    -- Create votes table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN
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
        
        ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
        CREATE POLICY "Users can create votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        ALTER TABLE public.votes ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_votes_target ON public.votes(target_id, target_type);
        CREATE INDEX idx_votes_date ON public.votes(vote_date);
    END IF;

    -- Add bot columns to listings table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'bot_id') THEN
        ALTER TABLE public.listings ADD COLUMN bot_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'vote_count') THEN
        ALTER TABLE public.listings ADD COLUMN vote_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'monthly_votes') THEN
        ALTER TABLE public.listings ADD COLUMN monthly_votes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'certified_bot') THEN
        ALTER TABLE public.listings ADD COLUMN certified_bot BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'library') THEN
        ALTER TABLE public.listings ADD COLUMN library TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'github_url') THEN
        ALTER TABLE public.listings ADD COLUMN github_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'commands_count') THEN
        ALTER TABLE public.listings ADD COLUMN commands_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'guilds_count') THEN
        ALTER TABLE public.listings ADD COLUMN guilds_count INTEGER DEFAULT 0;
    END IF;

    -- Create forum categories table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_categories') THEN
        CREATE TABLE public.forum_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT USING (true);
        
        -- Insert default categories
        INSERT INTO public.forum_categories (name, description, icon, sort_order) VALUES
        ('Announcements', 'Platform announcements and updates', 'Megaphone', 0),
        ('General Discussion', 'General chat and discussions', 'MessageCircle', 1),
        ('Server Showcase', 'Show off your Discord servers', 'Server', 2),
        ('Bot Showcase', 'Share your Discord bots', 'Bot', 3),
        ('Support & Help', 'Get help with the platform', 'HelpCircle', 4);
    END IF;

    -- Create forum topics table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_topics') THEN
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
        
        ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Anyone can view forum topics" ON public.forum_topics FOR SELECT USING (true);
        CREATE POLICY "Users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their topics" ON public.forum_topics FOR UPDATE USING (auth.uid() = user_id);
        
        ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON DELETE CASCADE;
        ALTER TABLE public.forum_topics ADD CONSTRAINT forum_topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_forum_topics_category ON public.forum_topics(category_id, last_reply_at DESC);
    END IF;

    -- Create forum replies table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_replies') THEN
        CREATE TABLE public.forum_replies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            topic_id UUID NOT NULL,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Anyone can view forum replies" ON public.forum_replies FOR SELECT USING (true);
        CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id);
        
        ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE;
        ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id, created_at);
    END IF;

END $$;

-- Create vote handling function
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