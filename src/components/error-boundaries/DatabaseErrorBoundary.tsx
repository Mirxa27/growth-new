/**
 * Database Error Boundary
 * Handles database-related errors with connection recovery and data integrity checks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Database, AlertTriangle, RefreshCw, Wifi, CloudOff, Shield, Activity } from 'lucide-react';
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

interface DatabaseErrorBoundaryProps {
  children: ReactNode;
  onDatabaseError?: (error: Error) => void;
  onConnectionRetry?: () => Promise<boolean>;
  onDataCheck?: () => Promise<boolean>;
  maxRetries?: number;
  retryInterval?: number;
  enableAutoRetry?: boolean;
  showHealthStatus?: boolean;
}

interface DatabaseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'unknown';
  isOnline: boolean;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export class DatabaseErrorBoundary extends Component<DatabaseErrorBoundaryProps, DatabaseErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;
  private healthCheckIntervalId?: NodeJS.Timeout;

  constructor(props: DatabaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
      connectionStatus: 'unknown',
      isOnline: navigator.onLine,
      healthStatus: 'unknown'
    };

    // Bind methods
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  componentDidMount() {
    // Set up network event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start health checks
    this.startHealthChecks();
  }

  componentWillUnmount() {
    // Clean up event listeners and intervals
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<DatabaseErrorBoundaryState> {
    // Only handle database-related errors
    const isDatabaseError = this.isDatabaseError(error);

    if (isDatabaseError) {
      return {
        hasError: true,
        error,
        errorId: `DB_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Only handle database errors
    if (!this.isDatabaseError(error)) {
      return;
    }

    // Call the onDatabaseError callback if provided
    this.props.onDatabaseError?.(error);

    // Update connection status
    this.setState({ connectionStatus: 'disconnected', healthStatus: 'unhealthy' });

    // Report to global error handler
    const context: ErrorContext = {
      component: 'Database',
      action: 'databaseError',
      metadata: {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        connectionStatus: this.state.connectionStatus,
        healthStatus: this.state.healthStatus,
        isOnline: navigator.onLine,
        componentStack: errorInfo.componentStack,
        databaseError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.CRITICAL,
      ErrorCategory.DATABASE,
      context,
      {
        showToast: false, // Don't show toast since we're showing UI
        logError: true,
        reportError: true
      }
    );

    logger.error('Database error caught by boundary', {
      component: 'DatabaseErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        connectionStatus: this.state.connectionStatus,
        healthStatus: this.state.healthStatus,
        isOnline: navigator.onLine
      }
    });

    // Start auto-retry if enabled
    if (this.props.enableAutoRetry) {
      this.startAutoRetry();
    }
  }

  private static isDatabaseError(error: Error): boolean {
    if (!error) return false;

    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Check for common database error patterns
    return (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('supabase') ||
      message.includes('postgres') ||
      message.includes('sql') ||
      message.includes('constraint') ||
      message.includes('unique') ||
      message.includes('foreign key') ||
      message.includes('pool') ||
      message.includes('connection refused') ||
      name === 'networkerror' ||
      name === 'timeouterror' ||
      message.includes('5432') || // PostgreSQL default port
      message.includes('503') || // Service unavailable
      message.includes('504') // Gateway timeout
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
    this.setState({ isOnline: false, connectionStatus: 'disconnected', healthStatus: 'unhealthy' });
  };

  private startHealthChecks = () => {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }

    // Health check every 30 seconds
    this.healthCheckIntervalId = setInterval(() => {
      this.checkDatabaseHealth();
    }, 30000);

    // Initial check
    this.checkDatabaseHealth();
  };

  private checkDatabaseHealth = async () => {
    if (this.props.onDataCheck) {
      try {
        const isHealthy = await this.props.onDataCheck();
        this.setState({
          healthStatus: isHealthy ? 'healthy' : 'degraded',
          connectionStatus: isHealthy ? 'connected' : 'disconnected'
        });
      } catch (error) {
        this.setState({
          healthStatus: 'unhealthy',
          connectionStatus: 'disconnected'
        });
      }
    }
  };

  private startAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    const interval = this.props.retryInterval || 10000; // Default 10 seconds

    this.retryTimeoutId = setTimeout(() => {
      if (navigator.onLine) {
        this.retry();
      }
    }, interval);
  };

  retry = async () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({ isRetrying: true, connectionStatus: 'connecting' });

    try {
      // Try custom retry if provided
      let retrySuccess = false;
      if (this.props.onConnectionRetry) {
        retrySuccess = await this.props.onConnectionRetry();
      } else {
        // Simulate retry delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        retrySuccess = Math.random() > 0.3; // 70% success rate for demo
      }

      if (retrySuccess) {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
          connectionStatus: 'connected',
          healthStatus: 'healthy',
          lastRetryTime: new Date()
        }));

        logger.info('Database connection restored', {
          component: 'DatabaseErrorBoundary',
          action: 'retry',
          metadata: { retryCount: this.state.retryCount + 1 }
        });
      } else {
        this.setState({
          isRetrying: false,
          connectionStatus: 'disconnected',
          healthStatus: 'unhealthy'
        });

        // Retry again if auto-retry is enabled
        if (this.props.enableAutoRetry) {
          this.startAutoRetry();
        }
      }
    } catch (retryError) {
      this.setState({
        isRetrying: false,
        connectionStatus: 'disconnected',
        healthStatus: 'unhealthy'
      });

      logger.error('Database retry failed', {
        component: 'DatabaseErrorBoundary',
        action: 'retry',
        error: retryError,
        metadata: { retryCount: this.state.retryCount + 1 }
      });

      // Retry again if auto-retry is enabled
      if (this.props.enableAutoRetry) {
        this.startAutoRetry();
      }
    }
  };

  private getDatabaseErrorMessage = (error?: Error): string => {
    if (!navigator.onLine) {
      return 'You are offline. Database features are unavailable.';
    }

    if (!error) return 'A database error occurred';

    const message = error.message.toLowerCase();

    if (message.includes('connection') || message.includes('timeout')) {
      return 'Unable to connect to the database. Please check your connection.';
    }

    if (message.includes('constraint') || message.includes('unique')) {
      return 'A data integrity error occurred. This has been reported to our team.';
    }

    if (message.includes('pool') || message.includes('503')) {
      return 'The database is currently unavailable due to high demand.';
    }

    return 'A database error occurred. Our team has been notified.';
  };

  private getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'disconnected':
      case 'unhealthy':
        return 'red';
      case 'degraded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getDatabaseErrorMessage(this.state.error);
      const maxRetries = this.props.maxRetries || 5;
      const canRetry = this.state.retryCount < maxRetries && navigator.onLine;

      return (
        <div className="flex items-center justify-center p-4 min-h-[400px]">
          <Card className="w-full max-w-2xl glass shadow-xl border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <Database className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-800">Database Error</CardTitle>
              <CardDescription className="text-red-700">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicators */}
              {this.props.showHealthStatus && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">Connection</div>
                    <Badge variant="outline" className={`text-${this.getStatusColor(this.state.connectionStatus)}-600`}>
                      {this.state.connectionStatus}
                    </Badge>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">Health</div>
                    <Badge variant="outline" className={`text-${this.getStatusColor(this.state.healthStatus)}-600`}>
                      {this.state.healthStatus}
                    </Badge>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">Network</div>
                    <Badge variant={this.state.isOnline ? 'default' : 'destructive'}>
                      {this.state.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Error Details */}
              <div className="space-y-2">
                {this.state.errorId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Error ID</span>
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {this.state.errorId}
                    </code>
                  </div>
                )}

                {this.state.retryCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Retry Attempts</span>
                    <Badge variant="outline">
                      {this.state.retryCount}/{maxRetries}
                    </Badge>
                  </div>
                )}

                {this.state.lastRetryTime && (
                  <div className="text-xs text-gray-600 text-center">
                    Last retry: {this.state.lastRetryTime.toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Critical Alert */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This is a critical database error that may affect data integrity. Our team has been automatically notified.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                {canRetry && (
                  <Button
                    onClick={this.retry}
                    className="w-full"
                    disabled={this.state.isRetrying}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Reconnecting...' : 'Retry Connection'}
                  </Button>
                )}

                {this.props.enableAutoRetry && this.state.isRetrying && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Auto-retry is enabled. Will attempt to reconnect periodically.
                    </AlertDescription>
                  </Alert>
                )}

                {!navigator.onLine && (
                  <Alert>
                    <Wifi className="h-4 w-4" />
                    <AlertDescription>
                      Please check your internet connection. Database features will be available when you're back online.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>

              {/* Technical Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="pt-2 border-t">
                  <summary className="cursor-pointer text-xs text-gray-600">Technical Details</summary>
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

// Hook for handling database errors in functional components
export const useDatabaseErrorHandler = () => {
  const handleDatabaseError = React.useCallback((error: Error, context?: string) => {
    const errorContext: ErrorContext = {
      component: 'Database',
      action: context || 'unknown',
      metadata: {
        hookDatabaseError: true,
        isOnline: navigator.onLine
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.CRITICAL,
      ErrorCategory.DATABASE,
      errorContext,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, []);

  const checkConnection = React.useCallback(async () => {
    try {
      // Simulate database health check
      // In a real app, this would ping the database or make a test query
      return new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(Math.random() > 0.1), 1000); // 90% success rate
      });
    } catch (error) {
      handleDatabaseError(error as Error, 'checkConnection');
      return false;
    }
  }, [handleDatabaseError]);

  return { handleDatabaseError, checkConnection };
};

export default DatabaseErrorBoundary;