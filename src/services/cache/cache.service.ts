/**
 * Data Caching Service
 * Provides intelligent caching with TTL, memory management, and persistence
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  persist?: boolean; // Persist to localStorage
  maxSize?: number; // Max entries in cache
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly STORAGE_PREFIX = 'app_cache_';

  private constructor() {
    this.loadPersistedCache();
    this.startCleanupInterval();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check persistent cache
    const persistedEntry = this.getFromStorage<T>(key);
    if (persistedEntry && this.isValid(persistedEntry)) {
      // Move to memory cache for faster access
      this.memoryCache.set(key, persistedEntry);
      return persistedEntry.data;
    }

    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl || this.DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Persist if requested
    if (options?.persist) {
      this.saveToStorage(key, entry);
    }

    // Enforce max cache size
    this.enforceMaxSize(options?.maxSize);
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    this.removeFromStorage(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.clearStorage();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    // Clear from memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from storage
    const keys = this.getStorageKeys();
    keys.forEach(key => {
      const entry = this.getFromStorage(key);
      if (entry && !this.isValid(entry)) {
        this.removeFromStorage(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    persistedSize: number;
    hitRate: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      persistedSize: this.getStorageKeys().length,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Load persisted cache from localStorage
   */
  private loadPersistedCache(): void {
    try {
      const keys = this.getStorageKeys();
      keys.forEach(key => {
        const entry = this.getFromStorage(key);
        if (entry && this.isValid(entry)) {
          this.memoryCache.set(key, entry);
        }
      });
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Get data from localStorage
   */
  private getFromStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to get from storage:', error);
    }
    return null;
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      localStorage.setItem(
        this.STORAGE_PREFIX + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to save to storage:', error);
      // If storage is full, clear some old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldestStorageEntries(5);
        // Try again
        try {
          localStorage.setItem(
            this.STORAGE_PREFIX + key,
            JSON.stringify(entry)
          );
        } catch {
          // Give up
        }
      }
    }
  }

  /**
   * Remove from localStorage
   */
  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove from storage:', error);
    }
  }

  /**
   * Clear all cache from localStorage
   */
  private clearStorage(): void {
    try {
      const keys = this.getStorageKeys();
      keys.forEach(key => {
        localStorage.removeItem(this.STORAGE_PREFIX + key);
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Get all cache keys from localStorage
   */
  private getStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        keys.push(key.substring(this.STORAGE_PREFIX.length));
      }
    }
    return keys;
  }

  /**
   * Clear oldest entries from storage
   */
  private clearOldestStorageEntries(count: number): void {
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    this.getStorageKeys().forEach(key => {
      const entry = this.getFromStorage(key);
      if (entry) {
        entries.push({ key, timestamp: entry.timestamp });
      }
    });

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries
    entries.slice(0, count).forEach(({ key }) => {
      this.removeFromStorage(key);
    });
  }

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(maxSize?: number): void {
    const limit = maxSize || this.MAX_CACHE_SIZE;
    
    if (this.memoryCache.size > limit) {
      // Convert to array and sort by timestamp
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries
      const toRemove = entries.slice(0, this.memoryCache.size - limit);
      toRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
      });
    }
  }

  /**
   * Start interval to clean up expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.clearExpired();
    }, 60000); // Run every minute
  }

  /**
   * Calculate cache hit rate (placeholder for analytics)
   */
  private calculateHitRate(): number {
    // In a real implementation, you would track hits and misses
    return 0;
  }

  /**
   * Create a cache key from multiple parts
   */
  static createKey(...parts: any[]): string {
    return parts.map(p => String(p)).join(':');
  }
}

// Export singleton instance
export const cache = CacheService.getInstance();

// Export cache decorators
export function Cacheable(options?: CacheOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = CacheService.createKey(target.constructor.name, propertyKey, ...args);
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      if (result !== null && result !== undefined) {
        cache.set(cacheKey, result, options);
      }

      return result;
    };

    return descriptor;
  };
}

// Export cache utilities
export const cacheUtils = {
  /**
   * Memoize a function with caching
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    options?: CacheOptions & { keyResolver?: (...args: Parameters<T>) => string }
  ): T {
    return ((...args: Parameters<T>) => {
      const key = options?.keyResolver 
        ? options.keyResolver(...args)
        : CacheService.createKey(fn.name, ...args);
      
      const cached = cache.get(key);
      if (cached !== null) {
        return cached as ReturnType<T>;
      }

      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.then(value => {
          cache.set(key, value, options);
          return value;
        });
      }

      cache.set(key, result, options);
      return result;
    }) as T;
  },

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of cache['memoryCache'].keys()) {
      if (regex.test(key)) {
        cache.remove(key);
      }
    }
  },
};