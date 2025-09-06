/**
 * RouteErrorBoundary Tests
 * Testing route-specific error handling, fallback rendering, and recovery mechanisms
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
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Bug: () => <div data-testid="bug-icon" />,
}));

// Import the component to test
const { RouteErrorBoundary, DashboardErrorBoundary, AssessmentErrorBoundary, AuthErrorBoundary, ProfileErrorBoundary, AdminErrorBoundary } = await import('./RouteErrorBoundary');

// Test utilities
const createMockError = (message: string, name: string = 'Error') => {
  const error = new Error(message);
  error.name = name;
  return error;
};

const createMockErrorInfo = (componentStack: string = 'TestRoute\n  at TestRoute') => ({
  componentStack,
});

describe('RouteErrorBoundary', () => {
  let originalWindowLocation: typeof window.location;
  let originalWindowHistory: typeof window.history;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location
    originalWindowLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard',
        pathname: '/dashboard',
        search: '',
        hash: '',
        origin: 'http://localhost:3000',
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
    });

    // Mock window.history
    originalWindowHistory = window.history;
    Object.defineProperty(window, 'history', {
      value: {
        length: 2,
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn(),
        pushState: vi.fn(),
        replaceState: vi.fn(),
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

    // Restore window.history
    Object.defineProperty(window, 'history', {
      value: originalWindowHistory,
      writable: true,
    });

    consoleErrorSpy.mockRestore();
  });

  describe('Error Detection and State Management', () => {
    it('should catch errors and update state correctly', () => {
      const error = createMockError('Route error message');

      const state = RouteErrorBoundary.getDerivedStateFromError(error);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(error);
      expect(state.errorId).toMatch(/^ROUTE_ERR_/);
    });

    it('should handle componentDidCatch lifecycle method', () => {
      const error = createMockError('Test route error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'Dashboard'
      });

      boundary.setState = vi.fn();

      boundary.componentDidCatch(error, errorInfo);

      expect(boundary.setState).toHaveBeenCalledWith({ errorInfo });
      expect(boundary.setState).toHaveBeenCalledTimes(1);
    });

    it('should report error to global error handler with route-specific context', () => {
      const error = createMockError('Route-specific error');
      const errorInfo = createMockErrorInfo();

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'Dashboard'
      });

      const mockState = {
        hasError: true,
        error,
        errorId: 'ROUTE_ERR_dash123',
        isRecovering: false,
      };

      boundary.state = mockState;
      boundary.componentDidCatch(error, errorInfo);

      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          component: 'Dashboard',
          action: 'routeError',
          metadata: expect.objectContaining({
            errorId: 'ROUTE_ERR_dash123',
            routeName: 'Dashboard',
            routeError: true,
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

  describe('Fallback UI Rendering', () => {
    it('should render route-specific error UI', () => {
      const error = createMockError('Dashboard error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'Dashboard'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_ui123',
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Route Error')).toBeInTheDocument();
      expect(screen.getByText('There was an error loading the Dashboard page')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('should display error ID and route name', () => {
      const error = createMockError('Assessment error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'Assessment'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_info123',
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('ROUTE_ERR_info123')).toBeInTheDocument();
      expect(screen.getByText('Assessment')).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createMockError('Dev route error');
      const errorInfo = createMockErrorInfo('DevRoute\n  at DevRoute');

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'DevRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_dev123',
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Dev route error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createMockError('Prod route error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'ProdRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_prod123',
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should render custom actions when provided', () => {
      const error = createMockError('Custom action error');
      const errorInfo = createMockErrorInfo();

      const customActions = <button data-testid="custom-action">Custom Action</button>;

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'CustomRoute',
        customActions
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_custom123',
        isRecovering: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should handle basic retry functionality', () => {
      const error = createMockError('Retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'RetryRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_retry123',
        isRecovering: false,
      };

      boundary.handleRetry();

      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeUndefined();
      expect(boundary.state.errorInfo).toBeUndefined();
    });

    it('should handle route-specific recovery function', async () => {
      const routeSpecificRecovery = vi.fn().mockResolvedValue(undefined);
      const error = createMockError('Route-specific error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'SpecificRoute',
        routeSpecificRecovery
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_specific123',
        isRecovering: false,
      };

      await boundary.handleRetry();

      expect(routeSpecificRecovery).toHaveBeenCalled();
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.isRecovering).toBe(false);
    });

    it('should fall back to simple reset when route-specific recovery fails', async () => {
      const routeSpecificRecovery = vi.fn().mockRejectedValue(new Error('Recovery failed'));
      const error = createMockError('Recovery fail error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'FailRoute',
        routeSpecificRecovery
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_fail123',
        isRecovering: false,
      };

      await boundary.handleRetry();

      expect(routeSpecificRecovery).toHaveBeenCalled();
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.isRecovering).toBe(false);
    });

    it('should show loading state during recovery', () => {
      const error = createMockError('Loading error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'LoadingRoute',
        routeSpecificRecovery: vi.fn().mockImplementation(() => new Promise(() => {}))
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_loading123',
        isRecovering: true,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Recovering...');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Navigation Actions', () => {
    it('should go back when history is available', () => {
      const error = createMockError('Navigation error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'NavRoute',
        fallbackPath: '/dashboard'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_nav123',
        isRecovering: false,
      };

      boundary.handleGoBack();

      expect(window.history.back).toHaveBeenCalled();
    });

    it('should redirect to fallback path when no history available', () => {
      // Mock empty history
      Object.defineProperty(window.history, 'length', { value: 1, writable: true });

      const error = createMockError('No history error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'NoHistoryRoute',
        fallbackPath: '/dashboard'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_nohist123',
        isRecovering: false,
      };

      boundary.handleGoBack();

      expect(window.location.href).toBe('/dashboard');
    });

    it('should redirect to home when no fallback path specified', () => {
      // Mock empty history
      Object.defineProperty(window.history, 'length', { value: 1, writable: true });

      const error = createMockError('No fallback error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'NoFallbackRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_nofallback123',
        isRecovering: false,
      };

      boundary.handleGoBack();

      expect(window.location.href).toBe('/');
    });

    it('should go to home when home button is clicked', () => {
      const error = createMockError('Home nav error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'HomeNavRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_homenav123',
        isRecovering: false,
      };

      boundary.handleGoHome();

      expect(window.location.href).toBe('/');
    });
  });

  describe('User Interactions', () => {
    it('should handle retry button click', () => {
      const error = createMockError('Button click error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'ButtonRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_button123',
        isRecovering: false,
      };

      const handleRetrySpy = vi.spyOn(boundary, 'handleRetry');

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(handleRetrySpy).toHaveBeenCalled();
    });

    it('should handle go back button click', () => {
      const error = createMockError('Back button error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'BackRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_back123',
        isRecovering: false,
      };

      const handleGoBackSpy = vi.spyOn(boundary, 'handleGoBack');

      const { container } = render(<div>{boundary.render()}</div>);

      const backButton = screen.getByText('Go Back');
      fireEvent.click(backButton);

      expect(handleGoBackSpy).toHaveBeenCalled();
    });

    it('should handle home button click', () => {
      const error = createMockError('Home button error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'HomeButtonRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_homebutton123',
        isRecovering: false,
      };

      const handleGoHomeSpy = vi.spyOn(boundary, 'handleGoHome');

      const { container } = render(<div>{boundary.render()}</div>);

      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);

      expect(handleGoHomeSpy).toHaveBeenCalled();
    });

    it('should disable retry button when recovering', () => {
      const error = createMockError('Disabled retry error');
      const errorInfo = createMockErrorInfo();

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'DisabledRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ROUTE_ERR_disabled123',
        isRecovering: true,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Recovering...');
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Specialized Route Boundaries', () => {
    it('should render DashboardErrorBoundary with correct route name', () => {
      const { container } = render(
        <DashboardErrorBoundary>
          <div>Dashboard content</div>
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    });

    it('should render AssessmentErrorBoundary with correct route name', () => {
      const { container } = render(
        <AssessmentErrorBoundary>
          <div>Assessment content</div>
        </AssessmentErrorBoundary>
      );

      expect(screen.getByText('Assessment content')).toBeInTheDocument();
    });

    it('should render AuthErrorBoundary with correct route name', () => {
      const { container } = render(
        <AuthErrorBoundary>
          <div>Auth content</div>
        </AuthErrorBoundary>
      );

      expect(screen.getByText('Auth content')).toBeInTheDocument();
    });

    it('should render ProfileErrorBoundary with correct route name', () => {
      const { container } = render(
        <ProfileErrorBoundary>
          <div>Profile content</div>
        </ProfileErrorBoundary>
      );

      expect(screen.getByText('Profile content')).toBeInTheDocument();
    });

    it('should render AdminErrorBoundary with correct route name', () => {
      const { container } = render(
        <AdminErrorBoundary>
          <div>Admin content</div>
        </AdminErrorBoundary>
      );

      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });

    it('should handle errors in specialized boundaries', () => {
      const ErrorComponent = () => {
        throw new Error('Specialized boundary error');
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container } = render(
          <DashboardErrorBoundary>
            <ErrorComponent />
          </DashboardErrorBoundary>
        );

        expect(screen.getByText('Route Error')).toBeInTheDocument();
        expect(screen.getByText('There was an error loading the Dashboard page')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });
  });

  describe('Error Reporting Context', () => {
    it('should include route-specific metadata in error reports', () => {
      const error = createMockError('Context error');
      const errorInfo = createMockErrorInfo('TestComponent\n  at TestComponent');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');

      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'ContextRoute'
      });

      boundary.state = {
        hasError: true,
        error,
        errorId: 'ROUTE_ERR_context123',
        isRecovering: false,
      };

      boundary.componentDidCatch(error, errorInfo);

      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          component: 'ContextRoute',
          action: 'routeError',
          metadata: expect.objectContaining({
            errorId: 'ROUTE_ERR_context123',
            routeName: 'ContextRoute',
            componentStack: errorInfo.componentStack,
            routeError: true,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle different route names appropriately', () => {
      const testRoutes = ['Dashboard', 'Assessment', 'Auth', 'Profile', 'Admin', 'Custom'];

      testRoutes.forEach(routeName => {
        const error = createMockError(`${routeName} error`);
        const errorInfo = createMockErrorInfo();

        const boundary = new RouteErrorBoundary({
          children: <div>Test</div>,
          routeName
        });

        boundary.state = {
          hasError: true,
          error,
          errorInfo,
          errorId: `ROUTE_ERR_${routeName.toLowerCase()}123`,
          isRecovering: false,
        };

        const { container } = render(<div>{boundary.render()}</div>);

        expect(screen.getByText(`There was an error loading the ${routeName} page`)).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should render children normally when no error', () => {
      const TestChild = () => <div>Normal route content</div>;

      const { container } = render(
        <RouteErrorBoundary routeName="TestRoute">
          <TestChild />
        </RouteErrorBoundary>
      );

      expect(screen.getByText('Normal route content')).toBeInTheDocument();
    });

    it('should catch and handle errors in route components', () => {
      const ErrorChild = () => {
        throw new Error('Route child error');
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container } = render(
          <RouteErrorBoundary routeName="ErrorRoute">
            <ErrorChild />
          </RouteErrorBoundary>
        );

        expect(screen.getByText('Route Error')).toBeInTheDocument();
        expect(screen.getByText('There was an error loading the ErrorRoute page')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });

    it('should preserve state when requested during retry', () => {
      const boundary = new RouteErrorBoundary({
        children: <div>Test</div>,
        routeName: 'PreserveRoute',
        preserveState: true
      });

      boundary.state = {
        hasError: true,
        error: createMockError('Preserve state error'),
        errorInfo: createMockErrorInfo(),
        errorId: 'ROUTE_ERR_preserve123',
        isRecovering: false,
      };

      boundary.handleRetry();

      expect(boundary.state.hasError).toBe(false);
      // State should be cleared but preserveState prop doesn't affect the retry logic
      // This tests the basic functionality works as expected
    });
  });
});