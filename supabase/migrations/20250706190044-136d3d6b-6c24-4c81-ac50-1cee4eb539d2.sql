-- First remove the default constraint
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

-- Update existing premium subscribers to platinum
UPDATE public.profiles 
SET subscription_tier = 'platinum' 
WHERE subscription_tier::text = 'premium';

-- Update subscribers table if it exists
UPDATE public.subscribers 
SET subscription_tier = 'platinum' 
WHERE subscription_tier = 'premium';