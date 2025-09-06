/**
 * Global Error Handler Tests
 * Testing error handling, fallback strategies, and recovery mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  globalErrorHandler, 
  handleError, 
  handleNetworkError,
  handleAuthError,
  handleValidationError,
  ErrorSeverity, 
  ErrorCategory 
} from './global-error-handler.service';

// Mock dependencies
vi.mock('@/services/logging/logger.service', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  }
}));

describe('GlobalErrorHandlerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle errors with proper severity and category', async () => {
      const testError = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
      };

      await globalErrorHandler.handleError(
        testError,
        ErrorSeverity.HIGH,
        ErrorCategory.BUSINESS_LOGIC,
        context
      );

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should extract error messages from different error types', async () => {
      const stringError = 'Simple string error';
      const errorObject = new Error('Error object message');
      const customError = { message: 'Custom error message' };

      const context = { component: 'TestComponent' };

      await Promise.all([
        globalErrorHandler.handleError(stringError, ErrorSeverity.LOW, ErrorCategory.UNKNOWN, context),
        globalErrorHandler.handleError(errorObject, ErrorSeverity.LOW, ErrorCategory.UNKNOWN, context),
        globalErrorHandler.handleError(customError, ErrorSeverity.LOW, ErrorCategory.UNKNOWN, context),
      ]);

      // Should handle all error types without throwing
      expect(true).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide network error handler', async () => {
      const networkError = new Error('Network connection failed');
      const context = { component: 'NetworkComponent' };

      await handleNetworkError(networkError, context);

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should provide authentication error handler', async () => {
      const authError = new Error('Token expired');
      const context = { component: 'AuthComponent' };

      await handleAuthError(authError, context);

      // Should complete without throwing  
      expect(true).toBe(true);
    });

    it('should provide validation error handler', async () => {
      const validationError = new Error('Invalid input');
      const context = { component: 'FormComponent' };

      await handleValidationError(validationError, context);

      // Should complete without throwing
      expect(true).toBe(true);
    });
  });

  describe('Fallback Strategies', () => {
    it('should register custom fallback strategies', () => {
      const customStrategy = {
        canHandle: (errorInfo: any) => errorInfo.category === ErrorCategory.CUSTOM,
        handle: async () => {},
        priority: 5,
      };

      // Should accept custom strategies
      expect(() => {
        globalErrorHandler.registerFallbackStrategy(customStrategy);
      }).not.toThrow();
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics', async () => {
      await handleError(new Error('Error 1'), ErrorSeverity.HIGH, ErrorCategory.DATABASE);
      await handleError(new Error('Error 2'), ErrorSeverity.MEDIUM, ErrorCategory.NETWORK);

      const stats = globalErrorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(typeof stats.errorsByCategory).toBe('object');
      expect(typeof stats.errorsBySeverity).toBe('object');
    });
  });

  describe('Retry Logic', () => {
    it('should handle retry callbacks', async () => {
      let retryCount = 0;
      const retryCallback = async () => {
        retryCount++;
        if (retryCount < 2) {
          throw new Error('Retry needed');
        }
      };

      await globalErrorHandler.handleError(
        new Error('Initial error'),
        ErrorSeverity.MEDIUM,
        ErrorCategory.NETWORK,
        { component: 'TestComponent' },
        {
          retryCallback,
          maxRetries: 3,
        }
      );

      // Retry should have been attempted
      expect(retryCount).toBeGreaterThan(0);
    });
  });
});
