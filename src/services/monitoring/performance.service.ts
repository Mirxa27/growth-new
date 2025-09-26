import { logger } from '@/services/logging/structured-logger.service';

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcpScore: number;
  lcpScore: number;
  fidScore: number;
  clsScore: number;
  ttfbScore: number;
  overallScore: number;
}

export interface PerformanceThresholds {
  fcp: { good: number; needsImprovement: number; poor: number };
  lcp: { good: number; needsImprovement: number; poor: number };
  fid: { good: number; needsImprovement: number; poor: number };
  cls: { good: number; needsImprovement: number; poor: number };
  ttfb: { good: number; needsImprovement: number; poor: number };
}

// Type for layout shift entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    fcpScore: 0,
    lcpScore: 0,
    fidScore: 0,
    clsScore: 0,
    ttfbScore: 0,
    overallScore: 0
  };
  private thresholds: PerformanceThresholds;
  private isMonitoring = false;
  private observer: PerformanceObserver | null = null;

  private constructor() {
    // Production-ready performance thresholds
    this.thresholds = {
      fcp: { good: 1800, needsImprovement: 3000, poor: 4000 }, // 1.8s, 3s, 4s
      lcp: { good: 2500, needsImprovement: 4000, poor: 5000 }, // 2.5s, 4s, 5s
      fid: { good: 100, needsImprovement: 300, poor: 500 }, // 100ms, 300ms, 500ms
      cls: { good: 0.1, needsImprovement: 0.25, poor: 0.5 }, // 0.1, 0.25, 0.5
      ttfb: { good: 800, needsImprovement: 1800, poor: 2500 } // 800ms, 1.8s, 2.5s
    };

    // Use development-inflated thresholds only in development
    if (process.env.NODE_ENV === 'development') {
      this.thresholds = {
        fcp: { good: 4000, needsImprovement: 6000, poor: 8000 }, // 4s, 6s, 8s
        lcp: { good: 5000, needsImprovement: 7000, poor: 9000 }, // 5s, 7s, 9s
        fid: { good: 300, needsImprovement: 600, poor: 1000 }, // 300ms, 600ms, 1s
        cls: { good: 0.2, needsImprovement: 0.4, poor: 0.8 }, // 0.2, 0.4, 0.8
        ttfb: { good: 2000, needsImprovement: 3000, poor: 4000 } // 2s, 3s, 4s
      };
    }

    this.initialize();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    try {
      // Check if PerformanceObserver is supported
      if ('PerformanceObserver' in window) {
        this.setupPerformanceObserver();
        this.isMonitoring = true;
        logger.info('Performance monitoring initialized', 'PerformanceMonitor', 'initialize');
      } else {
        logger.warn('PerformanceObserver not supported in this browser', 'PerformanceMonitor', 'initialize');
      }
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error as Error, 'PerformanceMonitor', 'initialize');
    }
  }

  private setupPerformanceObserver(): void {
    try {
      // Monitor LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = Math.round(lastEntry.startTime);
        this.calculateLCPScore();
        this.logMetric('LCP', this.metrics.lcp!, this.thresholds.lcp);
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = Math.round(fcpEntry.startTime);
          this.calculateFCPScore();
          this.logMetric('FCP', this.metrics.fcp!, this.thresholds.fcp);
        }
      });

      fcpObserver.observe({ entryTypes: ['paint'] });

      // Monitor FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fidEntry = entries[0] as PerformanceEventTiming;
        this.metrics.fid = Math.round(fidEntry.processingStart - fidEntry.startTime);
        this.calculateFIDScore();
        this.logMetric('FID', this.metrics.fid!, this.thresholds.fid);
      });

      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        this.metrics.cls = Math.round(clsValue * 1000) / 1000; // Round to 3 decimal places
        this.calculateCLSScore();
        this.logMetric('CLS', this.metrics.cls!, this.thresholds.cls);
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Monitor TTFB (Time to First Byte)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.metrics.ttfb = Math.round(navigationEntry.responseStart - navigationEntry.requestStart);
        this.calculateTTFBScore();
        this.logMetric('TTFB', this.metrics.ttfb!, this.thresholds.ttfb);
      }

      // Calculate overall score when page is fully loaded
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.calculateOverallScore();
          this.sendMetricsToAnalytics();
        }, 1000); // Wait 1 second after load for all metrics to be collected
      });

    } catch (error) {
      logger.error('Error setting up performance observers', error as Error, 'PerformanceMonitor', 'setupPerformanceObserver');
    }
  }

  private calculateFCPScore(): void {
    if (!this.metrics.fcp) return;
    this.metrics.fcpScore = this.calculateScore(this.metrics.fcp, this.thresholds.fcp);
  }

  private calculateLCPScore(): void {
    if (!this.metrics.lcp) return;
    this.metrics.lcpScore = this.calculateScore(this.metrics.lcp, this.thresholds.lcp);
  }

  private calculateFIDScore(): void {
    if (!this.metrics.fid) return;
    this.metrics.fidScore = this.calculateScore(this.metrics.fid, this.thresholds.fid);
  }

  private calculateCLSScore(): void {
    if (!this.metrics.cls) return;
    this.metrics.clsScore = this.calculateScore(this.metrics.cls, this.thresholds.cls);
  }

  private calculateTTFBScore(): void {
    if (!this.metrics.ttfb) return;
    this.metrics.ttfbScore = this.calculateScore(this.metrics.ttfb, this.thresholds.ttfb);
  }

  private calculateScore(value: number, thresholds: { good: number; needsImprovement: number; poor: number }): number {
    if (value <= thresholds.good) return 100;
    if (value <= thresholds.needsImprovement) return 75;
    if (value <= thresholds.poor) return 50;
    return 25;
  }

  private calculateOverallScore(): void {
    const scores = [
      this.metrics.fcpScore,
      this.metrics.lcpScore,
      this.metrics.fidScore,
      this.metrics.clsScore,
      this.metrics.ttfbScore
    ].filter(Boolean) as number[];

    if (scores.length === 0) return;

    this.metrics.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    logger.info(`Performance score calculated: ${this.metrics.overallScore}/100`, 'PerformanceMonitor', 'calculateOverallScore', {
      fcp: this.metrics.fcp,
      lcp: this.metrics.lcp,
      fid: this.metrics.fid,
      cls: this.metrics.cls,
      ttfb: this.metrics.ttfb,
      overallScore: this.metrics.overallScore
    });

    // Send performance alert if score is poor
    if (this.metrics.overallScore < 50) {
      logger.warn('Poor performance detected', 'PerformanceMonitor', 'calculateOverallScore', {
        overallScore: this.metrics.overallScore,
        metrics: this.metrics
      });
    }
  }

  private logMetric(name: string, value: number, thresholds: { good: number; needsImprovement: number; poor: number }): void {
    let status: 'good' | 'needs-improvement' | 'poor';

    if (value <= thresholds.good) {
      status = 'good';
    } else if (value <= thresholds.needsImprovement) {
      status = 'needs-improvement';
    } else {
      status = 'poor';
    }

    logger.info(`Performance metric: ${name} = ${value}ms (${status})`, 'PerformanceMonitor', 'logMetric', {
      metric: name,
      value,
      status,
      thresholds
    });

    // Log warning for poor metrics
    if (status === 'poor') {
      logger.warn(`Poor ${name} performance detected: ${value}ms`, 'PerformanceMonitor', 'logMetric', {
        metric: name,
        value,
        threshold: thresholds.poor
      });
    }
  }

  private sendMetricsToAnalytics(): void {
    if (!import.meta.env.PROD) return;

    try {
      // Send to Supabase analytics
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        })
      }).catch(error => {
        logger.warn('Failed to send performance metrics to analytics', 'PerformanceMonitor', 'sendMetricsToAnalytics', { error: (error as Error).message });
      });

      // Send to external analytics service (if configured)
      if (process.env.VITE_ANALYTICS_ENDPOINT) {
        fetch(process.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_ANALYTICS_API_KEY}`
          },
          body: JSON.stringify({
            event: 'performance_metrics',
            properties: this.metrics,
            timestamp: new Date().toISOString()
          })
        }).catch(error => {
          logger.warn('Failed to send performance metrics to external analytics', 'PerformanceMonitor', 'sendMetricsToAnalytics', { error: (error as Error).message });
        });
      }
    } catch (error) {
      logger.error('Error sending performance metrics', error as Error, 'PerformanceMonitor', 'sendMetricsToAnalytics');
    }
  }

  // Public methods
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  getOverallScore(): number {
    return this.metrics.overallScore || 0;
  }

  isPerformanceGood(): boolean {
    return (this.metrics.overallScore || 0) >= 75;
  }

  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    return `
Performance Report:
- FCP: ${metrics.fcp}ms (Score: ${metrics.fcpScore}/100)
- LCP: ${metrics.lcp}ms (Score: ${metrics.lcpScore}/100)
- FID: ${metrics.fid}ms (Score: ${metrics.fidScore}/100)
- CLS: ${metrics.cls} (Score: ${metrics.clsScore}/100)
- TTFB: ${metrics.ttfb}ms (Score: ${metrics.ttfbScore}/100)
- Overall: ${metrics.overallScore}/100
    `.trim();
  }

  // Manual performance measurement
  measurePerformance<T>(name: string, fn: () => T): T {
    if (typeof window === 'undefined') return fn();

    try {
      performance.mark(`start_${name}`);
      const result = fn();
      performance.mark(`end_${name}`);
      performance.measure(name, `start_${name}`, `end_${name}`);

      const measure = performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;

      logger.info(`Performance measurement: ${name}`, 'PerformanceMonitor', 'measurePerformance', {
        duration: Math.round(duration),
        name
      });

      // Clean up
      performance.clearMarks(`start_${name}`);
      performance.clearMarks(`end_${name}`);
      performance.clearMeasures(name);

      return result;
    } catch (error) {
      logger.error(`Failed to measure performance for ${name}`, error as Error, 'PerformanceMonitor', 'measurePerformance');
      return fn();
    }
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (typeof window === 'undefined') return fn();

    try {
      performance.mark(`start_${name}`);
      const result = await fn();
      performance.mark(`end_${name}`);
      performance.measure(name, `start_${name}`, `end_${name}`);

      const measure = performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;

      logger.info(`Async performance measurement: ${name}`, 'PerformanceMonitor', 'measureAsyncPerformance', {
        duration: Math.round(duration),
        name
      });

      // Clean up
      performance.clearMarks(`start_${name}`);
      performance.clearMarks(`end_${name}`);
      performance.clearMeasures(name);

      return result;
    } catch (error) {
      logger.error(`Failed to measure async performance for ${name}`, error as Error, 'PerformanceMonitor', 'measureAsyncPerformance');
      return fn();
    }
  }

  // Cleanup
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isMonitoring = false;
    logger.info('Performance monitoring destroyed', 'PerformanceMonitor', 'destroy');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const getPerformanceScore = () => performanceMonitor.getOverallScore();
export const isPerformanceGood = () => performanceMonitor.isPerformanceGood();
export const measurePerformance = <T>(name: string, fn: () => T) => performanceMonitor.measurePerformance(name, fn);
export const measureAsyncPerformance = <T>(name: string, fn: () => Promise<T>) => performanceMonitor.measureAsyncPerformance(name, fn);
