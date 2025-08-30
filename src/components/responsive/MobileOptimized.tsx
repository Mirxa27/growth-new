import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mobile Container - Responsive container with proper padding
interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MobileContainer = ({ children, className, ...props }: MobileContainerProps) => {
  return (
    <div
      className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8",
        "max-w-7xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile Grid - Responsive grid system
interface MobileGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export const MobileGrid = ({ 
  children, 
  className, 
  cols = 1, 
  gap = 'md',
  ...props 
}: MobileGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gridGap = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div
      className={cn(
        "grid",
        gridCols[cols],
        gridGap[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile Card - Enhanced card with mobile-first design
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const MobileCard = ({ 
  children, 
  className, 
  title, 
  description, 
  interactive = false,
  onClick,
  ...props 
}: MobileCardProps) => {
  return (
    <Card
      className={cn(
        "glass border-card-border",
        "transition-all duration-200",
        interactive && "cursor-pointer hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={title || description ? "pt-0" : ""}>
        {children}
      </CardContent>
    </Card>
  );
};

// Mobile Typography - Responsive text components
interface MobileTypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  as?: keyof JSX.IntrinsicElements;
}

export const MobileTypography = ({ 
  children, 
  className, 
  variant = 'body',
  as,
  ...props 
}: MobileTypographyProps) => {
  const variants = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-tight',
    h4: 'text-base sm:text-lg lg:text-xl font-medium leading-tight',
    body: 'text-sm sm:text-base leading-relaxed',
    caption: 'text-xs sm:text-sm text-muted-foreground',
    small: 'text-xs text-muted-foreground'
  };

  const defaultElements = {
    h1: 'h1',
    h2: 'h2', 
    h3: 'h3',
    h4: 'h4',
    body: 'p',
    caption: 'p',
    small: 'small'
  };

  const Component = as || defaultElements[variant];

  return React.createElement(
    Component,
    {
      className: cn(variants[variant], className),
      ...props
    },
    children
  );
};

// Mobile Section - Full-width responsive section
interface MobileSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const MobileSection = ({ 
  children, 
  className, 
  padding = 'md',
  ...props 
}: MobileSectionProps) => {
  const paddingClasses = {
    none: '',
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16 lg:py-20',
    lg: 'py-16 sm:py-20 lg:py-24'
  };

  return (
    <section
      className={cn(
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      <MobileContainer>
        {children}
      </MobileContainer>
    </section>
  );
};

// Mobile Stack - Vertical spacing utility
interface MobileStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export const MobileStack = ({ 
  children, 
  className, 
  spacing = 'md',
  ...props 
}: MobileStackProps) => {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};