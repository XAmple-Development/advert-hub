import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, X, ChevronDown, Users, Star, Calendar, TrendingUp } from 'lucide-react';

interface EnhancedSearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: EnhancedFilterOptions) => void;
  onSortChange: (sort: EnhancedSortOption) => void;
  searchQuery: string;
  activeFilters: EnhancedFilterOptions;
  sortBy: EnhancedSortOption;
}

export interface EnhancedFilterOptions {
  type?: 'server' | 'bot' | 'all';
  memberCount?: { min: number; max: number };
  featured?: boolean;
  verified?: boolean;
  tags?: string[];
  boostLevel?: number[];
  nsfw?: boolean;
  hasInvite?: boolean;
  lastActive?: 'day' | 'week' | 'month' | 'all';
  category?: string;
}

export type EnhancedSortOption = 
  | 'newest' 
  | 'oldest' 
  | 'most_bumped' 
  | 'member_count' 
  | 'alphabetical'
  | 'highest_rated'
  | 'most_viewed'
  | 'trending';

const POPULAR_TAGS = [
  'Gaming', 'Community', 'Art', 'Music', 'Tech', 'Educational', 
  'Social', 'Roleplay', 'Anime', 'Memes', 'Trading', 'NSFW'
];

const CATEGORIES = [
  'Gaming', 'Community', 'Education', 'Technology', 'Art & Design',
  'Music', 'Entertainment', 'Business', 'Science', 'Sports'
];

const EnhancedSearchFilters = ({ 
  onSearch, 
  onFilterChange, 
  onSortChange, 
  searchQuery, 
  activeFilters, 
  sortBy 
}: EnhancedSearchFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memberRange, setMemberRange] = useState([
    activeFilters.memberCount?.min || 0, 
    activeFilters.memberCount?.max || 100000
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(localSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch, onSearch]);

  const updateFilter = (key: keyof EnhancedFilterOptions, value: any) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const updateMemberCount = (range: number[]) => {
    setMemberRange(range);
    updateFilter('memberCount', { min: range[0], max: range[1] });
  };

  const toggleTag = (tag: string) => {
    const currentTags = activeFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags);
  };

  const clearFilters = () => {
    onFilterChange({ 
      type: 'all', 
      memberCount: { min: 0, max: 100000 },
      featured: false,
      verified: false,
      tags: [],
      boostLevel: [],
      nsfw: false,
      hasInvite: false,
      lastActive: 'all',
      category: undefined
    });
    setLocalSearch('');
    setMemberRange([0, 100000]);
  };

  const hasActiveFilters = searchQuery || 
    activeFilters.type !== 'all' || 
    activeFilters.featured ||
    activeFilters.verified ||
    (activeFilters.tags && activeFilters.tags.length > 0) ||
    activeFilters.nsfw ||
    activeFilters.hasInvite ||
    activeFilters.lastActive !== 'all' ||
    activeFilters.category;

  const getSortIcon = (sort: EnhancedSortOption) => {
    switch (sort) {
      case 'member_count': return <Users className="h-4 w-4" />;
      case 'highest_rated': return <Star className="h-4 w-4" />;
      case 'newest': return <Calendar className="h-4 w-4" />;
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="mb-8 bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          Search & Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search communities, tags, descriptions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-12 pr-12 h-12 text-lg bg-background/50 border-border/50 rounded-2xl"
          />
          {localSearch && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearch('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={activeFilters.type || 'all'} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger className="w-36 bg-background/50 border-border/50 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="server">Servers</SelectItem>
              <SelectItem value="bot">Bots</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-44 bg-background/50 border-border/50 rounded-xl">
              <div className="flex items-center gap-2">
                {getSortIcon(sortBy)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </div>
              </SelectItem>
              <SelectItem value="member_count">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Member Count
                </div>
              </SelectItem>
              <SelectItem value="highest_rated">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Highest Rated
                </div>
              </SelectItem>
              <SelectItem value="most_bumped">Most Bumped</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={activeFilters.featured ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('featured', !activeFilters.featured)}
            className="rounded-xl"
          >
            <Star className="h-4 w-4 mr-1" />
            Featured
          </Button>

          <Button
            variant={activeFilters.verified ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('verified', !activeFilters.verified)}
            className="rounded-xl"
          >
            ✓ Verified
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
              <Filter className="h-4 w-4" />
              Advanced Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            {/* Member Count Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Member Count Range</Label>
              <Slider
                value={memberRange}
                onValueChange={updateMemberCount}
                max={100000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{memberRange[0].toLocaleString()}</span>
                <span>{memberRange[1].toLocaleString()}+</span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={activeFilters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
                <SelectTrigger className="bg-background/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Popular Tags */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Popular Tags</Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map(tag => (
                  <Button
                    key={tag}
                    variant={activeFilters.tags?.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="rounded-full text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Last Active</Label>
                <Select value={activeFilters.lastActive || 'all'} onValueChange={(value) => updateFilter('lastActive', value)}>
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Additional Filters</Label>
                <div className="space-y-2">
                  <Button
                    variant={activeFilters.hasInvite ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('hasInvite', !activeFilters.hasInvite)}
                    className="w-full justify-start rounded-xl"
                  >
                    Has Invite Link
                  </Button>
                  <Button
                    variant={activeFilters.nsfw ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('nsfw', !activeFilters.nsfw)}
                    className="w-full justify-start rounded-xl"
                  >
                    NSFW Content
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Active Filters</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {activeFilters.type !== 'all' && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Type: {activeFilters.type}
                </Badge>
              )}
              {activeFilters.category && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                  Category: {activeFilters.category}
                </Badge>
              )}
              {activeFilters.featured && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  Featured
                </Badge>
              )}
              {activeFilters.verified && (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Verified
                </Badge>
              )}
              {activeFilters.tags?.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-purple-500/20 text-purple-300 border-purple-500/30 cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSearchFilters;