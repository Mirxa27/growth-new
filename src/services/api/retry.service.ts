/**
 * Advanced Retry Service with Exponential Backoff and Circuit Breaker
 * Provides robust error handling and automatic retry capabilities
 * for API calls and database operations
 */

export interface RetryOptions {
  // Basic retry configuration
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  
  // Circuit breaker configuration
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  
  // Conditional retry logic
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, nextDelay: number) => void;
  onFailure?: (error: any, totalAttempts: number) => void;
  
  // Timeout configuration
  timeout?: number;
  abortSignal?: AbortSignal;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure' | 'abortSignal'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
  timeout: 30000, // 30 seconds
};

// Circuit breaker states for different services
const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * Enhanced error types for better error handling
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly attempts: number,
    public readonly totalTime: number
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitBreakerKey: string,
    public readonly failures: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Advanced Retry Service Class
 */
export class RetryService {
  /**
   * Execute a function with retry logic and circuit breaker protection
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
    circuitBreakerKey?: string
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    const startTime = Date.now();
    
    // Check circuit breaker if key is provided
    if (circuitBreakerKey) {
      this.checkCircuitBreaker(circuitBreakerKey, config);
    }
    
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        // Apply timeout wrapper if specified
        const result = config.timeout
          ? await this.withTimeout(operation(), config.timeout, options.abortSignal)
          : await operation();
        
        // Reset circuit breaker on success
        if (circuitBreakerKey) {
          this.resetCircuitBreaker(circuitBreakerKey);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Record failure for circuit breaker
        if (circuitBreakerKey) {
          this.recordFailure(circuitBreakerKey, config);
        }
        
        // Check if we should retry
        const shouldRetry = this.shouldRetry(lastError, attempt, config);
        const isLastAttempt = attempt > config.maxRetries;
        
        if (!shouldRetry || isLastAttempt) {
          if (options.onFailure) {
            options.onFailure(lastError, attempt);
          }
          break;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt - 1, config);
        
        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(lastError, attempt, delay);
        }
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }
    
    // All retries exhausted
    const totalTime = Date.now() - startTime;
    throw new RetryError(
      `Operation failed after ${config.maxRetries + 1} attempts over ${totalTime}ms`,
      lastError,
      config.maxRetries + 1,
      totalTime
    );
  }
  
  /**
   * Execute with specific database retry configuration
   */
  static async executeDatabase<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const dbOptions: RetryOptions = {
      maxRetries: 5,
      initialDelay: 500,
      maxDelay: 10000,
      shouldRetry: (error) => this.isDatabaseRetryableError(error),
      ...options,
    };
    
    return this.execute(operation, dbOptions, 'database');
  }
  
  /**
   * Execute with API-specific retry configuration
   */
  static async executeApi<T>(
    operation: () => Promise<T>,
    apiName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const apiOptions: RetryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 15000,
      shouldRetry: (error) => this.isApiRetryableError(error),
      ...options,
    };
    
    return this.execute(operation, apiOptions, `api_${apiName}`);
  }
  
  /**
   * Execute with exponential backoff and jitter
   */
  static async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    return this.execute(operation, {
      maxRetries,
      initialDelay: baseDelay,
      backoffMultiplier: 2,
      jitter: true,
      maxDelay: baseDelay * Math.pow(2, maxRetries),
    });
  }
  
  /**
   * Batch execution with individual retry logic
   */
  static async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {},
    concurrency: number = 5
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results: Array<{ success: boolean; result?: T; error?: Error }> = [];
    
    // Process operations in batches to control concurrency
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(operation => this.execute(operation, options))
      );
      
      results.push(
        ...batchResults.map(result => ({
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason : undefined,
        }))
      );
    }
    
    return results;
  }
  
  /**
   * Execute with adaptive retry based on error types
   */
  static async executeAdaptive<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const adaptiveOptions: RetryOptions = {
      maxRetries: 5,
      initialDelay: 500,
      shouldRetry: (error, attempt) => {
        // Network errors - retry more aggressively
        if (this.isNetworkError(error)) {
          return attempt <= 5;
        }
        
        // Rate limit errors - back off more
        if (this.isRateLimitError(error)) {
          return attempt <= 3;
        }
        
        // Server errors - moderate retry
        if (this.isServerError(error)) {
          return attempt <= 4;
        }
        
        // Client errors - don't retry
        return false;
      },
      onRetry: (error, attempt, delay) => {
        console.warn(`Adaptive retry attempt ${attempt} after ${delay}ms for error: ${error.message}`);
      },
      ...options,
    };
    
    return this.execute(operation, adaptiveOptions, 'adaptive');
  }
  
  /**
   * Check circuit breaker state
   */
  private static checkCircuitBreaker(key: string, config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure' | 'abortSignal'>>): void {
    const state = circuitBreakers.get(key);
    if (!state) return;
    
    if (state.state === 'open') {
      const timeSinceLastFailure = Date.now() - state.lastFailure;
      
      if (timeSinceLastFailure < config.circuitBreakerTimeout) {
        throw new CircuitBreakerError(
          `Circuit breaker is open for ${key}. ${Math.ceil((config.circuitBreakerTimeout - timeSinceLastFailure) / 1000)}s remaining.`,
          key,
          state.failures
        );
      } else {
        // Move to half-open state
        state.state = 'half-open';
      }
    }
  }
  
  /**
   * Record failure for circuit breaker
   */
  private static recordFailure(key: string, config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure' | 'abortSignal'>>): void {
    const state = circuitBreakers.get(key) || { failures: 0, lastFailure: 0, state: 'closed' as const };
    
    state.failures += 1;
    state.lastFailure = Date.now();
    
    if (state.failures >= config.circuitBreakerThreshold) {
      state.state = 'open';
      console.warn(`Circuit breaker opened for ${key} after ${state.failures} failures`);
    }
    
    circuitBreakers.set(key, state);
  }
  
  /**
   * Reset circuit breaker on success
   */
  private static resetCircuitBreaker(key: string): void {
    circuitBreakers.delete(key);
  }
  
  /**
   * Determine if an error should trigger a retry
   */
  private static shouldRetry(error: Error, attempt: number, config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure' | 'abortSignal'>>): boolean {
    // Use custom shouldRetry function if provided
    if (config.shouldRetry) {
      return config.shouldRetry(error, attempt);
    }
    
    // Default retry logic
    return this.isRetryableError(error) && attempt <= config.maxRetries;
  }
  
  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(attempt: number, config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure' | 'abortSignal'>>): number {
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Wrap operation with timeout
   */
  private static async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    abortSignal?: AbortSignal
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);
      
      // Clear timeout if abort signal is triggered
      abortSignal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Operation aborted'));
      });
    });
    
    return Promise.race([operation, timeoutPromise]);
  }
  
  /**
   * Check if error is retryable (general)
   */
  private static isRetryableError(error: any): boolean {
    // Network errors
    if (this.isNetworkError(error)) return true;
    
    // Timeout errors
    if (error instanceof TimeoutError) return true;
    
    // Server errors (5xx)
    if (this.isServerError(error)) return true;
    
    // Rate limit errors (429)
    if (this.isRateLimitError(error)) return true;
    
    // Database connection errors
    if (this.isDatabaseRetryableError(error)) return true;
    
    return false;
  }
  
  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: any): boolean {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNRESET' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('Network request failed') ||
      error?.message?.includes('fetch')
    );
  }
  
  /**
   * Check if error is a server error (5xx)
   */
  private static isServerError(error: any): boolean {
    const statusCode = error?.status || error?.statusCode || error?.response?.status;
    return statusCode >= 500 && statusCode < 600;
  }
  
  /**
   * Check if error is a rate limit error
   */
  private static isRateLimitError(error: any): boolean {
    const statusCode = error?.status || error?.statusCode || error?.response?.status;
    return statusCode === 429;
  }
  
  /**
   * Check if error is an API retryable error
   */
  private static isApiRetryableError(error: any): boolean {
    return (
      this.isNetworkError(error) ||
      this.isServerError(error) ||
      this.isRateLimitError(error)
    );
  }
  
  /**
   * Check if database error is retryable
   */
  private static isDatabaseRetryableError(error: any): boolean {
    const retryableCodes = [
      'PGRST301', // Connection timeout
      'PGRST204', // Connection error
      '08003',    // Connection does not exist
      '08006',    // Connection failure
      '53300',    // Too many connections
      '40001',    // Serialization failure
      '40P01',    // Deadlock detected
    ];
    
    return (
      retryableCodes.includes(error?.code) ||
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('deadlock')
    );
  }
  
  /**
   * Get circuit breaker status for debugging
   */
  static getCircuitBreakerStatus(key: string): CircuitBreakerState | null {
    return circuitBreakers.get(key) || null;
  }
  
  /**
   * Reset circuit breaker manually (for testing/debugging)
   */
  static resetCircuitBreakerManually(key: string): void {
    circuitBreakers.delete(key);
  }
  
  /**
   * Get all circuit breaker statuses
   */
  static getAllCircuitBreakerStatuses(): Record<string, CircuitBreakerState> {
    const statuses: Record<string, CircuitBreakerState> = {};
    for (const [key, state] of circuitBreakers.entries()) {
      statuses[key] = { ...state };
    }
    return statuses;
  }
}

// Export convenience functions
export const retry = RetryService.execute;
export const retryDatabase = RetryService.executeDatabase;
export const retryApi = RetryService.executeApi;
export const retryWithBackoff = RetryService.executeWithBackoff;
export const retryBatch = RetryService.executeBatch;
export const retryAdaptive = RetryService.executeAdaptive;