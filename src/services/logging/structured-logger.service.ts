import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  environment?: string;
  version?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
  stack?: string;
  duration?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  maxLocalStorageEntries: number;
  remoteEndpoint?: string;
  apiKey?: string;
  environment: string;
  version: string;
}

class StructuredLogger {
  private static instance: StructuredLogger;
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private isProcessing = false;
  private requestId: string | null = null;

  private constructor() {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: process.env.NODE_ENV === 'production',
      enableLocalStorage: true,
      maxLocalStorageEntries: 1000,
      remoteEndpoint: process.env.VITE_LOG_ENDPOINT,
      apiKey: process.env.VITE_LOG_API_KEY,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.VITE_APP_VERSION || '1.0.0'
    };
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.VITE_LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private createContext(component?: string, action?: string, metadata?: Record<string, unknown>): LogContext {
    const context: LogContext = {
      requestId: this.requestId || uuidv4(),
      component: component || 'unknown',
      action: action || 'unknown',
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      version: this.config.version,
      metadata: metadata || {}
    };

    // Add user context if available
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      const sessionId = localStorage.getItem('sessionId');
      if (userId) context.userId = userId;
      if (sessionId) context.sessionId = sessionId;
    }

    return context;
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext, error?: Error): string {
    const levelName = LogLevel[level];
    const baseMessage = `[${levelName}] ${message}`;

    if (error) {
      return `${baseMessage} | Error: ${error.message} | Stack: ${error.stack}`;
    }

    if (context.metadata && Object.keys(context.metadata).length > 0) {
      return `${baseMessage} | Context: ${JSON.stringify(context.metadata)}`;
    }

    return baseMessage;
  }

  private async sendToRemote(logEntry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Request-ID': logEntry.context.requestId || ''
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        console.warn('Failed to send log to remote endpoint:', response.status);
      }
    } catch (error) {
      console.warn('Error sending log to remote endpoint:', error);
    }
  }

  private saveToLocalStorage(logEntry: LogEntry): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      const existingLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      existingLogs.push(logEntry);

      // Keep only the most recent logs
      if (existingLogs.length > this.config.maxLocalStorageEntries) {
        existingLogs.splice(0, existingLogs.length - this.config.maxLocalStorageEntries);
      }

      localStorage.setItem('app_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to save log to localStorage:', error);
    }
  }

  private async processLogQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    const batch = [...this.logQueue];
    this.logQueue = [];

    try {
      // Send logs to remote endpoint in batch
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemoteBatch(batch);
      }
    } catch (error) {
      console.error('Error processing log queue:', error);
      // Re-add failed logs to queue for retry
      this.logQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendToRemoteBatch(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send log batch to remote endpoint:', error);
      throw error;
    }
  }

  // Public logging methods
  debug(message: string, component?: string, action?: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const context = this.createContext(component, action, metadata);
    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      context
    };

    if (this.config.enableConsole) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }

    this.logQueue.push(logEntry);
    this.saveToLocalStorage(logEntry);

    // Process queue asynchronously
    setTimeout(() => this.processLogQueue(), 0);
  }

  info(message: string, component?: string, action?: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const context = this.createContext(component, action, metadata);
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      context
    };

    if (this.config.enableConsole) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }

    this.logQueue.push(logEntry);
    this.saveToLocalStorage(logEntry);

    // Process queue asynchronously
    setTimeout(() => this.processLogQueue(), 0);
  }

  warn(message: string, component?: string, action?: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const context = this.createContext(component, action, metadata);
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      context
    };

    if (this.config.enableConsole) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }

    this.logQueue.push(logEntry);
    this.saveToLocalStorage(logEntry);

    // Process queue asynchronously
    setTimeout(() => this.processLogQueue(), 0);
  }

  error(message: string, error?: Error, component?: string, action?: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const context = this.createContext(component, action, metadata);
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      context,
      error,
      stack: error?.stack
    };

    if (this.config.enableConsole) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
    }

    this.logQueue.push(logEntry);
    this.saveToLocalStorage(logEntry);

    // Send error logs immediately
    this.sendToRemote(logEntry);
  }

  fatal(message: string, error?: Error, component?: string, action?: string, metadata?: Record<string, unknown>): void {
    const context = this.createContext(component, action, metadata);
    const logEntry: LogEntry = {
      level: LogLevel.FATAL,
      message,
      context,
      error,
      stack: error?.stack
    };

    if (this.config.enableConsole) {
      console.error(`[FATAL] ${this.formatMessage(LogLevel.FATAL, message, context, error)}`);
    }

    this.logQueue.push(logEntry);
    this.saveToLocalStorage(logEntry);

    // Send fatal logs immediately
    this.sendToRemote(logEntry);
  }

  // Utility methods
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  clearRequestId(): void {
    this.requestId = null;
  }

  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('app_logs');
  }

  // Performance logging
  startTimer(name: string): void {
    if (typeof window === 'undefined') return;
    performance.mark(`start_${name}`);
  }

  endTimer(name: string, component?: string, action?: string): number {
    if (typeof window === 'undefined') return 0;

    try {
      performance.mark(`end_${name}`);
      performance.measure(name, `start_${name}`, `end_${name}`);

      const measure = performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;

      this.info(`Performance: ${name}`, component, action, { duration: Math.round(duration) });

      // Clean up performance entries
      performance.clearMarks(`start_${name}`);
      performance.clearMarks(`end_${name}`);
      performance.clearMeasures(name);

      return duration;
    } catch (error) {
      this.error(`Failed to measure performance for ${name}`, error as Error, component, action);
      return 0;
    }
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance();

// Convenience functions for different log levels
export const logDebug = (message: string, component?: string, action?: string, metadata?: Record<string, unknown>) =>
  logger.debug(message, component, action, metadata);

export const logInfo = (message: string, component?: string, action?: string, metadata?: Record<string, unknown>) =>
  logger.info(message, component, action, metadata);

export const logWarn = (message: string, component?: string, action?: string, metadata?: Record<string, unknown>) =>
  logger.warn(message, component, action, metadata);

export const logError = (message: string, error?: Error, component?: string, action?: string, metadata?: Record<string, unknown>) =>
  logger.error(message, error, component, action, metadata);

export const logFatal = (message: string, error?: Error, component?: string, action?: string, metadata?: Record<string, unknown>) =>
  logger.fatal(message, error, component, action, metadata);
