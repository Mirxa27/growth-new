import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { loadRealtimeSettings, saveRealtimeSettings, type RealtimeSettings } from '@/services/realtime/settings.service';
import { TestTube, Save } from 'lucide-react';

export const RealtimeSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<RealtimeSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadRealtimeSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      await saveRealtimeSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const resp = await fetch('/functions/v1/test-voice-to-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: 'openai',
          api_key: 'use-server-config',
          model: 'tts-1',
          voice: settings.voice,
          test_text: 'Hello from Newomen realtime settings test.',
        })
      });
      await resp.text();
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime Settings</CardTitle>
        <CardDescription>Configure connection method, models, and streaming parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Connection</Label>
            <Select value={settings.connectionMethod} onValueChange={(v: 'webrtc' | 'websocket') => setSettings(s => s ? { ...s, connectionMethod: v } : s)}>
              <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="webrtc">WebRTC (browser)</SelectItem>
                <SelectItem value="websocket">WebSocket (server)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input value={settings.model ?? ''} onChange={e => setSettings(s => s ? { ...s, model: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Voice</Label>
            <Input value={settings.voice ?? ''} onChange={e => setSettings(s => s ? { ...s, voice: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={settings.language ?? ''} onChange={e => setSettings(s => s ? { ...s, language: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>STT Model</Label>
            <Input value={settings.sttModel ?? ''} onChange={e => setSettings(s => s ? { ...s, sttModel: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Input Format</Label>
            <Input value={settings.inputFormat ?? ''} onChange={e => setSettings(s => s ? { ...s, inputFormat: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Output Format</Label>
            <Input value={settings.outputFormat ?? ''} onChange={e => setSettings(s => s ? { ...s, outputFormat: e.target.value } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Use Proxy</Label>
            <div className="flex items-center gap-3">
              <Switch checked={!!settings.useProxy} onCheckedChange={checked => setSettings(s => s ? { ...s, useProxy: checked } : s)} />
              <Input placeholder="Proxy URL" value={settings.proxyUrl || ''} onChange={e => setSettings(s => s ? { ...s, proxyUrl: e.target.value } : s)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>VAD Threshold</Label>
            <Input type="number" step="0.05" min="0" max="1" value={settings.vad?.threshold ?? 0} onChange={e => setSettings(s => s ? { ...s, vad: { ...s.vad, threshold: Number(e.target.value) } } : s)} />
          </div>
          <div className="space-y-2">
            <Label>VAD Prefix Padding (ms)</Label>
            <Input type="number" value={settings.vad?.prefixPaddingMs ?? 0} onChange={e => setSettings(s => s ? { ...s, vad: { ...s.vad, prefixPaddingMs: Number(e.target.value) } } : s)} />
          </div>
          <div className="space-y-2">
            <Label>VAD Silence (ms)</Label>
            <Input type="number" value={settings.vad?.silenceDurationMs ?? 0} onChange={e => setSettings(s => s ? { ...s, vad: { ...s.vad, silenceDurationMs: Number(e.target.value) } } : s)} />
          </div>
          <div className="space-y-2">
            <Label>Emotion Detection</Label>
            <div className="flex items-center gap-3">
              <Switch checked={settings.enableEmotionDetection} onCheckedChange={checked => setSettings(s => s ? { ...s, enableEmotionDetection: checked } : s)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={onTest} disabled={testing}>
            <TestTube className={`w-4 h-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
            {testing ? 'Testing...' : 'Test Voice'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

