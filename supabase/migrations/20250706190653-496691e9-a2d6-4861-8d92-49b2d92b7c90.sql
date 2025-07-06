-- Restore premium subscribers by checking Stripe subscriptions and updating to platinum
-- We'll check the subscribers table for any active subscriptions and restore them

UPDATE public.profiles 
SET subscription_tier = 'platinum' 
WHERE id IN (
  SELECT user_id 
  FROM public.subscribers 
  WHERE subscribed = true 
  AND subscription_tier = 'free'
  AND stripe_customer_id IS NOT NULL
);

UPDATE public.subscribers 
SET subscription_tier = 'platinum'
WHERE subscribed = true 
AND subscription_tier = 'free'
AND stripe_customer_id IS NOT NULL;

-- Also update the subscriptions table
UPDATE public.subscriptions 
SET tier = 'platinum'
WHERE status = 'active' 
AND tier = 'free';