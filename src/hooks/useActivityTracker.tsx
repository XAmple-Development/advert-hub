import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TrackActivityParams {
  activity_type: string;
  target_type?: string;
  target_id?: string;
  metadata?: any;
}

export const useActivityTracker = () => {
  const { user } = useAuth();

  const trackActivity = async ({ activity_type, target_type, target_id, metadata }: TrackActivityParams) => {
    if (!user) return;

    try {
      // Track in live_activity table
      await supabase
        .from('live_activity')
        .insert({
          user_id: user.id,
          activity_type,
          target_type: target_type || 'unknown',
          target_id: target_id || user.id,
          metadata: metadata || {},
          is_public: true
        });

      // Also track in activities table for historical data
      await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_type,
          target_id: target_id || user.id,
          metadata: metadata || {}
        });

    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  return { trackActivity };
};