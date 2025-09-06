/**
 * Authentication Error Boundary
 * Handles authentication-specific errors with appropriate recovery actions
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Lock, AlertCircle, RefreshCw, ExternalLink, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  globalErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext
} from '@/services/error/global-error-handler.service';
import { logger } from '@/services/logging/logger.service';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallbackPath?: string;
  onAuthError?: (error: Error) => void;
  allowRetry?: boolean;
  showDebug?: boolean;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isRetrying: boolean;
}

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `AUTH_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call the onAuthError callback if provided
    this.props.onAuthError?.(error);

    // Report to global error handler with auth-specific context
    const context: ErrorContext = {
      component: 'Authentication',
      action: 'authError',
      metadata: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        authError: true,
        path: window.location.pathname
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      context,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );

    logger.warn('Authentication error caught by boundary', {
      component: 'AuthErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        path: window.location.pathname
      }
    });
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });

    // Simulate retry attempt
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false
      });

      logger.info('Auth error boundary retry attempted', {
        component: 'AuthErrorBoundary',
        action: 'retry'
      });
    }, 1000);
  };

  handleGoToAuth = () => {
    window.location.href = this.props.fallbackPath || '/auth';
  };

  handleClearAuth = () => {
    // Clear localStorage and redirect to auth
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/auth';
  };

  private getAuthErrorMessage = (error?: Error): string => {
    if (!error) return 'An authentication error occurred';

    const message = error.message.toLowerCase();

    if (message.includes('token') || message.includes('jwt')) {
      return 'Your session token is invalid or has expired';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'You are not authorized to access this resource';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to authentication service';
    }

    if (message.includes('timeout')) {
      return 'Authentication request timed out';
    }

    return 'An authentication error occurred';
  };

  private getAuthErrorType = (error?: Error): string => {
    if (!error) return 'Unknown';

    const message = error.message.toLowerCase();

    if (message.includes('token') || message.includes('jwt')) {
      return 'Token Error';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Authorization Error';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    }

    if (message.includes('timeout')) {
      return 'Timeout Error';
    }

    return 'Authentication Error';
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getAuthErrorMessage(this.state.error);
      const errorType = this.getAuthErrorType(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
          <Card className="w-full max-w-md glass shadow-xl border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-800">Authentication Error</CardTitle>
              <CardDescription className="text-red-700">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Error Type</span>
                  <Badge variant="destructive" className="text-xs">
                    {errorType}
                  </Badge>
                </div>

                {this.state.errorId && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Error Reference</div>
                    <code className="text-xs font-mono text-gray-800">
                      {this.state.errorId}
                    </code>
                  </div>
                )}
              </div>

              {/* Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to be authenticated to access this feature. Please log in again.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={this.handleGoToAuth}
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>

                {this.props.allowRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="w-full"
                    disabled={this.state.isRetrying}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Retry'}
                  </Button>
                )}

                <Button
                  onClick={this.handleClearAuth}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Clear Session & Login
                </Button>
              </div>

              {/* Debug Info */}
              {(this.props.showDebug || process.env.NODE_ENV === 'development') && this.state.error && (
                <details className="pt-2 border-t">
                  <summary className="cursor-pointer text-xs text-gray-600">Debug Information</summary>
                  <div className="mt-2 space-y-2 text-xs">
                    <div>
                      <div className="font-medium">Error Message:</div>
                      <code className="bg-gray-100 p-1 rounded block">
                        {this.state.error.message}
                      </code>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <div className="font-medium">Stack Trace:</div>
                        <pre className="bg-gray-100 p-1 rounded overflow-auto max-h-20">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling authentication errors in functional components
export const useAuthErrorHandler = () => {
  const handleAuthError = React.useCallback((error: Error, context?: string) => {
    const errorContext: ErrorContext = {
      component: 'Authentication',
      action: context || 'unknown',
      metadata: {
        hookAuthError: true,
        path: window.location.pathname
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      errorContext,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, []);

  const handleSessionExpiry = React.useCallback(() => {
    const error = new Error('Session expired');
    handleAuthError(error, 'sessionExpiry');

    // Redirect to auth page after a short delay
    setTimeout(() => {
      window.location.href = '/auth';
    }, 2000);
  }, [handleAuthError]);

  return { handleAuthError, handleSessionExpiry };
};

export default AuthErrorBoundary;