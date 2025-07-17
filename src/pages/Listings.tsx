import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateListingModal from '@/components/CreateListingModal';
import { 
  Search, 
  Filter, 
  Users, 
  Bot, 
  Star, 
  TrendingUp, 
  Eye, 
  Heart,
  ExternalLink,
  Grid3X3,
  List,
  SlidersHorizontal,
  Calendar,
  Crown,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Listing {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  member_count?: number;
  online_count?: number;
  view_count?: number;
  vote_count?: number;
  featured?: boolean;
  verified_badge?: boolean;
  premium_featured?: boolean;
  tags?: string[];
  type: 'server' | 'bot';
  invite_url?: string;
  website_url?: string;
  created_at: string;
  last_bumped_at?: string;
}

const Listings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [filterType, setFilterType] = useState<'all' | 'server' | 'bot'>('all');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchListings();
    // Check if create parameter is in URL
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Remove the create parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams);
    }
  }, [searchParams]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active' as any);

      // Apply filters based on search params
      const search = searchParams.get('search');
      const type = searchParams.get('type');
      const category = searchParams.get('category');
      const featured = searchParams.get('featured');

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (type && type !== 'all') {
        query = query.eq('type', type as 'server' | 'bot');
        setFilterType(type as 'server' | 'bot');
      }

      if (featured === 'true') {
        query = query.eq('featured', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('member_count', { ascending: false });
          break;
        case 'trending':
          query = query.order('last_bumped_at', { ascending: false });
          break;
        default:
          query = query.order('featured', { ascending: false }).order('member_count', { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listings"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleFilterChange = (type: 'all' | 'server' | 'bot') => {
    setFilterType(type);
    const params = new URLSearchParams(searchParams);
    if (type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    setSearchParams(params);
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <ModernCard className={cn(
      "group relative overflow-hidden transition-all duration-500 hover-lift",
      viewMode === 'grid' ? "h-[320px]" : "h-[180px] flex",
      listing.premium_featured && "ring-2 ring-primary/40 border-primary/30"
    )} variant={listing.featured ? "premium" : "default"}>
      {/* Featured Badge */}
      {(listing.featured || listing.premium_featured) && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg">
            <Crown className="h-3 w-3 mr-1" />
            {listing.premium_featured ? "Premium" : "Featured"}
          </Badge>
        </div>
      )}

      {/* Banner Background */}
      {listing.banner_url && (
        <div className="absolute inset-0 z-0">
          <img 
            src={listing.banner_url} 
            alt={`${listing.name} banner`}
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/70 to-card/20" />
        </div>
      )}

      <div className={cn(
        "relative z-10 p-6 h-full",
        viewMode === 'list' ? "flex items-center gap-6" : "flex flex-col"
      )}>
        {/* Header Section */}
        <div className={cn(
          "flex items-start gap-4",
          viewMode === 'list' ? "flex-shrink-0" : "mb-4"
        )}>
          <Avatar className="h-16 w-16 border-2 border-border shadow-lg">
            <AvatarImage src={listing.avatar_url} alt={listing.name} />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-accent/20">
              {listing.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-xl text-foreground truncate">
                {listing.name}
              </h3>
              {listing.verified_badge && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className={cn(
                "text-xs font-medium",
                listing.type === 'server' 
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              )}>
                {listing.type === 'server' ? (
                  <Users className="h-3 w-3 mr-1" />
                ) : (
                  <Bot className="h-3 w-3 mr-1" />
                )}
                {listing.type === 'server' ? 'Server' : 'Bot'}
              </Badge>
              
              {listing.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs border-border/40">
                  {tag}
                </Badge>
              ))}
              
              {listing.tags && listing.tags.length > 2 && (
                <Badge variant="outline" className="text-xs border-border/40">
                  +{listing.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          viewMode === 'grid' ? "text-sm mb-4 line-clamp-3 flex-1" : "text-sm line-clamp-2 flex-1"
        )}>
          {listing.description}
        </p>

        {/* Stats and Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {listing.member_count && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatCount(listing.member_count)}</span>
                </div>
              )}
              
              {listing.online_count && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">{formatCount(listing.online_count)}</span>
                </div>
              )}
              
              {listing.vote_count && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">{formatCount(listing.vote_count)}</span>
                </div>
              )}
            </div>

            {listing.view_count && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{formatCount(listing.view_count)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link to={`/listings/${listing.id}`} className="flex-1">
              <Button variant="outline" className="w-full hover:border-primary/50">
                View Details
              </Button>
            </Link>
            
            {listing.invite_url && (
              <Button 
                variant="default" 
                className="flex-1 bg-gradient-to-r from-primary to-primary-light"
                onClick={() => window.open(listing.invite_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {listing.type === 'server' ? 'Join' : 'Add'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModernCard>
  );

  return (
    <ModernLayout>
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Discover</span>
          </div>
          
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent mb-4">
            Discord Listings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover the best Discord servers and bots. Join communities, add powerful bots, and connect with millions of users.
          </p>
        </div>

        {/* Search and Filters */}
        <ModernCard className="p-6 mb-8" variant="glass">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search servers and bots..."
                  className="pl-10 h-12 text-lg bg-background/50 border-border/50 focus:border-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {['all', 'server', 'bot'].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => handleFilterChange(type as any)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type === 'server' ? 'Servers' : 'Bots'}
                </Button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleSearch} className="px-8">
              Search
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              {[
                { key: 'popular', label: 'Most Popular' },
                { key: 'newest', label: 'Newest' },
                { key: 'trending', label: 'Trending' }
              ].map((sort) => (
                <Button
                  key={sort.key}
                  variant={sortBy === sort.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy(sort.key)}
                >
                  {sort.label}
                </Button>
              ))}
            </div>
          </div>
        </ModernCard>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ModernCard key={i} className="h-[320px] animate-pulse">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <ModernCard className="p-12 text-center" variant="glass">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No listings found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all listings.
            </p>
          </ModernCard>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
              : "grid-cols-1"
          )}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && listings.length > 0 && (
          <ModernCard className="p-4 mt-8 text-center" variant="glass">
            <p className="text-muted-foreground">
              Showing {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </p>
          </ModernCard>
        )}

        {/* Create Listing Modal */}
        <CreateListingModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={() => {
            fetchListings();
            toast({
              title: "Success!",
              description: "Your listing has been created and is pending review.",
            });
          }}
        />
      </div>
    </ModernLayout>
  );
};

export default Listings;