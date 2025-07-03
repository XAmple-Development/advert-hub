-- Add bump_channel_id column to discord_bot_configs table for bump notifications
ALTER TABLE discord_bot_configs 
ADD COLUMN bump_channel_id text;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_discord_bot_configs_server_id 
ON discord_bot_configs(discord_server_id);

-- Update the comment for clarity
COMMENT ON COLUMN discord_bot_configs.listing_channel_id IS 'Channel where new listings are posted';
COMMENT ON COLUMN discord_bot_configs.bump_channel_id IS 'Channel where bump notifications are posted';