
-- Add Discord bot configuration table for servers
CREATE TABLE public.discord_bot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_server_id TEXT NOT NULL UNIQUE,
  listing_channel_id TEXT,
  admin_user_id TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add bump cooldowns tracking
CREATE TABLE public.bump_cooldowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_discord_id TEXT NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  last_bump_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_discord_id, listing_id)
);

-- Add Discord webhook URLs to listings for posting updates
ALTER TABLE public.listings ADD COLUMN discord_webhook_url TEXT;

-- Add RLS policies
ALTER TABLE public.discord_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bump_cooldowns ENABLE ROW LEVEL SECURITY;

-- Allow admins and bot to manage Discord configs
CREATE POLICY "Admins can manage Discord configs" ON public.discord_bot_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can view bump cooldowns for their listings
CREATE POLICY "Users can view bump cooldowns" ON public.bump_cooldowns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  );

-- Bot service role can manage cooldowns
CREATE POLICY "Service role can manage cooldowns" ON public.bump_cooldowns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes
CREATE INDEX idx_discord_bot_configs_server_id ON public.discord_bot_configs(discord_server_id);
CREATE INDEX idx_bump_cooldowns_user_listing ON public.bump_cooldowns(user_discord_id, listing_id);
CREATE INDEX idx_bump_cooldowns_last_bump ON public.bump_cooldowns(last_bump_at);
