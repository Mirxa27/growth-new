/**
 * Bundle Analysis and Optimization Utilities
 * Runtime bundle analysis and performance monitoring
 */

interface ChunkInfo {
  name: string;
  size: number;
  loadTime: number;
  isPreloaded: boolean;
  dependencies: string[];
  loadOrder: number;
}

interface BundleStats {
  totalSize: number;
  chunks: ChunkInfo[];
  criticalPath: string[];
  unusedChunks: string[];
  loadTimeMetrics: {
    firstChunk: number;
    lastChunk: number;
    averageLoadTime: number;
  };
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class BundleAnalyzer {
  private chunkLoadTimes: Map<string, number> = new Map();
  private chunkSizes: Map<string, number> = new Map();
  private loadOrder: string[] = [];
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.analyzeResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      this.performanceObserver.observe({ 
        type: 'resource', 
        buffered: true 
      });
    }

    // Monitor navigation performance
    if ('navigation' in performance) {
      this.analyzeNavigationTiming();
    }

    // Monitor chunk loading via script tags
    this.monitorScriptLoading();
  }

  /**
   * Analyze resource loading entries
   */
  private analyzeResourceEntry(entry: PerformanceResourceTiming): void {
    const url = new URL(entry.name);
    const filename = url.pathname.split('/').pop() || '';
    
    // Check if it's a JavaScript chunk
    if (filename.includes('.js') && entry.transferSize > 0) {
      const chunkName = this.extractChunkName(filename);
      const loadTime = entry.responseEnd - entry.requestStart;
      
      this.chunkLoadTimes.set(chunkName, loadTime);
      this.chunkSizes.set(chunkName, entry.transferSize);
      
      if (!this.loadOrder.includes(chunkName)) {
        this.loadOrder.push(chunkName);
      }

      // Log slow chunks in development
      if (process.env.NODE_ENV === 'development' && loadTime > 1000) {
        console.warn(`[Bundle] Slow chunk detected: ${chunkName} (${loadTime.toFixed(2)}ms)`);
      }
    }
  }

  /**
   * Extract chunk name from filename
   */
  private extractChunkName(filename: string): string {
    // Extract meaningful chunk names from hashed filenames
    const patterns = [
      /^(.+?)-[a-f0-9]{8,}\./,  // name-hash.js
      /^([^-]+)-/,              // name-suffix.js
      /^(.+)\./                 // name.js
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return filename.replace(/\.(js|css)$/, '');
  }

  /**
   * Analyze navigation timing
   */
  private analyzeNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

      console.log('[Bundle] Navigation Timing:', {
        ttfb: `${ttfb.toFixed(2)}ms`,
        domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
        loadComplete: `${loadComplete.toFixed(2)}ms`
      });
    }
  }

  /**
   * Monitor script loading
   */
  private monitorScriptLoading(): void {
    const originalAppendChild = Element.prototype.appendChild;
    
    Element.prototype.appendChild = function<T extends Node>(newChild: T): T {
      if (newChild instanceof HTMLScriptElement && newChild.src) {
        const startTime = performance.now();
        
        newChild.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          const url = new URL(newChild.src);
          const filename = url.pathname.split('/').pop() || '';
          
          if (filename.includes('.js')) {
            const chunkName = this.extractChunkName(filename);
            console.log(`[Bundle] Script loaded: ${chunkName} (${loadTime.toFixed(2)}ms)`);
          }
        });

        newChild.addEventListener('error', () => {
          const url = new URL(newChild.src);
          const filename = url.pathname.split('/').pop() || '';
          console.error(`[Bundle] Script failed to load: ${filename}`);
        });
      }
      
      return originalAppendChild.call(this, newChild);
    }.bind(this);
  }

  /**
   * Get comprehensive bundle statistics
   */
  getBundleStats(): BundleStats {
    const chunks: ChunkInfo[] = [];
    let totalSize = 0;

    for (const [name, size] of this.chunkSizes) {
      const loadTime = this.chunkLoadTimes.get(name) || 0;
      const loadOrder = this.loadOrder.indexOf(name);
      
      chunks.push({
        name,
        size,
        loadTime,
        isPreloaded: this.isChunkPreloaded(name),
        dependencies: this.getChunkDependencies(name),
        loadOrder: loadOrder >= 0 ? loadOrder : 999
      });
      
      totalSize += size;
    }

    // Sort chunks by load order
    chunks.sort((a, b) => a.loadOrder - b.loadOrder);

    const loadTimes = chunks.map(chunk => chunk.loadTime).filter(time => time > 0);
    const criticalPath = this.analyzeCriticalPath(chunks);
    const unusedChunks = this.detectUnusedChunks(chunks);

    return {
      totalSize,
      chunks,
      criticalPath,
      unusedChunks,
      loadTimeMetrics: {
        firstChunk: Math.min(...loadTimes) || 0,
        lastChunk: Math.max(...loadTimes) || 0,
        averageLoadTime: loadTimes.length > 0 
          ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
          : 0
      }
    };
  }

  /**
   * Check if chunk is preloaded
   */
  private isChunkPreloaded(chunkName: string): boolean {
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    return Array.from(preloadLinks).some(link => 
      (link as HTMLLinkElement).href.includes(chunkName)
    );
  }

  /**
   * Get chunk dependencies (simplified analysis)
   */
  private getChunkDependencies(chunkName: string): string[] {
    // In a real implementation, this would analyze the module graph
    // For now, return known common dependencies
    const commonDependencies: { [key: string]: string[] } = {
      'react-core': [],
      'react-ecosystem': ['react-core'],
      'components': ['react-core', 'ui-animations'],
      'pages': ['react-core', 'components'],
      'services': ['react-core'],
      'admin': ['react-core', 'components', 'services']
    };

    return commonDependencies[chunkName] || [];
  }

  /**
   * Analyze critical rendering path
   */
  private analyzeCriticalPath(chunks: ChunkInfo[]): string[] {
    // Identify chunks that are critical for initial render
    const criticalChunks = chunks
      .filter(chunk => 
        chunk.loadOrder < 3 || // First 3 chunks loaded
        chunk.name.includes('react-core') ||
        chunk.name.includes('main') ||
        chunk.name.includes('vendor')
      )
      .map(chunk => chunk.name);

    return criticalChunks;
  }

  /**
   * Detect potentially unused chunks
   */
  private detectUnusedChunks(chunks: ChunkInfo[]): string[] {
    const unusedChunks: string[] = [];
    const currentTime = Date.now();
    const sessionStart = performance.timeOrigin;
    const sessionDuration = currentTime - sessionStart;

    // If session is long enough and chunk hasn't loaded, it might be unused
    if (sessionDuration > 30000) { // 30 seconds
      for (const chunk of chunks) {
        if (chunk.loadTime === 0 && !chunk.name.includes('admin')) {
          unusedChunks.push(chunk.name);
        }
      }
    }

    return unusedChunks;
  }

  /**
   * Get performance recommendations
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getBundleStats();
    const recommendations: string[] = [];

    // Check for large chunks
    const largeChunks = stats.chunks.filter(chunk => chunk.size > 250 * 1024); // 250KB
    if (largeChunks.length > 0) {
      recommendations.push(
        `Consider splitting large chunks: ${largeChunks.map(c => c.name).join(', ')}`
      );
    }

    // Check for slow loading chunks
    const slowChunks = stats.chunks.filter(chunk => chunk.loadTime > 1000);
    if (slowChunks.length > 0) {
      recommendations.push(
        `Optimize slow-loading chunks: ${slowChunks.map(c => c.name).join(', ')}`
      );
    }

    // Check preloading opportunities
    const criticalNotPreloaded = stats.chunks.filter(chunk => 
      stats.criticalPath.includes(chunk.name) && !chunk.isPreloaded
    );
    if (criticalNotPreloaded.length > 0) {
      recommendations.push(
        `Add preload hints for critical chunks: ${criticalNotPreloaded.map(c => c.name).join(', ')}`
      );
    }

    // Check for unused chunks
    if (stats.unusedChunks.length > 0) {
      recommendations.push(
        `Review unused chunks for lazy loading: ${stats.unusedChunks.join(', ')}`
      );
    }

    // Check total bundle size
    if (stats.totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Total bundle size is over 1MB - consider code splitting');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getBundleStats();
    const recommendations = this.getOptimizationRecommendations();

    let report = '# Bundle Analysis Report\n\n';
    
    report += `## Overall Stats\n`;
    report += `- Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB\n`;
    report += `- Total Chunks: ${stats.chunks.length}\n`;
    report += `- Average Load Time: ${stats.loadTimeMetrics.averageLoadTime.toFixed(2)}ms\n\n`;

    report += `## Critical Path\n`;
    report += stats.criticalPath.map(chunk => `- ${chunk}`).join('\n') + '\n\n';

    if (stats.unusedChunks.length > 0) {
      report += `## Unused Chunks\n`;
      report += stats.unusedChunks.map(chunk => `- ${chunk}`).join('\n') + '\n\n';
    }

    if (recommendations.length > 0) {
      report += `## Recommendations\n`;
      report += recommendations.map(rec => `- ${rec}`).join('\n') + '\n\n';
    }

    report += `## Chunk Details\n`;
    stats.chunks.forEach(chunk => {
      report += `### ${chunk.name}\n`;
      report += `- Size: ${(chunk.size / 1024).toFixed(2)} KB\n`;
      report += `- Load Time: ${chunk.loadTime.toFixed(2)}ms\n`;
      report += `- Preloaded: ${chunk.isPreloaded ? 'Yes' : 'No'}\n`;
      if (chunk.dependencies.length > 0) {
        report += `- Dependencies: ${chunk.dependencies.join(', ')}\n`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * Cleanup monitoring
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

// Singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Add global access for debugging
  (window as any).bundleAnalyzer = bundleAnalyzer;
  
  // Auto-generate report after 10 seconds
  setTimeout(() => {
    console.log('[Bundle Analyzer] Performance Report:');
    console.log(bundleAnalyzer.generateReport());
  }, 10000);
}

export default bundleAnalyzer;