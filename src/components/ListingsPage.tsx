import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Server, Bot, Eye, TrendingUp, Search, ExternalLink, Crown, Star, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Listing {
    id: string;
    type: 'server' | 'bot';
    name: string;
    description: string;
    member_count: number;
    view_count: number;
    bump_count: number;
    status: string;
    created_at: string;
    last_bumped_at: string;
    avatar_url?: string;
    invite_url?: string;
    discord_id: string;
    tags: string[];
    featured: boolean;
}

const ListingsPage = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryTab, setCategoryTab] = useState('all');
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchListings = async () => {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch listings",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const getFilteredByCategory = (listings: Listing[]) => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        switch (categoryTab) {
            case 'premium':
                return listings.filter(listing => listing.bump_count >= 10);
            case 'featured':
                return listings.filter(listing => listing.featured);
            case 'recent':
                return listings.filter(listing => 
                    listing.last_bumped_at && 
                    new Date(listing.last_bumped_at) > twentyFourHoursAgo
                );
            default:
                return listings;
        }
    };

    useEffect(() => {
        let filtered = getFilteredByCategory(listings);

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(listing => listing.type === typeFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(listing =>
                listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                listing.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Sort listings - prioritize bumped listings
        switch (sortBy) {
            case 'bumps':
                filtered.sort((a, b) => {
                    // First sort by bump count (highest first)
                    if (b.bump_count !== a.bump_count) {
                        return (b.bump_count || 0) - (a.bump_count || 0);
                    }
                    // Then by last bumped time (most recent first)
                    if (a.last_bumped_at && b.last_bumped_at) {
                        return new Date(b.last_bumped_at).getTime() - new Date(a.last_bumped_at).getTime();
                    }
                    if (a.last_bumped_at) return -1;
                    if (b.last_bumped_at) return 1;
                    return 0;
                });
                break;
            case 'views':
                filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                break;
            default: // recent
                filtered.sort((a, b) => {
                    // First prioritize listings with recent bumps
                    if (a.last_bumped_at && b.last_bumped_at) {
                        return new Date(b.last_bumped_at).getTime() - new Date(a.last_bumped_at).getTime();
                    }
                    if (a.last_bumped_at) return -1;
                    if (b.last_bumped_at) return 1;
                    // Then by creation date
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
        }

        setFilteredListings(filtered);
    }, [listings, searchTerm, sortBy, typeFilter, categoryTab]);

    const handleBump = async (listingId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication required",
                description: "Please sign in to bump listings",
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('bumps')
                .insert({
                    listing_id: listingId,
                    user_id: user.id
                });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Listing bumped to the top!",
            });

            fetchListings();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    const handleJoin = (listing: Listing, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent card click

        if (listing.invite_url) {
            window.open(listing.invite_url, '_blank');
        }
    };

    const handleCardClick = (listingId: string) => {
        navigate(`/listings/${listingId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#2C2F33]">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-white text-xl">Loading listings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#2C2F33]">
            <Navbar />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4">Browse Discord Servers & Bots</h1>
                        <p className="text-gray-400 text-lg">Discover amazing Discord communities and useful bots</p>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search servers and bots..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-[#36393F] border-[#40444B] text-white"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40 bg-[#36393F] border-[#40444B] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Recent</SelectItem>
                                    <SelectItem value="bumps">Most Bumped</SelectItem>
                                    <SelectItem value="views">Most Viewed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <Tabs value={categoryTab} onValueChange={setCategoryTab} className="mb-6">
                        <TabsList className="bg-[#36393F] border-[#40444B] grid grid-cols-4 w-full max-w-2xl">
                            <TabsTrigger 
                                value="all" 
                                className="data-[state=active]:bg-[#5865F2] flex items-center gap-2"
                            >
                                <Server className="h-4 w-4" />
                                All Listings
                            </TabsTrigger>
                            <TabsTrigger 
                                value="premium" 
                                className="data-[state=active]:bg-[#5865F2] flex items-center gap-2"
                            >
                                <Crown className="h-4 w-4" />
                                Premium Bumps
                            </TabsTrigger>
                            <TabsTrigger 
                                value="featured" 
                                className="data-[state=active]:bg-[#5865F2] flex items-center gap-2"
                            >
                                <Star className="h-4 w-4" />
                                Featured Bumps
                            </TabsTrigger>
                            <TabsTrigger 
                                value="recent" 
                                className="data-[state=active]:bg-[#5865F2] flex items-center gap-2"
                            >
                                <Clock className="h-4 w-4" />
                                Recently Bumped
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-8">
                        <TabsList className="bg-[#36393F] border-[#40444B]">
                            <TabsTrigger value="all" className="data-[state=active]:bg-[#5865F2]">All</TabsTrigger>
                            <TabsTrigger value="server" className="data-[state=active]:bg-[#5865F2]">Servers</TabsTrigger>
                            <TabsTrigger value="bot" className="data-[state=active]:bg-[#5865F2]">Bots</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {filteredListings.length === 0 ? (
                        <Card className="bg-[#36393F] border-[#40444B] text-center py-12">
                            <CardContent>
                                <div className="text-gray-400">
                                    <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                                    <p>Try adjusting your search terms or filters</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredListings.map((listing) => (
                                <Card
                                    key={listing.id}
                                    className={`bg-[#36393F] border-[#40444B] hover:border-[#5865F2] transition-colors cursor-pointer relative ${
                                        listing.featured ? 'ring-2 ring-yellow-500' : ''
                                    } ${
                                        listing.bump_count >= 10 ? 'ring-2 ring-purple-500' : ''
                                    }`}
                                    onClick={() => handleCardClick(listing.id)}
                                >
                                    {listing.featured && (
                                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Star className="h-3 w-3" />
                                            Featured
                                        </div>
                                    )}
                                    {listing.bump_count >= 10 && !listing.featured && (
                                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Crown className="h-3 w-3" />
                                            Premium
                                        </div>
                                    )}
                                    
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-3">
                                            {listing.avatar_url ? (
                                                <img
                                                    src={listing.avatar_url}
                                                    alt={listing.name}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-[#5865F2] rounded-full flex items-center justify-center">
                                                    {listing.type === 'server' ? (
                                                        <Server className="h-6 w-6 text-white" />
                                                    ) : (
                                                        <Bot className="h-6 w-6 text-white" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <CardTitle className="text-white text-lg">{listing.name}</CardTitle>
                                                <Badge variant={listing.type === 'server' ? 'default' : 'secondary'}>
                                                    {listing.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-gray-300 line-clamp-3">
                                            {listing.description}
                                        </CardDescription>

                                        {listing.tags && listing.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {listing.tags.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center text-gray-400 mb-1">
                                                    <Eye className="h-4 w-4" />
                                                </div>
                                                <div className="text-white font-semibold">{listing.view_count || 0}</div>
                                                <div className="text-gray-500 text-xs">Views</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center text-gray-400 mb-1">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <div className="text-white font-semibold">{listing.bump_count || 0}</div>
                                                <div className="text-gray-500 text-xs">Bumps</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {listing.invite_url && (
                                                <Button
                                                    onClick={(e) => handleJoin(listing, e)}
                                                    className="flex-1 bg-[#57F287] hover:bg-[#3BA55C] text-black"
                                                    size="sm"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Join
                                                </Button>
                                            )}
                                            <Button
                                                onClick={(e) => handleBump(listing.id, e)}
                                                variant="outline"
                                                size="sm"
                                                className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                                            >
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                Bump
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListingsPage;
