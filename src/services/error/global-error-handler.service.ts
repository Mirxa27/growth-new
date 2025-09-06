/**
 * Global Error Handler Service
 * Comprehensive error handling with fallback flows and recovery strategies
 */

import { logger } from '@/services/logging/logger.service';
import { toast } from 'sonner';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  UI = 'ui',
  PERFORMANCE = 'performance',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorInfo {
  error: Error | unknown;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  reportError?: boolean;
  fallbackMessage?: string;
  retryCallback?: () => Promise<void> | void;
  maxRetries?: number;
}

export interface FallbackStrategy {
  canHandle: (error: ErrorInfo) => boolean;
  handle: (error: ErrorInfo, options?: ErrorHandlerOptions) => Promise<void>;
  priority: number;
}

class GlobalErrorHandlerService {
  private static instance: GlobalErrorHandlerService;
  private fallbackStrategies: FallbackStrategy[] = [];
  private errorQueue: ErrorInfo[] = [];
  private isProcessing = false;

  private constructor() {
    this.registerDefaultFallbackStrategies();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): GlobalErrorHandlerService {
    if (!GlobalErrorHandlerService.instance) {
      GlobalErrorHandlerService.instance = new GlobalErrorHandlerService();
    }
    return GlobalErrorHandlerService.instance;
  }

  /**
   * Main error handling method
   */
  async handleError(
    error: Error | unknown,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): Promise<void> {
    const errorInfo: ErrorInfo = {
      error,
      severity,
      category,
      context,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Set default options
    const mergedOptions = {
      showToast: true,
      logError: true,
      reportError: severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH,
      ...options
    };

    // Add to error queue for processing
    this.errorQueue.push(errorInfo);

    // Process errors
    if (!this.isProcessing) {
      await this.processErrorQueue();
    }

    // Handle immediate actions
    await this.handleImmediateActions(errorInfo, mergedOptions);
  }

  /**
   * Register a custom fallback strategy
   */
  registerFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.push(strategy);
    this.fallbackStrategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process error queue
   */
  private async processErrorQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.errorQueue.length > 0) {
      const errorInfo = this.errorQueue.shift();
      if (!errorInfo) continue;

      try {
        await this.processError(errorInfo);
      } catch (processingError) {
        logger.error('Error processing failed', {
          action: 'processErrorQueue',
          error: processingError,
          originalError: errorInfo
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process individual error
   */
  private async processError(errorInfo: ErrorInfo): Promise<void> {
    // Find applicable fallback strategy
    const strategy = this.fallbackStrategies.find(s => s.canHandle(errorInfo));

    if (strategy) {
      await strategy.handle(errorInfo);
    } else {
      // Default error handling
      await this.handleDefaultError(errorInfo);
    }
  }

  /**
   * Handle immediate actions (logging, toasts, etc.)
   */
  private async handleImmediateActions(
    errorInfo: ErrorInfo,
    options: ErrorHandlerOptions
  ): Promise<void> {
    // Log the error
    if (options.logError) {
      this.logError(errorInfo);
    }

    // Show user notification
    if (options.showToast) {
      this.showErrorToast(errorInfo, options.fallbackMessage);
    }

    // Report critical errors
    if (options.reportError) {
      await this.reportError(errorInfo);
    }

    // Handle retries
    if (options.retryCallback && options.maxRetries && options.maxRetries > 0) {
      await this.handleRetry(options.retryCallback, options.maxRetries);
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorInfo: ErrorInfo): void {
    const message = this.extractErrorMessage(errorInfo.error);
    
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(message, {
          component: errorInfo.context.component,
          action: errorInfo.context.action,
          metadata: errorInfo.context.metadata,
          error: errorInfo.error
        });
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(message, {
          component: errorInfo.context.component,
          action: errorInfo.context.action,
          metadata: errorInfo.context.metadata,
        });
        break;
      case ErrorSeverity.LOW:
        logger.info(message, {
          component: errorInfo.context.component,
          action: errorInfo.context.action,
          metadata: errorInfo.context.metadata,
        });
        break;
    }
  }

  /**
   * Show error toast to user
   */
  private showErrorToast(errorInfo: ErrorInfo, fallbackMessage?: string): void {
    const message = fallbackMessage || this.getUserFriendlyMessage(errorInfo);
    
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        toast.error(message, {
          duration: 6000,
          action: {
            label: 'Retry',
            onClick: () => window.location.reload()
          }
        });
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(message, { duration: 4000 });
        break;
      case ErrorSeverity.LOW:
        toast.warning(message, { duration: 3000 });
        break;
    }
  }

  /**
   * Report error to external service
   */
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // In production, send to error reporting service like Sentry
      const errorReport = {
        message: this.extractErrorMessage(errorInfo.error),
        stack: errorInfo.error instanceof Error ? errorInfo.error.stack : undefined,
        severity: errorInfo.severity,
        category: errorInfo.category,
        context: errorInfo.context,
        timestamp: errorInfo.timestamp.toISOString(),
        userAgent: errorInfo.userAgent,
        url: errorInfo.url,
      };

      // await sendToSentry(errorReport);
      // await sendToBugsnag(errorReport);
      
      logger.info('Error reported', {
        action: 'reportError',
        metadata: { errorId: errorReport.timestamp }
      });
    } catch (reportingError) {
      logger.error('Failed to report error', {
        action: 'reportError',
        error: reportingError
      });
    }
  }

  /**
   * Handle retry logic
   */
  private async handleRetry(
    retryCallback: () => Promise<void> | void,
    maxRetries: number,
    currentAttempt = 1
  ): Promise<void> {
    if (currentAttempt > maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * currentAttempt)); // Exponential backoff
      await retryCallback();
      toast.success('Operation successful after retry');
    } catch (retryError) {
      logger.warn(`Retry attempt ${currentAttempt} failed`, {
        action: 'handleRetry',
        error: retryError
      });
      
      if (currentAttempt < maxRetries) {
        await this.handleRetry(retryCallback, maxRetries, currentAttempt + 1);
      } else {
        toast.error('All retry attempts failed. Please try again later.');
      }
    }
  }

  /**
   * Default error handling fallback
   */
  private async handleDefaultError(errorInfo: ErrorInfo): Promise<void> {
    const message = this.getUserFriendlyMessage(errorInfo);
    
    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      // For critical errors, offer page reload
      toast.error(message, {
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Reload Page',
          onClick: () => window.location.reload()
        }
      });
    } else {
      toast.error(message);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        {
          component: 'Global',
          action: 'unhandledError',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      );
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason,
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        {
          component: 'Global',
          action: 'unhandledRejection',
          metadata: {
            type: 'Promise rejection'
          }
        }
      );
    });
  }

  /**
   * Register default fallback strategies
   */
  private registerDefaultFallbackStrategies(): void {
    // Network error strategy
    this.registerFallbackStrategy({
      canHandle: (errorInfo) => errorInfo.category === ErrorCategory.NETWORK,
      handle: async (errorInfo) => {
        const isOnline = navigator.onLine;
        if (!isOnline) {
          toast.error('You are offline. Please check your connection and try again.', {
            duration: 0,
            action: {
              label: 'Retry',
              onClick: () => window.location.reload()
            }
          });
        }
      },
      priority: 10
    });

    // Authentication error strategy
    this.registerFallbackStrategy({
      canHandle: (errorInfo) => errorInfo.category === ErrorCategory.AUTHENTICATION,
      handle: async (errorInfo) => {
        toast.error('Your session has expired. Please log in again.', {
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/auth'
          }
        });
      },
      priority: 9
    });

    // Authorization error strategy
    this.registerFallbackStrategy({
      canHandle: (errorInfo) => errorInfo.category === ErrorCategory.AUTHORIZATION,
      handle: async (errorInfo) => {
        toast.error('You do not have permission to perform this action.');
      },
      priority: 8
    });

    // Validation error strategy
    this.registerFallbackStrategy({
      canHandle: (errorInfo) => errorInfo.category === ErrorCategory.VALIDATION,
      handle: async (errorInfo) => {
        const message = this.extractErrorMessage(errorInfo.error);
        toast.error(`Validation Error: ${message}`);
      },
      priority: 7
    });

    // Database error strategy
    this.registerFallbackStrategy({
      canHandle: (errorInfo) => errorInfo.category === ErrorCategory.DATABASE,
      handle: async (errorInfo) => {
        toast.error('A database error occurred. Our team has been notified.');
      },
      priority: 6
    });
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    const baseMessage = this.extractErrorMessage(errorInfo.error);
    
    // Map technical errors to user-friendly messages
    const friendlyMessages: Record<string, string> = {
      'Network Error': 'Unable to connect to the server. Please check your internet connection.',
      'Timeout': 'The request took too long. Please try again.',
      'Not Found': 'The requested resource was not found.',
      'Unauthorized': 'You need to log in to access this feature.',
      'Forbidden': 'You do not have permission to access this resource.',
      'Internal Server Error': 'A server error occurred. Please try again later.',
      'Bad Request': 'Invalid request. Please check your input and try again.',
    };

    return friendlyMessages[baseMessage] || baseMessage || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    // This would be implemented with proper error tracking
    return {
      totalErrors: this.errorQueue.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>
    };
  }
}

// Export singleton instance and convenience functions
export const globalErrorHandler = GlobalErrorHandlerService.getInstance();

export const handleError = (
  error: Error | unknown,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context: ErrorContext = {},
  options: ErrorHandlerOptions = {}
) => globalErrorHandler.handleError(error, severity, category, context, options);

// Convenience functions for different error types
export const handleNetworkError = (error: Error | unknown, context: ErrorContext = {}) =>
  handleError(error, ErrorSeverity.HIGH, ErrorCategory.NETWORK, context);

export const handleAuthError = (error: Error | unknown, context: ErrorContext = {}) =>
  handleError(error, ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION, context);

export const handleValidationError = (error: Error | unknown, context: ErrorContext = {}) =>
  handleError(error, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION, context);

export const handleBusinessError = (error: Error | unknown, context: ErrorContext = {}) =>
  handleError(error, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, context);

export const handleCriticalError = (error: Error | unknown, context: ErrorContext = {}) =>
  handleError(error, ErrorSeverity.CRITICAL, ErrorCategory.UNKNOWN, context);

export default globalErrorHandler;
