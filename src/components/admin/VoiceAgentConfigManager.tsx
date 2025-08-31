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
import { Save, AlertCircle, Mic, Settings } from 'lucide-react';
import { ValidationError } from '@/utils/validation';

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

export const VoiceAgentConfigManager: React.FC = () => {
  const { configs, loading, error: fetchError } = useVoiceAgentConfig();
  const { toast } = useToast();
  
  const activeConfig = useMemo(() => configs?.find(c => c.is_active) ?? configs?.[0] ?? null, [configs]);

  const [form, setForm] = useState({
    id: '', name: '', provider: 'openai', voice: 'alloy', model: 'gpt-4o-mini', temperature: 0.7, instructions: '', is_active: true
  });
  
  useEffect(() => {
    if (activeConfig) {
      setForm({
        id: activeConfig.id,
        name: activeConfig.name,
        provider: activeConfig.provider,
        voice: activeConfig.voice,
        model: activeConfig.model,
        temperature: activeConfig.temperature,
        instructions: activeConfig.instructions ?? '',
        is_active: activeConfig.is_active
      });
    }
  }, [activeConfig]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (data: typeof form) => {
    if (!data.name || data.name.trim().length < 2) throw new ValidationError('Name must be at least 2 characters', 'name');
    if (!data.voice || !VOICES.includes(data.voice as typeof VOICES[number])) throw new ValidationError('Invalid voice', 'voice');
    if (!data.model || data.model.trim().length < 3) throw new ValidationError('Model is required', 'model');
    if (typeof data.temperature !== 'number' || data.temperature < 0 || data.temperature > 1) throw new ValidationError('Temperature must be between 0 and 1', 'temperature');
  };

  const handleSave = async () => {
    setErrors({});
    try {
      validate(form);
      setIsSaving(true);
      
      if (form.is_active) {
        await supabase.from('voice_agent_configs').update({ is_active: false }).neq('id', form.id as string);
      }

      const { error } = await supabase.from('voice_agent_configs').upsert({
        id: form.id,
        name: form.name!,
        provider: form.provider,
        voice: form.voice,
        model: form.model!,
        temperature: form.temperature!,
        instructions: form.instructions ?? '',
        is_active: !!form.is_active
      });

      if (error) throw error;
      toast({ title: "Success", description: "Configuration saved successfully." });
    } catch (e: any) {
      if (e instanceof ValidationError) {
        setErrors({ [e.field!]: e.message });
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
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
              <Select value={form.voice} onValueChange={(v) => setForm(p => ({ ...p, voice: v as any }))}>
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
          <div className="space-y-2">
            <Label htmlFor="instructions">System Instructions</Label>
            <Textarea id="instructions" className="glass-input min-h-40" value={form.instructions || ''} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Customize NewMe's guidance style and constraints..." />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch id="is_active" checked={!!form.is_active} onCheckedChange={(checked) => setForm(p => ({ ...p, is_active: checked }))} />
              <Label htmlFor="is_active">Set as active configuration</Label>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
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
                  <Button variant={c.is_active ? "default" : "outline"} size="sm" onClick={() => setForm({ ...c, instructions: c.instructions ?? '' })}>
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