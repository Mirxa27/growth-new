/**
 * OpenAI Settings Component
 * Comprehensive settings panel for configuring OpenAI integration
 * Based on OpenAI Realtime API documentation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Key, 
  Mic, 
  MessageSquare, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  Bot,
  Volume2,
  Wifi,
  Shield,
  DollarSign,
  Activity,
  Code,
  Globe,
  Database,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';

interface OpenAIConfig {
  apiKey: string;
  organizationId: string;
  chatModel: string;
  realtimeModel: string;
  temperature: number;
  maxTokens: number;
  voice: string;
  connectionType: 'websocket' | 'webrtc';
  enableTools: boolean;
  enableTranscription: boolean;
  audioFormat: string;
  language: string;
  instructions: string;
}

const OpenAISettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  const [config, setConfig] = useState<OpenAIConfig>({
    apiKey: env.openai.apiKey || '',
    organizationId: env.openai.organizationId || '',
    chatModel: env.openai.model || 'gpt-4o-mini',
    realtimeModel: env.openai.realtimeModel || 'gpt-realtime-2025-08-28',
    temperature: env.openai.temperature || 0.7,
    maxTokens: env.openai.maxTokens || 2000,
    voice: 'alloy',
    connectionType: 'websocket',
    enableTools: true,
    enableTranscription: true,
    audioFormat: 'pcm16',
    language: 'en',
    instructions: 'You are a helpful AI assistant focused on personal growth and well-being.'
  });

  // Available models based on OpenAI documentation
  const chatModels = [
    { value: 'gpt-4o', label: 'GPT-4 Optimized', description: 'Most capable, higher cost' },
    { value: 'gpt-4o-mini', label: 'GPT-4 Mini', description: 'Balanced performance and cost' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
  ];

  const realtimeModels = [
    { value: 'gpt-realtime-2025-08-28', label: 'GPT Realtime (Latest)', description: 'Latest realtime model' },
    { value: 'gpt-4o-realtime-preview-2024-10-01', label: 'GPT-4 Realtime Preview', description: 'Previous version' }
  ];

  const voices = [
    { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
    { value: 'echo', label: 'Echo', description: 'Warm and engaging' },
    { value: 'fable', label: 'Fable', description: 'Expressive and dynamic' },
    { value: 'onyx', label: 'Onyx', description: 'Deep and authoritative' },
    { value: 'nova', label: 'Nova', description: 'Friendly and conversational' },
    { value: 'shimmer', label: 'Shimmer', description: 'Soft and gentle' }
  ];

  const audioFormats = [
    { value: 'pcm16', label: 'PCM16', description: '16-bit PCM audio' },
    { value: 'g711_ulaw', label: 'G.711 μ-law', description: 'For telephony' },
    { value: 'g711_alaw', label: 'G.711 A-law', description: 'For telephony' }
  ];

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', 'openai')
        .single();

      if (data && !error) {
        setConfig(prev => ({
          ...prev,
          ...data.settings
        }));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          category: 'openai',
          settings: config,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'OpenAI settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConfiguration = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Test chat completion
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...(config.organizationId && { 'OpenAI-Organization': config.organizationId })
        },
        body: JSON.stringify({
          model: config.chatModel,
          messages: [
            { role: 'system', content: 'You are a test assistant.' },
            { role: 'user', content: 'Say "Test successful" if you can hear me.' }
          ],
          max_tokens: 50,
          temperature: config.temperature
        })
      });

      const chatResult = await chatResponse.json();
      const chatSuccess = chatResponse.ok;

      // Test models availability
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          ...(config.organizationId && { 'OpenAI-Organization': config.organizationId })
        }
      });

      const modelsData = await modelsResponse.json();
      const availableModels = modelsData.data?.map((m: any) => m.id) || [];

      setTestResults({
        chatTest: {
          success: chatSuccess,
          message: chatSuccess ? chatResult.choices?.[0]?.message?.content : chatResult.error?.message
        },
        modelsAvailable: {
          chat: availableModels.filter((m: string) => m.includes('gpt')),
          realtime: availableModels.filter((m: string) => m.includes('realtime')),
          total: availableModels.length
        },
        apiKeyValid: chatResponse.status !== 401,
        timestamp: new Date().toISOString()
      });

      if (chatSuccess) {
        toast({
          title: 'Test Successful',
          description: 'OpenAI API is configured correctly.',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: chatResult.error?.message || 'Unable to connect to OpenAI API.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Test Error',
        description: 'Failed to test OpenAI configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const estimateCosts = () => {
    // Cost estimation based on OpenAI pricing (approximate)
    const costs = {
      chat: {
        'gpt-4o': { input: 0.0025, output: 0.01 },
        'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
      },
      realtime: {
        'gpt-realtime-2025-08-28': { audio: 0.06, text: 0.0025 },
        'gpt-4o-realtime-preview-2024-10-01': { audio: 0.06, text: 0.0025 }
      }
    };

    const chatCost = costs.chat[config.chatModel as keyof typeof costs.chat] || costs.chat['gpt-4o-mini'];
    const realtimeCost = costs.realtime[config.realtimeModel as keyof typeof costs.realtime] || costs.realtime['gpt-realtime-2025-08-28'];

    return {
      chat: chatCost,
      realtime: realtimeCost,
      estimatedMonthly: {
        light: '$10-50',
        moderate: '$50-200',
        heavy: '$200+'
      }
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            OpenAI Configuration
          </CardTitle>
          <CardDescription>
            Configure OpenAI API settings for chat and realtime voice features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI API key. Keep this secure and never share it publicly.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationId" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Organization ID (Optional)
                  </Label>
                  <Input
                    id="organizationId"
                    value={config.organizationId}
                    onChange={(e) => setConfig(prev => ({ ...prev, organizationId: e.target.value }))}
                    placeholder="org-..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI organization ID if you're part of an organization.
                  </p>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security Notice</AlertTitle>
                  <AlertDescription>
                    API keys are sensitive credentials. In production, use environment variables
                    and never expose them in client-side code.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat Model
                  </Label>
                  <Select value={config.chatModel} onValueChange={(value) => setConfig(prev => ({ ...prev, chatModel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chatModels.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Realtime Model
                  </Label>
                  <Select value={config.realtimeModel} onValueChange={(value) => setConfig(prev => ({ ...prev, realtimeModel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {realtimeModels.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Temperature: {config.temperature}
                  </Label>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-sm text-muted-foreground">
                    Controls randomness. Lower is more focused, higher is more creative.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Max Tokens
                  </Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2000 }))}
                    min={1}
                    max={4096}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of tokens to generate in responses.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Voice Selection
                  </Label>
                  <Select value={config.voice} onValueChange={(value) => setConfig(prev => ({ ...prev, voice: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.value} value={voice.value}>
                          <div className="flex flex-col">
                            <span>{voice.label}</span>
                            <span className="text-xs text-muted-foreground">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Connection Type
                  </Label>
                  <Select value={config.connectionType} onValueChange={(value: 'websocket' | 'webrtc') => setConfig(prev => ({ ...prev, connectionType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="websocket">
                        <div className="flex flex-col">
                          <span>WebSocket</span>
                          <span className="text-xs text-muted-foreground">Server-side, more control</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="webrtc">
                        <div className="flex flex-col">
                          <span>WebRTC</span>
                          <span className="text-xs text-muted-foreground">Browser-based, lower latency</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Audio Format
                  </Label>
                  <Select value={config.audioFormat} onValueChange={(value) => setConfig(prev => ({ ...prev, audioFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioFormats.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex flex-col">
                            <span>{format.label}</span>
                            <span className="text-xs text-muted-foreground">{format.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Enable Function Calling
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the AI to call custom functions
                      </p>
                    </div>
                    <Switch
                      checked={config.enableTools}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableTools: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Enable Transcription
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Transcribe audio in real-time
                      </p>
                    </div>
                    <Switch
                      checked={config.enableTranscription}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableTranscription: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Input
                    id="language"
                    value={config.language}
                    onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                    placeholder="en"
                  />
                  <p className="text-sm text-muted-foreground">
                    ISO 639-1 language code (e.g., en, es, fr)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    System Instructions
                  </Label>
                  <textarea
                    id="instructions"
                    className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={config.instructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="You are a helpful AI assistant..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Default instructions for the AI assistant's behavior and personality.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Estimation
                  </h4>
                  {(() => {
                    const costs = estimateCosts();
                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Chat Model:</p>
                            <p>Input: ${costs.chat.input}/1K tokens</p>
                            <p>Output: ${costs.chat.output}/1K tokens</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Realtime Model:</p>
                            <p>Audio: ${costs.realtime.audio}/minute</p>
                            <p>Text: ${costs.realtime.text}/1K tokens</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">Light: {costs.estimatedMonthly.light}</Badge>
                          <Badge variant="outline">Moderate: {costs.estimatedMonthly.moderate}</Badge>
                          <Badge variant="outline">Heavy: {costs.estimatedMonthly.heavy}</Badge>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={testConfiguration} 
                    disabled={isTesting || !config.apiKey}
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        Test Configuration
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={loadConfiguration}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload
                  </Button>
                </div>

                {testResults && (
                  <div className="space-y-4">
                    <Alert variant={testResults.apiKeyValid ? 'default' : 'destructive'}>
                      <div className="flex items-start gap-2">
                        {testResults.apiKeyValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                        )}
                        <div className="space-y-2 flex-1">
                          <AlertTitle>API Key Status</AlertTitle>
                          <AlertDescription>
                            {testResults.apiKeyValid ? 'API key is valid' : 'API key is invalid or missing'}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>

                    {testResults.chatTest && (
                      <Alert variant={testResults.chatTest.success ? 'default' : 'destructive'}>
                        <div className="flex items-start gap-2">
                          {testResults.chatTest.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                          )}
                          <div className="space-y-2 flex-1">
                            <AlertTitle>Chat Model Test</AlertTitle>
                            <AlertDescription>
                              {testResults.chatTest.message}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}

                    {testResults.modelsAvailable && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Available Models</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Models:</span>
                              <span>{testResults.modelsAvailable.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Chat Models:</span>
                              <span>{testResults.modelsAvailable.chat.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Realtime Models:</span>
                              <span>{testResults.modelsAvailable.realtime.length}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {testResults.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Test Error</AlertTitle>
                        <AlertDescription>{testResults.error}</AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Last tested: {new Date(testResults.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={loadConfiguration}>
              Cancel
            </Button>
            <Button onClick={saveConfiguration} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAISettings;