import React from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

// Container that ensures proper mobile spacing and layout
export const MobileContainer = ({ children, className }: MobileOptimizedProps) => (
  <div className={cn(
    "container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl",
    className
  )}>
    {children}
  </div>
);

// Card component with mobile-optimized spacing
export const MobileCard = ({ children, className }: MobileOptimizedProps) => (
  <div className={cn(
    "glass-card border-glass rounded-lg sm:rounded-xl p-4 sm:p-6",
    className
  )}>
    {children}
  </div>
);

// Grid that adapts from single column on mobile to multiple columns on larger screens
interface MobileGridProps extends MobileOptimizedProps {
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const MobileGrid = ({ children, className, cols = { default: 1, sm: 2, lg: 3 } }: MobileGridProps) => {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(
      "grid gap-4 sm:gap-6",
      gridCols,
      className
    )}>
      {children}
    </div>
  );
};

// Typography that scales appropriately across devices
export const MobileTypography = {
  H1: ({ children, className }: MobileOptimizedProps) => (
    <h1 className={cn(
      "text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight",
      className
    )}>
      {children}
    </h1>
  ),
  H2: ({ children, className }: MobileOptimizedProps) => (
    <h2 className={cn(
      "text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight",
      className
    )}>
      {children}
    </h2>
  ),
  H3: ({ children, className }: MobileOptimizedProps) => (
    <h3 className={cn(
      "text-lg sm:text-xl lg:text-2xl font-semibold leading-tight",
      className
    )}>
      {children}
    </h3>
  ),
  Body: ({ children, className }: MobileOptimizedProps) => (
    <p className={cn(
      "text-sm sm:text-base leading-relaxed",
      className
    )}>
      {children}
    </p>
  ),
  Caption: ({ children, className }: MobileOptimizedProps) => (
    <p className={cn(
      "text-xs sm:text-sm text-muted-foreground",
      className
    )}>
      {children}
    </p>
  ),
};

// Button with mobile-optimized touch targets
interface MobileButtonProps extends MobileOptimizedProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export const MobileButton = ({ 
  children, 
  className, 
  variant = 'default', 
  size = 'default',
  onClick,
  disabled 
}: MobileButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-xs sm:text-sm min-h-[44px] sm:min-h-[32px]", // Ensure 44px touch target on mobile
    default: "h-9 px-4 py-2 text-sm sm:text-base min-h-[44px] sm:min-h-[36px]",
    lg: "h-10 px-8 text-base sm:text-lg min-h-[44px] sm:min-h-[40px]"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Responsive spacing utilities
export const spacing = {
  section: "py-8 sm:py-12 lg:py-16",
  container: "px-4 sm:px-6 lg:px-8",
  element: "mb-4 sm:mb-6 lg:mb-8",
  gap: "gap-4 sm:gap-6 lg:gap-8"
};