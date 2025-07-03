
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
    Server,
    Bot,
    Eye,
    TrendingUp,
    ExternalLink,
    ArrowLeft,
    Calendar,
    Globe
} from 'lucide-react';

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
}

// Cooldown times in milliseconds
const FREE_BUMP_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours for free users
const PREMIUM_BUMP_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours for premium users

const ListingDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [canBump, setCanBump] = useState(true);
    const [nextBumpTime, setNextBumpTime] = useState<string>('');
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (id) {
            fetchListing();
            incrementView();
            if (user) {
                checkBumpCooldown();
            }
        }
    }, [id, user]);

    const checkBumpCooldown = async () => {
        if (!user || !id) return;

        console.log(`Checking bump cooldown for user ${user.id} and listing ${id}`);

        try {
            // Get user's subscription tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            const isPremium = profile?.subscription_tier === 'premium';
            const cooldownMs = isPremium ? PREMIUM_BUMP_COOLDOWN_MS : FREE_BUMP_COOLDOWN_MS;
            const cooldownHours = isPremium ? 2 : 6;

            const { data: cooldown, error } = await supabase
                .from('bump_cooldowns')
                .select('last_bump_at')
                .eq('user_discord_id', user.id)
                .eq('listing_id', id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking bump cooldown:', error);
                return;
            }

            if (cooldown) {
                const lastBump = new Date(cooldown.last_bump_at);
                const now = new Date();
                const timeSinceLastBump = now.getTime() - lastBump.getTime();

                console.log(`Last bump: ${lastBump.toISOString()}, Now: ${now.toISOString()}, Time diff: ${timeSinceLastBump}ms, Required: ${cooldownMs}ms (${cooldownHours}h for ${isPremium ? 'premium' : 'free'} user)`);

                if (timeSinceLastBump < cooldownMs) {
                    setCanBump(false);
                    const timeLeft = cooldownMs - timeSinceLastBump;
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    setNextBumpTime(`${hours}h ${minutes}m`);

                    console.log(`User cannot bump, ${hours}h ${minutes}m remaining`);

                    // Update the cooldown status every minute
                    const interval = setInterval(() => {
                        checkBumpCooldown();
                    }, 60000);

                    return () => clearInterval(interval);
                } else {
                    setCanBump(true);
                    setNextBumpTime('');
                    console.log('User can bump now');
                }
            } else {
                setCanBump(true);
                setNextBumpTime('');
                console.log('No previous bump found, user can bump');
            }
        } catch (error) {
            console.error('Error checking bump cooldown:', error);
        }
    };

    const fetchListing = async () => {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', id)
                .eq('status', 'active')
                .single();

            if (error) throw error;
            setListing(data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch listing details",
            });
            navigate('/listings');
        } finally {
            setLoading(false);
        }
    };

    const incrementView = async () => {
        try {
            // First get the current view count
            const { data: currentListing, error: fetchError } = await supabase
                .from('listings')
                .select('view_count')
                .eq('id', id)
                .single();

            if (!fetchError && currentListing) {
                // Increment the view count
                await supabase
                    .from('listings')
                    .update({ view_count: (currentListing.view_count || 0) + 1 })
                    .eq('id', id);
            }
        } catch (error) {
            // Silent fail for view counting
            console.log('Failed to increment view count:', error);
        }
    };

    const handleBump = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication required",
                description: "Please sign in to bump listings",
            });
            return;
        }

        if (!canBump) {
            toast({
                variant: "destructive",
                title: "Cooldown Active",
                description: `You must wait ${nextBumpTime} before bumping again`,
            });
            return;
        }

        if (!listing) return;

        console.log(`Attempting to bump listing ${listing.id} by user ${user.id}`);

        try {
            const now = new Date();

            // Update cooldown first
            const { error: cooldownError } = await supabase
                .from('bump_cooldowns')
                .upsert({
                    user_discord_id: user.id,
                    listing_id: listing.id,
                    last_bump_at: now.toISOString(),
                });

            if (cooldownError) {
                console.error('Error updating cooldown:', cooldownError);
                throw cooldownError;
            }

            // Update listing bump count and timestamp
            const { error: listingUpdateError } = await supabase
                .from('listings')
                .update({
                    last_bumped_at: now.toISOString(),
                    bump_count: (listing.bump_count || 0) + 1,
                    updated_at: now.toISOString()
                })
                .eq('id', listing.id);

            if (listingUpdateError) {
                console.error('Error updating listing:', listingUpdateError);
            }

            // Create bump record
            const { error: bumpError } = await supabase
                .from('bumps')
                .insert({
                    listing_id: listing.id,
                    user_id: user.id,
                    bump_type: 'manual',
                    bumped_at: now.toISOString()
                });

            if (bumpError) {
                console.error('Error creating bump record:', bumpError);
                throw bumpError;
            }

            console.log(`Bump successful for listing ${listing.id}`);

            // Send Discord notification for bump (background task)
            try {
                await supabase.functions.invoke('discord-bump-notification', {
                    body: { 
                        listingId: listing.id,
                        bumpType: 'website'
                    }
                });
            } catch (notificationError) {
                console.error('Discord bump notification error:', notificationError);
                // Don't fail the bump if Discord notification fails
            }

            // Get user's subscription tier for success message
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            const isPremium = profile?.subscription_tier === 'premium';
            const cooldownHours = isPremium ? 2 : 6;

            toast({
                title: "Success!",
                description: `Listing bumped to the top! Next bump available in ${cooldownHours} hours.`,
            });

            // Refresh the listing and cooldown status
            fetchListing();
            checkBumpCooldown();
        } catch (error: any) {
            console.error('Error in bump process:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An error occurred while bumping the listing",
            });
        }
    };

    const handleJoin = () => {
        if (listing?.invite_url) {
            window.open(listing.invite_url, '_blank');
        }
    };

    const handleWebsite = () => {
        if (listing?.website_url) {
            window.open(listing.website_url, '_blank');
        }
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
                            Loading Community...
                        </div>
                        <div className="text-gray-300 text-lg">Fetching community details</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
                <div className="flex items-center justify-center min-h-screen relative">
                    {/* Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
                            Community Not Found
                        </div>
                        <div className="text-gray-300 text-lg mb-8">This community may have been removed or doesn't exist</div>
                        <Button
                            onClick={() => navigate('/listings')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-2xl"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Listings
                        </Button>
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

            <div className="relative z-10 py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <Button
                        onClick={() => navigate('/listings')}
                        variant="outline"
                        className="mb-8 border-2 border-gray-700/50 bg-gray-800/50 backdrop-blur-xl text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-purple-500/50 rounded-2xl px-6 py-3 font-semibold transition-all duration-300"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Communities
                    </Button>

                    <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
                        {listing?.banner_url && (
                            <div className="h-64 bg-cover bg-center"
                                style={{ backgroundImage: `url(${listing.banner_url})` }} />
                        )}

                        <CardHeader className="pb-6">
                            <div className="flex items-start space-x-6">
                                {listing?.avatar_url ? (
                                    <img
                                        src={listing.avatar_url}
                                        alt={listing.name}
                                        className="w-20 h-20 rounded-2xl flex-shrink-0 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                        {listing?.type === 'server' ? (
                                            <Server className="h-10 w-10 text-white" />
                                        ) : (
                                            <Bot className="h-10 w-10 text-white" />
                                        )}
                                    </div>
                                )}

                                <div className="flex-1">
                                    <CardTitle className="text-white text-3xl font-black mb-4">{listing?.name}</CardTitle>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge 
                                            variant={listing?.type === 'server' ? 'default' : 'secondary'}
                                            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 font-semibold px-3 py-1 text-sm"
                                        >
                                            {listing?.type}
                                        </Badge>
                                        <Badge variant="outline" className="bg-gray-800/50 border-gray-600/50 text-gray-300 font-semibold px-3 py-1">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {listing && new Date(listing.created_at).toLocaleDateString()}
                                        </Badge>
                                    </div>

                                    {listing?.tags && listing.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {listing.tags.map((tag, index) => (
                                                <Badge key={index} variant="outline" className="text-sm bg-gray-800/50 border-gray-600/50 text-gray-300">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">About This Community</h3>
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    {listing?.long_description || listing?.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/30">
                                    <div className="flex items-center justify-center text-green-400 mb-3">
                                        <Eye className="h-8 w-8" />
                                    </div>
                                    <div className="text-white font-bold text-3xl mb-1">{listing?.view_count || 0}</div>
                                    <div className="text-gray-400 text-lg">Total Views</div>
                                </div>
                                <div className="text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/30">
                                    <div className="flex items-center justify-center text-purple-400 mb-3">
                                        <TrendingUp className="h-8 w-8" />
                                    </div>
                                    <div className="text-white font-bold text-3xl mb-1">{listing?.bump_count || 0}</div>
                                    <div className="text-gray-400 text-lg">Total Bumps</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                {listing?.invite_url && (
                                    <Button
                                        onClick={handleJoin}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-bold py-4 text-lg"
                                    >
                                        <ExternalLink className="h-5 w-5 mr-3" />
                                        Join {listing.type === 'server' ? 'Server' : 'Bot'}
                                    </Button>
                                )}

                                {listing?.website_url && (
                                    <Button
                                        onClick={handleWebsite}
                                        variant="outline"
                                        className="flex-1 border-2 border-gray-700/50 bg-gray-800/50 backdrop-blur-xl text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-cyan-500/50 rounded-2xl font-bold py-4 text-lg transition-all duration-300"
                                    >
                                        <Globe className="h-5 w-5 mr-3" />
                                        Visit Website
                                    </Button>
                                )}

                                <Button
                                    onClick={handleBump}
                                    variant="outline"
                                    disabled={!canBump}
                                    className={`border-2 bg-gray-800/50 backdrop-blur-xl rounded-2xl font-bold py-4 text-lg transition-all duration-300 ${
                                        !canBump 
                                            ? 'border-gray-600/50 text-gray-500 cursor-not-allowed opacity-50' 
                                            : 'border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-500 transform hover:scale-105'
                                    }`}
                                    title={!canBump ? `Next bump available in ${nextBumpTime}` : 'Bump this community to the top'}
                                >
                                    <TrendingUp className="h-5 w-5 mr-3" />
                                    {canBump ? 'Bump Community' : `Cooldown: ${nextBumpTime}`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ListingDetail;
