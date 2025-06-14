
-- Add Discord access token storage to profiles table
ALTER TABLE public.profiles 
ADD COLUMN discord_access_token TEXT,
ADD COLUMN discord_token_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient token lookups
CREATE INDEX idx_profiles_discord_token ON public.profiles(discord_access_token) WHERE discord_access_token IS NOT NULL;
