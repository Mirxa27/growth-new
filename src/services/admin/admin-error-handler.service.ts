import { z } from 'zod';
import { logger } from '@/utils/logger';
import { ErrorResponse } from '@/schemas/admin.schemas';

export interface AdminErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class AdminError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context: AdminErrorContext;
  public readonly userMessage: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context: AdminErrorContext,
    userMessage?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.userMessage = userMessage || message;
    this.details = details;
  }
}

export class AdminValidationError extends AdminError {
  constructor(
    validationErrors: z.ZodIssue[],
    context: AdminErrorContext,
    userMessage: string = 'Invalid data provided'
  ) {
    const message = validationErrors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    const details = {
      validationErrors: validationErrors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };

    super(message, 'VALIDATION_ERROR', 400, context, userMessage, details);
  }
}

export class AdminAuthenticationError extends AdminError {
  constructor(context: AdminErrorContext, userMessage: string = 'Authentication required') {
    super('User not authenticated', 'AUTH_REQUIRED', 401, context, userMessage);
  }
}

export class AdminAuthorizationError extends AdminError {
  constructor(context: AdminErrorContext, userMessage: string = 'Insufficient permissions') {
    super('User not authorized for this action', 'INSUFFICIENT_PERMISSIONS', 403, context, userMessage);
  }
}

export class AdminNotFoundError extends AdminError {
  constructor(resource: string, context: AdminErrorContext, userMessage?: string) {
    const message = `${resource} not found`;
    super(message, 'NOT_FOUND', 404, context, userMessage || message);
  }
}

export class AdminConflictError extends AdminError {
  constructor(message: string, context: AdminErrorContext, userMessage?: string) {
    super(message, 'CONFLICT', 409, context, userMessage || message);
  }
}

export class AdminRateLimitError extends AdminError {
  constructor(context: AdminErrorContext, retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, context, 'Too many requests, please try again later');
    if (retryAfter) {
      this.details = { retryAfter };
    }
  }
}

export class AdminExternalServiceError extends AdminError {
  constructor(service: string, originalError: Error, context: AdminErrorContext) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, context, 
          `Service temporarily unavailable: ${service}`);
    this.details = {
      service,
      originalError: originalError.message
    };
  }
}

export class AdminErrorHandler {
  /**
   * Validate data against a Zod schema and throw AdminValidationError if invalid
   */
  static validateOrThrow<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context: AdminErrorContext
  ): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      logger.error('Validation failed', context.component, {
        context,
        errors: result.error.issues
      });
      throw new AdminValidationError(result.error.issues, context);
    }
    
    return result.data;
  }

  /**
   * Handle database errors and convert them to appropriate AdminError types
   */
  static handleDatabaseError(
    error: any,
    context: AdminErrorContext,
    userMessage?: string
  ): never {
    logger.error('Database error', context.component, { context, error });

    // Handle common PostgreSQL/Supabase errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          throw new AdminConflictError(
            'Record already exists',
            context,
            userMessage || 'This item already exists'
          );
        
        case '23503': // Foreign key constraint violation
          throw new AdminConflictError(
            'Cannot delete: record is referenced by other data',
            context,
            userMessage || 'Cannot delete this item as it is being used elsewhere'
          );
        
        case '42P01': // Table does not exist
          throw new AdminError(
            'Database schema error',
            'SCHEMA_ERROR',
            500,
            context,
            'System configuration error'
          );
        
        case 'PGRST116': // No rows returned
          throw new AdminNotFoundError('Record', context, userMessage);
      }
    }

    // Handle Supabase specific errors
    if (error.message) {
      if (error.message.includes('Row Level Security')) {
        throw new AdminAuthorizationError(context);
      }
      
      if (error.message.includes('JWT expired')) {
        throw new AdminAuthenticationError(context, 'Session expired, please log in again');
      }
    }

    // Generic database error
    throw new AdminError(
      error.message || 'Database operation failed',
      'DATABASE_ERROR',
      500,
      context,
      userMessage || 'An error occurred while processing your request'
    );
  }

  /**
   * Handle external API errors
   */
  static handleExternalApiError(
    error: any,
    serviceName: string,
    context: AdminErrorContext,
    userMessage?: string
  ): never {
    logger.error(`${serviceName} API error`, context.component, { context, error });

    if (error.response?.status) {
      const statusCode = error.response.status;
      
      if (statusCode === 401 || statusCode === 403) {
        throw new AdminError(
          `${serviceName} authentication failed`,
          'EXTERNAL_AUTH_ERROR',
          502,
          context,
          userMessage || `${serviceName} service authentication failed`
        );
      }
      
      if (statusCode === 429) {
        throw new AdminRateLimitError(context);
      }
    }

    throw new AdminExternalServiceError(serviceName, error, context);
  }

  /**
   * Convert AdminError to ErrorResponse format
   */
  static toErrorResponse(error: AdminError): ErrorResponse {
    return {
      success: false,
      error: error.userMessage,
      code: error.code,
      details: error.details
    };
  }

  /**
   * Log and convert any error to ErrorResponse format
   */
  static handleError(error: unknown, context: AdminErrorContext): ErrorResponse {
    // If already an AdminError, just convert it
    if (error instanceof AdminError) {
      logger.error(`Admin error: ${error.message}`, context.component, {
        context,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      });
      return this.toErrorResponse(error);
    }

    // Convert generic Error to AdminError
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Unhandled error: ${message}`, context.component, { context, error });
    
    const adminError = new AdminError(
      message,
      'INTERNAL_ERROR',
      500,
      context,
      'An unexpected error occurred'
    );
    
    return this.toErrorResponse(adminError);
  }

  /**
   * Wrap async functions with error handling
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    context: AdminErrorContext
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      
      // Convert to AdminError
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AdminError(message, 'WRAPPED_ERROR', 500, context);
    }
  }

  /**
   * Create a retry mechanism for operations that might fail temporarily
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts: number;
      delayMs: number;
      context: AdminErrorContext;
      retryableErrors?: string[];
    }
  ): Promise<T> {
    const { maxAttempts, delayMs, context, retryableErrors = [] } = options;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's not a retryable error
        if (error instanceof AdminError && retryableErrors.length > 0) {
          if (!retryableErrors.includes(error.code)) {
            throw error;
          }
        }
        
        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms`, context.component, {
          context,
          error: lastError.message,
          attempt,
          maxAttempts
        });
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError;
  }

  /**
   * Validate user permissions for admin actions
   */
  static validateAdminAccess(userRole?: string, context?: AdminErrorContext): void {
    if (!userRole || userRole !== 'admin') {
      throw new AdminAuthorizationError(
        context || { component: 'AdminErrorHandler', action: 'validateAdminAccess' }
      );
    }
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse<T>(data: T, message: string = 'Operation successful') {
    return {
      success: true,
      message,
      data
    };
  }

  /**
   * Sanitize sensitive data from error logs
   */
  static sanitizeErrorData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'api_key',
      'client_secret', 'auth_token', 'access_token',
      'refresh_token', 'jwt', 'session', 'cookie'
    ];

    const sanitized = { ...data };

    const sanitizeRecursive = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowercaseKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitiveKey => 
          lowercaseKey.includes(sensitiveKey)
        );
        
        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else if (value && typeof value === 'object') {
          result[key] = sanitizeRecursive(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeRecursive(sanitized);
  }
}

// Export error classes for use in other modules
export {
  AdminError,
  AdminValidationError,
  AdminAuthenticationError,
  AdminAuthorizationError,
  AdminNotFoundError,
  AdminConflictError,
  AdminRateLimitError,
  AdminExternalServiceError
};