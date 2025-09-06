import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, MessageCircle, Bug, Shield } from 'lucide-react';
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
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      retryCount: 0
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
    
    // Report to global error handler
    if (this.props.reportErrors !== false) {
      const context: ErrorContext = {
        component: this.props.component || 'ErrorBoundary',
        action: 'componentDidCatch',
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          isolate: this.props.isolate
        }
      };

      globalErrorHandler.handleError(
        error,
        ErrorSeverity.HIGH,
        ErrorCategory.UI,
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
      component: this.props.component || 'ErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack
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

  private scheduleAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Progressive delay: 2s, 4s, 8s
    const delay = Math.min(2000 * Math.pow(2, this.state.retryCount), 8000);
    
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
      retryCount: prevState.retryCount + 1
    }));

    logger.info('ErrorBoundary retry attempted', {
      component: this.props.component || 'ErrorBoundary',
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
      retryCount: 0
    });
  };

  private getErrorSeverityInfo = () => {
    if (!this.state.error) return { color: 'red', severity: 'High' };
    
    // Determine severity based on error type
    if (this.state.error.name === 'ChunkLoadError' || this.state.error.message.includes('Loading chunk')) {
      return { color: 'yellow', severity: 'Medium', recoverable: true };
    }
    
    if (this.state.retryCount >= (this.props.maxRetries || 3)) {
      return { color: 'red', severity: 'Critical', recoverable: false };
    }
    
    return { color: 'orange', severity: 'High', recoverable: true };
  };

  private getErrorType = () => {
    if (!this.state.error) return 'Unknown Error';
    
    if (this.state.error.name === 'ChunkLoadError' || this.state.error.message.includes('Loading chunk')) {
      return 'Resource Loading Error';
    }
    
    if (this.state.error.name === 'TypeError') {
      return 'Runtime Error';
    }
    
    if (this.state.error.name === 'SyntaxError') {
      return 'Code Syntax Error';
    }
    
    if (this.state.error.name === 'ReferenceError') {
      return 'Reference Error';
    }
    
    return this.state.error.name || 'Application Error';
  };

  private getRecoveryMessage = () => {
    if (!this.state.error) return '';
    
    if (this.state.error.name === 'ChunkLoadError' || this.state.error.message.includes('Loading chunk')) {
      return 'This appears to be a loading issue, often caused by app updates or network problems. A page refresh usually resolves this.';
    }
    
    if (this.state.retryCount > 0) {
      const attempts = this.state.retryCount;
      return `Recovery attempted ${attempts} time${attempts > 1 ? 's' : ''}. This error has been reported to our development team.`;
    }
    
    return 'This error has been automatically logged and reported to our team. We apologize for the inconvenience.';
  };

  private formatErrorTime = () => {
    if (!this.state.lastErrorTime) return '';
    return this.state.lastErrorTime.toLocaleString();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.retry);
      }

      const { color, severity, recoverable } = this.getErrorSeverityInfo();
      const errorType = this.getErrorType();
      const recoveryMessage = this.getRecoveryMessage();
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries && recoverable !== false;

      // Enhanced fallback UI with comprehensive error handling
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-2xl glass shadow-2xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-6">
                <div className={`relative p-6 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-2xl shadow-lg`}>
                  <Shield className={`w-12 h-12 text-${color}-600`} />
                  <div className="absolute -top-2 -right-2">
                    <AlertCircle className={`w-6 h-6 text-${color}-700 bg-white rounded-full p-1`} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={color === 'red' ? 'destructive' : 'secondary'} className="px-3 py-1">
                    {severity} Priority
                  </Badge>
                  {this.props.component && (
                    <Badge variant="outline" className="px-3 py-1">
                      {this.props.component}
                    </Badge>
                  )}
                </div>
                
                <CardTitle className={`text-2xl font-bold text-${color === 'yellow' ? 'orange' : color}-800`}>
                  {errorType}
                </CardTitle>
                
                <CardDescription className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
                  {recoveryMessage}
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
              {this.props.enableRecovery && this.state.retryCount > 0 && canRetry && (
                <Alert className="bg-amber-50 border-amber-200">
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <div className="flex items-center justify-between">
                      <span>Auto-recovery: Attempt {this.state.retryCount} of {maxRetries}</span>
                      <Badge variant="outline" className="text-xs">
                        {canRetry ? 'Retrying...' : 'Max attempts reached'}
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
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                    {this.state.retryCount > 0 && ` (${this.state.retryCount}/${maxRetries})`}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
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
                  onClick={() => {
                    const subject = `Error Report - ${this.state.errorId}`;
                    const body = `Error ID: ${this.state.errorId}\nError Type: ${errorType}\nTime: ${this.formatErrorTime()}\n\nDescription:\n[Please describe what you were doing when this error occurred]`;
                    window.open(`mailto:support@newme.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                  }}
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

    return this.props.children;
  }
}