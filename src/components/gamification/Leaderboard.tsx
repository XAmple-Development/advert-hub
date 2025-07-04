import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Users, Star, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  category: string;
  score: number;
  rank: number;
  period: string;
  profile?: {
    username: string;
    discord_avatar: string;
    discord_username: string;
  };
}

const Leaderboard = () => {
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedPeriod]);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          *,
          profile:profiles(username, discord_avatar, discord_username)
        `)
        .eq('period', selectedPeriod)
        .order('rank', { ascending: true });

      if (error) throw error;

      // Group by category
      const grouped = data?.reduce((acc, entry) => {
        if (!acc[entry.category]) {
          acc[entry.category] = [];
        }
        acc[entry.category].push(entry);
        return acc;
      }, {} as Record<string, LeaderboardEntry[]>) || {};

      setLeaderboards(grouped);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-card';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'experience':
        return <TrendingUp className="h-4 w-4" />;
      case 'listings':
        return <Star className="h-4 w-4" />;
      case 'reviews':
        return <Award className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'experience':
        return 'Experience Points';
      case 'listings':
        return 'Active Listings';
      case 'reviews':
        return 'Reviews Written';
      case 'followers':
        return 'Followers';
      default:
        return category;
    }
  };

  const getScoreLabel = (category: string, score: number) => {
    switch (category) {
      case 'experience':
        return `${score.toLocaleString()} XP`;
      case 'listings':
        return `${score} listings`;
      case 'reviews':
        return `${score} reviews`;
      case 'followers':
        return `${score} followers`;
      default:
        return score.toString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all_time">All Time</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(leaderboards).map(([category, entries]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {getCategoryLabel(category)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {entries.slice(0, 10).map((entry) => (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${getRankColor(entry.rank)}`}
                        >
                          <div className="flex items-center justify-center w-8">
                            {getRankIcon(entry.rank)}
                          </div>
                          
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profile?.discord_avatar} />
                            <AvatarFallback>
                              {entry.profile?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.profile?.username || entry.profile?.discord_username || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getScoreLabel(category, entry.score)}
                            </p>
                          </div>
                          
                          {entry.rank <= 3 && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-700' :
                                entry.rank === 2 ? 'bg-gray-400/20 text-gray-700' :
                                'bg-amber-600/20 text-amber-700'
                              }`}
                            >
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      {entries.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No data available for this period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {Object.keys(leaderboards).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No leaderboard data available for this period
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;