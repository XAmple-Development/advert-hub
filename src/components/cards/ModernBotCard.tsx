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
      "group relative overflow-hidden bg-card/80 backdrop-blur-sm",
      "border border-border/50 hover:border-primary/30 transition-all duration-200",
      "hover:shadow-lg hover:shadow-primary/10",
      className
    )}>
      {/* Compact Header */}
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 ring-1 ring-border/20">
            <AvatarImage src={bot.avatar_url || undefined} alt={bot.name} />
            <AvatarFallback className="bg-muted text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {bot.name}
              </h3>
              {bot.certified_bot && (
                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="secondary" className="text-xs h-4 px-1.5">
                Bot
              </Badge>
              {bot.library && (
                <Badge variant="outline" className="text-xs h-4 px-1.5">
                  {bot.library}
                </Badge>
              )}
            </div>
          </div>

          <VoteButton
            targetId={bot.id}
            targetType="bot"
            currentVotes={bot.vote_count}
            hasVotedToday={bot.hasVotedToday}
            onVoteSuccess={() => onVoteSuccess(bot.id)}
          />
        </div>

        {/* Compact Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {bot.description}
        </p>

        {/* Compact Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{bot.guilds_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span>{bot.commands_count} commands</span>
          </div>
        </div>

        {/* Compact Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
          >
            <Link to={`/listings/${bot.id}`}>
              View
            </Link>
          </Button>
          
          {bot.invite_url && (
            <Button
              asChild
              size="sm"
              className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90"
            >
              <a href={bot.invite_url} target="_blank" rel="noopener noreferrer">
                Add Bot
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};