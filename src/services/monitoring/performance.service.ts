/**
 * Performance Monitoring Service
 * Tracks and optimizes application performance metrics
 */

import { apiClient } from '@/services/api/client.service';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTI: number; // Time to Interactive
  TTFB: number; // Time to First Byte
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  
  private readonly THRESHOLDS: PerformanceThresholds = {
    FCP: 1800, // 1.8s
    LCP: 2500, // 2.5s
    FID: 100, // 100ms
    CLS: 0.1, // 0.1
    TTI: 3800, // 3.8s
    TTFB: 800, // 800ms
  };

  private readonly BATCH_SIZE = 10;
  private readonly SEND_INTERVAL = 30000; // 30 seconds

  private constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeObservers();
      this.startBatchSending();
    }
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    // Observe paint timing
    this.observePaintTiming();
    
    // Observe largest contentful paint
    this.observeLCP();
    
    // Observe first input delay
    this.observeFID();
    
    // Observe cumulative layout shift
    this.observeCLS();
    
    // Observe navigation timing
    this.observeNavigationTiming();
    
    // Observe resource timing
    this.observeResourceTiming();
  }

  /**
   * Observe paint timing metrics
   */
  private observePaintTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric({
              name: 'FCP',
              value: entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    } catch (e) {
      console.warn('Paint timing observer not supported');
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          metadata: {
            element: lastEntry.element?.tagName,
            size: lastEntry.size,
          },
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (e) {
      console.warn('LCP observer not supported');
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          const delay = fidEntry.processingStart - fidEntry.startTime;
          
          this.recordMetric({
            name: 'FID',
            value: delay,
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              eventType: fidEntry.name,
            },
          });
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (e) {
      console.warn('FID observer not supported');
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS() {
    let clsValue = 0;
    let clsEntries: any[] = [];
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          unit: 'score',
          timestamp: Date.now(),
          metadata: {
            shifts: clsEntries.length,
          },
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming() {
    if ('navigation' in performance && performance.navigation.type === 0) {
      const timing = performance.timing;
      
      // Time to First Byte
      const ttfb = timing.responseStart - timing.navigationStart;
      this.recordMetric({
        name: 'TTFB',
        value: ttfb,
        unit: 'ms',
        timestamp: Date.now(),
      });
      
      // DOM Content Loaded
      const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.recordMetric({
        name: 'DCL',
        value: dcl,
        unit: 'ms',
        timestamp: Date.now(),
      });
      
      // Page Load Time
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      this.recordMetric({
        name: 'Load',
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric({
              name: 'SlowResource',
              value: resourceEntry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              metadata: {
                url: resourceEntry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              },
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (e) {
      console.warn('Resource timing observer not supported');
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Check against thresholds
    this.checkThreshold(metric);
    
    // Send immediately if batch is full
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.sendMetrics();
    }
  }

  /**
   * Check metric against thresholds
   */
  private checkThreshold(metric: PerformanceMetric) {
    const threshold = this.THRESHOLDS[metric.name as keyof PerformanceThresholds];
    
    if (threshold && metric.value > threshold) {
      console.warn(`Performance warning: ${metric.name} (${metric.value}${metric.unit}) exceeds threshold (${threshold}${metric.unit})`);
      
      // You could trigger alerts or notifications here
      this.handlePerformanceIssue(metric, threshold);
    }
  }

  /**
   * Handle performance issues
   */
  private handlePerformanceIssue(metric: PerformanceMetric, threshold: number) {
    // Log to error service for tracking
    import('@/services/error/error-handler.service').then(({ handleError, ErrorCategory, ErrorSeverity }) => {
      handleError(new Error(`Performance threshold exceeded: ${metric.name}`), {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        context: {
          action: 'performance_issue',
          metadata: {
            metric: metric.name,
            value: metric.value,
            threshold,
            exceeded_by: metric.value - threshold,
          },
        },
        showToast: false,
      });
    });
  }

  /**
   * Send metrics to backend
   */
  private async sendMetrics() {
    if (this.metrics.length === 0) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    try {
      // In production, send to your analytics endpoint
      await apiClient.post('/api/analytics/performance', {
        metrics: metricsToSend,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Re-queue metrics on failure
      this.metrics.unshift(...metricsToSend);
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Start batch sending interval
   */
  private startBatchSending() {
    setInterval(() => {
      this.sendMetrics();
    }, this.SEND_INTERVAL);
    
    // Also send on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }

  /**
   * Measure custom timing
   */
  measureTiming(name: string, startMark: string, endMark?: string): number | null {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measures = performance.getEntriesByName(name, 'measure');
      const measure = measures[measures.length - 1];
      
      if (measure) {
        this.recordMetric({
          name: `Custom:${name}`,
          value: measure.duration,
          unit: 'ms',
          timestamp: Date.now(),
        });
        
        return measure.duration;
      }
    } catch (e) {
      console.error('Failed to measure timing:', e);
    }
    
    return null;
  }

  /**
   * Mark a timing point
   */
  mark(name: string) {
    try {
      performance.mark(name);
    } catch (e) {
      console.error('Failed to create mark:', e);
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { values: number[] }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { values: [] };
      }
      summary[metric.name].values.push(metric.value);
    }
    
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, data] of Object.entries(summary)) {
      const values = data.values;
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Destroy observers
   */
  destroy() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// Export convenience functions
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  
  performanceMonitor.mark(startMark);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      performanceMonitor.mark(endMark);
      performanceMonitor.measureTiming(name, startMark, endMark);
    });
  } else {
    performanceMonitor.mark(endMark);
    performanceMonitor.measureTiming(name, startMark, endMark);
  }
  
  return result;
};