import { vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock localStorage globally for all store tests
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn((index: number) => Object.keys(store)[index]),
  };
};

// Setup global mocks
Object.defineProperty(window, 'localStorage', {
  value: createMockLocalStorage(),
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Helper function to reset store state between tests
export const resetStoreState = (store: any) => {
  act(() => {
    if (typeof store.getState().resetAllState === 'function') {
      store.getState().resetAllState();
    } else if (typeof store.getState().resetAssessment === 'function') {
      store.getState().resetAssessment();
    }
  });
};

// Helper to create mock assessment data
export const createMockAssessment = (overrides = {}) => ({
  id: 'assessment-123',
  title: 'Test Assessment',
  description: 'Test Description',
  category: 'test',
  difficulty: 'beginner' as const,
  time_limit: 30,
  question_count: 5,
  created_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock questions
export const createMockQuestions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    assessment_id: 'assessment-123',
    question_text: `Question ${i + 1}`,
    question_type: 'multiple_choice' as const,
    options: ['Option A', 'Option B', 'Option C'],
    required: true,
    order: i,
  }));

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  personality_type: 'INTJ',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock assessment attempt
export const createMockAttempt = (overrides = {}) => ({
  id: 'attempt-123',
  assessment_id: 'assessment-123',
  user_id: 'user-123',
  score: 85,
  max_score: 100,
  status: 'in_progress' as const,
  started_at: '2023-01-01T00:00:00Z',
  time_spent: 300,
  ...overrides,
});

// Performance test utilities
export const measurePerformance = (operation: () => void, maxTimeMs: number = 100) => {
  const start = performance.now();
  operation();
  const end = performance.now();
  const duration = end - start;

  if (duration > maxTimeMs) {
    console.warn(`Performance warning: Operation took ${duration.toFixed(2)}ms (max: ${maxTimeMs}ms)`);
  }

  return { duration, passed: duration <= maxTimeMs };
};

// Memory usage helper (for performance tests)
export const getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory;
  }
  return null;
};

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to flush all promises
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));