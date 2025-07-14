-- Fix the calculate_trending_scores function
CREATE OR REPLACE FUNCTION public.calculate_trending_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  listing_record RECORD;
  growth_velocity DECIMAL;
  engagement_score DECIMAL;
  trending_score DECIMAL;
BEGIN
  FOR listing_record IN 
    SELECT l.id, l.member_count, l.vote_count, l.view_count, l.created_at,
           COALESCE(prev_metrics.member_growth, 0) as prev_member_count,
           COALESCE(prev_metrics.vote_growth, 0) as prev_vote_count,
           COALESCE(prev_metrics.view_growth, 0) as prev_view_count
    FROM public.listings l
    LEFT JOIN (
      SELECT listing_id, member_growth, vote_growth, view_growth
      FROM public.trending_metrics
      WHERE date = CURRENT_DATE - INTERVAL '1 day'
    ) prev_metrics ON prev_metrics.listing_id = l.id
    WHERE l.status = 'active'
  LOOP
    -- Calculate growth velocity (weighted by recency)
    growth_velocity := (
      (COALESCE(listing_record.member_count, 0) - listing_record.prev_member_count) * 0.5 +
      (COALESCE(listing_record.vote_count, 0) - listing_record.prev_vote_count) * 0.3 +
      (COALESCE(listing_record.view_count, 0) - listing_record.prev_view_count) * 0.2
    );
    
    -- Calculate engagement score
    engagement_score := (
      CASE WHEN COALESCE(listing_record.member_count, 0) > 0 
        THEN (COALESCE(listing_record.vote_count, 0)::DECIMAL / listing_record.member_count) * 100
        ELSE 0 
      END
    );
    
    -- Calculate final trending score (growth velocity + engagement + recency bonus)
    trending_score := growth_velocity + engagement_score + 
      CASE WHEN listing_record.created_at > (now() - INTERVAL '30 days') THEN 10 ELSE 0 END;
    
    -- Insert or update trending metrics
    INSERT INTO public.trending_metrics (
      listing_id, date, growth_velocity, engagement_score, trending_score,
      member_growth, vote_growth, view_growth
    ) VALUES (
      listing_record.id, CURRENT_DATE, growth_velocity, engagement_score, trending_score,
      COALESCE(listing_record.member_count, 0) - listing_record.prev_member_count,
      COALESCE(listing_record.vote_count, 0) - listing_record.prev_vote_count,
      COALESCE(listing_record.view_count, 0) - listing_record.prev_view_count
    )
    ON CONFLICT (listing_id, date) DO UPDATE SET
      growth_velocity = EXCLUDED.growth_velocity,
      engagement_score = EXCLUDED.engagement_score,
      trending_score = EXCLUDED.trending_score,
      member_growth = EXCLUDED.member_growth,
      vote_growth = EXCLUDED.vote_growth,
      view_growth = EXCLUDED.view_growth,
      updated_at = now();
  END LOOP;
END;
$function$;