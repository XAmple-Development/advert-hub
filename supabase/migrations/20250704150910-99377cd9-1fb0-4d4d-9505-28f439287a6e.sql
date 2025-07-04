-- Update cron schedule to run every 30 minutes instead of every hour

-- Remove existing cron jobs
SELECT cron.unschedule('website-status-hourly-broadcast');
SELECT cron.unschedule('site-status-hourly-update');

-- Schedule the website status broadcast to run every 30 minutes
SELECT cron.schedule(
  'website-status-30min-broadcast',
  '0,30 * * * *', -- Every 30 minutes (at minute 0 and 30)
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/website-status-broadcast',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule the site status update to run every 30 minutes
SELECT cron.schedule(
  'site-status-30min-update',
  '0,30 * * * *', -- Every 30 minutes (at minute 0 and 30)
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/site-status-update',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDE0MjAsImV4cCI6MjA2NTQ3NzQyMH0.U1R8uaziBJd8ECysPjG_TQH_XboSTY7ou_3f8aEb07w"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);