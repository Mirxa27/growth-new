import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../index';
import { useAssessmentStore, useAssessmentTimer, useAssessmentAutoSave } from '../assessmentStore';

// Helper to render Zustand store hooks
export const renderStoreHook = <T,>(
  hook: () => T,
  options?: {
    initialStoreState?: any;
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  }
) => {
  return renderHook(hook, options);
};

// Helper to test store actions
export const testStoreAction = async <T extends (...args: any[]) => any>(
  action: T,
  args: Parameters<T>,
  expectedState: (state: ReturnType<typeof useAppStore.getState>) => void,
  store = useAppStore
) => {
  await act(async () => {
    await (store.getState()[action.name] as T)(...args);
  });

  const state = store.getState();
  expectedState(state);
};

// Helper to test async store actions
export const testAsyncStoreAction = async <T extends (...args: any[]) => Promise<any>>(
  action: T,
  args: Parameters<T>,
  expectedState: (state: ReturnType<typeof useAppStore.getState>) => void,
  store = useAppStore
) => {
  await act(async () => {
    await (store.getState()[action.name] as T)(...args);
  });

  const state = store.getState();
  expectedState(state);
};

// Helper to test selectors
export const testSelector = <T extends (state: any) => any>(
  selector: T,
  state: Parameters<T>[0],
  expected: ReturnType<T>
) => {
  const result = selector(state);
  expect(result).toEqual(expected);
};

// Helper to test multiple state changes
export const testStateChanges = async (
  actions: Array<() => void>,
  expectedStates: Array<(state: ReturnType<typeof useAppStore.getState>) => void>
) => {
  for (let i = 0; i < actions.length; i++) {
    await act(async () => {
      actions[i]();
    });

    if (expectedStates[i]) {
      const state = useAppStore.getState();
      expectedStates[i](state);
    }
  }
};

// Helper to create performance test
export const createPerformanceTest = (
  testName: string,
  operation: () => void,
  maxDurationMs: number = 100,
  iterations: number = 100
) => {
  it(testName, () => {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      operation();
      const end = performance.now();
      durations.push(end - start);
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    console.log(`${testName} - Average: ${averageDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);

    expect(averageDuration).toBeLessThan(maxDurationMs);
    expect(maxDuration).toBeLessThan(maxDurationMs * 2); // Allow some variance
  });
};

// Helper to test edge cases
export const testEdgeCase = (
  description: string,
  action: () => void,
  expectedBehavior: () => void,
  shouldThrow = false
) => {
  it(description, () => {
    if (shouldThrow) {
      expect(() => {
        act(() => {
          action();
        });
      }).toThrow();
    } else {
      expect(() => {
        act(() => {
          action();
        });
      }).not.toThrow();

      expectedBehavior();
    }
  });
};

// Helper to test persistence
export const testPersistence = (
  key: string,
  action: () => void,
  expectedPersistedData: any
) => {
  it(`should persist data to localStorage with key ${key}`, () => {
    // Clear localStorage
    localStorage.clear();

    act(() => {
      action();
    });

    const persistedData = localStorage.getItem(key);
    expect(persistedData).not.toBeNull();

    const parsedData = JSON.parse(persistedData!);
    expect(parsedData).toMatchObject(expectedPersistedData);
  });
};

// Helper to test store reset functionality
export const testStoreReset = (
  resetAction: () => void,
  initialState: any,
  modifiedStateAction: () => void
) => {
  it('should reset store to initial state', () => {
    // Store initial state
    const initialStateSnapshot = JSON.parse(JSON.stringify(initialState));

    // Modify state
    act(() => {
      modifiedStateAction();
    });

    // Reset state
    act(() => {
      resetAction();
    });

    // Verify reset
    const resetState = useAppStore.getState();
    expect(JSON.parse(JSON.stringify(resetState))).toEqual(initialStateSnapshot);
  });
};

// Helper to test timer functionality
export const testTimerHook = (
  hook: () => any,
  actions: { start: () => void; stop?: () => void },
  expectations: {
    initialTime: any;
    afterStart: any;
    afterInterval: any;
    afterStop?: any;
  }
) => {
  describe('Timer Hook', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should initialize correctly', () => {
      const { result } = renderHook(hook);
      expect(result.current).toMatchObject(expectations.initialTime);
    });

    it('should start timer', () => {
      const { result } = renderHook(hook);

      act(() => {
        actions.start();
      });

      expect(result.current).toMatchObject(expectations.afterStart);
    });

    it('should update timer after interval', () => {
      const { result } = renderHook(hook);

      act(() => {
        actions.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current).toMatchObject(expectations.afterInterval);
    });

    if (actions.stop && expectations.afterStop) {
      it('should stop timer', () => {
        const { result } = renderHook(hook);

        act(() => {
          actions.start();
        });

        act(() => {
          vi.advanceTimersByTime(1000);
        });

        act(() => {
          actions.stop!();
        });

        act(() => {
          vi.advanceTimersByTime(1000);
        });

        expect(result.current).toMatchObject(expectations.afterStop);
      });
    }
  });
};

// Helper to test auto-save functionality
export const testAutoSave = (
  hook: () => any,
  triggerAction: () => void,
  localStorageKey: string,
  saveInterval: number = 30000
) => {
  describe('Auto-save functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      localStorage.clear();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-save after interval', () => {
      const { result } = renderHook(hook);

      act(() => {
        triggerAction();
      });

      // Clear any existing localStorage calls
      vi.clearAllMocks();

      act(() => {
        vi.advanceTimersByTime(saveInterval);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        localStorageKey,
        expect.any(String)
      );
    });

    it('should auto-save periodically', () => {
      const { result } = renderHook(hook);

      act(() => {
        triggerAction();
      });

      vi.clearAllMocks();

      // Advance by multiple intervals
      act(() => {
        vi.advanceTimersByTime(saveInterval * 3);
      });

      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should include timestamp in saved data', () => {
      const { result } = renderHook(hook);

      act(() => {
        triggerAction();
      });

      vi.clearAllMocks();

      act(() => {
        vi.advanceTimersByTime(saveInterval);
      });

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('timestamp');
      expect(new Date(savedData.timestamp)).toBeInstanceOf(Date);
    });
  });
};

// Helper to test store subscribers
export const testStoreSubscriber = (
  store: any,
  action: () => void,
  expectedChanges: number
) => {
  it('should notify subscribers on state change', () => {
    let callCount = 0;
    const unsubscribe = store.subscribe(() => {
      callCount++;
    });

    act(() => {
      action();
    });

    expect(callCount).toBe(expectedChanges);
    unsubscribe();
  });
};

// Helper to test store selectors with memoization
export const testSelectorMemoization = (
  selector: (state: any) => any,
  stateChanges: Array<() => void>,
  shouldRecompute: boolean[]
) => {
  it('should properly memoize selector results', () => {
    let computationCount = 0;
    const memoizedSelector = (state: any) => {
      computationCount++;
      return selector(state);
    };

    let lastResult: any;

    stateChanges.forEach((change, index) => {
      act(() => {
        change();
      });

      const newResult = memoizedSelector(useAppStore.getState());

      if (shouldRecompute[index]) {
        expect(newResult).not.toEqual(lastResult);
        expect(computationCount).toBeGreaterThan(index);
      } else {
        expect(newResult).toEqual(lastResult);
      }

      lastResult = newResult;
    });
  });
};

// Helper to test store hydration from localStorage
export const testStoreHydration = (
  localStorageKey: string,
  persistedData: any,
  expectedState: any
) => {
  it('should hydrate store from localStorage', () => {
    // Set up localStorage with persisted data
    localStorage.setItem(localStorageKey, JSON.stringify(persistedData));

    // Reset store to test hydration
    act(() => {
      useAppStore.getState().resetAllState();
    });

    // Trigger hydration (this would happen on app initialization)
    const state = useAppStore.getState();

    expect(state).toMatchObject(expectedState);
  });
};

// Helper to test store serialization
export const testStoreSerialization = (
  state: any,
  expectedSerializable: boolean = true
) => {
  it('should be serializable', () => {
    try {
      const serialized = JSON.stringify(state);
      const parsed = JSON.parse(serialized);

      if (expectedSerializable) {
        expect(parsed).toEqual(state);
      } else {
        // For non-serializable states, we just ensure it doesn't throw
        expect(serialized).toBeDefined();
      }
    } catch (error) {
      if (expectedSerializable) {
        throw error;
      }
    }
  });
};

// Helper to test store with concurrent operations
export const testConcurrentOperations = (
  operations: Array<() => Promise<void>>,
  expectedFinalState: any
) => {
  it('should handle concurrent operations correctly', async () => {
    await act(async () => {
      await Promise.all(operations);
    });

    const state = useAppStore.getState();
    expect(state).toMatchObject(expectedFinalState);
  });
};

// Export common test patterns
export const testPatterns = {
  action: testStoreAction,
  asyncAction: testAsyncStoreAction,
  selector: testSelector,
  stateChanges: testStateChanges,
  performance: createPerformanceTest,
  edgeCase: testEdgeCase,
  persistence: testPersistence,
  reset: testStoreReset,
  timer: testTimerHook,
  autoSave: testAutoSave,
  subscriber: testStoreSubscriber,
  memoization: testSelectorMemoization,
  hydration: testStoreHydration,
  serialization: testStoreSerialization,
  concurrent: testConcurrentOperations,
};