import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchFilters, { FilterOptions, SortOption } from './SearchFilters';
import EmptyState from './EmptyState';
import SkeletonCard from './ui/skeleton-card';
import ListingPagination from './ListingPagination';
import ListingVerificationBadge from './verification/ListingVerificationBadge';
import { 
  Server, 
  Bot, 
  Plus
} from 'lucide-react';
import { ModernListingCard } from './cards/ModernListingCard';
import CreateListingModal from './CreateListingModal';
import LiveDiscordImport from './enhanced/LiveDiscordImport';
import { useFavorites } from '@/hooks/useFavorites';

interface Listing {
  id: string;
  type: 'server' | 'bot';
  name: string;
  description: string;
  long_description?: string;
  member_count: number;
  view_count: number;
  bump_count: number;
  status: string;
  created_at: string;
  avatar_url?: string;
  invite_url?: string;
  website_url?: string;
  discord_id: string;
  tags: string[];
  banner_url?: string;
  featured: boolean;
  last_bumped_at?: string;
  user_id: string;
  profiles?: {
    subscription_tier: 'free' | 'gold' | 'platinum' | 'premium';
  }[] | null;
}

const ITEMS_PER_PAGE = 12;

const EnhancedListingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    memberCount: 'all',
    featured: false,
    tags: []
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    console.log('Fetching listings...');
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('premium_featured', { ascending: false })
        .order('last_bumped_at', { ascending: false })
        .order('created_at', { ascending: false });

      console.log('Listings query result:', { data: data?.length, error });
      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listings",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Search filter
      if (searchQuery && !listing.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && listing.type !== filters.type) {
        return false;
      }

      // Member count filter
      if (filters.memberCount && filters.memberCount !== 'all') {
        const memberCount = listing.member_count || 0;
        switch (filters.memberCount) {
          case 'small':
            if (memberCount > 100) return false;
            break;
          case 'medium':
            if (memberCount <= 100 || memberCount > 1000) return false;
            break;
          case 'large':
            if (memberCount <= 1000) return false;
            break;
        }
      }

      // Featured filter
      if (filters.featured && !listing.featured) {
        return false;
      }

      return true;
    });

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_bumped':
          return (b.bump_count || 0) - (a.bump_count || 0);
        case 'member_count':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [listings, searchQuery, filters, sortBy]);

  // Use the filteredAndSortedListings directly since we don't have profile data
  const sortedListings = filteredAndSortedListings;

  // Pagination
  const totalPages = Math.ceil(sortedListings.length / ITEMS_PER_PAGE);
  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleViewListing = (listing: Listing) => {
    navigate(`/listings/${listing.id}`);
  };

  const handleJoinListing = (listing: Listing) => {
    if (listing.invite_url) {
      window.open(listing.invite_url, '_blank');
    }
  };

  const handleWebsite = (listing: Listing) => {
    if (listing.website_url) {
      window.open(listing.website_url, '_blank');
    }
  };

  const handleToggleFavorite = (listingId: string) => {
    toggleFavorite(listingId);
  };

  const handleShareListing = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      navigator.clipboard.writeText(`${window.location.origin}/listings/${listingId}`);
      toast({
        title: "Link copied!",
        description: "Listing link copied to clipboard.",
      });
    }
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <div className="h-12 w-64 bg-gray-700/50 rounded-2xl animate-pulse mb-4"></div>
            <div className="h-6 w-96 bg-gray-700/50 rounded animate-pulse"></div>
          </div>
          
          <div className="mb-8">
            <div className="h-12 w-full bg-gray-700/50 rounded-2xl animate-pulse mb-4"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-24 bg-gray-700/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} showAvatar={true} lines={3} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-8 pb-20 md:pb-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Discord Communities
              </h1>
              <p className="text-gray-300 text-base sm:text-lg">
                Discover amazing Discord servers and bots. Join the best communities today!
              </p>
            </div>
            {user && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/20 rounded-xl"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Import Discord Server
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bot Listing
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          searchQuery={searchQuery}
          activeFilters={filters}
          sortBy={sortBy}
        />

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-300">
            {sortedListings.length > 0 ? (
              <span>
                {sortedListings.length} {sortedListings.length === 1 ? 'community' : 'communities'} found
              </span>
            ) : (
              <span>No communities found</span>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        {paginatedListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedListings.map((listing) => (
                <ModernListingCard
                  key={listing.id}
                  listing={{
                    ...listing,
                    premium_featured: listing.profiles?.[0]?.subscription_tier === 'premium' || listing.profiles?.[0]?.subscription_tier === 'platinum'
                  }}
                  onView={() => handleViewListing(listing)}
                  onFavorite={handleToggleFavorite}
                  onShare={handleShareListing}
                  onJoin={handleJoinListing}
                  onWebsite={handleWebsite}
                  isFavorited={favorites.includes(listing.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            <ListingPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={sortedListings.length}
            />
          </>
        ) : (
          /* Empty State */
          <EmptyState
            type={searchQuery || filters.type !== 'all' || filters.memberCount !== 'all' || filters.featured ? 'no-results' : 'no-listings'}
            title={searchQuery ? 'No Results Found' : 'No Communities Yet'}
            description={
              searchQuery 
                ? `We couldn't find any communities matching "${searchQuery}". Try adjusting your search or filters.`
                : 'Be the first to add your Discord community to our platform!'
            }
            actionText={searchQuery ? 'Clear Search' : 'Add Your Community'}
            onAction={() => {
              if (searchQuery) {
                setSearchQuery('');
                setFilters({ type: 'all', memberCount: 'all', featured: false, tags: [] });
              } else {
                navigate('/auth');
              }
            }}
            icon={searchQuery ? 'search' : 'plus'}
          />
        )}
      </div>

      {/* Modals */}
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

      <LiveDiscordImport
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={() => {
          fetchListings();
          toast({
            title: "Import successful!",
            description: "Your Discord server has been imported successfully.",
          });
        }}
      />
    </div>
  );
};

export default EnhancedListingsPage;
