/**
 * API Error Handler
 * Centralized error handling for API calls
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiErrorHandler {
  static handle(error: any): ApiError {
    // OpenAI specific errors
    if (error?.status === 401) {
      return {
        message: 'OpenAI API key is invalid or missing. Please configure it in the Admin Settings.',
        code: 'INVALID_API_KEY',
        status: 401,
        details: error
      };
    }

    if (error?.status === 429) {
      return {
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT',
        status: 429,
        details: error
      };
    }

    if (error?.status === 404) {
      return {
        message: 'Resource not found. Please check your configuration.',
        code: 'NOT_FOUND',
        status: 404,
        details: error
      };
    }

    // Network errors
    if (error?.message?.includes('fetch')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        details: error
      };
    }

    // CORS errors
    if (error?.message?.includes('CORS')) {
      return {
        message: 'CORS error. Edge Functions may need to be deployed.',
        code: 'CORS_ERROR',
        details: error
      };
    }

    // Default error
    return {
      message: error?.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  static isApiKeyError(error: any): boolean {
    return error?.status === 401 || 
           error?.code === 'INVALID_API_KEY' ||
           error?.message?.includes('API key');
  }

  static shouldRetry(error: any): boolean {
    // Retry on network errors or rate limits
    return error?.code === 'NETWORK_ERROR' || 
           error?.status === 429 ||
           error?.status >= 500;
  }

  static getUserFriendlyMessage(error: any): string {
    const handled = this.handle(error);
    
    // Provide actionable messages
    switch (handled.code) {
      case 'INVALID_API_KEY':
        return '🔑 API key issue: Please go to Admin → Settings to configure your OpenAI API key.';
      case 'RATE_LIMIT':
        return '⏱️ Too many requests. Please wait a moment and try again.';
      case 'NETWORK_ERROR':
        return '📡 Connection issue. Please check your internet and try again.';
      case 'CORS_ERROR':
        return '🔒 Security issue. Please contact support or check Edge Function deployment.';
      default:
        return handled.message;
    }
  }
}

// Global error handler for unhandled promises
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's an API error we should handle
    if (event.reason?.status === 401) {
      console.warn('API Key not configured. Some features will be limited.');
      // Prevent the error from showing in console as uncaught
      event.preventDefault();
    }
  });
}