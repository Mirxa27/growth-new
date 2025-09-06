/**
 * Assessment Error Boundary
 * Handles assessment-specific errors with progress preservation and recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FileText, AlertCircle, RefreshCw, Save, Home, ArrowLeft, Clock } from 'lucide-react';
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

interface AssessmentErrorBoundaryProps {
  children: ReactNode;
  assessmentId?: string;
  onAssessmentError?: (error: Error, assessmentId?: string) => void;
  onSaveProgress?: () => Promise<void>;
  onRetryAssessment?: () => void;
  allowRestart?: boolean;
  preserveProgress?: boolean;
}

interface AssessmentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  isRetrying: boolean;
  isSaving: boolean;
  lastSavedTime?: Date;
  errorType: 'question' | 'submission' | 'loading' | 'general';
}

export class AssessmentErrorBoundary extends Component<AssessmentErrorBoundaryProps, AssessmentErrorBoundaryState> {
  constructor(props: AssessmentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
      isSaving: false,
      errorType: 'general'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AssessmentErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ASSESS_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Determine error type
    const errorType = this.determineErrorType(error);
    this.setState({ errorType });

    // Call the onAssessmentError callback if provided
    this.props.onAssessmentError?.(error, this.props.assessmentId);

    // Report to global error handler
    const context: ErrorContext = {
      component: 'Assessment',
      action: 'assessmentError',
      metadata: {
        errorId: this.state.errorId,
        assessmentId: this.props.assessmentId,
        errorType,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
        assessmentError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.BUSINESS_LOGIC,
      context,
      {
        showToast: false, // Don't show toast since we're showing UI
        logError: true,
        reportError: true
      }
    );

    logger.warn('Assessment error caught by boundary', {
      component: 'AssessmentErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        assessmentId: this.props.assessmentId,
        errorType,
        retryCount: this.state.retryCount
      }
    });
  }

  private determineErrorType(error: Error): 'question' | 'submission' | 'loading' | 'general' {
    const message = error.message.toLowerCase();

    if (message.includes('question') || message.includes('answer') || message.includes('option')) {
      return 'question';
    }

    if (message.includes('submit') || message.includes('submission') || message.includes('result')) {
      return 'submission';
    }

    if (message.includes('load') || message.includes('fetch') || message.includes('init')) {
      return 'loading';
    }

    return 'general';
  }

  retry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Try to save progress first if enabled
      if (this.props.preserveProgress && this.props.onSaveProgress) {
        await this.saveProgress();
      }

      // Simulate retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastSavedTime: new Date()
      }));

      logger.info('Assessment error boundary retry attempted', {
        component: 'AssessmentErrorBoundary',
        action: 'retry',
        metadata: {
          retryCount: this.state.retryCount + 1,
          assessmentId: this.props.assessmentId
        }
      });
    } catch (retryError) {
      this.setState({ isRetrying: false });

      logger.error('Assessment retry failed', {
        component: 'AssessmentErrorBoundary',
        action: 'retry',
        error: retryError,
        metadata: {
          retryCount: this.state.retryCount + 1,
          assessmentId: this.props.assessmentId
        }
      });
    }
  };

  private saveProgress = async () => {
    if (!this.props.onSaveProgress) return;

    this.setState({ isSaving: true });

    try {
      await this.props.onSaveProgress();
      this.setState({ lastSavedTime: new Date() });

      logger.info('Assessment progress saved during error recovery', {
        component: 'AssessmentErrorBoundary',
        action: 'saveProgress',
        metadata: {
          assessmentId: this.props.assessmentId
        }
      });
    } catch (saveError) {
      logger.error('Failed to save assessment progress', {
        component: 'AssessmentErrorBoundary',
        action: 'saveProgress',
        error: saveError,
        metadata: {
          assessmentId: this.props.assessmentId
        }
      });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/assessment';
    }
  };

  handleRestartAssessment = () => {
    if (this.props.onRetryAssessment) {
      this.props.onRetryAssessment();
    } else {
      // Clear assessment-related data and restart
      localStorage.removeItem(`assessment_${this.props.assessmentId}_progress`);
      window.location.reload();
    }
  };

  private getErrorMessage = (): string => {
    switch (this.state.errorType) {
      case 'question':
        return 'There was an error loading or processing the current question.';
      case 'submission':
        return 'There was an error submitting your assessment answers.';
      case 'loading':
        return 'There was an error loading the assessment.';
      default:
        return 'An unexpected error occurred during your assessment.';
    }
  };

  private getRecoveryMessage = (): string => {
    if (this.props.preserveProgress) {
      return 'Your progress has been saved. You can retry or restart the assessment.';
    }
    return 'You can retry the current action or restart the assessment.';
  };

  private getFormattedTime = (date?: Date): string => {
    if (!date) return '';

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();
      const recoveryMessage = this.getRecoveryMessage();

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <Card className="w-full max-w-2xl glass shadow-xl border-blue-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-blue-800">Assessment Error</CardTitle>
              <CardDescription className="text-blue-700">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {this.state.errorId && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Error Reference</div>
                    <code className="text-xs font-mono text-gray-800">
                      {this.state.errorId}
                    </code>
                  </div>
                )}

                {this.props.assessmentId && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Assessment ID</div>
                    <code className="text-xs font-mono text-gray-800">
                      {this.props.assessmentId}
                    </code>
                  </div>
                )}
              </div>

              {/* Status Information */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Error Type</span>
                  <Badge variant="outline" className="capitalize">
                    {this.state.errorType}
                  </Badge>
                </div>

                {this.state.retryCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Retry Attempts</span>
                    <Badge variant="outline">
                      {this.state.retryCount}
                    </Badge>
                  </div>
                )}

                {this.state.lastSavedTime && this.props.preserveProgress && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Save className="w-4 h-4" />
                    <span>Progress saved at {this.getFormattedTime(this.state.lastSavedTime)}</span>
                  </div>
                )}
              </div>

              {/* Recovery Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {recoveryMessage}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={this.retry}
                    disabled={this.state.isRetrying}
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Retry'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={this.handleGoBack}
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </div>

                {this.props.allowRestart && (
                  <Button
                    variant="destructive"
                    onClick={this.handleRestartAssessment}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Restart Assessment
                  </Button>
                )}

                {this.props.preserveProgress && this.props.onSaveProgress && (
                  <Button
                    variant="ghost"
                    onClick={this.saveProgress}
                    disabled={this.state.isSaving}
                    className="w-full"
                    size="sm"
                  >
                    <Save className={`w-4 h-4 mr-2 ${this.state.isSaving ? 'animate-spin' : ''}`} />
                    {this.state.isSaving ? 'Saving...' : 'Save Progress'}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => window.location.href = '/assessment'}
                  className="w-full"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Assessment Hub
                </Button>
              </div>

              {/* Debug Information */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
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

// Hook for handling assessment errors in functional components
export const useAssessmentErrorHandler = (assessmentId?: string) => {
  const handleAssessmentError = React.useCallback((
    error: Error,
    context: string,
    errorType: 'question' | 'submission' | 'loading' | 'general' = 'general'
  ) => {
    const errorContext: ErrorContext = {
      component: 'Assessment',
      action: context,
      metadata: {
        hookAssessmentError: true,
        assessmentId,
        errorType
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.BUSINESS_LOGIC,
      errorContext,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, [assessmentId]);

  const saveProgress = React.useCallback(async (progressData: any) => {
    try {
      // Save progress to localStorage
      if (assessmentId) {
        localStorage.setItem(`assessment_${assessmentId}_progress`, JSON.stringify({
          ...progressData,
          savedAt: new Date().toISOString()
        }));
      }

      logger.info('Assessment progress saved', {
        component: 'useAssessmentErrorHandler',
        action: 'saveProgress',
        metadata: { assessmentId }
      });
    } catch (error) {
      logger.error('Failed to save assessment progress', {
        component: 'useAssessmentErrorHandler',
        action: 'saveProgress',
        error,
        metadata: { assessmentId }
      });

      handleAssessmentError(error as Error, 'saveProgress');
    }
  }, [assessmentId, handleAssessmentError]);

  return { handleAssessmentError, saveProgress };
};

export default AssessmentErrorBoundary;