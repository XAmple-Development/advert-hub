-- Enable the pg_cron extension for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the website status broadcast to run every hour
SELECT cron.schedule(
  'website-status-hourly-broadcast',
  '0 * * * *', -- Every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/website-status-broadcast',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);