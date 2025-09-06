/**
 * Advanced Caching Service
 * Implements multi-layer caching with TTL, compression, and intelligent invalidation
 */

import { RetryService } from '@/services/api/retry.service';

// Cache levels
enum CacheLevel {
  MEMORY = 'memory',
  SESSION = 'session',
  LOCAL = 'local',
  INDEXED_DB = 'indexeddb'
}

// Cache strategies
enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only'
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  compressed: boolean;
  accessCount: number;
  lastAccess: number;
  dependencies?: string[];
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  level?: CacheLevel;
  strategy?: CacheStrategy;
  compress?: boolean;
  dependencies?: string[];
  maxSize?: number;
  namespace?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  itemCount: number;
}

/**
 * Advanced Multi-Layer Cache Service
 */
export class AdvancedCacheService {
  private memoryCache = new Map<string, CacheItem>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    itemCount: 0
  };
  
  private readonly maxMemorySize = 50 * 1024 * 1024; // 50MB
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly compressionThreshold = 1024; // 1KB
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupRoutine();
    this.setupEventListeners();
  }

  /**
   * Get item from cache with strategy
   */
  async get<T>(
    key: string, 
    fetchFn?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const { strategy = CacheStrategy.CACHE_FIRST, level = CacheLevel.MEMORY } = options;
    const fullKey = this.getFullKey(key, options.namespace);

    try {
      switch (strategy) {
        case CacheStrategy.CACHE_FIRST:
          return await this.cacheFirst(fullKey, fetchFn, options);
        case CacheStrategy.NETWORK_FIRST:
          return await this.networkFirst(fullKey, fetchFn, options);
        case CacheStrategy.STALE_WHILE_REVALIDATE:
          return await this.staleWhileRevalidate(fullKey, fetchFn, options);
        case CacheStrategy.NETWORK_ONLY:
          return fetchFn ? await fetchFn() : null;
        case CacheStrategy.CACHE_ONLY:
          return await this.getCacheItem(fullKey, level);
        default:
          return await this.cacheFirst(fullKey, fetchFn, options);
      }
    } catch (error) {
      console.error(`[Cache] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in cache
   */
  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const {
      ttl = this.defaultTTL,
      level = CacheLevel.MEMORY,
      compress = false,
      dependencies,
      namespace
    } = options;

    const fullKey = this.getFullKey(key, namespace);

    try {
      let processedData = data;
      let isCompressed = false;
      let size = this.estimateSize(data);

      // Compress if needed
      if (compress && size > this.compressionThreshold) {
        try {
          processedData = await this.compress(data);
          isCompressed = true;
          size = this.estimateSize(processedData);
        } catch (error) {
          console.warn('[Cache] Compression failed, storing uncompressed');
        }
      }

      const cacheItem: CacheItem<T> = {
        data: processedData,
        timestamp: Date.now(),
        ttl,
        version: this.generateVersion(),
        compressed: isCompressed,
        accessCount: 0,
        lastAccess: Date.now(),
        dependencies,
        size
      };

      await this.setCacheItem(fullKey, cacheItem, level);
      this.stats.sets++;
      this.stats.size += size;
      this.stats.itemCount++;

      // Evict if memory limit exceeded
      if (level === CacheLevel.MEMORY) {
        await this.evictIfNeeded();
      }

      return true;
    } catch (error) {
      console.error(`[Cache] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const { level = CacheLevel.MEMORY, namespace } = options;
    const fullKey = this.getFullKey(key, namespace);

    try {
      const existed = await this.deleteCacheItem(fullKey, level);
      if (existed) {
        this.stats.deletes++;
      }
      return existed;
    } catch (error) {
      console.error(`[Cache] Error deleting ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear cache by pattern or level
   */
  async clear(pattern?: string, level?: CacheLevel): Promise<number> {
    let cleared = 0;

    try {
      if (level === CacheLevel.MEMORY || !level) {
        if (pattern) {
          const regex = new RegExp(pattern);
          for (const [key, item] of this.memoryCache.entries()) {
            if (regex.test(key)) {
              this.memoryCache.delete(key);
              this.stats.size -= item.size;
              this.stats.itemCount--;
              cleared++;
            }
          }
        } else {
          cleared = this.memoryCache.size;
          this.memoryCache.clear();
          this.stats.size = 0;
          this.stats.itemCount = 0;
        }
      }

      // Clear other storage levels
      if (level === CacheLevel.SESSION || !level) {
        this.clearStorage(sessionStorage, pattern);
      }

      if (level === CacheLevel.LOCAL || !level) {
        this.clearStorage(localStorage, pattern);
      }

      if (level === CacheLevel.INDEXED_DB || !level) {
        await this.clearIndexedDB(pattern);
      }

      return cleared;
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by dependencies
   */
  async invalidateByDependency(dependency: string): Promise<number> {
    let invalidated = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.dependencies?.includes(dependency)) {
        this.memoryCache.delete(key);
        this.stats.size -= item.size;
        this.stats.itemCount--;
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; memoryUsage: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    const memoryUsage = this.stats.size / this.maxMemorySize;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 100) / 100
    };
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    entries: Array<{ key: string; fetchFn: () => Promise<T>; options?: CacheOptions }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, fetchFn, options = {} }) => {
      try {
        const data = await fetchFn();
        await this.set(key, data, { ...options, ttl: options.ttl || 10 * 60 * 1000 });
      } catch (error) {
        console.warn(`[Cache] Preload failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Private methods

  private async cacheFirst<T>(
    key: string, 
    fetchFn?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.getCacheItem<T>(key, options.level);
    if (cached !== null) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    // Fallback to network if fetch function provided
    if (fetchFn) {
      try {
        const data = await fetchFn();
        await this.set(key, data, options);
        return data;
      } catch (error) {
        console.error('[Cache] Network fetch failed:', error);
        return null;
      }
    }

    return null;
  }

  private async networkFirst<T>(
    key: string,
    fetchFn?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Try network first
    if (fetchFn) {
      try {
        const data = await fetchFn();
        await this.set(key, data, options);
        return data;
      } catch (error) {
        console.warn('[Cache] Network failed, trying cache');
      }
    }

    // Fallback to cache
    const cached = await this.getCacheItem<T>(key, options.level);
    if (cached !== null) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    return null;
  }

  private async staleWhileRevalidate<T>(
    key: string,
    fetchFn?: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Get from cache immediately
    const cached = await this.getCacheItem<T>(key, options.level);
    
    // Background revalidation
    if (fetchFn) {
      RetryService.executeWithBackoff(async () => {
        const fresh = await fetchFn();
        await this.set(key, fresh, options);
      }).catch(error => {
        console.warn('[Cache] Background revalidation failed:', error);
      });
    }

    if (cached !== null) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    return null;
  }

  private async getCacheItem<T>(key: string, level: CacheLevel = CacheLevel.MEMORY): Promise<T | null> {
    let item: CacheItem<T> | null = null;

    switch (level) {
      case CacheLevel.MEMORY:
        item = this.memoryCache.get(key) as CacheItem<T> || null;
        break;
      case CacheLevel.SESSION:
        item = this.getFromStorage<T>(sessionStorage, key);
        break;
      case CacheLevel.LOCAL:
        item = this.getFromStorage<T>(localStorage, key);
        break;
      case CacheLevel.INDEXED_DB:
        item = await this.getFromIndexedDB<T>(key);
        break;
    }

    if (!item || this.isExpired(item)) {
      if (item && level === CacheLevel.MEMORY) {
        this.memoryCache.delete(key);
        this.stats.size -= item.size;
        this.stats.itemCount--;
      }
      return null;
    }

    // Update access stats
    item.accessCount++;
    item.lastAccess = Date.now();

    // Decompress if needed
    let data = item.data;
    if (item.compressed) {
      try {
        data = await this.decompress(data);
      } catch (error) {
        console.error('[Cache] Decompression failed:', error);
        return null;
      }
    }

    return data;
  }

  private async setCacheItem<T>(key: string, item: CacheItem<T>, level: CacheLevel): Promise<void> {
    switch (level) {
      case CacheLevel.MEMORY:
        this.memoryCache.set(key, item);
        break;
      case CacheLevel.SESSION:
        this.setInStorage(sessionStorage, key, item);
        break;
      case CacheLevel.LOCAL:
        this.setInStorage(localStorage, key, item);
        break;
      case CacheLevel.INDEXED_DB:
        await this.setInIndexedDB(key, item);
        break;
    }
  }

  private async deleteCacheItem(key: string, level: CacheLevel): Promise<boolean> {
    switch (level) {
      case CacheLevel.MEMORY:
        const item = this.memoryCache.get(key);
        if (item) {
          this.stats.size -= item.size;
          this.stats.itemCount--;
        }
        return this.memoryCache.delete(key);
      case CacheLevel.SESSION:
        if (sessionStorage.getItem(key)) {
          sessionStorage.removeItem(key);
          return true;
        }
        return false;
      case CacheLevel.LOCAL:
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          return true;
        }
        return false;
      case CacheLevel.INDEXED_DB:
        return await this.deleteFromIndexedDB(key);
      default:
        return false;
    }
  }

  private getFromStorage<T>(storage: Storage, key: string): CacheItem<T> | null {
    try {
      const stored = storage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setInStorage<T>(storage: Storage, key: string, item: CacheItem<T>): void {
    try {
      storage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('[Cache] Storage quota exceeded:', error);
    }
  }

  private clearStorage(storage: Storage, pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && regex.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => storage.removeItem(key));
    } else {
      storage.clear();
    }
  }

  private async getFromIndexedDB<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const db = await this.openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  private async setInIndexedDB<T>(key: string, item: CacheItem<T>): Promise<void> {
    const db = await this.openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, ...item });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<boolean> {
    try {
      const db = await this.openIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  private async clearIndexedDB(pattern?: string): Promise<void> {
    const db = await this.openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      if (pattern) {
        const regex = new RegExp(pattern);
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            if (regex.test(cursor.value.key)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      } else {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    });
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AdvancedCache', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async compress<T>(data: T): Promise<string> {
    const json = JSON.stringify(data);
    // Simple compression - in production, use a proper compression library
    return btoa(json);
  }

  private async decompress<T>(compressed: string): Promise<T> {
    const json = atob(compressed);
    return JSON.parse(json);
  }

  private estimateSize(data: any): number {
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private generateVersion(): string {
    return `v${Date.now()}`;
  }

  private getFullKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private async evictIfNeeded(): Promise<void> {
    if (this.stats.size <= this.maxMemorySize) return;

    // LRU eviction
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

    let evicted = 0;
    for (const [key, item] of entries) {
      if (this.stats.size <= this.maxMemorySize * 0.8) break;
      
      this.memoryCache.delete(key);
      this.stats.size -= item.size;
      this.stats.itemCount--;
      evicted++;
    }

    console.log(`[Cache] Evicted ${evicted} items to free memory`);
  }

  private startCleanupRoutine(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanup(): void {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
        this.stats.size -= item.size;
        this.stats.itemCount--;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired items`);
    }
  }

  private setupEventListeners(): void {
    // Clear cache on low memory
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.9) {
          this.evictIfNeeded();
        }
      }, 30000);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const advancedCache = new AdvancedCacheService();