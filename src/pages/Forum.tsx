import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Users, 
  Pin, 
  Lock, 
  Eye, 
  Plus, 
  Search,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  BookOpen,
  Sparkles,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  topic_count?: number;
  latest_topic?: {
    title: string;
    created_at: string;
    user: {
      username: string | null;
      discord_username: string | null;
      discord_avatar: string | null;
    };
  };
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  view_count: number;
  last_reply_at: string;
  created_at: string;
  user_id: string;
  category_id: string;
  profiles?: {
    username: string | null;
    discord_username: string | null;
    discord_avatar: string | null;
  } | null;
}

const Forum = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentTopics, setRecentTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Fetch recent topics with user profiles
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select('*')
        .order('last_reply_at', { ascending: false })
        .limit(10);

      if (topicsError) throw topicsError;

      // Get user profiles for the topics
      const userIds = topicsData?.map(topic => topic.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, discord_username, discord_avatar')
        .in('id', userIds);

      // Transform the data to match our interface
      const transformedTopics = topicsData?.map(item => {
        const profile = profilesData?.find(p => p.id === item.user_id);
        return {
          ...item,
          profiles: profile ? {
            username: profile.username || null,
            discord_username: profile.discord_username || null,
            discord_avatar: profile.discord_avatar || null
          } : null
        };
      }) || [];

      setCategories(categoriesData || []);
      setRecentTopics(transformedTopics);
    } catch (error: any) {
      console.error('Error fetching forum data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch forum data"
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string | null) => {
    switch (iconName) {
      case 'MessageCircle':
        return MessageCircle;
      case 'Users':
        return Users;
      case 'Zap':
        return Zap;
      case 'BookOpen':
        return BookOpen;
      case 'Star':
        return Star;
      default:
        return MessageCircle;
    }
  };

  const handleCreateTopic = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to create topics"
      });
      return;
    }
    navigate('/forum/create');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/forum?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <ModernLayout>
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl" />
                ))}
              </div>
              <div className="h-96 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <ModernCard className="relative overflow-hidden mb-8 p-12 text-center" variant="premium">
          {/* Animated Background Elements */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Community Hub</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent">
                Connect & Discuss
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Join our vibrant community forum. Share your Discord servers, discover amazing bots, get help from experts, and connect with fellow Discord enthusiasts.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative flex bg-background-secondary rounded-2xl p-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search discussions, topics, and more..."
                      className="pl-12 pr-4 h-12 text-lg bg-transparent border-0 focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} size="lg" variant="cosmic" className="px-8">
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={handleCreateTopic} size="xl" variant="premium" className="group">
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Start Discussion
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/listings">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Browse Listings
                </Link>
              </Button>
            </div>
          </div>
        </ModernCard>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - Categories */}
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">Discussion Categories</h2>
              <Badge variant="outline" className="px-3 py-1">
                {categories.length} categories
              </Badge>
            </div>
            
            <div className="space-y-4">
              {categories.map((category, index) => {
                const IconComponent = getIconComponent(category.icon);
                
                return (
                  <ModernCard 
                    key={category.id} 
                    className="group hover-float" 
                    variant="glass"
                  >
                    <Link to={`/forum/category/${category.id}`} className="block p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Category Icon */}
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                              <IconComponent className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                          </div>
                          
                          {/* Category Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                              {category.name}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                              {category.description || 'Discuss everything related to this topic.'}
                            </p>
                            
                            {/* Latest Activity */}
                            {category.latest_topic && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Latest: {category.latest_topic.title}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(category.latest_topic.created_at), { addSuffix: true })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-6 text-center">
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {category.topic_count || 0}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                              Topics
                            </div>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </div>
                    </Link>
                  </ModernCard>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Forum Stats */}
            <ModernCard className="p-6" variant="premium">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Forum Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Topics</span>
                  <span className="font-bold text-lg">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-bold text-lg">5,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-bold text-lg text-green-400">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-bold text-lg">{categories.length}</span>
                </div>
              </div>
            </ModernCard>

            {/* Recent Activity */}
            <ModernCard className="p-6" variant="glass">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentTopics.slice(0, 6).map((topic) => (
                  <div key={topic.id} className="group">
                    <Link 
                      to={`/forum/topic/${topic.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors duration-200"
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={topic.profiles?.discord_avatar || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                          <Users className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          {topic.pinned && <Pin className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                          {topic.locked && <Lock className="h-3 w-3 text-red-500 flex-shrink-0" />}
                        </div>
                        
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                          {topic.title}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="truncate">
                            {topic.profiles?.discord_username || topic.profiles?.username || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {topic.reply_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {topic.view_count}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(topic.last_reply_at), { addSuffix: true })}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
                
                {recentTopics.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </ModernCard>

            {/* Quick Actions */}
            <ModernCard className="p-6" variant="glass">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateTopic}
                  variant="outline" 
                  className="w-full justify-start hover:border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/listings">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Servers
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/listings?type=bot">
                    <Zap className="h-4 w-4 mr-2" />
                    Find Bots
                  </Link>
                </Button>
              </div>
            </ModernCard>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Forum;