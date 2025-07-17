-- Create user_warnings table if it doesn't exist (it seems to exist but let's ensure proper structure)
CREATE TABLE IF NOT EXISTS public.user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_warnings
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_warnings
CREATE POLICY "Admins can manage user warnings" ON public.user_warnings
    FOR ALL USING (get_user_role(auth.uid()) = true);

-- Create policy for users to view their own warnings
CREATE POLICY "Users can view their own warnings" ON public.user_warnings
    FOR SELECT USING (user_id = auth.uid());

-- Ensure review_helpfulness table exists with proper structure
CREATE TABLE IF NOT EXISTS public.review_helpfulness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, review_id)
);

-- Enable RLS on review_helpfulness
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for review_helpfulness
CREATE POLICY "Users can manage their own helpfulness votes" ON public.review_helpfulness
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view helpfulness votes" ON public.review_helpfulness
    FOR SELECT USING (true);

-- Update reports table structure if needed
ALTER TABLE public.reports 
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Fix content_flags to use proper foreign key references
ALTER TABLE public.content_flags 
    ADD CONSTRAINT IF NOT EXISTS content_flags_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.content_flags 
    ADD CONSTRAINT IF NOT EXISTS content_flags_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Fix moderation_actions foreign key
ALTER TABLE public.moderation_actions 
    ADD CONSTRAINT IF NOT EXISTS moderation_actions_moderator_id_fkey 
    FOREIGN KEY (moderator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_warnings_updated_at
    BEFORE UPDATE ON public.user_warnings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();