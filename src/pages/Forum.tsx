import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

      // Fetch recent topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles(username, discord_username, discord_avatar)
        `)
        .order('last_reply_at', { ascending: false })
        .limit(10);

      if (topicsError) throw topicsError;

      // Transform the data to match our interface
      const transformedTopics = topicsData?.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) || [];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Navbar />
      <Breadcrumbs />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
              <MessageCircle className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">Community Forum</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                  Community
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Discussions
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                  Connect with the community, share your servers and bots, get help, and discuss everything Discord.
                </p>
              </div>
              
              <Button
                onClick={handleCreateTopic}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-3 text-lg font-bold"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Topic
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Categories */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Forum Categories</h2>
              
              <div className="space-y-4">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  
                  return (
                    <Card key={category.id} className="group bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 rounded-3xl overflow-hidden">
                      <CardHeader className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-xl font-bold">
                                <Link to={`/forum/category/${category.id}`} className="hover:text-purple-400 transition-colors">
                                  {category.name}
                                </Link>
                              </CardTitle>
                              <CardDescription className="text-gray-300 text-base">
                                {category.description}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{category.topic_count || 0}</div>
                            <div className="text-sm text-gray-400">Topics</div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              
              <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                <CardHeader className="p-6">
                  <CardTitle className="text-white text-xl font-bold">Latest Topics</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {recentTopics.slice(0, 8).map((topic) => (
                      <div key={topic.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-800/30 transition-colors">
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
                            className="text-white text-sm font-medium hover:text-purple-400 transition-colors line-clamp-2"
                          >
                            {topic.title}
                          </Link>
                          
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
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
                          
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(topic.last_reply_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;