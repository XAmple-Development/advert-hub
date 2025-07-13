import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Plus, 
  Star, 
  Users, 
  MessageSquare,
  Eye,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveActivity {
  id: string;
  user_id: string;
  activity_type: string;
  target_id: string;
  target_type: string;
  metadata: any;
  is_public: boolean;
  created_at: string;
  profile?: {
    username: string;
    discord_avatar: string;
    discord_username: string;
  } | null;
  listing?: {
    name: string;
  } | null;
}

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('live_activity_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_activity',
          filter: 'is_public=eq.true',
        },
        (payload) => {
          console.log('Real-time activity received:', payload);
          // Fetch the complete activity with profile info
          fetchSingleActivity(payload.new.id);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('live_activity')
        .select(`
          *,
          profile:profiles(username, discord_avatar, discord_username),
          listing:listings(name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      
      console.log('Fetched activities:', data?.length || 0);
      
      // Transform data to handle potential errors in relations
      const transformedData = (data || []).map(activity => ({
        ...activity,
        profile: activity.profile && 
                 typeof activity.profile === 'object' && 
                 activity.profile !== null &&
                 !('error' in activity.profile) 
          ? activity.profile 
          : null,
        listing: activity.listing && 
                 typeof activity.listing === 'object' && 
                 activity.listing !== null &&
                 !('error' in (activity.listing as any))
          ? activity.listing
          : null
      }));
      
      setActivities(transformedData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleActivity = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_activity')
        .select(`
          *,
          profile:profiles(username, discord_avatar, discord_username),
          listing:listings(name)
        `)
        .eq('id', activityId)
        .single();

      if (error) throw error;
      
      // Transform data to handle potential errors in relations
      const transformedActivity = {
        ...data,
        profile: data.profile && 
                 typeof data.profile === 'object' && 
                 data.profile !== null &&
                 !('error' in data.profile) 
          ? data.profile 
          : null,
        listing: data.listing && 
                 typeof data.listing === 'object' && 
                 data.listing !== null &&
                 !('error' in (data.listing as any))
          ? data.listing
          : null
      };
      
      setActivities(prev => [transformedActivity, ...prev.slice(0, 49)]);
    } catch (error) {
      console.error('Error fetching single activity:', error);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'listing_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'review_posted':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'server_joined':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'comment_posted':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'viewing':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'bump':
        return <TrendingUp className="h-4 w-4 text-cyan-500" />;
      case 'vote_cast':
        return <Star className="h-4 w-4 text-pink-500" />;
      case 'user_followed':
        return <Users className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: LiveActivity) => {
    const username = activity.profile?.username || activity.profile?.discord_username || 'Someone';
    
    switch (activity.activity_type) {
      case 'listing_created':
        return `${username} created a new listing "${activity.listing?.name || 'Unknown'}"`;
      case 'review_posted':
        return `${username} posted a review on "${activity.listing?.name || 'a listing'}"`;
      case 'server_joined':
        return `${username} joined "${activity.listing?.name || 'a server'}"`;
      case 'comment_posted':
        return `${username} commented on "${activity.listing?.name || 'a listing'}"`;
      case 'viewing':
        return `${username} is viewing "${activity.listing?.name || 'a listing'}"`;
      case 'bump':
        return `${username} bumped "${activity.listing?.name || 'a listing'}"`;
      case 'vote_cast':
        return `${username} voted for "${activity.listing?.name || 'a listing'}"`;
      case 'user_followed':
        return `${username} followed another user`;
      case 'achievement_earned':
        return `${username} earned an achievement: ${activity.metadata?.achievement || 'Unknown'}`;
      case 'level_up':
        return `${username} reached level ${activity.metadata?.level || '?'}!`;
      default:
        return `${username} performed an action`;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'listing_created':
        return 'border-l-green-500';
      case 'review_posted':
        return 'border-l-yellow-500';
      case 'server_joined':
        return 'border-l-blue-500';
      case 'comment_posted':
        return 'border-l-purple-500';
      case 'vote_cast':
        return 'border-l-pink-500';
      case 'user_followed':
        return 'border-l-indigo-500';
      case 'achievement_earned':
        return 'border-l-orange-500';
      case 'level_up':
        return 'border-l-pink-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
          </CardTitle>
          <Badge variant="secondary" className="animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 hover:bg-muted/50 border-l-2 ${getActivityColor(activity.activity_type)}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={activity.profile?.discord_avatar} />
                    <AvatarFallback>
                      {activity.profile?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.activity_type)}
                      <p className="text-sm text-foreground">
                        {getActivityMessage(activity)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;