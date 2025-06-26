
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
            // Check cooldown first
            const { data: cooldown, error: cooldownError } = await supabase
                .from('bump_cooldowns')
                .select('last_bump_at')
                .eq('user_discord_id', user.id)
                .eq('listing_id', listingId)
                .single();

            if (cooldownError && cooldownError.code !== 'PGRST116') {
                throw cooldownError;
            }

            if (cooldown) {
                const lastBump = new Date(cooldown.last_bump_at);
                const now = new Date();
                const twoHoursInMs = 2 * 60 * 60 * 1000;
                const timeSinceLastBump = now.getTime() - lastBump.getTime();

                if (timeSinceLastBump < twoHoursInMs) {
                    const timeLeft = twoHoursInMs - timeSinceLastBump;
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    toast({
                        variant: "destructive",
                        title: "Cooldown Active",
                        description: `You can bump again in ${hours}h ${minutes}m`,
                    });
                    return;
                }
            }

            const now = new Date();

            // Update cooldown
            const { error: cooldownUpdateError } = await supabase
                .from('bump_cooldowns')
                .upsert({
                    user_discord_id: user.id,
                    listing_id: listingId,
                    last_bump_at: now.toISOString(),
                });

            if (cooldownUpdateError) throw cooldownUpdateError;

            // Create bump record
            const { error } = await supabase
                .from('bumps')
                .insert({
                    listing_id: listingId,
                    user_id: user.id,
                    bump_type: 'manual'
                });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Listing bumped to the top! Next bump available in 2 hours.",
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
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
                <div className="flex items-center justify-center min-h-screen relative">
                    {/* Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-pulse">
                            Loading Communities...
                        </div>
                        <div className="text-gray-300 text-lg">Discovering amazing Discord servers and bots</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 rounded-full mb-8">
                            <Star className="h-5 w-5 text-purple-300" />
                            <span className="text-purple-200 font-semibold text-lg">Discover Amazing Communities</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                            Browse Discord 
                            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                Servers & Bots
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                            Join thousands of active communities and discover powerful bots to enhance your Discord experience.
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-12 space-y-8">
                        <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                                <Input
                                    placeholder="Search for servers, bots, and communities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-16 bg-gray-800/50 backdrop-blur-xl border-gray-700/50 text-white placeholder-gray-400 rounded-2xl h-16 text-lg focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="lg:w-64 bg-gray-800/50 backdrop-blur-xl border-gray-700/50 text-white rounded-2xl h-16 text-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-xl">
                                    <SelectItem value="recent">Most Recent</SelectItem>
                                    <SelectItem value="bumps">Most Bumped</SelectItem>
                                    <SelectItem value="views">Most Viewed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="mb-12 flex justify-center">
                        <Tabs value={categoryTab} onValueChange={setCategoryTab} className="w-full max-w-4xl">
                            <TabsList className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2 grid grid-cols-2 lg:grid-cols-4 w-full h-16">
                                <TabsTrigger 
                                    value="all" 
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3 text-lg font-semibold"
                                >
                                    <Server className="h-5 w-5" />
                                    All
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="premium" 
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3 text-lg font-semibold"
                                >
                                    <Crown className="h-5 w-5" />
                                    Premium
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="featured" 
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3 text-lg font-semibold"
                                >
                                    <Star className="h-5 w-5" />
                                    Featured
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="recent" 
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3 text-lg font-semibold"
                                >
                                    <Clock className="h-5 w-5" />
                                    Recent
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Type Filter */}
                    <div className="mb-12 flex justify-center">
                        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                            <TabsList className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
                                <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-8 py-3 text-lg font-semibold">All Types</TabsTrigger>
                                <TabsTrigger value="server" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-8 py-3 text-lg font-semibold">Servers</TabsTrigger>
                                <TabsTrigger value="bot" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-8 py-3 text-lg font-semibold">Bots</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Listings Grid */}
                    {filteredListings.length === 0 ? (
                        <Card className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl text-center py-20 max-w-2xl mx-auto">
                            <CardContent className="pt-6">
                                <div className="text-gray-400">
                                    <Server className="h-24 w-24 mx-auto mb-8 opacity-50" />
                                    <h3 className="text-3xl font-bold text-white mb-4">No communities found</h3>
                                    <p className="text-xl">Try adjusting your search terms or filters to discover amazing communities</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {filteredListings.map((listing) => (
                                <Card
                                    key={listing.id}
                                    className={`group relative bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer rounded-3xl overflow-hidden shadow-2xl hover:shadow-purple-500/25 ${
                                        listing.featured ? 'ring-2 ring-yellow-500/50 shadow-yellow-500/20' : ''
                                    } ${
                                        listing.bump_count >= 10 ? 'ring-2 ring-purple-500/50 shadow-purple-500/20' : ''
                                    }`}
                                    onClick={() => handleCardClick(listing.id)}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
                                        listing.featured ? 'from-yellow-500/30 to-orange-500/30' : 
                                        listing.bump_count >= 10 ? 'from-purple-500/30 to-pink-500/30' : 
                                        'from-gray-500/20 to-gray-600/20'
                                    }`}></div>
                                    
                                    {listing.featured && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 z-10 shadow-lg">
                                            <Star className="h-4 w-4" />
                                            Featured
                                        </div>
                                    )}
                                    {listing.bump_count >= 10 && !listing.featured && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 z-10 shadow-lg">
                                            <Crown className="h-4 w-4" />
                                            Premium
                                        </div>
                                    )}
                                    
                                    <CardHeader className="relative z-10 pb-4">
                                        <div className="flex items-center space-x-4">
                                            {listing.avatar_url ? (
                                                <img
                                                    src={listing.avatar_url}
                                                    alt={listing.name}
                                                    className="w-16 h-16 rounded-2xl shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                    {listing.type === 'server' ? (
                                                        <Server className="h-8 w-8 text-white" />
                                                    ) : (
                                                        <Bot className="h-8 w-8 text-white" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <CardTitle className="text-white text-xl font-bold group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">{listing.name}</CardTitle>
                                                <Badge 
                                                    variant={listing.type === 'server' ? 'default' : 'secondary'}
                                                    className="mt-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 font-semibold"
                                                >
                                                    {listing.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10 space-y-6">
                                        <CardDescription className="text-gray-300 text-base leading-relaxed line-clamp-3">
                                            {listing.description}
                                        </CardDescription>

                                        {listing.tags && listing.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {listing.tags.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-gray-800/50 border-gray-600/50 text-gray-300">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/30">
                                                <div className="flex items-center justify-center text-green-400 mb-2">
                                                    <Eye className="h-5 w-5" />
                                                </div>
                                                <div className="text-white font-bold text-lg">{listing.view_count || 0}</div>
                                                <div className="text-gray-400 text-sm">Views</div>
                                            </div>
                                            <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/30">
                                                <div className="flex items-center justify-center text-purple-400 mb-2">
                                                    <TrendingUp className="h-5 w-5" />
                                                </div>
                                                <div className="text-white font-bold text-lg">{listing.bump_count || 0}</div>
                                                <div className="text-gray-400 text-sm">Bumps</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {listing.invite_url && (
                                                <Button
                                                    onClick={(e) => handleJoin(listing, e)}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold"
                                                    size="sm"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Join
                                                </Button>
                                            )}
                                            <Button
                                                onClick={(e) => handleBump(listing.id, e)}
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-6 font-semibold"
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
