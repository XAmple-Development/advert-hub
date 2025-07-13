-- Enable real-time for live_activity table
ALTER TABLE public.live_activity REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_activity;