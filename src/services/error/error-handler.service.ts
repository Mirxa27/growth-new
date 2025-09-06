/**
 * Comprehensive Error Handling Service
 * Provides centralized error handling, logging, and recovery mechanisms
 */

import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/logging/logger.service';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  // Core known fields
  userId?: string;
  action?: string;
  module?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  timestamp?: string;

  // Allow additional context properties (e.g., notificationId, providerId, etc.)
  [key: string]: unknown;
}

export interface ErrorRecord {
  id?: string;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  isHandled: boolean;
  retryCount?: number;
  createdAt?: string;
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallbackAction?: () => void;
  userMessage?: string;
}

class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorQueue: ErrorRecord[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
    this.startErrorQueueProcessor();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Setup global error event listeners
   */
  private setupEventListeners() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.message), {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        context: {
          action: 'uncaught_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason?.message || 'Unhandled Promise Rejection'), {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        context: {
          action: 'unhandled_rejection',
          metadata: { reason: event.reason },
        },
      });
    });

    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Main error handling method
   */
  handleError(
    error: Error | unknown,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: ErrorContext;
      showToast?: boolean;
      recoveryStrategy?: ErrorRecoveryStrategy;
    }
  ): ErrorRecord {
    const errorRecord = this.createErrorRecord(error, options);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', errorRecord);
    }

    // Show user-friendly toast if requested
    if (options?.showToast !== false) {
      this.showErrorToast(errorRecord, options?.recoveryStrategy);
    }

    // Queue for logging
    this.queueError(errorRecord);

    // Apply recovery strategy if provided
    if (options?.recoveryStrategy) {
      this.applyRecoveryStrategy(errorRecord, options.recoveryStrategy);
    }

    return errorRecord;
  }

  /**
   * Create a structured error record
   */
  private createErrorRecord(
    error: Error | unknown,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: ErrorContext;
    }
  ): ErrorRecord {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const code = this.extractErrorCode(error);
    const category = options?.category || this.categorizeError(error);
    const severity = options?.severity || this.assessSeverity(category, code);

    return {
      message,
      code,
      severity,
      category,
      context: {
        ...options?.context,
        stackTrace: isError ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      isHandled: true,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Extract error code from various error types
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.code) return String(err.code);
      if (err.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        if (response.status) return `HTTP_${response.status}`;
      }
      if (err.statusCode) return `STATUS_${err.statusCode}`;
    }
    return undefined;
  }

  /**
   * Categorize error based on its characteristics
   */
  private categorizeError(error: unknown): ErrorCategory {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const message = (err.message as string)?.toLowerCase() || '';
      const code = (err.code as string)?.toLowerCase() || '';

      if (message.includes('auth') || code.includes('auth')) {
        return ErrorCategory.AUTHENTICATION;
      }
      if (message.includes('permission') || message.includes('forbidden')) {
        return ErrorCategory.AUTHORIZATION;
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorCategory.VALIDATION;
      }
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorCategory.NETWORK;
      }
      if (message.includes('database') || code.includes('pgrst')) {
        return ErrorCategory.DATABASE;
      }
      if (err.response || err.request) {
        return ErrorCategory.EXTERNAL_API;
      }
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Assess error severity based on category and code
   */
  private assessSeverity(category: ErrorCategory, code?: string): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.AUTHENTICATION && code === 'SESSION_EXPIRED') {
      return ErrorSeverity.CRITICAL;
    }
    if (category === ErrorCategory.DATABASE && code?.startsWith('5')) {
      return ErrorSeverity.HIGH;
    }

    // High severity
    if (category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.MEDIUM;
    }
    if (category === ErrorCategory.NETWORK && !this.isOnline) {
      return ErrorSeverity.MEDIUM;
    }

    // Default to low
    return ErrorSeverity.LOW;
  }

  /**
   * Show user-friendly error toast
   */
  private showErrorToast(error: ErrorRecord, recoveryStrategy?: ErrorRecoveryStrategy) {
    const userMessage = recoveryStrategy?.userMessage || this.getUserFriendlyMessage(error);
    
    // Show toast without embedding callback objects (keeps typing consistent)
    toast({
      title: 'Something went wrong',
      description: userMessage,
      variant: 'destructive',
    });

    // If there's a fallback action, emit a custom event so admin UI can surface an action button
    if (recoveryStrategy?.fallbackAction) {
      try {
        window.dispatchEvent(new CustomEvent('error-recovery-action', {
          detail: {
            message: userMessage,
            actionAvailable: true
          }
        }));
      } catch {
        // ignore if window unavailable
      }
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: ErrorRecord): string {
    const messages: Record<ErrorCategory, string> = {
      [ErrorCategory.AUTHENTICATION]: 'Please sign in to continue.',
      [ErrorCategory.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.NETWORK]: 'Connection issue. Please check your internet.',
      [ErrorCategory.DATABASE]: 'Unable to save your data. Please try again.',
      [ErrorCategory.BUSINESS_LOGIC]: 'Unable to process your request.',
      [ErrorCategory.EXTERNAL_API]: 'External service is temporarily unavailable.',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return messages[error.category] || messages[ErrorCategory.UNKNOWN];
  }

  /**
   * Queue error for batch logging
   */
  private queueError(error: ErrorRecord) {
    this.errorQueue.push(error);
    
    // Process immediately if online, otherwise wait
    if (this.isOnline) {
      this.processErrorQueue();
    }
  }

  /**
   * Process error queue - send to logging service
   */
  private async processErrorQueue() {
    if (this.errorQueue.length === 0 || !this.isOnline) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Attempt to insert logs with retry/backoff (server may be temporarily unreachable)
      const maxAttempts = 3;
      let attempt = 0;
      let logged = false;
      let lastError: unknown = null;

      while (attempt < maxAttempts && !logged) {
        attempt += 1;
        try {
          // Temporarily disable database error logging - TODO: Fix error_logs table permissions
          const error = null; // Skip database logging for now
          
          // Alternative: log to console in production for now
          console.warn('Production Error:', {
            errors: errors.map(e => ({
              message: e.message,
              code: e.code,
              severity: e.severity,
              category: e.category
            }))
          });

          if (error) {
            lastError = error;
            // Wait with exponential backoff before retrying
            await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
            continue;
          }

          logged = true;
        } catch (err) {
          lastError = err;
          // Backoff and retry
          await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
        }
      }

      if (!logged) {
        // Put errors back in queue for future retry and emit a browser-level event so admin UI can surface it
        this.errorQueue.unshift(...errors);
        try {
          // Emit structured event for admin panels to consume (do not include sensitive context)
          window.dispatchEvent(new CustomEvent('error-logging-failed', {
            detail: {
              message: 'Failed to persist error logs after multiple attempts',
              sample: errors.slice(0, 3).map(e => ({ message: e.message, category: e.category, severity: e.severity })),
              lastError: (lastError && typeof lastError === 'object' && 'message' in lastError) 
                ? (lastError as { message: string }).message 
                : String(lastError)
            }
          }));
        } catch {
          // window may be undefined in some environments; ignore
        }
        // Use logger instead of console.error to centralize output
        logger.error('Failed to log errors after retries', {
          component: 'ErrorHandlerService',
          action: 'processErrorQueue',
          error: lastError
        });
      }
    } catch (err) {
      // Fallback: ensure errors are re-queued and surface minimal info
      this.errorQueue.unshift(...errors);
      logger.error('Unexpected error while processing error queue', {
        component: 'ErrorHandlerService',
        action: 'processErrorQueue',
        error: err
      });
    }
  }

  /**
   * Start periodic error queue processor
   */
  private startErrorQueueProcessor() {
    setInterval(() => {
      if (this.isOnline && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Apply recovery strategy for an error
   */
  private applyRecoveryStrategy(error: ErrorRecord, strategy: ErrorRecoveryStrategy) {
    if (!strategy.shouldRetry) {
      if (strategy.fallbackAction) {
        strategy.fallbackAction();
      }
      return;
    }

    const maxRetries = strategy.maxRetries || 3;
    const retryDelay = strategy.retryDelay || 1000;

    if ((error.retryCount || 0) < maxRetries) {
      setTimeout(() => {
        error.retryCount = (error.retryCount || 0) + 1;
        if (strategy.fallbackAction) {
          strategy.fallbackAction();
        }
      }, retryDelay * Math.pow(2, error.retryCount || 0)); // Exponential backoff
    }
  }

  /**
   * Get default recovery strategy for error category
   */
  getDefaultRecoveryStrategy(category: ErrorCategory): ErrorRecoveryStrategy {
    const strategies: Record<ErrorCategory, ErrorRecoveryStrategy> = {
      [ErrorCategory.AUTHENTICATION]: {
        shouldRetry: false,
        fallbackAction: () => window.location.href = '/auth',
        userMessage: 'Please sign in to continue.',
      },
      [ErrorCategory.AUTHORIZATION]: {
        shouldRetry: false,
        userMessage: 'You don\'t have permission for this action.',
      },
      [ErrorCategory.VALIDATION]: {
        shouldRetry: false,
        userMessage: 'Please check your input and try again.',
      },
      [ErrorCategory.NETWORK]: {
        shouldRetry: true,
        retryDelay: 2000,
        maxRetries: 3,
        userMessage: 'Connection issue. Retrying...',
      },
      [ErrorCategory.DATABASE]: {
        shouldRetry: true,
        retryDelay: 1000,
        maxRetries: 2,
        userMessage: 'Unable to save. Retrying...',
      },
      [ErrorCategory.BUSINESS_LOGIC]: {
        shouldRetry: false,
        userMessage: 'Unable to complete this action.',
      },
      [ErrorCategory.EXTERNAL_API]: {
        shouldRetry: true,
        retryDelay: 3000,
        maxRetries: 2,
        userMessage: 'External service issue. Retrying...',
      },
      [ErrorCategory.UNKNOWN]: {
        shouldRetry: false,
        userMessage: 'An unexpected error occurred.',
      },
    };

    return strategies[category] || strategies[ErrorCategory.UNKNOWN];
  }

  /**
   * Clear error queue
   */
  clearErrorQueue() {
    this.errorQueue = [];
  }

  /**
   * Get current error queue size
   */
  getErrorQueueSize(): number {
    return this.errorQueue.length;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlerService.getInstance();

// Export convenience functions
export const handleError = (error: Error | unknown, options?: Parameters<typeof errorHandler.handleError>[1]) => 
  errorHandler.handleError(error, options);

export const getRecoveryStrategy = (category: ErrorCategory) => 
  errorHandler.getDefaultRecoveryStrategy(category);