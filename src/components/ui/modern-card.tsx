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
  const baseClasses = "rounded-2xl border backdrop-blur-xl transition-all duration-500 relative overflow-hidden";
  
  const variants = {
    default: "bg-card/90 border-border shadow-elevation-sm",
    glass: "bg-card/60 border-border/40 backdrop-blur-3xl shadow-elevation-md",
    gradient: "bg-gradient-to-br from-card to-card-secondary border-border-light shadow-elevation-md",
    premium: "bg-gradient-to-br from-primary/5 via-card/95 to-accent/5 border-primary/30 shadow-elevation-lg shadow-primary/10"
  };
  
  const hoverClasses = hover ? "hover:shadow-elevation-xl hover:shadow-primary/20 hover:-translate-y-2 hover:border-primary/50 hover:scale-[1.01]" : "";
  
  return (
    <div className={cn(baseClasses, variants[variant], hoverClasses, className)}>
      {variant === 'premium' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ModernCard;