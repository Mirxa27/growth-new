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
import { TablesInsert } from '@/integrations/supabase/types';

type VoiceAgentConfigInsert = TablesInsert<'voice_agent_configs'>;

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

const voiceAgentConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  voice: z.enum(VOICES).refine(val => VOICES.includes(val), 'Invalid voice selection'),
  model: z.string().min(1, 'Model is required'),
  instructions: z.string().optional(),
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

export const VoiceAgentConfigManager: React.FC = () => {
  const { configs, loading, error: fetchError } = useVoiceAgentConfig();
  const { toast } = useToast();
  
  const activeConfig = useMemo(() => configs?.find(c => c.is_active) ?? configs?.[0] ?? null, [configs]);

  const [form, setForm] = useState<VoiceAgentConfig>({
    id: '', 
    name: '', 
    provider: 'openai', 
    voice: 'alloy', 
    model: 'gpt-4o-mini', 
    temperature: 0.7, 
    instructions: '', 
    is_active: true,
    // OpenAI API defaults
    openai_api_key: '', 
    openai_organization: '', 
    openai_project: '', 
    api_base_url: '',
    max_tokens: 4096, 
    top_p: 1, 
    frequency_penalty: 0, 
    presence_penalty: 0,
    // Realtime defaults
    enable_realtime: true, 
    use_proxy: true, 
    proxy_url: '', 
    input_audio_transcription_model: 'whisper-1', 
    language: 'en', 
    arabic_support: true, 
    emotion_detection: true
  });
  
  useEffect(() => {
    if (activeConfig) {
      try {
        const validatedConfig = voiceAgentConfigSchema.parse({
          id: activeConfig.id,
          name: activeConfig.name,
          provider: activeConfig.provider,
          voice: activeConfig.voice,
          model: activeConfig.model,
          temperature: activeConfig.temperature,
          instructions: activeConfig.instructions ?? '',
          is_active: activeConfig.is_active,
          // OpenAI API fields
          openai_api_key: (activeConfig as any).openai_api_key ?? '',
          openai_organization: (activeConfig as any).openai_organization ?? '',
          openai_project: (activeConfig as any).openai_project ?? '',
          api_base_url: (activeConfig as any).api_base_url ?? '',
          max_tokens: (activeConfig as any).max_tokens ?? 4096,
          top_p: (activeConfig as any).top_p ?? 1,
          frequency_penalty: (activeConfig as any).frequency_penalty ?? 0,
          presence_penalty: (activeConfig as any).presence_penalty ?? 0,
          // Voice settings
          enable_realtime: (activeConfig as any).enable_realtime ?? true,
          use_proxy: (activeConfig as any).use_proxy ?? true,
          proxy_url: (activeConfig as any).proxy_url ?? '',
          input_audio_transcription_model: (activeConfig as any).input_audio_transcription_model ?? 'whisper-1',
          language: (activeConfig as any).language ?? 'en',
          arabic_support: (activeConfig as any).arabic_support ?? true,
          emotion_detection: (activeConfig as any).emotion_detection ?? true,
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

  const validate = (data: typeof form) => {
    return voiceAgentConfigSchema.parse(data);
  };

  const handleSave = async () => {
    setErrors({});
    console.log('Saving voice agent config:', form);
    try {
      const validatedConfig = validate(form);
      setIsSaving(true);
      
      if (validatedConfig.is_active) {
        const { error: deactivateError } = await (supabase as any)
          .from('voice_agent_configs')
          .update({ is_active: false })
          .neq('id', validatedConfig.id || '');

        if (deactivateError) {
          console.error('Error deactivating other configs:', deactivateError);
          throw new Error('Failed to update active configuration status');
        }
      }

      const { error: upsertError } = await (supabase as any)
        .from('voice_agent_configs')
        .upsert([validatedConfig]);

      if (upsertError) {
        console.error('Error upserting config:', upsertError);
        throw new Error('Failed to save configuration');
      }

      toast({ title: "Success", description: "Configuration saved successfully." });
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        e.issues.forEach(err => {
          if (err.path.length > 0) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(errors);
      } else {
        const error = e as Error;
        console.error('Error saving config:', error);
        toast({ 
          title: "Error", 
          description: error.message || 'An unexpected error occurred', 
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
              <Select value={form.voice} onValueChange={(v: typeof VOICES[number]) => setForm(p => ({ ...p, voice: v }))}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select voice" /></SelectTrigger>
                <SelectContent>
                  {VOICES.map(v => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.voice && <p className="text-sm text-red-500">{errors.voice}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Input id="model" className="glass-input" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
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
                  value={form.openai_api_key || ''} 
                  onChange={e => setForm(p => ({ ...p, openai_api_key: e.target.value }))} 
                  placeholder="sk-..." 
                />
                {errors.openai_api_key && <p className="text-sm text-red-500">{errors.openai_api_key}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai_organization">OpenAI Organization (Optional)</Label>
                <Input 
                  id="openai_organization" 
                  className="glass-input" 
                  value={form.openai_organization || ''} 
                  onChange={e => setForm(p => ({ ...p, openai_organization: e.target.value }))} 
                  placeholder="org-..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai_project">OpenAI Project (Optional)</Label>
                <Input 
                  id="openai_project" 
                  className="glass-input" 
                  value={form.openai_project || ''} 
                  onChange={e => setForm(p => ({ ...p, openai_project: e.target.value }))} 
                  placeholder="proj_..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
                <Input 
                  id="api_base_url" 
                  className="glass-input" 
                  value={form.api_base_url || ''} 
                  onChange={e => setForm(p => ({ ...p, api_base_url: e.target.value }))} 
                  placeholder="https://api.openai.com/v1" 
                />
                {errors.api_base_url && <p className="text-sm text-red-500">{errors.api_base_url}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input 
                  id="max_tokens" 
                  type="number" 
                  min={1} 
                  max={8192} 
                  className="glass-input" 
                  value={form.max_tokens ?? 4096} 
                  onChange={e => setForm(p => ({ ...p, max_tokens: Number(e.target.value) }))} 
                />
                {errors.max_tokens && <p className="text-sm text-red-500">{errors.max_tokens}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="top_p">Top P (0-1)</Label>
                <Input 
                  id="top_p" 
                  type="number" 
                  min={0} 
                  max={1} 
                  step={0.1} 
                  className="glass-input" 
                  value={form.top_p ?? 1} 
                  onChange={e => setForm(p => ({ ...p, top_p: Number(e.target.value) }))} 
                />
                {errors.top_p && <p className="text-sm text-red-500">{errors.top_p}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency_penalty">Frequency Penalty (-2 to 2)</Label>
                <Input 
                  id="frequency_penalty" 
                  type="number" 
                  min={-2} 
                  max={2} 
                  step={0.1} 
                  className="glass-input" 
                  value={form.frequency_penalty ?? 0} 
                  onChange={e => setForm(p => ({ ...p, frequency_penalty: Number(e.target.value) }))} 
                />
                {errors.frequency_penalty && <p className="text-sm text-red-500">{errors.frequency_penalty}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="presence_penalty">Presence Penalty (-2 to 2)</Label>
                <Input 
                  id="presence_penalty" 
                  type="number" 
                  min={-2} 
                  max={2} 
                  step={0.1} 
                  className="glass-input" 
                  value={form.presence_penalty ?? 0} 
                  onChange={e => setForm(p => ({ ...p, presence_penalty: Number(e.target.value) }))} 
                />
                {errors.presence_penalty && <p className="text-sm text-red-500">{errors.presence_penalty}</p>}
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
                  if (form.id) {
                    const { voiceService } = await import('@/services');
                    const result = await voiceService.testConfiguration(form.id);
                    toast({ 
                      title: result.data?.success ? "Test Successful" : "Test Failed",
                      description: result.data?.message,
                      variant: result.data?.success ? "default" : "destructive"
                    });
                  } else {
                    toast({ 
                      title: "Save First",
                      description: "Please save the configuration before testing",
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline" 
                className="glass"
                disabled={!form.id}
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
                          id: c.id,
                          name: c.name,
                          provider: c.provider,
                          voice: c.voice,
                          model: c.model,
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
