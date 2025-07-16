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
        
        <div className="grid gap-6">
          {trendingListings?.map((listing, index) => (
            <ModernCard 
              key={listing.id} 
              className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 rounded-2xl overflow-hidden ${
                index < 3 
                  ? 'border-purple-500/50 ring-2 ring-purple-500/30 hover:ring-purple-400/50' 
                  : 'border-gray-700/50 hover:border-purple-500/30'
              }`}
              hover
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {index < 3 && (
                <div className="absolute -top-4 left-6 z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center shadow-2xl">
                    <Star className="h-4 w-4 mr-2" />
                    #{index + 1} Trending
                  </div>
                </div>
              )}
              
              <div className="relative z-10 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    {listing.avatar_url && (
                      <div className="relative">
                        <img 
                          src={listing.avatar_url} 
                          alt={listing.name}
                          className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300"
                        />
                        {listing.verified_badge && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-200 transition-colors">
                          {listing.name}
                        </h3>
                        {listing.verified_badge && (
                          <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-300 text-lg line-clamp-2 max-w-3xl leading-relaxed group-hover:text-gray-200 transition-colors">
                        {listing.description}
                      </p>
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex gap-2 mt-4">
                          {listing.tags.slice(0, 4).map((tag) => (
                            <span 
                              key={tag} 
                              className="text-sm px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-purple-200 backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {listing.member_count && (
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-white">
                          <Users className="h-5 w-5 text-purple-400" />
                          {listing.member_count.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">Members</div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={() => navigate(`/listings/${listing.id}`)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white backdrop-blur-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {listing.invite_url && (
                        <Button 
                          size="lg"
                          onClick={() => window.open(listing.invite_url, '_blank')}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Invite Bot
                        </Button>
                      )}
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="flex items-center gap-2 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 hover:text-yellow-200 backdrop-blur-sm"
                        onClick={() => {
                          // TODO: Implement voting functionality
                          console.log('Vote clicked for listing:', listing.id);
                        }}
                      >
                        <Star className="h-4 w-4" />
                        {listing.vote_count || 0}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ModernCard>
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