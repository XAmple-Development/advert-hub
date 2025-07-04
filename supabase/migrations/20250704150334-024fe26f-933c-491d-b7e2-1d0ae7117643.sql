-- Add unique constraint to prevent duplicate status messages per channel
ALTER TABLE public.site_status_messages ADD CONSTRAINT unique_discord_channel_id UNIQUE (discord_channel_id);

-- Clean up any existing duplicates by keeping only the most recent message per channel
DELETE FROM public.site_status_messages 
WHERE id NOT IN (
  SELECT DISTINCT ON (discord_channel_id) id 
  FROM public.site_status_messages 
  ORDER BY discord_channel_id, last_updated_at DESC
);