-- Add status_channel_id column to discord_bot_configs table
ALTER TABLE public.discord_bot_configs ADD COLUMN status_channel_id TEXT;

-- Add your Discord server configuration with the status channel
INSERT INTO public.discord_bot_configs (
  discord_server_id, 
  status_channel_id, 
  admin_user_id, 
  active
) VALUES (
  '1242390702311342121',
  '1390441624512888915', 
  'system',
  true
) ON CONFLICT (discord_server_id) 
DO UPDATE SET 
  status_channel_id = EXCLUDED.status_channel_id,
  updated_at = now();