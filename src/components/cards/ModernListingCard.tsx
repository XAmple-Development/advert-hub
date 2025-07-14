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
      "group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80",
      "border border-border/50 hover:border-border/80",
      "backdrop-blur-sm transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
      listing.premium_featured && "ring-2 ring-primary/20 border-primary/30",
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02]" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
      
      {/* Featured Badge */}
      {(listing.featured || listing.premium_featured) && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className={cn(
            "gap-1 text-xs font-medium shadow-lg",
            listing.premium_featured 
              ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0" 
              : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
          )}>
            <Star className="h-3 w-3" />
            {listing.premium_featured ? "Premium" : "Featured"}
          </Badge>
        </div>
      )}

      <CardContent className="relative p-6 space-y-4">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border/20">
              <AvatarImage src={listing.avatar_url} alt={listing.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {listing.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {listing.online_count && listing.type === 'server' && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-card shadow-sm" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {listing.name}
              </h3>
              <ListingVerificationBadge listingId={listing.id} size="sm" />
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs h-5">
                {listing.type === 'server' ? 'Server' : 'Bot'}
              </Badge>
              {listing.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs h-5 px-2">
                  {tag}
                </Badge>
              ))}
              {listing.tags && listing.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{listing.tags.length - 2}
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

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onView?.(listing.id)}
            variant="outline"
            size="sm"
            className="flex-1 h-9"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View
          </Button>
          
          {listing.invite_url && (
            <Button
              onClick={() => onJoin?.(listing)}
              size="sm"
              className="flex-1 h-9 bg-primary hover:bg-primary/90"
            >
              Join {listing.type === 'server' ? 'Server' : 'Bot'}
            </Button>
          )}
          
          {listing.website_url && (
            <Button
              onClick={() => onWebsite?.(listing)}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            onClick={() => onShare?.(listing.id)}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};