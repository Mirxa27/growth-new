import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { realtimeService, RealtimeConfig } from '@/services/ai/realtime.service';
import { realtimeTranscriptionService } from '@/services/ai/realtime-transcription.service';
import { 
  Save, 
  TestTube, 
  Mic, 
  Volume2, 
  Settings, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  Play,
  Square,
  Phone
} from 'lucide-react';

const REALTIME_VOICES = [
  'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 
  'marin', 'juniper', 'sage'
] as const;

const REALTIME_MODELS = [
  'gpt-4o-realtime-preview-2024-12-17',
  'gpt-4o-realtime-preview',
  'gpt-4o-mini-realtime-preview'
] as const;

interface RealtimeAPIConfigState {
  // Basic Configuration
  model: string;
  voice: string;
  instructions: string;
  temperature: number;
  maxTokens?: number;
  
  // Session Configuration
  sessionType: 'realtime' | 'transcription';
  inputModalities: string[];
  outputModalities: string[];
  enableTranscription: boolean;
  
  // Turn Detection
  turnDetectionType: 'server_vad' | 'none';
  turnDetectionThreshold: number;
  turnDetectionPrefixPadding: number;
  turnDetectionSilenceDuration: number;
  
  // Audio Configuration
  inputAudioFormat: string;
  outputAudioFormat: string;
  
  // Transcription Configuration
  transcriptionModel: string;
  transcriptionLanguage: string;
  transcriptionPrompt?: string;
  transcriptionTemperature: number;
  enableWordTimestamps: boolean;
  enableSpeakerDetection: boolean;
  
  // Advanced Configuration
  isActive: boolean;
  enableLogging: boolean;
  maxSessionDuration: number;
  autoReconnect: boolean;
  connectionTimeout: number;
}

export const RealtimeAPIConfig: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<RealtimeAPIConfigState>({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'marin',
    instructions: 'You are a helpful AI assistant for the Newomen personal growth platform. Be supportive, empathetic, and encouraging while helping users with their personal development journey.',
    temperature: 0.7,
    maxTokens: 4000,
    sessionType: 'realtime',
    inputModalities: ['text', 'audio'],
    outputModalities: ['text', 'audio'],
    enableTranscription: true,
    turnDetectionType: 'server_vad',
    turnDetectionThreshold: 0.5,
    turnDetectionPrefixPadding: 300,
    turnDetectionSilenceDuration: 200,
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    transcriptionModel: 'whisper-1',
    transcriptionLanguage: 'en',
    transcriptionTemperature: 0,
    enableWordTimestamps: true,
    enableSpeakerDetection: false,
    isActive: true,
    enableLogging: true,
    maxSessionDuration: 3600, // 1 hour
    autoReconnect: true,
    connectionTimeout: 30,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sessionId?: string;
  } | null>(null);

  /**
   * Load configuration from admin settings
   */
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      
      // Load Realtime API configuration
      const { data: realtimeProvider, error: realtimeError } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai_realtime')
        .eq('is_active', true)
        .single();

      if (!realtimeError && realtimeProvider?.configuration) {
        setConfig(prev => ({
          ...prev,
          ...realtimeProvider.configuration
        }));
      }

      // Load Transcription configuration
      const { data: transcriptionProvider, error: transcriptionError } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai_transcription')
        .eq('is_active', true)
        .single();

      if (!transcriptionError && transcriptionProvider?.configuration) {
        setConfig(prev => ({
          ...prev,
          transcriptionModel: transcriptionProvider.configuration.model || prev.transcriptionModel,
          transcriptionLanguage: transcriptionProvider.configuration.language || prev.transcriptionLanguage,
          transcriptionPrompt: transcriptionProvider.configuration.prompt || prev.transcriptionPrompt,
          transcriptionTemperature: transcriptionProvider.configuration.temperature || prev.transcriptionTemperature,
          enableWordTimestamps: transcriptionProvider.configuration.enable_word_timestamps ?? prev.enableWordTimestamps,
          enableSpeakerDetection: transcriptionProvider.configuration.enable_speaker_detection ?? prev.enableSpeakerDetection,
        }));
      }

    } catch (error) {
      console.error('Failed to load Realtime API configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save configuration to admin settings
   */
  const saveConfiguration = async () => {
    try {
      setIsSaving(true);

      // Save Realtime API configuration
      const realtimeConfig = {
        model: config.model,
        voice: config.voice,
        instructions: config.instructions,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        sessionType: config.sessionType,
        inputModalities: config.inputModalities,
        outputModalities: config.outputModalities,
        enableTranscription: config.enableTranscription,
        turnDetection: {
          type: config.turnDetectionType,
          threshold: config.turnDetectionThreshold,
          prefix_padding_ms: config.turnDetectionPrefixPadding,
          silence_duration_ms: config.turnDetectionSilenceDuration,
        },
        inputAudioFormat: config.inputAudioFormat,
        outputAudioFormat: config.outputAudioFormat,
        enableLogging: config.enableLogging,
        maxSessionDuration: config.maxSessionDuration,
        autoReconnect: config.autoReconnect,
        connectionTimeout: config.connectionTimeout,
      };

      const { error: realtimeError } = await supabase
        .from('admin_ai_providers')
        .upsert({
          provider_type: 'openai_realtime',
          provider_name: 'OpenAI Realtime API',
          configuration: realtimeConfig,
          is_active: config.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (realtimeError) throw realtimeError;

      // Save Transcription configuration
      const transcriptionConfig = {
        model: config.transcriptionModel,
        language: config.transcriptionLanguage,
        prompt: config.transcriptionPrompt,
        temperature: config.transcriptionTemperature,
        response_format: 'verbose_json',
        enable_word_timestamps: config.enableWordTimestamps,
        enable_speaker_detection: config.enableSpeakerDetection,
      };

      const { error: transcriptionError } = await supabase
        .from('admin_ai_providers')
        .upsert({
          provider_type: 'openai_transcription',
          provider_name: 'OpenAI Transcription',
          configuration: transcriptionConfig,
          is_active: config.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (transcriptionError) throw transcriptionError;

      // Update service configurations
      realtimeService.updateDefaultConfig({
        model: config.model,
        voice: config.voice as any,
        instructions: config.instructions,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        enableTranscription: config.enableTranscription,
        sessionType: config.sessionType,
        inputModalities: config.inputModalities as any,
        outputModalities: config.outputModalities as any,
        turnDetection: {
          type: config.turnDetectionType,
          threshold: config.turnDetectionThreshold,
          prefix_padding_ms: config.turnDetectionPrefixPadding,
          silence_duration_ms: config.turnDetectionSilenceDuration,
        },
      });

      realtimeTranscriptionService.updateDefaultConfig({
        model: config.transcriptionModel,
        language: config.transcriptionLanguage,
        prompt: config.transcriptionPrompt,
        temperature: config.transcriptionTemperature,
        response_format: 'verbose_json',
        enable_word_timestamps: config.enableWordTimestamps,
        enable_speaker_detection: config.enableSpeakerDetection,
      });

      toast({
        title: 'Success',
        description: 'Realtime API configuration saved successfully',
      });

    } catch (error) {
      console.error('Failed to save Realtime API configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Test the Realtime API configuration
   */
  const testConfiguration = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      // Create a test session
      const sessionId = `test_${Date.now()}`;
      const testConfig: RealtimeConfig = {
        model: config.model,
        voice: config.voice as any,
        instructions: 'This is a test session. Please respond with "Test successful" to confirm the connection.',
        temperature: config.temperature,
        maxTokens: 100,
        enableTranscription: config.enableTranscription,
        sessionType: config.sessionType,
        inputModalities: config.inputModalities as any,
        outputModalities: config.outputModalities as any,
        turnDetection: {
          type: config.turnDetectionType,
          threshold: config.turnDetectionThreshold,
          prefix_padding_ms: config.turnDetectionPrefixPadding,
          silence_duration_ms: config.turnDetectionSilenceDuration,
        },
      };

      // Test session creation and connection
      const session = await realtimeService.createSession(sessionId, testConfig);
      await realtimeService.connectSession(sessionId);

      // Wait a moment to establish connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      const sessionState = realtimeService.getSessionState(sessionId);
      
      if (sessionState?.status === 'connected') {
        // Send test message
        await realtimeService.sendMessage(sessionId, 'Hello, this is a test message.');
        
        // Disconnect after test
        setTimeout(() => {
          realtimeService.disconnectSession(sessionId);
        }, 3000);

        setTestResult({
          success: true,
          message: 'Connection successful! Test session created and message sent.',
          sessionId,
        });
      } else {
        throw new Error(`Connection failed. Status: ${sessionState?.status}`);
      }

    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed with unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            OpenAI Realtime API Configuration
          </CardTitle>
          <CardDescription>
            Configure the OpenAI Realtime API for voice interactions and transcription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="realtime" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="realtime">Realtime</TabsTrigger>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            {/* Realtime Configuration */}
            <TabsContent value="realtime" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select 
                    value={config.model} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {REALTIME_MODELS.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voice">Voice</Label>
                  <Select 
                    value={config.voice} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, voice: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {REALTIME_VOICES.map(voice => (
                        <SelectItem key={voice} value={voice}>
                          {voice.charAt(0).toUpperCase() + voice.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.temperature}
                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={100}
                    max={10000}
                    value={config.maxTokens || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || undefined }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select 
                    value={config.sessionType} 
                    onValueChange={(value: 'realtime' | 'transcription') => setConfig(prev => ({ ...prev, sessionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Realtime (Voice Chat)</SelectItem>
                      <SelectItem value="transcription">Transcription Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnDetectionType">Turn Detection</Label>
                  <Select 
                    value={config.turnDetectionType} 
                    onValueChange={(value: 'server_vad' | 'none') => setConfig(prev => ({ ...prev, turnDetectionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select turn detection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="server_vad">Server VAD</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  rows={4}
                  value={config.instructions}
                  onChange={(e) => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Enter system instructions for the AI assistant..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTranscription"
                    checked={config.enableTranscription}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableTranscription: checked }))}
                  />
                  <Label htmlFor="enableTranscription">Enable Transcription</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={config.isActive}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active Configuration</Label>
                </div>
              </div>
            </TabsContent>

            {/* Transcription Configuration */}
            <TabsContent value="transcription" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transcriptionModel">Transcription Model</Label>
                  <Input
                    id="transcriptionModel"
                    value={config.transcriptionModel}
                    onChange={(e) => setConfig(prev => ({ ...prev, transcriptionModel: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcriptionLanguage">Language</Label>
                  <Input
                    id="transcriptionLanguage"
                    value={config.transcriptionLanguage}
                    onChange={(e) => setConfig(prev => ({ ...prev, transcriptionLanguage: e.target.value }))}
                    placeholder="e.g., en, es, fr, de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transcriptionTemperature">Temperature</Label>
                  <Input
                    id="transcriptionTemperature"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.transcriptionTemperature}
                    onChange={(e) => setConfig(prev => ({ ...prev, transcriptionTemperature: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transcriptionPrompt">Transcription Prompt</Label>
                <Textarea
                  id="transcriptionPrompt"
                  rows={3}
                  value={config.transcriptionPrompt || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, transcriptionPrompt: e.target.value }))}
                  placeholder="Optional prompt to guide transcription style..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableWordTimestamps"
                    checked={config.enableWordTimestamps}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableWordTimestamps: checked }))}
                  />
                  <Label htmlFor="enableWordTimestamps">Word Timestamps</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSpeakerDetection"
                    checked={config.enableSpeakerDetection}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableSpeakerDetection: checked }))}
                  />
                  <Label htmlFor="enableSpeakerDetection">Speaker Detection</Label>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Configuration */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turnDetectionThreshold">VAD Threshold</Label>
                  <Input
                    id="turnDetectionThreshold"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.turnDetectionThreshold}
                    onChange={(e) => setConfig(prev => ({ ...prev, turnDetectionThreshold: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnDetectionPrefixPadding">Prefix Padding (ms)</Label>
                  <Input
                    id="turnDetectionPrefixPadding"
                    type="number"
                    min={0}
                    max={2000}
                    value={config.turnDetectionPrefixPadding}
                    onChange={(e) => setConfig(prev => ({ ...prev, turnDetectionPrefixPadding: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnDetectionSilenceDuration">Silence Duration (ms)</Label>
                  <Input
                    id="turnDetectionSilenceDuration"
                    type="number"
                    min={100}
                    max={3000}
                    value={config.turnDetectionSilenceDuration}
                    onChange={(e) => setConfig(prev => ({ ...prev, turnDetectionSilenceDuration: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSessionDuration">Max Session Duration (seconds)</Label>
                  <Input
                    id="maxSessionDuration"
                    type="number"
                    min={60}
                    max={7200}
                    value={config.maxSessionDuration}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxSessionDuration: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionTimeout">Connection Timeout (seconds)</Label>
                  <Input
                    id="connectionTimeout"
                    type="number"
                    min={5}
                    max={120}
                    value={config.connectionTimeout}
                    onChange={(e) => setConfig(prev => ({ ...prev, connectionTimeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableLogging"
                    checked={config.enableLogging}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableLogging: checked }))}
                  />
                  <Label htmlFor="enableLogging">Enable Detailed Logging</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoReconnect"
                    checked={config.autoReconnect}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoReconnect: checked }))}
                  />
                  <Label htmlFor="autoReconnect">Auto Reconnect</Label>
                </div>
              </div>
            </TabsContent>

            {/* Test Configuration */}
            <TabsContent value="test" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Test Realtime API Configuration</h3>
                  <p className="text-muted-foreground">
                    Test your configuration by creating a sample session and sending a test message.
                  </p>
                </div>

                <Button
                  onClick={testConfiguration}
                  disabled={isTesting}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Testing Configuration...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-5 h-5 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {testResult.success ? 'Test Successful' : 'Test Failed'}
                      </span>
                    </div>
                    <p>{testResult.message}</p>
                    {testResult.sessionId && (
                      <p className="text-sm mt-2">Session ID: {testResult.sessionId}</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeAPIConfig;