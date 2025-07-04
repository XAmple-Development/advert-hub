-- Trigger the site status update function immediately
SELECT
  net.http_post(
      url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/site-status-update',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnJ6cWR5cGJzaHluYm93cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDE0MjAsImV4cCI6MjA2NTQ3NzQyMH0.U1R8uaziBJd8ECysPjG_TQH_XboSTY7ou_3f8aEb07w"}'::jsonb,
      body:='{"trigger": "manual_start"}'::jsonb
  ) as request_id;