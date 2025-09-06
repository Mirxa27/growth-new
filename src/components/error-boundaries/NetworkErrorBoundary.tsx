/**
 * Network Error Boundary
 * Handles network-related errors with offline detection and recovery options
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
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

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
  retryInterval?: number;
  enableAutoRetry?: boolean;
  showNetworkStatus?: boolean;
  onNetworkError?: (error: Error) => void;
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isOnline: boolean;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime?: Date;
}

const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<NetworkInformation | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Network connection restored', { component: 'NetworkStatusIndicator' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network connection lost', { component: 'NetworkStatusIndicator' });
    };

    const handleNetworkChange = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection as NetworkInformation;
        setNetworkInfo(conn);
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      const conn = (navigator as any).connection as NetworkInformation;
      conn.addEventListener('change', handleNetworkChange);
      setNetworkInfo(conn);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('connection' in navigator) {
        const conn = (navigator as any).connection as NetworkInformation;
        conn.removeEventListener('change', handleNetworkChange);
      }
    };
  }, []);

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Online</span>
        {networkInfo && (
          <Badge variant="outline" className="text-xs">
            {networkInfo.effectiveType}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-600">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm">Offline</span>
    </div>
  );
};

export class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;
  private retryIntervalId?: NodeJS.Timeout;

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
      isRetrying: false
    };

    // Bind methods
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  componentDidMount() {
    // Set up network event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    // Clean up event listeners and timeouts
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<NetworkErrorBoundaryState> {
    // Only handle network-related errors
    const isNetworkError = this.isNetworkError(error);

    if (isNetworkError) {
      return {
        hasError: true,
        error,
        errorId: `NET_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Only handle network errors
    if (!this.isNetworkError(error)) {
      return;
    }

    // Call the onNetworkError callback if provided
    this.props.onNetworkError?.(error);

    // Report to global error handler
    const context: ErrorContext = {
      component: 'Network',
      action: 'networkError',
      metadata: {
        errorId: this.state.errorId,
        isOnline: navigator.onLine,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
        networkError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      context,
      {
        showToast: false, // Don't show toast since we're showing UI
        logError: true,
        reportError: true
      }
    );

    logger.warn('Network error caught by boundary', {
      component: 'NetworkErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        isOnline: navigator.onLine,
        retryCount: this.state.retryCount
      }
    });

    // Start auto-retry if enabled
    if (this.props.enableAutoRetry) {
      this.startAutoRetry();
    }
  }

  private static isNetworkError(error: Error): boolean {
    if (!error) return false;

    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Check for common network error patterns
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('cors') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline') ||
      name === 'networkerror' ||
      name === 'typeerror' && (message.includes('failed to fetch') || message.includes('network'))
    );
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });

    // If we had an error and are now online, retry automatically
    if (this.state.hasError) {
      this.retry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private startAutoRetry = () => {
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
    }

    const interval = this.props.retryInterval || 5000; // Default 5 seconds

    this.retryIntervalId = setInterval(() => {
      if (navigator.onLine) {
        this.retry();
      }
    }, interval);
  };

  retry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({ isRetrying: true });

    // Clear auto-retry interval
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = undefined;
    }

    // Simulate retry with a delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastRetryTime: new Date()
      }));

      logger.info('Network error boundary retry attempted', {
        component: 'NetworkErrorBoundary',
        action: 'retry',
        metadata: { retryCount: this.state.retryCount + 1 }
      });
    }, 1000);
  };

  private getNetworkErrorMessage = (error?: Error): string => {
    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    if (!error) return 'A network error occurred';

    const message = error.message.toLowerCase();

    if (message.includes('cors')) {
      return 'Unable to connect due to cross-origin restrictions';
    }

    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    if (message.includes('failed to fetch')) {
      return 'Unable to reach the server. Please check your connection.';
    }

    return 'A network error occurred. Please try again.';
  };

  private getEstimatedRetryTime = (): string => {
    if (!this.state.lastRetryTime) return '';

    const now = new Date();
    const diff = now.getTime() - this.state.lastRetryTime.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getNetworkErrorMessage(this.state.error);
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries && navigator.onLine;

      return (
        <div className="flex items-center justify-center p-4 min-h-[400px]">
          <Card className="w-full max-w-lg glass shadow-xl border-orange-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <WifiOff className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-orange-800">Connection Error</CardTitle>
              <CardDescription className="text-orange-700">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Network Status */}
              {this.props.showNetworkStatus && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Network Status</span>
                    <NetworkStatusIndicator />
                  </div>
                </div>
              )}

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Retry Attempts</span>
                    <Badge variant="outline">
                      {this.state.retryCount}/{maxRetries}
                    </Badge>
                  </div>

                  {this.state.lastRetryTime && (
                    <div className="text-xs text-gray-600">
                      Last retry: {this.getEstimatedRetryTime()}
                    </div>
                  )}
                </div>
              )}

              {/* Auto-retry Status */}
              {this.props.enableAutoRetry && (
                <Alert className="bg-blue-50 border-blue-200">
                  {this.state.isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription className="text-blue-800">
                        Attempting to reconnect...
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Auto-retry is enabled. Will attempt to reconnect when online.
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {canRetry && (
                  <Button
                    onClick={this.retry}
                    className="w-full"
                    disabled={this.state.isRetrying || !navigator.onLine}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Retry Now'}
                  </Button>
                )}

                {!navigator.onLine && (
                  <Alert>
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      Please check your internet connection and try again.
                    </AlertDescription>
                  </Alert>
                )}

                {this.state.errorId && (
                  <div className="text-xs text-gray-500 text-center">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling network errors in functional components
export const useNetworkErrorHandler = () => {
  const handleNetworkError = React.useCallback((error: Error, context?: string) => {
    const errorContext: ErrorContext = {
      component: 'Network',
      action: context || 'unknown',
      metadata: {
        hookNetworkError: true,
        isOnline: navigator.onLine
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      errorContext,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, []);

  const checkNetworkStatus = React.useCallback(() => {
    return {
      isOnline: navigator.onLine,
      connection: 'connection' in navigator ? (navigator as any).connection : null
    };
  }, []);

  return { handleNetworkError, checkNetworkStatus };
};

export default NetworkErrorBoundary;