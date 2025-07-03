import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search,
  Filter,
  SlidersHorizontal,
  Tag,
  Users,
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react';

interface FilterState {
  search: string;
  type: 'all' | 'server' | 'bot';
  memberRange: [number, number];
  tags: string[];
  sortBy: 'created_at' | 'member_count' | 'view_count' | 'bump_count' | 'last_bumped_at';
  sortOrder: 'asc' | 'desc';
  nsfw: boolean;
  verified: boolean;
  featured: boolean;
  boostLevel: number[];
  dateRange: 'all' | '24h' | '7d' | '30d';
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
}

const AdvancedSearchFilters = ({ onFiltersChange, totalResults }: AdvancedSearchFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    memberRange: [0, 100000],
    tags: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
    nsfw: false,
    verified: false,
    featured: false,
    boostLevel: [0],
    dateRange: 'all'
  });

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const fetchAvailableTags = async () => {
    try {
      const { data } = await supabase
        .from('listing_tags')
        .select('name')
        .order('usage_count', { ascending: false })
        .limit(50);
      
      setAvailableTags(data?.map(tag => tag.name) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      memberRange: [0, 100000],
      tags: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      nsfw: false,
      verified: false,
      featured: false,
      boostLevel: [0],
      dateRange: 'all'
    });
  };

  return (
    <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{totalResults} results</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search communities..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Type</Label>
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="server">Servers</SelectItem>
                  <SelectItem value="bot">Bots</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="created_at">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Created
                    </div>
                  </SelectItem>
                  <SelectItem value="member_count">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Member Count
                    </div>
                  </SelectItem>
                  <SelectItem value="view_count">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      View Count
                    </div>
                  </SelectItem>
                  <SelectItem value="bump_count">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Bump Count
                    </div>
                  </SelectItem>
                  <SelectItem value="last_bumped_at">Recently Bumped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Order</Label>
              <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <>
            <Separator className="bg-gray-700/50" />

            {/* Advanced Filters */}
            <div className="space-y-6">
              {/* Member Count Range */}
              <div className="space-y-3">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Member Count Range
                </Label>
                <div className="px-3">
                  <Slider
                    value={filters.memberRange}
                    onValueChange={(value) => updateFilter('memberRange', value)}
                    max={100000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{filters.memberRange[0].toLocaleString()}</span>
                    <span>{filters.memberRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 15).map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'border-gray-600/50 text-gray-400 hover:bg-gray-700/50'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Selected:</span>
                    {filters.tags.map(tag => (
                      <Badge
                        key={tag}
                        className="bg-purple-600 text-white"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Verified Only</Label>
                  <Switch
                    checked={filters.verified}
                    onCheckedChange={(checked) => updateFilter('verified', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Featured Only</Label>
                  <Switch
                    checked={filters.featured}
                    onCheckedChange={(checked) => updateFilter('featured', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Include NSFW</Label>
                  <Switch
                    checked={filters.nsfw}
                    onCheckedChange={(checked) => updateFilter('nsfw', checked)}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-gray-300">Created Within</Label>
                <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-gray-700/50" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
              >
                Reset Filters
              </Button>
              
              <Badge variant="outline" className="text-gray-400 border-gray-600/50">
                {Object.values(filters).filter(v => 
                  Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== false && v !== 0
                ).length} filters active
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;