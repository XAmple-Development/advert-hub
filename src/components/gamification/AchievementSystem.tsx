import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Medal, Crown, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_reward: number;
  rarity: string;
  conditions: any;
  is_active: boolean;
  earned_at?: string;
  progress?: any;
}

interface UserLevel {
  level: number;
  experience_points: number;
  total_points_earned: number;
  level_up_at: string;
}

const AchievementSystem = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points_reward', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at, progress')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Fetch user level
      const { data: levelData, error: levelError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (levelError && levelError.code !== 'PGRST116') throw levelError;

      // Merge achievements with user progress
      const achievementsWithProgress = achievementsData?.map(achievement => {
        const userProgress = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          earned_at: userProgress?.earned_at,
          progress: userProgress?.progress
        };
      }) || [];

      setAchievements(achievementsWithProgress);
      setUserLevel(levelData);
      setEarnedAchievements(userAchievements?.map(ua => ua.achievement_id) || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-500 border-gray-500';
      case 'rare':
        return 'text-blue-500 border-blue-500';
      case 'epic':
        return 'text-purple-500 border-purple-500';
      case 'legendary':
        return 'text-yellow-500 border-yellow-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <Medal className="h-4 w-4" />;
      case 'rare':
        return <Star className="h-4 w-4" />;
      case 'epic':
        return <Trophy className="h-4 w-4" />;
      case 'legendary':
        return <Crown className="h-4 w-4" />;
      default:
        return <Medal className="h-4 w-4" />;
    }
  };

  const getNextLevelXP = (currentLevel: number) => {
    return Math.pow(currentLevel + 1, 2) * 100;
  };

  const getProgressToNextLevel = () => {
    if (!userLevel) return 0;
    const currentLevelXP = Math.pow(userLevel.level, 2) * 100;
    const nextLevelXP = getNextLevelXP(userLevel.level);
    const progressXP = userLevel.experience_points - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;
    return Math.max(0, Math.min(100, (progressXP / requiredXP) * 100));
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'listings', name: 'Listings' },
    { id: 'social', name: 'Social' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'activity', name: 'Activity' },
    { id: 'events', name: 'Events' },
    { id: 'premium', name: 'Premium' },
    { id: 'special', name: 'Special' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const earnedCount = achievements.filter(a => earnedAchievements.includes(a.id)).length;
  const totalPoints = achievements
    .filter(a => earnedAchievements.includes(a.id))
    .reduce((sum, a) => sum + a.points_reward, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Level Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Level {userLevel?.level || 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Experience Points</span>
              <span className="font-semibold">{userLevel?.experience_points || 0} XP</span>
            </div>
            <Progress value={getProgressToNextLevel()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {userLevel?.level || 1}</span>
              <span>Level {(userLevel?.level || 1) + 1}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-primary">{earnedCount}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
              <div>
                <p className="text-lg font-bold text-secondary">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div>
                <p className="text-lg font-bold text-accent">{userLevel?.level || 1}</p>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map(achievement => {
                  const isEarned = earnedAchievements.includes(achievement.id);
                  
                  return (
                    <Card 
                      key={achievement.id} 
                      className={`relative transition-all duration-200 ${
                        isEarned 
                          ? 'ring-2 ring-primary/50 bg-primary/5' 
                          : 'opacity-60 hover:opacity-80'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{achievement.name}</h3>
                              {isEarned && (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRarityColor(achievement.rarity)}`}
                              >
                                {getRarityIcon(achievement.rarity)}
                                <span className="ml-1 capitalize">{achievement.rarity}</span>
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-medium">
                                  {achievement.points_reward} XP
                                </span>
                              </div>
                            </div>
                            {achievement.earned_at && (
                              <p className="text-xs text-primary mt-2">
                                Earned {new Date(achievement.earned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {filteredAchievements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No achievements found in this category
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementSystem;