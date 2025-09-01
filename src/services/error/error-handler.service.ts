/**
 * Error Handler Service
 * Comprehensive error handling and logging for production
 */

import { env } from '@/config/environment';
import { supabase } from '@/integrations/supabase/client';

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
  DATABASE = 'database',
  API = 'api',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  action?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  resolved: boolean;
}

class ErrorHandlerService {
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor() {
    this.setupErrorListeners();
    this.setupNetworkListeners();
  }

  /**
   * Setup global error listeners
   */
  private setupErrorListeners(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.message), {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          url: event.filename,
          stackTrace: event.error?.stack,
        },
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          stackTrace: event.reason?.stack,
        },
      });
    });
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Main error handler
   */
  public handleError(
    error: Error | unknown,
    options?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: ErrorContext;
      showToUser?: boolean;
      retry?: boolean;
    }
  ): ErrorReport {
    // Parse error
    const errorMessage = this.getErrorMessage(error);
    const category = options?.category || this.categorizeError(error);
    const severity = options?.severity || this.assessSeverity(category, error);
    
    // Get user context
    const context = this.enrichContext(options?.context || {}, error);
    
    // Create error report
    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: errorMessage,
      category,
      severity,
      context,
      resolved: false,
    };

    // Log based on environment
    this.logError(report);

    // Send to monitoring service
    if (this.shouldReportError(severity)) {
      this.reportError(report);
    }

    // Handle user notification
    if (options?.showToUser) {
      this.notifyUser(errorMessage, severity);
    }

    // Retry logic for recoverable errors
    if (options?.retry && this.isRecoverable(category)) {
      this.scheduleRetry(error, options);
    }

    return report;
  }

  /**
   * Get error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Categorize error based on type and content
   */
  private categorizeError(error: unknown): ErrorCategory {
    const message = this.getErrorMessage(error).toLowerCase();
    
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('forbidden') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('postgres')) {
      return ErrorCategory.DATABASE;
    }
    
    if (message.includes('api') || message.includes('fetch') || message.includes('request')) {
      return ErrorCategory.API;
    }
    
    if (message.includes('network') || message.includes('offline') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Assess error severity
   */
  private assessSeverity(category: ErrorCategory, error: unknown): ErrorSeverity {
    // Critical categories
    if ([ErrorCategory.AUTHENTICATION, ErrorCategory.SYSTEM].includes(category)) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity categories
    if ([ErrorCategory.DATABASE, ErrorCategory.AUTHORIZATION].includes(category)) {
      return ErrorSeverity.HIGH;
    }
    
    // Check for specific error codes
    if (error instanceof Error) {
      const code = (error as any).code;
      if (code === 'PGRST301' || code === '23505') { // Database constraint violations
        return ErrorSeverity.HIGH;
      }
    }
    
    // Medium severity for business logic and API errors
    if ([ErrorCategory.BUSINESS_LOGIC, ErrorCategory.API].includes(category)) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * Enrich error context with additional information
   */
  private enrichContext(context: ErrorContext, error: unknown): ErrorContext {
    const enrichedContext = { ...context };
    
    // Add user information
    const user = supabase.auth.getUser();
    if (user) {
      enrichedContext.userId = (user as any).data?.user?.id;
    }
    
    // Add browser information
    enrichedContext.userAgent = navigator.userAgent;
    enrichedContext.url = window.location.href;
    
    // Add stack trace
    if (error instanceof Error && error.stack) {
      enrichedContext.stackTrace = error.stack;
    }
    
    // Add timestamp
    enrichedContext.metadata = {
      ...enrichedContext.metadata,
      timestamp: new Date().toISOString(),
      environment: env.app.environment,
    };
    
    return enrichedContext;
  }

  /**
   * Log error based on environment and severity
   */
  private logError(report: ErrorReport): void {
    if (!env.logging.enabled) return;
    
    const logData = {
      id: report.id,
      message: report.message,
      category: report.category,
      severity: report.severity,
      context: report.context,
    };
    
    switch (report.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error('[ERROR]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[WARNING]', logData);
        break;
      case ErrorSeverity.LOW:
        if (env.logging.level === 'debug') {
          console.log('[INFO]', logData);
        }
        break;
    }
  }

  /**
   * Report error to monitoring service
   */
  private async reportError(report: ErrorReport): Promise<void> {
    if (!this.isOnline) {
      this.errorQueue.push(report);
      return;
    }
    
    try {
      // In production, send to error monitoring service (e.g., Sentry, LogRocket)
      if (env.isProduction()) {
        // Store critical errors in database
        if (report.severity === ErrorSeverity.CRITICAL) {
          await supabase.from('error_logs').insert({
            error_id: report.id,
            message: report.message,
            category: report.category,
            severity: report.severity,
            context: report.context,
            timestamp: report.timestamp,
          });
        }
        
        // Send to external monitoring (implement based on your service)
        // await sendToSentry(report);
        // await sendToLogRocket(report);
      }
    } catch (error) {
      // Fallback: store in local storage
      this.storeErrorLocally(report);
    }
  }

  /**
   * Check if error should be reported
   */
  private shouldReportError(severity: ErrorSeverity): boolean {
    if (env.isDevelopment()) {
      return severity === ErrorSeverity.CRITICAL;
    }
    
    return [ErrorSeverity.CRITICAL, ErrorSeverity.HIGH, ErrorSeverity.MEDIUM].includes(severity);
  }

  /**
   * Notify user about error
   */
  private notifyUser(message: string, severity: ErrorSeverity): void {
    // Get user-friendly message
    const userMessage = this.getUserFriendlyMessage(message);
    
    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('app:error', {
      detail: {
        message: userMessage,
        severity,
      },
    }));
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(message: string): string {
    const messageMap: Record<string, string> = {
      'network': 'Connection issue. Please check your internet connection.',
      'auth': 'Authentication failed. Please sign in again.',
      'permission': 'You don\'t have permission to perform this action.',
      'validation': 'Please check your input and try again.',
      'database': 'We\'re experiencing technical difficulties. Please try again later.',
      'not found': 'The requested resource was not found.',
      'timeout': 'The request took too long. Please try again.',
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, friendlyMessage] of Object.entries(messageMap)) {
      if (lowerMessage.includes(key)) {
        return friendlyMessage;
      }
    }
    
    return 'Something went wrong. Please try again.';
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.API,
      ErrorCategory.DATABASE,
    ].includes(category);
  }

  /**
   * Schedule retry for recoverable errors
   */
  private scheduleRetry(
    error: unknown,
    options: any,
    retryCount: number = 0
  ): void {
    if (retryCount >= this.maxRetries) {
      this.handleError(new Error('Max retries exceeded'), {
        ...options,
        retry: false,
        severity: ErrorSeverity.HIGH,
      });
      return;
    }
    
    setTimeout(() => {
      // Retry the original operation
      // This would need to be implemented based on your specific retry logic
      console.log(`Retrying operation (attempt ${retryCount + 1}/${this.maxRetries})`);
    }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
  }

  /**
   * Store error locally for later reporting
   */
  private storeErrorLocally(report: ErrorReport): void {
    try {
      const errors = JSON.parse(localStorage.getItem('error_queue') || '[]');
      errors.push(report);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }
      
      localStorage.setItem('error_queue', JSON.stringify(errors));
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  /**
   * Flush error queue when back online
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    for (const error of errors) {
      await this.reportError(error);
    }
    
    // Also flush locally stored errors
    try {
      const localErrors = JSON.parse(localStorage.getItem('error_queue') || '[]');
      for (const error of localErrors) {
        await this.reportError(error);
      }
      localStorage.removeItem('error_queue');
    } catch (error) {
      console.error('Failed to flush local error queue:', error);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this.errorQueue = [];
    localStorage.removeItem('error_queue');
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const errors = [
      ...this.errorQueue,
      ...JSON.parse(localStorage.getItem('error_queue') || '[]'),
    ];
    
    const stats = {
      total: errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };
    
    for (const error of errors) {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }
    
    return stats;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();

// Export types
export type { ErrorReport, ErrorContext };