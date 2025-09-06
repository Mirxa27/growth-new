/**
 * ComponentErrorBoundary Tests
 * Testing component-level error handling, lightweight fallbacks, and recovery mechanisms
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
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Import the component to test
const {
  ComponentErrorBoundary,
  FormErrorBoundary,
  ChartErrorBoundary,
  ListErrorBoundary,
  MediaErrorBoundary,
  AsyncDataErrorBoundary,
  useComponentErrorHandler,
  withErrorBoundary
} = await import('./ComponentErrorBoundary');

// Test utilities
const createMockError = (message: string, name: string = 'Error') => {
  const error = new Error(message);
  error.name = name;
  return error;
};

const createMockErrorInfo = (componentStack: string = 'TestComponent\n  at TestComponent') => ({
  componentStack,
});

describe('ComponentErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock console.error to suppress expected error messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  describe('Error Detection and State Management', () => {
    it('should catch errors and update state correctly', () => {
      const error = createMockError('Component error message');

      const state = ComponentErrorBoundary.getDerivedStateFromError(error);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(error);
      expect(state.retryCount).toBe(0);
    });

    it('should handle componentDidCatch lifecycle method', () => {
      const error = createMockError('Test component error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'TestComponent'
      });

      boundary.setState = vi.fn();

      boundary.componentDidCatch(error, errorInfo);

      expect(boundary.setState).toHaveBeenCalledWith({ errorInfo });
      expect(boundary.setState).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback when provided', () => {
      const error = createMockError('Callback test error');
      const errorInfo = createMockErrorInfo();
      const onErrorMock = vi.fn();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'CallbackComponent',
        onError: onErrorMock
      });

      boundary.componentDidCatch(error, errorInfo);

      expect(onErrorMock).toHaveBeenCalledWith(error, errorInfo);
    });

    it('should report error to global error handler with component-specific context', () => {
      const error = createMockError('Component-specific error');
      const errorInfo = createMockErrorInfo();

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'ReportComponent'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          component: 'ReportComponent',
          action: 'componentError',
          metadata: expect.objectContaining({
            retryCount: 0,
            componentStack: errorInfo.componentStack,
            componentError: true,
          }),
        }),
        expect.objectContaining({
          showToast: true,
          logError: true,
          reportError: true,
        })
      );
    });

    it('should not show toast when silent mode is enabled', () => {
      const error = createMockError('Silent error');
      const errorInfo = createMockErrorInfo();

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'SilentComponent',
        silent: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          showToast: false,
          logError: true,
          reportError: true,
        })
      );
    });
  });

  describe('Fallback UI Rendering', () => {
    it('should render minimal error UI by default', () => {
      const error = createMockError('Minimal UI error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'MinimalComponent'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('MinimalComponent Error')).toBeInTheDocument();
      expect(screen.getByText('This component encountered an error and couldn\'t display properly.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should use custom fallback when provided', () => {
      const error = createMockError('Custom fallback error');
      const errorInfo = createMockErrorInfo();
      const customFallback = <div>Custom Component Fallback</div>;

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'CustomComponent',
        fallback: customFallback
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Custom Component Fallback')).toBeInTheDocument();
      expect(screen.queryByText('CustomComponent Error')).not.toBeInTheDocument();
    });

    it('should render nothing in silent mode', () => {
      const error = createMockError('Silent mode error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'SilentComponent',
        silent: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(container.firstChild).toBeNull();
    });

    it('should preserve space when preserveSpace is enabled', () => {
      const error = createMockError('Preserve space error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'PreserveComponent',
        preserveSpace: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('PreserveComponent Error')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('glass');
    });

    it('should show retry attempt count', () => {
      const error = createMockError('Retry count error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'RetryComponent',
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 2,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Attempts: 2/3')).toBeInTheDocument();
    });

    it('should show retry button when under max retries', () => {
      const error = createMockError('Can retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'CanRetryComponent',
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 1,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should hide retry button when max retries reached', () => {
      const error = createMockError('Max retries error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'MaxRetryComponent',
        maxRetries: 2
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 2,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });

  describe('Auto-Recovery Mechanism', () => {
    it('should schedule auto-retry when enabled and under max retries', () => {
      const error = createMockError('Auto-retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'AutoRetryComponent',
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      // Should schedule auto-retry
      expect(boundary.retryTimeoutId).toBeDefined();
    });

    it('should not schedule auto-retry when disabled', () => {
      const error = createMockError('No auto-retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'NoAutoRetryComponent',
        enableRecovery: false,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      // Should not schedule auto-retry
      expect(boundary.retryTimeoutId).toBeUndefined();
    });

    it('should not schedule auto-retry when max retries reached', () => {
      const error = createMockError('Max retries auto-retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'MaxRetryAutoComponent',
        enableRecovery: true,
        maxRetries: 2
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 2,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      // Should not schedule auto-retry
      expect(boundary.retryTimeoutId).toBeUndefined();
    });

    it('should perform auto-retry after timeout', async () => {
      const error = createMockError('Timeout auto-retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'TimeoutAutoComponent',
        enableRecovery: true,
        maxRetries: 3
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      // Should be in recovering state
      expect(boundary.state.isRecovering).toBe(true);

      // Fast-forward timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should have retried and cleared error
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.retryCount).toBe(1);
      expect(boundary.state.isRecovering).toBe(false);
    });

    it('should clean up timeouts on unmount', () => {
      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'CleanupComponent'
      });

      boundary.retryTimeoutId = setTimeout(() => {}, 1000);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      boundary.componentWillUnmount();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(boundary.retryTimeoutId);
    });
  });

  describe('Manual Retry Mechanism', () => {
    it('should reset error state when retry is called', () => {
      const error = createMockError('Manual retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'ManualRetryComponent'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 1,
        isRecovering: false,
      };

      boundary.retry();

      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeUndefined();
      expect(boundary.state.errorInfo).toBeUndefined();
      expect(boundary.state.retryCount).toBe(2);
      expect(boundary.state.isRecovering).toBe(false);
    });

    it('should clear existing timeout when retry is called', () => {
      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'ClearTimeoutComponent'
      });

      boundary.retryTimeoutId = setTimeout(() => {}, 1000);
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      boundary.retry();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(boundary.retryTimeoutId);
      expect(boundary.retryTimeoutId).toBeUndefined();
    });

    it('should handle retry button click', () => {
      const error = createMockError('Button retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'ButtonRetryComponent'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const retrySpy = vi.spyOn(boundary, 'retry');

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(retrySpy).toHaveBeenCalled();
    });
  });

  describe('Specialized Component Boundaries', () => {
    it('should render FormErrorBoundary with appropriate fallback', () => {
      const error = createMockError('Form error');
      const errorInfo = createMockErrorInfo();

      const boundary = new FormErrorBoundary({
        children: <div>Form content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('This form encountered an error. Please refresh the page and try again.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render ChartErrorBoundary with appropriate fallback', () => {
      const error = createMockError('Chart error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ChartErrorBoundary({
        children: <div>Chart content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Chart data unavailable')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render ListErrorBoundary with appropriate fallback', () => {
      const error = createMockError('List error');
      const errorInfo = createMockErrorInfo();

      const boundary = new ListErrorBoundary({
        children: <div>List content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Unable to load list items')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render MediaErrorBoundary with appropriate fallback', () => {
      const error = createMockError('Media error');
      const errorInfo = createMockErrorInfo();

      const boundary = new MediaErrorBoundary({
        children: <div>Media content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Media unavailable')).toBeInTheDocument();
    });

    it('should render AsyncDataErrorBoundary with auto-retry enabled', () => {
      const error = createMockError('Async data error');
      const errorInfo = createMockErrorInfo();

      const boundary = new AsyncDataErrorBoundary({
        children: <div>Async data content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        retryCount: 0,
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Data Loading Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to load data. Retrying...')).toBeInTheDocument();
    });

    it('should configure AsyncDataErrorBoundary with auto-recovery and higher retry limit', () => {
      const TestComponent = () => {
        const boundary = new AsyncDataErrorBoundary({
          children: <div>Test</div>
        });

        expect(boundary.props.enableRecovery).toBe(true);
        expect(boundary.props.maxRetries).toBe(3);

        return <div>Test</div>;
      };

      render(<TestComponent />);
    });
  });

  describe('useComponentErrorHandler Hook', () => {
    it('should provide error handler function', async () => {
      const { useComponentErrorHandler } = await import('./ComponentErrorBoundary');

      let handleError: any;
      const TestComponent = () => {
        const result = useComponentErrorHandler('HookTestComponent');
        handleError = result.handleError;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleError).toBe('function');
    });

    it('should handle error through hook', async () => {
      const { useComponentErrorHandler } = await import('./ComponentErrorBoundary');

      let handleError: any;
      const TestComponent = () => {
        const result = useComponentErrorHandler('HookTestComponent');
        handleError = result.handleError;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      const error = createMockError('Hook error');
      const errorContext = 'hookTest';

      handleError(error, errorContext);

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          component: 'HookTestComponent',
          action: 'hookError',
          metadata: expect.objectContaining({
            hookError: true,
            errorInfo: errorContext,
          }),
        }),
        expect.objectContaining({
          showToast: true,
          logError: true,
          reportError: true,
        })
      );
    });
  });

  describe('withErrorBoundary Higher-Order Component', () => {
    it('should wrap component with error boundary', async () => {
      const { withErrorBoundary } = await import('./ComponentErrorBoundary');

      const TestComponent = () => <div>Wrapped Component</div>;

      const WrappedComponent = withErrorBoundary(TestComponent, {
        componentName: 'WrappedTestComponent',
        maxRetries: 2
      });

      render(<WrappedComponent />);

      expect(screen.getByText('Wrapped Component')).toBeInTheDocument();
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });

    it('should handle errors in wrapped component', async () => {
      const { withErrorBoundary } = await import('./ComponentErrorBoundary');

      const ErrorComponent = () => {
        throw new Error('Wrapped component error');
      };

      const WrappedComponent = withErrorBoundary(ErrorComponent, {
        componentName: 'ErrorWrappedComponent'
      });

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        render(<WrappedComponent />);

        expect(screen.getByText('ErrorWrappedComponent Error')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });
  });

  describe('Component Integration', () => {
    it('should render children normally when no error', () => {
      const TestChild = () => <div>Normal component content</div>;

      const { container } = render(
        <ComponentErrorBoundary componentName="TestComponent">
          <TestChild />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Normal component content')).toBeInTheDocument();
    });

    it('should catch and handle errors in child components', () => {
      const ErrorChild = () => {
        throw new Error('Component child error');
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container } = render(
          <ComponentErrorBoundary componentName="ErrorComponent">
            <ErrorChild />
          </ComponentErrorBoundary>
        );

        expect(screen.getByText('ErrorComponent Error')).toBeInTheDocument();
        expect(screen.getByText('This component encountered an error and couldn\'t display properly.')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });

    it('should retry and recover successfully', async () => {
      let shouldThrow = true;
      const ErrorChild = () => {
        if (shouldThrow) {
          throw new Error('Retryable component error');
        }
        return <div>Recovered component</div>;
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container, rerender } = render(
          <ComponentErrorBoundary componentName="RetryComponent" enableRecovery={true} maxRetries={2}>
            <ErrorChild />
          </ComponentErrorBoundary>
        );

        // Should show error UI
        expect(screen.getByText('RetryComponent Error')).toBeInTheDocument();

        // Click retry button
        shouldThrow = false;
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);

        // Should render child content
        expect(screen.getByText('Recovered component')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });

    it('should handle multiple consecutive errors', () => {
      const boundary = new ComponentErrorBoundary({
        children: <div>Test</div>,
        componentName: 'MultiErrorComponent',
        maxRetries: 3
      });

      // Simulate multiple errors
      const error1 = createMockError('First error');
      const error2 = createMockError('Second error');
      const error3 = createMockError('Third error');

      boundary.componentDidCatch(error1, createMockErrorInfo());
      expect(boundary.state.retryCount).toBe(1);

      boundary.componentDidCatch(error2, createMockErrorInfo());
      expect(boundary.state.retryCount).toBe(2);

      boundary.componentDidCatch(error3, createMockErrorInfo());
      expect(boundary.state.retryCount).toBe(3);
    });
  });
});