/**
 * Logger Service Tests
 * Testing structured logging functionality and environment awareness
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, createLogger, LogLevel } from './logger.service';

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
};

Object.assign(console, mockConsole);

describe('LoggingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.clearLogs();
  });

  describe('Basic Logging', () => {
    it('should log error messages with context', () => {
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        metadata: { testData: 'value' }
      };

      logger.error('Test error message', context);

      expect(mockConsole.error).toHaveBeenCalled();
      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs).toHaveLength(1);
      expect(recentLogs[0].level).toBe(LogLevel.ERROR);
      expect(recentLogs[0].message).toBe('Test error message');
      expect(recentLogs[0].context).toEqual(context);
    });

    it('should log warning messages', () => {
      logger.warn('Test warning');
      
      expect(mockConsole.warn).toHaveBeenCalled();
      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].level).toBe(LogLevel.WARN);
    });

    it('should log info messages', () => {
      logger.info('Test info');
      
      expect(mockConsole.info).toHaveBeenCalled();
      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].level).toBe(LogLevel.INFO);
    });

    it('should only log debug messages in development', () => {
      logger.debug('Test debug');
      
      // Debug logging depends on environment
      const recentLogs = logger.getRecentLogs();
      if (import.meta.env.DEV) {
        expect(mockConsole.debug).toHaveBeenCalled();
        expect(recentLogs.some(log => log.level === LogLevel.DEBUG)).toBe(true);
      } else {
        expect(recentLogs.some(log => log.level === LogLevel.DEBUG)).toBe(false);
      }
    });
  });

  describe('Context Logger', () => {
    it('should create context logger with predefined context', () => {
      const context = {
        component: 'TestComponent',
        action: 'testAction'
      };

      const contextLogger = createLogger(context);
      contextLogger.error('Test error', { additionalData: 'value' });

      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].context?.component).toBe('TestComponent');
      expect(recentLogs[0].context?.action).toBe('testAction');
      expect(recentLogs[0].context?.metadata?.additionalData).toBe('value');
    });
  });

  describe('Log Management', () => {
    it('should maintain log buffer within size limits', () => {
      // Log more than buffer size
      for (let i = 0; i < 150; i++) {
        logger.info(`Test message ${i}`);
      }

      const recentLogs = logger.getRecentLogs();
      expect(recentLogs.length).toBeLessThanOrEqual(100);
    });

    it('should provide accurate log statistics', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      logger.warn('Warning 1');
      logger.info('Info 1');

      const stats = logger.getStats();
      expect(stats.errorCount).toBe(2);
      expect(stats.warnCount).toBe(1);
      expect(stats.infoCount).toBe(1);
      expect(stats.totalLogs).toBe(4);
    });

    it('should clear logs when requested', () => {
      logger.error('Test error');
      logger.clearLogs();

      const recentLogs = logger.getRecentLogs();
      expect(recentLogs).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Error objects in context', () => {
      const testError = new Error('Test error object');
      logger.error('Error with object', { error: testError });

      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].context?.error).toBe(testError);
    });

    it('should format timestamps correctly', () => {
      logger.info('Test message');

      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Source Detection', () => {
    it('should detect source information', () => {
      logger.info('Test message for source detection');

      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].source).toBeDefined();
      expect(recentLogs[0].source).not.toBe('unknown');
    });
  });

  describe('Environment Awareness', () => {
    it('should set correct environment in log entries', () => {
      logger.info('Environment test');

      const recentLogs = logger.getRecentLogs(1);
      expect(['production', 'development']).toContain(recentLogs[0].environment);
    });

    it('should include version information', () => {
      logger.info('Version test');

      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs[0].version).toBeDefined();
      expect(typeof recentLogs[0].version).toBe('string');
    });
  });
});
