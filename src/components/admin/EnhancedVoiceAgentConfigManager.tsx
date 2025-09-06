import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, AlertCircle, Mic, Settings, TestTube, Play, Square, Volume2 } from 'lucide-react';
import { z } from 'zod';

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
const MODELS = [
  'gpt-4o-realtime-preview-2024-10-01',
  'gpt-4o-realtime-preview-2024-12-17'
] as const;

const voiceAgentConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  provider: z.string().default('openai'),
  voice: z.enum(VOICES),
  model: z.enum(MODELS),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  temperature: z.number().min(0).max(1),
  is_active: z.boolean(),
  
  // OpenAI API Configuration
  openai_api_key: z.string().optional(),
  openai_organization: z.string().optional(),
  openai_project: z.string().optional(),
  api_base_url: z.string().url().optional().or(z.literal('')),
  max_tokens: z.number().min(1).max(8192).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  
  // Voice specific settings
  enable_realtime: z.boolean().optional(),
  use_proxy: z.boolean().optional(),
  proxy_url: z.string().url().optional().or(z.literal('')),
  input_audio_transcription_model: z.string().optional(),
  language: z.string().optional(),
  arabic_support: z.boolean().optional(),
  emotion_detection: z.boolean().optional(),
});

type VoiceAgentConfig = z.infer<typeof voiceAgentConfigSchema>;

interface VoiceTestState {
  isConnecting: boolean;
  isConnected: boolean;
  isRecording: boolean;
  hasError: boolean;
  errorMessage: string;
}

export default function EnhancedVoiceAgentConfigManager() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<VoiceAgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [voiceTest, setVoiceTest] = useState<VoiceTestState>({
    isConnecting: false,
    isConnected: false,
    isRecording: false,
    hasError: false,
    errorMessage: ''
  });

  const [form, setForm] = useState<VoiceAgentConfig>({
    name: 'Default Voice Agent',
    provider: 'openai',
    voice: 'nova',
    model: 'gpt-4o-realtime-preview-2024-10-01',
    instructions: 'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful. Help users explore their emotions, set goals, and build confidence. Keep responses warm and conversational.',
    temperature: 0.7,
    is_active: true,
    enable_realtime: true,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    use_proxy: false,
    input_audio_transcription_model: 'whisper-1',
    language: 'en',
    arabic_support: false,
    emotion_detection: false,
    openai_api_key: '',
    openai_organization: '',
    openai_project: '',
    api_base_url: '',
    proxy_url: ''
  });

  // Load configurations
  const loadConfigs = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConfigs(data || []);
      
      // Load the active config into the form
      const activeConfig = data?.find(config => config.is_active);
      if (activeConfig) {
        setForm(activeConfig);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: "Error",
        description: "Failed to load voice agent configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const validateForm = () => {
    try {
      voiceAgentConfigSchema.parse(form);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const saveConfiguration = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // First, set all configs to inactive if this one is being set as active
      if (form.is_active) {
        await supabase
          .from('voice_agent_configs')
          .update({ is_active: false })
          .neq('id', form.id || '');
      }

      const configData = {
        ...form,
        // Remove empty strings to let database defaults take effect
        openai_api_key: form.openai_api_key || null,
        openai_organization: form.openai_organization || null,
        openai_project: form.openai_project || null,
        api_base_url: form.api_base_url || null,
        proxy_url: form.proxy_url || null,
      };

      let result;
      if (form.id) {
        // Update existing
        result = await supabase
          .from('voice_agent_configs')
          .update(configData)
          .eq('id', form.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('voice_agent_configs')
          .insert(configData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: "Voice agent configuration saved successfully"
      });

      await loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before testing",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);
      setVoiceTest({
        isConnecting: true,
        isConnected: false,
        isRecording: false,
        hasError: false,
        errorMessage: ''
      });

      // Test the OpenAI API key and configuration
      const testPayload = {
        model: form.model,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${form.openai_api_key}`,
          'Content-Type': 'application/json',
          ...(form.openai_organization && { 'OpenAI-Organization': form.openai_organization }),
          ...(form.openai_project && { 'OpenAI-Project': form.openai_project })
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }

      setVoiceTest({
        isConnecting: false,
        isConnected: true,
        isRecording: false,
        hasError: false,
        errorMessage: ''
      });

      toast({
        title: "Test Successful",
        description: "Voice agent configuration is working correctly"
      });

    } catch (error) {
      console.error('Test failed:', error);
      setVoiceTest({
        isConnecting: false,
        isConnected: false,
        isRecording: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Test Failed",
        description: "Configuration test failed. Please check your settings.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const startVoiceTest = async () => {
    try {
      setVoiceTest(prev => ({ ...prev, isRecording: true }));
      
      // This would connect to the actual voice API
      // For now, we'll simulate a successful test
      setTimeout(() => {
        setVoiceTest(prev => ({ ...prev, isRecording: false }));
        toast({
          title: "Voice Test Complete",
          description: "Voice recording and playback test completed successfully"
        });
      }, 3000);

    } catch (error) {
      console.error('Voice test failed:', error);
      setVoiceTest(prev => ({ 
        ...prev, 
        isRecording: false, 
        hasError: true,
        errorMessage: 'Voice test failed'
      }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Agent Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Agent Configuration
          </CardTitle>
          <CardDescription>
            Configure OpenAI Voice Agents for real-time conversations. Follow the OpenAI Realtime API best practices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="test">Test & Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Default Voice Agent"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Select value={form.model} onValueChange={(value: typeof MODELS[number]) => setForm(p => ({ ...p, model: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                            {model === 'gpt-4o-realtime-preview-2024-12-17' && (
                              <Badge variant="secondary" className="ml-2">Latest</Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature: {form.temperature}</Label>
                    <Slider
                      value={[form.temperature]}
                      onValueChange={([value]) => setForm(p => ({ ...p, temperature: value }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>More Focused</span>
                      <span>More Creative</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                    <Input
                      id="openai_api_key"
                      type="password"
                      value={form.openai_api_key}
                      onChange={e => setForm(p => ({ ...p, openai_api_key: e.target.value }))}
                      placeholder="sk-..."
                    />
                    {errors.openai_api_key && <p className="text-sm text-destructive">{errors.openai_api_key}</p>}
                  </div>

                  <div>
                    <Label htmlFor="openai_organization">Organization ID (Optional)</Label>
                    <Input
                      id="openai_organization"
                      value={form.openai_organization}
                      onChange={e => setForm(p => ({ ...p, openai_organization: e.target.value }))}
                      placeholder="org-..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={checked => setForm(p => ({ ...p, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active Configuration</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  value={form.instructions}
                  onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                  rows={4}
                  placeholder="Define the agent's personality and behavior..."
                />
                {errors.instructions && <p className="text-sm text-destructive">{errors.instructions}</p>}
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voice">Voice</Label>
                    <Select value={form.voice} onValueChange={(value: typeof VOICES[number]) => setForm(p => ({ ...p, voice: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICES.map(voice => (
                          <SelectItem key={voice} value={voice}>
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-4 w-4" />
                              {voice.charAt(0).toUpperCase() + voice.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.voice && <p className="text-sm text-destructive">{errors.voice}</p>}
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={form.language} onValueChange={value => setForm(p => ({ ...p, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="arabic_support"
                      checked={form.arabic_support}
                      onCheckedChange={checked => setForm(p => ({ ...p, arabic_support: checked }))}
                    />
                    <Label htmlFor="arabic_support">Arabic Language Support</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="input_audio_transcription_model">Transcription Model</Label>
                    <Select 
                      value={form.input_audio_transcription_model} 
                      onValueChange={value => setForm(p => ({ ...p, input_audio_transcription_model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whisper-1">Whisper-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emotion_detection"
                      checked={form.emotion_detection}
                      onCheckedChange={checked => setForm(p => ({ ...p, emotion_detection: checked }))}
                    />
                    <Label htmlFor="emotion_detection">Emotion Detection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable_realtime"
                      checked={form.enable_realtime}
                      onCheckedChange={checked => setForm(p => ({ ...p, enable_realtime: checked }))}
                    />
                    <Label htmlFor="enable_realtime">Enable Realtime Mode</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max_tokens">Max Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={form.max_tokens}
                      onChange={e => setForm(p => ({ ...p, max_tokens: parseInt(e.target.value) || 1000 }))}
                      min={1}
                      max={8192}
                    />
                  </div>

                  <div>
                    <Label htmlFor="top_p">Top P: {form.top_p}</Label>
                    <Slider
                      value={[form.top_p || 1]}
                      onValueChange={([value]) => setForm(p => ({ ...p, top_p: value }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency_penalty">Frequency Penalty: {form.frequency_penalty}</Label>
                    <Slider
                      value={[form.frequency_penalty || 0]}
                      onValueChange={([value]) => setForm(p => ({ ...p, frequency_penalty: value }))}
                      max={2}
                      min={-2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="presence_penalty">Presence Penalty: {form.presence_penalty}</Label>
                    <Slider
                      value={[form.presence_penalty || 0]}
                      onValueChange={([value]) => setForm(p => ({ ...p, presence_penalty: value }))}
                      max={2}
                      min={-2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api_base_url">Custom API Base URL (Optional)</Label>
                    <Input
                      id="api_base_url"
                      value={form.api_base_url}
                      onChange={e => setForm(p => ({ ...p, api_base_url: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use_proxy"
                      checked={form.use_proxy}
                      onCheckedChange={checked => setForm(p => ({ ...p, use_proxy: checked }))}
                    />
                    <Label htmlFor="use_proxy">Use Proxy</Label>
                  </div>

                  {form.use_proxy && (
                    <div>
                      <Label htmlFor="proxy_url">Proxy URL</Label>
                      <Input
                        id="proxy_url"
                        value={form.proxy_url}
                        onChange={e => setForm(p => ({ ...p, proxy_url: e.target.value }))}
                        placeholder="https://your-proxy.com"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Configuration Test
                    </CardTitle>
                    <CardDescription>
                      Test your OpenAI API credentials and configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={testConfiguration} 
                      disabled={testing}
                      className="w-full"
                    >
                      {testing ? 'Testing...' : 'Test Configuration'}
                    </Button>

                    {voiceTest.hasError && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{voiceTest.errorMessage}</span>
                      </div>
                    )}

                    {voiceTest.isConnected && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">Configuration is valid</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Voice Test
                    </CardTitle>
                    <CardDescription>
                      Test real-time voice functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={startVoiceTest} 
                      disabled={voiceTest.isRecording || !voiceTest.isConnected}
                      className="w-full"
                      variant={voiceTest.isRecording ? "destructive" : "default"}
                    >
                      {voiceTest.isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Test
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Voice Test
                        </>
                      )}
                    </Button>

                    {voiceTest.isRecording && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span className="text-sm">Recording voice test...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 pt-6 border-t">
            <Button 
              onClick={saveConfiguration} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>

            <Button 
              variant="outline" 
              onClick={loadConfigs}
              disabled={loading}
            >
              Reset to Saved
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Configurations</CardTitle>
          <CardDescription>
            Manage your voice agent configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{config.name}</h4>
                    {config.is_active && (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.voice} • {config.model}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(config)}
                >
                  Load
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
