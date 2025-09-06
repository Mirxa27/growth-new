/**
 * AppErrorBoundary Tests
 * Testing comprehensive error handling, fallback rendering, and recovery mechanisms
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('@/services/error/global-error-handler.service', () => ({
  globalErrorHandler: {
    handleError: vi.fn(),
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  ErrorCategory: {
    UI: 'UI',
    NETWORK: 'NETWORK',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    DATABASE: 'DATABASE',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC',
    EXTERNAL_API: 'EXTERNAL_API',
    UNKNOWN: 'UNKNOWN',
  },
}));

vi.mock('@/services/logging/logger.service', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2 className={className} {...props}>
      {children}
    </h2>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} {...props}>
      {children}
    </p>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Home: () => <div data-testid="home-icon" />,
  MessageCircle: () => <div data-testid="message-icon" />,
  Bug: () => <div data-testid="bug-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

// Import the component to test
const { AppErrorBoundary } = await import('./AppErrorBoundary');

// Test utilities
const createMockError = (message: string, name: string = 'Error') => {
  const error = new Error(message);
  error.name = name;
  return error;
};

const createMockErrorInfo = (componentStack: string = 'TestComponent\n  at TestComponent') => ({
  componentStack,
});

describe('AppErrorBoundary', () => {
  let originalWindowLocation: typeof window.location;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location
    originalWindowLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        pathname: '/test',
        search: '',
        hash: '',
        origin: 'http://localhost:3000',
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
    });

    // Mock console.error to suppress expected error messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore window.location
    Object.defineProperty(window, 'location', {
      value: originalWindowLocation,
      writable: true,
    });

    consoleErrorSpy.mockRestore();
  });

  describe('Error Detection and State Management', () => {
    it('should catch errors and update state correctly', () => {
      const error = createMockError('Test error message');
      const errorInfo = createMockErrorInfo();

      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      // Simulate error catching
      const state = AppErrorBoundary.getDerivedStateFromError(error);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(error);
      expect(state.errorId).toMatch(/^ERR_/);
      expect(state.lastErrorTime).toBeInstanceOf(Date);
    });

    it('should handle componentDidCatch lifecycle method', () => {
      const error = createMockError('Test error');
      const errorInfo = createMockErrorInfo();

      const boundary = new AppErrorBoundary({ children: <div>Test</div> });
      boundary.setState = vi.fn();

      boundary.componentDidCatch(error, errorInfo);

      expect(boundary.setState).toHaveBeenCalledWith({ errorInfo });
      expect(boundary.setState).toHaveBeenCalledTimes(1);
    });

    it('should call error handler when error is caught', () => {
      const error = createMockError('Test error');
      const errorInfo = createMockErrorInfo();
      const onErrorMock = vi.fn();

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        onError: onErrorMock,
        component: 'TestComponent'
      });

      // Mock setState to capture the state
      const mockState = {
        hasError: true,
        error,
        errorId: 'ERR_test123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      boundary.state = mockState;
      boundary.componentDidCatch(error, errorInfo);

      expect(onErrorMock).toHaveBeenCalledWith(error, errorInfo);
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Fallback UI Rendering', () => {
    it('should render app-level error UI when error occurs', () => {
      const error = createMockError('Test error');
      const errorInfo = createMockErrorInfo();

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        level: 'app' as const
      });

      // Set error state
      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ERR_test123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      // Check for app-level error UI elements
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render route-level error UI when level is route', () => {
      const error = createMockError('Route error');
      const errorInfo = createMockErrorInfo();

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        level: 'route' as const
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ERR_route123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      // Should render route-level UI (compact version)
      expect(screen.getByText('Route Error')).toBeInTheDocument();
      expect(screen.getByText('Route error')).toBeInTheDocument();
    });

    it('should render component-level error UI when level is component', () => {
      const error = createMockError('Component error');
      const errorInfo = createMockErrorInfo();

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        level: 'component' as const
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ERR_comp123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      // Should render component-level UI (minimal version)
      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('Component error')).toBeInTheDocument();
    });

    it('should use custom fallback if provided', () => {
      const error = createMockError('Custom error');
      const errorInfo = createMockErrorInfo();
      const customFallback = vi.fn().mockReturnValue(<div>Custom Fallback</div>);

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        fallback: customFallback,
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ERR_custom123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(customFallback).toHaveBeenCalledWith(error, errorInfo, expect.any(Function));
      expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    });
  });

  describe('Error Type Detection and Configuration', () => {
    it('should detect ChunkLoadError correctly', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      const error = createMockError('Loading chunk failed', 'ChunkLoadError');
      const category = (boundary as any).determineErrorCategory(error);

      expect(category).toBe('EXTERNAL_API');
    });

    it('should detect Network errors correctly', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      const error = createMockError('Network request failed');
      const category = (boundary as any).determineErrorCategory(error);

      expect(category).toBe('NETWORK');
    });

    it('should detect Authentication errors correctly', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      const error = createMockError('Authentication token expired');
      const category = (boundary as any).determineErrorCategory(error);

      expect(category).toBe('AUTHENTICATION');
    });

    it('should detect Database errors correctly', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      const error = createMockError('Database connection failed');
      const category = (boundary as any).determineErrorCategory(error);

      expect(category).toBe('DATABASE');
    });

    it('should use explicit category when provided', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        category: 'BUSINESS_LOGIC' as any
      });

      const error = createMockError('Any error');
      const category = (boundary as any).determineErrorCategory(error);

      expect(category).toBe('BUSINESS_LOGIC');
    });

    it('should determine error severity correctly', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      // Test critical severity
      const dbError = createMockError('Database error');
      let severity = (boundary as any).getErrorSeverity(dbError, 'DATABASE');
      expect(severity).toBe('CRITICAL');

      // Test high severity
      const networkError = createMockError('Network error');
      severity = (boundary as any).getErrorSeverity(networkError, 'NETWORK');
      expect(severity).toBe('HIGH');

      // Test medium severity
      const businessError = createMockError('Business logic error');
      severity = (boundary as any).getErrorSeverity(businessError, 'BUSINESS_LOGIC');
      expect(severity).toBe('MEDIUM');
    });
  });

  describe('Retry Mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry when retry method is called', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_retry123',
        retryCount: 1,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { logger } = require('@/services/logging/logger.service');

      boundary.retry();

      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.retryCount).toBe(2);
      expect(boundary.state.isRecovering).toBe(false);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should schedule auto-retry when enabled', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_auto123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const scheduleAutoRetrySpy = vi.spyOn(boundary as any, 'scheduleAutoRetry');

      boundary.componentDidCatch(
        createMockError('Test error'),
        createMockErrorInfo()
      );

      expect(scheduleAutoRetrySpy).toHaveBeenCalled();
    });

    it('should not auto-retry when retry count exceeds limit', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 2
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_limit123',
        retryCount: 2, // Already at max retries
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const scheduleAutoRetrySpy = vi.spyOn(boundary as any, 'scheduleAutoRetry');

      boundary.componentDidCatch(
        createMockError('Test error'),
        createMockErrorInfo()
      );

      expect(scheduleAutoRetrySpy).not.toHaveBeenCalled();
    });

    it('should clean up timeouts on unmount', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      boundary.componentWillUnmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle go home navigation', () => {
      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_home123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      boundary.handleGoHome();

      expect(window.location.href).toBe('/');
    });

    it('should handle report issue functionality', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_report123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      boundary.handleReportIssue();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('mailto:'),
        expect.stringContaining('Error Report - ERR_report123')
      );

      windowOpenSpy.mockRestore();
    });

    it('should handle page reload', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      const boundary = new AppErrorBoundary({ children: <div>Test</div> });

      boundary.state = {
        hasError: true,
        error: createMockError('Test error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_reload123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      render(<div>{boundary.render()}</div>);

      const reloadButton = screen.getByText('Refresh Page');
      fireEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should show retry button when recovery is possible', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Recoverable error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_recover123',
        retryCount: 1,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should disable retry button when recovering', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Recovering error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_recovering123',
        retryCount: 1,
        isRecovering: true,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Recovering...');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
    });

    it('should not show retry button when max retries reached', () => {
      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        enableRecovery: true,
        maxRetries: 2
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Max retries error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_max123',
        retryCount: 2,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.queryByText('Try Again');
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show technical details in development mode', () => {
      process.env.NODE_ENV = 'development';

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        showDetails: true
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Dev mode error'),
        errorInfo: createMockErrorInfo('DevComponent\n  at DevComponent'),
        errorId: 'ERR_dev123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Dev mode error')).toBeInTheDocument();
    });

    it('should hide technical details in production mode', () => {
      process.env.NODE_ENV = 'production';

      const boundary = new AppErrorBoundary({
        children: <div>Test</div>,
        showDetails: false
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Prod mode error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ERR_prod123',
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: new Date(),
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render children normally when no error', () => {
      const TestChild = () => <div>Normal child content</div>;

      const { container } = render(
        <AppErrorBoundary>
          <TestChild />
        </AppErrorBoundary>
      );

      expect(screen.getByText('Normal child content')).toBeInTheDocument();
    });

    it('should catch and handle errors in child components', () => {
      const ErrorChild = () => {
        throw new Error('Child component error');
      };

      // Suppress console error for this test
      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container } = render(
          <AppErrorBoundary level="app">
            <ErrorChild />
          </AppErrorBoundary>
        );

        // Error boundary should catch and show error UI
        expect(screen.getByText('Application Error')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });

    it('should reset error state and render children after retry', async () => {
      let shouldThrow = true;
      const ErrorChild = () => {
        if (shouldThrow) {
          throw new Error('Retryable error');
        }
        return <div>Recovered child</div>;
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container, rerender } = render(
          <AppErrorBoundary enableRecovery={true} maxRetries={2}>
            <ErrorChild />
          </AppErrorBoundary>
        );

        // Should show error UI
        expect(screen.getByText('Application Error')).toBeInTheDocument();

        // Simulate retry
        shouldThrow = false;
        const retryButton = screen.getByText('Try Again');
        fireEvent.click(retryButton);

        // Should render child content
        await waitFor(() => {
          expect(screen.getByText('Recovered child')).toBeInTheDocument();
        });
      } finally {
        console.error = restoreConsole;
      }
    });
  });
});