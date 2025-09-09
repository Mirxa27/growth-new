/**
 * API Error Handler Service
 * Centralized handling for API errors and fallbacks
 */

import { toast } from '@/hooks/use-toast';

export interface ApiErrorDetails {
  status?: number;
  message: string;
  provider?: string;
  endpoint?: string;
  fallbackAvailable?: boolean;
}

class ApiErrorHandlerService {
  private errorCounts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000;

  /**
   * Handle API errors with appropriate fallbacks
   */
  handleApiError(error: any, context: { provider?: string; endpoint?: string } = {}): ApiErrorDetails {
    const errorKey = `${context.provider || 'unknown'}_${context.endpoint || 'unknown'}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Determine error type and response
    let errorDetails: ApiErrorDetails = {
      status: error.status || 0,
      message: 'Unknown API error',
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: false
    };

    // Handle specific error types
    if (error.status === 401) {
      errorDetails = this.handleAuthError(context);
    } else if (error.status === 404) {
      errorDetails = this.handleNotFoundError(context);
    } else if (error.status === 429) {
      errorDetails = this.handleRateLimitError(context);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorDetails = this.handleNetworkError(context);
    } else if (error.message?.includes('CORS')) {
      errorDetails = this.handleCorsError(context);
    }

    // Log error for monitoring (but don't spam console)
    if (currentCount <= 3) {
      console.warn(`API Error [${errorKey}]:`, errorDetails);
    }

    return errorDetails;
  }

  private handleAuthError(context: { provider?: string; endpoint?: string }): ApiErrorDetails {
    const provider = context.provider || 'API';
    
    return {
      status: 401,
      message: `${provider} authentication failed. Please check your API key configuration.`,
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: true
    };
  }

  private handleNotFoundError(context: { provider?: string; endpoint?: string }): ApiErrorDetails {
    const provider = context.provider || 'API';
    
    // Special handling for known issues
    if (context.provider === 'google' && context.endpoint?.includes('gemini-pro')) {
      return {
        status: 404,
        message: 'Google Gemini Pro model not available. Using fallback AI provider.',
        provider: context.provider,
        endpoint: context.endpoint,
        fallbackAvailable: true
      };
    }

    if (context.endpoint?.includes('user_profiles') || context.endpoint?.includes('community_posts')) {
      return {
        status: 404,
        message: 'Database table not found. Please run the database migration.',
        provider: context.provider,
        endpoint: context.endpoint,
        fallbackAvailable: false
      };
    }

    return {
      status: 404,
      message: `${provider} endpoint not found or not available.`,
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: true
    };
  }

  private handleRateLimitError(context: { provider?: string; endpoint?: string }): ApiErrorDetails {
    return {
      status: 429,
      message: `Rate limit exceeded for ${context.provider || 'API'}. Please try again later.`,
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: true
    };
  }

  private handleNetworkError(context: { provider?: string; endpoint?: string }): ApiErrorDetails {
    return {
      status: 0,
      message: 'Network error. Please check your internet connection.',
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: true
    };
  }

  private handleCorsError(context: { provider?: string; endpoint?: string }): ApiErrorDetails {
    return {
      status: 0,
      message: `CORS error with ${context.provider || 'API'}. This API must be called from the server.`,
      provider: context.provider,
      endpoint: context.endpoint,
      fallbackAvailable: true
    };
  }

  /**
   * Show user-friendly error notification
   */
  showUserError(errorDetails: ApiErrorDetails) {
    // Don't show notifications for certain errors that have fallbacks
    if (errorDetails.fallbackAvailable && 
        (errorDetails.status === 404 || errorDetails.status === 401)) {
      return;
    }

    const variant = errorDetails.status >= 500 ? 'destructive' : 'default';
    
    toast({
      title: 'Service Temporarily Unavailable',
      description: this.getUserFriendlyMessage(errorDetails),
      variant: variant as 'default' | 'destructive',
      duration: 5000
    });
  }

  private getUserFriendlyMessage(errorDetails: ApiErrorDetails): string {
    if (errorDetails.status === 401) {
      return 'Authentication issue detected. Using fallback services.';
    }
    
    if (errorDetails.status === 404) {
      return 'Service temporarily unavailable. Some features may be limited.';
    }
    
    if (errorDetails.status === 429) {
      return 'Service is busy. Please try again in a few moments.';
    }
    
    if (errorDetails.message.includes('CORS')) {
      return 'External service configuration issue. Using alternative providers.';
    }
    
    if (errorDetails.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    return 'Some features may be temporarily limited. The app will continue to work with available services.';
  }

  /**
   * Check if error should trigger fallback
   */
  shouldUseFallback(errorDetails: ApiErrorDetails): boolean {
    return errorDetails.fallbackAvailable && 
           (errorDetails.status === 401 || 
            errorDetails.status === 404 || 
            errorDetails.status === 429 || 
            errorDetails.status === 0);
  }

  /**
   * Reset error counts (useful for testing or manual reset)
   */
  resetErrorCounts() {
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return Array.from(this.errorCounts.entries()).map(([key, count]) => ({
      service: key,
      errorCount: count
    }));
  }
}

// Export singleton instance
export const apiErrorHandler = new ApiErrorHandlerService();