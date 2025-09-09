/**
 * Centralized Error Handling Service
 * Provides consistent error handling across the application
 */

import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;
  recoverable?: boolean;
  retryable?: boolean;
}

class ErrorHandlingService {
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private maxQueueSize = 100;

  /**
   * Handle an error with proper logging and user notification
   */
  handleError(error: Error | unknown, context: ErrorContext = {}, details?: Partial<ErrorDetails>) {
    const errorObj = this.normalizeError(error);
    const timestamp = Date.now();
    
    // Add to error queue for monitoring
    this.addToQueue(errorObj, context, timestamp);
    
    // Log error based on severity
    this.logError(errorObj, context, details);
    
    // Show user notification if appropriate
    this.notifyUser(errorObj, context, details);
    
    // Report to monitoring service if in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToMonitoring(errorObj, context, details);
    }
  }

  /**
   * Handle navigation errors specifically
   */
  handleNavigationError(error: Error | unknown, targetPath?: string) {
    this.handleError(error, {
      component: 'Navigation',
      action: 'route_change',
      metadata: { targetPath }
    }, {
      message: 'Navigation failed',
      severity: 'medium',
      userMessage: 'Unable to navigate to the requested page. Please try again.',
      recoverable: true,
      retryable: true
    });
  }

  /**
   * Handle API errors with specific handling for different status codes
   */
  handleApiError(error: Error | unknown, endpoint?: string, method?: string) {
    const context: ErrorContext = {
      component: 'API',
      action: 'api_request',
      metadata: { endpoint, method }
    };

    let details: Partial<ErrorDetails> = {
      severity: 'medium',
      recoverable: true
    };

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        details = {
          ...details,
          userMessage: 'Please log in to continue.',
          code: 'UNAUTHORIZED'
        };
      } else if (error.message.includes('403')) {
        details = {
          ...details,
          userMessage: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          recoverable: false
        };
      } else if (error.message.includes('404')) {
        details = {
          ...details,
          userMessage: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          recoverable: false
        };
      } else if (error.message.includes('500')) {
        details = {
          ...details,
          severity: 'high',
          userMessage: 'A server error occurred. Please try again later.',
          code: 'SERVER_ERROR',
          retryable: true
        };
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        details = {
          ...details,
          userMessage: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR',
          retryable: true
        };
      }
    }

    this.handleError(error, context, details);
  }

  /**
   * Handle voice/audio related errors
   */
  handleVoiceError(error: Error | unknown, action?: string) {
    this.handleError(error, {
      component: 'Voice',
      action: action || 'voice_operation'
    }, {
      message: 'Voice operation failed',
      severity: 'medium',
      userMessage: 'Voice feature is currently unavailable. Please try again or use text input.',
      recoverable: true,
      retryable: true
    });
  }

  /**
   * Handle assessment related errors
   */
  handleAssessmentError(error: Error | unknown, assessmentId?: string, action?: string) {
    this.handleError(error, {
      component: 'Assessment',
      action: action || 'assessment_operation',
      metadata: { assessmentId }
    }, {
      message: 'Assessment operation failed',
      severity: 'medium',
      userMessage: 'Unable to complete assessment operation. Please try again.',
      recoverable: true,
      retryable: true
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error | unknown, action?: string) {
    this.handleError(error, {
      component: 'Auth',
      action: action || 'auth_operation'
    }, {
      message: 'Authentication failed',
      severity: 'high',
      userMessage: 'Authentication failed. Please log in again.',
      recoverable: true,
      code: 'AUTH_ERROR'
    });
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats() {
    const now = Date.now();
    const last24h = this.errorQueue.filter(entry => (now - entry.timestamp) < 24 * 60 * 60 * 1000);
    const lastHour = this.errorQueue.filter(entry => (now - entry.timestamp) < 60 * 60 * 1000);
    
    return {
      total: this.errorQueue.length,
      last24h: last24h.length,
      lastHour: lastHour.length,
      commonErrors: this.getCommonErrors(last24h)
    };
  }

  private normalizeError(error: Error | unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    return new Error('Unknown error occurred');
  }

  private addToQueue(error: Error, context: ErrorContext, timestamp: number) {
    this.errorQueue.push({ error, context, timestamp });
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private logError(error: Error, context: ErrorContext, details?: Partial<ErrorDetails>) {
    const severity = details?.severity || 'medium';
    const logData = {
      message: error.message,
      stack: error.stack,
      context,
      details,
      timestamp: new Date().toISOString()
    };

    // Use appropriate console method based on severity
    switch (severity) {
      case 'low':
        console.info('Error (low):', logData);
        break;
      case 'medium':
        console.warn('Error (medium):', logData);
        break;
      case 'high':
      case 'critical':
        console.error(`Error (${severity}):`, logData);
        break;
    }
  }

  private notifyUser(error: Error, context: ErrorContext, details?: Partial<ErrorDetails>) {
    // Don't show notifications for low severity errors
    if (details?.severity === 'low') {
      return;
    }

    const userMessage = details?.userMessage || 'An unexpected error occurred. Please try again.';
    const variant = (details?.severity === 'high' || details?.severity === 'critical') ? 'destructive' : 'default';

    toast({
      title: 'Error',
      description: userMessage,
      variant: variant as 'default' | 'destructive',
      duration: details?.severity === 'critical' ? 10000 : 5000
    });
  }

  private async reportToMonitoring(error: Error, context: ErrorContext, details?: Partial<ErrorDetails>) {
    try {
      // In a real application, you would send this to your monitoring service
      // For now, we'll just prepare the data structure
      const reportData = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: context.userId
      };

      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(reportData) });
      console.info('Error reported to monitoring:', reportData);
    } catch (reportError) {
      console.error('Failed to report error to monitoring:', reportError);
    }
  }

  private getCommonErrors(errors: Array<{ error: Error; context: ErrorContext; timestamp: number }>) {
    const errorCounts = new Map<string, number>();
    
    errors.forEach(({ error }) => {
      const key = error.message;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });
    
    return Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService();

// Export convenience functions
export const handleError = errorHandler.handleError.bind(errorHandler);
export const handleNavigationError = errorHandler.handleNavigationError.bind(errorHandler);
export const handleApiError = errorHandler.handleApiError.bind(errorHandler);
export const handleVoiceError = errorHandler.handleVoiceError.bind(errorHandler);
export const handleAssessmentError = errorHandler.handleAssessmentError.bind(errorHandler);
export const handleAuthError = errorHandler.handleAuthError.bind(errorHandler);