import React from 'react';
import { cn } from '@/lib/utils';
import { MobileContainer } from '@/components/responsive/MobileOptimized';

interface MobilePageProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'default' | 'gradient' | 'glass';
}

export const MobilePage: React.FC<MobilePageProps> = ({
  children,
  className,
  fullHeight = true,
  padding = 'md',
  background = 'default'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-4 sm:py-6',
    lg: 'py-6 sm:py-8'
  };

  const backgroundClasses = {
    default: '',
    gradient: 'bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5',
    glass: 'bg-gradient-ambient'
  };

  const heightClass = fullHeight ? 'min-h-screen-safe' : '';

  return (
    <div 
      className={cn(
        heightClass,
        backgroundClasses[background],
        'relative overflow-x-hidden',
        className
      )}
    >
      <MobileContainer className={cn(paddingClasses[padding], 'h-full')}>
        {children}
      </MobileContainer>
    </div>
  );
};

// Mobile-optimized section wrapper
interface MobileSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const MobileSection: React.FC<MobileSectionProps> = ({
  children,
  className,
  title,
  description,
  spacing = 'md'
}) => {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  };

  return (
    <section className={cn('w-full', spacingClasses[spacing], className)}>
      {(title || description) && (
        <div className="text-center space-y-2">
          {title && (
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-balance">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground text-balance max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

// Mobile-friendly form wrapper
interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({
  children,
  onSubmit,
  className
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'w-full space-y-4 sm:space-y-6',
        'touch-manipulation', // Optimizes touch interactions
        className
      )}
    >
      {children}
    </form>
  );
};

// Mobile-optimized button group
interface MobileButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

export const MobileButtonGroup: React.FC<MobileButtonGroupProps> = ({
  children,
  orientation = 'responsive',
  className
}) => {
  const orientationClasses = {
    horizontal: 'flex flex-row gap-3',
    vertical: 'flex flex-col gap-3',
    responsive: 'flex flex-col sm:flex-row gap-3'
  };

  return (
    <div className={cn(orientationClasses[orientation], className)}>
      {children}
    </div>
  );
};