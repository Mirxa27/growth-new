import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Save,
  TestTube2,
  Settings,
  Mic,
  Brain,
  Zap,
  Shield,
  RefreshCw,
  Play,
  Volume2
} from 'lucide-react';

interface VoiceConfig {
  id?: string;
  name: string;
  model: string;
  voice: string;
  instructions: string;
  temperature: number;
  max_tokens: number;
  
  // Audio settings
  input_audio_format: string;
  output_audio_format: string;
  sample_rate: number;
  
  // VAD settings
  vad_threshold: number;
  silence_duration_ms: number;
  prefix_padding_ms: number;
  
  // Response behavior
  response_format: string;
  speed: number;
  enable_interruptions: boolean;
  
  // Advanced settings
  frequency_penalty: number;
  presence_penalty: number;
  top_p: number;
  enable_transcription: boolean;
  
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy - Neutral and balanced' },
  { value: 'echo', label: 'Echo - Warm and expressive' },
  { value: 'fable', label: 'Fable - Clear and articulate' },
  { value: 'onyx', label: 'Onyx - Deep and authoritative' },
  { value: 'nova', label: 'Nova - Bright and energetic' },
  { value: 'shimmer', label: 'Shimmer - Soft and gentle' }
];

const MODEL_OPTIONS = [
  { value: 'gpt-4o-realtime-preview', label: 'GPT-4o Realtime (Latest)' },
  { value: 'gpt-4o-mini-realtime-preview', label: 'GPT-4o Mini Realtime (Fast)' }
];

const AUDIO_FORMAT_OPTIONS = [
  { value: 'pcm16', label: 'PCM16 (Recommended)' },
  { value: 'g711_ulaw', label: 'G.711 μ-law' },
  { value: 'g711_alaw', label: 'G.711 A-law' }
];

const DEFAULT_CONFIG: VoiceConfig = {
  name: 'Default NewMe Configuration',
  model: 'gpt-4o-realtime-preview',
  voice: 'alloy',
  instructions: `You are NewMe, a supportive AI companion specifically designed for women's personal growth and empowerment. 

Your core purpose is to provide warm, encouraging guidance while helping users discover their authentic selves and build confidence in their personal growth journey.

Key traits:
- Speak with warmth, empathy, and understanding
- Offer practical insights and actionable advice
- Celebrate achievements and progress, no matter how small
- Use inclusive, empowering language
- Be authentic and genuine in your responses
- Maintain a supportive yet professional tone

Remember: Every woman deserves to feel heard, valued, and empowered to pursue her dreams.`,
  temperature: 0.8,
  max_tokens: 4096,
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  sample_rate: 24000,
  vad_threshold: 0.5,
  silence_duration_ms: 500,
  prefix_padding_ms: 300,
  response_format: 'audio',
  speed: 1.0,
  enable_interruptions: true,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 1,
  enable_transcription: true,
  is_active: true
};

export const AdvancedVoiceConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<VoiceConfig>(DEFAULT_CONFIG);
  const [savedConfigs, setSavedConfigs] = useState<VoiceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedConfigs(data || []);
      
      // Load active configuration
      const activeConfig = data?.find((c: any) => c.is_active);
      if (activeConfig) {
        setConfig(activeConfig);
      }
    } catch (error: any) {
      console.error('Error loading configurations:', error);
      toast({
        title: "Error",
        description: "Failed to load voice configurations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Deactivate other configs if this one is active
      if (config.is_active) {
        await (supabase as any)
          .from('voice_agent_configs')
          .update({ is_active: false })
          .neq('id', config.id || '');
      }

      const { data, error } = await (supabase as any)
        .from('voice_agent_configs')
        .upsert([{
          ...config,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Voice assistant configuration has been saved successfully.",
      });

      await loadConfigurations();
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConfiguration = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the configuration by attempting to get a realtime token
      const { data, error } = await supabase.functions.invoke('get-realtime-token', {
        body: { 
          model: config.model,
          test_mode: true
        }
      });

      if (error) throw error;

      setTestResult({
        success: true,
        message: "Configuration test successful! Voice assistant is ready to use."
      });

      toast({
        title: "Test Successful",
        description: "Voice assistant configuration is working correctly.",
      });

    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Configuration test failed"
      });

      toast({
        title: "Test Failed",
        description: error.message || "Configuration test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const loadConfiguration = (savedConfig: VoiceConfig) => {
    setConfig(savedConfig);
    toast({
      title: "Configuration Loaded",
      description: `Loaded configuration: ${savedConfig.name}`,
    });
  };

  const resetToDefaults = () => {
    setConfig({ ...DEFAULT_CONFIG, id: config.id });
    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset to default values.",
    });
  };

  const updateConfig = (field: keyof VoiceConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Advanced Voice Assistant Configuration
          </CardTitle>
          <CardDescription>
            Customize your NewMe voice assistant with advanced AI and audio settings for optimal performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                value={config.name ?? ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                className="glass-input"
                placeholder="Enter configuration name"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => updateConfig('is_active', checked)}
              />
              <Label>Set as Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="model" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 glass">
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Model
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice & Audio
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        {/* AI Model Tab */}
        <TabsContent value="model">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>
                Configure the underlying AI model and its behavior parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={config.model ?? ''} onValueChange={(value) => updateConfig('model', value)}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    min={1}
                    max={8192}
                    value={config.max_tokens ?? 4096}
                    onChange={(e) => updateConfig('max_tokens', parseInt(e.target.value))}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label>Temperature: {config.temperature ?? 0.8}</Label>
                   <Slider
                     value={[config.temperature ?? 0.8]}
                     onValueChange={([value]) => updateConfig('temperature', value)}
                     max={2}
                     min={0}
                     step={0.1}
                     className="w-full"
                   />
                  <p className="text-sm text-muted-foreground">
                    Controls randomness in responses. Lower values (0.2-0.5) for focused responses, higher values (0.8-1.2) for creative responses.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Top P: {config.top_p ?? 1}</Label>
                  <Slider
                    value={[config.top_p ?? 1]}
                    onValueChange={([value]) => updateConfig('top_p', value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Frequency Penalty: {config.frequency_penalty ?? 0}</Label>
                  <Slider
                    value={[config.frequency_penalty ?? 0]}
                    onValueChange={([value]) => updateConfig('frequency_penalty', value)}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  value={config.instructions ?? ''}
                  onChange={(e) => updateConfig('instructions', e.target.value)}
                  className="glass-input min-h-[200px]"
                  placeholder="Enter system instructions for the AI assistant..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice & Audio Tab */}
        <TabsContent value="voice">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice & Audio Settings
              </CardTitle>
              <CardDescription>
                Configure voice characteristics and audio processing parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice Selection</Label>
                  <Select value={config.voice} onValueChange={(value) => updateConfig('voice', value)}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Speech Speed: {config.speed}x</Label>
                  <Slider
                    value={[config.speed]}
                    onValueChange={([value]) => updateConfig('speed', value)}
                    max={4}
                    min={0.25}
                    step={0.25}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input-format">Input Audio Format</Label>
                  <Select value={config.input_audio_format ?? 'pcm16'} onValueChange={(value) => updateConfig('input_audio_format', value)}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIO_FORMAT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Audio Format</Label>
                  <Select value={config.output_audio_format ?? 'pcm16'} onValueChange={(value) => updateConfig('output_audio_format', value)}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIO_FORMAT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample-rate">Sample Rate (Hz)</Label>
                  <Input
                    id="sample-rate"
                    type="number"
                    value={config.sample_rate ?? 24000}
                    onChange={(e) => updateConfig('sample_rate', parseInt(e.target.value))}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-3">
                  <Label>VAD Threshold: {config.vad_threshold ?? 0.5}</Label>
                  <Slider
                    value={[config.vad_threshold ?? 0.5]}
                    onValueChange={([value]) => updateConfig('vad_threshold', value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Voice Activity Detection sensitivity. Lower values detect quieter speech.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Response Behavior
              </CardTitle>
              <CardDescription>
                Configure how the assistant responds and behaves during conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="silence-duration">Silence Duration (ms)</Label>
                  <Input
                    id="silence-duration"
                    type="number"
                    value={config.silence_duration_ms ?? 500}
                    onChange={(e) => updateConfig('silence_duration_ms', parseInt(e.target.value))}
                    className="glass-input"
                  />
                  <p className="text-sm text-muted-foreground">
                    How long to wait for silence before considering speech ended.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefix-padding">Prefix Padding (ms)</Label>
                  <Input
                    id="prefix-padding"
                    type="number"
                    value={config.prefix_padding_ms ?? 300}
                    onChange={(e) => updateConfig('prefix_padding_ms', parseInt(e.target.value))}
                    className="glass-input"
                  />
                  <p className="text-sm text-muted-foreground">
                    Audio captured before speech detection for context.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={config.enable_interruptions}
                      onCheckedChange={(checked) => updateConfig('enable_interruptions', checked)}
                    />
                    <Label>Enable Interruptions</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow users to interrupt the assistant while speaking.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={config.enable_transcription}
                      onCheckedChange={(checked) => updateConfig('enable_transcription', checked)}
                    />
                    <Label>Enable Transcription</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show real-time transcription of conversations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Fine-tune advanced parameters for expert users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Presence Penalty: {config.presence_penalty}</Label>
                  <Slider
                    value={[config.presence_penalty]}
                    onValueChange={([value]) => updateConfig('presence_penalty', value)}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Reduces repetition by penalizing tokens that have already appeared.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response-format">Response Format</Label>
                  <Select value={config.response_format ?? 'audio'} onValueChange={(value) => updateConfig('response_format', value)}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">Audio Only</SelectItem>
                      <SelectItem value="text">Text Only</SelectItem>
                      <SelectItem value="both">Audio + Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Test Configuration */}
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                <h4 className="font-semibold mb-3">Configuration Testing</h4>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={testConfiguration}
                    disabled={isTesting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube2 className="h-4 w-4" />
                    )}
                    {isTesting ? 'Testing...' : 'Test Configuration'}
                  </Button>
                  
                  {testResult && (
                    <Badge variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? "✓ Test Passed" : "✗ Test Failed"}
                    </Badge>
                  )}
                </div>
                
                {testResult && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {testResult.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Save/Load Configuration */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Configuration Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={saveConfiguration}
                    disabled={isSaving}
                    className="bg-gradient-primary flex-1"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  
                  <Button
                    onClick={resetToDefaults}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved Configurations */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Saved Configurations</CardTitle>
                <CardDescription>
                  Load previously saved voice assistant configurations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : savedConfigs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No saved configurations found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedConfigs.map((savedConfig) => (
                      <div
                        key={savedConfig.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-white/50"
                      >
                        <div>
                          <p className="font-medium">{savedConfig.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {savedConfig.model} • {savedConfig.voice}
                            {savedConfig.is_active && (
                              <Badge className="ml-2" variant="default">Active</Badge>
                            )}
                          </p>
                        </div>
                        <Button
                          onClick={() => loadConfiguration(savedConfig)}
                          variant="outline"
                          size="sm"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedVoiceConfigPanel;
