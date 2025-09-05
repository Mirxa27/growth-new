/**
 * Error Handling Types
 * Type-safe error handling with user-friendly messages
 */

export enum ErrorCode {
  // Authentication
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED = 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  
  // Database
  DB_NOT_FOUND = 'DB_NOT_FOUND',
  DB_DUPLICATE = 'DB_DUPLICATE',
  DB_CONSTRAINT = 'DB_CONSTRAINT',
  DB_CONNECTION = 'DB_CONNECTION',
  
  // Business Logic
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  BUSINESS_INSUFFICIENT_FUNDS = 'BUSINESS_INSUFFICIENT_FUNDS',
  BUSINESS_QUOTA_EXCEEDED = 'BUSINESS_QUOTA_EXCEEDED',
  BUSINESS_INVALID_STATE = 'BUSINESS_INVALID_STATE',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_TIMEOUT = 'EXTERNAL_TIMEOUT',
  EXTERNAL_RATE_LIMIT = 'EXTERNAL_RATE_LIMIT',
  
  // General
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  userMessage: string;
  retryable: boolean;
}

export class BusinessError extends Error implements AppError {
  code: ErrorCode;
  details?: Record<string, any>;
  timestamp: Date;
  userMessage: string;
  retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    details?: Record<string, any>,
    retryable = false
  ) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date();
    this.retryable = retryable;
  }
}

export class ValidationError extends BusinessError {
  constructor(
    message: string,
    userMessage = 'Please check your input and try again',
    details?: Record<string, any>
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, userMessage, details);
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, userMessage = 'The requested resource was not found') {
    super(ErrorCode.DB_NOT_FOUND, `${resource} not found`, userMessage, { resource });
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message = 'Unauthorized', userMessage = 'Please sign in to continue') {
    super(ErrorCode.AUTH_UNAUTHORIZED, message, userMessage);
  }
}

export class DatabaseError extends BusinessError {
  constructor(message: string, code?: string, userMessage = 'A database error occurred') {
    const errorCode = code === '23505' ? ErrorCode.DB_DUPLICATE : ErrorCode.DB_CONNECTION;
    super(errorCode, message, userMessage, { code });
  }
}

export class NetworkError extends BusinessError {
  constructor(message = 'Network error', userMessage = 'Please check your internet connection') {
    super(ErrorCode.NETWORK_ERROR, message, userMessage, {}, true);
  }
}

export class TimeoutError extends BusinessError {
  constructor(message = 'Request timeout', userMessage = 'The request took too long to complete', retryable = true) {
    super(ErrorCode.TIMEOUT_ERROR, message, userMessage, {}, retryable);
  }
}

export class SupabaseError extends BusinessError {
  constructor(error: any) {
    const code = error?.code || 'UNKNOWN';
    let errorCode = ErrorCode.UNEXPECTED_ERROR;
    let userMessage = 'An unexpected error occurred';
    let retryable = false;

    switch (code) {
      case 'PGRST116':
        errorCode = ErrorCode.DB_NOT_FOUND;
        userMessage = 'Resource not found';
        break;
      case 'PGRST301':
        errorCode = ErrorCode.VALIDATION_ERROR;
        userMessage = 'Invalid request parameters';
        break;
      case '23505':
        errorCode = ErrorCode.DB_DUPLICATE;
        userMessage = 'This record already exists';
        break;
      case '23503':
        errorCode = ErrorCode.DB_CONSTRAINT;
        userMessage = 'Cannot perform this action due to data constraints';
        break;
      case 'ECONNREFUSED':
        errorCode = ErrorCode.DB_CONNECTION;
        userMessage = 'Database connection failed';
        break;
      default:
        if (error?.message?.includes('timeout')) {
          errorCode = ErrorCode.TIMEOUT_ERROR;
          userMessage = 'Request took too long to complete';
          retryable = true;
        }
    }

    super(errorCode, error?.message || 'Database error', userMessage, { code }, retryable);
  }
}

export interface ErrorHandler {
  handle(error: unknown): AppError;
  isRetryable(error: AppError): boolean;
  getUserMessage(error: AppError): string;
}

export class DefaultErrorHandler implements ErrorHandler {
  handle(error: unknown): AppError {
    if (error instanceof BusinessError) {
      return error;
    }

    if (error instanceof Error) {
      return new BusinessError(
        ErrorCode.UNEXPECTED_ERROR,
        error.message,
        'Something went wrong. Please try again later.',
        { originalError: error.message },
        false
      );
    }

    return new BusinessError(
      ErrorCode.UNEXPECTED_ERROR,
      'Unknown error',
      'An unexpected error occurred. Please try again.',
      { error },
      false
    );
  }

  isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  getUserMessage(error: AppError): string {
    return error.userMessage;
  }
}

export const errorHandler = new DefaultErrorHandler();