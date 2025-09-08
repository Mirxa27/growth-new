/**
 * Responsive Hook
 * Provides utilities for responsive design and mobile detection
 */

import { useState, useEffect, useCallback } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isTouch: boolean;
  viewport: {
    width: number;
    height: number;
  };
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

// Breakpoint definitions
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initial state (SSR safe)
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    const height = typeof window !== 'undefined' ? window.innerHeight : 0;
    
    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isLandscape: width > height,
      isTouch: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
      viewport: { width, height },
      breakpoint: width < BREAKPOINTS.mobile ? 'mobile' : 
                  width < BREAKPOINTS.tablet ? 'tablet' : 'desktop',
    };
  });

  const updateState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isLandscape: width > height,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      viewport: { width, height },
      breakpoint: width < BREAKPOINTS.mobile ? 'mobile' : 
                  width < BREAKPOINTS.tablet ? 'tablet' : 'desktop',
    });
  }, []);

  useEffect(() => {
    // Update on mount
    updateState();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150);
    };

    // Listen for resize and orientation change
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateState);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateState);
    };
  }, [updateState]);

  return state;
};

/**
 * Hook for viewport height fix (100vh issues on mobile)
 * Enhanced with better mobile browser support
 */
export const useViewportHeight = () => {
  useEffect(() => {
    const setViewportHeight = () => {
      // Calculate real viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Set additional viewport variables for better compatibility
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      
      // Support for visual viewport API (better mobile support)
      if (window.visualViewport) {
        const visualVh = window.visualViewport.height * 0.01;
        document.documentElement.style.setProperty('--visual-vh', `${visualVh}px`);
        document.documentElement.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`);
      }
    };

    // Set on mount
    setViewportHeight();

    // Update on resize with debouncing for better performance
    let timeoutId: NodeJS.Timeout;
    const debouncedSetViewportHeight = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setViewportHeight, 100);
    };

    // Listen to multiple events for better mobile support
    window.addEventListener('resize', debouncedSetViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Visual viewport events for mobile browsers
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedSetViewportHeight);
      window.visualViewport.addEventListener('scroll', debouncedSetViewportHeight);
    }

    // Handle page visibility changes (helps with mobile browser behavior)
    document.addEventListener('visibilitychange', setViewportHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedSetViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      document.removeEventListener('visibilitychange', setViewportHeight);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedSetViewportHeight);
        window.visualViewport.removeEventListener('scroll', debouncedSetViewportHeight);
      }
    };
  }, []);
};

/**
 * Hook for detecting iOS device
 */
export const useIsIOS = (): boolean => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isIPadOS = navigator.userAgent.includes('Mac') && 'ontouchend' in document;
      return isIOSDevice || isIPadOS;
    };

    setIsIOS(checkIOS());
  }, []);

  return isIOS;
};

/**
 * Hook for safe area insets
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

/**
 * Hook for keyboard visibility on mobile
 */
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewportChange = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const isVisible = windowHeight < documentHeight * 0.75; // Keyboard is likely visible if viewport is less than 75% of original
      
      setIsKeyboardVisible(isVisible);
      setKeyboardHeight(isVisible ? documentHeight - windowHeight : 0);
    };

    // Visual viewport API (better support for mobile keyboards)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleViewportChange);
      window.visualViewport?.addEventListener('scroll', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
};

/**
 * Hook for scroll lock (useful for modals on mobile)
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // Unlock scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = originalStyle;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};