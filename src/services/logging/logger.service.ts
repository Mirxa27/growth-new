/**
 * Production-Ready Logging Service
 * Replaces console.log statements with structured, environment-aware logging
 */

import { env } from '@/config/environment';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  error?: Error | unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  environment: string;
  version: string;
  source: string;
}

class LoggingService {
  private static instance: LoggingService;
  private isDevelopment: boolean;
  private isProduction: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: this.isProduction ? 'production' : 'development',
      version: '1.0.0', // You can make this dynamic
      source: this.getSource(),
    };

    // Add to buffer
    this.addToBuffer(entry);

    // Console output with appropriate formatting
    this.outputToConsole(entry);

    // In production, send to external logging service
    if (this.isProduction) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Get the source/caller information
   */
  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // Skip the first few lines (Error, this method, log method, public method)
    const callerLine = lines[4] || lines[3] || lines[2];
    
    if (!callerLine) return 'unknown';

    // Extract filename and line number
    const match = callerLine.match(/at\s+.*\s+\((.+):(\d+):(\d+)\)/) || 
                  callerLine.match(/at\s+(.+):(\d+):(\d+)/);
    
    if (match) {
      const filePath = match[1];
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName}:${match[2]}`;
    }

    return 'unknown';
  }

  /**
   * Add entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
    }
  }

  /**
   * Output to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    
    let output = `${prefix} ${entry.message}`;
    
    if (entry.context) {
      output += ` | Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        if (entry.context?.error) {
          console.error(entry.context.error);
        }
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
    }
  }

  /**
   * Send to external logging service (Sentry, LogRocket, etc.)
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, you would send to your logging service
      // For now, we'll just store it for potential API endpoint
      
      // Example: Send to your analytics endpoint
      if (entry.level === LogLevel.ERROR && entry.context?.error) {
        // Send error to error tracking service
        this.sendErrorToTracking(entry);
      }

      // You could also batch logs and send them periodically
      if (this.logBuffer.length >= 10) {
        this.batchSendLogs();
      }
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Send error to tracking service
   */
  private async sendErrorToTracking(entry: LogEntry): Promise<void> {
    // In production, integrate with Sentry, Bugsnag, or similar
    // For now, we'll prepare the data structure
    
    const errorData = {
      message: entry.message,
      timestamp: entry.timestamp,
      context: entry.context,
      source: entry.source,
      environment: entry.environment,
      error: entry.context?.error instanceof Error ? {
        name: entry.context.error.name,
        message: entry.context.error.message,
        stack: entry.context.error.stack,
      } : entry.context?.error,
    };

    // Send to your error tracking service
    // await sendToSentry(errorData);
    // await sendToBugsnag(errorData);
    
    // For development, just log to console
    if (this.isDevelopment) {
      console.group('🚨 Error Details');
      console.error(errorData);
      console.groupEnd();
    }
  }

  /**
   * Batch send logs to external service
   */
  private async batchSendLogs(): Promise<void> {
    const logsToSend = [...this.logBuffer];
    
    try {
      // Send batch to your logging endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: logsToSend })
      // });
      
      // Clear sent logs from buffer
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to send batch logs:', error);
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Get log statistics
   */
  getStats(): {
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
  } {
    const stats = {
      totalLogs: this.logBuffer.length,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
    };

    this.logBuffer.forEach(entry => {
      switch (entry.level) {
        case LogLevel.ERROR:
          stats.errorCount++;
          break;
        case LogLevel.WARN:
          stats.warnCount++;
          break;
        case LogLevel.INFO:
          stats.infoCount++;
          break;
        case LogLevel.DEBUG:
          stats.debugCount++;
          break;
      }
    });

    return stats;
  }

  /**
   * Create a logger with predefined context
   */
  createContextLogger(context: Omit<LogContext, 'metadata'>): {
    error: (message: string, metadata?: Record<string, unknown>) => void;
    warn: (message: string, metadata?: Record<string, unknown>) => void;
    info: (message: string, metadata?: Record<string, unknown>) => void;
    debug: (message: string, metadata?: Record<string, unknown>) => void;
  } {
    return {
      error: (message: string, metadata?: Record<string, unknown>) => 
        this.error(message, { ...context, metadata }),
      warn: (message: string, metadata?: Record<string, unknown>) => 
        this.warn(message, { ...context, metadata }),
      info: (message: string, metadata?: Record<string, unknown>) => 
        this.info(message, { ...context, metadata }),
      debug: (message: string, metadata?: Record<string, unknown>) => 
        this.debug(message, { ...context, metadata }),
    };
  }
}

// Export singleton instance and convenience functions
export const logger = LoggingService.getInstance();

// Export convenience functions for common use cases
export const log = {
  error: (message: string, context?: LogContext) => logger.error(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
};

// Export context logger creator
export const createLogger = (context: Omit<LogContext, 'metadata'>) => 
  logger.createContextLogger(context);

export default logger;
