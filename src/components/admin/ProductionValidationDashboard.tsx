/**
 * Production Validation Dashboard
 * Comprehensive testing and validation interface for all implementations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Database,
  Brain,
  Shield,
  Smartphone,
  BarChart3,
  Code,
  TestTube
} from 'lucide-react';
import { integrationTester, type IntegrationTestReport, type TestSuite } from '@/services/testing/integration-test.service';
import { cleanArchitecture } from '@/architecture/clean-architecture.service';
import { performanceOptimizer } from '@/services/performance/performance-optimizer.service';
import { accessibilityService } from '@/services/accessibility/accessibility.service';
import { mobileOptimizer } from '@/services/mobile/mobile-optimizer.service';
import { logger } from '@/services/logging/logger.service';
import { toast } from 'sonner';

interface ValidationState {
  isRunning: boolean;
  currentTest: string;
  progress: number;
  report: IntegrationTestReport | null;
  error: string | null;
}

const ProductionValidationDashboard: React.FC = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isRunning: false,
    currentTest: '',
    progress: 0,
    report: null,
    error: null
  });

  const [quickHealthCheck, setQuickHealthCheck] = useState<{
    database: boolean;
    ai: boolean;
    authentication: boolean;
    assessments: boolean;
    admin: boolean;
  } | null>(null);

  const [architectureAudit, setArchitectureAudit] = useState<any>(null);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [accessibilityAudit, setAccessibilityAudit] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadQuickHealthCheck();
  }, []);

  const loadQuickHealthCheck = async () => {
    try {
      const healthCheck = await integrationTester.runQuickHealthCheck();
      setQuickHealthCheck(healthCheck);
    } catch (error) {
      logger.error('Quick health check failed', {
        component: 'ProductionValidationDashboard',
        action: 'loadQuickHealthCheck',
        error
      });
    }
  };

  const runFullValidation = async () => {
    setValidationState({
      isRunning: true,
      currentTest: 'Starting validation...',
      progress: 0,
      report: null,
      error: null
    });

    try {
      // Step 1: Run integration tests
      setValidationState(prev => ({ ...prev, currentTest: 'Running integration tests...', progress: 20 }));
      const integrationReport = await integrationTester.runFullTestSuite();

      // Step 2: Architecture audit
      setValidationState(prev => ({ ...prev, currentTest: 'Auditing architecture...', progress: 40 }));
      const architectureResult = cleanArchitecture.validateArchitecture();
      setArchitectureAudit(architectureResult);

      // Step 3: Performance analysis
      setValidationState(prev => ({ ...prev, currentTest: 'Analyzing performance...', progress: 60 }));
      const performanceResult = performanceOptimizer.getPerformanceReport();
      setPerformanceReport(performanceResult);

      // Step 4: Accessibility audit
      setValidationState(prev => ({ ...prev, currentTest: 'Checking accessibility...', progress: 80 }));
      const accessibilityResult = await accessibilityService.auditPage();
      setAccessibilityAudit(accessibilityResult);

      // Step 5: Complete
      setValidationState(prev => ({ 
        ...prev, 
        currentTest: 'Validation complete', 
        progress: 100, 
        report: integrationReport,
        isRunning: false
      }));

      toast.success('Production validation completed successfully!');

      logger.info('Production validation completed', {
        component: 'ProductionValidationDashboard',
        action: 'runFullValidation',
        metadata: {
          totalTests: integrationReport.totalTests,
          passedTests: integrationReport.passedTests,
          overallPassed: integrationReport.overallPassed
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage
      }));

      toast.error('Production validation failed');
      
      logger.error('Production validation failed', {
        component: 'ProductionValidationDashboard',
        action: 'runFullValidation',
        error
      });
    }
  };

  const runSpecificTest = async (testType: 'assessment' | 'registration' | 'voice-session') => {
    try {
      const results = await integrationTester.testUserFlow(testType);
      const passed = results.every(result => result.passed);
      
      if (passed) {
        toast.success(`${testType} flow test passed!`);
      } else {
        toast.error(`${testType} flow test failed`);
      }
    } catch (error) {
      toast.error(`Failed to run ${testType} test`);
      logger.error(`Specific test failed: ${testType}`, {
        component: 'ProductionValidationDashboard',
        action: 'runSpecificTest',
        error
      });
    }
  };

  const getHealthStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return status ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getHealthStatusBadge = (status: boolean | undefined) => {
    if (status === undefined) return <Badge variant="secondary">Checking...</Badge>;
    return status 
      ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Healthy</Badge>
      : <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Unhealthy</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Production Validation Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive testing and validation of all production implementations
          </p>
        </div>

        {/* Quick Health Status */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              System Health Status
            </CardTitle>
            <Button onClick={loadQuickHealthCheck} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {quickHealthCheck ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(quickHealthCheck).map(([system, status]) => (
                  <div key={system} className="flex items-center justify-between p-3 rounded-lg border bg-white/60">
                    <div className="flex items-center gap-2">
                      {getHealthStatusIcon(status)}
                      <span className="font-medium capitalize">{system.replace('_', ' ')}</span>
                    </div>
                    {getHealthStatusBadge(status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" variant="rounded" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Controls */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              Validation Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={runFullValidation}
                disabled={validationState.isRunning}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {validationState.isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Running Validation...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Full Validation
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => runSpecificTest('assessment')}
                  variant="outline"
                  disabled={validationState.isRunning}
                >
                  Test Assessment Flow
                </Button>
                <Button
                  onClick={() => runSpecificTest('registration')}
                  variant="outline"
                  disabled={validationState.isRunning}
                >
                  Test Registration
                </Button>
                <Button
                  onClick={() => runSpecificTest('voice-session')}
                  variant="outline"
                  disabled={validationState.isRunning}
                >
                  Test Voice System
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {validationState.isRunning && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{validationState.currentTest}</span>
                  <span>{validationState.progress}%</span>
                </div>
                <Progress value={validationState.progress} className="w-full" />
              </div>
            )}

            {/* Error Display */}
            {validationState.error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Validation Error: {validationState.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Tabs defaultValue="integration" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="integration" className="text-xs sm:text-sm">Integration Tests</TabsTrigger>
            <TabsTrigger value="architecture" className="text-xs sm:text-sm">Architecture</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
            <TabsTrigger value="accessibility" className="text-xs sm:text-sm">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="integration" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Integration Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationState.report ? (
                  <div className="space-y-4">
                    {/* Overall Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {validationState.report.passedTests}
                        </div>
                        <div className="text-sm text-gray-600">Tests Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {validationState.report.failedTests}
                        </div>
                        <div className="text-sm text-gray-600">Tests Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {validationState.report.totalTests}
                        </div>
                        <div className="text-sm text-gray-600">Total Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {validationState.report.totalDuration}ms
                        </div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                    </div>

                    {/* Test Suites */}
                    <div className="space-y-3">
                      {validationState.report.suites.map((suite, index) => (
                        <Card key={index} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{suite.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={suite.passed ? 'default' : 'destructive'}>
                                  {suite.passed ? 'PASSED' : 'FAILED'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {suite.passRate.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {suite.tests.map((test, testIndex) => (
                                <div key={testIndex} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                  <div className="flex items-center gap-2">
                                    {test.passed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={test.passed ? 'text-gray-900' : 'text-red-700'}>
                                      {test.testName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {test.duration.toFixed(1)}ms
                                    </span>
                                    {test.error && (
                                      <Badge variant="destructive" className="text-xs">
                                        Error
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {suite.tests.some(t => t.error) && (
                              <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-red-600">
                                  View Errors
                                </summary>
                                <div className="mt-2 space-y-1">
                                  {suite.tests.filter(t => t.error).map((test, errorIndex) => (
                                    <div key={errorIndex} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                                      <strong>{test.testName}:</strong> {test.error}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Run validation tests to see detailed results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-600" />
                  Architecture Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {architectureAudit ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {architectureAudit.score}%
                      </div>
                      <div className="text-sm text-gray-600">Architecture Score</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Layer Compliance</h3>
                        {Object.entries(architectureAudit.layerCompliance).map(([layer, score]) => (
                          <div key={layer} className="flex justify-between items-center py-1">
                            <span className="text-sm capitalize">{layer.replace('_', ' ')}</span>
                            <span className="font-medium">{(score as number).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">SOLID Principles</h3>
                        {Object.entries(architectureAudit.principleCompliance).map(([principle, score]) => (
                          <div key={principle} className="flex justify-between items-center py-1">
                            <span className="text-sm capitalize">{principle.replace('_', ' ')}</span>
                            <span className="font-medium">{(score as number).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <div className="space-y-1">
                        {architectureAudit.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Run full validation to analyze architecture</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceReport ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Object.entries(performanceReport.webVitals).map(([metric, data]) => (
                        <div key={metric} className="text-center p-4 rounded-lg border bg-white/60">
                          <div className={`text-2xl font-bold ${
                            (data as any).rating === 'good' ? 'text-green-600' : 
                            (data as any).rating === 'needs-improvement' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {((data as any).average || 0).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">{metric}</div>
                          <Badge 
                            variant={(data as any).rating === 'good' ? 'default' : 'destructive'}
                            className="text-xs mt-1"
                          >
                            {(data as any).rating}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Performance Recommendations</h3>
                      <div className="space-y-1">
                        {performanceReport.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <BarChart3 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Run full validation to analyze performance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-600" />
                  Accessibility Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accessibilityAudit ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${
                        accessibilityAudit.score >= 80 ? 'text-green-600' :
                        accessibilityAudit.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {accessibilityAudit.score}%
                      </div>
                      <div className="text-sm text-gray-600">Accessibility Score</div>
                    </div>

                    {accessibilityAudit.issues.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Issues Found</h3>
                        <div className="space-y-2">
                          {accessibilityAudit.issues.map((issue: any, index: number) => (
                            <div key={index} className="p-3 rounded border bg-white/60">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm">{issue.rule}</span>
                                <Badge 
                                  variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{issue.description}</p>
                              <p className="text-xs text-blue-600">{issue.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <div className="space-y-1">
                        {accessibilityAudit.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Run full validation to analyze accessibility</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionValidationDashboard;
