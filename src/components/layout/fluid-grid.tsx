import React from 'react';
import { cn } from '@/lib/utils';

interface FluidGridProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
    '4xl'?: number;
    '8xl'?: number;
  };
  rows?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
    '4xl'?: number;
    '8xl'?: number;
  };
  minItemWidth?: string;
  autoFit?: boolean;
}

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  fluid: 'gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 4xl:gap-16 8xl:gap-20',
};

export function FluidGrid({
  children,
  className,
  container = true,
  gap = 'fluid',
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6, '4xl': 8, '8xl': 12 },
  rows,
  minItemWidth = 'minmax(250px, 1fr)',
  autoFit = true,
}: FluidGridProps) {
  const gridClasses = cn(
    container && 'container-type',
    gapMap[gap],
    'grid',
    className
  );

  const getGridTemplate = () => {
    if (autoFit) {
      return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
    }

    return undefined;
  };

  const getResponsiveCols = () => {
    const colClasses = [
      cols.xs && `grid-cols-${cols.xs}`,
      cols.sm && `sm:grid-cols-${cols.sm}`,
      cols.md && `md:grid-cols-${cols.md}`,
      cols.lg && `lg:grid-cols-${cols.lg}`,
      cols.xl && `xl:grid-cols-${cols.xl}`,
      cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
      cols['4xl'] && `4xl:grid-cols-${cols['4xl']}`,
      cols['8xl'] && `8xl:grid-cols-${cols['8xl']}`,
    ].filter(Boolean).join(' ');

    return colClasses;
  };

  const getResponsiveRows = () => {
    if (!rows) return '';
    
    const rowClasses = [
      rows.xs && `grid-rows-${rows.xs}`,
      rows.sm && `sm:grid-rows-${rows.sm}`,
      rows.md && `md:grid-rows-${rows.md}`,
      rows.lg && `lg:grid-rows-${rows.lg}`,
      rows.xl && `xl:grid-rows-${rows.xl}`,
      rows['2xl'] && `2xl:grid-rows-${rows['2xl']}`,
      rows['4xl'] && `4xl:grid-rows-${rows['4xl']}`,
      rows['8xl'] && `8xl:grid-rows-${rows['8xl']}`,
    ].filter(Boolean).join(' ');

    return rowClasses;
  };

  const style = autoFit ? { gridTemplateColumns: getGridTemplate() } : {};

  return (
    <div 
      className={cn(
        gridClasses,
        !autoFit && getResponsiveCols(),
        getResponsiveRows()
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// Container wrapper for responsive layouts
export function FluidContainer({
  children,
  className,
  maxWidth = 'container-lg',
  padding = 'responsive-padding',
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  padding?: string;
}) {
  return (
    <div className={cn('container-type', 'w-full', className)}>
      <div className={cn(
        'mx-auto',
        maxWidth,
        padding,
        'px-4 xs:px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-20 4xl:px-24 8xl:px-32'
      )}>
        {children}
      </div>
    </div>
  );
}

// Utility for responsive spacing
export function ResponsiveSpacer({
  size = 'md',
  axis = 'y',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
  axis?: 'x' | 'y' | 'both';
}) {
  const sizeMap = {
    xs: 'h-2 w-2',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
    fluid: 'h-4 w-4 xs:h-6 xs:w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16 4xl:h-20 4xl:w-20 8xl:h-24 8xl:w-24',
  };

  const classes = cn(
    sizeMap[size],
    axis === 'x' && 'w-auto',
    axis === 'y' && 'h-auto',
  );

  return <div className={classes} />;
}