// Test entry point for mobile components
// Export all test utilities and mock configurations

export * from './mocks/capacitor-mocks';
export * from './mocks/setup-tests';

// Test component imports
export { CameraComponent } from '../CameraComponent';
export { GeolocationComponent } from '../GeolocationComponent';
export { NotificationsComponent } from '../NotificationsComponent';

// Re-export common testing utilities
export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';