/**
 * Advanced Lazy Loading Utilities
 * Provides intelligent component loading with preloading and error recovery
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';

interface LazyLoadOptions {
  retries?: number;
  retryDelay?: number;
  preloadDelay?: number;
  enablePreload?: boolean;
  chunkName?: string;
}

interface LazyComponentCache {
  [key: string]: LazyExoticComponent<ComponentType<any>>;
}

class LazyRouteManager {
  private componentCache: LazyComponentCache = {};
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Create a lazy component with advanced error handling and retry logic
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyLoadOptions = {}
  ): LazyExoticComponent<T> {
    const {
      retries = 3,
      retryDelay = 1000,
      enablePreload = true,
      chunkName = 'unknown'
    } = options;

    const cacheKey = importFn.toString();

    if (this.componentCache[cacheKey]) {
      return this.componentCache[cacheKey] as LazyExoticComponent<T>;
    }

    const lazyComponent = lazy(async () => {
      let lastError: Error;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          this.retryAttempts.set(chunkName, attempt);
          
          const module = await importFn();
          
          // Clear retry attempts on success
          this.retryAttempts.delete(chunkName);
          
          return module;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === retries) {
            // Log final failure
            console.error(`[LazyRoute] Failed to load ${chunkName} after ${retries + 1} attempts:`, error);
            
            // Return error fallback component
            return {
              default: this.createErrorFallback(chunkName, lastError)
            };
          }
          
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.warn(`[LazyRoute] Retry ${attempt + 1}/${retries} for ${chunkName} after ${delay}ms`);
        }
      }
      
      throw lastError!;
    });

    this.componentCache[cacheKey] = lazyComponent;
    
    // Enable preloading if requested
    if (enablePreload && options.preloadDelay !== undefined) {
      this.schedulePreload(importFn, chunkName, options.preloadDelay);
    }

    return lazyComponent;
  }

  /**
   * Preload a component for better user experience
   */
  preloadComponent(importFn: () => Promise<any>, chunkName?: string): Promise<any> {
    const key = chunkName || importFn.toString();
    
    if (this.preloadPromises.has(key)) {
      return this.preloadPromises.get(key)!;
    }

    const preloadPromise = importFn().catch(error => {
      console.warn(`[LazyRoute] Preload failed for ${key}:`, error);
      // Don't throw to avoid unhandled promise rejection
      return null;
    });

    this.preloadPromises.set(key, preloadPromise);
    return preloadPromise;
  }

  /**
   * Schedule component preloading
   */
  private schedulePreload(
    importFn: () => Promise<any>,
    chunkName: string,
    delay: number
  ): void {
    setTimeout(() => {
      this.preloadComponent(importFn, chunkName);
    }, delay);
  }

  /**
   * Create error fallback component
   */
  private createErrorFallback(chunkName: string, error: Error): ComponentType<any> {
    return () => {
      const handleRefresh = () => window.location.reload();
      
      return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Component
          </h2>
          <p className="text-gray-600 mb-4">
            The {chunkName} component failed to load. Please check your internet connection and try refreshing the page.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
      );
    };
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      cachedComponents: Object.keys(this.componentCache).length,
      preloadPromises: this.preloadPromises.size,
      activeRetries: Array.from(this.retryAttempts.entries()).map(([chunk, attempts]) => ({
        chunk,
        attempts
      }))
    };
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.componentCache = {};
    this.preloadPromises.clear();
    this.retryAttempts.clear();
  }
}

// Singleton instance
export const lazyRouteManager = new LazyRouteManager();

/**
 * Create a lazy route with advanced loading capabilities
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  return lazyRouteManager.createLazyComponent(importFn, options);
}

/**
 * Preload routes for better performance
 */
export function preloadRoutes(routes: Array<{
  importFn: () => Promise<any>;
  name: string;
  priority?: 'high' | 'medium' | 'low';
}>): void {
  // Sort by priority
  const sortedRoutes = routes.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });

  // Preload with staggered delays
  sortedRoutes.forEach((route, index) => {
    const delay = index * 200; // 200ms between each preload
    setTimeout(() => {
      lazyRouteManager.preloadComponent(route.importFn, route.name);
    }, delay);
  });
}

/**
 * Route-based preloading strategies
 */
export const preloadStrategies = {
  /**
   * Preload on route hover (for navigation links)
   */
  onHover: (importFn: () => Promise<any>, name: string) => ({
    onMouseEnter: () => lazyRouteManager.preloadComponent(importFn, name),
    onTouchStart: () => lazyRouteManager.preloadComponent(importFn, name),
  }),

  /**
   * Preload on idle (when browser is idle)
   */
  onIdle: (importFn: () => Promise<any>, name: string) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        lazyRouteManager.preloadComponent(importFn, name);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        lazyRouteManager.preloadComponent(importFn, name);
      }, 1000);
    }
  },

  /**
   * Preload on viewport intersection
   */
  onViewport: (
    element: Element,
    importFn: () => Promise<any>,
    name: string,
    options: IntersectionObserverInit = {}
  ) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              lazyRouteManager.preloadComponent(importFn, name);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px', ...options }
      );
      
      observer.observe(element);
      
      return () => observer.disconnect();
    }
    
    return () => {};
  }
};