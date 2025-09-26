/**
 * Assessment Test Suite Component
 * Comprehensive testing of assessment flows for visitors and users
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  User,
  UserX,
  Database,
  Link as LinkIcon
} from 'lucide-react';
import { getPublicAssessments, getAccessibleAssessments, getAssessmentById } from '@/services/api/assessment.service';
import RealAssessmentService from '@/services/realAssessmentService';
import { logger } from '@/services/logging/logger.service';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const AssessmentTestSuite: React.FC = () => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<any[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runComprehensiveTest = async () => {
    setRunning(true);
    setResults([]);
    
    try {
      // Test 1: Load public assessments
      await testPublicAssessments();
      
      // Test 2: Test specific assessment access
      await testSpecificAssessmentAccess();
      
      // Test 3: Test assessment service methods
      await testAssessmentService();
      
      // Test 4: Test user vs visitor access
      await testUserVsVisitorAccess();
      
      // Test 5: Test assessment routes
      await testAssessmentRoutes();

      logger.info('Assessment test suite completed', {
        component: 'AssessmentTestSuite',
        action: 'runComprehensiveTest',
        metadata: {
          totalTests: results.length,
          passed: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length,
          userAuthenticated: !!user
        }
      });

    } catch (error) {
      addResult({
        name: 'Test Suite Execution',
        status: 'error',
        message: 'Test suite failed to complete',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setRunning(false);
    }
  };

  const testPublicAssessments = async () => {
    try {
      const assessments = await getPublicAssessments();
      setAvailableAssessments(assessments);
      
      if (assessments.length > 0) {
        addResult({
          name: 'Public Assessments API',
          status: 'success',
          message: `Found ${assessments.length} public assessments`,
          details: assessments.map(a => a.title).join(', ')
        });
      } else {
        addResult({
          name: 'Public Assessments API',
          status: 'warning',
          message: 'No public assessments found in database'
        });
      }
    } catch (error) {
      addResult({
        name: 'Public Assessments API',
        status: 'error',
        message: 'Failed to fetch public assessments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testSpecificAssessmentAccess = async () => {
    if (availableAssessments.length === 0) {
      addResult({
        name: 'Specific Assessment Access',
        status: 'warning',
        message: 'No assessments available to test'
      });
      return;
    }

    const firstAssessment = availableAssessments[0];
    
    try {
      const assessment = await getAssessmentById(firstAssessment.id);
      
      if (assessment) {
        addResult({
          name: 'Specific Assessment Access',
          status: 'success',
          message: `Successfully loaded assessment: ${assessment.title}`,
          details: `ID: ${assessment.id}, Questions: ${assessment.questions?.length || 0}`
        });
      } else {
        addResult({
          name: 'Specific Assessment Access',
          status: 'error',
          message: 'Assessment returned null despite being in public list'
        });
      }
    } catch (error) {
      addResult({
        name: 'Specific Assessment Access',
        status: 'error',
        message: 'Failed to access specific assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testAssessmentService = async () => {
    try {
      const assessments = await RealAssessmentService.getPublicAssessments();
      
      if (assessments.length > 0) {
        const firstAssessment = assessments[0];
        const detailedAssessment = await RealAssessmentService.getAssessmentById(firstAssessment.id);
        
        if (detailedAssessment) {
          addResult({
            name: 'RealAssessmentService',
            status: 'success',
            message: `Service working correctly`,
            details: `Loaded ${assessments.length} assessments, detailed view has ${detailedAssessment.questions?.length || 0} questions`
          });
        } else {
          addResult({
            name: 'RealAssessmentService',
            status: 'error',
            message: 'Service returned null for existing assessment'
          });
        }
      } else {
        addResult({
          name: 'RealAssessmentService',
          status: 'warning',
          message: 'No assessments returned by service'
        });
      }
    } catch (error) {
      addResult({
        name: 'RealAssessmentService',
        status: 'error',
        message: 'Assessment service failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testUserVsVisitorAccess = async () => {
    try {
      const publicAssessments = await getPublicAssessments();
      const accessibleAssessments = await getAccessibleAssessments();

      if (user) {
        addResult({
          name: 'User vs Visitor Access',
          status: 'success',
          message: `Authenticated user has access to ${accessibleAssessments.length} assessments`,
          details: `Public: ${publicAssessments.length}, Accessible: ${accessibleAssessments.length}`
        });
      } else {
        if (publicAssessments.length === accessibleAssessments.length) {
          addResult({
            name: 'User vs Visitor Access',
            status: 'success',
            message: `Visitor has correct access to ${publicAssessments.length} public assessments`
          });
        } else {
          addResult({
            name: 'User vs Visitor Access',
            status: 'warning',
            message: 'Mismatch between public and accessible assessments for visitors'
          });
        }
      }
    } catch (error) {
      addResult({
        name: 'User vs Visitor Access',
        status: 'error',
        message: 'Failed to test access levels',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testAssessmentRoutes = async () => {
    if (availableAssessments.length === 0) {
      addResult({
        name: 'Assessment Routes',
        status: 'warning',
        message: 'No assessments to test routing'
      });
      return;
    }

    const firstAssessment = availableAssessments[0];
    const testRoutes = [
      `/assessment/${firstAssessment.id}`,
      `/mobile-assessment/${firstAssessment.id}`,
      '/assessment-system',
      '/assessment-hub'
    ];

    for (const route of testRoutes) {
      try {
        const response = await fetch(`${window.location.origin}${route}`);
        
        if (response.ok) {
          addResult({
            name: `Route: ${route}`,
            status: 'success',
            message: `Route accessible (${response.status})`
          });
        } else {
          addResult({
            name: `Route: ${route}`,
            status: 'error',
            message: `Route returned ${response.status} ${response.statusText}`
          });
        }
      } catch (error) {
        addResult({
          name: `Route: ${route}`,
          status: 'error',
          message: 'Route failed to load',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Assessment System Test Suite
          </CardTitle>
          <p className="text-gray-600">
            Comprehensive testing of assessment flows for visitors and authenticated users
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {user ? (
                <User className="w-4 h-4 text-green-600" />
              ) : (
                <UserX className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-sm">
                Testing as: {user ? `${user.email} (Authenticated)` : 'Visitor (Anonymous)'}
              </span>
            </div>
          </div>

          <Button
            onClick={runComprehensiveTest}
            disabled={running}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Assessment Flow Tests'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-green-700">Passed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">
                          View Details
                        </summary>
                        <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {result.details}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {availableAssessments.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">Quick Assessment Links</h3>
              <div className="space-y-2">
                {availableAssessments.slice(0, 3).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">{assessment.title}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/assessment/${assessment.id}`, '_blank')}
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/mobile-assessment/${assessment.id}`, '_blank')}
                      >
                        📱 Mobile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorCount} test{errorCount > 1 ? 's' : ''} failed. Check the results above for details.
            These issues may cause 404 errors or broken functionality for users.
          </AlertDescription>
        </Alert>
      )}

      {errorCount === 0 && results.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All tests passed! Assessment flows are working correctly for both visitors and users.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AssessmentTestSuite;
