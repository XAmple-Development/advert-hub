import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Clock, Plus, Pin, Lock, Eye, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
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
  profiles?: {
    username: string | null;
    discord_username: string | null;
    discord_avatar: string | null;
  } | null;
}

const ForumCategory = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCategoryData();
    }
  }, [id]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (categoryError) throw categoryError;

      // Fetch topics in this category
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('category_id', id)
        .order('pinned', { ascending: false })
        .order('last_reply_at', { ascending: false });

      if (topicsError) throw topicsError;

      // Get user profiles for the topics
      const userIds = topicsData?.map(topic => topic.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, discord_username, discord_avatar')
        .in('id', userIds);

      // Transform the data
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

      setCategory(categoryData);
      setTopics(transformedTopics);
    } catch (error: any) {
      console.error('Error fetching category data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch category data"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Loading category...</div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Category not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 pb-20 md:pb-0">
      <Navbar />
      <Breadcrumbs />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <Link to="/forum" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Forum
            </Link>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
              <MessageCircle className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">{category.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>
              
              {user && (
                <Link to="/forum/create">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-3 text-lg font-bold">
                    <Plus className="h-5 w-5 mr-2" />
                    New Topic
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-4">
            {topics.length === 0 ? (
              <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Topics Yet</h3>
                  <p className="text-gray-400 mb-6">Be the first to start a discussion in this category!</p>
                  {user && (
                    <Link to="/forum/create">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-3">
                        <Plus className="h-5 w-5 mr-2" />
                        Create First Topic
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              topics.map((topic) => (
                <Card key={topic.id} className="group bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 rounded-3xl overflow-hidden">
                  <CardHeader className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={topic.profiles?.discord_avatar || undefined} />
                          <AvatarFallback>
                            <Users className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {topic.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                            {topic.locked && <Lock className="h-4 w-4 text-red-500" />}
                          </div>
                          
                          <CardTitle className="text-white text-xl font-bold mb-2">
                            <Link 
                              to={`/forum/topic/${topic.id}`} 
                              className="hover:text-purple-400 transition-colors"
                            >
                              {topic.title}
                            </Link>
                          </CardTitle>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                            <span>
                              by {topic.profiles?.discord_username || topic.profiles?.username || 'Unknown'}
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {topic.reply_count} replies
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {topic.view_count} views
                            </div>
                            {topic.last_reply_at && (
                              <div>
                                Last reply {formatDistanceToNow(new Date(topic.last_reply_at), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumCategory;