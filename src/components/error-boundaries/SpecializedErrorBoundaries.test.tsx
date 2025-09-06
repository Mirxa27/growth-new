/**
 * Specialized Error Boundaries Tests
 * Testing AuthErrorBoundary, NetworkErrorBoundary, AssessmentErrorBoundary, VoiceErrorBoundary, and DatabaseErrorBoundary
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('@/services/error/global-error-handler.service', () => ({
  globalErrorHandler: {
    handleError: vi.fn(),
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  ErrorCategory: {
    UI: 'UI',
    NETWORK: 'NETWORK',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    DATABASE: 'DATABASE',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC',
    EXTERNAL_API: 'EXTERNAL_API',
    UNKNOWN: 'UNKNOWN',
  },
}));

vi.mock('@/services/logging/logger.service', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2 className={className} {...props}>
      {children}
    </h2>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} {...props}>
      {children}
    </p>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  Lock: () => <div data-testid="lock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  LogIn: () => <div data-testid="login-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Home: () => <div data-testid="home-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  MicOff: () => <div data-testid="mic-off-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Headphones: () => <div data-testid="headphones-icon" />,
  Volume2: () => <div data-testid="volume-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  CloudOff: () => <div data-testid="cloud-off-icon" />,
}));

// Test utilities
const createMockError = (message: string, name: string = 'Error') => {
  const error = new Error(message);
  error.name = name;
  return error;
};

const createMockErrorInfo = (componentStack: string = 'TestComponent\n  at TestComponent') => ({
  componentStack,
});

describe('Specialized Error Boundaries', () => {
  let originalWindowLocation: typeof window.location;
  let originalWindowHistory: typeof window.history;
  let originalNavigator: typeof navigator;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock window.location
    originalWindowLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        pathname: '/test',
        search: '',
        hash: '',
        origin: 'http://localhost:3000',
        reload: vi.fn(),
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
    });

    // Mock window.history
    originalWindowHistory = window.history;
    Object.defineProperty(window, 'history', {
      value: {
        length: 2,
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn(),
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      writable: true,
    });

    // Mock navigator
    originalNavigator = window.navigator;
    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        permissions: {
          query: vi.fn(),
        },
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
      },
      writable: true,
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();

    // Restore all mocks
    Object.defineProperty(window, 'location', {
      value: originalWindowLocation,
      writable: true,
    });

    Object.defineProperty(window, 'history', {
      value: originalWindowHistory,
      writable: true,
    });

    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    });

    consoleErrorSpy.mockRestore();
  });

  describe('AuthErrorBoundary', () => {
    it('should catch authentication errors and render auth-specific UI', async () => {
      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const error = createMockError('Token expired', 'AuthenticationError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AuthErrorBoundary({
        children: <div>Auth content</div>,
        fallbackPath: '/auth'
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'AUTH_ERR_token123',
        isRetrying: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Your session token is invalid or has expired')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
      expect(screen.getByText('Clear Session & Login')).toBeInTheDocument();
    });

    it('should handle retry mechanism with loading state', async () => {
      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const error = createMockError('Auth retry error', 'AuthenticationError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AuthErrorBoundary({
        children: <div>Auth content</div>,
        allowRetry: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'AUTH_ERR_retry123',
        isRetrying: true,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      const retryButton = screen.getByText('Retrying...');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
    });

    it('should clear session and redirect to auth', () => {
      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const error = createMockError('Session clear error', 'AuthenticationError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AuthErrorBoundary({
        children: <div>Auth content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'AUTH_ERR_clear123',
        isRetrying: false,
      };

      boundary.handleClearAuth();

      expect(window.localStorage.clear).toHaveBeenCalled();
      expect(window.sessionStorage.clear).toHaveBeenCalled();
      expect(window.location.href).toBe('/auth');
    });

    it('should determine auth error type correctly', () => {
      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const boundary = new AuthErrorBoundary({
        children: <div>Auth content</div>
      });

      // Test token error
      const tokenError = createMockError('JWT token expired');
      expect((boundary as any).getAuthErrorMessage(tokenError)).toBe('Your session token is invalid or has expired');
      expect((boundary as any).getAuthErrorType(tokenError)).toBe('Token Error');

      // Test unauthorized error
      const authError = createMockError('User unauthorized');
      expect((boundary as any).getAuthErrorMessage(authError)).toBe('You are not authorized to access this resource');
      expect((boundary as any).getAuthErrorType(authError)).toBe('Authorization Error');

      // Test network error
      const networkError = createMockError('Network request failed');
      expect((boundary as any).getAuthErrorMessage(networkError)).toBe('Unable to connect to authentication service');
      expect((boundary as any).getAuthErrorType(networkError)).toBe('Network Error');

      // Test timeout error
      const timeoutError = createMockError('Request timeout');
      expect((boundary as any).getAuthErrorMessage(timeoutError)).toBe('Authentication request timed out');
      expect((boundary as any).getAuthErrorType(timeoutError)).toBe('Timeout Error');
    });

    it('should show debug information in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const error = createMockError('Debug auth error', 'AuthenticationError');
      const errorInfo = createMockErrorInfo('AuthComponent\n  at AuthComponent');

      const boundary = new AuthErrorBoundary({
        children: <div>Auth content</div>,
        showDebug: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'AUTH_ERR_debug123',
        isRetrying: false,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Debug Information')).toBeInTheDocument();
      expect(screen.getByText('Debug auth error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('NetworkErrorBoundary', () => {
    beforeEach(() => {
      // Mock network events
      window.addEventListener = vi.fn();
      window.removeEventListener = vi.fn();
    });

    it('should catch network errors and render network-specific UI', async () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      const error = createMockError('Network connection failed', 'NetworkError');
      const errorInfo = createMockErrorInfo();

      const boundary = new NetworkErrorBoundary({
        children: <div>Network content</div>,
        showNetworkStatus: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'NET_ERR_conn123',
        isOnline: true,
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your connection.')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry Now')).toBeInTheDocument();
    });

    it('should detect offline state and show appropriate message', async () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      const error = createMockError('Offline error', 'NetworkError');
      const errorInfo = createMockErrorInfo();

      const boundary = new NetworkErrorBoundary({
        children: <div>Network content</div>
      });

      // Mock offline state
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'NET_ERR_offline123',
        isOnline: false,
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('You appear to be offline. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
    });

    it('should handle network status indicators', async () => {
      const { NetworkErrorBoundary, NetworkStatusIndicator } = await import('./NetworkErrorBoundary');

      // Mock online with connection info
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true });
      (window.navigator as any).connection = {
        effectiveType: '4G',
      };

      const { container } = render(<NetworkStatusIndicator />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('4G')).toBeInTheDocument();
    });

    it('should filter network errors correctly', () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      // Test various network error patterns
      const networkErrors = [
        createMockError('Network request failed'),
        createMockError('Failed to fetch'),
        createMockError('CORS error'),
        createMockError('Connection timeout'),
        createMockError('Connection refused'),
      ];

      const nonNetworkErrors = [
        createMockError('Syntax error'),
        createMockError('Type error: undefined is not a function'),
        createMockError('Reference error: variable not defined'),
      ];

      networkErrors.forEach(error => {
        expect((NetworkErrorBoundary as any).isNetworkError(error)).toBe(true);
      });

      nonNetworkErrors.forEach(error => {
        expect((NetworkErrorBoundary as any).isNetworkError(error)).toBe(false);
      });
    });

    it('should handle auto-retry mechanism', async () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      const error = createMockError('Auto-retry error', 'NetworkError');
      const errorInfo = createMockErrorInfo();

      const boundary = new NetworkErrorBoundary({
        children: <div>Network content</div>,
        enableAutoRetry: true,
        retryInterval: 5000
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'NET_ERR_auto123',
        isOnline: true,
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
      };

      boundary.componentDidCatch(error, errorInfo);

      // Should set up interval for auto-retry
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should recover when coming back online', () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      const error = createMockError('Online recovery error', 'NetworkError');
      const errorInfo = createMockErrorInfo();

      const boundary = new NetworkErrorBoundary({
        children: <div>Network content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'NET_ERR_online123',
        isOnline: false,
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
      };

      const retrySpy = vi.spyOn(boundary, 'retry');

      // Simulate coming back online
      boundary.handleOnline();

      expect(boundary.state.isOnline).toBe(true);
      expect(retrySpy).toHaveBeenCalled();
    });
  });

  describe('AssessmentErrorBoundary', () => {
    it('should catch assessment errors and render assessment-specific UI', async () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      const error = createMockError('Assessment processing failed', 'AssessmentError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AssessmentErrorBoundary({
        children: <div>Assessment content</div>,
        assessmentId: 'test-assessment-123',
        preserveProgress: true,
        allowRestart: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ASSESS_ERR_proc123',
        retryCount: 0,
        isRetrying: false,
        isSaving: false,
        lastSavedTime: undefined,
        errorType: 'general'
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Assessment Error')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred during your assessment.')).toBeInTheDocument();
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Restart Assessment')).toBeInTheDocument();
      expect(screen.getByText('Save Progress')).toBeInTheDocument();
    });

    it('should determine assessment error type correctly', () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      const boundary = new AssessmentErrorBoundary({
        children: <div>Assessment content</div>
      });

      // Test question error
      const questionError = createMockError('Question loading failed');
      expect((boundary as any).determineErrorType(questionError)).toBe('question');
      expect((boundary as any).getErrorMessage()).toBe('There was an error loading or processing the current question.');

      // Test submission error
      const submissionError = createMockError('Assessment submission failed');
      expect((boundary as any).determineErrorType(submissionError)).toBe('submission');
      expect((boundary as any).getErrorMessage()).toBe('There was an error submitting your assessment answers.');

      // Test loading error
      const loadingError = createMockError('Assessment loading failed');
      expect((boundary as any).determineErrorType(loadingError)).toBe('loading');
      expect((boundary as any).getErrorMessage()).toBe('There was an error loading the assessment.');

      // Test general error
      const generalError = createMockError('General assessment error');
      expect((boundary as any).determineErrorType(generalError)).toBe('general');
      expect((boundary as any).getErrorMessage()).toBe('An unexpected error occurred during your assessment.');
    });

    it('should handle assessment progress saving', async () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      const onSaveProgress = vi.fn().mockResolvedValue(undefined);
      const error = createMockError('Progress save error', 'AssessmentError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AssessmentErrorBoundary({
        children: <div>Assessment content</div>,
        assessmentId: 'test-assessment-123',
        preserveProgress: true,
        onSaveProgress
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ASSESS_ERR_save123',
        retryCount: 0,
        isRetrying: false,
        isSaving: false,
        lastSavedTime: undefined,
        errorType: 'general'
      };

      await (boundary as any).saveProgress();

      expect(onSaveProgress).toHaveBeenCalled();
      expect(boundary.state.isSaving).toBe(false);
      expect(boundary.state.lastSavedTime).toBeInstanceOf(Date);
    });

    it('should handle assessment restart', () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      const error = createMockError('Restart error', 'AssessmentError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AssessmentErrorBoundary({
        children: <div>Assessment content</div>,
        assessmentId: 'test-assessment-123',
        allowRestart: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ASSESS_ERR_restart123',
        retryCount: 0,
        isRetrying: false,
        isSaving: false,
        lastSavedTime: undefined,
        errorType: 'general'
      };

      boundary.handleRestartAssessment();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('assessment_test-assessment-123_progress');
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should show progress preservation status', () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      const error = createMockError('Progress error', 'AssessmentError');
      const errorInfo = createMockErrorInfo();

      const boundary = new AssessmentErrorBoundary({
        children: <div>Assessment content</div>,
        assessmentId: 'test-assessment-123',
        preserveProgress: true
      });

      const savedTime = new Date();
      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'ASSESS_ERR_progress123',
        retryCount: 1,
        isRetrying: false,
        isSaving: false,
        lastSavedTime: savedTime,
        errorType: 'general'
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Your progress has been saved. You can retry or restart the assessment.')).toBeInTheDocument();
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });
  });

  describe('VoiceErrorBoundary', () => {
    beforeEach(() => {
      // Mock mediaDevices
      (window.navigator as any).mediaDevices = {
        getUserMedia: vi.fn(),
      };

      // Mock permissions
      (window.navigator as any).permissions = {
        query: vi.fn(),
      };
    });

    it('should catch voice errors and render voice-specific UI', async () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const error = createMockError('Microphone permission denied', 'VoiceError');
      const errorInfo = createMockErrorInfo();

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>,
        showDiagnostics: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'VOICE_ERR_perm123',
        hasMicrophonePermission: false,
        audioContextState: 'closed',
        isRetrying: false,
        isCheckingPermissions: false,
        errorType: 'permission'
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Voice Feature Error')).toBeInTheDocument();
      expect(screen.getByText('Microphone access is required for voice features')).toBeInTheDocument();
      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument();
      expect(screen.getByText('Allow Microphone')).toBeInTheDocument();
      expect(screen.getByText('Browser Settings')).toBeInTheDocument();
    });

    it('should determine voice error type correctly', () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>
      });

      // Test permission error
      const permissionError = createMockError('Microphone permission denied');
      expect((boundary as any).determineErrorType(permissionError)).toBe('permission');
      expect((boundary as any).getErrorMessage()).toBe('Microphone access is required for voice features');

      // Test device error
      const deviceError = createMockError('No microphone detected');
      expect((boundary as any).determineErrorType(deviceError)).toBe('device');
      expect((boundary as any).getErrorMessage()).toBe('No microphone detected or microphone is not working');

      // Test processing error
      const processingError = createMockError('Audio processing failed');
      expect((boundary as any).determineErrorType(processingError)).toBe('processing');
      expect((boundary as any).getErrorMessage()).toBe('Voice processing encountered an error');

      // Test network error
      const networkError = createMockError('Voice service connection failed');
      expect((boundary as any).determineErrorType(networkError)).toBe('network');
      expect((boundary as any).getErrorMessage()).toBe('Voice service connection error');
    });

    it('should provide appropriate recovery steps for each error type', () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>
      });

      // Test permission recovery steps
      boundary.state.errorType = 'permission';
      const permissionSteps = (boundary as any).getRecoverySteps();
      expect(permissionSteps).toContain('Click "Allow Microphone" to grant permission');
      expect(permissionSteps).toContain('If denied, check your browser settings');

      // Test device recovery steps
      boundary.state.errorType = 'device';
      const deviceSteps = (boundary as any).getRecoverySteps();
      expect(deviceSteps).toContain('Ensure your microphone is connected');
      expect(deviceSteps).toContain('Check if microphone is muted in system settings');

      // Test processing recovery steps
      boundary.state.errorType = 'processing';
      const processingSteps = (boundary as any).getRecoverySteps();
      expect(processingSteps).toContain('Try restarting the voice feature');
      expect(processingSteps).toContain('Check if other apps are using the microphone');
    });

    it('should handle microphone permission requests', async () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const error = createMockError('Permission request error', 'VoiceError');
      const errorInfo = createMockErrorInfo();

      // Mock successful permission request
      (window.navigator.mediaDevices.getUserMedia as any).mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }]
      });

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'VOICE_ERR_request123',
        hasMicrophonePermission: false,
        audioContextState: 'closed',
        isRetrying: false,
        isCheckingPermissions: false,
        errorType: 'permission'
      };

      const result = await boundary.requestMicrophonePermission();

      expect(result).toBe(true);
      expect(boundary.state.hasMicrophonePermission).toBe(true);
      expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should handle microphone permission denial', async () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const error = createMockError('Permission denied error', 'VoiceError');
      const errorInfo = createMockErrorInfo();

      // Mock permission denial
      (window.navigator.mediaDevices.getUserMedia as any).mockRejectedValue(new Error('Permission denied'));

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'VOICE_ERR_denied123',
        hasMicrophonePermission: false,
        audioContextState: 'closed',
        isRetrying: false,
        isCheckingPermissions: false,
        errorType: 'permission'
      };

      const result = await boundary.requestMicrophonePermission();

      expect(result).toBe(false);
      expect(boundary.state.hasMicrophonePermission).toBe(false);
    });

    it('should open browser settings with appropriate instructions', () => {
      const { VoiceErrorBoundary } = await import('./VoiceErrorBoundary');

      const error = createMockError('Settings error', 'VoiceError');
      const errorInfo = createMockErrorInfo();

      // Mock Chrome user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const boundary = new VoiceErrorBoundary({
        children: <div>Voice content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'VOICE_ERR_settings123',
        hasMicrophonePermission: false,
        audioContextState: 'closed',
        isRetrying: false,
        isCheckingPermissions: false,
        errorType: 'permission'
      };

      boundary.openBrowserSettings();

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Click the lock icon in the address bar'));
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Ensure "Microphone" is set to "Allow"'));

      alertSpy.mockRestore();
    });
  });

  describe('DatabaseErrorBoundary', () => {
    beforeEach(() => {
      // Mock network events
      window.addEventListener = vi.fn();
      window.removeEventListener = vi.fn();
    });

    it('should catch database errors and render database-specific UI', async () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const error = createMockError('Database connection failed', 'DatabaseError');
      const errorInfo = createMockErrorInfo();

      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>,
        showHealthStatus: true,
        enableAutoRetry: true
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'DB_ERR_conn123',
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
        connectionStatus: 'disconnected',
        isOnline: true,
        healthStatus: 'unhealthy'
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('Database Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the database. Please check your connection.')).toBeInTheDocument();
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      expect(screen.getByText('Auto-retry is enabled. Will attempt to reconnect periodically.')).toBeInTheDocument();
    });

    it('should filter database errors correctly', () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      // Test various database error patterns
      const databaseErrors = [
        createMockError('Database connection failed'),
        createMockError('Connection timeout'),
        createMockError('Supabase error'),
        createMockError('PostgreSQL connection refused'),
        createMockError('Constraint violation'),
        createMockError('Foreign key constraint failed'),
        createMockError('Connection pool exhausted'),
        createMockError('Service unavailable (503)'),
        createMockError('Gateway timeout (504)'),
      ];

      const nonDatabaseErrors = [
        createMockError('Syntax error'),
        createMockError('Type error'),
        createMockError('Network request failed'), // This should be caught by network boundary
      ];

      databaseErrors.forEach(error => {
        expect((DatabaseErrorBoundary as any).isDatabaseError(error)).toBe(true);
      });

      nonDatabaseErrors.forEach(error => {
        expect((DatabaseErrorBoundary as any).isDatabaseError(error)).toBe(false);
      });
    });

    it('should handle offline state for database errors', () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const error = createMockError('Database offline error', 'DatabaseError');
      const errorInfo = createMockErrorInfo();

      // Mock offline state
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });

      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'DB_ERR_offline123',
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
        connectionStatus: 'disconnected',
        isOnline: false,
        healthStatus: 'unhealthy'
      };

      const { container } = render(<div>{boundary.render()}</div>);

      expect(screen.getByText('You are offline. Database features are unavailable.')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection. Database features will be available when you\'re back online.')).toBeInTheDocument();
    });

    it('should handle database health checks', async () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const onDataCheck = vi.fn().mockResolvedValue(true);
      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>,
        onDataCheck
      });

      await (boundary as any).checkDatabaseHealth();

      expect(onDataCheck).toHaveBeenCalled();
      expect(boundary.state.healthStatus).toBe('healthy');
      expect(boundary.state.connectionStatus).toBe('connected');
    });

    it('should handle database health check failures', async () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const onDataCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));
      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>,
        onDataCheck
      });

      await (boundary as any).checkDatabaseHealth();

      expect(onDataCheck).toHaveBeenCalled();
      expect(boundary.state.healthStatus).toBe('unhealthy');
      expect(boundary.state.connectionStatus).toBe('disconnected');
    });

    it('should handle online/offline events', () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const error = createMockError('Online event error', 'DatabaseError');
      const errorInfo = createMockErrorInfo();

      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>
      });

      boundary.state = {
        hasError: true,
        error,
        errorInfo,
        errorId: 'DB_ERR_online123',
        retryCount: 0,
        isRetrying: false,
        lastRetryTime: undefined,
        connectionStatus: 'disconnected',
        isOnline: false,
        healthStatus: 'unhealthy'
      };

      const retrySpy = vi.spyOn(boundary, 'retry');

      // Simulate coming back online
      boundary.handleOnline();

      expect(boundary.state.isOnline).toBe(true);
      expect(retrySpy).toHaveBeenCalled();

      // Simulate going offline
      boundary.handleOffline();

      expect(boundary.state.isOnline).toBe(false);
      expect(boundary.state.connectionStatus).toBe('disconnected');
      expect(boundary.state.healthStatus).toBe('unhealthy');
    });

    it('should start health checks on mount', () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const onDataCheck = vi.fn().mockResolvedValue(true);

      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>,
        onDataCheck
      });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      expect(onDataCheck).toHaveBeenCalled();
    });

    it('should clean up intervals on unmount', () => {
      const { DatabaseErrorBoundary } = await import('./DatabaseErrorBoundary');

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const boundary = new DatabaseErrorBoundary({
        children: <div>Database content</div>
      });

      // Simulate intervals being set
      boundary.healthCheckIntervalId = setTimeout(() => {}, 30000);
      boundary.retryTimeoutId = setTimeout(() => {}, 10000);

      boundary.componentWillUnmount();

      expect(clearIntervalSpy).toHaveBeenCalledWith(boundary.healthCheckIntervalId);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(boundary.retryTimeoutId);
    });
  });

  describe('Hook Integration', () => {
    it('should provide useAuthErrorHandler hook', async () => {
      const { useAuthErrorHandler } = await import('./AuthErrorBoundary');

      let handleAuthError: any;
      const TestComponent = () => {
        const result = useAuthErrorHandler();
        handleAuthError = result.handleAuthError;
        const handleSessionExpiry = result.handleSessionExpiry;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleAuthError).toBe('function');

      const error = createMockError('Hook auth error');
      handleAuthError(error, 'testContext');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should provide useNetworkErrorHandler hook', async () => {
      const { useNetworkErrorHandler } = await import('./NetworkErrorBoundary');

      let handleNetworkError: any;
      let checkNetworkStatus: any;
      const TestComponent = () => {
        const result = useNetworkErrorHandler();
        handleNetworkError = result.handleNetworkError;
        checkNetworkStatus = result.checkNetworkStatus;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleNetworkError).toBe('function');
      expect(typeof checkNetworkStatus).toBe('function');

      const error = createMockError('Hook network error');
      handleNetworkError(error, 'testContext');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should provide useAssessmentErrorHandler hook', async () => {
      const { useAssessmentErrorHandler } = await import('./AssessmentErrorBoundary');

      let handleAssessmentError: any;
      let saveProgress: any;
      const TestComponent = () => {
        const result = useAssessmentErrorHandler('test-assessment');
        handleAssessmentError = result.handleAssessmentError;
        saveProgress = result.saveProgress;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleAssessmentError).toBe('function');
      expect(typeof saveProgress).toBe('function');

      const error = createMockError('Hook assessment error');
      handleAssessmentError(error, 'testContext', 'question');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should provide useVoiceErrorHandler hook', async () => {
      const { useVoiceErrorHandler } = await import('./VoiceErrorBoundary');

      let handleVoiceError: any;
      let checkMicrophonePermission: any;
      let requestMicrophoneAccess: any;
      const TestComponent = () => {
        const result = useVoiceErrorHandler();
        handleVoiceError = result.handleVoiceError;
        checkMicrophonePermission = result.checkMicrophonePermission;
        requestMicrophoneAccess = result.requestMicrophoneAccess;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleVoiceError).toBe('function');
      expect(typeof checkMicrophonePermission).toBe('function');
      expect(typeof requestMicrophoneAccess).toBe('function');

      const error = createMockError('Hook voice error');
      handleVoiceError(error, 'testContext', 'permission');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should provide useDatabaseErrorHandler hook', async () => {
      const { useDatabaseErrorHandler } = await import('./DatabaseErrorBoundary');

      let handleDatabaseError: any;
      let checkConnection: any;
      const TestComponent = () => {
        const result = useDatabaseErrorHandler();
        handleDatabaseError = result.handleDatabaseError;
        checkConnection = result.checkConnection;
        return <div>Hook Test</div>;
      };

      render(<TestComponent />);

      expect(typeof handleDatabaseError).toBe('function');
      expect(typeof checkConnection).toBe('function');

      const error = createMockError('Hook database error');
      handleDatabaseError(error, 'testContext');

      const { globalErrorHandler } = require('@/services/error/global-error-handler.service');
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should render children normally when no error occurs', async () => {
      const { AuthErrorBoundary } = await import('./AuthErrorBoundary');

      const TestChild = () => <div>Normal auth content</div>;

      const { container } = render(
        <AuthErrorBoundary>
          <TestChild />
        </AuthErrorBoundary>
      );

      expect(screen.getByText('Normal auth content')).toBeInTheDocument();
    });

    it('should catch and handle errors in child components', async () => {
      const { NetworkErrorBoundary } = await import('./NetworkErrorBoundary');

      const ErrorChild = () => {
        throw new Error('Network child error');
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container } = render(
          <NetworkErrorBoundary>
            <ErrorChild />
          </NetworkErrorBoundary>
        );

        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });

    it('should handle error recovery and retry successfully', async () => {
      const { AssessmentErrorBoundary } = await import('./AssessmentErrorBoundary');

      let shouldThrow = true;
      const ErrorChild = () => {
        if (shouldThrow) {
          throw new Error('Retryable assessment error');
        }
        return <div>Recovered assessment</div>;
      };

      const restoreConsole = console.error;
      console.error = vi.fn();

      try {
        const { container, rerender } = render(
          <AssessmentErrorBoundary assessmentId="test-assessment" preserveProgress={true}>
            <ErrorChild />
          </AssessmentErrorBoundary>
        );

        // Should show error UI
        expect(screen.getByText('Assessment Error')).toBeInTheDocument();

        // Click retry button
        shouldThrow = false;
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);

        // Wait for retry to complete
        await act(async () => {
          await vi.advanceTimersByTime(1000);
        });

        // Should render child content
        expect(screen.getByText('Recovered assessment')).toBeInTheDocument();
      } finally {
        console.error = restoreConsole;
      }
    });
  });
});