import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { AlertCircle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // In a real app, you'd send this to your error reporting service
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // For now, just log it
    console.log('Error report:', errorReport);
    
    // You could also copy to clipboard or open email client
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      const isAuthError = error?.message?.includes('auth') || error?.message?.includes('unauthorized');

      return (
        <div className="min-h-screen-safe flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-muted/5 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {isNetworkError ? 'Connection Problem' : 
                 isAuthError ? 'Authentication Error' : 
                 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isNetworkError ? 
                  'Unable to connect to our servers. Please check your internet connection.' :
                 isAuthError ?
                  'There was a problem with your authentication. Please sign in again.' :
                  'An unexpected error occurred. We\'re sorry for the inconvenience.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Error ID: <code className="text-xs">{errorId}</code>
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={this.handleGoBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={this.handleReportError}
                    className="text-xs"
                  >
                    Copy Error Details
                  </Button>
                )}
              </div>

              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.props.showDetails && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    <p className="font-medium mb-2">Message:</p>
                    <p className="mb-4 text-destructive">{error.message}</p>
                    
                    <p className="font-medium mb-2">Stack:</p>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    
                    {errorInfo && (
                      <>
                        <p className="font-medium mb-2 mt-4">Component Stack:</p>
                        <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </>
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

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: any) => {
    // In development, log the error
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', error, errorInfo);
    }

    // In production, you might want to send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }, []);
};

// Higher-order component for class components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};