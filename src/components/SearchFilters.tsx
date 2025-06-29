
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  activeFilters: FilterOptions;
  sortBy: SortOption;
}

export interface FilterOptions {
  type?: 'server' | 'bot' | 'all';
  memberCount?: 'small' | 'medium' | 'large' | 'all';
  featured?: boolean;
  tags?: string[];
}

export type SortOption = 'newest' | 'oldest' | 'most_bumped' | 'member_count' | 'alphabetical';

const SearchFilters = ({ 
  onSearch, 
  onFilterChange, 
  onSortChange, 
  searchQuery, 
  activeFilters, 
  sortBy 
}: SearchFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ type: 'all', memberCount: 'all', featured: false, tags: [] });
    setLocalSearch('');
    onSearch('');
  };

  const hasActiveFilters = searchQuery || 
    activeFilters.type !== 'all' || 
    activeFilters.memberCount !== 'all' || 
    activeFilters.featured ||
    (activeFilters.tags && activeFilters.tags.length > 0);

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search communities by name..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-12 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-2xl h-12 text-lg"
        />
        {localSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalSearch('');
              onSearch('');
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">Filters:</span>
        </div>

        {/* Type Filter */}
        <Select value={activeFilters.type || 'all'} onValueChange={(value) => updateFilter('type', value)}>
          <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700/50 text-white rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="server">Servers</SelectItem>
            <SelectItem value="bot">Bots</SelectItem>
          </SelectContent>
        </Select>

        {/* Member Count Filter */}
        <Select value={activeFilters.memberCount || 'all'} onValueChange={(value) => updateFilter('memberCount', value)}>
          <SelectTrigger className="w-36 bg-gray-800/50 border-gray-700/50 text-white rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="small">Small (1-100)</SelectItem>
            <SelectItem value="medium">Medium (101-1K)</SelectItem>
            <SelectItem value="large">Large (1K+)</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700/50 text-white rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most_bumped">Most Bumped</SelectItem>
            <SelectItem value="member_count">Member Count</SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Featured Toggle */}
        <Button
          variant={activeFilters.featured ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter('featured', !activeFilters.featured)}
          className="rounded-xl"
        >
          ⭐ Featured
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white rounded-xl"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Search: "{searchQuery}"
            </Badge>
          )}
          {activeFilters.type !== 'all' && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Type: {activeFilters.type}
            </Badge>
          )}
          {activeFilters.memberCount !== 'all' && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              Size: {activeFilters.memberCount}
            </Badge>
          )}
          {activeFilters.featured && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              Featured Only
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
