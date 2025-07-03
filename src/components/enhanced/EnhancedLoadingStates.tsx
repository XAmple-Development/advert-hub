import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const EnhancedLoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  text,
  variant = 'default'
}: EnhancedLoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[variant]}`} />
      {text && (
        <span className={`text-sm ${colorClasses[variant]}`}>
          {text}
        </span>
      )}
    </div>
  );
};

interface ListingCardSkeletonProps {
  count?: number;
}

export const ListingCardSkeleton = ({ count = 1 }: ListingCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex justify-between items-center pt-3">
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

interface ProgressLoadingProps {
  value: number;
  text?: string;
  status?: 'loading' | 'success' | 'error';
  className?: string;
}

export const ProgressLoading = ({ 
  value, 
  text, 
  status = 'loading',
  className = '' 
}: ProgressLoadingProps) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        {text && <span className="text-sm font-medium">{text}</span>}
      </div>
      <div className="space-y-2">
        <Progress value={value} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  className?: string;
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="mb-4 opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button 
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ 
  title, 
  description, 
  onRetry,
  className = '' 
}: ErrorStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export const LoadingOverlay = ({ isLoading, text, children }: LoadingOverlayProps) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <EnhancedLoadingSpinner size="lg" text={text} variant="primary" />
        </div>
      )}
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  variant?: 'card' | 'list' | 'table';
}

export const SkeletonList = ({ count = 3, variant = 'card' }: SkeletonListProps) => {
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 p-4 border border-border rounded-lg">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return <ListingCardSkeleton count={count} />;
};

interface LoadingStateManagerProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error?: string;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingStateManager = ({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  loadingComponent,
  emptyComponent,
  errorComponent,
  children
}: LoadingStateManagerProps) => {
  if (isLoading) {
    return <>{loadingComponent || <SkeletonList />}</>;
  }

  if (isError) {
    return <>{errorComponent || <ErrorState title="Something went wrong" description={error} onRetry={onRetry} />}</>;
  }

  if (isEmpty) {
    return <>{emptyComponent || <EmptyState title="No data found" description="There's nothing to display here yet." />}</>;
  }

  return <>{children}</>;
};

// Delayed loading component for better perceived performance
interface DelayedLoadingProps {
  delay?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const DelayedLoading = ({ delay = 300, fallback, children }: DelayedLoadingProps) => {
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!showLoading) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};