import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Eye, 
  Heart, 
  ExternalLink, 
  Share2, 
  Star,
  TrendingUp,
  Globe,
  Crown,
  Calendar,
  Dot
} from 'lucide-react';
import ListingVerificationBadge from '@/components/verification/ListingVerificationBadge';

interface ModernListingCardProps {
  listing: {
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
    website_url?: string;
    created_at: string;
    last_bumped_at?: string;
    premium_featured?: boolean;
  };
  onView?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onJoin?: (listing: any) => void;
  onWebsite?: (listing: any) => void;
  isFavorited?: boolean;
  className?: string;
}

export const ModernListingCard = ({
  listing,
  onView,
  onFavorite,
  onShare,
  onJoin,
  onWebsite,
  isFavorited = false,
  className
}: ModernListingCardProps) => {
  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={cn(
      "card-glow group relative overflow-hidden",
      "hover-lift hover-tilt transition-all duration-500",
      "hover:shadow-glow-secondary",
      listing.premium_featured && "ring-2 ring-primary/30 border-primary/40 animate-glow-pulse",
      className
    )}>
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0" style={{background: 'var(--gradient-surface)'}} />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-500" 
           style={{background: 'var(--gradient-primary)'}} />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-all duration-500" 
           style={{background: 'var(--gradient-accent)'}} />
      
      {/* Enhanced Featured Badge */}
      {(listing.featured || listing.premium_featured) && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className={cn(
            "gap-2 text-sm font-bold shadow-2xl px-4 py-2 rounded-full animate-glow-pulse",
            listing.premium_featured 
              ? "border-0 text-white" 
              : "border-0 text-white"
          )} style={{
            background: listing.premium_featured 
              ? 'var(--gradient-cosmic)' 
              : 'linear-gradient(135deg, #fbbf24, #f59e0b)'
          }}>
            <Star className="h-4 w-4 animate-bounce-gentle" />
            {listing.premium_featured ? "Premium" : "Featured"}
          </Badge>
        </div>
      )}

      <CardContent className="relative p-8 space-y-6">
        {/* Enhanced Header Section */}
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-primary/30 hover:ring-primary/50 transition-all duration-300 hover-glow">
              <AvatarImage src={listing.avatar_url} alt={listing.name} />
              <AvatarFallback className="text-primary font-bold text-lg" 
                             style={{background: 'var(--gradient-primary)', opacity: 0.2}}>
                {listing.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {listing.online_count && listing.type === 'server' && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-3 border-card shadow-lg animate-glow-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl leading-tight truncate group-hover:gradient-text transition-all duration-300">
                {listing.name}
              </h3>
              <ListingVerificationBadge listingId={listing.id} size="sm" />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="text-sm h-7 px-3 font-semibold rounded-lg" 
                     style={{background: 'var(--gradient-primary)', color: 'white'}}>
                {listing.type === 'server' ? 'Server' : 'Bot'}
              </Badge>
              {listing.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-sm h-7 px-3 rounded-lg hover-glow">
                  {tag}
                </Badge>
              ))}
              {listing.tags && listing.tags.length > 2 && (
                <span className="text-sm text-muted-foreground font-medium">
                  +{listing.tags.length - 2} more
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFavorite?.(listing.id)}
            className={cn(
              "h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200",
              isFavorited && "text-red-500 opacity-100"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
          </Button>
        </div>

        {/* Enhanced Description */}
        <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">
          {listing.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{formatCount(listing.member_count)}</span>
              <span className="text-muted-foreground text-xs">
                {listing.type === 'server' ? 'members' : 'servers'}
              </span>
            </div>
            
            {listing.online_count && (
              <>
                <Dot className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="font-medium">{formatCount(listing.online_count)}</span>
                  <span className="text-muted-foreground text-xs">online</span>
                </div>
              </>
            )}
            
            {listing.view_count && (
              <>
                <Dot className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">{formatCount(listing.view_count)}</span>
                </div>
              </>
            )}
          </div>

          {listing.last_bumped_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{formatDate(listing.last_bumped_at)}</span>
            </div>
          )}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onView?.(listing.id)}
            variant="outline"
            size="sm"
            className="flex-1 h-11 hover-glow font-medium"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          
          {listing.invite_url && (
            <Button
              onClick={() => onJoin?.(listing)}
              size="sm"
              className="btn-glow flex-1 h-11 font-bold"
            >
              Join {listing.type === 'server' ? 'Server' : 'Bot'}
            </Button>
          )}
          
          {listing.website_url && (
            <Button
              onClick={() => onWebsite?.(listing)}
              variant="ghost"
              size="icon"
              className="h-11 w-11 hover-glow"
            >
              <Globe className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            onClick={() => onShare?.(listing.id)}
            variant="ghost"
            size="icon"
            className="h-11 w-11 hover-glow"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};