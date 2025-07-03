import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Eye, 
  Heart, 
  ExternalLink, 
  Share2, 
  Star,
  Calendar,
  TrendingUp,
  MessageSquare,
  Shield,
  Award
} from 'lucide-react';

interface ResponsiveListingCardProps {
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
    created_at: string;
    last_bumped_at?: string;
    rating?: number;
    review_count?: number;
  };
  variant?: 'card' | 'list' | 'compact';
  onView?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  isFavorited?: boolean;
  className?: string;
}

export const ResponsiveListingCard = ({
  listing,
  variant = 'card',
  onView,
  onFavorite,
  onShare,
  isFavorited = false,
  className
}: ResponsiveListingCardProps) => {
  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (variant === 'compact') {
    return (
      <Card className={cn(
        "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-border group",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {listing.avatar_url ? (
                <img
                  src={listing.avatar_url}
                  alt={listing.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/fallback-avatar.png';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              )}
              {listing.featured && (
                <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {listing.name}
                </h3>
                {listing.verified_badge && (
                  <Shield className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {listing.description}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{formatCount(listing.member_count)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3"
                onClick={() => onView?.(listing.id)}
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <Card className={cn(
        "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-border group",
        className
      )}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Avatar & Basic Info */}
            <div className="md:col-span-5 flex items-center gap-4">
              <div className="relative">
                {listing.avatar_url ? (
                  <img
                    src={listing.avatar_url}
                    alt={listing.name}
                    className="w-16 h-16 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/fallback-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                )}
                {listing.featured && (
                  <Star className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {listing.name}
                  </h3>
                  {listing.verified_badge && (
                    <Shield className="h-5 w-5 text-blue-500" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {listing.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="md:col-span-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-lg font-semibold">{formatCount(listing.member_count)}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div className="text-lg font-semibold">{formatCount(listing.view_count)}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
            </div>

            {/* Actions */}
            <div className="md:col-span-3 flex flex-col gap-2">
              <Button
                onClick={() => onView?.(listing.id)}
                className="w-full"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFavorite?.(listing.id)}
                  className={cn(
                    "flex-1",
                    isFavorited && "bg-red-500/10 border-red-500/20 text-red-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShare?.(listing.id)}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card variant
  return (
    <Card className={cn(
      "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/10 hover:border-border group overflow-hidden",
      className
    )}>
      {/* Banner */}
      {listing.banner_url && (
        <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative overflow-hidden">
          <img
            src={listing.banner_url}
            alt={`${listing.name} banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {listing.featured && (
            <Badge className="absolute top-3 right-3 bg-yellow-500/90 text-yellow-900">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {listing.avatar_url ? (
              <img
                src={listing.avatar_url}
                alt={listing.name}
                className={cn(
                  "rounded-xl object-cover",
                  listing.banner_url ? "w-16 h-16 -mt-8 border-4 border-card" : "w-20 h-20"
                )}
                onError={(e) => {
                  e.currentTarget.src = '/fallback-avatar.png';
                }}
              />
            ) : (
              <div className={cn(
                "bg-primary/20 rounded-xl flex items-center justify-center",
                listing.banner_url ? "w-16 h-16 -mt-8 border-4 border-card" : "w-20 h-20"
              )}>
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}
            {!listing.banner_url && listing.featured && (
              <Star className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 fill-yellow-500" />
            )}
          </div>

          {/* Header Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl group-hover:text-primary transition-colors truncate">
                {listing.name}
              </CardTitle>
              {listing.verified_badge && (
                <Shield className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {listing.type}
              </Badge>
              {listing.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {listing.tags && listing.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>

          {/* Rating */}
          {listing.rating && (
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{listing.rating.toFixed(1)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {listing.review_count} reviews
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Description */}
        <p className="text-muted-foreground line-clamp-3">
          {listing.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{formatCount(listing.member_count)}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          {listing.online_count && (
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <div className="font-semibold">{formatCount(listing.online_count)}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          )}
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{formatCount(listing.view_count)}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="font-semibold">{formatCount(listing.bump_count)}</div>
            <div className="text-xs text-muted-foreground">Bumps</div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onView?.(listing.id)}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onFavorite?.(listing.id)}
            className={cn(
              isFavorited && "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onShare?.(listing.id)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(listing.created_at)}</span>
          </div>
          {listing.last_bumped_at && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Bumped {formatDate(listing.last_bumped_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  variant?: 'card' | 'list' | 'compact';
  className?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  variant = 'card',
  className 
}: ResponsiveGridProps) => {
  const getGridClasses = () => {
    switch (variant) {
      case 'list':
        return 'grid grid-cols-1 gap-4';
      case 'compact':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
    }
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
};