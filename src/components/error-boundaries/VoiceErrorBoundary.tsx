/**
 * Voice Error Boundary
 * Handles voice-related errors with microphone permissions and audio processing
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, Settings, Headphones, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  globalErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext
} from '@/services/error/global-error-handler.service';
import { logger } from '@/services/logging/logger.service';

interface VoiceErrorBoundaryProps {
  children: ReactNode;
  onVoiceError?: (error: Error) => void;
  onPermissionRequest?: () => Promise<boolean>;
  onRetry?: () => void;
  showDiagnostics?: boolean;
}

interface VoiceErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  hasMicrophonePermission: boolean;
  audioContextState?: 'running' | 'suspended' | 'closed';
  isRetrying: boolean;
  isCheckingPermissions: boolean;
  errorType: 'permission' | 'device' | 'processing' | 'network' | 'general';
}

export class VoiceErrorBoundary extends Component<VoiceErrorBoundaryProps, VoiceErrorBoundaryState> {
  constructor(props: VoiceErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      hasMicrophonePermission: false,
      isRetrying: false,
      isCheckingPermissions: false,
      errorType: 'general'
    };
  }

  componentDidMount() {
    this.checkAudioPermissions();
  }

  static getDerivedStateFromError(error: Error): Partial<VoiceErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `VOICE_ERR_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Determine error type
    const errorType = this.determineErrorType(error);
    this.setState({ errorType });

    // Call the onVoiceError callback if provided
    this.props.onVoiceError?.(error);

    // Report to global error handler
    const context: ErrorContext = {
      component: 'Voice',
      action: 'voiceError',
      metadata: {
        errorId: this.state.errorId,
        errorType,
        hasMicrophonePermission: this.state.hasMicrophonePermission,
        audioContextState: this.state.audioContextState,
        componentStack: errorInfo.componentStack,
        voiceError: true
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.EXTERNAL_API,
      context,
      {
        showToast: false, // Don't show toast since we're showing UI
        logError: true,
        reportError: true
      }
    );

    logger.warn('Voice error caught by boundary', {
      component: 'VoiceErrorBoundary',
      action: 'componentDidCatch',
      error,
      metadata: {
        errorId: this.state.errorId,
        errorType,
        hasMicrophonePermission: this.state.hasMicrophonePermission,
        audioContextState: this.state.audioContextState
      }
    });
  }

  private determineErrorType(error: Error): 'permission' | 'device' | 'processing' | 'network' | 'general' {
    const message = error.message.toLowerCase();

    if (message.includes('permission') || message.includes('denied') || message.includes('allowed')) {
      return 'permission';
    }

    if (message.includes('device') || message.includes('microphone') || message.includes('audio')) {
      return 'device';
    }

    if (message.includes('processing') || message.includes('audio context') || message.includes('web audio')) {
      return 'processing';
    }

    if (message.includes('network') || message.includes('connection') || message.includes('websocket')) {
      return 'network';
    }

    return 'general';
  }

  private checkAudioPermissions = async () => {
    if (!navigator.mediaDevices) {
      this.setState({ hasMicrophonePermission: false });
      return;
    }

    try {
      this.setState({ isCheckingPermissions: true });

      // Check microphone permissions
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.setState({ hasMicrophonePermission: permissions.state === 'granted' });

      // Check audio context state
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        this.setState({ audioContextState: audioContext.state });
        audioContext.close();
      }

      logger.info('Voice permissions checked', {
        component: 'VoiceErrorBoundary',
        action: 'checkAudioPermissions',
        metadata: {
          hasMicrophonePermission: this.state.hasMicrophonePermission,
          audioContextState: this.state.audioContextState
        }
      });
    } catch (error) {
      logger.error('Failed to check audio permissions', {
        component: 'VoiceErrorBoundary',
        action: 'checkAudioPermissions',
        error
      });
    } finally {
      this.setState({ isCheckingPermissions: false });
    }
  };

  requestMicrophonePermission = async () => {
    if (this.props.onPermissionRequest) {
      try {
        const granted = await this.props.onPermissionRequest();
        this.setState({ hasMicrophonePermission: granted });
        return granted;
      } catch (error) {
        logger.error('Permission request failed', {
          component: 'VoiceErrorBoundary',
          action: 'requestMicrophonePermission',
          error
        });
        return false;
      }
    }

    // Default permission request
    try {
      this.setState({ isCheckingPermissions: true });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      this.setState({ hasMicrophonePermission: true });

      logger.info('Microphone permission granted', {
        component: 'VoiceErrorBoundary',
        action: 'requestMicrophonePermission'
      });

      return true;
    } catch (error) {
      this.setState({ hasMicrophonePermission: false });

      logger.warn('Microphone permission denied', {
        component: 'VoiceErrorBoundary',
        action: 'requestMicrophonePermission',
        error
      });

      return false;
    } finally {
      this.setState({ isCheckingPermissions: false });
    }
  };

  retry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Re-check permissions
      await this.checkAudioPermissions();

      // Call custom retry if provided
      if (this.props.onRetry) {
        await this.props.onRetry();
      } else {
        // Default retry logic
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false
      });

      logger.info('Voice error boundary retry attempted', {
        component: 'VoiceErrorBoundary',
        action: 'retry'
      });
    } catch (retryError) {
      this.setState({ isRetrying: false });

      logger.error('Voice retry failed', {
        component: 'VoiceErrorBoundary',
        action: 'retry',
        error: retryError
      });
    }
  };

  openBrowserSettings = () => {
    // Guide user to browser settings
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

    let message = 'Please check your browser settings to enable microphone access:\n\n';

    if (isChrome) {
      message += '1. Click the lock icon in the address bar\n2. Ensure "Microphone" is set to "Allow"\n3. Reload the page';
    } else if (isFirefox) {
      message += '1. Click the lock icon in the address bar\n2. Ensure "Use the microphone" is allowed\n3. Reload the page';
    } else if (isSafari) {
      message += '1. Go to Safari > Preferences > Websites > Microphone\n2. Ensure this site is allowed\n3. Reload the page';
    } else {
      message += '1. Check your browser\'s privacy/security settings\n2. Ensure microphone access is allowed for this site\n3. Reload the page';
    }

    alert(message);
  };

  private getErrorMessage = (): string => {
    switch (this.state.errorType) {
      case 'permission':
        return 'Microphone access is required for voice features';
      case 'device':
        return 'No microphone detected or microphone is not working';
      case 'processing':
        return 'Voice processing encountered an error';
      case 'network':
        return 'Voice service connection error';
      default:
        return 'An error occurred with voice features';
    }
  };

  private getRecoverySteps = (): string[] => {
    switch (this.state.errorType) {
      case 'permission':
        return [
          'Click "Allow Microphone" to grant permission',
          'If denied, check your browser settings',
          'Reload the page after changing permissions'
        ];
      case 'device':
        return [
          'Ensure your microphone is connected',
          'Check if microphone is muted in system settings',
          'Try using a different microphone'
        ];
      case 'processing':
        return [
          'Try restarting the voice feature',
          'Check if other apps are using the microphone',
          'Reload the page if the issue persists'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try again when connection is stable',
          'Contact support if the issue continues'
        ];
      default:
        return [
          'Try the voice feature again',
          'Check your microphone permissions',
          'Reload the page if needed'
        ];
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();
      const recoverySteps = this.getRecoverySteps();

      return (
        <div className="flex items-center justify-center p-4 min-h-[400px]">
          <Card className="w-full max-w-lg glass shadow-xl border-purple-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <MicOff className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-purple-800">Voice Feature Error</CardTitle>
              <CardDescription className="text-purple-700">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Error Type</span>
                  <Badge variant="outline" className="capitalize">
                    {this.state.errorType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Microphone Permission</span>
                  <Badge variant={this.state.hasMicrophonePermission ? 'default' : 'destructive'}>
                    {this.state.hasMicrophonePermission ? 'Granted' : 'Denied'}
                  </Badge>
                </div>

                {this.state.errorId && (
                  <div className="text-xs text-gray-500">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </div>

              {/* Recovery Steps */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">To resolve this issue:</div>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {recoverySteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!this.state.hasMicrophonePermission && (
                  <Button
                    onClick={this.requestMicrophonePermission}
                    className="w-full"
                    disabled={this.state.isCheckingPermissions}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {this.state.isCheckingPermissions ? 'Checking...' : 'Allow Microphone'}
                  </Button>
                )}

                <Button
                  onClick={this.retry}
                  variant="outline"
                  className="w-full"
                  disabled={this.state.isRetrying}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Retry Voice Feature'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={this.openBrowserSettings}
                  className="w-full"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Browser Settings
                </Button>
              </div>

              {/* Audio Diagnostics */}
              {this.props.showDiagnostics && (
                <details className="pt-2 border-t">
                  <summary className="cursor-pointer text-xs text-gray-600">Audio Diagnostics</summary>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Audio Context:</span>
                      <Badge variant="outline">{this.state.audioContextState || 'Unknown'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Microphone:</span>
                      <Badge variant={this.state.hasMicrophonePermission ? 'default' : 'destructive'}>
                        {this.state.hasMicrophonePermission ? 'Available' : 'Blocked'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>User Agent:</span>
                      <span className="text-xs">{navigator.userAgent.split(' ')[0]}</span>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling voice errors in functional components
export const useVoiceErrorHandler = () => {
  const handleVoiceError = React.useCallback((
    error: Error,
    context: string,
    errorType: 'permission' | 'device' | 'processing' | 'network' | 'general' = 'general'
  ) => {
    const errorContext: ErrorContext = {
      component: 'Voice',
      action: context,
      metadata: {
        hookVoiceError: true,
        errorType
      }
    };

    globalErrorHandler.handleError(
      error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.EXTERNAL_API,
      errorContext,
      {
        showToast: true,
        logError: true,
        reportError: true
      }
    );
  }, []);

  const checkMicrophonePermission = React.useCallback(async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissions.state;
    } catch (error) {
      handleVoiceError(error as Error, 'checkMicrophonePermission', 'permission');
      return 'prompt';
    }
  }, [handleVoiceError]);

  const requestMicrophoneAccess = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      handleVoiceError(error as Error, 'requestMicrophoneAccess', 'permission');
      return false;
    }
  }, [handleVoiceError]);

  return { handleVoiceError, checkMicrophonePermission, requestMicrophoneAccess };
};

export default VoiceErrorBoundary;