/**
 * Performance Monitoring Service
 * Tracks and optimizes application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceThresholds {
  FCP: number;
  LCP: number;
  FID: number;
  CLS: number;
  TTI: number;
  TTFB: number;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private readonly THRESHOLDS: PerformanceThresholds = {
    FCP: 4000,
    LCP: 5000,
    FID: 100,
    CLS: 0.1,
    TTI: 6000,
    TTFB: 2000, // Increased to 2000ms to reduce noise
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private initializeObservers() {
    try {
      // Monitor TTFB
      if ('navigation' in performance) {
        const timing = (performance as any).timing;
        if (timing) {
          const ttfb = timing.responseStart - timing.navigationStart;
          if (ttfb > 0) {
            this.recordMetric({
              name: 'TTFB',
              value: ttfb,
              unit: 'ms',
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch {
      // Silently ignore errors in development
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Only log warnings in production
    if (import.meta.env.PROD) {
      const threshold = this.THRESHOLDS[metric.name as keyof PerformanceThresholds];
      if (threshold && metric.value > threshold) {
        console.warn(`Performance warning: ${metric.name} (${metric.value}${metric.unit}) exceeds threshold (${threshold}${metric.unit})`);
      }
    }
  }

  getMetricsSummary() {
    return this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { values: [] };
      }
      acc[metric.name].values.push(metric.value);
      return acc;
    }, {} as Record<string, { values: number[] }>);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();
