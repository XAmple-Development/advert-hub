import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, Crown, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  status: 'pending' | 'verified' | 'rejected' | null;
  level?: 'basic' | 'premium' | 'partner';
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const VerificationBadge = ({ 
  status, 
  level = 'basic', 
  showTooltip = true, 
  size = 'sm' 
}: VerificationBadgeProps) => {
  console.log('VerificationBadge render:', { status, level, size });
  
  // Only render if status is verified or pending
  if (!status || status === 'rejected') {
    console.log('VerificationBadge: Not rendering due to status:', status);
    return null;
  }

  const getIcon = () => {
    switch (level) {
      case 'partner':
        return <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />;
      case 'premium':
        return <Sparkles className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />;
      default:
        return <ShieldCheck className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />;
    }
  };

  const getBadgeProps = () => {
    if (status === 'pending') {
      return {
        variant: 'secondary' as const,
        className: 'text-yellow-600 bg-yellow-100 border-yellow-300',
        text: 'Pending',
        icon: <Shield className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      };
    }

    switch (level) {
      case 'partner':
        return {
          variant: 'default' as const,
          className: 'text-purple-600 bg-purple-100 border-purple-300',
          text: 'Partner',
          icon: getIcon()
        };
      case 'premium':
        return {
          variant: 'default' as const,
          className: 'text-blue-600 bg-blue-100 border-blue-300',
          text: 'Premium',
          icon: getIcon()
        };
      default:
        return {
          variant: 'default' as const,
          className: 'text-green-600 bg-green-100 border-green-300',
          text: 'Verified',
          icon: getIcon()
        };
    }
  };

  const badgeProps = getBadgeProps();

  const getTooltipContent = () => {
    if (status === 'pending') {
      return 'Verification pending review';
    }

    switch (level) {
      case 'partner':
        return 'Official Discord Partner - Highest level of verification';
      case 'premium':
        return 'Premium Verified - Enhanced server with premium features';
      default:
        return 'Verified Server - Meets community standards';
    }
  };

  const badge = (
    <div className="inline-flex relative z-10">
      <Badge 
        variant={badgeProps.variant}
        className={`${badgeProps.className} ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} gap-1 relative z-10`}
      >
        {badgeProps.icon}
        {badgeProps.text}
      </Badge>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {badge}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;