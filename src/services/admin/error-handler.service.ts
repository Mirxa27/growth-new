import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  API = 'API',
  UNKNOWN = 'UNKNOWN',
}

export interface AdminError {
  type: ErrorType;
  message: string;
  details?: any;
  code?: string;
  field?: string;
  timestamp: Date;
  context?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
  fallbackMessage?: string;
  retryable?: boolean;
}

// Error handler service
export class AdminErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static lastErrors = new Map<string, Date>();

  /**
   * Handle and process errors with appropriate user feedback
   */
  static handle(
    error: any,
    options: ErrorHandlerOptions = {}
  ): AdminError {
    const {
      showToast = true,
      logError = true,
      context = 'AdminPanel',
      fallbackMessage = 'An unexpected error occurred',
      retryable = false,
    } = options;

    const adminError = this.parseError(error, context);

    if (logError) {
      this.logError(adminError);
    }

    if (showToast) {
      this.showUserFeedback(adminError, retryable);
    }

    this.trackError(adminError);

    return adminError;
  }

  /**
   * Parse different error types into AdminError format
   */
  private static parseError(error: any, context: string): AdminError {
    const timestamp = new Date();

    // Supabase errors
    if (error?.code && error?.message) {
      return {
        type: this.getSupabaseErrorType(error.code),
        message: this.getSupabaseErrorMessage(error),
        details: error.details,
        code: error.code,
        timestamp,
        context,
      };
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection failed. Please check your internet connection.',
        details: error.message,
        timestamp,
        context,
      };
    }

    // Validation errors (Zod)
    if (error?.name === 'ZodError') {
      return {
        type: ErrorType.VALIDATION,
        message: 'Please check the form inputs and try again.',
        details: error.errors,
        timestamp,
        context,
      };
    }

    // API errors
    if (error?.status && error?.statusText) {
      return {
        type: ErrorType.API,
        message: this.getApiErrorMessage(error.status),
        details: error.statusText,
        code: error.status.toString(),
        timestamp,
        context,
      };
    }

    // Authentication errors
    if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication failed. Please sign in again.',
        details: error.message,
        timestamp,
        context,
      };
    }

    // Permission errors
    if (error?.message?.includes('permission') || error?.message?.includes('forbidden')) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'You do not have permission to perform this action.',
        details: error.message,
        timestamp,
        context,
      };
    }

    // Generic JavaScript errors
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message || 'An unexpected error occurred',
        details: error.stack,
        timestamp,
        context,
      };
    }

    // String errors
    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
        timestamp,
        context,
      };
    }

    // Unknown error format
    return {
      type: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred',
      details: error,
      timestamp,
      context,
    };
  }

  /**
   * Get Supabase error type based on error code
   */
  private static getSupabaseErrorType(code: string): ErrorType {
    const authCodes = ['auth_user_not_found', 'auth_invalid_credentials', 'auth_session_expired'];
    const permissionCodes = ['insufficient_privilege', 'permission_denied'];
    const validationCodes = ['check_violation', 'not_null_violation', 'foreign_key_violation'];

    if (authCodes.some(authCode => code.includes(authCode))) {
      return ErrorType.AUTHENTICATION;
    }
    if (permissionCodes.some(permCode => code.includes(permCode))) {
      return ErrorType.AUTHORIZATION;
    }
    if (validationCodes.some(valCode => code.includes(valCode))) {
      return ErrorType.VALIDATION;
    }
    return ErrorType.DATABASE;
  }

  /**
   * Get user-friendly message for Supabase errors
   */
  private static getSupabaseErrorMessage(error: any): string {
    const code = error.code;
    const message = error.message;

    const errorMessages: Record<string, string> = {
      'auth_user_not_found': 'User not found. Please check your credentials.',
      'auth_invalid_credentials': 'Invalid credentials. Please try again.',
      'auth_session_expired': 'Your session has expired. Please sign in again.',
      'insufficient_privilege': 'You do not have permission to perform this action.',
      'permission_denied': 'Access denied. Please contact an administrator.',
      'check_violation': 'The data you entered does not meet the requirements.',
      'not_null_violation': 'Required field is missing.',
      'foreign_key_violation': 'Referenced item does not exist.',
      'unique_violation': 'This item already exists.',
    };

    return errorMessages[code] || message || 'A database error occurred.';
  }

  /**
   * Get user-friendly message for API errors
   */
  private static getApiErrorMessage(status: number): string {
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please sign in.',
      403: 'Access forbidden. You do not have permission.',
      404: 'The requested resource was not found.',
      409: 'Conflict. The resource already exists.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
      504: 'Request timeout. Please try again.',
    };

    return statusMessages[status] || `Request failed with status ${status}`;
  }

  /**
   * Show appropriate user feedback based on error type
   */
  private static showUserFeedback(error: AdminError, retryable: boolean): void {
    const retryMessage = retryable ? ' You can try again.' : '';
    
    switch (error.type) {
      case ErrorType.VALIDATION:
        toast.error('Validation Error', {
          description: error.message + retryMessage,
          duration: 5000,
        });
        break;

      case ErrorType.AUTHENTICATION:
        toast.error('Authentication Error', {
          description: error.message,
          duration: 5000,
          action: {
            label: 'Sign In',
            onClick: () => window.location.href = '/auth',
          },
        });
        break;

      case ErrorType.AUTHORIZATION:
        toast.error('Permission Denied', {
          description: error.message,
          duration: 5000,
        });
        break;

      case ErrorType.NETWORK:
        toast.error('Connection Error', {
          description: error.message + retryMessage,
          duration: 8000,
          action: retryable ? {
            label: 'Retry',
            onClick: () => window.location.reload(),
          } : undefined,
        });
        break;

      case ErrorType.DATABASE:
      case ErrorType.API:
        toast.error('Service Error', {
          description: error.message + retryMessage,
          duration: 6000,
        });
        break;

      default:
        toast.error('Unexpected Error', {
          description: error.message + retryMessage,
          duration: 5000,
        });
        break;
    }
  }

  /**
   * Log error with appropriate level and context
   */
  private static logError(error: AdminError): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      field: error.field,
      context: error.context,
      timestamp: error.timestamp,
      details: error.details,
    };

    switch (error.type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        logger.warn('Access control error', error.context || 'AdminErrorHandler', logData);
        break;

      case ErrorType.VALIDATION:
        logger.info('Validation error', error.context || 'AdminErrorHandler', logData);
        break;

      case ErrorType.NETWORK:
        logger.warn('Network error', error.context || 'AdminErrorHandler', logData);
        break;

      case ErrorType.DATABASE:
      case ErrorType.API:
        logger.error('Service error', error.context || 'AdminErrorHandler', logData);
        break;

      default:
        logger.error('Unexpected error', error.context || 'AdminErrorHandler', logData);
        break;
    }
  }

  /**
   * Track error frequency for monitoring
   */
  private static trackError(error: AdminError): void {
    const errorKey = `${error.type}:${error.code || 'unknown'}`;
    const count = this.errorCounts.get(errorKey) || 0;
    
    this.errorCounts.set(errorKey, count + 1);
    this.lastErrors.set(errorKey, error.timestamp);

    // Alert on high error frequency (more than 5 of the same error in 5 minutes)
    if (count > 5) {
      const lastError = this.lastErrors.get(errorKey);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastError && lastError > fiveMinutesAgo) {
        logger.error('High error frequency detected', 'AdminErrorHandler', {
          errorKey,
          count: count + 1,
          timeWindow: '5 minutes',
        });
      }
    }
  }

  /**
   * Handle async operations with error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<{ data?: T; error?: AdminError }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      const adminError = this.handle(error, options);
      return { error: adminError };
    }
  }

  /**
   * Create a retry wrapper for operations
   */
  static withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          resolve(result);
          return;
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            break;
          }
          
          // Exponential backoff
          const waitTime = delay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      const adminError = this.handle(lastError, {
        context: 'RetryWrapper',
        showToast: false,
      });
      reject(adminError);
    });
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<string, { count: number; lastOccurrence: Date }> {
    const stats: Record<string, { count: number; lastOccurrence: Date }> = {};
    
    for (const [key, count] of this.errorCounts.entries()) {
      const lastOccurrence = this.lastErrors.get(key);
      if (lastOccurrence) {
        stats[key] = { count, lastOccurrence };
      }
    }
    
    return stats;
  }

  /**
   * Clear error statistics
   */
  static clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }

  /**
   * Handle form validation errors specifically
   */
  static handleValidationErrors(
    errors: Array<{ field: string; message: string }>,
    setFieldErrors: (errors: Record<string, string>) => void
  ): void {
    const fieldErrors: Record<string, string> = {};
    
    errors.forEach(error => {
      fieldErrors[error.field] = error.message;
    });
    
    setFieldErrors(fieldErrors);
    
    toast.error('Validation Error', {
      description: 'Please check the highlighted fields and try again.',
      duration: 5000,
    });
  }
}

// Convenience functions
export const handleError = AdminErrorHandler.handle.bind(AdminErrorHandler);
export const handleAsync = AdminErrorHandler.handleAsync.bind(AdminErrorHandler);
export const withRetry = AdminErrorHandler.withRetry.bind(AdminErrorHandler);
export const handleValidationErrors = AdminErrorHandler.handleValidationErrors.bind(AdminErrorHandler);

export default AdminErrorHandler;