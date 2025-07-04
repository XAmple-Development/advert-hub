-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run auto-bump every hour
SELECT cron.schedule(
  'auto-bump-listings',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/auto-bump-listings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDE0MjAsImV4cCI6MjA2NTQ3NzQyMH0.U1R8uaziBJd8ECysPjG_TQH_XboSTY7ou_3f8aEb07w"}'::jsonb,
        body:='{"trigger": "scheduled"}'::jsonb
    ) as request_id;
  $$
);