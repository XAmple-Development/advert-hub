import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ModernCard from '@/components/ui/modern-card';
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
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-4 backdrop-blur-sm">
              <Star className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">Top Rated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Top Discord 
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                {" "}Bots & Apps
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl">
              Discover the most popular and highest-rated Discord bots trusted by millions of users
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://discord.gg/3mNGT2AwNy', '_blank')}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-pink-600/30 backdrop-blur-sm"
          >
            Join our Discord
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trendingListings?.map((listing, index) => (
            <div 
              key={listing.id} 
              className="group relative bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              {/* Trending Badge */}
              {index < 3 && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    #{index + 1}
                  </div>
                </div>
              )}

              {/* Verified Badge */}
              {listing.verified_badge && (
                <div className="absolute top-3 right-3 z-20">
                  <Badge className="bg-blue-500/90 text-white border-0 shadow-lg text-xs">
                    ✓
                  </Badge>
                </div>
              )}

              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02] group-hover:from-primary/[0.05] group-hover:to-secondary/[0.05] transition-all" />
              
              <div className="relative p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={listing.avatar_url || "/placeholder.svg"} 
                      alt={listing.name}
                      className="w-10 h-10 rounded-lg object-cover ring-2 ring-border/20 group-hover:ring-primary/30 transition-all"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {listing.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium">{(listing.member_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium">{(listing.vote_count || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {listing.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs h-5 px-2 bg-secondary/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    View
                  </Button>
                  
                  {listing.invite_url && (
                    <Button
                      onClick={() => window.open(listing.invite_url, '_blank')}
                      size="sm"
                      className="flex-1 h-8 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                    >
                      {listing.type === 'bot' ? 'Add' : 'Join'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {trendingListings?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
              <Star className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Trending Items</h3>
            <p className="text-gray-400 text-lg">Check back soon for the latest trending Discord bots and apps.</p>
          </div>
        )}
        
        {/* View All Button */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => navigate('/listings')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
          >
            Explore All Bots & Apps
            <ArrowUpRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;