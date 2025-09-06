/**
 * Component-level Error Boundary
 * Lightweight error handling for individual components with graceful fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  globalErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext
} from '@/services/error/global-error-handler.service';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  enableRecovery?: boolean;
  silent?: boolean;
  preserveSpace?: boolean;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
}

export class ComponentErrorBoundary extends Component<ComponentErrorBoundaryProps, ComponentErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Report to global error handler
    const context: ErrorContext = {
      component: this.props.componentName,
      action: 'componentError',
      metadata: {
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
        componentError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.UI,
      context,
      {
        showToast: !this.props.silent,
        logError: true,
        reportError: true
      }
    );

    // Auto-recovery if enabled
    if (this.props.enableRecovery && this.state.retryCount < (this.props.maxRetries || 2)) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private scheduleAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({ isRecovering: true });

    // Short delay for auto-retry
    this.retryTimeoutId = setTimeout(() => {
      this.retry();
    }, 1000);
  };

  retry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isRecovering: false
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Silent mode - don't show anything
      if (this.props.silent) {
        return null;
      }

      // Space preservation mode
      if (this.props.preserveSpace) {
        return (
          <Card className="glass border-0 bg-transparent shadow-none">
            <CardContent className="p-0">
              {this.renderMinimalErrorUI()}
            </CardContent>
          </Card>
        );
      }

      // Default error UI
      return (
        <Card className="glass">
          <CardContent className="p-4">
            {this.renderMinimalErrorUI()}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }

  private renderMinimalErrorUI = () => {
    const maxRetries = this.props.maxRetries || 2;
    const canRetry = this.state.retryCount < maxRetries && !this.state.isRecovering;

    return (
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-gray-800">
              {this.props.componentName} Error
            </h4>
            {canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={this.retry}
                className="h-6 px-2 text-xs"
                disabled={this.state.isRecovering}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                {this.state.isRecovering ? '...' : 'Retry'}
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-2">
            This component encountered an error and couldn't display properly.
          </p>
          {this.state.retryCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Attempts: {this.state.retryCount}/{maxRetries}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };
}

// Specialized component error boundaries for common component types
export const FormErrorBoundary: React.FC<Omit<ComponentErrorBoundaryProps, 'componentName'>> = (props) => (
  <ComponentErrorBoundary
    {...props}
    componentName="Form"
    fallback={
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This form encountered an error. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    }
  />
);

export const ChartErrorBoundary: React.FC<Omit<ComponentErrorBoundaryProps, 'componentName'>> = (props) => (
  <ComponentErrorBoundary
    {...props}
    componentName="Chart"
    fallback={
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chart data unavailable</p>
        </CardContent>
      </Card>
    }
    preserveSpace={true}
  />
);

export const ListErrorBoundary: React.FC<Omit<ComponentErrorBoundaryProps, 'componentName'>> = (props) => (
  <ComponentErrorBoundary
    {...props}
    componentName="List"
    fallback={
      <Card className="glass">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load list items</p>
        </CardContent>
      </Card>
    }
    preserveSpace={true}
  />
);

export const MediaErrorBoundary: React.FC<Omit<ComponentErrorBoundaryProps, 'componentName'>> = (props) => (
  <ComponentErrorBoundary
    {...props}
    componentName="Media"
    fallback={
      <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Media unavailable</p>
        </div>
      </div>
    }
    silent={true}
  />
);

export const AsyncDataErrorBoundary: React.FC<Omit<ComponentErrorBoundaryProps, 'componentName'>> = (props) => (
  <ComponentErrorBoundary
    {...props}
    componentName="AsyncData"
    enableRecovery={true}
    maxRetries={3}
    fallback={
      <Card className="glass border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Data Loading Error</p>
              <p className="text-xs text-amber-600">Unable to load data. Retrying...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    }
  />
);

// Hook-based error boundary for functional components
export const useComponentErrorHandler = (componentName: string) => {
  const handleError = React.useCallback((error: Error, errorInfo?: string) => {
    const context: ErrorContext = {
      component: componentName,
      action: 'hookError',
      metadata: {
        hookError: true,
        errorInfo
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.UI,
      context,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, [componentName]);

  return { handleError };
};

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ComponentErrorBoundaryProps, 'children'> & { componentName: string }
) {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary {...options}>
      <Component {...props} />
    </ComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ComponentErrorBoundary;