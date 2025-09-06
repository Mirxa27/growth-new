/**
 * Performance Monitoring React Hook
 * Provides real-time Web Vitals monitoring with React integration
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import webVitals, { type EnhancedMetric } from '@/utils/webVitals';

interface PerformanceState {
  metrics: Record<string, EnhancedMetric>;
  isMonitoring: boolean;
  summary: ReturnType<typeof webVitals.getPerformanceSummary>;
  alerts: PerformanceAlert[];
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error';
  metric: string;
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

interface UsePerformanceMonitorOptions {
  enableAlerts?: boolean;
  alertThresholds?: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  };
  reportingEndpoint?: string;
  enableConsoleLogging?: boolean;
  autoStart?: boolean;
}

const DEFAULT_ALERT_THRESHOLDS = {
  LCP: 4000, // 4 seconds
  FID: 300,  // 300ms
  CLS: 0.25, // 0.25 cumulative score
  FCP: 3000, // 3 seconds
  TTFB: 1800, // 1.8 seconds
};

/**
 * Hook for monitoring Web Vitals and performance metrics in React components
 */
export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    enableAlerts = true,
    alertThresholds = DEFAULT_ALERT_THRESHOLDS,
    reportingEndpoint,
    enableConsoleLogging = process.env.NODE_ENV === 'development',
    autoStart = true,
  } = options;

  const [state, setState] = useState<PerformanceState>({
    metrics: {},
    isMonitoring: false,
    summary: {},
    alerts: [],
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const alertIdCounter = useRef(0);

  /**
   * Generate unique alert ID
   */
  const generateAlertId = useCallback(() => {
    return `alert_${Date.now()}_${++alertIdCounter.current}`;
  }, []);

  /**
   * Create performance alert
   */
  const createAlert = useCallback((metric: EnhancedMetric): PerformanceAlert | null => {
    const threshold = alertThresholds[metric.name as keyof typeof alertThresholds];
    if (!threshold || !enableAlerts) return null;

    // Only create alert if metric exceeds threshold
    if (metric.value <= threshold) return null;

    const severity = metric.rating === 'poor' ? 'error' : 'warning';
    
    return {
      id: generateAlertId(),
      type: severity,
      metric: metric.name,
      message: `${metric.name} (${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}) exceeds ${severity} threshold (${threshold}${metric.name === 'CLS' ? '' : 'ms'})`,
      timestamp: metric.timestamp,
      value: metric.value,
      threshold,
    };
  }, [alertThresholds, enableAlerts, generateAlertId]);

  /**
   * Handle new metric data
   */
  const handleMetricUpdate = useCallback((metric: EnhancedMetric) => {
    setState(prev => {
      const newMetrics = { ...prev.metrics, [metric.name]: metric };
      const newSummary = webVitals.getPerformanceSummary();
      const alert = createAlert(metric);
      const newAlerts = alert ? [...prev.alerts, alert] : prev.alerts;

      // Keep only last 50 alerts
      const trimmedAlerts = newAlerts.slice(-50);

      return {
        ...prev,
        metrics: newMetrics,
        summary: newSummary,
        alerts: trimmedAlerts,
      };
    });
  }, [createAlert]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (unsubscribeRef.current) {
      console.warn('Performance monitoring is already active');
      return;
    }

    // Initialize Web Vitals
    webVitals.init({
      reportingEndpoint,
      enableConsoleLogging,
      enableAnalytics: true,
    });

    // Subscribe to metric updates
    unsubscribeRef.current = webVitals.subscribe(handleMetricUpdate);

    setState(prev => ({
      ...prev,
      isMonitoring: true,
      summary: webVitals.getPerformanceSummary(),
    }));

    console.log('🔍 Performance monitoring started');
  }, [reportingEndpoint, enableConsoleLogging, handleMetricUpdate]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isMonitoring: false,
    }));

    console.log('⏹️ Performance monitoring stopped');
  }, []);

  /**
   * Clear all metrics and alerts
   */
  const clearMetrics = useCallback(() => {
    webVitals.clear();
    setState(prev => ({
      ...prev,
      metrics: {},
      summary: {},
      alerts: [],
    }));
  }, []);

  /**
   * Dismiss alert
   */
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId),
    }));
  }, []);

  /**
   * Get metric history
   */
  const getMetricHistory = useCallback((metricName: string) => {
    return webVitals.getMetrics(metricName);
  }, []);

  /**
   * Force refresh summary
   */
  const refreshSummary = useCallback(() => {
    setState(prev => ({
      ...prev,
      summary: webVitals.getPerformanceSummary(),
    }));
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [autoStart, startMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // State
    metrics: state.metrics,
    summary: state.summary,
    alerts: state.alerts,
    isMonitoring: state.isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    dismissAlert,
    getMetricHistory,
    refreshSummary,
    
    // Computed values
    hasAlerts: state.alerts.length > 0,
    errorAlerts: state.alerts.filter(alert => alert.type === 'error'),
    warningAlerts: state.alerts.filter(alert => alert.type === 'warning'),
    coreWebVitals: {
      LCP: state.metrics.LCP,
      FID: state.metrics.FID,
      CLS: state.metrics.CLS,
      FCP: state.metrics.FCP,
      TTFB: state.metrics.TTFB,
    },
  };
};

/**
 * Simplified hook for just getting current Web Vitals
 */
export const useWebVitals = () => {
  const { metrics, coreWebVitals } = usePerformanceMonitor({
    enableAlerts: false,
    autoStart: true,
  });

  return {
    metrics,
    coreWebVitals,
    hasGoodPerformance: Object.values(coreWebVitals).every(
      metric => !metric || metric.rating === 'good'
    ),
  };
};

/**
 * Hook for performance alerts only
 */
export const usePerformanceAlerts = (thresholds?: UsePerformanceMonitorOptions['alertThresholds']) => {
  const { alerts, dismissAlert, hasAlerts, errorAlerts, warningAlerts } = usePerformanceMonitor({
    enableAlerts: true,
    alertThresholds: thresholds,
    autoStart: true,
  });

  return {
    alerts,
    dismissAlert,
    hasAlerts,
    errorAlerts,
    warningAlerts,
    criticalIssues: errorAlerts.length,
    needsAttention: warningAlerts.length,
  };
};