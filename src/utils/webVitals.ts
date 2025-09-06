/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and additional performance metrics
 * with real-time monitoring and analytics integration
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { CLSMetric, FIDMetric, FCPMetric, LCPMetric, TTFBMetric } from 'web-vitals';

// Enhanced metric interface with additional context
interface EnhancedMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
}

// Performance thresholds based on Core Web Vitals guidelines
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// Performance analytics store
class PerformanceAnalytics {
  private metrics: Map<string, EnhancedMetric[]> = new Map();
  private observers: Array<(metric: EnhancedMetric) => void> = [];
  private reportingEndpoint: string | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorTracking();
  }

  /**
   * Initialize Web Vitals monitoring
   */
  init(options: {
    reportingEndpoint?: string;
    enableConsoleLogging?: boolean;
    enableAnalytics?: boolean;
  } = {}) {
    this.reportingEndpoint = options.reportingEndpoint || null;
    this.isEnabled = options.enableAnalytics !== false;

    if (!this.isEnabled) return;

    // Start monitoring Core Web Vitals
    this.startMonitoring();

    // Console logging in development
    if (options.enableConsoleLogging || process.env.NODE_ENV === 'development') {
      this.enableConsoleLogging();
    }

    // Setup performance observer for additional metrics
    this.setupPerformanceObserver();

    console.log('🚀 Web Vitals monitoring initialized', {
      sessionId: this.sessionId,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
    });
  }

  /**
   * Start monitoring all Core Web Vitals
   */
  private startMonitoring() {
    // Largest Contentful Paint (LCP)
    onLCP((metric) => this.handleMetric('LCP', metric));

    // First Input Delay (FID)
    onFID((metric) => this.handleMetric('FID', metric));

    // Cumulative Layout Shift (CLS)
    onCLS((metric) => this.handleMetric('CLS', metric));

    // First Contentful Paint (FCP)
    onFCP((metric) => this.handleMetric('FCP', metric));

    // Time to First Byte (TTFB)
    onTTFB((metric) => this.handleMetric('TTFB', metric));
  }

  /**
   * Handle metric collection and enhancement
   */
  private handleMetric(
    name: string,
    metric: CLSMetric | FIDMetric | FCPMetric | LCPMetric | TTFBMetric
  ) {
    const enhancedMetric: EnhancedMetric = {
      name,
      value: metric.value,
      rating: this.getRating(name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: this.getNavigationType(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
    };

    // Store metric
    this.storeMetric(enhancedMetric);

    // Notify observers
    this.observers.forEach(observer => observer(enhancedMetric));

    // Send to analytics
    this.sendToAnalytics(enhancedMetric);
  }

  /**
   * Get performance rating based on thresholds
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Store metric in memory
   */
  private storeMetric(metric: EnhancedMetric) {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);
    
    // Keep only last 100 entries per metric
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.metrics.set(metric.name, existing);
  }

  /**
   * Send metric to analytics service
   */
  private async sendToAnalytics(metric: EnhancedMetric) {
    if (!this.reportingEndpoint) return;

    try {
      // Use sendBeacon for reliability (falls back to fetch if unavailable)
      const payload = JSON.stringify({
        sessionId: this.sessionId,
        metric,
        timestamp: Date.now(),
        page: window.location.pathname,
      });

      const sent = navigator.sendBeacon?.(this.reportingEndpoint, payload) ||
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).then(() => true).catch(() => false);

      if (!sent && process.env.NODE_ENV === 'development') {
        console.warn('Failed to send metric to analytics:', metric.name);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics reporting failed:', error);
      }
    }
  }

  /**
   * Setup Performance Observer for additional metrics
   */
  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Long Task Observer
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.handleCustomMetric('Long Task', entry.duration, {
              startTime: entry.startTime,
              attribution: (entry as any).attribution,
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Navigation Observer
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          this.handleCustomMetric('DOM Content Loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.handleCustomMetric('Load Complete', navEntry.loadEventEnd - navEntry.loadEventStart);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

      // Resource Observer
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) { // Resources taking longer than 1s
            this.handleCustomMetric('Slow Resource', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

    } catch (error) {
      console.warn('Failed to setup Performance Observer:', error);
    }
  }

  /**
   * Handle custom performance metrics
   */
  private handleCustomMetric(name: string, value: number, additional?: Record<string, any>) {
    const customMetric: EnhancedMetric = {
      name,
      value,
      rating: 'good', // Custom metrics don't have predefined ratings
      delta: 0,
      id: this.generateId(),
      navigationType: this.getNavigationType(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      ...additional,
    };

    this.storeMetric(customMetric);
    this.observers.forEach(observer => observer(customMetric));
    this.sendToAnalytics(customMetric);
  }

  /**
   * Enable console logging of metrics
   */
  private enableConsoleLogging() {
    this.subscribe((metric) => {
      const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
      console.log(`${color} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    });
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleCustomMetric('JavaScript Error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleCustomMetric('Unhandled Promise Rejection', 1, {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });
  }

  /**
   * Get device type based on screen size and user agent
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get connection type from Navigator API
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? `${connection.effectiveType || 'unknown'} (${connection.downlink || 0}Mbps)` : 'unknown';
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): string {
    if ('navigation' in performance) {
      const navType = (performance.navigation as any).type;
      switch (navType) {
        case 0: return 'navigate';
        case 1: return 'reload';
        case 2: return 'back_forward';
        default: return 'unknown';
      }
    }
    return 'unknown';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metric: EnhancedMetric) => void) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) this.observers.splice(index, 1);
    };
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    const summary: Record<string, { latest: EnhancedMetric | null; average: number; count: number }> = {};

    for (const [metricName, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      summary[metricName] = {
        latest: metrics[metrics.length - 1] || null,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: metrics.length,
      };
    }

    return summary;
  }

  /**
   * Get metrics for a specific metric name
   */
  getMetrics(metricName: string): EnhancedMetric[] {
    return this.metrics.get(metricName) || [];
  }

  /**
   * Clear all stored metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
const webVitals = new PerformanceAnalytics();

// Convenience functions for immediate metric collection
export const measureLCP = () => getLCP(console.log);
export const measureFID = () => getFID(console.log);
export const measureCLS = () => getCLS(console.log);
export const measureFCP = () => getFCP(console.log);
export const measureTTFB = () => getTTFB(console.log);

// Export the singleton and types
export default webVitals;
export type { EnhancedMetric };