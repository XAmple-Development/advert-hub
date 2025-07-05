-- Create user_levels table for gamification system
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  level_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Create policies for user_levels
CREATE POLICY "Users can view their own level data" 
ON public.user_levels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level data" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own level data" 
ON public.user_levels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all level data" 
ON public.user_levels 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public achievements" 
ON public.user_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage user achievements" 
ON public.user_achievements 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create user_warnings table for moderation
CREATE TABLE public.user_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moderator_id UUID NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_warnings
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_warnings
CREATE POLICY "Users can view their own warnings" 
ON public.user_warnings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all warnings" 
ON public.user_warnings 
FOR ALL 
USING (get_user_role(auth.uid()) = true);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_warnings_updated_at
  BEFORE UPDATE ON public.user_warnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create some sample achievements to make the system work
INSERT INTO public.achievements (name, description, icon, category, points_reward, rarity, conditions) VALUES
('First Steps', 'Create your first listing', '🚀', 'listings', 100, 'common', '{"listings_created": 1}'),
('Server Explorer', 'Join 5 different servers', '🌟', 'social', 150, 'common', '{"servers_joined": 5}'),
('Helpful Reviewer', 'Write 10 reviews', '📝', 'reviews', 200, 'rare', '{"reviews_written": 10}'),
('Popular Creator', 'Get 100 total views on your listings', '👀', 'listings', 300, 'rare', '{"total_views": 100}'),
('Community Leader', 'Get 50 followers', '👥', 'social', 500, 'epic', '{"followers": 50}'),
('Master Promoter', 'Create 10 active listings', '💎', 'listings', 1000, 'legendary', '{"active_listings": 10}');

-- Enable realtime for live_activity table
ALTER TABLE public.live_activity REPLICA IDENTITY FULL;
-- Add table to realtime publication (this might already be done, but it's safe to run again)
-- The realtime publication is managed by Supabase automatically