import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, UserMinus, Star, Calendar, Trophy } from 'lucide-react';
import { EnhancedLoadingSpinner } from '@/components/enhanced/EnhancedLoadingStates';

interface UserProfileProps {
  userId: string;
  showFollowButton?: boolean;
}

interface Profile {
  id: string;
  username: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  created_at: string;
}

interface UserStats {
  followers: number;
  following: number;
  listings: number;
  reviews: number;
  reputation: number;
}

export const UserProfile = ({ userId, showFollowButton = true }: UserProfileProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    followers: 0,
    following: 0,
    listings: 0,
    reviews: 0,
    reputation: 0
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    if (user) {
      checkFollowStatus();
    }
  }, [userId, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch stats
      const [followersRes, followingRes, listingsRes, reviewsRes, reputationRes] = await Promise.all([
        supabase.from('user_follows').select('id').eq('following_id', userId),
        supabase.from('user_follows').select('id').eq('follower_id', userId),
        supabase.from('listings').select('id').eq('user_id', userId).eq('status', 'active'),
        supabase.from('reviews').select('id').eq('user_id', userId),
        supabase.from('user_reputation').select('reputation_score').eq('user_id', userId).single()
      ]);

      setStats({
        followers: followersRes.data?.length || 0,
        following: followingRes.data?.length || 0,
        listings: listingsRes.data?.length || 0,
        reviews: reviewsRes.data?.length || 0,
        reputation: reputationRes.data?.reputation_score || 0
      });
    } catch (error: any) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || user.id === userId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || user.id === userId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile?.discord_username || profile?.username || 'this user'}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;

        // Create activity for the follow
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'user_followed',
          target_id: userId
        });

        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        
        toast({
          title: 'Following',
          description: `You are now following ${profile?.discord_username || profile?.username || 'this user'}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update follow status',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center">
          <EnhancedLoadingSpinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">User Not Found</h3>
          <p className="text-sm text-muted-foreground">
            The user profile you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.discord_avatar || undefined} />
            <AvatarFallback className="text-lg">
              <Users className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <CardTitle className="text-xl">
              {profile.discord_username || profile.username || 'Anonymous User'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </div>
            
            {stats.reputation > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{stats.reputation} Reputation</span>
              </div>
            )}
          </div>

          {showFollowButton && user && user.id !== userId && (
            <Button
              onClick={handleFollowToggle}
              disabled={followLoading}
              variant={isFollowing ? "outline" : "default"}
              className="ml-auto"
            >
              {followLoading ? (
                <EnhancedLoadingSpinner size="sm" className="mr-2" />
              ) : isFollowing ? (
                <UserMinus className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.followers}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.following}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.listings}</div>
            <div className="text-sm text-muted-foreground">Listings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.reviews}</div>
            <div className="text-sm text-muted-foreground">Reviews</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};