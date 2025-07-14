-- Add sample verification data for existing listings
INSERT INTO public.server_verification (listing_id, verification_status, verification_level, verified_at, verified_by)
SELECT 
  l.id as listing_id,
  CASE 
    WHEN random() < 0.3 THEN 'verified'
    WHEN random() < 0.6 THEN 'pending'
    ELSE 'verified'
  END as verification_status,
  CASE 
    WHEN random() < 0.6 THEN 'basic'
    WHEN random() < 0.8 THEN 'premium'
    ELSE 'partner'
  END as verification_level,
  CASE 
    WHEN random() < 0.7 THEN now() - (random() * 30 || ' days')::interval
    ELSE NULL
  END as verified_at,
  CASE 
    WHEN random() < 0.7 THEN (SELECT id FROM public.profiles WHERE is_admin = true LIMIT 1)
    ELSE NULL
  END as verified_by
FROM public.listings l
WHERE l.status = 'active'
AND l.id NOT IN (SELECT listing_id FROM public.server_verification)
LIMIT 10
ON CONFLICT (listing_id) DO NOTHING;