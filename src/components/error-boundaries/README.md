# Error Boundary System Documentation

A comprehensive error handling system for React applications with multiple levels of error boundaries, specialized error handling, and glassmorphism design integration.

## Overview

The error boundary system provides:

- **Multi-level error handling**: App, route, and component-level boundaries
- **Specialized error types**: Authentication, network, assessment, voice, database errors
- **Automatic recovery**: Retry mechanisms with progressive backoff
- **User-friendly UI**: Glassmorphism design with clear error messages
- **Error reporting**: Integration with global error handler service
- **Testing utilities**: Development and testing tools

## Quick Start

### Basic Usage

```tsx
import { AppErrorBoundary } from '@/components/error-boundaries';

function App() {
  return (
    <AppErrorBoundary level="app" enableRecovery={true}>
      {/* Your app components */}
    </AppErrorBoundary>
  );
}
```

### Specialized Error Boundaries

```tsx
import {
  AuthErrorBoundary,
  NetworkErrorBoundary,
  AssessmentErrorBoundary,
  VoiceErrorBoundary,
  DatabaseErrorBoundary
} from '@/components/error-boundaries';

// Authentication errors
<AuthErrorBoundary fallbackPath="/auth">
  <ProtectedComponent />
</AuthErrorBoundary>

// Network errors
<NetworkErrorBoundary enableAutoRetry={true} showNetworkStatus={true}>
  <DataFetchingComponent />
</NetworkErrorBoundary>

// Assessment errors
<AssessmentErrorBoundary assessmentId="math-test" preserveProgress={true}>
  <AssessmentComponent />
</AssessmentErrorBoundary>

// Voice feature errors
<VoiceErrorBoundary showDiagnostics={true}>
  <VoiceChatComponent />
</VoiceErrorBoundary>

// Database errors
<DatabaseErrorBoundary showHealthStatus={true} enableAutoRetry={true}>
  <AdminDashboard />
</DatabaseErrorBoundary>
```

## Error Boundary Types

### AppErrorBoundary

The main error boundary component with comprehensive error handling.

**Props:**
- `level`: 'app' | 'route' | 'component' - Error boundary level
- `enableRecovery`: boolean - Enable automatic recovery (default: false)
- `maxRetries`: number - Maximum retry attempts (default: 3)
- `showDetails`: boolean - Show technical error details (default: false in production)
- `reportErrors`: boolean - Report errors to monitoring service (default: true)
- `fallback`: ReactNode - Custom fallback UI
- `gracefulFallback`: ReactNode - Fallback for component-level errors

### RouteErrorBoundary

Handles errors for specific routes with route-specific recovery options.

**Props:**
- `routeName`: string - Name of the route for error reporting
- `fallbackPath`: string - Path to redirect on error (default: '/')
- `customActions`: ReactNode - Custom action buttons
- `routeSpecificRecovery`: () => Promise<void> - Custom recovery function
- `preserveState`: boolean - Preserve component state during recovery

### ComponentErrorBoundary

Lightweight error handling for individual components.

**Props:**
- `componentName`: string - Component name for error reporting
- `silent`: boolean - Don't show error UI (default: false)
- `preserveSpace`: boolean - Maintain component layout (default: false)
- `maxRetries`: number - Maximum retry attempts (default: 2)

### Specialized Error Boundaries

#### AuthErrorBoundary
Handles authentication-related errors with session management.

**Props:**
- `fallbackPath`: string - Redirect path for auth errors
- `allowRetry`: boolean - Allow retry attempts (default: false)
- `onAuthError`: (error: Error) => void - Custom error handler

#### NetworkErrorBoundary
Handles network errors with offline detection and auto-recovery.

**Props:**
- `enableAutoRetry`: boolean - Enable automatic retry (default: false)
- `showNetworkStatus`: boolean - Show network status indicator
- `maxRetries`: number - Maximum retry attempts (default: 3)
- `retryInterval`: number - Retry interval in milliseconds (default: 5000)

#### AssessmentErrorBoundary
Handles assessment errors with progress preservation.

**Props:**
- `assessmentId`: string - Assessment identifier
- `preserveProgress`: boolean - Save progress on error (default: false)
- `onSaveProgress`: () => Promise<void> - Progress save function
- `allowRestart`: boolean - Allow assessment restart (default: true)

#### VoiceErrorBoundary
Handles voice feature errors with microphone permissions.

**Props:**
- `onPermissionRequest`: () => Promise<boolean> - Custom permission request
- `showDiagnostics`: boolean - Show audio diagnostic information
- `onRetry`: () => void - Custom retry function

#### DatabaseErrorBoundary
Handles database errors with connection health monitoring.

**Props:**
- `showHealthStatus`: boolean - Show database health indicators
- `enableAutoRetry`: boolean - Enable automatic reconnection
- `onConnectionRetry`: () => Promise<boolean> - Custom connection retry
- `onDataCheck`: () => Promise<boolean> - Database health check function

## Hooks

### useAuthErrorHandler
```tsx
const { handleAuthError, handleSessionExpiry } = useAuthErrorHandler();

// Handle authentication errors
handleAuthError(error, 'login');

// Handle session expiry
handleSessionExpiry();
```

### useNetworkErrorHandler
```tsx
const { handleNetworkError, checkNetworkStatus } = useNetworkErrorHandler();

// Handle network errors
handleNetworkError(error, 'fetchData');

// Check network status
const status = checkNetworkStatus();
```

### useAssessmentErrorHandler
```tsx
const { handleAssessmentError, saveProgress } = useAssessmentErrorHandler(assessmentId);

// Handle assessment errors
handleAssessmentError(error, 'submitAnswer', 'submission');

// Save progress
await saveProgress({ currentQuestion: 5, answers: [...] });
```

### useVoiceErrorHandler
```tsx
const { handleVoiceError, checkMicrophonePermission, requestMicrophoneAccess } = useVoiceErrorHandler();

// Handle voice errors
handleVoiceError(error, 'startRecording', 'permission');

// Check permissions
const permission = await checkMicrophonePermission();

// Request access
const granted = await requestMicrophoneAccess();
```

### useDatabaseErrorHandler
```tsx
const { handleDatabaseError, checkConnection } = useDatabaseErrorHandler();

// Handle database errors
handleDatabaseError(error, 'queryData');

// Check connection
const isConnected = await checkConnection();
```

### useComponentErrorHandler
```tsx
const { handleError } = useComponentErrorHandler('MyComponent');

// Handle component errors
handleError(error, 'render');
```

## Higher-Order Components

### withErrorBoundary
Wrap components with error boundary protection.

```tsx
const ProtectedComponent = withErrorBoundary(MyComponent, {
  componentName: 'MyComponent',
  level: 'component',
  enableRecovery: true
});
```

## Testing Utilities

### ErrorBoundaryTestProvider
Provides error testing context for development.

```tsx
<ErrorBoundaryTestProvider>
  <App />
</ErrorBoundaryTestProvider>
```

### useErrorBoundaryTesting
Access error testing functionality.

```tsx
const { errors, simulateError, clearErrors } = useErrorBoundaryTesting();

// Simulate an error
simulateError('network', 'DataComponent');

// Clear errors
clearErrors();
```

### ErrorTestComponent
Component that throws errors for testing.

```tsx
<ErrorTestComponent
  errorType="network"
  componentName="TestComponent"
  delay={1000}
/>
```

### ErrorBoundaryTestSuite
Comprehensive testing interface.

```tsx
<ErrorBoundaryTestSuite />
```

## Integration Examples

### Authentication Flow
```tsx
function AuthenticatedApp() {
  return (
    <AuthErrorBoundary fallbackPath="/auth">
      <NetworkErrorBoundary enableAutoRetry={true}>
        <Dashboard />
      </NetworkErrorBoundary>
    </AuthErrorBoundary>
  );
}
```

### Assessment System
```tsx
function AssessmentApp() {
  return (
    <AssessmentErrorBoundary
      assessmentId="math-101"
      preserveProgress={true}
      onSaveProgress={saveProgress}
    >
      <AssessmentTaker />
    </AssessmentErrorBoundary>
  );
}
```

### Voice Features
```tsx
function VoiceApp() {
  return (
    <VoiceErrorBoundary
      showDiagnostics={process.env.NODE_ENV === 'development'}
      onPermissionRequest={requestMicPermission}
    >
      <VoiceChat />
    </VoiceErrorBoundary>
  );
}
```

### Admin Dashboard
```tsx
function AdminApp() {
  return (
    <DatabaseErrorBoundary
      showHealthStatus={true}
      enableAutoRetry={true}
      onConnectionRetry={retryDatabaseConnection}
    >
      <AdminDashboard />
    </DatabaseErrorBoundary>
  );
}
```

## Error Types

The system categorizes errors into:

- **Authentication**: Login, session, permission errors
- **Network**: Connection, timeout, CORS errors
- **Database**: Connection, query, constraint errors
- **Assessment**: Question, submission, progress errors
- **Voice**: Microphone, audio processing errors
- **Validation**: Form validation, data format errors
- **Business Logic**: Application-specific rule violations
- **UI**: Component rendering, interaction errors

## Error Recovery

The system provides multiple recovery mechanisms:

1. **Automatic Retry**: Configurable retry attempts with exponential backoff
2. **User-Initiated Retry**: Manual retry buttons in error UI
3. **Graceful Degradation**: Fallback UI when components fail
4. **State Preservation**: Save progress during errors
5. **Redirect Recovery**: Navigate to safe locations

## Glassmorphism Design

All error boundaries use the application's glassmorphism design system:

- **Glass cards**: Translucent backgrounds with backdrop blur
- **Color-coded errors**: Different colors for error severity
- **Smooth animations**: Spring-based transitions
- **Responsive design**: Mobile-optimized layouts
- **Accessibility**: ARIA labels and keyboard navigation

## Performance Considerations

- **Lazy loading**: Error boundaries only load when needed
- **Minimal overhead**: Lightweight error detection
- **Efficient retry**: Exponential backoff prevents server overload
- **Memory management**: Proper cleanup of timeouts and intervals
- **Bundle optimization**: Tree-shaking of unused components

## Best Practices

1. **Use appropriate levels**: App-level for critical errors, component-level for non-critical
2. **Configure retries**: Balance user experience with server load
3. **Preserve state**: Save user progress when possible
4. **Provide clear feedback**: Explain what happened and how to recover
5. **Test error scenarios**: Use testing utilities in development
6. **Monitor errors**: Track error rates and recovery success
7. **Update regularly**: Keep error handling logic current with application changes

## Troubleshooting

### Common Issues

**Error boundary not catching errors:**
- Ensure errors are thrown in render or lifecycle methods
- Check that error boundaries are properly nested
- Verify error event listeners are working

**Retry not working:**
- Check network connectivity
- Verify retry configuration
- Monitor server logs for retry attempts

**UI not showing:**
- Check glassmorphism CSS classes
- Verify component hierarchy
- Test with showDetails enabled

### Debug Mode

Enable debug information in development:

```tsx
<AppErrorBoundary
  showDetails={process.env.NODE_ENV === 'development'}
  reportErrors={true}
>
  {/* ... */}
</AppErrorBoundary>
```

### Performance Monitoring

Track error boundary performance:

```tsx
const { metrics, trackError } = useErrorBoundaryPerformance();

// Track error handling
const endTracking = trackError();
// ... error handling logic
endTracking();
```

## Contributing

When adding new error boundary types:

1. Follow the established patterns
2. Add comprehensive error type detection
3. Include appropriate recovery mechanisms
4. Write tests for error scenarios
5. Update documentation
6. Consider accessibility and i18n support

## License

This error boundary system is part of the application's core infrastructure and follows the same license terms.