-- Create table to store Discord status message info
CREATE TABLE public.site_status_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_channel_id TEXT NOT NULL,
  discord_message_id TEXT NOT NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_status_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can manage status messages
CREATE POLICY "Admins can manage status messages" 
ON public.site_status_messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create index for efficient lookups
CREATE INDEX idx_site_status_messages_channel ON public.site_status_messages(discord_channel_id);