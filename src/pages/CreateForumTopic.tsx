import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send } from 'lucide-react';

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
}

const CreateForumTopic = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('id, name, description')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch forum categories"
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to create a topic"
      });
      return;
    }

    if (!title.trim() || !content.trim() || !categoryId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            category_id: categoryId,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your topic has been created successfully"
      });

      navigate('/forum');
    } catch (error: any) {
      console.error('Error creating topic:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create topic. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Loading...</div>
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
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => navigate('/forum')}
              variant="outline"
              className="mb-6 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
            
            <h1 className="text-4xl font-black text-white mb-4">
              Create New
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Discussion Topic
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Start a new conversation with the community
            </p>
          </div>

          {/* Form */}
          <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-white text-2xl font-bold">Topic Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="category" className="text-white text-lg font-medium mb-2 block">
                    Category *
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white rounded-xl h-12">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title" className="text-white text-lg font-medium mb-2 block">
                    Topic Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your topic title..."
                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-xl h-12"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-white text-lg font-medium mb-2 block">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your topic content here..."
                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-xl min-h-[200px] resize-y"
                    maxLength={5000}
                  />
                  <div className="text-right text-sm text-gray-400 mt-1">
                    {content.length}/5000 characters
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/forum')}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-xl px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !title.trim() || !content.trim() || !categoryId}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-6"
                  >
                    {loading ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Topic
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateForumTopic;