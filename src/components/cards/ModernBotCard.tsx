import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Users, 
  ExternalLink, 
  Github, 
  Star,
  Code,
  Crown,
  Bot,
  Zap,
  Link as LinkIcon
} from 'lucide-react';
import { VoteButton } from '@/components/VoteButton';
import { Link } from 'react-router-dom';

interface ModernBotCardProps {
  bot: {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    bot_id: string | null;
    library: string | null;
    github_url: string | null;
    commands_count: number;
    guilds_count: number;
    certified_bot: boolean;
    vote_count: number;
    monthly_votes: number;
    invite_url: string | null;
    created_at: string;
    user_id: string;
    profiles?: {
      subscription_tier: 'free' | 'gold' | 'platinum' | 'premium';
    }[] | null;
    hasVotedToday?: boolean;
  };
  onVoteSuccess: (botId: string) => void;
  className?: string;
}

export const ModernBotCard = ({
  bot,
  onVoteSuccess,
  className
}: ModernBotCardProps) => {
  const userTier = bot.profiles?.[0]?.subscription_tier || 'free';
  
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'platinum':
      case 'premium':
        return { 
          borderColor: 'border-slate-300/30 hover:border-slate-300/50',
          bgGradient: 'from-slate-500/5 to-slate-600/5',
          badge: { text: 'Platinum', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
        };
      case 'gold':
        return { 
          borderColor: 'border-yellow-400/30 hover:border-yellow-400/50',
          bgGradient: 'from-yellow-500/5 to-orange-500/5',
          badge: { text: 'Gold', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
        };
      default:
        return { 
          borderColor: 'border-border/50 hover:border-border/80',
          bgGradient: 'from-primary/[0.02] to-secondary/[0.02]',
          badge: null
        };
    }
  };

  const tierConfig = getTierConfig(userTier);

  return (
    <Card className={cn(
      "group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80",
      "backdrop-blur-sm transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
      tierConfig.borderColor,
      className
    )}>
      {/* Background Effects */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", tierConfig.bgGradient)} />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
      
      {/* Certified Badge */}
      {bot.certified_bot && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 gap-1 text-xs font-medium shadow-lg">
            <Crown className="h-3 w-3" />
            Certified
          </Badge>
        </div>
      )}

      <CardContent className="relative p-6 space-y-4">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border/20">
              <AvatarImage src={bot.avatar_url || undefined} alt={bot.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-300 font-semibold">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {bot.name}
              </h3>
              {bot.certified_bot && (
                <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs h-5">
                Discord Bot
              </Badge>
              {bot.library && (
                <Badge variant="outline" className="text-xs h-5 px-2 bg-purple-500/10 border-purple-500/30 text-purple-300">
                  {bot.library}
                </Badge>
              )}
              {tierConfig.badge && (
                <Badge variant="outline" className={cn("text-xs h-5 px-2", tierConfig.badge.className)}>
                  {tierConfig.badge.text}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <VoteButton
              targetId={bot.id}
              targetType="bot"
              currentVotes={bot.vote_count}
              hasVotedToday={bot.hasVotedToday}
              onVoteSuccess={() => onVoteSuccess(bot.id)}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {bot.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/30 border border-border/20">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold text-sm">{bot.guilds_count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">servers</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/30 border border-border/20">
            <Code className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold text-sm">{bot.commands_count}</div>
              <div className="text-xs text-muted-foreground">commands</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-9"
          >
            <Link to={`/listings/${bot.id}`}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Details
            </Link>
          </Button>
          
          {bot.invite_url && (
            <Button
              asChild
              size="sm"
              className="flex-1 h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0"
            >
              <a href={bot.invite_url} target="_blank" rel="noopener noreferrer">
                <Zap className="h-4 w-4 mr-2" />
                Add Bot
              </a>
            </Button>
          )}
          
          {bot.github_url && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <a href={bot.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};