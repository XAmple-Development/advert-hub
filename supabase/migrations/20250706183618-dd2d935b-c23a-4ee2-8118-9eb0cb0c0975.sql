-- Fix the cron job with the correct service role key and make auto-bump function accessible for cron
SELECT cron.unschedule('auto-bump-listings');

-- Recreate the cron job with updated service role key
SELECT cron.schedule(
  'auto-bump-listings',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/auto-bump-listings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjdkYmU3NTkzLWY5NTEtNGNmMS1hMGM3LTgzNTI5YjNkNzQ2YSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkwMTQyMCwiZXhwIjoyMDY1NDc3NDIwfQ.yoXMx2wfYpxMHRt6CtdOaXl_k5zbkGhJKPMrr-y1TJc"}'::jsonb,
        body:='{"trigger": "scheduled"}'::jsonb
    ) as request_id;
  $$
);