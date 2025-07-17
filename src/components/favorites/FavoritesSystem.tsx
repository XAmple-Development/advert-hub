import { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Search, 
  Filter, 
  Star, 
  Users, 
  Calendar, 
  Trash2, 
  Share2, 
  ExternalLink,
  FolderHeart,
  SortAsc,
  Grid,
  List
} from 'lucide-react';
import { ResponsiveListingCard, ResponsiveGrid } from '@/components/enhanced/ResponsiveLayout';
import { LoadingStateManager, EmptyState } from '@/components/enhanced/EnhancedLoadingStates';

interface FavoriteItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    name: string;
    description: string;
    avatar_url?: string;
    banner_url?: string;
    member_count?: number;
    online_count?: number;
    view_count?: number;
    bump_count?: number;
    featured?: boolean;
    verified_badge?: boolean;
    tags?: string[];
    type: 'server' | 'bot';
    invite_url?: string;
    created_at: string;
    last_bumped_at?: string;
  };
}

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (listingId: string) => Promise<void>;
  removeFromFavorites: (listingId: string) => Promise<void>;
  isFavorited: (listingId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data?.map(item => item.listing_id) || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const addToFavorites = async (listingId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'You need to sign in to add favorites.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert([{
          user_id: user.id,
          listing_id: listingId
        }]);

      if (error) throw error;

      setFavorites(prev => [...prev, listingId]);
      toast({
        title: 'Added to favorites!',
        description: 'This listing has been added to your favorites.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add to favorites',
      });
    }
  };

  const removeFromFavorites = async (listingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) throw error;

      setFavorites(prev => prev.filter(id => id !== listingId));
      toast({
        title: 'Removed from favorites',
        description: 'This listing has been removed from your favorites.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove from favorites',
      });
    }
  };

  const isFavorited = (listingId: string) => favorites.includes(listingId);

  return (
    <FavoritesContext.Provider 
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorited,
        isLoading
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

// Favorite Button Component
interface FavoriteButtonProps {
  listingId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
  className?: string;
}

export const FavoriteButton = ({ 
  listingId, 
  size = 'md', 
  variant = 'icon',
  className = ''
}: FavoriteButtonProps) => {
  const { isFavorited, addToFavorites, removeFromFavorites, isLoading } = useFavorites();
  const favorited = isFavorited(listingId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (favorited) {
      await removeFromFavorites(listingId);
    } else {
      await addToFavorites(listingId);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (variant === 'full') {
    return (
      <Button
        variant={favorited ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={`${favorited ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : ''} ${className}`}
      >
        <Heart className={`${iconSizes[size]} mr-2 ${favorited ? 'fill-current' : ''}`} />
        {favorited ? 'Favorited' : 'Add to Favorites'}
      </Button>
    );
  }

  return (
    <Button
      variant={favorited ? "default" : "outline"}
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      className={`${sizeClasses[size]} ${favorited ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : ''} ${className}`}
    >
      <Heart className={`${iconSizes[size]} ${favorited ? 'fill-current' : ''}`} />
    </Button>
  );
};

// Favorites Page Component
export const FavoritesPage = () => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'server' | 'bot'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'members'>('newest');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const { user } = useAuth();
  const { removeFromFavorites } = useFavorites();

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          listings:listing_id(
            id,
            name,
            description,
            avatar_url,
            banner_url,
            member_count,
            online_count,
            view_count,
            bump_count,
            featured,
            verified_badge,
            tags,
            type,
            invite_url,
            created_at,
            last_bumped_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = data?.filter(item => item.listings) || [];
      setFavoriteItems(items as FavoriteItem[]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    let filtered = favoriteItems;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.listings.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.listings.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.listings.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.listings.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.listings.name.localeCompare(b.listings.name);
        case 'members':
          return (b.listings.member_count || 0) - (a.listings.member_count || 0);
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredItems(filtered);
  }, [favoriteItems, searchQuery, filterType, sortBy]);

  const handleRemoveFromFavorites = async (listingId: string) => {
    await removeFromFavorites(listingId);
    setFavoriteItems(prev => prev.filter(item => item.listing_id !== listingId));
  };

  const handleBulkRemove = async () => {
    // Implementation for bulk remove could go here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-2">
            Your saved communities and bots ({favoriteItems.length})
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('card')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search your favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="bot">Bots</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="members">Most Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Favorites List */}
      <LoadingStateManager
        isLoading={loading}
        isError={!!error}
        isEmpty={filteredItems.length === 0}
        error={error}
        onRetry={fetchFavorites}
        emptyComponent={
          favoriteItems.length === 0 ? (
            <EmptyState
              icon={<FolderHeart className="h-16 w-16" />}
              title="No favorites yet"
              description="Start exploring and add your favorite communities to see them here!"
              action={{
                label: "Browse Communities",
                onClick: () => window.location.href = "/listings"
              }}
            />
          ) : (
            <EmptyState
              icon={<Search className="h-16 w-16" />}
              title="No matches found"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          )
        }
      >
        <ResponsiveGrid variant={viewMode}>
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              <ResponsiveListingCard
                listing={{
                  ...item.listings,
                  rating: 4.5, // Mock rating for now
                  review_count: 12 // Mock review count for now
                }}
                variant={viewMode}
                onView={(id) => window.location.href = `/listings/${id}`}
                onFavorite={() => handleRemoveFromFavorites(item.listing_id)}
                onShare={(id) => {
                  navigator.clipboard.writeText(`${window.location.origin}/listing/${id}`);
                }}
                isFavorited={true}
              />
              
              {/* Favorite Date Badge */}
              <Badge 
                variant="secondary" 
                className="absolute top-3 left-3 bg-red-500/20 text-red-400 border-red-500/30"
              >
                <Heart className="h-3 w-3 mr-1 fill-current" />
                {new Date(item.created_at).toLocaleDateString()}
              </Badge>
            </div>
          ))}
        </ResponsiveGrid>
      </LoadingStateManager>
    </div>
  );
};