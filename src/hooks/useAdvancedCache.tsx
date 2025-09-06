/**
 * Advanced Cache React Hook
 * Provides React integration for the advanced caching service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { advancedCache } from '@/services/cache/advancedCache.service';
import type { CacheOptions } from '@/services/cache/advancedCache.service';

interface UseAdvancedCacheOptions<T> extends CacheOptions {
  enabled?: boolean;
  refreshInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  suspense?: boolean;
}

interface UseAdvancedCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isValidating: boolean;
  mutate: (data?: T | Promise<T> | ((current: T | null) => T | Promise<T>)) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
  stats: {
    hitRate: number;
    lastUpdated: number | null;
    cacheSize: number;
  };
}

/**
 * Advanced cache hook with React integration
 */
export function useAdvancedCache<T>(
  key: string | null,
  fetcher?: () => Promise<T>,
  options: UseAdvancedCacheOptions<T> = {}
): UseAdvancedCacheResult<T> {
  const {
    enabled = true,
    refreshInterval,
    onSuccess,
    onError,
    suspense = false,
    ...cacheOptions
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetcherRef = useRef(fetcher);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  fetcherRef.current = fetcher;

  /**
   * Fetch data with caching
   */
  const fetchData = useCallback(async (isRefresh = false): Promise<T | null> => {
    if (!key || !enabled) return null;

    try {
      if (!isRefresh) setIsLoading(true);
      setIsValidating(true);
      setError(null);

      const cachedData = await advancedCache.get<T>(
        key,
        fetcherRef.current,
        cacheOptions
      );

      if (mountedRef.current) {
        setData(cachedData);
        setLastUpdated(Date.now());
        
        if (cachedData && onSuccess) {
          onSuccess(cachedData);
        }
      }

      return cachedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (mountedRef.current) {
        setError(error);
        if (onError) {
          onError(error);
        }
      }
      
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [key, enabled, cacheOptions, onSuccess, onError]);

  /**
   * Mutate cache data
   */
  const mutate = useCallback(async (
    updater?: T | Promise<T> | ((current: T | null) => T | Promise<T>)
  ): Promise<void> => {
    if (!key) return;

    try {
      let newData: T | null = null;

      if (typeof updater === 'function') {
        const updateFn = updater as (current: T | null) => T | Promise<T>;
        newData = await Promise.resolve(updateFn(data));
      } else if (updater !== undefined) {
        newData = await Promise.resolve(updater);
      } else {
        // Re-fetch from source
        newData = await fetchData(true);
        return;
      }

      if (newData !== null) {
        await advancedCache.set(key, newData, cacheOptions);
        
        if (mountedRef.current) {
          setData(newData);
          setLastUpdated(Date.now());
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (mountedRef.current) {
        setError(error);
      }
    }
  }, [key, data, cacheOptions, fetchData]);

  /**
   * Refresh data from source
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Clear cache entry
   */
  const clear = useCallback(async (): Promise<void> => {
    if (!key) return;

    await advancedCache.delete(key, cacheOptions);
    
    if (mountedRef.current) {
      setData(null);
      setLastUpdated(null);
      setError(null);
    }
  }, [key, cacheOptions]);

  // Initial fetch
  useEffect(() => {
    if (enabled && key) {
      fetchData();
    }
  }, [key, enabled, fetchData]);

  // Refresh interval
  useEffect(() => {
    if (refreshInterval && enabled && key) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, enabled, key, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Suspense support
  if (suspense && isLoading && !data) {
    throw fetchData();
  }

  const cacheStats = advancedCache.getStats();

  return {
    data,
    isLoading,
    error,
    isValidating,
    mutate,
    refresh,
    clear,
    stats: {
      hitRate: cacheStats.hitRate,
      lastUpdated,
      cacheSize: cacheStats.size,
    },
  };
}

/**
 * Hook for preloading data
 */
export function usePreloadCache() {
  const preload = useCallback(async <T,>(
    entries: Array<{
      key: string;
      fetcher: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<void> => {
    const preloadEntries = entries.map(({ key, fetcher, options = {} }) => ({
      key,
      fetchFn: fetcher,
      options,
    }));

    await advancedCache.preload(preloadEntries);
  }, []);

  return { preload };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(advancedCache.getStats());

  const refreshStats = useCallback(() => {
    setStats(advancedCache.getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshStats, 1000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const clearCache = useCallback(async (pattern?: string) => {
    const cleared = await advancedCache.clear(pattern);
    refreshStats();
    return cleared;
  }, [refreshStats]);

  const invalidateByDependency = useCallback(async (dependency: string) => {
    const invalidated = await advancedCache.invalidateByDependency(dependency);
    refreshStats();
    return invalidated;
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clearCache,
    invalidateByDependency,
  };
}

/**
 * Hook for cache invalidation
 */
export function useCacheInvalidation() {
  const invalidateQueries = useCallback(async (pattern: string) => {
    return await advancedCache.clear(pattern);
  }, []);

  const invalidateByTags = useCallback(async (tags: string[]) => {
    let totalInvalidated = 0;
    for (const tag of tags) {
      totalInvalidated += await advancedCache.invalidateByDependency(tag);
    }
    return totalInvalidated;
  }, []);

  const invalidateAll = useCallback(async () => {
    return await advancedCache.clear();
  }, []);

  return {
    invalidateQueries,
    invalidateByTags,
    invalidateAll,
  };
}

/**
 * HOC for cache-aware components
 */
export function withCache<P extends object, T>(
  Component: React.ComponentType<P & { data: T | null; isLoading: boolean }>,
  cacheKey: (props: P) => string,
  fetcher: (props: P) => Promise<T>,
  options?: UseAdvancedCacheOptions<T>
) {
  return function CachedComponent(props: P) {
    const key = cacheKey(props);
    const { data, isLoading, ...cacheProps } = useAdvancedCache(
      key,
      () => fetcher(props),
      options
    );

    return (
      <Component
        {...props}
        data={data}
        isLoading={isLoading}
        {...cacheProps}
      />
    );
  };
}

/**
 * Hook for offline-aware caching
 */
export function useOfflineCache<T>(
  key: string | null,
  fetcher?: () => Promise<T>,
  options: UseAdvancedCacheOptions<T> = {}
) {
  const isOnline = navigator.onLine;
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setWasOffline(true);
    const handleOnline = () => {
      if (wasOffline) {
        // Refresh data when coming back online
        setTimeout(() => refresh(), 100);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);

  const cacheResult = useAdvancedCache(key, fetcher, {
    ...options,
    strategy: isOnline ? options.strategy : 'cache-only',
  });

  const { refresh } = cacheResult;

  return {
    ...cacheResult,
    isOffline: !isOnline,
    wasOffline,
  };
}