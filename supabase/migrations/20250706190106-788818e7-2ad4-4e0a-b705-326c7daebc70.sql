-- First, update any existing premium subscribers to free temporarily
UPDATE public.profiles 
SET subscription_tier = 'free' 
WHERE subscription_tier = 'premium';

UPDATE public.subscribers 
SET subscription_tier = 'free' 
WHERE subscription_tier = 'premium';

-- Now remove the default constraint
ALTER TABLE public.profiles ALTER COLUMN subscription_tier DROP DEFAULT;

-- Update subscription_tier enum to support gold and platinum
ALTER TYPE public.subscription_tier RENAME TO subscription_tier_old;

CREATE TYPE public.subscription_tier AS ENUM ('free', 'gold', 'platinum');

-- Update tables to use the new enum
ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier TYPE public.subscription_tier 
USING subscription_tier::text::public.subscription_tier;

-- Set new default
ALTER TABLE public.profiles ALTER COLUMN subscription_tier SET DEFAULT 'free'::public.subscription_tier;

-- Drop the old enum
DROP TYPE public.subscription_tier_old;