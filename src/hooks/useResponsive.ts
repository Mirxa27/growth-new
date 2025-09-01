/**
 * Responsive Design Hooks
 * Custom React hooks for responsive behavior
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'xs';
    return getCurrentBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint(window.innerWidth);
      setBreakpoint(newBreakpoint);
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook to check if screen is at least a certain breakpoint
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Hook to check if device is mobile
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
}

/**
 * Hook to check if device is tablet
 */
export function useIsTablet(): boolean {
  const isAtLeastTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  return isAtLeastTablet && !isDesktop;
}

/**
 * Hook to check if device is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Hook to get viewport dimensions
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Check on mount and when device capabilities might change
    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook for responsive values based on breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint();
  
  return useMemo(() => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the value for current or smaller breakpoint
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    return undefined;
  }, [breakpoint, values]);
}

/**
 * Hook for responsive grid columns
 */
export function useGridColumns(
  defaultColumns: number = 1,
  tablet: number = 2,
  desktop: number = 3,
  large: number = 4
): number {
  const breakpoint = useBreakpoint();
  
  return useMemo(() => {
    switch (breakpoint) {
      case '2xl':
      case 'xl':
        return large;
      case 'lg':
        return desktop;
      case 'md':
      case 'sm':
        return tablet;
      case 'xs':
      default:
        return defaultColumns;
    }
  }, [breakpoint, defaultColumns, tablet, desktop, large]);
}

/**
 * Hook for container width
 */
export function useContainerWidth(): string {
  const breakpoint = useBreakpoint();
  
  return useMemo(() => {
    switch (breakpoint) {
      case '2xl':
        return '1536px';
      case 'xl':
        return '1280px';
      case 'lg':
        return '1024px';
      case 'md':
        return '768px';
      case 'sm':
        return '640px';
      case 'xs':
      default:
        return '100%';
    }
  }, [breakpoint]);
}

/**
 * Hook for safe area insets (for mobile devices with notches)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const styles = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(styles.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(styles.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(styles.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(styles.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}

/**
 * Hook for detecting scroll position
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
}

/**
 * Hook for sticky header behavior
 */
export function useStickyHeader(threshold: number = 100) {
  const [isSticky, setIsSticky] = useState(false);
  const { y } = useScrollPosition();

  useEffect(() => {
    setIsSticky(y > threshold);
  }, [y, threshold]);

  return isSticky;
}

// Helper function to get current breakpoint
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Export utility function for conditional rendering
export function responsiveRender<T>(
  breakpoint: Breakpoint,
  renders: Partial<Record<Breakpoint, T>>
): T | null {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Find the render for current or larger breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (renders[bp] !== undefined) {
      return renders[bp];
    }
  }
  
  return null;
}