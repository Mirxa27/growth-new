# Zustand Store Test Suite

This directory contains comprehensive test suites for the Zustand state management stores in the Growth Echo application.

## Test Files

### 1. `useAppStore.test.ts`
Tests the main application store (`useAppStore`) which handles:
- User state management (authentication, profile data)
- Assessment state (current assessment, attempts)
- UI settings (theme, notifications, accessibility)
- App state (online status, last sync)
- Persistence functionality
- Selector functions

**Key Test Categories:**
- State mutations and updates
- User authentication flow
- Settings management
- Assessment attempt tracking
- Persistence to localStorage
- Selector functions
- Performance with large datasets

### 2. `useAssessmentStore.test.ts`
Tests the assessment-specific store (`useAssessmentStore`) which handles:
- Assessment session management
- Question navigation
- Answer tracking with timestamps
- Timer functionality
- Submission process
- Auto-save functionality

**Key Test Categories:**
- Assessment lifecycle (start, pause, submit, end)
- Question navigation and answering
- Timer management and auto-submission
- Progress calculation
- Answer persistence and auto-save
- Timer hooks (`useAssessmentTimer`)
- Auto-save hooks (`useAssessmentAutoSave`)

### 3. `integration.test.ts`
Tests the integration between both stores:
- State synchronization between stores
- Combined assessment workflows
- Shared data consistency
- Cross-store operations

**Key Test Categories:**
- Complete user assessment flows
- Store state consistency
- Concurrent operations
- Real-world scenarios

### 4. `setup.ts`
Test setup file that provides:
- Mocked localStorage
- Mocked browser APIs (matchMedia, navigator)
- Performance utilities
- Mock data generators
- Common test helpers

### 5. `utils.ts`
Utility functions for testing:
- Store action testing helpers
- Selector testing utilities
- Performance measurement tools
- Integration test patterns
- Memory management helpers

## Test Coverage

### User State Management
- ✅ User login/logout flow
- ✅ Profile updates
- ✅ Authentication state
- ✅ Loading states
- ✅ State reset functionality

### Assessment State Management
- ✅ Assessment session lifecycle
- ✅ Question navigation
- ✅ Answer tracking with timestamps
- ✅ Timer functionality
- ✅ Auto-submission on timeout
- ✅ Progress calculation
- ✅ Result handling

### UI Settings
- ✅ Theme management (light/dark/auto)
- ✅ Notification preferences
- ✅ Accessibility settings
- ✅ Voice settings
- ✅ UI state toggles (sidebar, mobile menu)

### Persistence
- ✅ localStorage integration
- ✅ Data serialization
- ✅ State hydration
- ✅ Partial persistence (whitelisted fields)
- ✅ Auto-save functionality

### Selectors
- ✅ User selectors (display name, login status)
- ✅ Assessment selectors (current attempt, average score)
- ✅ UI selectors (theme detection)
- ✅ Memoization testing

### Performance
- ✅ Rapid state updates
- ✅ Large dataset handling
- ✅ Memory usage monitoring
- ✅ Selector performance
- ✅ Concurrent operations

### Error Handling
- ✅ Invalid input handling
- ✅ Network failure scenarios
- ✅ Data corruption recovery
- ✅ Edge case coverage

### Integration
- ✅ Cross-store communication
- ✅ State synchronization
- ✅ Complete workflow testing
- ✅ Consistency validation

## Test Patterns

### State Testing
```typescript
// Basic state update test
it('should update user state', () => {
  act(() => {
    useAppStore.getState().setUser(mockUser);
  });

  expect(useAppStore.getState().user).toEqual(mockUser);
});
```

### Async Action Testing
```typescript
// Async action with error handling
it('should handle submission errors', async () => {
  mockSubmit.mockRejectedValue(new Error('Failed'));

  await expect(
    useAssessmentStore.getState().submitAssessment()
  ).rejects.toThrow('Failed');
});
```

### Persistence Testing
```typescript
// localStorage persistence test
it('should persist user data', () => {
  act(() => {
    useAppStore.getState().setUser(mockUser);
  });

  expect(localStorage.setItem).toHaveBeenCalledWith(
    'growth-echo-storage',
    expect.stringContaining('"user"')
  );
});
```

### Performance Testing
```typescript
// Performance measurement
it('should handle rapid updates efficiently', () => {
  const start = performance.now();

  for (let i = 0; i < 100; i++) {
    act(() => {
      useAppStore.getState().setLoading(i % 2 === 0);
    });
  }

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

### Selector Testing
```typescript
// Selector memoization test
it('should memoize selector results', () => {
  const { userSelectors } = useAppStore.getState();

  const result1 = userSelectors.userDisplayName(state);
  const result2 = userSelectors.userDisplayName(state);

  expect(result1).toBe(result2); // Should be memoized
});
```

## Running Tests

### All Store Tests
```bash
npm test -- src/store/__tests__
```

### Specific Test File
```bash
npm test -- src/store/__tests__/useAppStore.test.ts
```

### With Coverage
```bash
npm run test:unit -- --coverage src/store/__tests__
```

### Watch Mode
```bash
npm run test:unit -- --watch src/store/__tests__
```

## Mocking Strategy

### localStorage
- Complete mock with full API
- Tracks all storage operations
- Supports persistence testing scenarios

### Browser APIs
- Mocked `matchMedia` for theme testing
- Mocked `navigator.onLine` for offline testing
- Mocked timers for interval-based operations

### React Hooks
- Mocked React for non-hook testing scenarios
- Utilities for testing hook behavior indirectly

## Best Practices

1. **Test Isolation**: Each test resets store state
2. **Mocking**: External dependencies are mocked
3. **Performance**: Tests include performance benchmarks
4. **Coverage**: Edge cases and error scenarios covered
5. **Integration**: Cross-store interactions tested
6. **Realism**: Tests mirror real-world usage patterns

## Test Data Generation

The test suite includes utilities for generating:
- Mock users with various personality types
- Mock assessments with different difficulties
- Mock questions with all supported types
- Mock assessment attempts with various states
- Large datasets for performance testing

## Future Enhancements

- E2E integration tests with actual UI components
- Stress testing with concurrent users
- Network simulation for offline scenarios
- Database integration testing
- Accessibility testing for store-driven UI changes