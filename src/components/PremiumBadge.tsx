import { Badge } from '@/components/ui/badge';
import { Crown, Star } from 'lucide-react';

interface PremiumBadgeProps {
  tier: 'free' | 'gold' | 'platinum';
  className?: string;
}

export const PremiumBadge = ({ tier, className = '' }: PremiumBadgeProps) => {
  if (tier === 'free') return null;

  const badgeConfig = {
    gold: {
      label: 'Gold',
      icon: Star,
      className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400',
    },
    platinum: {
      label: 'Platinum',
      icon: Crown,
      className: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border-slate-300',
    },
  };

  const config = badgeConfig[tier];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className} flex items-center gap-1 font-medium`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};