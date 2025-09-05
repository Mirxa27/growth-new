/**
 * Responsive Container Component
 * Mobile-first responsive design with accessibility features
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
  id?: string;
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3 md:p-4',
  md: 'p-3 sm:p-4 md:p-6',
  lg: 'p-4 sm:p-6 md:p-8',
  xl: 'p-6 sm:p-8 md:p-12'
};

export const ResponsiveContainer = React.forwardRef<
  HTMLElement,
  ResponsiveContainerProps
>(({ 
  children, 
  className, 
  maxWidth = 'lg', 
  padding = 'md',
  as: Component = 'div',
  id,
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  ...props 
}, ref) => {
  return (
    <Component
      ref={ref}
      id={id}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        'px-4 sm:px-6 md:px-8 lg:px-12',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';