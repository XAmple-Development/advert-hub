import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, ExternalLink, Crown, Network } from 'lucide-react';

interface CrossPromotionListing {
  id: string;
  name: string;
  description: string;
  type: 'server' | 'bot';
  member_count: number;
  view_count: number;
  avatar_url?: string;
  invite_url?: string;
  premium_featured: boolean;
}

const CrossPromotionNetwork = () => {
  const { user } = useAuth();
  const { isPremium, createCheckout } = useSubscription();
  const [listings, setListings] = useState<CrossPromotionListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPremium && user) {
      fetchCrossPromotionListings();
    }
  }, [isPremium, user]);

  const fetchCrossPromotionListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, name, description, type, member_count, view_count, avatar_url, invite_url, premium_featured')
        .eq('status', 'active')
        .eq('premium_featured', true)
        .neq('user_id', user?.id) // Exclude user's own listings
        .order('view_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching cross-promotion listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!isPremium) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="h-6 w-6 text-purple-400" />
            Cross-Promotion Network
            <Crown className="h-5 w-5 text-yellow-400" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Network className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Premium Feature</h3>
            <p className="text-gray-300 mb-4">
              Access our exclusive cross-promotion network to discover and collaborate with other premium communities.
            </p>
            <Button 
              onClick={createCheckout}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gray-800/40 border border-gray-700/50 rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="h-6 w-6 text-purple-400" />
            Cross-Promotion Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-700/30 rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-600 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/40 border border-purple-500/30 rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="h-6 w-6 text-purple-400" />
            Cross-Promotion Network
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Premium
            </Badge>
          </CardTitle>
          <p className="text-gray-400 text-sm">
            {listings.length} featured communities
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="bg-gray-700/30 border border-gray-600/30 rounded-2xl hover:border-purple-500/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {listing.avatar_url ? (
                      <img
                        src={listing.avatar_url}
                        alt={listing.name}
                        className="w-10 h-10 rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {listing.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">
                        {listing.name}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300">
                        {listing.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  
                  <div className="flex justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatMemberCount(listing.member_count || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {listing.view_count || 0} views
                    </div>
                  </div>
                  
                  {listing.invite_url && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs"
                      onClick={() => window.open(listing.invite_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit Community
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              No featured communities available for cross-promotion at the moment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrossPromotionNetwork;