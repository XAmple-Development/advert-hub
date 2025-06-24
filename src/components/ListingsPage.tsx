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
import { Server, Bot, Eye, TrendingUp, Search, ExternalLink, Crown, Star, Clock, Sparkles } from 'lucide-react';
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] relative">
                    {/* Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Loading Listings...
                        </div>
                        <div className="text-gray-300">Discovering amazing communities...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden">
            <Navbar />
            
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
                            <Star className="h-4 w-4 text-purple-300" />
                            <span className="text-purple-200 font-medium">Discover Communities</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                            Browse Discord 
                            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Servers & Bots
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                            Discover amazing Discord communities and useful bots to enhance your experience.
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-12 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    placeholder="Search servers and bots..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 text-white placeholder-gray-400 rounded-2xl h-14 text-lg focus:border-purple-500/50"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="min-w-48 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 text-white rounded-2xl h-14">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="recent">Recent</SelectItem>
                                    <SelectItem value="bumps">Most Bumped</SelectItem>
                                    <SelectItem value="views">Most Viewed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <Tabs value={categoryTab} onValueChange={setCategoryTab} className="mb-10">
                        <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2 grid grid-cols-4 w-full max-w-3xl">
                            <TabsTrigger 
                                value="all" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3"
                            >
                                <Server className="h-4 w-4" />
                                All Listings
                            </TabsTrigger>
                            <TabsTrigger 
                                value="premium" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3"
                            >
                                <Crown className="h-4 w-4" />
                                Premium
                            </TabsTrigger>
                            <TabsTrigger 
                                value="featured" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3"
                            >
                                <Star className="h-4 w-4" />
                                Featured
                            </TabsTrigger>
                            <TabsTrigger 
                                value="recent" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl flex items-center gap-2 px-4 py-3"
                            >
                                <Clock className="h-4 w-4" />
                                Recent
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-12">
                        <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
                            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3">All</TabsTrigger>
                            <TabsTrigger value="server" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3">Servers</TabsTrigger>
                            <TabsTrigger value="bot" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3">Bots</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {filteredListings.length === 0 ? (
                        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl text-center py-20">
                            <CardContent>
                                <div className="text-gray-400">
                                    <Server className="h-20 w-20 mx-auto mb-6 opacity-50" />
                                    <h3 className="text-2xl font-bold text-white mb-3">No listings found</h3>
                                    <p className="text-lg">Try adjusting your search terms or filters</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {filteredListings.map((listing) => (
                                <Card
                                    key={listing.id}
                                    className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 cursor-pointer rounded-3xl overflow-hidden ${
                                        listing.featured ? 'ring-2 ring-yellow-500/50' : ''
                                    } ${
                                        listing.bump_count >= 10 ? 'ring-2 ring-purple-500/50' : ''
                                    }`}
                                    onClick={() => handleCardClick(listing.id)}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${
                                        listing.featured ? 'from-yellow-500/10 to-orange-500/10' : 
                                        listing.bump_count >= 10 ? 'from-purple-500/10 to-pink-500/10' : 
                                        'from-gray-500/10 to-gray-600/10'
                                    } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                    
                                    {listing.featured && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 z-10">
                                            <Star className="h-3 w-3" />
                                            Featured
                                        </div>
                                    )}
                                    {listing.bump_count >= 10 && !listing.featured && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 z-10">
                                            <Crown className="h-3 w-3" />
                                            Premium
                                        </div>
                                    )}
                                    
                                    <CardHeader className="relative z-10 pb-4">
                                        <div className="flex items-center space-x-4">
                                            {listing.avatar_url ? (
                                                <img
                                                    src={listing.avatar_url}
                                                    alt={listing.name}
                                                    className="w-14 h-14 rounded-2xl"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                                                    {listing.type === 'server' ? (
                                                        <Server className="h-7 w-7 text-white" />
                                                    ) : (
                                                        <Bot className="h-7 w-7 text-white" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <CardTitle className="text-white text-xl font-bold group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">{listing.name}</CardTitle>
                                                <Badge 
                                                    variant={listing.type === 'server' ? 'default' : 'secondary'}
                                                    className="mt-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300"
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
                                                    <Badge key={index} variant="outline" className="text-xs bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-600/50 text-gray-300">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="text-center bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-3 border border-gray-700/30">
                                                <div className="flex items-center justify-center text-gray-400 mb-2">
                                                    <Eye className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div className="text-white font-bold text-lg">{listing.view_count || 0}</div>
                                                <div className="text-gray-500 text-xs">Views</div>
                                            </div>
                                            <div className="text-center bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-3 border border-gray-700/30">
                                                <div className="flex items-center justify-center text-gray-400 mb-2">
                                                    <TrendingUp className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <div className="text-white font-bold text-lg">{listing.bump_count || 0}</div>
                                                <div className="text-gray-500 text-xs">Bumps</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {listing.invite_url && (
                                                <Button
                                                    onClick={(e) => handleJoin(listing, e)}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl"
                                                    size="sm"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Join
                                                </Button>
                                            )}
                                            <Button
                                                onClick={(e) => handleBump(listing.id, e)}
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-4"
                                            >
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                Bump
                                            </Button>
                                        </div>
                                    </CardContent>

                                    {/* Sparkle Effect */}
                                    <Sparkles className="absolute top-4 right-4 h-5 w-5 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
