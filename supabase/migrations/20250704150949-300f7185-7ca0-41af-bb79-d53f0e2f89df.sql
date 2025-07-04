-- Schedule the site status update to run every 30 minutes
SELECT cron.schedule(
  'site-status-30min-update',
  '0,30 * * * *', -- Every 30 minutes (at minute 0 and 30)
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/site-status-update',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDE0MjAsImV4cCI6MjA2NTQ3NzQyMH0.U1R8uaziBJd8ECysPjG_TQH_XboSTY7ou_3f8aEb07w"}'::jsonb,
        body:='{"trigger": "manual"}'::jsonb
    ) as request_id;
  $$
);

-- Also trigger it immediately to send the updated message now
SELECT
  net.http_post(
      url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/site-status-update',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDE0MjAsImV4cCI6MjA2NTQ3NzQyMH0.U1R8uaziBJd8ECysPjG_TQH_XboSTY7ou_3f8aEb07w"}'::jsonb,
      body:='{"trigger": "manual"}'::jsonb
  ) as request_id;