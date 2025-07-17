import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditListingModal from '@/components/EditListingModal';
import { ReviewSystem } from '@/components/enhanced/ReviewSystem';
import { TeamManagement } from '@/components/TeamManagement';
import { 
  ExternalLink, 
  Users, 
  Bot, 
  Star, 
  Eye, 
  Calendar, 
  Globe, 
  Github, 
  Crown,
  Heart,
  Share2,
  Flag,
  TrendingUp,
  Clock,
  MessageCircle,
  Award,
  Zap,
  Shield,
  Edit,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string => {
  if (!url) return '';
  
  // Regular expression to match YouTube video ID patterns
  const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  // If no match with regex, try common URL patterns
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0] || '';
  }
  
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  
  if (url.includes('youtube.com/embed/')) {
    return url.split('embed/')[1]?.split('?')[0] || '';
  }
  
  // If all else fails, just return the URL as is
  return url;
};

interface Listing {
  id: string;
  name: string;
  description: string;
  long_description?: string;
  avatar_url?: string;
  banner_url?: string;
  member_count?: number;
  online_count?: number;
  view_count?: number;
  vote_count?: number;
  bump_count?: number;
  featured?: boolean;
  verified_badge?: boolean;
  premium_featured?: boolean;
  certified_bot?: boolean;
  tags?: string[];
  type: 'server' | 'bot';
  invite_url?: string;
  website_url?: string;
  github_url?: string;
  support_server_url?: string;
  library?: string;
  commands_count?: number;
  guilds_count?: number;
  created_at: string;
  last_bumped_at?: string;
  user_id: string;
  youtube_trailer?: string;
  priority_ranking?: number;
}

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [canBump, setCanBump] = useState(true);
  const [nextBumpTime, setNextBumpTime] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { bumpCooldownHours, bumpPoints } = usePremiumFeatures();

  useEffect(() => {
    if (id) {
      fetchListing();
      trackView();
      if (user) {
        checkBumpCooldown();
      }
    }
  }, [id, user]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'active' as any)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error: any) {
      console.error('Error fetching listing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listing details"
      });
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    if (!id) return;
    
    try {
      // Track view - increment manually since function doesn't exist
      const { data: currentListing } = await supabase
        .from('listings')
        .select('view_count')
        .eq('id', id)
        .single();
      
      if (currentListing) {
        await supabase
          .from('listings')
          .update({ view_count: (currentListing.view_count || 0) + 1 })
          .eq('id', id);
      }
      // Track analytics
      await supabase.from('analytics').insert({
        event_type: 'listing_view',
        listing_id: id,
        user_id: user?.id,
        event_data: { page: 'listing_detail' }
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to favorite listings"
      });
      return;
    }

    try {
      if (isFavorited) {
        // Remove favorite
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
        setIsFavorited(false);
        toast({
          title: "Removed from favorites",
          description: "Listing removed from your favorites"
        });
      } else {
        // Add favorite
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            listing_id: id
          });
        setIsFavorited(true);
        toast({
          title: "Added to favorites",
          description: "Listing added to your favorites"
        });
      }
    } catch (error: any) {
      console.error('Error updating favorite:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorites"
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing?.name,
        text: listing?.description,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Listing link copied to clipboard"
      });
    }
  };

  const checkBumpCooldown = async () => {
    if (!user || !id) return;

    try {
      // Get user subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, discord_id')
        .eq('id', user.id)
        .single();

      if (!profile?.discord_id) {
        setCanBump(false);
        return;
      }

      // Use premium features hook for cooldown
      const cooldownMs = bumpCooldownHours * 60 * 60 * 1000;

      // Check last bump time
      const { data: cooldown } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', profile.discord_id)
        .eq('listing_id', id)
        .single();

      if (!cooldown) {
        setCanBump(true);
        return;
      }

      const lastBumpTime = new Date(cooldown.last_bump_at).getTime();
      const now = Date.now();
      const timeDiff = now - lastBumpTime;

      if (timeDiff >= cooldownMs) {
        setCanBump(true);
        setNextBumpTime('');
      } else {
        setCanBump(false);
        const remainingTime = cooldownMs - timeDiff;
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        setNextBumpTime(`${hours}h ${minutes}m`);
        
        // Set timeout to re-check when cooldown expires
        setTimeout(checkBumpCooldown, remainingTime + 1000);
      }
    } catch (error) {
      console.error('Error checking bump cooldown:', error);
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

    try {
      // Get user's Discord ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('discord_id')
        .eq('id', user.id)
        .single();

      if (!profile?.discord_id) {
        toast({
          variant: "destructive",
          title: "Discord Account Required",
          description: "You need to link your Discord account to bump listings",
        });
        return;
      }

      const now = new Date();

      // Update cooldown
      const { error: cooldownError } = await supabase
        .from('bump_cooldowns')
        .upsert({
          user_discord_id: profile.discord_id,
          listing_id: listing.id,
          last_bump_at: now.toISOString(),
        }, {
          onConflict: 'user_discord_id,listing_id',
          ignoreDuplicates: false
        });

      if (cooldownError) {
        console.error('Error updating cooldown:', cooldownError);
        toast({
          variant: "destructive",
          title: "Bump Failed",
          description: "Unable to process your bump right now. Please try again in a moment.",
        });
        return;
      }

      // Update listing
      const { error: listingUpdateError } = await supabase
        .from('listings')
        .update({
          last_bumped_at: now.toISOString(),
          bump_count: (listing.bump_count || 0) + 1,
        })
        .eq('id', listing.id);

      if (listingUpdateError) {
        console.error('Error updating listing:', listingUpdateError);
        toast({
          variant: "destructive",
          title: "Bump Failed",
          description: "Failed to update listing. Please try again.",
        });
        return;
      }

      // Create bump record
      const { error: bumpError } = await supabase
        .from('bumps')
        .insert({
          user_id: user.id,
          listing_id: listing.id,
          bump_type: 'manual',
        });

      if (bumpError) {
        console.error('Error creating bump record:', bumpError);
      }

      // Track analytics
      await supabase.from('analytics').insert({
        event_type: 'bump',
        user_id: user.id,
        listing_id: listing.id,
        event_data: { bump_type: 'manual' }
      });

      toast({
        title: "Listing Bumped!",
        description: "Your listing has been bumped to the top.",
      });

      // Update local state
      setListing(prev => prev ? {
        ...prev,
        last_bumped_at: now.toISOString(),
        bump_count: (prev.bump_count || 0) + 1,
      } : null);

      // Update bump cooldown state
      checkBumpCooldown();

    } catch (error: any) {
      console.error('Error bumping listing:', error);
      toast({
        variant: "destructive",
        title: "Bump Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  if (loading) {
    return (
      <ModernLayout>
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  if (!listing) {
    return (
      <ModernLayout>
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <ModernCard className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The listing you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/listings">
              <Button>Browse Listings</Button>
            </Link>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <ModernCard className="relative overflow-hidden mb-8" variant="premium">
          {/* Banner Background */}
          {listing.banner_url && (
            <div className="absolute inset-0 z-0">
              <img 
                src={listing.banner_url} 
                alt={`${listing.name} banner`}
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/40" />
            </div>
          )}

          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              <div className="flex gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                  <AvatarImage src={listing.avatar_url} alt={listing.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                    {listing.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl lg:text-4xl font-black text-foreground">
                      {listing.name}
                    </h1>
                    
                    {/* Badges */}
                    <div className="flex gap-2">
                      {listing.verified_badge && (
                        <Badge className="bg-blue-500 text-white border-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {listing.certified_bot && (
                        <Badge className="bg-purple-500 text-white border-0">
                          <Award className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      )}
                      {(listing.featured || listing.premium_featured) && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                          <Crown className="h-3 w-3 mr-1" />
                          {listing.premium_featured ? "Premium" : "Featured"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                    {listing.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn(
                      "text-sm font-medium",
                      listing.type === 'server' 
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    )}>
                      {listing.type === 'server' ? (
                        <Users className="h-3 w-3 mr-1" />
                      ) : (
                        <Bot className="h-3 w-3 mr-1" />
                      )}
                      {listing.type === 'server' ? 'Discord Server' : 'Discord Bot'}
                    </Badge>
                    
                    {listing.library && (
                      <Badge variant="outline" className="border-border/40">
                        {listing.library}
                      </Badge>
                    )}
                    
                    {listing.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="border-border/40">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:w-64">
                {listing.invite_url && (
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-primary-light shadow-lg hover:shadow-primary/25"
                    onClick={() => window.open(listing.invite_url, '_blank')}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    {listing.type === 'server' ? 'Join Server' : 'Add Bot'}
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleFavorite} className="flex-1">
                    <Heart className={cn("h-4 w-4 mr-2", isFavorited && "fill-current text-red-500")} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {user && user.id === listing.user_id && (
                    <Button variant="outline" onClick={() => setShowEditModal(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {listing.online_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{formatCount(listing.online_count)}</div>
                  <div className="text-sm text-muted-foreground">Online</div>
                </div>
              )}
              
              {listing.guilds_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{formatCount(listing.guilds_count)}</div>
                  <div className="text-sm text-muted-foreground">Servers</div>
                </div>
              )}
              
              {listing.commands_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{listing.commands_count}</div>
                  <div className="text-sm text-muted-foreground">Commands</div>
                </div>
              )}
              
              {listing.vote_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{formatCount(listing.vote_count)}</div>
                  <div className="text-sm text-muted-foreground">Votes</div>
                </div>
              )}
              
              {listing.view_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{formatCount(listing.view_count)}</div>
                  <div className="text-sm text-muted-foreground">Views</div>
                </div>
              )}
              
              {listing.bump_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{formatCount(listing.bump_count)}</div>
                  <div className="text-sm text-muted-foreground">Bumps</div>
                </div>
              )}
            </div>
          </div>
        </ModernCard>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {user && user.id === listing.user_id && <TabsTrigger value="team">Team</TabsTrigger>}
            <TabsTrigger value="similar">Similar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <ModernCard className="p-6">
                  <h3 className="text-xl font-bold mb-4">About {listing.name}</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {listing.long_description || listing.description}
                    </p>
                  </div>
                </ModernCard>

                {/* YouTube Trailer */}
                {listing.youtube_trailer && (
                  <ModernCard className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Play className="h-5 w-5 text-red-500" />
                      Trailer
                    </h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(listing.youtube_trailer)}`}
                        title={`${listing.name} Trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </ModernCard>
                )}

                {/* Features/Commands (for bots) */}
                {listing.type === 'bot' && (
                  <ModernCard className="p-6">
                    <h3 className="text-xl font-bold mb-4">Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Placeholder features - in real app, fetch from database */}
                      {[
                        'Moderation Commands',
                        'Music Playback',
                        'Custom Prefix',
                        'Role Management',
                        'Auto Moderation',
                        'Dashboard Panel'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                          <Zap className="h-5 w-5 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </ModernCard>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <ModernCard className="p-6">
                  <h3 className="text-lg font-bold mb-4">Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {listing.last_bumped_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Bump</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(listing.last_bumped_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    
                    {listing.bump_count && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Bumps</span>
                        <span className="font-medium">{listing.bump_count}</span>
                      </div>
                    )}
                  </div>
                </ModernCard>

                {/* Links */}
                <ModernCard className="p-6">
                  <h3 className="text-lg font-bold mb-4">Links</h3>
                  <div className="space-y-3">
                    {listing.website_url && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={listing.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    
                    {listing.github_url && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    
                    {listing.support_server_url && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={listing.support_server_url} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Support Server
                        </a>
                      </Button>
                    )}
                  </div>
                  
                  {/* Bump Button - moved here for better visibility */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button 
                      onClick={handleBump}
                      disabled={!canBump}
                      className={cn(
                        "w-full",
                        canBump 
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-purple-500/25" 
                          : "opacity-50 cursor-not-allowed"
                      )}
                      size="lg"
                      title={!canBump ? `Next bump available in ${nextBumpTime}` : `Bump this listing to the top (${bumpPoints}x power)`}
                    >
                      <TrendingUp className="h-5 w-5 mr-2" />
                      {canBump ? `Bump to Top (${bumpPoints}x)` : `Cooldown: ${nextBumpTime}`}
                    </Button>
                    {!canBump && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Next bump available in {nextBumpTime} (Gold: 3h, Platinum: 2h)
                      </p>
                    )}
                  </div>
                </ModernCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <ModernCard className="p-6">
              <h3 className="text-xl font-bold mb-4">Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-lg">{listing.type === 'server' ? 'Discord Server' : 'Discord Bot'}</p>
                  </div>
                  
                  {listing.library && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Library</label>
                      <p className="text-lg">{listing.library}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Listed</label>
                    <p className="text-lg">{new Date(listing.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {listing.commands_count && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Commands</label>
                      <p className="text-lg">{listing.commands_count}</p>
                    </div>
                  )}
                  
                  {listing.guilds_count && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Guild Count</label>
                      <p className="text-lg">{formatCount(listing.guilds_count)}</p>
                    </div>
                  )}
                </div>
              </div>
            </ModernCard>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewSystem listingId={listing.id} />
          </TabsContent>

          {user && user.id === listing.user_id && (
            <TabsContent value="team">
              <TeamManagement listingId={listing.id} />
            </TabsContent>
          )}

          <TabsContent value="similar">
            <ModernCard className="p-6">
              <h3 className="text-xl font-bold mb-4">Similar {listing.type === 'server' ? 'Servers' : 'Bots'}</h3>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Coming Soon</h4>
                <p className="text-muted-foreground">
                  We're working on recommendations based on your interests.
                </p>
              </div>
            </ModernCard>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <EditListingModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          listing={listing}
          onSuccess={() => {
            fetchListing();
            toast({
              title: "Success!",
              description: "Your listing has been updated successfully.",
            });
          }}
        />
      </div>
    </ModernLayout>
  );
};

export default ListingDetailPage;