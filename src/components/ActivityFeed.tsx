import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Star,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  user_id: string;
  activity_type: 'listing_created' | 'listing_updated' | 'listing_bumped' | 'review_posted' | 'user_followed';
  target_id: string;
  metadata: any;
  created_at: string;
  user_profile?: {
    username: string;
    discord_avatar: string;
    discord_username: string;
  };
  target_listing?: {
    name: string;
    type: string;
  };
}

interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  following_profile: {
    username: string;
    discord_avatar: string;
    discord_username: string;
  };
}

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [following, setFollowing] = useState<UserFollow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
      fetchFollowing();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      // Simplified query - just get basic activity data for now
      const { data } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // For each activity, fetch user and listing data separately
      const enrichedActivities = await Promise.all(
        (data || []).map(async (activity) => {
          const [userResult, listingResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('username, discord_avatar, discord_username')
              .eq('id', activity.user_id)
              .single(),
            activity.target_id ? supabase
              .from('listings')
              .select('name, type')
              .eq('id', activity.target_id)
              .single() : null
          ]);

          return {
            ...activity,
            user_profile: userResult.data,
            target_listing: listingResult?.data
          };
        })
      );

      setActivities(enrichedActivities as Activity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch profile data for each followed user
      const enrichedFollowing = await Promise.all(
        (data || []).map(async (follow) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, discord_avatar, discord_username')
            .eq('id', follow.following_id)
            .single();

          return {
            ...follow,
            following_profile: profile
          };
        })
      );

      setFollowing(enrichedFollowing.filter(f => f.following_profile));
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (userId: string) => {
    try {
      await supabase
        .from('user_follows')
        .insert({
          follower_id: user?.id,
          following_id: userId
        });

      // Create activity
      await supabase
        .from('activities')
        .insert({
          user_id: user?.id,
          activity_type: 'user_followed',
          target_id: userId,
          metadata: {}
        });

      fetchFollowing();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user?.id)
        .eq('following_id', userId);

      fetchFollowing();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const isFollowing = (userId: string) => {
    return following.some(f => f.following_id === userId);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'listing_created':
        return <Star className="h-4 w-4 text-green-400" />;
      case 'listing_updated':
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case 'listing_bumped':
        return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case 'review_posted':
        return <MessageSquare className="h-4 w-4 text-orange-400" />;
      case 'user_followed':
        return <UserPlus className="h-4 w-4 text-pink-400" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const username = activity.user_profile?.username || activity.user_profile?.discord_username || 'Unknown User';
    const listingName = activity.target_listing?.name || 'a listing';
    
    switch (activity.activity_type) {
      case 'listing_created':
        return `${username} created a new ${activity.target_listing?.type || 'listing'}: ${listingName}`;
      case 'listing_updated':
        return `${username} updated their listing: ${listingName}`;
      case 'listing_bumped':
        return `${username} bumped their listing: ${listingName}`;
      case 'review_posted':
        return `${username} posted a review for: ${listingName}`;
      case 'user_followed':
        return `${username} started following someone`;
      default:
        return `${username} performed an action`;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">Loading activity feed...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Following List */}
      <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Following ({following.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {following.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {following.slice(0, 12).map(follow => (
                <div key={follow.id} className="text-center">
                  <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarImage src={follow.following_profile.discord_avatar} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {follow.following_profile.username?.[0] || follow.following_profile.discord_username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-gray-300 truncate">
                    {follow.following_profile.username || follow.following_profile.discord_username}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              You're not following anyone yet. Start following users to see their activity!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map(activity => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.user_profile?.discord_avatar} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {activity.user_profile?.username?.[0] || activity.user_profile?.discord_username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          {getActivityText(activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-gray-600/50 text-gray-400">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                      
                      {activity.target_listing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-400 hover:text-blue-300 p-1 h-6"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}

                      {activity.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => 
                            isFollowing(activity.user_id) 
                              ? unfollowUser(activity.user_id)
                              : followUser(activity.user_id)
                          }
                          className={`text-xs p-1 h-6 ${
                            isFollowing(activity.user_id)
                              ? 'text-pink-400 hover:text-pink-300'
                              : 'text-gray-400 hover:text-pink-400'
                          }`}
                        >
                          {isFollowing(activity.user_id) ? 'Unfollow' : 'Follow'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No recent activity. Follow some users to see their updates here!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityFeed;