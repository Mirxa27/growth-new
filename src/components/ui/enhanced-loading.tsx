import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Brain } from 'lucide-react';

interface EnhancedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  variant?: 'default' | 'page' | 'inline' | 'overlay';
  animated?: boolean;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  size = 'md',
  message = 'Loading...',
  className,
  variant = 'default',
  animated = true
}) => {
  const baseClasses = {
    default: 'flex items-center justify-center',
    page: 'min-h-screen-safe flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4',
    inline: 'inline-flex items-center gap-2',
    overlay: 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm'
  };

  const icons = [Sparkles, Heart, Brain];
  const [currentIcon, setCurrentIcon] = React.useState(0);

  React.useEffect(() => {
    if (animated && variant === 'page') {
      const interval = setInterval(() => {
        setCurrentIcon((prev) => (prev + 1) % icons.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [animated, variant]);

  const CurrentIcon = icons[currentIcon];

  if (variant === 'page') {
    return (
      <div className={cn(baseClasses[variant], className)}>
        <div className="text-center space-y-6 max-w-md">
          {animated ? (
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center">
                  <CurrentIcon className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <LoadingSpinner size="lg" className="mx-auto" />
            </div>
          ) : (
            <LoadingSpinner size="lg" className="mx-auto" />
          )}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{message}</h3>
            <p className="text-sm text-muted-foreground">
              We're preparing your personalized experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(baseClasses[variant], className)}>
      <LoadingSpinner size={size} />
      {variant !== 'inline' && message && (
        <span className="ml-2 text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
};

// Skeleton loading components for better UX
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'default' 
}) => {
  const variants = {
    default: 'h-4 bg-muted rounded animate-pulse',
    card: 'h-24 bg-muted rounded-lg animate-pulse',
    text: 'h-3 bg-muted rounded animate-pulse',
    avatar: 'w-10 h-10 bg-muted rounded-full animate-pulse',
    button: 'h-10 bg-muted rounded-lg animate-pulse'
  };

  return <div className={cn(variants[variant], className)} />;
};

// Loading states for specific components
export const ChatSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[75%] p-3 rounded-2xl ${
          i % 2 === 0 ? 'bg-muted/50' : 'bg-primary/20'
        }`}>
          <Skeleton className="h-3 mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-4">
    {/* Header skeleton */}
    <div className="flex items-center gap-3">
      <Skeleton variant="avatar" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton variant="text" className="w-32" />
      </div>
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
    
    {/* Quick actions skeleton */}
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  </div>
);

export const AssessmentSkeleton: React.FC = () => (
  <div className="space-y-6 p-4">
    {/* Progress skeleton */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
    
    {/* Question skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      
      {/* Options skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
    
    {/* Buttons skeleton */}
    <div className="flex justify-between">
      <Skeleton variant="button" className="w-24" />
      <Skeleton variant="button" className="w-32" />
    </div>
  </div>
);