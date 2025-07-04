import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, UserPlus, UserMinus } from 'lucide-react';
import { EnhancedLoadingSpinner, LoadingStateManager } from '@/components/enhanced/EnhancedLoadingStates';
import { Link } from 'react-router-dom';

interface FollowersFollowingListProps {
  userId: string;
  defaultTab?: 'followers' | 'following';
}

interface FollowUser {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profiles: {
    id: string;
    username: string | null;
    discord_username: string | null;
    discord_avatar: string | null;
  };
}

export const FollowersFollowingList = ({ userId, defaultTab = 'followers' }: FollowersFollowingListProps) => {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowData();
    if (user) {
      fetchFollowingStatus();
    }
  }, [userId, user]);

  const fetchFollowData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch followers with profile data
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('*, follower_profiles:profiles!user_follows_follower_id_fkey(*)')
        .eq('following_id', userId);

      if (followersError) throw followersError;

      // Fetch following with profile data
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('*, following_profiles:profiles!user_follows_following_id_fkey(*)')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      // Transform data to match expected format
      const transformedFollowers = followersData?.map(f => ({
        ...f,
        profiles: f.follower_profiles
      })) || [];

      const transformedFollowing = followingData?.map(f => ({
        ...f,
        profiles: f.following_profiles
      })) || [];

      setFollowers(transformedFollowers);
      setFollowing(transformedFollowing);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    if (!user) return;

    try {
      const allUserIds = [
        ...followers.map(f => f.follower_id),
        ...following.map(f => f.following_id)
      ].filter(id => id !== user.id);

      if (allUserIds.length === 0) return;

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', allUserIds);

      if (error) throw error;

      const statusMap = allUserIds.reduce((acc, id) => {
        acc[id] = data?.some(follow => follow.following_id === id) || false;
        return acc;
      }, {} as Record<string, boolean>);

      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Error fetching following status:', error);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!user || user.id === targetUserId) return;

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
        toast({
          title: 'Unfollowed',
          description: 'You are no longer following this user',
        });
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;

        // Create activity
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'user_followed',
          target_id: targetUserId
        });

        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
        toast({
          title: 'Following',
          description: 'You are now following this user',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update follow status',
      });
    }
  };

  const filterUsers = (users: FollowUser[]) => {
    if (!searchTerm) return users;
    
    return users.filter(follow => {
      const profile = follow.profiles;
      const username = profile.discord_username || profile.username || '';
      return username.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const UserCard = ({ follow, isFollower }: { follow: FollowUser; isFollower: boolean }) => {
    const profile = follow.profiles;
    const targetUserId = isFollower ? follow.follower_id : follow.following_id;
    const isCurrentlyFollowing = followingStatus[targetUserId];
    const isCurrentUser = user?.id === targetUserId;

    return (
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.discord_avatar || undefined} />
              <AvatarFallback>
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Link 
                to={`/profile/${targetUserId}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {profile.discord_username || profile.username || 'Anonymous User'}
              </Link>
              <p className="text-xs text-muted-foreground">
                {isFollower ? 'Following you' : 'You follow them'} • {new Date(follow.created_at).toLocaleDateString()}
              </p>
            </div>

            {user && !isCurrentUser && (
              <Button
                variant={isCurrentlyFollowing ? "outline" : "default"}
                size="sm"
                onClick={() => handleFollowToggle(targetUserId, isCurrentlyFollowing)}
              >
                {isCurrentlyFollowing ? (
                  <>
                    <UserMinus className="h-3 w-3 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Connections
        </CardTitle>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            <LoadingStateManager
              isLoading={loading}
              isError={!!error}
              isEmpty={filterUsers(followers).length === 0}
              error={error}
              onRetry={fetchFollowData}
              loadingComponent={
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-card/30 border-border/50">
                      <CardContent className="p-4">
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-24" />
                            <div className="h-3 bg-muted rounded w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }
              emptyComponent={
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Followers Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No followers match your search.' : 'This user has no followers yet.'}
                  </p>
                </div>
              }
            >
              <div className="space-y-3">
                {filterUsers(followers).map((follow) => (
                  <UserCard key={follow.id} follow={follow} isFollower={true} />
                ))}
              </div>
            </LoadingStateManager>
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            <LoadingStateManager
              isLoading={loading}
              isError={!!error}
              isEmpty={filterUsers(following).length === 0}
              error={error}
              onRetry={fetchFollowData}
              loadingComponent={
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-card/30 border-border/50">
                      <CardContent className="p-4">
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-24" />
                            <div className="h-3 bg-muted rounded w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }
              emptyComponent={
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Not Following Anyone</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No following match your search.' : 'This user is not following anyone yet.'}
                  </p>
                </div>
              }
            >
              <div className="space-y-3">
                {filterUsers(following).map((follow) => (
                  <UserCard key={follow.id} follow={follow} isFollower={false} />
                ))}
              </div>
            </LoadingStateManager>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};