import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './button';

interface ModernButtonProps extends ButtonProps {
  glow?: boolean;
  gradient?: boolean;
  icon?: React.ReactNode;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  className,
  glow = false,
  gradient = false,
  icon,
  variant = 'default',
  ...props
}) => {
  const glowClass = glow ? "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40" : "";
  const gradientClass = gradient ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80" : "";
  
  return (
    <Button
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        glowClass,
        gradientClass,
        className
      )}
      variant={variant}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && icon}
        {children}
      </div>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </Button>
  );
};

export default ModernButton;