import { logger } from '@/utils/logger';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: string;
  stack?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle application errors with proper logging and user feedback
   */
  public handleError(error: unknown, context?: string): AppError {
    const timestamp = new Date().toISOString();
    
    let appError: AppError;
    
    if (error instanceof Error) {
      appError = {
        code: this.getErrorCode(error),
        message: error.message,
        details: error.cause,
        statusCode: this.getStatusCode(error),
        timestamp,
        stack: error.stack
      };
    } else if (typeof error === 'string') {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: error,
        timestamp
      };
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error,
        timestamp
      };
    }

    // Log error with context
    logger.error(appError.message, context || 'ErrorHandler', {
      code: appError.code,
      details: appError.details,
      stack: appError.stack
    });

    return appError;
  }

  /**
   * Handle API errors with proper status codes
   */
  public handleApiError(error: unknown, context?: string): { error: AppError; statusCode: number } {
    const appError = this.handleError(error, context);
    return {
      error: appError,
      statusCode: appError.statusCode || 500
    };
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(errors: any[]): AppError {
    const appError: AppError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
      statusCode: 400,
      timestamp: new Date().toISOString()
    };

    logger.error('Validation failed', 'ErrorHandler', { errors });
    return appError;
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(message: string = 'Authentication required'): AppError {
    const appError: AppError = {
      code: 'AUTH_ERROR',
      message,
      statusCode: 401,
      timestamp: new Date().toISOString()
    };

    logger.error('Authentication error', 'ErrorHandler', { message });
    return appError;
  }

  /**
   * Handle authorization errors
   */
  public handleAuthorizationError(message: string = 'Insufficient permissions'): AppError {
    const appError: AppError = {
      code: 'AUTHORIZATION_ERROR',
      message,
      statusCode: 403,
      timestamp: new Date().toISOString()
    };

    logger.error('Authorization error', 'ErrorHandler', { message });
    return appError;
  }

  /**
   * Handle rate limiting errors
   */
  public handleRateLimitError(message: string = 'Rate limit exceeded'): AppError {
    const appError: AppError = {
      code: 'RATE_LIMIT_ERROR',
      message,
      statusCode: 429,
      timestamp: new Date().toISOString()
    };

    logger.error('Rate limit exceeded', 'ErrorHandler', { message });
    return appError;
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(message: string = 'Network error occurred'): AppError {
    const appError: AppError = {
      code: 'NETWORK_ERROR',
      message,
      statusCode: 503,
      timestamp: new Date().toISOString()
    };

    logger.error('Network error', 'ErrorHandler', { message });
    return appError;
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: AppError): string {
    const friendlyMessages: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again',
      'AUTH_ERROR': 'Please log in to continue',
      'AUTHORIZATION_ERROR': 'You don\'t have permission to perform this action',
      'RATE_LIMIT_ERROR': 'Too many requests. Please wait a moment and try again',
      'NETWORK_ERROR': 'Connection problem. Please check your internet and try again',
      'NOT_FOUND': 'The requested resource was not found',
      'CONFLICT': 'This action conflicts with existing data',
      'UNKNOWN_ERROR': 'Something went wrong. Please try again'
    };

    return friendlyMessages[error.code] || error.message;
  }

  /**
   * Check if error is retryable
   */
  public isRetryable(error: AppError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'RATE_LIMIT_ERROR', 'TIMEOUT_ERROR'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Get error code from error instance
   */
  private getErrorCode(error: Error): string {
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'AuthenticationError') return 'AUTH_ERROR';
    if (error.name === 'AuthorizationError') return 'AUTHORIZATION_ERROR';
    if (error.name === 'RateLimitError') return 'RATE_LIMIT_ERROR';
    if (error.name === 'NetworkError') return 'NETWORK_ERROR';
    if (error.name === 'NotFoundError') return 'NOT_FOUND';
    if (error.name === 'ConflictError') return 'CONFLICT';
    if (error.name === 'TimeoutError') return 'TIMEOUT_ERROR';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get status code from error instance
   */
  private getStatusCode(error: Error): number {
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'AuthenticationError') return 401;
    if (error.name === 'AuthorizationError') return 403;
    if (error.name === 'NotFoundError') return 404;
    if (error.name === 'ConflictError') return 409;
    if (error.name === 'RateLimitError') return 429;
    if (error.name === 'NetworkError') return 503;
    if (error.name === 'TimeoutError') return 504;
    return 500;
  }
}

export const errorHandler = ErrorHandler.getInstance();

/**
 * Error boundary for React components
 */
export class ErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}