/**
 * Performance Optimization Utilities
 * Production-ready performance enhancements
 */

import { useEffect, useRef, useCallback } from 'react';

// Debounce hook for performance optimization
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttle hook for performance optimization
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastExecutedRef = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastExecutedRef.current >= delay) {
        lastExecutedRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isIntersecting = useRef<boolean>(false);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      isIntersecting.current = entry.isIntersecting;
    }, options);

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options]);

  return { ref: elementRef, isIntersecting: isIntersecting.current };
};

// Memory leak prevention utilities
export const useCleanup = (cleanup: () => void) => {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(label)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  getAverageTime(label: string): number {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((acc, time) => acc + time, 0);
    return sum / measurements.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    for (const [label, measurements] of this.metrics.entries()) {
      result[label] = {
        average: this.getAverageTime(label),
        count: measurements.length
      };
    }
    
    return result;
  }

  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.getMetrics());
    }
  }
}

// Resource preloading utilities
export const preloadResource = (href: string, as: string = 'fetch'): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Memory usage monitoring
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const getMemoryUsage = (): MemoryInfo | null => {
  if ('memory' in performance) {
    return (performance as any).memory as MemoryInfo;
  }
  return null;
};

// Bundle size optimization helpers
export const lazyImport = <T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> => {
  return importFn().then(module => module.default);
};

// Cache utilities for API responses
export class SimpleCache<T = any> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Create global cache instance
export const globalCache = new SimpleCache();

// Performance optimization hooks
export const usePerformanceMonitor = (label: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  return useCallback(() => {
    return monitor.startTiming(label);
  }, [label, monitor]);
};

// Optimize re-renders
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Image optimization utilities
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  // In a real app, you might use a service like Cloudinary or ImageKit
  // For now, just return the original URL
  return url;
};

// Network optimization
export const isSlowConnection = (): boolean => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }
  return false;
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Service Worker utilities for caching
export const registerServiceWorker = async (): Promise<void> => {
  // Disable service worker for now to avoid MIME type issues
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && false) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }
};

// Critical resource hints
export const addResourceHints = (): void => {
  // DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'https://api.openai.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnectDomains = [
    'https://api.openai.com'
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};