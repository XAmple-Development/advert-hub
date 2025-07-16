import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star, ExternalLink, ArrowUpRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const TrendingSection = () => {
  const navigate = useNavigate();

  const { data: trendingListings, isLoading } = useQuery({
    queryKey: ['trending-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('vote_count', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Top Discord Bots & Discord Apps</h2>
          <p className="text-muted-foreground">Top voted bots and apps on Top.gg</p>
        </div>
        <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          Join our Discord
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {trendingListings?.map((listing, index) => (
          <div key={listing.id} className="bg-card/60 backdrop-blur border border-border/40 rounded-lg p-4 hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {listing.avatar_url && (
                  <img 
                    src={listing.avatar_url} 
                    alt={listing.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{listing.name}</h3>
                    {index < 3 && (
                      <Badge className="bg-primary/20 text-primary border-primary/20">
                        #Promoted
                      </Badge>
                    )}
                    {listing.verified_badge && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 max-w-2xl">
                    {listing.description}
                  </p>
                  {listing.tags && listing.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {listing.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-muted/20 rounded-full text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {listing.member_count && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">{listing.member_count.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    View
                  </Button>
                  {listing.invite_url && (
                    <Button 
                      size="sm"
                      onClick={() => window.open(listing.invite_url, '_blank')}
                    >
                      Invite
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Star className="h-4 w-4" />
                    Vote ({listing.vote_count || 0})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {trendingListings?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No trending items available at the moment.</p>
        </div>
      )}
    </section>
  );
};

export default TrendingSection;