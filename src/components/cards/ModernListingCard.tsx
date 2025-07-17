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
      "group relative overflow-hidden border-border transition-all duration-500 hover-lift",
      "h-[140px] bg-card/95 backdrop-blur-xl shadow-elevation-sm",
      "hover:shadow-elevation-lg hover:border-primary/50",
      listing.premium_featured && "ring-2 ring-primary/40 border-primary/30 shadow-primary/10",
      className
    )}>
      {/* Featured Badge */}
      {(listing.featured || listing.premium_featured) && (
        <div className="absolute top-2 right-2 z-20">
          <Badge className="text-xs px-2 py-0.5 bg-amber-500 text-white border-0">
            <Star className="h-3 w-3 mr-1" />
            {listing.premium_featured ? "Premium" : "Featured"}
          </Badge>
        </div>
      )}

      <CardContent className="p-3 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start gap-2.5 mb-2">
          <Avatar className="h-10 w-10 border border-border/40">
            <AvatarImage src={listing.avatar_url} alt={listing.name} />
            <AvatarFallback className="text-xs font-semibold bg-muted">
              {listing.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {listing.name}
              </h3>
              <ListingVerificationBadge listingId={listing.id} size="sm" />
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="text-xs px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">
                {listing.type === 'server' ? 'Server' : 'Bot'}
              </Badge>
              {listing.tags?.slice(0, 1).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 h-4 border-border/40">
                  {tag}
                </Badge>
              ))}
              {listing.tags && listing.tags.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{listing.tags.length - 1}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFavorite?.(listing.id)}
            className={cn(
              "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
              isFavorited && "text-red-500 opacity-100"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isFavorited && "fill-current")} />
          </Button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed flex-1">
          {listing.description}
        </p>

        {/* Stats and Actions */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{formatCount(listing.member_count)}</span>
              </div>
              
              {listing.online_count && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">{formatCount(listing.online_count)}</span>
                </div>
              )}
            </div>

            {listing.last_bumped_at && (
              <div className="text-xs text-muted-foreground">
                {formatDate(listing.last_bumped_at)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <Button
              onClick={() => onView?.(listing.id)}
              variant="outline"
              size="sm"
              className="flex-1 h-6 text-xs border-border/40 hover:border-border/60"
            >
              View
            </Button>
            
            {listing.invite_url && (
              <Button
                onClick={() => onJoin?.(listing)}
                size="sm"
                className="flex-1 h-6 text-xs bg-primary hover:bg-primary/90"
              >
                {listing.type === 'server' ? 'Join' : 'Add'}
              </Button>
            )}
            
            <Button
              onClick={() => onShare?.(listing.id)}
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};