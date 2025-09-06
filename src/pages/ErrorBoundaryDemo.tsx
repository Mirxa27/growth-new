/**
 * Error Boundary Demo Page
 * Interactive demonstration of the comprehensive error boundary system
 */

import React, { useState } from 'react';
import { AlertCircle, Bug, Shield, Database, Wifi, Mic, FileText, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AppErrorBoundary,
  AuthErrorBoundary,
  NetworkErrorBoundary,
  AssessmentErrorBoundary,
  VoiceErrorBoundary,
  DatabaseErrorBoundary,
  ComponentErrorBoundary,
  ErrorBoundaryTestProvider,
  ErrorBoundaryTestSuite,
  ErrorTestComponent,
  useErrorTest
} from '@/components/error-boundaries';

// Demo Components that can throw errors
const DemoAuthComponent: React.FC = () => {
  const { throwAuthError } = useErrorTest('AuthComponent');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Authentication Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates authentication errors. Click the button to test authentication error handling.
        </p>
        <Button onClick={throwAuthError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate Auth Error
        </Button>
      </CardContent>
    </Card>
  );
};

const DemoNetworkComponent: React.FC = () => {
  const { throwNetworkError } = useErrorTest('NetworkComponent');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-green-600" />
          Network Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates network errors. Click the button to test network error handling.
        </p>
        <Button onClick={throwNetworkError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate Network Error
        </Button>
      </CardContent>
    </Card>
  );
};

const DemoAssessmentComponent: React.FC = () => {
  const { throwBusinessError } = useErrorTest('AssessmentComponent');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Assessment Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates assessment errors. Click the button to test assessment error handling.
        </p>
        <Button onClick={throwBusinessError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate Assessment Error
        </Button>
      </CardContent>
    </Card>
  );
};

const DemoVoiceComponent: React.FC = () => {
  const { throwError } = useErrorTest('VoiceComponent');
  const handleVoiceError = () => throwError('permission');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-red-600" />
          Voice Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates voice feature errors. Click the button to test voice error handling.
        </p>
        <Button onClick={handleVoiceError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate Voice Error
        </Button>
      </CardContent>
    </Card>
  );
};

const DemoDatabaseComponent: React.FC = () => {
  const { throwDatabaseError } = useErrorTest('DatabaseComponent');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-orange-600" />
          Database Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates database errors. Click the button to test database error handling.
        </p>
        <Button onClick={throwDatabaseError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate Database Error
        </Button>
      </CardContent>
    </Card>
  );
};

const DemoGeneralComponent: React.FC = () => {
  const { throwError } = useErrorTest('GeneralComponent');
  const handleGeneralError = () => throwError('general');
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-gray-600" />
          General Error Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This component simulates general errors. Click the button to test general error handling.
        </p>
        <Button onClick={handleGeneralError} variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Simulate General Error
        </Button>
      </CardContent>
    </Card>
  );
};

const ErrorBoundaryDemo: React.FC = () => {
  const [showTestSuite, setShowTestSuite] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Error Boundary System Demo
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Interactive demonstration of the comprehensive error boundary system with multiple levels of error handling,
              specialized error types, and glassmorphism design integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => setShowTestSuite(!showTestSuite)} variant="outline">
                <Bug className="w-4 h-4 mr-2" />
                {showTestSuite ? 'Hide Test Suite' : 'Show Test Suite'}
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Suite */}
        {showTestSuite && (
          <ErrorBoundaryTestProvider>
            <ErrorBoundaryTestSuite />
          </ErrorBoundaryTestProvider>
        )}

        {/* Feature Overview */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              System Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant="outline">Multi-level</Badge>
                <p className="text-sm text-gray-600">App, route, and component-level error boundaries</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Specialized</Badge>
                <p className="text-sm text-gray-600">Auth, network, assessment, voice, database errors</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Auto-recovery</Badge>
                <p className="text-sm text-gray-600">Configurable retry with exponential backoff</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">User-friendly</Badge>
                <p className="text-sm text-gray-600">Clear error messages and recovery options</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Glassmorphism</Badge>
                <p className="text-sm text-gray-600">Seamless integration with design system</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Testing</Badge>
                <p className="text-sm text-gray-600">Comprehensive testing utilities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Sections */}
        <div className="space-y-6">
          {/* Individual Error Boundary Demos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Auth Error Boundary Demo */}
            <AuthErrorBoundary allowRetry={true}>
              <DemoAuthComponent />
            </AuthErrorBoundary>

            {/* Network Error Boundary Demo */}
            <NetworkErrorBoundary showNetworkStatus={true} enableAutoRetry={true}>
              <DemoNetworkComponent />
            </NetworkErrorBoundary>

            {/* Assessment Error Boundary Demo */}
            <AssessmentErrorBoundary assessmentId="demo-assessment" preserveProgress={true}>
              <DemoAssessmentComponent />
            </AssessmentErrorBoundary>

            {/* Voice Error Boundary Demo */}
            <VoiceErrorBoundary showDiagnostics={true}>
              <DemoVoiceComponent />
            </VoiceErrorBoundary>

            {/* Database Error Boundary Demo */}
            <DatabaseErrorBoundary showHealthStatus={true}>
              <DemoDatabaseComponent />
            </DatabaseErrorBoundary>

            {/* Component Error Boundary Demo */}
            <ComponentErrorBoundary componentName="GeneralDemo" enableRecovery={true}>
              <DemoGeneralComponent />
            </ComponentErrorBoundary>
          </div>

          {/* Nested Error Boundary Demo */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Nested Error Boundary Demo
              </CardTitle>
              <CardDescription>
                Demonstrates how error boundaries work together in a nested structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This section shows multiple error boundaries working together. Each inner boundary handles specific error types,
                  while outer boundaries provide fallback protection.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppErrorBoundary level="component" component="NestedDemo1">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Nested Level 1</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Protected by AppErrorBoundary</p>
                          <ErrorTestComponent
                            errorType="validation"
                            componentName="NestedComponent1"
                            delay={2000}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </AppErrorBoundary>

                  <ComponentErrorBoundary componentName="NestedDemo2" enableRecovery={true}>
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Nested Level 2</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Protected by ComponentErrorBoundary</p>
                          <ErrorTestComponent
                            errorType="timeout"
                            componentName="NestedComponent2"
                            delay={3000}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </ComponentErrorBoundary>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-recovery Demo */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-600" />
                Auto-recovery Demo
              </CardTitle>
              <CardDescription>
                Demonstrates automatic error recovery with configurable retry attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The components below will automatically attempt to recover from errors. Watch the retry count and recovery progress.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NetworkErrorBoundary enableAutoRetry={true} maxRetries={3}>
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Auto-retry Network</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ErrorTestComponent
                          errorType="network"
                          componentName="AutoNetworkDemo"
                          delay={1000}
                        />
                      </CardContent>
                    </Card>
                  </NetworkErrorBoundary>

                  <AssessmentErrorBoundary assessmentId="auto-demo" preserveProgress={true}>
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Auto-retry Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ErrorTestComponent
                          errorType="business-logic"
                          componentName="AutoAssessmentDemo"
                          delay={1500}
                        />
                      </CardContent>
                    </Card>
                  </AssessmentErrorBoundary>

                  <DatabaseErrorBoundary enableAutoRetry={true} maxRetries={2}>
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Auto-retry Database</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ErrorTestComponent
                          errorType="database"
                          componentName="AutoDatabaseDemo"
                          delay={2000}
                        />
                      </CardContent>
                    </Card>
                  </DatabaseErrorBoundary>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Type Coverage */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-600" />
                Error Type Coverage
              </CardTitle>
              <CardDescription>
                Complete coverage of different error types with specialized handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'network', 'authentication', 'database', 'validation',
                  'business-logic', 'ui', 'timeout', 'permission',
                  'resource', 'general'
                ].map((errorType) => (
                  <ErrorTestComponent
                    key={errorType}
                    errorType={errorType as any}
                    componentName={`${errorType}Demo`}
                    delay={Math.random() * 3000 + 1000}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Error Detection</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Catches React component errors</li>
                  <li>Detects specific error types</li>
                  <li>Integrates with global error handler</li>
                  <li>Provides detailed error context</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Error Recovery</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Automatic retry with backoff</li>
                  <li>User-initiated recovery</li>
                  <li>State preservation</li>
                  <li>Graceful fallbacks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Experience</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Clear error messages</li>
                  <li>Recovery options</li>
                  <li>Progress indicators</li>
                  <li>Non-disruptive UI</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Developer Tools</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Testing utilities</li>
                  <li>Debug information</li>
                  <li>Performance monitoring</li>
                  <li>Error reporting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorBoundaryDemo;