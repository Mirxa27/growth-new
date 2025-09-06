/**
 * Route-level Error Boundary
 * Handles errors for specific routes and provides route-specific recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AppErrorBoundary } from './AppErrorBoundary';
import {
  globalErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext
} from '@/services/error/global-error-handler.service';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName: string;
  fallbackPath?: string;
  customActions?: ReactNode;
  routeSpecificRecovery?: () => Promise<void>;
  preserveState?: boolean;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isRecovering: boolean;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ROUTE_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report to global error handler with route-specific context
    const context: ErrorContext = {
      component: this.props.routeName,
      action: 'routeError',
      metadata: {
        errorId: this.state.errorId,
        routeName: this.props.routeName,
        componentStack: errorInfo.componentStack,
        routeError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.UI,
      context,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }

  handleRetry = async () => {
    if (this.props.routeSpecificRecovery) {
      this.setState({ isRecovering: true });
      try {
        await this.props.routeSpecificRecovery();
        this.setState({ hasError: false, error: undefined, errorInfo: undefined, isRecovering: false });
      } catch (recoveryError) {
        // Fall back to simple state reset if recovery fails
        this.setState({ hasError: false, error: undefined, errorInfo: undefined, isRecovering: false });
      }
    } else {
      // Simple retry
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = this.props.fallbackPath || '/';
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const routeName = this.props.routeName;

      return (
        <div className="min-h-[600px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg glass shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-800">Route Error</CardTitle>
              <CardDescription>
                There was an error loading the {routeName} page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The {routeName} page encountered an unexpected error. This has been reported to our team.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {this.state.errorId && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-600">Error ID</div>
                    <code className="text-xs">{this.state.errorId}</code>
                  </div>
                )}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-600">Route</div>
                  <div className="text-xs">{routeName}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                    disabled={this.state.isRecovering}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
                    {this.state.isRecovering ? 'Recovering...' : 'Retry'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoBack}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </div>

                {/* Custom actions */}
                {this.props.customActions && (
                  <div className="pt-2 border-t">
                    {this.props.customActions}
                  </div>
                )}
              </div>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-600">Technical Details</summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                    {this.state.error.message}
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

// Specialized route error boundaries for common routes
export const DashboardErrorBoundary: React.FC<Omit<RouteErrorBoundaryProps, 'routeName'>> = (props) => (
  <RouteErrorBoundary {...props} routeName="Dashboard" fallbackPath="/dashboard" />
);

export const AssessmentErrorBoundary: React.FC<Omit<RouteErrorBoundaryProps, 'routeName'>> = (props) => (
  <RouteErrorBoundary {...props} routeName="Assessment" fallbackPath="/assessment" />
);

export const AuthErrorBoundary: React.FC<Omit<RouteErrorBoundaryProps, 'routeName'>> = (props) => (
  <RouteErrorBoundary {...props} routeName="Authentication" fallbackPath="/auth" />
);

export const ProfileErrorBoundary: React.FC<Omit<RouteErrorBoundaryProps, 'routeName'>> = (props) => (
  <RouteErrorBoundary {...props} routeName="Profile" fallbackPath="/profile" />
);

export const AdminErrorBoundary: React.FC<Omit<RouteErrorBoundaryProps, 'routeName'>> = (props) => (
  <RouteErrorBoundary {...props} routeName="Admin" fallbackPath="/admin" />
);

export default RouteErrorBoundary;