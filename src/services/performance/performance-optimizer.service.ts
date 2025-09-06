/**
 * Performance Optimization Service
 * Comprehensive performance monitoring, optimization, and web vitals tracking
 */

import React from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { logger } from '@/services/logging/logger.service';

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
}

export interface PerformanceOptimizationConfig {
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableNavigationTiming: boolean;
  enableMemoryTracking: boolean;
  reportingThreshold: number; // Only report if metric exceeds threshold
  batchSize: number; // Number of metrics to batch before sending
}

class PerformanceOptimizerService {
  private static instance: PerformanceOptimizerService;
  private metrics: WebVitalsMetric[] = [];
  private observer?: PerformanceObserver;
  private config: PerformanceOptimizationConfig;
  private readonly thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 }
  };

  private constructor(config: Partial<PerformanceOptimizationConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableMemoryTracking: true,
      reportingThreshold: 0,
      batchSize: 10,
      ...config
    };
    
    this.initialize();
  }

  static getInstance(config?: Partial<PerformanceOptimizationConfig>): PerformanceOptimizerService {
    if (!PerformanceOptimizerService.instance) {
      PerformanceOptimizerService.instance = new PerformanceOptimizerService(config);
    }
    return PerformanceOptimizerService.instance;
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Initialize Web Vitals tracking
    if (this.config.enableWebVitals) {
      this.initializeWebVitals();
    }

    // Initialize Resource Timing monitoring
    if (this.config.enableResourceTiming) {
      this.initializeResourceTiming();
    }

    // Initialize Navigation Timing
    if (this.config.enableNavigationTiming) {
      this.initializeNavigationTiming();
    }

    // Initialize Memory tracking
    if (this.config.enableMemoryTracking) {
      this.initializeMemoryTracking();
    }

    // Setup periodic reporting
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Report every 30 seconds
  }

  private initializeWebVitals() {
    const handleMetric = (metric: any) => {
      const webVitalMetric: WebVitalsMetric = {
        name: metric.name as WebVitalsMetric['name'],
        value: metric.value,
        rating: this.getRating(metric.name, metric.value),
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now()
      };

      this.metrics.push(webVitalMetric);
      this.logMetric(webVitalMetric);

      // Report immediately if threshold exceeded
      if (webVitalMetric.rating === 'poor') {
        this.reportCriticalMetric(webVitalMetric);
      }
    };

    try {
      getCLS(handleMetric, { reportAllChanges: true });
      getFID(handleMetric);
      getFCP(handleMetric);
      getLCP(handleMetric, { reportAllChanges: true });
      getTTFB(handleMetric);
    } catch (error) {
      logger.warn('Web Vitals initialization failed', {
        component: 'PerformanceOptimizerService',
        action: 'initializeWebVitals',
        error
      });
    }
  }

  private initializeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.analyzeResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });

      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      logger.warn('Resource timing monitoring failed', {
        component: 'PerformanceOptimizerService',
        action: 'initializeResourceTiming',
        error
      });
    }
  }

  private initializeNavigationTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.analyzeNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      logger.warn('Navigation timing monitoring failed', {
        component: 'PerformanceOptimizerService',
        action: 'initializeNavigationTiming',
        error
      });
    }
  }

  private initializeMemoryTracking() {
    if (!('memory' in performance)) return;

    const trackMemory = () => {
      try {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const memoryUsage = {
            used: memInfo.usedJSHeapSize,
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            timestamp: Date.now()
          };

          // Log if memory usage is high
          const usagePercentage = (memoryUsage.used / memoryUsage.limit) * 100;
          if (usagePercentage > 80) {
            logger.warn('High memory usage detected', {
              component: 'PerformanceOptimizerService',
              action: 'trackMemory',
              metadata: {
                usagePercentage,
                memoryUsage
              }
            });
          }
        }
      } catch (error) {
        // Silent fail for memory tracking
      }
    };

    // Track memory every minute
    setInterval(trackMemory, 60000);
    trackMemory(); // Initial check
  }

  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    const duration = entry.duration;
    const transferSize = entry.transferSize || 0;
    
    // Flag slow resources
    if (duration > 2000) {
      logger.warn('Slow resource detected', {
        component: 'PerformanceOptimizerService',
        action: 'analyzeResourceTiming',
        metadata: {
          url: entry.name,
          duration,
          transferSize,
          resourceType: this.getResourceType(entry.name)
        }
      });
    }

    // Flag large resources
    if (transferSize > 1024 * 1024) { // 1MB
      logger.warn('Large resource detected', {
        component: 'PerformanceOptimizerService',
        action: 'analyzeResourceTiming',
        metadata: {
          url: entry.name,
          transferSize: Math.round(transferSize / 1024) + 'KB',
          duration
        }
      });
    }
  }

  private analyzeNavigationTiming(entry: PerformanceNavigationTiming) {
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    const pageLoad = entry.loadEventEnd - entry.loadEventStart;
    
    if (domContentLoaded > 3000) {
      logger.warn('Slow DOM content loaded', {
        component: 'PerformanceOptimizerService',
        action: 'analyzeNavigationTiming',
        metadata: {
          domContentLoaded,
          pageLoad,
          url: entry.name
        }
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp')) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metricName as keyof typeof this.thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private logMetric(metric: WebVitalsMetric) {
    const logLevel = metric.rating === 'poor' ? 'warn' : 'info';
    
    logger[logLevel](`Web Vital: ${metric.name}`, {
      component: 'PerformanceOptimizerService',
      action: 'trackWebVital',
      metadata: {
        value: metric.value,
        rating: metric.rating,
        metricId: metric.id
      }
    });
  }

  private async reportCriticalMetric(metric: WebVitalsMetric) {
    try {
      // Send to analytics endpoint
      await this.sendToAnalytics([metric]);
      
      logger.error('Critical performance metric detected', {
        component: 'PerformanceOptimizerService',
        action: 'reportCriticalMetric',
        metadata: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating
        }
      });
    } catch (error) {
      logger.error('Failed to report critical metric', {
        component: 'PerformanceOptimizerService',
        action: 'reportCriticalMetric',
        error
      });
    }
  }

  private async reportMetrics() {
    if (this.metrics.length < this.config.batchSize) return;

    try {
      const metricsToSend = this.metrics.splice(0, this.config.batchSize);
      await this.sendToAnalytics(metricsToSend);
    } catch (error) {
      logger.warn('Failed to report metrics batch', {
        component: 'PerformanceOptimizerService',
        action: 'reportMetrics',
        error
      });
    }
  }

  private async sendToAnalytics(metrics: WebVitalsMetric[]) {
    // In production, send to your analytics service
    // For now, just log the summary
    const summary = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    logger.info('Performance metrics batch', {
      component: 'PerformanceOptimizerService',
      action: 'sendToAnalytics',
      metadata: { summary, count: metrics.length }
    });
  }

  /**
   * Public API methods
   */
  getMetricsSummary(): Record<string, {
    average: number;
    min: number;
    max: number;
    count: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }> {
    const summary: any = {};
    
    ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].forEach(metricName => {
      const metricValues = this.metrics
        .filter(m => m.name === metricName)
        .map(m => m.value);
      
      if (metricValues.length > 0) {
        const average = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
        summary[metricName] = {
          average,
          min: Math.min(...metricValues),
          max: Math.max(...metricValues),
          count: metricValues.length,
          rating: this.getRating(metricName, average)
        };
      }
    });
    
    return summary;
  }

  getLatestMetrics(): WebVitalsMetric[] {
    return this.metrics.slice(-20); // Last 20 metrics
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Performance optimization utilities
   */
  optimizeImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  preloadCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  optimizeForMobile(): void {
    if (typeof window === 'undefined') return;

    // Disable zoom on double-tap for better mobile experience
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }

    // Add touch-action CSS for better touch performance
    const style = document.createElement('style');
    style.textContent = `
      .touch-optimized {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      .scroll-optimized {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }

      .skeleton-shimmer {
        animation: shimmer 2s infinite linear;
        background: linear-gradient(90deg, 
          rgba(255,255,255,0) 0%, 
          rgba(255,255,255,0.2) 20%, 
          rgba(255,255,255,0.5) 60%, 
          rgba(255,255,255,0)
        );
        background-size: 200% 100%;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  enableAccessibilityOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Add focus management
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Enhanced focus styles
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-navigation *:focus:not(:focus-visible) {
        outline: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media (prefers-color-scheme: dark) {
        :root {
          color-scheme: dark;
        }
      }
    `;
    document.head.appendChild(style);
  }

  measureComponentRender(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.debug('Component render time', {
      component: componentName,
      action: 'measureComponentRender',
      metadata: { duration: `${duration.toFixed(2)}ms` }
    });

    return duration;
  }

  markComponentMount(componentName: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-mount-start`);
    }
  }

  markComponentMountEnd(componentName: string): void {
    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      performance.mark(`${componentName}-mount-end`);
      try {
        performance.measure(
          `${componentName}-mount-duration`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        );
      } catch (error) {
        // Silent fail if marks don't exist
      }
    }
  }

  getPerformanceReport(): {
    webVitals: Record<string, any>;
    resources: any[];
    recommendations: string[];
  } {
    const webVitals = this.getMetricsSummary();
    const resources = this.getSlowResources();
    const recommendations = this.generateRecommendations(webVitals, resources);

    return {
      webVitals,
      resources,
      recommendations
    };
  }

  private getSlowResources(): any[] {
    // This would analyze resource timing data
    return [];
  }

  private generateRecommendations(webVitals: any, resources: any[]): string[] {
    const recommendations: string[] = [];

    // Check LCP
    if (webVitals.LCP && webVitals.LCP.rating === 'poor') {
      recommendations.push('Optimize Largest Contentful Paint by compressing images and reducing server response times');
    }

    // Check CLS
    if (webVitals.CLS && webVitals.CLS.rating === 'poor') {
      recommendations.push('Improve Cumulative Layout Shift by specifying image and video dimensions');
    }

    // Check FID
    if (webVitals.FID && webVitals.FID.rating === 'poor') {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution and using code splitting');
    }

    return recommendations;
  }

  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export singleton and utilities
export const performanceOptimizer = PerformanceOptimizerService.getInstance();

// React Hook for performance monitoring
export function usePerformanceOptimization(componentName: string) {
  React.useEffect(() => {
    performanceOptimizer.markComponentMount(componentName);
    
    return () => {
      performanceOptimizer.markComponentMountEnd(componentName);
    };
  }, [componentName]);

  const measureRender = React.useCallback((renderFn: () => void) => {
    return performanceOptimizer.measureComponentRender(componentName, renderFn);
  }, [componentName]);

  return { measureRender };
}

export default performanceOptimizer;
