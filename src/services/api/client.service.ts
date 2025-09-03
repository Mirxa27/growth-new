/**
 * Production-Ready API Client Service
 * Provides robust HTTP client with retry logic, circuit breaker, and comprehensive error handling
 */

import { errorHandler, ErrorCategory, ErrorSeverity, handleError } from '@/services/error/error-handler.service';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export interface ApiClientResponse<T = any> {
  data: T | null;
  error: Error | null;
  status?: number;
  headers?: Headers;
}

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class ApiClient {
  private static instance: ApiClient;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_RETRY_COUNT = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Make an HTTP request with comprehensive error handling and retry logic
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiClientResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRY_COUNT,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      skipAuth = false,
      signal,
    } = config;

    // Check circuit breaker
    const circuitKey = this.getCircuitKey(url, method);
    if (this.isCircuitOpen(circuitKey)) {
      return {
        data: null,
        error: new Error('Service temporarily unavailable. Please try again later.'),
        status: 503,
      };
    }

    // Prepare request
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if needed
    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Merge abort signals if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // Execute request with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle successful response
        if (response.ok) {
          this.recordSuccess(circuitKey);
          
          const data = await this.parseResponse<T>(response);
          return {
            data,
            error: null,
            status: response.status,
            headers: response.headers,
          };
        }

        // Handle HTTP errors
        const error = await this.handleHttpError(response);
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          this.recordFailure(circuitKey);
          return {
            data: null,
            error,
            status: response.status,
            headers: response.headers,
          };
        }

        // Server error - will retry
        lastError = error;
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle network errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error('Request timeout');
          } else {
            lastError = error;
          }
        } else {
          lastError = new Error('Unknown error occurred');
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    // All retries failed
    this.recordFailure(circuitKey);
    
    handleError(lastError, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      context: {
        action: 'api_request',
        metadata: { url, method, attempts: retries + 1 },
      },
    });

    return {
      data: null,
      error: lastError,
    };
  }

  /**
   * Convenience methods for different HTTP verbs
   */
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  async put<T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  async patch<T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiClientResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text() as any;
    } else if (contentType?.includes('blob') || contentType?.includes('octet-stream')) {
      return response.blob() as any;
    }
    
    // Default to JSON
    try {
      return response.json();
    } catch {
      return response.text() as any;
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response): Promise<Error> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.error) {
        errorMessage = typeof errorBody.error === 'string' 
          ? errorBody.error 
          : errorBody.error.message || errorMessage;
      }
    } catch {
      // Failed to parse error body
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    
    return error;
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    // This should integrate with your auth system
    // For now, we'll try to get it from Supabase
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Circuit breaker pattern implementation
   */
  private getCircuitKey(url: string, method: string): string {
    try {
      // Handle relative URLs by making them absolute
      const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
      const urlObj = new URL(absoluteUrl);
      return `${method}:${urlObj.origin}${urlObj.pathname}`;
    } catch (error) {
      // Fallback for invalid URLs
      return `${method}:${url}`;
    }
  }

  private isCircuitOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key);
    if (!state) return false;

    if (state.state === 'OPEN') {
      // Check if enough time has passed to try again
      if (Date.now() - state.lastFailureTime > this.CIRCUIT_BREAKER_RESET_TIME) {
        state.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(key: string): void {
    const state = this.circuitBreakers.get(key);
    if (state) {
      state.failureCount = 0;
      state.state = 'CLOSED';
    }
  }

  private recordFailure(key: string): void {
    let state = this.circuitBreakers.get(key);
    
    if (!state) {
      state = {
        failureCount: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
      };
      this.circuitBreakers.set(key, state);
    }

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'OPEN';
    }
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch requests for better performance
   */
  async batchRequests<T = any>(
    requests: Array<{ url: string; config?: RequestConfig }>
  ): Promise<ApiClientResponse<T>[]> {
    return Promise.all(
      requests.map(req => this.request<T>(req.url, req.config))
    );
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiClientResponse> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ data, error: null, status: xhr.status });
          } catch {
            resolve({ data: xhr.responseText, error: null, status: xhr.status });
          }
        } else {
          const error = new Error(`Upload failed: ${xhr.statusText}`);
          resolve({ data: null, error, status: xhr.status });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        const error = new Error('Upload failed');
        resolve({ data: null, error });
      });

      // Get auth token and set headers
      this.getAuthToken().then(token => {
        xhr.open('POST', url);
        
        if (token && !config?.skipAuth) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // Add custom headers
        if (config?.headers) {
          Object.entries(config.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(formData);
      });
    });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export convenience functions
export const api = {
  get: <T = any>(url: string, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.post<T>(url, body, config),
  
  put: <T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.put<T>(url, body, config),
  
  patch: <T = any>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.patch<T>(url, body, config),
  
  delete: <T = any>(url: string, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.delete<T>(url, config),
  
  upload: (url: string, file: File, onProgress?: (progress: number) => void, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiClient.uploadFile(url, file, onProgress, config),
};