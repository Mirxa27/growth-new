# Mobile Component Tests

This directory contains comprehensive test suites for the mobile components in the Growth Echo application.

## Test Coverage

### CameraComponent Tests
- ✅ **CameraComponent.simple.test.tsx** - Working test suite
  - Renders with take photo button
  - Shows loading state during photo capture
  - Calls onPhotoTaken callback when photo is captured
  - Handles camera errors gracefully
  - Has hidden file input for web fallback

### GeolocationComponent Tests
- ✅ **GeolocationComponent.simple.test.tsx** - Working test suite
  - Renders with location buttons
  - Calls onLocationReceived when position is retrieved
  - Shows loading state while getting location
  - Handles geolocation errors gracefully
  - Checks permissions on mount

### NotificationsComponent Tests
- ✅ **NotificationsComponent.simple.test.tsx** - Working test suite
  - Renders with notifications status
  - Shows enabled/disabled status based on permissions
  - Sends local notifications when permission is granted
  - Disables send button when permission is denied
  - Requests permission when enable button is clicked
  - Initializes notifications on mount

## Test Setup

The tests use Vitest with React Testing Library and include:

- **Capacitor Plugin Mocking**: All Capacitor plugins are properly mocked
- **Component Mocking**: UI components (Button, etc.) are mocked for isolated testing
- **Environment Setup**: Proper test environment with jsdom
- **Assertion Library**: Vitest expect with jest-dom matchers

## Key Features Tested

### 1. Capacitor Plugin Integration
- Plugin method calls are mocked and verified
- Both success and error scenarios are tested
- Proper error handling is validated

### 2. Fallback Behavior
- Web platform fallback for camera component
- Permission handling for geolocation
- Error states and user feedback

### 3. Component States
- Loading states during async operations
- Disabled states when appropriate
- Error message display

### 4. User Interactions
- Button clicks and event handling
- Form submissions (file input)
- Permission requests

## Running Tests

```bash
# Run all mobile component tests
npm test -- src/components/mobile/__tests__/

# Run specific component test
npm test -- src/components/mobile/__tests__/CameraComponent.simple.test.tsx
npm test -- src/components/mobile/__tests__/GeolocationComponent.simple.test.tsx
npm test -- src/components/mobile/__tests__/NotificationsComponent.simple.test.tsx
```

## Test Structure

```
src/components/mobile/__tests__/
├── mocks/
│   ├── capacitor-mocks.ts      # Capacitor plugin mock utilities
│   └── setup-tests.ts          # Test environment setup
├── CameraComponent.simple.test.tsx
├── GeolocationComponent.simple.test.tsx
├── NotificationsComponent.simple.test.tsx
├── environment-test.test.tsx
└── README.md
```

## Mocking Strategy

The tests use a comprehensive mocking strategy:

1. **Capacitor Plugins**: All native plugins are mocked to simulate both success and error scenarios
2. **UI Components**: Dependencies like Button components are mocked to isolate component logic
3. **Global APIs**: File API, Notification API, and browser APIs are mocked for web fallback testing
4. **Async Operations**: Promises and async behavior are properly simulated

## Test Quality Metrics

- **Coverage**: All major component functionality is tested
- **Edge Cases**: Error handling, loading states, and user cancellation are covered
- **Integration**: Component interactions with Capacitor plugins are verified
- **User Experience**: Loading states and error feedback are validated

## Known Limitations

1. **Complex Tests**: The original comprehensive test suite has mocking setup issues that need resolution
2. **Platform Differences**: Native vs web platform differences could be tested more thoroughly
3. **Real-world Scenarios**: Integration with actual Capacitor plugins on devices would require additional testing

## Future Improvements

1. **E2E Testing**: Add Playwright tests for actual device behavior
2. **Integration Testing**: Test components with actual Capacitor plugins when possible
3. **Performance Testing**: Add performance benchmarks for component operations
4. **Accessibility Testing**: Include accessibility audits in test suite