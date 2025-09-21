/**
 * Performance Optimization Service
 * Provides utilities for improving application performance
 */

import React from 'react';

export class PerformanceOptimizationService {
  private observers: Map<string, IntersectionObserver> = new Map();
  private prefetchedRoutes: Set<string> = new Set();

  /**
   * Create a debounced function for expensive operations
   */
  createDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    delay: number = 300
  ): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    }) as T;
  }

  /**
   * Create a throttled function for frequent events
   */
  createThrottledFunction<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 100
  ): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages(selector: string = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
    this.observers.set('images', imageObserver);
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    const criticalResources = [
      '/loader.svg'
    ];

    // Only preload symbol.svg if we're on a page that uses it immediately
    const currentPath = window.location.pathname;
    const pagesUsingSymbol = ['/dashboard', '/admin', '/profile'];
    if (pagesUsingSymbol.some(path => currentPath.includes(path))) {
      criticalResources.push('/symbol.svg');
    }

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = resource;
      document.head.appendChild(link);
    });

    // Preload symbol.svg when navigating to pages that use it
    this.setupSmartPreloading();
  }

  /**
   * Setup smart preloading for resources
   */
  setupSmartPreloading() {
    // Listen for navigation events and preload symbol.svg when needed
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const preloadSymbolIfNeeded = (path: string) => {
      const pagesUsingSymbol = ['/dashboard', '/admin', '/profile'];
      if (pagesUsingSymbol.some(pagePath => path.includes(pagePath))) {
        const existingLink = document.querySelector('link[href="/symbol.svg"][rel="preload"]');
        if (!existingLink) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = '/symbol.svg';
          document.head.appendChild(link);
        }
      }
    };

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => preloadSymbolIfNeeded(window.location.pathname), 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => preloadSymbolIfNeeded(window.location.pathname), 0);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => preloadSymbolIfNeeded(window.location.pathname), 0);
    });
  }

  /**
   * Prefetch route components
   */
  async prefetchRoute(routePath: string) {
    if (this.prefetchedRoutes.has(routePath)) {
      return;
    }

    try {
      // This would work with dynamic imports in the actual router
      // For now, we'll just mark it as prefetched
      this.prefetchedRoutes.add(routePath);
      console.info(`Route ${routePath} marked for prefetch`);
    } catch (error) {
      console.warn(`Failed to prefetch route ${routePath}:`, error);
    }
  }

  /**
   * Optimize bundle size by code splitting
   */
  createLazyComponent<T = any>(importFunc: () => Promise<{ default: T }>) {
    return React.lazy(importFunc);
  }

  /**
   * Memory cleanup utilities
   */
  cleanup() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear prefetch cache
    this.prefetchedRoutes.clear();
  }

  /**
   * Monitor performance metrics
   */
  measurePerformance(name: string, fn: () => void | Promise<void>) {
    const startTime = performance.now();
    
    const finish = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
      } else {
        console.info(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      }
    };

    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(finish);
      } else {
        finish();
        return result;
      }
    } catch (error) {
      finish();
      throw error;
    }
  }

  /**
   * Optimize scroll performance
   */
  optimizeScrolling() {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Passive event listeners for better scroll performance
    const passiveOptions = { passive: true };
    
    return {
      onScroll: this.createThrottledFunction((callback: () => void) => {
        window.addEventListener('scroll', callback, passiveOptions);
      }, 16), // ~60fps
      
      onResize: this.createDebouncedFunction((callback: () => void) => {
        window.addEventListener('resize', callback);
      }, 250)
    };
  }

  /**
   * Optimize form performance
   */
  optimizeFormInputs() {
    return {
      debouncedValidation: this.createDebouncedFunction((validate: () => void) => {
        validate();
      }, 300),
      
      throttledSearch: this.createThrottledFunction((search: (query: string) => void, query: string) => {
        search(query);
      }, 200)
    };
  }

  /**
   * Web Vitals monitoring
   */
  monitorWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.info('LCP:', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.info('FID:', (entry as any).processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          console.info('CLS:', (entry as any).value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Service Worker registration for caching
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        registration.addEventListener('updatefound', () => {
          console.info('Service Worker: Update found');
        });
        
        console.info('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    } else {
      console.info('Service Worker not available or not in production mode');
    }
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizationService();