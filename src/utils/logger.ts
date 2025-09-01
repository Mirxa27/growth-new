/**
 * Logger Service
 * Centralized logging with environment-aware output
 */

import { env } from '@/config/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  category?: string;
  data?: any;
  timestamp: Date;
  stack?: string;
}

class Logger {
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    if (!env.logging.enabled) return LogLevel.ERROR;
    
    switch (env.logging.level) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return env.logging.enabled && level >= this.currentLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const category = entry.category ? `[${entry.category}]` : '';
    return `[${timestamp}] ${levelStr} ${category} ${entry.message}`;
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private log(level: LogLevel, message: string, category?: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      category,
      data,
      timestamp: new Date(),
    };

    // Add stack trace for errors
    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    this.addToHistory(entry);

    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(entry);

    // Output to console based on level
    switch (level) {
      case LogLevel.DEBUG:
        if (env.isDevelopment()) {
          console.debug(formattedMessage, data || '');
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${formattedMessage}`, data || '');
        // In production, send to monitoring service
        if (env.isProduction()) {
          this.sendToMonitoring(entry);
        }
        break;
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // Implement integration with monitoring service
    // e.g., Sentry, LogRocket, DataDog, etc.
    try {
      // Example: Send to monitoring endpoint
      if (env.isProduction()) {
        fetch('/api/monitoring/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Fail silently to avoid infinite loop
        });
      }
    } catch {
      // Fail silently
    }
  }

  // Public logging methods
  debug(message: string, category?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, category, data);
  }

  info(message: string, category?: string, data?: any): void {
    this.log(LogLevel.INFO, message, category, data);
  }

  warn(message: string, category?: string, data?: any): void {
    this.log(LogLevel.WARN, message, category, data);
  }

  error(message: string, category?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, category, data);
  }

  critical(message: string, category?: string, data?: any): void {
    this.log(LogLevel.CRITICAL, message, category, data);
  }

  // Utility methods
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.table(data);
    }
  }

  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  clear(): void {
    if (env.isDevelopment()) {
      console.clear();
    }
    this.logHistory = [];
  }

  getHistory(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  // Performance monitoring
  measure(name: string, fn: () => any): any {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`, 'Performance');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, 'Performance', error);
      throw error;
    }
  }

  async measureAsync(name: string, fn: () => Promise<any>): Promise<any> {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`Async Performance: ${name} took ${duration.toFixed(2)}ms`, 'Performance');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Async Performance: ${name} failed after ${duration.toFixed(2)}ms`, 'Performance', error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogEntry };