/**
 * Error Boundaries Export Index
 * Central export point for all error boundary components and utilities
 */

// Main Error Boundaries
export { default as AppErrorBoundary } from './AppErrorBoundary';
export {
  AppLevelErrorBoundary,
  RouteLevelErrorBoundary,
  ComponentLevelErrorBoundary,
  AuthenticationErrorBoundary,
  NetworkErrorBoundary,
  AssessmentErrorBoundary,
  VoiceErrorBoundary,
  DatabaseErrorBoundary,
  AuthErrorBoundary,
  type AppErrorBoundaryProps,
  type RouteErrorBoundaryProps,
  type ComponentErrorBoundaryProps
} from './AppErrorBoundary';

// Route-level Error Boundaries
export { default as RouteErrorBoundary } from './RouteErrorBoundary';
export {
  DashboardErrorBoundary as RouteDashboardErrorBoundary,
  AssessmentErrorBoundary as RouteAssessmentErrorBoundary,
  AuthErrorBoundary as RouteAuthErrorBoundary,
  ProfileErrorBoundary as RouteProfileErrorBoundary,
  AdminErrorBoundary as RouteAdminErrorBoundary
} from './RouteErrorBoundary';

// Component-level Error Boundaries
export { default as ComponentErrorBoundary } from './ComponentErrorBoundary';
export {
  FormErrorBoundary,
  ChartErrorBoundary,
  ListErrorBoundary,
  MediaErrorBoundary,
  AsyncDataErrorBoundary,
  useComponentErrorHandler,
  withErrorBoundary,
  type ComponentErrorBoundaryProps
} from './ComponentErrorBoundary';

// Specialized Error Boundaries
export { default as AuthErrorBoundary } from './AuthErrorBoundary';
export { useAuthErrorHandler } from './AuthErrorBoundary';

export { default as NetworkErrorBoundary } from './NetworkErrorBoundary';
export { NetworkStatusIndicator, useNetworkErrorHandler } from './NetworkErrorBoundary';

export { default as AssessmentErrorBoundary } from './AssessmentErrorBoundary';
export { useAssessmentErrorHandler } from './AssessmentErrorBoundary';

export { default as VoiceErrorBoundary } from './VoiceErrorBoundary';
export { useVoiceErrorHandler } from './VoiceErrorBoundary';

export { default as DatabaseErrorBoundary } from './DatabaseErrorBoundary';
export { useDatabaseErrorHandler } from './DatabaseErrorBoundary';

// Testing Utilities
export {
  default as ErrorBoundaryTestSuite,
  ErrorBoundaryTestProvider,
  ErrorBoundaryTestDashboard,
  ErrorTestComponent,
  useErrorBoundaryTesting,
  useErrorTest,
  withErrorTesting,
  useErrorBoundaryPerformance,
  type ErrorType,
  type TestError
} from './ErrorBoundaryTestUtils';

// Types
export type {
  ErrorBoundaryProps,
  RouteErrorBoundaryProps as RouteErrorBoundaryPropsType,
  ComponentErrorBoundaryProps as ComponentErrorBoundaryPropsType,
  AuthErrorBoundaryProps,
  NetworkErrorBoundaryProps,
  AssessmentErrorBoundaryProps,
  VoiceErrorBoundaryProps,
  DatabaseErrorBoundaryProps
} from './AppErrorBoundary';

// Legacy Export (for backward compatibility)
export { AppErrorBoundary as ErrorBoundary } from './AppErrorBoundary';

// Convenience exports for common patterns
export const ErrorBoundary = AppErrorBoundary;
export const RouteError = RouteErrorBoundary;
export const ComponentError = ComponentErrorBoundary;

// Default export (main error boundary)
export { AppErrorBoundary as default } from './AppErrorBoundary';