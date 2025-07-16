import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Clock, Plus, Pin, Lock, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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
      case 'Server':
        return Users;
      case 'Bot':
        return MessageCircle;
      case 'HelpCircle':
        return MessageCircle;
      case 'Megaphone':
        return MessageCircle;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Loading forum...</div>
        </div>
      </div>
    );
  }

  return (
    <ModernLayout>
      <Navbar />
      <Breadcrumbs />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Community Forum</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
                Community Discussions
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Connect with the community, share your servers and bots, get help, and discuss everything Discord.
              </p>
            </div>
            
            <Button
              onClick={handleCreateTopic}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-xl px-6 py-3"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Topic
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">Forum Categories</h2>
            
            <div className="space-y-4">
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                
                return (
                  <ModernCard key={category.id} className="p-6" hover>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-xl">
                          <IconComponent className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">
                            <Link to={`/forum/category/${category.id}`} className="hover:text-primary transition-colors">
                              {category.name}
                            </Link>
                          </h3>
                          <p className="text-muted-foreground text-base">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">{category.topic_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Topics</div>
                      </div>
                    </div>
                  </ModernCard>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
            
            <ModernCard className="p-6" variant="glass">
              <h3 className="text-xl font-bold mb-6">Latest Topics</h3>
              <div className="space-y-4">
                {recentTopics.slice(0, 8).map((topic) => (
                  <div key={topic.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={topic.profiles?.discord_avatar || undefined} />
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                        {topic.locked && <Lock className="h-3 w-3 text-red-500" />}
                      </div>
                      
                      <Link
                        to={`/forum/topic/${topic.id}`}
                        className="text-foreground text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                      >
                        {topic.title}
                      </Link>
                      
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          by {topic.profiles?.discord_username || topic.profiles?.username || 'Unknown'}
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
                  </div>
                ))}
              </div>
            </ModernCard>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Forum;