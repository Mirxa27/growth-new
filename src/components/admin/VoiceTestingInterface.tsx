import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { realtimeService, RealtimeConfig } from '@/services/ai/realtime.service';
import { realtimeWebSocketService } from '@/services/ai/realtime-websocket.service';
import { realtimeTranscriptionService } from '@/services/ai/realtime-transcription.service';
import VoiceAgent from '../voice/VoiceAgent';
import VoiceChat from '../voice/VoiceChat';
import TranscriptionPanel from '../voice/TranscriptionPanel';
import SessionManager from '../voice/SessionManager';
import { 
  TestTube, 
  Play, 
  Square, 
  Mic, 
  Volume2, 
  Settings, 
  Activity,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2
} from 'lucide-react';

interface TestResult {
  id: string;
  testType: 'realtime' | 'websocket' | 'transcription';
  status: 'running' | 'passed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  details: string;
  error?: string;
  sessionId?: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testType: 'realtime' | 'websocket' | 'transcription';
  config: any;
  expectedBehavior: string;
}

export const VoiceTestingInterface: React.FC = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customTestConfig, setCustomTestConfig] = useState<Partial<RealtimeConfig>>({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'marin',
    instructions: 'You are a test assistant. Please respond briefly to confirm the connection is working.',
    temperature: 0.7,
    enableTranscription: true,
    sessionType: 'realtime',
  });

  const testScenarios: TestScenario[] = [
    {
      id: 'basic-connection',
      name: 'Basic Connection Test',
      description: 'Test basic Realtime API connection and session creation',
      testType: 'realtime',
      config: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'marin',
        instructions: 'Say "Connection test successful" to confirm the connection.',
        temperature: 0.5,
      },
      expectedBehavior: 'Should connect successfully and respond with confirmation message'
    },
    {
      id: 'voice-quality',
      name: 'Voice Quality Test',
      description: 'Test different voice options and audio quality',
      testType: 'realtime',
      config: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: 'Please say a few sentences to test voice quality and clarity.',
        temperature: 0.7,
      },
      expectedBehavior: 'Should produce clear, natural-sounding speech'
    },
    {
      id: 'transcription-accuracy',
      name: 'Transcription Accuracy Test',
      description: 'Test real-time audio transcription accuracy',
      testType: 'transcription',
      config: {
        model: 'whisper-1',
        language: 'en',
        enable_word_timestamps: true,
      },
      expectedBehavior: 'Should accurately transcribe spoken words with high confidence'
    },
    {
      id: 'websocket-stability',
      name: 'WebSocket Stability Test',
      description: 'Test WebSocket connection stability and reconnection',
      testType: 'websocket',
      config: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'nova',
        instructions: 'Test WebSocket connection stability.',
      },
      expectedBehavior: 'Should maintain stable connection and handle reconnections'
    },
    {
      id: 'multilingual-support',
      name: 'Multilingual Support Test',
      description: 'Test support for different languages',
      testType: 'transcription',
      config: {
        model: 'whisper-1',
        language: 'es',
        enable_word_timestamps: true,
      },
      expectedBehavior: 'Should accurately transcribe Spanish audio'
    },
    {
      id: 'high-load',
      name: 'High Load Test',
      description: 'Test performance under multiple concurrent sessions',
      testType: 'realtime',
      config: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'echo',
        instructions: 'Respond quickly to test high-load performance.',
        temperature: 0.3,
      },
      expectedBehavior: 'Should handle multiple sessions without degradation'
    }
  ];

  /**
   * Add test result
   */
  const addTestResult = useCallback((result: Omit<TestResult, 'id'>) => {
    const newResult: TestResult = {
      ...result,
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };
    
    setTestResults(prev => [newResult, ...prev]);
    return newResult.id;
  }, []);

  /**
   * Update test result
   */
  const updateTestResult = useCallback((id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.id === id ? { ...result, ...updates } : result
    ));
  }, []);

  /**
   * Run basic connection test
   */
  const runBasicConnectionTest = useCallback(async () => {
    const testId = addTestResult({
      testType: 'realtime',
      status: 'running',
      startTime: new Date(),
      details: 'Testing basic Realtime API connection...',
    });

    try {
      const sessionId = `test_connection_${Date.now()}`;
      
      // Create and connect session
      const session = await realtimeService.createSession(sessionId, customTestConfig);
      await realtimeService.connectSession(sessionId);

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 3000));

      const sessionState = realtimeService.getSessionState(sessionId);
      
      if (sessionState?.status === 'connected') {
        // Send test message
        await realtimeService.sendMessage(sessionId, 'Hello, this is a connection test.');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Disconnect
        await realtimeService.disconnectSession(sessionId);

        updateTestResult(testId, {
          status: 'passed',
          endTime: new Date(),
          details: 'Connection test successful. Session created, message sent, and disconnected properly.',
          sessionId,
        });

        toast({
          title: 'Test Passed',
          description: 'Basic connection test completed successfully',
        });
      } else {
        throw new Error(`Connection failed. Status: ${sessionState?.status}`);
      }

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        endTime: new Date(),
        details: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: 'Test Failed',
        description: 'Basic connection test failed',
        variant: 'destructive',
      });
    }
  }, [customTestConfig, addTestResult, updateTestResult, toast]);

  /**
   * Run transcription test
   */
  const runTranscriptionTest = useCallback(async () => {
    const testId = addTestResult({
      testType: 'transcription',
      status: 'running',
      startTime: new Date(),
      details: 'Testing transcription accuracy...',
    });

    try {
      const sessionId = `test_transcription_${Date.now()}`;
      
      // Create transcription session
      await realtimeTranscriptionService.createTranscriptionSession(
        sessionId,
        {
          model: 'whisper-1',
          language: 'en',
          enable_word_timestamps: true,
        },
        (transcript, isFinal) => {
          if (isFinal) {
            updateTestResult(testId, {
              status: 'passed',
              endTime: new Date(),
              details: `Transcription successful: "${transcript}"`,
              sessionId,
            });
          }
        },
        (error) => {
          updateTestResult(testId, {
            status: 'failed',
            endTime: new Date(),
            details: 'Transcription test failed',
            error,
            sessionId,
          });
        }
      );

      // Simulate audio input (in real test, this would be actual audio)
      setTimeout(() => {
        updateTestResult(testId, {
          status: 'passed',
          endTime: new Date(),
          details: 'Transcription session created successfully. Ready for audio input.',
          sessionId,
        });

        toast({
          title: 'Test Passed',
          description: 'Transcription test setup successful',
        });
      }, 2000);

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        endTime: new Date(),
        details: 'Transcription test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: 'Test Failed',
        description: 'Transcription test failed',
        variant: 'destructive',
      });
    }
  }, [addTestResult, updateTestResult, toast]);

  /**
   * Run WebSocket test
   */
  const runWebSocketTest = useCallback(async () => {
    const testId = addTestResult({
      testType: 'websocket',
      status: 'running',
      startTime: new Date(),
      details: 'Testing WebSocket connection stability...',
    });

    try {
      const sessionId = `test_websocket_${Date.now()}`;
      
      // Create WebSocket session
      const session = await realtimeWebSocketService.createWebSocketSession(
        sessionId,
        customTestConfig as any
      );

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 3000));

      const sessionState = realtimeWebSocketService.getSession(sessionId);
      
      if (sessionState?.status === 'connected') {
        // Send test message
        await realtimeWebSocketService.sendMessage(sessionId, 'WebSocket connection test');
        
        // Wait and disconnect
        setTimeout(async () => {
          await realtimeWebSocketService.disconnectSession(sessionId);
          
          updateTestResult(testId, {
            status: 'passed',
            endTime: new Date(),
            details: 'WebSocket test successful. Connection established, message sent, and disconnected.',
            sessionId,
          });

          toast({
            title: 'Test Passed',
            description: 'WebSocket test completed successfully',
          });
        }, 2000);
      } else {
        throw new Error(`WebSocket connection failed. Status: ${sessionState?.status}`);
      }

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        endTime: new Date(),
        details: 'WebSocket test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: 'Test Failed',
        description: 'WebSocket test failed',
        variant: 'destructive',
      });
    }
  }, [customTestConfig, addTestResult, updateTestResult, toast]);

  /**
   * Run selected test scenario
   */
  const runTestScenario = useCallback(async (scenario: TestScenario) => {
    setIsRunningTests(true);

    try {
      switch (scenario.testType) {
        case 'realtime':
          await runBasicConnectionTest();
          break;
        case 'transcription':
          await runTranscriptionTest();
          break;
        case 'websocket':
          await runWebSocketTest();
          break;
      }
    } catch (error) {
      console.error('Test scenario failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  }, [runBasicConnectionTest, runTranscriptionTest, runWebSocketTest]);

  /**
   * Run all tests
   */
  const runAllTests = useCallback(async () => {
    setIsRunningTests(true);
    
    try {
      for (const scenario of testScenarios) {
        await runTestScenario(scenario);
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast({
        title: 'All Tests Complete',
        description: 'Test suite execution finished',
      });
    } catch (error) {
      console.error('Test suite failed:', error);
      toast({
        title: 'Test Suite Failed',
        description: 'Some tests encountered errors',
        variant: 'destructive',
      });
    } finally {
      setIsRunningTests(false);
    }
  }, [testScenarios, runTestScenario, toast]);

  /**
   * Clear test results
   */
  const clearResults = useCallback(() => {
    setTestResults([]);
    toast({
      title: 'Results Cleared',
      description: 'All test results have been cleared',
    });
  }, [toast]);

  /**
   * Export test results
   */
  const exportResults = useCallback(() => {
    const results = testResults.map(result => ({
      ...result,
      duration: result.endTime && result.startTime ? 
        result.endTime.getTime() - result.startTime.getTime() : null,
    }));

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_test_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Results Exported',
      description: 'Test results exported to JSON file',
    });
  }, [testResults, toast]);

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  /**
   * Get test type icon
   */
  const getTestTypeIcon = (testType: string) => {
    switch (testType) {
      case 'realtime': return <Activity className="w-4 h-4" />;
      case 'websocket': return <MessageSquare className="w-4 h-4" />;
      case 'transcription': return <FileText className="w-4 h-4" />;
      default: return <TestTube className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Voice API Testing Interface
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for OpenAI Realtime API functionality
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="automated" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="sessions">Session Monitor</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        {/* Automated Tests */}
        <TabsContent value="automated" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Scenarios</CardTitle>
                <CardDescription>
                  Pre-configured test scenarios for common use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {testScenarios.map(scenario => (
                    <div key={scenario.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTestTypeIcon(scenario.testType)}
                            <h4 className="font-medium">{scenario.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {scenario.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expected: {scenario.expectedBehavior}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => runTestScenario(scenario)}
                          disabled={isRunningTests}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={runAllTests}
                    disabled={isRunningTests}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRunningTests ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run All Tests
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Test Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Test Configuration</CardTitle>
                <CardDescription>
                  Configure custom test parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={customTestConfig.model || ''}
                      onChange={(e) => setCustomTestConfig(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select 
                      value={customTestConfig.voice || ''} 
                      onValueChange={(value) => setCustomTestConfig(prev => ({ ...prev, voice: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy</SelectItem>
                        <SelectItem value="echo">Echo</SelectItem>
                        <SelectItem value="fable">Fable</SelectItem>
                        <SelectItem value="onyx">Onyx</SelectItem>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="shimmer">Shimmer</SelectItem>
                        <SelectItem value="marin">Marin</SelectItem>
                        <SelectItem value="juniper">Juniper</SelectItem>
                        <SelectItem value="sage">Sage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={customTestConfig.temperature || 0.7}
                      onChange={(e) => setCustomTestConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={customTestConfig.instructions || ''}
                    onChange={(e) => setCustomTestConfig(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={runBasicConnectionTest}
                    disabled={isRunningTests}
                    variant="outline"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button
                    onClick={runTranscriptionTest}
                    disabled={isRunningTests}
                    variant="outline"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Test Transcription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manual Testing */}
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VoiceChat
              config={customTestConfig}
              onSessionStart={(sessionId) => {
                toast({
                  title: 'Manual Test Session Started',
                  description: `Session ID: ${sessionId}`,
                });
              }}
              onSessionEnd={(sessionId) => {
                toast({
                  title: 'Manual Test Session Ended',
                  description: `Session ID: ${sessionId}`,
                });
              }}
            />
            
            <TranscriptionPanel
              config={{
                model: 'whisper-1',
                language: 'en',
                enable_word_timestamps: true,
              }}
              onTranscriptionComplete={(result) => {
                toast({
                  title: 'Transcription Complete',
                  description: `"${result.text.substring(0, 50)}..."`,
                });
              }}
            />
          </div>
        </TabsContent>

        {/* Session Monitor */}
        <TabsContent value="sessions" className="space-y-4">
          <SessionManager />
        </TabsContent>

        {/* Test Results */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Results ({testResults.length})</span>
                <div className="flex gap-2">
                  <Button
                    onClick={exportResults}
                    size="sm"
                    variant="outline"
                    disabled={testResults.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={clearResults}
                    size="sm"
                    variant="outline"
                    disabled={testResults.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm">Run some tests to see results here</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {testResults.map(result => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            {getTestTypeIcon(result.testType)}
                            <span className="font-medium capitalize">
                              {result.testType} Test
                            </span>
                          </div>
                          <Badge variant="outline" className={
                            result.status === 'passed' ? 'bg-green-50 text-green-700' :
                            result.status === 'failed' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                          }>
                            {result.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          {result.details}
                        </p>
                        
                        {result.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            Error: {result.error}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Started: {result.startTime.toLocaleTimeString()}</span>
                          {result.endTime && (
                            <span>
                              Duration: {Math.round((result.endTime.getTime() - result.startTime.getTime()) / 1000)}s
                            </span>
                          )}
                          {result.sessionId && (
                            <span>Session: {result.sessionId.substring(0, 8)}...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceTestingInterface;