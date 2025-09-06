/**
 * Error Boundary Test Utilities
 * Common utilities and helpers for testing error boundary components
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, MockInstance } from 'vitest';

// Test error types
export class TestError extends Error {
  constructor(message: string, public type: string = 'TestError') {
    super(message);
    this.name = type;
  }
}

export class NetworkTestError extends TestError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NetworkError');
  }
}

export class AuthTestError extends TestError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AuthenticationError');
  }
}

export class DatabaseTestError extends TestError {
  constructor(message: string = 'Database error occurred') {
    super(message, 'DatabaseError');
  }
}

export class AssessmentTestError extends TestError {
  constructor(message: string = 'Assessment processing failed') {
    super(message, 'AssessmentError');
  }
}

export class VoiceTestError extends TestError {
  constructor(message: string = 'Voice processing failed') {
    super(message, 'VoiceError');
  }
}

export class ChunkLoadTestError extends TestError {
  constructor(message: string = 'Chunk loading failed') {
    super(message, 'ChunkLoadError');
  }
}

// Mock ErrorInfo interface
export interface MockErrorInfo {
  componentStack: string;
}

export function createMockErrorInfo(componentStack: string = 'TestComponent\n  at TestComponent'): MockErrorInfo {
  return { componentStack };
}

// Test components that throw errors
export const ErrorThrowingComponent: React.FC<{ error?: Error; shouldThrow?: boolean }> = ({
  error = new TestError('Test error'),
  shouldThrow = true
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>Success</div>;
};

export const NetworkErrorComponent: React.FC = () => {
  throw new NetworkTestError();
};

export const AuthErrorComponent: React.FC = () => {
  throw new AuthTestError();
};

export const DatabaseErrorComponent: React.FC = () => {
  throw new DatabaseTestError();
};

export const AsyncErrorComponent: React.FC<{ delay?: number }> = ({ delay = 100 }) => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldThrow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (shouldThrow) {
    throw new TestError('Async error occurred');
  }

  return <div>Loading...</div>;
};

// Custom renderer that includes common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
}

export function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  return render(ui, {
    ...options,
    // Add providers here if needed
  });
}

// Wait for async operations
export const waitForAsyncError = async (ms: number = 100): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

// Mock timers utilities
export const setupMockTimers = () => {
  vi.useFakeTimers();
};

export const cleanupMockTimers = () => {
  vi.useRealTimers();
};

// Mock window.location
export const mockWindowLocation = {
  href: 'http://localhost:3000/test',
  pathname: '/test',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  reload: vi.fn(),
  assign: vi.fn(),
  replace: vi.fn(),
};

export const setupWindowLocationMock = () => {
  Object.defineProperty(window, 'location', {
    value: mockWindowLocation,
    writable: true,
  });
};

// Mock navigator.onLine
export const mockNavigatorOnline = {
  onLine: true,
  connection: null,
};

export const setupNavigatorOnlineMock = (isOnline: boolean = true) => {
  mockNavigatorOnline.onLine = isOnline;
  Object.defineProperty(window.navigator, 'onLine', {
    value: isOnline,
    writable: true,
  });
};

// Mock localStorage
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
  };
};

export const setupLocalStorageMock = () => {
  const mock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  });
  return mock;
};

// Mock sessionStorage
export const createSessionStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
  };
};

export const setupSessionStorageMock = () => {
  const mock = createSessionStorageMock();
  Object.defineProperty(window, 'sessionStorage', {
    value: mock,
    writable: true,
  });
  return mock;
};

// Test helpers
export const expectErrorToBeCaught = (error: Error, boundaryInstance: any) => {
  expect(boundaryInstance.state.hasError).toBe(true);
  expect(boundaryInstance.state.error).toBe(error);
  expect(boundaryInstance.state.errorId).toMatch(/^ERR_/);
};

export const expectNoError = (boundaryInstance: any) => {
  expect(boundaryInstance.state.hasError).toBe(false);
  expect(boundaryInstance.state.error).toBeUndefined();
};

export const expectRetryCount = (boundaryInstance: any, expectedCount: number) => {
  expect(boundaryInstance.state.retryCount).toBe(expectedCount);
};

export const expectRecoveringState = (boundaryInstance: any, isRecovering: boolean) => {
  expect(boundaryInstance.state.isRecovering).toBe(isRecovering);
};

// Event simulation helpers
export const simulateOnlineEvent = () => {
  window.dispatchEvent(new Event('online'));
};

export const simulateOfflineEvent = () => {
  window.dispatchEvent(new Event('offline'));
};

export const simulateConnectionChangeEvent = () => {
  if ('connection' in window.navigator) {
    const conn = (window.navigator as any).connection;
    if (conn) {
      conn.dispatchEvent(new Event('change'));
    }
  }
};

// Mock performance utilities
export const mockPerformanceNow = vi.fn(() => 1000000);

export const setupPerformanceMock = () => {
  Object.defineProperty(window, 'performance', {
    value: {
      now: mockPerformanceNow,
    },
    writable: true,
  });
};

// Console error suppression for expected errors
export const suppressConsoleErrors = () => {
  const originalError = console.error;
  console.error = vi.fn();
  return () => {
    console.error = originalError;
  };
};

// Re-exports
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';