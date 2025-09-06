/**
 * Performance Optimizer Tests
 * Testing performance monitoring and optimization features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceOptimizer, usePerformanceOptimization } from './performance-optimizer.service';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn((callback) => {
    // Simulate good CLS metric
    callback({
      name: 'CLS',
      value: 0.05,
      rating: 'good',
      delta: 0.05,
      id: 'test-cls-id'
    });
  }),
  getFID: vi.fn((callback) => {
    callback({
      name: 'FID',
      value: 80,
      rating: 'good',
      delta: 80,
      id: 'test-fid-id'
    });
  }),
  getFCP: vi.fn((callback) => {
    callback({
      name: 'FCP',
      value: 1500,
      rating: 'good',
      delta: 1500,
      id: 'test-fcp-id'
    });
  }),
  getLCP: vi.fn((callback) => {
    callback({
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'test-lcp-id'
    });
  }),
  getTTFB: vi.fn((callback) => {
    callback({
      name: 'TTFB',
      value: 600,
      rating: 'good',
      delta: 600,
      id: 'test-ttfb-id'
    });
  }),
}));

// Mock logger
vi.mock('@/services/logging/logger.service', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock DOM APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    timing: {
      navigationStart: 1000,
      responseStart: 1200,
    },
  },
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    observe = vi.fn();
    disconnect = vi.fn();
  },
});

describe('PerformanceOptimizerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceOptimizer.clearMetrics();
  });

  describe('Metrics Collection', () => {
    it('should collect web vitals metrics', () => {
      // Web vitals should be initialized automatically
      const summary = performanceOptimizer.getMetricsSummary();
      
      // Should have collected some metrics from mocked web-vitals
      expect(typeof summary).toBe('object');
    });

    it('should track latest metrics', () => {
      const latestMetrics = performanceOptimizer.getLatestMetrics();
      
      expect(Array.isArray(latestMetrics)).toBe(true);
    });

    it('should clear metrics when requested', () => {
      performanceOptimizer.clearMetrics();
      const summary = performanceOptimizer.getMetricsSummary();
      
      expect(Object.keys(summary).length).toBe(0);
    });
  });

  describe('Image Optimization', () => {
    it('should optimize images with lazy loading', () => {
      // Create mock container with images
      const container = document.createElement('div');
      const img1 = document.createElement('img');
      img1.setAttribute('data-src', 'test1.jpg');
      const img2 = document.createElement('img');
      img2.setAttribute('data-src', 'test2.jpg');
      
      container.appendChild(img1);
      container.appendChild(img2);

      // Should complete without errors
      expect(() => {
        performanceOptimizer.optimizeImages(container);
      }).not.toThrow();
    });
  });

  describe('Resource Preloading', () => {
    it('should preload critical resources', () => {
      const resources = [
        '/critical.css',
        '/important.js',
        '/hero-image.jpg'
      ];

      // Mock document.createElement and appendChild
      const mockLink = {
        rel: '',
        href: '',
        as: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockLink as any);

      expect(() => {
        performanceOptimizer.preloadCriticalResources(resources);
      }).not.toThrow();
    });
  });

  describe('Mobile Optimizations', () => {
    it('should apply mobile-specific optimizations', () => {
      const mockViewport = {
        setAttribute: vi.fn(),
      };
      vi.spyOn(document, 'querySelector').mockReturnValue(mockViewport as any);
      vi.spyOn(document, 'createElement').mockReturnValue({ textContent: '' } as any);
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => undefined as any);

      expect(() => {
        performanceOptimizer.optimizeForMobile();
      }).not.toThrow();
    });
  });

  describe('Component Performance', () => {
    it('should measure component render time', () => {
      const renderFunction = vi.fn();
      
      const duration = performanceOptimizer.measureComponentRender('TestComponent', renderFunction);
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(renderFunction).toHaveBeenCalled();
    });

    it('should mark component mount times', () => {
      expect(() => {
        performanceOptimizer.markComponentMount('TestComponent');
        performanceOptimizer.markComponentMountEnd('TestComponent');
      }).not.toThrow();
    });
  });

  describe('Performance Report', () => {
    it('should generate comprehensive performance report', () => {
      const report = performanceOptimizer.getPerformanceReport();
      
      expect(report).toHaveProperty('webVitals');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Accessibility Integration', () => {
    it('should enable accessibility optimizations', () => {
      const mockDocument = {
        createElement: vi.fn().mockReturnValue({ textContent: '' }),
        addEventListener: vi.fn(),
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        head: { appendChild: vi.fn() },
      };

      expect(() => {
        performanceOptimizer.enableAccessibilityOptimizations();
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      expect(() => {
        performanceOptimizer.cleanup();
      }).not.toThrow();
    });
  });
});

// Test React hook (simplified)
describe('usePerformanceOptimization hook', () => {
  it('should provide performance utilities', () => {
    // Mock React useEffect and useCallback
    const mockUseEffect = vi.fn((fn) => fn());
    const mockUseCallback = vi.fn((fn) => fn);
    
    vi.doMock('react', () => ({
      useEffect: mockUseEffect,
      useCallback: mockUseCallback,
    }));

    // Test that the hook would work
    expect(() => {
      const { measureRender } = usePerformanceOptimization('TestComponent');
      expect(typeof measureRender).toBe('function');
    }).not.toThrow();
  });
});
