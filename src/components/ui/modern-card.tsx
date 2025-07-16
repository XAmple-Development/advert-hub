import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'premium';
  hover?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true
}) => {
  const baseClasses = "rounded-2xl border backdrop-blur-xl transition-all duration-300";
  
  const variants = {
    default: "bg-card/80 border-border/50",
    glass: "bg-card/40 border-border/30 backdrop-blur-2xl",
    gradient: "bg-gradient-to-br from-card/90 to-card/60 border-border/40",
    premium: "bg-gradient-to-br from-primary/10 via-card/80 to-secondary/10 border-primary/20"
  };
  
  const hoverClasses = hover ? "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/40" : "";
  
  return (
    <div className={cn(baseClasses, variants[variant], hoverClasses, className)}>
      {children}
    </div>
  );
};

export default ModernCard;