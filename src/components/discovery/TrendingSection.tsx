import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrendingListing {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  type: string;
  member_count: number;
  trending_score: number;
  growth_velocity: number;
  member_growth: number;
  vote_growth: number;
  view_growth: number;
}

const TrendingSection = () => {
  const [trendingServers, setTrendingServers] = useState<TrendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    fetchTrendingServers();
  }, [timeframe]);

  const fetchTrendingServers = async () => {
    try {
      setLoading(true);
      
      // Calculate trending scores first
      await supabase.functions.invoke('calculate-trending');
      
      // Get trending data
      const { data, error } = await supabase
        .from('trending_metrics')
        .select(`
          trending_score,
          growth_velocity,
          member_growth,
          vote_growth,
          view_growth,
          listings!inner(
            id,
            name,
            description,
            avatar_url,
            type,
            member_count,
            status
          )
        `)
        .eq('date', new Date().toISOString().split('T')[0])
        .eq('listings.status', 'active')
        .order('trending_score', { ascending: false })
        .limit(12);

      if (error) throw error;

      const trending = data?.map(item => ({
        id: item.listings.id,
        name: item.listings.name,
        description: item.listings.description,
        avatar_url: item.listings.avatar_url,
        type: item.listings.type,
        member_count: item.listings.member_count,
        trending_score: item.trending_score,
        growth_velocity: item.growth_velocity,
        member_growth: item.member_growth,
        vote_growth: item.vote_growth,
        view_growth: item.view_growth
      })) || [];

      setTrendingServers(trending);
    } catch (error) {
      console.error('Error fetching trending servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendingBadgeColor = (score: number) => {
    if (score > 50) return 'bg-red-500';
    if (score > 30) return 'bg-orange-500';
    if (score > 15) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatGrowth = (growth: number) => {
    if (growth > 0) return `+${growth}`;
    return growth.toString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
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
              <div className="flex justify-between">
                <div className="h-8 bg-muted rounded w-20" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('daily')}
          >
            Daily
          </Button>
          <Button
            variant={timeframe === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingServers.map((server, index) => (
          <Card key={server.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getTrendingBadgeColor(server.trending_score)}`} />
                  <span className="text-xs text-muted-foreground">
                    {server.trending_score.toFixed(1)} trend score
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {server.type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={server.avatar_url} alt={server.name} />
                  <AvatarFallback>{server.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{server.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{server.member_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {server.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-3 w-3" />
                    {server.member_growth > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : server.member_growth < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    ) : null}
                  </div>
                  <div className="font-medium">{formatGrowth(server.member_growth)}</div>
                  <div className="text-muted-foreground">Members</div>
                </div>
                
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-3 w-3" />
                    {server.view_growth > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : server.view_growth < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    ) : null}
                  </div>
                  <div className="font-medium">{formatGrowth(server.view_growth)}</div>
                  <div className="text-muted-foreground">Views</div>
                </div>
                
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    {server.vote_growth > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : server.vote_growth < 0 ? (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    ) : null}
                  </div>
                  <div className="font-medium">{formatGrowth(server.vote_growth)}</div>
                  <div className="text-muted-foreground">Votes</div>
                </div>
              </div>
              
              <Button asChild className="w-full" size="sm">
                <Link to={`/listings/${server.id}`}>
                  View Server
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {trendingServers.length === 0 && (
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Trending Data Yet</h3>
          <p className="text-muted-foreground">
            Trending calculations are updated daily. Check back soon!
          </p>
        </Card>
      )}
    </div>
  );
};

export default TrendingSection;