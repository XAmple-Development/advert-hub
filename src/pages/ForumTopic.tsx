import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Clock, ArrowLeft, Send, Pin, Lock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    discord_username: string | null;
    discord_avatar: string | null;
  } | null;
}

interface ForumCategory {
  id: string;
  name: string;
}

const ForumTopic = () => {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTopicData();
      incrementViewCount();
    }
  }, [id]);

  const incrementViewCount = async () => {
    if (!id) return;
    
    try {
      const { data: currentTopic } = await supabase
        .from('forum_topics')
        .select('view_count')
        .eq('id', id)
        .single();
      
      if (currentTopic) {
        await supabase
          .from('forum_topics')
          .update({ view_count: (currentTopic.view_count || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const fetchTopicData = async () => {
    try {
      setLoading(true);
      
      // Fetch topic info
      const { data: topicData, error: topicError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('id', id)
        .single();

      if (topicError) throw topicError;

      // Fetch category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('forum_categories')
        .select('id, name')
        .eq('id', topicData.category_id)
        .single();

      if (categoryError) throw categoryError;

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Get user profiles for topic and replies
      const userIds = [topicData.user_id, ...(repliesData?.map(reply => reply.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, discord_username, discord_avatar')
        .in('id', userIds);

      // Transform topic data
      const topicProfile = profilesData?.find(p => p.id === topicData.user_id);
      const transformedTopic = {
        ...topicData,
        profiles: topicProfile ? {
          username: topicProfile.username || null,
          discord_username: topicProfile.discord_username || null,
          discord_avatar: topicProfile.discord_avatar || null
        } : null
      };

      // Transform replies data
      const transformedReplies = repliesData?.map(reply => {
        const profile = profilesData?.find(p => p.id === reply.user_id);
        return {
          ...reply,
          profiles: profile ? {
            username: profile.username || null,
            discord_username: profile.discord_username || null,
            discord_avatar: profile.discord_avatar || null
          } : null
        };
      }) || [];

      setTopic(transformedTopic);
      setCategory(categoryData);
      setReplies(transformedReplies);
    } catch (error: any) {
      console.error('Error fetching topic data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch topic data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReply.trim() || !id) return;

    try {
      setSubmitting(true);
      
      // Create the reply
      const { error: replyError } = await supabase
        .from('forum_replies')
        .insert({
          topic_id: id,
          user_id: user.id,
          content: newReply.trim()
        });

      if (replyError) throw replyError;

      // Update topic's reply count and last_reply_at
      const { error: updateError } = await supabase
        .from('forum_topics')
        .update({
          reply_count: (topic?.reply_count || 0) + 1,
          last_reply_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the topic."
      });

      setNewReply('');
      fetchTopicData(); // Refresh the data
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post reply"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Loading topic...</div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Topic not found</div>
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
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/forum" className="hover:text-purple-400 transition-colors">Forum</Link>
            <span>›</span>
            {category && (
              <>
                <Link to={`/forum/category/${category.id}`} className="hover:text-purple-400 transition-colors">
                  {category.name}
                </Link>
                <span>›</span>
              </>
            )}
            <span className="text-white">{topic.title}</span>
          </div>

          {/* Topic Header */}
          <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl mb-6">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-4">
                {topic.pinned && <Pin className="h-5 w-5 text-yellow-500" />}
                {topic.locked && <Lock className="h-5 w-5 text-red-500" />}
              </div>
              
              <CardTitle className="text-3xl font-bold text-white mb-4">
                {topic.title}
              </CardTitle>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={topic.profiles?.discord_avatar || undefined} />
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="text-white font-medium">
                      {topic.profiles?.discord_username || topic.profiles?.username || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {topic.view_count} views
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {topic.reply_count} replies
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {topic.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold text-white">Replies ({replies.length})</h2>
              
              {replies.map((reply) => (
                <Card key={reply.id} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={reply.profiles?.discord_avatar || undefined} />
                        <AvatarFallback>
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">
                            {reply.profiles?.discord_username || reply.profiles?.username || 'Unknown'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="prose prose-invert max-w-none">
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Form */}
          {user && !topic.locked ? (
            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white">Post a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[120px] bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    disabled={submitting}
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newReply.trim() || submitting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-2"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : topic.locked ? (
            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
              <CardContent className="p-6 text-center">
                <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Topic Locked</h3>
                <p className="text-gray-400">This topic has been locked and no longer accepts replies.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sign In to Reply</h3>
                <p className="text-gray-400 mb-4">You need to be signed in to post replies.</p>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl px-6 py-2">
                    Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumTopic;