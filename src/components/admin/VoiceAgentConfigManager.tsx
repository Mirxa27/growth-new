import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceAgentConfig } from '@/hooks/useVoiceAgentConfig';
import { Save, AlertCircle, Mic, Settings, TestTube } from 'lucide-react';
import { z } from 'zod';
import { Tables } from '@/integrations/supabase/types';
import { adminAPIConfigService } from '@/services/admin/adminAPIConfigService';

// Define a more specific type for the configuration object that includes optional fields.
type VoiceAgentConfigWithAdvanced = Tables<'voice_agent_configs'> & {
  enable_realtime?: boolean;
  use_proxy?: boolean;
  proxy_url?: string | null;
  input_audio_transcription_model?: string | null;
  language?: string | null;
  arabic_support?: boolean;
  emotion_detection?: boolean;
  input_audio_format?: string | null;
  output_audio_format?: string | null;
  turn_detection_type?: string | null;
  turn_detection_threshold?: number | null;
  turn_detection_prefix_padding_ms?: number | null;
  turn_detection_silence_duration_ms?: number | null;
};

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

// Schema for all columns that might exist in the voice_agent_configs table.
const voiceAgentConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  voice: z.enum(VOICES).refine(val => VOICES.includes(val), 'Invalid voice selection'),
  model: z.string().min(1, 'Model is required'),
  instructions: z.string().optional(),
  temperature: z.number().min(0).max(1),
  is_active: z.boolean(),
  // Optional advanced columns
  enable_realtime: z.boolean().optional(),
  use_proxy: z.boolean().optional(),
  proxy_url: z.string().url().optional().or(z.literal('')),
  input_audio_transcription_model: z.string().optional(),
  language: z.string().optional(),
  arabic_support: z.boolean().optional(),
  emotion_detection: z.boolean().optional(),
  input_audio_format: z.string().optional(),
  output_audio_format: z.string().optional(),
  turn_detection_type: z.string().optional(),
  turn_detection_threshold: z.number().optional(),
  turn_detection_prefix_padding_ms: z.number().optional(),
  turn_detection_silence_duration_ms: z.number().optional(),
});

type VoiceAgentConfig = z.infer<typeof voiceAgentConfigSchema>;

// Interface for the OpenAI provider configuration
interface OpenAIProviderConfiguration {
  api_key?: string;
  base_url?: string;
  organization?: string;
  project?: string;
}


export const VoiceAgentConfigManager: React.FC = () => {
  const { configs, loading, error: fetchError } = useVoiceAgentConfig();
  const { toast } = useToast();
  
  const activeConfig = useMemo(() => configs?.find(c => c.is_active) ?? configs?.[0] ?? null, [configs]);

  const [form, setForm] = useState<VoiceAgentConfig>({
    id: '', 
    name: '', 
    provider: 'openai', 
    voice: 'alloy', 
    model: 'gpt-realtime-2025-08-28',
    temperature: 0.7, 
    instructions: '', 
    is_active: true,
    // Realtime defaults
    enable_realtime: true, 
    use_proxy: true, 
    proxy_url: '', 
    input_audio_transcription_model: 'whisper-1', 
    language: 'en', 
    arabic_support: true, 
    emotion_detection: true,
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    turn_detection_type: 'server_vad',
    turn_detection_threshold: 0.5,
    turn_detection_prefix_padding_ms: 300,
    turn_detection_silence_duration_ms: 1000,
  });
  
  useEffect(() => {
    if (activeConfig) {
      try {
        // The activeConfig might have fields not strictly defined in the base type.
        const extendedConfig = activeConfig as VoiceAgentConfigWithAdvanced;

        const validatedConfig = voiceAgentConfigSchema.parse({
          id: extendedConfig.id,
          name: extendedConfig.name,
          provider: extendedConfig.provider,
          voice: extendedConfig.voice,
          model: extendedConfig.model,
          temperature: extendedConfig.temperature,
          instructions: extendedConfig.instructions ?? '',
          is_active: extendedConfig.is_active,
          // Voice settings / advanced with fallbacks to defaults
          enable_realtime: extendedConfig.enable_realtime ?? true,
          use_proxy: extendedConfig.use_proxy ?? true,
          proxy_url: extendedConfig.proxy_url ?? '',
          input_audio_transcription_model: extendedConfig.input_audio_transcription_model ?? 'whisper-1',
          language: extendedConfig.language ?? 'en',
          arabic_support: extendedConfig.arabic_support ?? true,
          emotion_detection: extendedConfig.emotion_detection ?? true,
          input_audio_format: extendedConfig.input_audio_format ?? 'pcm16',
          output_audio_format: extendedConfig.output_audio_format ?? 'pcm16',
          turn_detection_type: extendedConfig.turn_detection_type ?? 'server_vad',
          turn_detection_threshold: extendedConfig.turn_detection_threshold ?? 0.5,
          turn_detection_prefix_padding_ms: extendedConfig.turn_detection_prefix_padding_ms ?? 300,
          turn_detection_silence_duration_ms: extendedConfig.turn_detection_silence_duration_ms ?? 1000,
        });
        setForm(validatedConfig);
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error('Invalid config from database:', e.issues);
          toast({
            title: "Warning",
            description: "The configuration from the database is invalid. Using default values.",
            variant: "destructive"
          });
        }
      }
    }
  }, [activeConfig, toast]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Admin AI provider config local state
  const [providerApiKey, setProviderApiKey] = useState<string>('');
  const [providerBaseUrl, setProviderBaseUrl] = useState<string>('');
  const [providerOrg, setProviderOrg] = useState<string>('');
  const [providerProject, setProviderProject] = useState<string>('');

  useEffect(() => {
    // Load admin provider config for display
    (async () => {
      try {
        const provider = await adminAPIConfigService.getActiveOpenAIProvider();
        if (provider?.configuration) {
          const config = provider.configuration as OpenAIProviderConfiguration;
          setProviderApiKey(config.api_key || '');
          setProviderBaseUrl(config.base_url || 'https://api.openai.com/v1');
          setProviderOrg(config.organization || '');
          setProviderProject(config.project || '');
        }
      } catch (_e) {
        // non-fatal, can be ignored
      }
    })();
  }, []);

  const handleSave = async () => {
    setErrors({});
    console.log('Saving voice agent config:', form);
    try {
      const validatedConfig = voiceAgentConfigSchema.parse(form);
      setIsSaving(true);
      
      if (validatedConfig.is_active) {
        const { error: deactivateError } = await supabase
          .from('voice_agent_configs')
          .update({ is_active: false })
          .neq('id', validatedConfig.id || '');

        if (deactivateError) {
          console.error('Error deactivating other configs:', deactivateError);
          throw new Error('Failed to update active configuration status');
        }
      }

      // The validatedConfig from Zod contains all the fields defined in the schema.
      // We can directly use it as the payload for upserting.
      const dbPayload = { ...validatedConfig };
      if (!dbPayload.id) {
        delete dbPayload.id; // Let Supabase generate the ID on insert
      }

      const { error: upsertError } = await supabase
        .from('voice_agent_configs')
        .upsert([dbPayload]);

      if (upsertError) {
        console.error('Error upserting config:', upsertError);
        throw new Error('Failed to save configuration');
      }

      // Update admin OpenAI provider configuration server-side
      await adminAPIConfigService.updateOpenAIProvider({
        api_key: providerApiKey,
        base_url: providerBaseUrl || 'https://api.openai.com/v1',
        organization: providerOrg || undefined,
        project: providerProject || undefined,
        temperature: validatedConfig.temperature,
        model: 'gpt-realtime-2025-08-28'
      });

      toast({ title: "Success", description: "Configuration saved successfully." });
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        const zodErrors: Record<string, string> = {};
        e.issues.forEach(err => {
          if (err.path.length > 0) {
            zodErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(zodErrors);
      } else if (e instanceof Error) {
        console.error('Error saving config:', e);
        toast({ 
          title: "Error", 
          description: e.message || 'An unexpected error occurred', 
          variant: "destructive" 
        });
      } else {
         toast({ 
          title: "Error", 
          description: 'An unexpected error occurred', 
          variant: "destructive" 
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Loading configuration...</div>;
  if (fetchError) return <div className="text-red-500">Error loading configuration: {fetchError}</div>;

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mic className="h-6 w-6" /> Voice Agent Configuration</CardTitle>
          <CardDescription>
            Customize the active voice agent's personality, voice, and other settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input id="name" className="glass-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Select value={form.voice ?? 'alloy'} onValueChange={(v: typeof VOICES[number]) => setForm(p => ({ ...p, voice: v }))}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select voice" /></SelectTrigger>
                <SelectContent>
                  {VOICES.map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.voice && <p className="text-sm text-red-500">{errors.voice}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Input id="model" className="glass-input" value={form.model ?? ''} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
              {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (0-1)</Label>
              <Input id="temperature" type="number" min={0} max={1} step={0.1} className="glass-input" value={form.temperature ?? 0.7} onChange={e => setForm(p => ({ ...p, temperature: Number(e.target.value) }))} />
              {errors.temperature && <p className="text-sm text-red-500">{errors.temperature}</p>}
            </div>
          </div>

          {/* OpenAI API Configuration Section */}
          <div className="space-y-4 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
            <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              OpenAI API Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                <Input 
                  id="openai_api_key" 
                  type="password" 
                  className="glass-input" 
                  value={providerApiKey} 
                  onChange={e => setProviderApiKey(e.target.value)} 
                  placeholder="sk-..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai_organization">OpenAI Organization (Optional)</Label>
                <Input 
                  id="openai_organization" 
                  className="glass-input" 
                  value={providerOrg} 
                  onChange={e => setProviderOrg(e.target.value)} 
                  placeholder="org-..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai_project">OpenAI Project (Optional)</Label>
                <Input 
                  id="openai_project" 
                  className="glass-input" 
                  value={providerProject} 
                  onChange={e => setProviderProject(e.target.value)} 
                  placeholder="proj_..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
                <Input 
                  id="api_base_url" 
                  className="glass-input" 
                  value={providerBaseUrl} 
                  onChange={e => setProviderBaseUrl(e.target.value)} 
                  placeholder="https://api.openai.com/v1" 
                />
              </div>
            </div>
          </div>

          {/* Voice Realtime Configuration */}
          <div className="space-y-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Realtime Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="enable_realtime">Enable Realtime</Label>
              <div className="flex items-center gap-3">
                <Switch id="enable_realtime" checked={!!form.enable_realtime} onCheckedChange={(checked) => setForm(p => ({ ...p, enable_realtime: checked }))} />
                <span className="text-sm text-muted-foreground">Use OpenAI Realtime for voice</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="use_proxy">Use Proxy</Label>
              <div className="flex items-center gap-3">
                <Switch id="use_proxy" checked={!!form.use_proxy} onCheckedChange={(checked) => setForm(p => ({ ...p, use_proxy: checked }))} />
                <span className="text-sm text-muted-foreground">Proxy calls via Edge Function</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxy_url">Proxy URL</Label>
              <Input id="proxy_url" className="glass-input" value={form.proxy_url || ''} onChange={e => setForm(p => ({ ...p, proxy_url: e.target.value }))} placeholder="https://your-project.supabase.co/functions/v1/realtime-voice-proxy" />
              {errors.proxy_url && <p className="text-sm text-red-500">{errors.proxy_url}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="input_audio_transcription_model">Transcription Model</Label>
              <Input id="input_audio_transcription_model" className="glass-input" value={form.input_audio_transcription_model || 'whisper-1'} onChange={e => setForm(p => ({ ...p, input_audio_transcription_model: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" className="glass-input" value={form.language || 'en'} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} placeholder="en or ar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arabic_support">Arabic Support</Label>
              <div className="flex items-center gap-3">
                <Switch id="arabic_support" checked={!!form.arabic_support} onCheckedChange={(checked) => setForm(p => ({ ...p, arabic_support: checked }))} />
                <span className="text-sm text-muted-foreground">Enable cultural expressions</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emotion_detection">Emotion Detection</Label>
              <div className="flex items-center gap-3">
                <Switch id="emotion_detection" checked={!!form.emotion_detection} onCheckedChange={(checked) => setForm(p => ({ ...p, emotion_detection: checked }))} />
                <span className="text-sm text-muted-foreground">Detect tone and emotion</span>
              </div>
            </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">System Instructions</Label>
            <Textarea id="instructions" className="glass-input min-h-40" value={form.instructions || ''} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Customize NewMe's guidance style and constraints..." />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch id="is_active" checked={!!form.is_active} onCheckedChange={(checked) => setForm(p => ({ ...p, is_active: checked }))} />
              <Label htmlFor="is_active">Set as active configuration</Label>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('test-ai-provider', {
                      body: { provider: 'openai' }
                    });
                    if (error) throw error;
                    toast({
                      title: data?.success ? 'Test Successful' : 'Test Failed',
                      description: data?.message || 'Completed',
                      variant: data?.success ? 'default' : 'destructive'
                    });
                  } catch (e: unknown) {
                     if (e instanceof Error) {
                        toast({ title: 'Test Failed', description: e.message || 'Error testing configuration', variant: 'destructive' });
                     } else {
                        toast({ title: 'Test Failed', description: 'An unknown error occurred during testing', variant: 'destructive' });
                     }
                  }
                }}
                variant="outline" 
                className="glass"
                disabled={false}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Config
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6" /> Manage Configurations</CardTitle>
          <CardDescription>
            Switch between different saved voice agent configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs && configs.length > 0 ? (
            <div className="space-y-2">
              {configs.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg glass">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.model} - {c.voice}</p>
                  </div>
                  <Button
                    variant={c.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      try {
                        const parsed = voiceAgentConfigSchema.parse({
                          ...c, // Spread the config object
                          temperature: typeof c.temperature === 'number' ? c.temperature : 0.7,
                          instructions: c.instructions ?? '',
                          is_active: !!c.is_active,
                        });
                        setForm(parsed);
                      } catch (e) {
                        console.warn('Invalid config when loading selection:', e);
                        toast({ title: 'Invalid config', description: 'Could not load configuration', variant: 'destructive' });
                      }
                    }}
                  >
                    {c.is_active ? 'Active' : 'Load'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No configurations found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};