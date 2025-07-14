import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Users, Heart, X, RefreshCw, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  type: string;
  member_count: number;
  score: number;
  reasoning: string;
}

const SmartRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get AI recommendations
      const { data, error } = await supabase.functions.invoke('ai-server-recommendations', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load personalized recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (recommendationId: string, listingId: string) => {
    try {
      // Update recommendation interaction
      await supabase
        .from('ai_recommendations')
        .update({ user_interaction: 'dismissed', shown_to_user: true })
        .eq('user_id', user?.id)
        .eq('listing_id', listingId);

      setDismissedIds(prev => new Set([...prev, recommendationId]));
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const handleClick = async (listingId: string) => {
    try {
      // Track click interaction
      await supabase
        .from('ai_recommendations')
        .update({ user_interaction: 'clicked', shown_to_user: true })
        .eq('user_id', user?.id)
        .eq('listing_id', listingId);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const visibleRecommendations = recommendations.filter(r => !dismissedIds.has(r.id));

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI-Powered Recommendations</h3>
        <p className="text-muted-foreground mb-4">
          Sign in to get personalized server recommendations based on your interests and activity.
        </p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold">AI Recommendations</h2>
          </div>
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded mb-4" />
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <Badge variant="secondary" className="ml-2">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {visibleRecommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground mb-4">
            Interact with servers, add favorites, and vote to get personalized recommendations.
          </p>
          <Button onClick={fetchRecommendations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate Recommendations
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleRecommendations.map((recommendation) => (
            <Card key={recommendation.id} className="hover:shadow-lg transition-all duration-300 relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => handleDismiss(recommendation.id, recommendation.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getScoreColor(recommendation.score)}`}
                  >
                    {Math.round(recommendation.score * 10)}% Match
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {recommendation.type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={recommendation.avatar_url} alt={recommendation.name} />
                    <AvatarFallback>{recommendation.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{recommendation.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{recommendation.member_count.toLocaleString()} members</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {recommendation.description}
                </p>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Brain className="h-3 w-3" />
                    <span>Why we recommend this:</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {recommendation.reasoning}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    asChild 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleClick(recommendation.id)}
                  >
                    <Link to={`/listings/${recommendation.id}`}>
                      View Server
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3"
                    onClick={() => {
                      // Add to favorites logic here
                      toast({
                        title: "Added to favorites!",
                        description: `${recommendation.name} has been added to your favorites.`
                      });
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;