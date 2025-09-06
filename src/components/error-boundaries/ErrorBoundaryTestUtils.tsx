/**
 * Error Boundary Testing Utilities
 * Tools for testing error boundaries in development and CI environments
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { Bug, AlertCircle, Shield, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/services/logging/logger.service';

interface ErrorBoundaryTestContextType {
  errors: TestError[];
  addError: (error: TestError) => void;
  clearErrors: () => void;
  simulateError: (type: ErrorType, component: string) => void;
  isTesting: boolean;
}

interface TestError {
  id: string;
  type: ErrorType;
  component: string;
  message: string;
  timestamp: Date;
  stack?: string;
  handled: boolean;
}

export type ErrorType =
  | 'network'
  | 'authentication'
  | 'database'
  | 'validation'
  | 'business-logic'
  | 'ui'
  | 'timeout'
  | 'permission'
  | 'resource'
  | 'general';

const ErrorBoundaryTestContext = createContext<ErrorBoundaryTestContextType | undefined>(undefined);

export const useErrorBoundaryTesting = () => {
  const context = useContext(ErrorBoundaryTestContext);
  if (!context) {
    throw new Error('useErrorBoundaryTesting must be used within ErrorBoundaryTestProvider');
  }
  return context;
};

export const ErrorBoundaryTestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<TestError[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addError = (error: TestError) => {
    setErrors(prev => [...prev, error]);
    logger.warn('Test error captured', {
      component: 'ErrorBoundaryTestProvider',
      action: 'addError',
      error: error.message,
      metadata: { type: error.type, component: error.component }
    });
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const simulateError = (type: ErrorType, component: string) => {
    const errorMessages: Record<ErrorType, string> = {
      'network': 'Failed to fetch: Network request failed',
      'authentication': 'Authentication failed: Invalid token',
      'database': 'Database connection timeout after 5000ms',
      'validation': 'Validation failed: Required field missing',
      'business-logic': 'Business rule violation: Assessment already completed',
      'ui': 'UI Error: Component failed to render',
      'timeout': 'Timeout: Request exceeded 30000ms limit',
      'permission': 'Permission denied: Insufficient privileges',
      'resource': 'Resource not found: File does not exist',
      'general': 'Unexpected error occurred during operation'
    };

    const error: TestError = {
      id: `TEST_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      component,
      message: errorMessages[type],
      timestamp: new Date(),
      stack: `Error: ${errorMessages[type]}\n    at TestComponent (${component}:1:1)\n    at render (${component}:1:1)`,
      handled: false
    };

    addError(error);

    // Throw the error to test error boundaries
    throw new Error(errorMessages[type]);
  };

  const value: ErrorBoundaryTestContextType = {
    errors,
    addError,
    clearErrors,
    simulateError,
    isTesting
  };

  return (
    <ErrorBoundaryTestContext.Provider value={value}>
      {children}
    </ErrorBoundaryTestContext.Provider>
  );
};

// Test Component that throws errors
export const ErrorTestComponent: React.FC<{
  errorType: ErrorType;
  componentName: string;
  delay?: number;
}> = ({ errorType, componentName, delay = 0 }) => {
  const { simulateError } = useErrorBoundaryTesting();

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        simulateError(errorType, componentName);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      simulateError(errorType, componentName);
    }
  }, [errorType, componentName, delay, simulateError]);

  return (
    <div className="p-4 border rounded">
      <p className="text-sm text-gray-600">
        Test Component: {componentName} (Will throw {errorType} error{delay > 0 ? ` in ${delay}ms` : ''})
      </p>
    </div>
  );
};

// Error Boundary Test Dashboard
export const ErrorBoundaryTestDashboard: React.FC = () => {
  const { errors, clearErrors, isTesting } = useErrorBoundaryTesting();

  const errorTypeColors: Record<ErrorType, string> = {
    'network': 'text-blue-600 bg-blue-100',
    'authentication': 'text-red-600 bg-red-100',
    'database': 'text-purple-600 bg-purple-100',
    'validation': 'text-yellow-600 bg-yellow-100',
    'business-logic': 'text-orange-600 bg-orange-100',
    'ui': 'text-gray-600 bg-gray-100',
    'timeout': 'text-indigo-600 bg-indigo-100',
    'permission': 'text-pink-600 bg-pink-100',
    'resource': 'text-green-600 bg-green-100',
    'general': 'text-gray-600 bg-gray-100'
  };

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Error Boundary Test Dashboard
          </CardTitle>
          <CardDescription>
            Monitor and test error boundary behavior during development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isTesting ? 'default' : 'outline'}>
                {isTesting ? 'Testing Mode' : 'Monitoring Mode'}
              </Badge>
              <Badge variant="outline">
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Button onClick={clearErrors} variant="outline" size="sm">
              Clear Errors
            </Button>
          </div>

          {/* Error List */}
          {errors.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error) => (
                <Alert key={error.id} className="border-l-4 border-l-gray-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{error.component}</div>
                          <div className="text-sm text-gray-600">{error.message}</div>
                        </div>
                        <Badge className={`text-xs ${errorTypeColors[error.type]}`}>
                          {error.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {error.timestamp.toLocaleTimeString()} • ID: {error.id}
                      </div>
                      {!error.handled && (
                        <Badge variant="destructive" className="text-xs">
                          Unhandled
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                No test errors captured yet. Errors will appear here when they occur during testing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Error Boundary Test Suite
export const ErrorBoundaryTestSuite: React.FC = () => {
  const { simulateError } = useErrorBoundaryTesting();

  const testCases = [
    { type: 'network' as ErrorType, component: 'NetworkComponent', label: 'Network Error' },
    { type: 'authentication' as ErrorType, component: 'AuthComponent', label: 'Authentication Error' },
    { type: 'database' as ErrorType, component: 'DatabaseComponent', label: 'Database Error' },
    { type: 'validation' as ErrorType, component: 'FormComponent', label: 'Validation Error' },
    { type: 'ui' as ErrorType, component: 'UIComponent', label: 'UI Rendering Error' },
    { type: 'timeout' as ErrorType, component: 'AsyncComponent', label: 'Timeout Error' },
  ];

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Boundary Test Suite
          </CardTitle>
          <CardDescription>
            Test different error types to verify error boundary behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testCases.map((testCase) => (
              <Button
                key={testCase.type}
                variant="outline"
                onClick={() => {
                  try {
                    simulateError(testCase.type, testCase.component);
                  } catch (error) {
                    // Error will be caught by error boundary
                    console.log('Test error thrown:', error);
                  }
                }}
                className="h-auto p-4 flex flex-col items-center text-center"
              >
                <div className="font-medium mb-1">{testCase.label}</div>
                <div className="text-xs text-muted-foreground">
                  {testCase.component}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ErrorBoundaryTestDashboard />
    </div>
  );
};

// Hook for testing errors in components
export const useErrorTest = (componentName: string) => {
  const { simulateError } = useErrorBoundaryTesting();

  const throwError = React.useCallback((type: ErrorType) => {
    simulateError(type, componentName);
  }, [simulateError, componentName]);

  const throwNetworkError = React.useCallback(() => throwError('network'), [throwError]);
  const throwAuthError = React.useCallback(() => throwError('authentication'), [throwError]);
  const throwDatabaseError = React.useCallback(() => throwError('database'), [throwError]);
  const throwValidationError = React.useCallback(() => throwError('validation'), [throwError]);
  const throwBusinessError = React.useCallback(() => throwError('business-logic'), [throwError]);
  const throwTimeoutError = React.useCallback(() => throwError('timeout'), [throwError]);

  return {
    throwError,
    throwNetworkError,
    throwAuthError,
    throwDatabaseError,
    throwValidationError,
    throwBusinessError,
    throwTimeoutError
  };
};

// Development helper that wraps components with error testing
export function withErrorTesting<P extends object>(
  Component: React.ComponentType<P>,
  options: { componentName: string; enableTesting?: boolean }
) {
  const WrappedComponent = (props: P) => {
    if (options.enableTesting && process.env.NODE_ENV === 'development') {
      return (
        <ErrorBoundaryTestProvider>
          <ErrorBoundaryTestDashboard />
          <Component {...props} />
        </ErrorBoundaryTestProvider>
      );
    }
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withErrorTesting(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Performance monitoring for error boundaries
export const useErrorBoundaryPerformance = () => {
  const [metrics, setMetrics] = useState({
    errorCount: 0,
    recoveryTime: 0,
    lastErrorTime: null as Date | null,
    recoverySuccessRate: 0
  });

  const trackError = React.useCallback(() => {
    const startTime = Date.now();
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastErrorTime: new Date()
    }));

    return () => {
      const recoveryTime = Date.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        recoveryTime,
        recoverySuccessRate: prev.errorCount > 0 ?
          ((prev.recoverySuccessRate * prev.errorCount) + 1) / (prev.errorCount + 1) : 1
      }));
    };
  }, []);

  return { metrics, trackError };
};

export default ErrorBoundaryTestSuite;