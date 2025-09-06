/**
 * Comprehensive Error Boundary System
 * Multi-level error handling with glassmorphism design integration
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, MessageCircle, Bug, Shield, WifiOff, Lock, Database, Mic, Zap } from 'lucide-react';
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

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  lastErrorTime?: Date;
  isRecovering: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  component?: string;
  maxRetries?: number;
  enableRecovery?: boolean;
  reportErrors?: boolean;
  isolate?: boolean;
  level?: 'app' | 'route' | 'component';
  category?: ErrorCategory;
  gracefulFallback?: ReactNode;
}

interface ErrorTypeConfig {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  recoveryMessage: string;
  severity: ErrorSeverity;
  color: string;
  recoverable: boolean;
}

const ERROR_TYPE_CONFIGS: Record<string, ErrorTypeConfig> = {
  'ChunkLoadError': {
    icon: RefreshCw,
    title: 'Resource Loading Error',
    description: 'Unable to load application resources',
    recoveryMessage: 'This often occurs after app updates. Refreshing usually resolves this issue.',
    severity: ErrorSeverity.MEDIUM,
    color: 'yellow',
    recoverable: true
  },
  'NetworkError': {
    icon: WifiOff,
    title: 'Network Connection Error',
    description: 'Unable to connect to the server',
    recoveryMessage: 'Please check your internet connection and try again.',
    severity: ErrorSeverity.HIGH,
    color: 'orange',
    recoverable: true
  },
  'AuthenticationError': {
    icon: Lock,
    title: 'Authentication Error',
    description: 'Session expired or invalid credentials',
    recoveryMessage: 'Please log in again to continue.',
    severity: ErrorSeverity.HIGH,
    color: 'red',
    recoverable: false
  },
  'DatabaseError': {
    icon: Database,
    title: 'Database Error',
    description: 'Unable to access data storage',
    recoveryMessage: 'Our team has been notified. Please try again later.',
    severity: ErrorSeverity.CRITICAL,
    color: 'red',
    recoverable: false
  },
  'VoiceError': {
    icon: Mic,
    title: 'Voice Feature Error',
    description: 'Voice processing failed',
    recoveryMessage: 'Please check your microphone permissions and try again.',
    severity: ErrorSeverity.MEDIUM,
    color: 'orange',
    recoverable: true
  },
  'AssessmentError': {
    icon: Bug,
    title: 'Assessment Error',
    description: 'Unable to process assessment',
    recoveryMessage: 'Your progress has been saved. Please try restarting the assessment.',
    severity: ErrorSeverity.HIGH,
    color: 'orange',
    recoverable: true
  },
  'TypeError': {
    icon: AlertCircle,
    title: 'Runtime Error',
    description: 'Application encountered an unexpected error',
    recoveryMessage: 'This error has been reported to our development team.',
    severity: ErrorSeverity.HIGH,
    color: 'red',
    recoverable: true
  },
  'ReferenceError': {
    icon: Bug,
    title: 'Reference Error',
    description: 'Missing or invalid resource',
    recoveryMessage: 'A required resource could not be found. This has been reported.',
    severity: ErrorSeverity.CRITICAL,
    color: 'red',
    recoverable: false
  }
};

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`,
      lastErrorTime: new Date()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Determine error category based on error type and props
    const category = this.determineErrorCategory(error);

    // Report to global error handler
    if (this.props.reportErrors !== false) {
      const context: ErrorContext = {
        component: this.props.component || this.getComponentName(),
        action: 'componentDidCatch',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          level: this.props.level || 'component',
          isolate: this.props.isolate
        }
      };

      globalErrorHandler.handleError(
        error,
        this.getErrorSeverity(error, category),
        category,
        context,
        {
          showToast: false, // Don't show toast since we're showing UI
          logError: true,
          reportError: true
        }
      );
    }

    // Log error details
    logger.error('ErrorBoundary caught an error', {
      component: this.props.component || this.getComponentName(),
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
        category
      }
    });

    // Auto-recovery attempt if enabled and under retry limit
    if (this.props.enableRecovery && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private determineErrorCategory(error: Error): ErrorCategory {
    // Check if category is explicitly provided
    if (this.props.category) {
      return this.props.category;
    }

    // Determine category based on error type and message
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return ErrorCategory.EXTERNAL_API;
    }

    if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return ErrorCategory.NETWORK;
    }

    if (error.message.includes('auth') || error.message.includes('unauthorized') || error.message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (error.message.includes('database') || error.message.includes('storage') || error.message.includes('supabase')) {
      return ErrorCategory.DATABASE;
    }

    if (error.message.includes('voice') || error.message.includes('microphone') || error.message.includes('audio')) {
      return ErrorCategory.EXTERNAL_API;
    }

    if (error.message.includes('assessment') || error.message.includes('quiz') || error.message.includes('question')) {
      return ErrorCategory.BUSINESS_LOGIC;
    }

    return ErrorCategory.UI;
  }

  private getErrorSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.DATABASE || category === ErrorCategory.AUTHENTICATION) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (category === ErrorCategory.NETWORK || category === ErrorCategory.AUTHORIZATION ||
        error.name === 'ReferenceError' || error.name === 'SyntaxError') {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (category === ErrorCategory.BUSINESS_LOGIC || category === ErrorCategory.EXTERNAL_API ||
        error.name === 'TypeError' || error.name === 'ChunkLoadError') {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private getComponentName(): string {
    if (this.props.component) {
      return this.props.component;
    }

    switch (this.props.level) {
      case 'app':
        return 'App';
      case 'route':
        return 'Route';
      default:
        return 'Component';
    }
  }

  private scheduleAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Progressive delay: 2s, 4s, 8s
    const delay = Math.min(2000 * Math.pow(2, this.state.retryCount), 8000);

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.retry();
    }, delay);
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

    logger.info('ErrorBoundary retry attempted', {
      component: this.props.component || this.getComponentName(),
      action: 'retry',
      metadata: { retryCount: this.state.retryCount + 1 }
    });
  };

  reset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false
    });
  };

  private getErrorConfig = (): ErrorTypeConfig => {
    if (!this.state.error) {
      return {
        icon: AlertCircle,
        title: 'Unknown Error',
        description: 'An unexpected error occurred',
        recoveryMessage: 'This error has been reported to our team.',
        severity: ErrorSeverity.MEDIUM,
        color: 'orange',
        recoverable: true
      };
    }

    // Find matching config based on error type or message
    for (const [key, config] of Object.entries(ERROR_TYPE_CONFIGS)) {
      if (this.state.error.name === key ||
          this.state.error.message.toLowerCase().includes(key.toLowerCase().replace('Error', ''))) {
        return config;
      }
    }

    // Default config
    return {
      icon: AlertCircle,
      title: this.state.error.name || 'Application Error',
      description: 'An unexpected error occurred',
      recoveryMessage: 'This error has been reported to our development team.',
      severity: ErrorSeverity.MEDIUM,
      color: 'orange',
      recoverable: true
    };
  };

  private formatErrorTime = () => {
    if (!this.state.lastErrorTime) return '';
    return this.state.lastErrorTime.toLocaleString();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportIssue = () => {
    const config = this.getErrorConfig();
    const subject = `Error Report - ${this.state.errorId} - ${config.title}`;
    const body = `Error ID: ${this.state.errorId}\nError Type: ${config.title}\nTime: ${this.formatErrorTime()}\nComponent: ${this.getComponentName()}\n\nDescription:\n[Please describe what you were doing when this error occurred]`;
    window.open(`mailto:support@newme.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.retry);
      }

      // Use graceful fallback for component-level errors
      if (this.props.level === 'component' && this.props.gracefulFallback) {
        return this.props.gracefulFallback;
      }

      const config = this.getErrorConfig();
      const Icon = config.icon;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries && config.recoverable && !this.state.isRecovering;

      // Render appropriate UI based on error boundary level
      if (this.props.level === 'app') {
        return this.renderAppLevelError(config, Icon, canRetry);
      } else if (this.props.level === 'route') {
        return this.renderRouteLevelError(config, Icon, canRetry);
      } else {
        return this.renderComponentLevelError(config, Icon, canRetry);
      }
    }

    return this.props.children;
  }

  private renderAppLevelError(config: ErrorTypeConfig, Icon: React.ComponentType<any>, canRetry: boolean) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-2xl glass shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className={`relative p-6 bg-gradient-to-br from-${config.color}-100 to-${config.color}-200 rounded-2xl shadow-lg`}>
                <Icon className={`w-12 h-12 text-${config.color}-600`} />
                <div className="absolute -top-2 -right-2">
                  <AlertCircle className={`w-6 h-6 text-${config.color}-700 bg-white rounded-full p-1`} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant={config.color === 'red' ? 'destructive' : 'secondary'} className="px-3 py-1">
                  {config.severity.toUpperCase()} Priority
                </Badge>
                {this.props.component && (
                  <Badge variant="outline" className="px-3 py-1">
                    {this.props.component}
                  </Badge>
                )}
              </div>

              <CardTitle className={`text-2xl font-bold text-${config.color === 'yellow' ? 'orange' : config.color}-800`}>
                {config.title}
              </CardTitle>

              <CardDescription className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                {config.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {this.state.errorId && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Bug className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium text-blue-800">Error Reference</div>
                      <code className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                        {this.state.errorId}
                      </code>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {this.state.lastErrorTime && (
                <Alert className="bg-gray-50 border-gray-200">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">Occurred At</div>
                      <div className="text-xs text-gray-600">
                        {this.formatErrorTime()}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Recovery Status */}
            {this.props.enableRecovery && this.state.retryCount > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <div className="flex items-center justify-between">
                    <span>
                      {this.state.isRecovering ? 'Attempting recovery...' : `Recovery attempted ${this.state.retryCount} time${this.state.retryCount > 1 ? 's' : ''}`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {canRetry ? 'Can retry' : 'Max attempts reached'}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Technical Details */}
            {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
              <Alert variant="destructive" className="max-h-64 overflow-hidden">
                <AlertDescription>
                  <details className="group">
                    <summary className="cursor-pointer font-medium flex items-center gap-2 py-2">
                      <Bug className="w-4 h-4" />
                      Technical Details
                      <div className="ml-auto text-xs opacity-70 group-open:hidden">
                        Click to expand
                      </div>
                    </summary>
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <div className="font-semibold mb-1">Error Message:</div>
                        <div className="font-mono bg-gray-100 p-2 rounded text-xs">
                          {this.state.error.message}
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold mb-1">Error Type:</div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {this.state.error.name}
                        </Badge>
                      </div>

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <div className="font-semibold mb-1">Component Stack:</div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      {this.state.error.stack && (
                        <div>
                          <div className="font-semibold mb-1">Stack Trace:</div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <Button
                  onClick={this.retry}
                  className="flex-1 h-12"
                  size="lg"
                  disabled={this.state.isRecovering}
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                  {this.state.isRecovering ? 'Recovering...' : 'Try Again'}
                  {this.state.retryCount > 0 && ` (${this.state.retryCount}/${maxRetries})`}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 h-12"
                size="lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReportIssue}
                className="text-gray-600 hover:text-gray-800"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigator.share && this.state.errorId) {
                    navigator.share({
                      title: 'Error Report',
                      text: `Error ID: ${this.state.errorId}`,
                    });
                  }
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <Bug className="w-4 h-4 mr-2" />
                Share Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderRouteLevelError(config: ErrorTypeConfig, Icon: React.ComponentType<any>, canRetry: boolean) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 bg-${config.color}-100 rounded-full`}>
                <Icon className={`w-8 h-8 text-${config.color}-600`} />
              </div>
            </div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{config.recoveryMessage}</AlertDescription>
            </Alert>

            <div className="flex gap-2">
              {canRetry && (
                <Button onClick={this.retry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>

            {this.state.errorId && (
              <div className="text-xs text-gray-500 text-center">
                Error ID: {this.state.errorId}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderComponentLevelError(config: ErrorTypeConfig, Icon: React.ComponentType<any>, canRetry: boolean) {
    return (
      <Card className="glass p-4 border-0">
        <CardContent className="p-0">
          <div className="flex items-start gap-3">
            <div className={`p-2 bg-${config.color}-100 rounded-lg flex-shrink-0`}>
              <Icon className={`w-4 h-4 text-${config.color}-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{config.title}</h4>
                {canRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.retry}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
              {this.state.errorId && (
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {this.state.errorId}
                </code>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Convenience hooks and components for different error boundary levels
export const AppLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <AppErrorBoundary {...props} level="app" />
);

export const RouteLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <AppErrorBoundary {...props} level="route" />
);

export const ComponentLevelErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <AppErrorBoundary {...props} level="component" />
);

// Specialized error boundaries for specific use cases
export const AuthenticationErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => (
  <AppErrorBoundary {...props} category={ErrorCategory.AUTHENTICATION} level="route" />
);

export const NetworkErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => (
  <AppErrorBoundary {...props} category={ErrorCategory.NETWORK} level="component" />
);

export const AssessmentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => (
  <AppErrorBoundary {...props} category={ErrorCategory.BUSINESS_LOGIC} level="route" />
);

export const VoiceErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => (
  <AppErrorBoundary {...props} category={ErrorCategory.EXTERNAL_API} level="component" />
);

export const DatabaseErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => (
  <AppErrorBoundary {...props} category={ErrorCategory.DATABASE} level="route" />
);

export default AppErrorBoundary;