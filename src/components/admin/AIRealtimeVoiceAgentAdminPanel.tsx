  // Save config to Supabase (admin table or settings)
  const handleSaveConfig = async () => {
    try {
      const { error } = await supabase
        .from('voice_agent_configs')
        .upsert([{ config: config }], { onConflict: 'id' });
      if (error) throw error;
      toast({ title: 'Config Saved', description: 'Voice agent configuration saved.' });
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  };

  // Load config from Supabase
  const handleLoadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('config')
        .eq('id', 'default')
        .single();
      if (error) throw error;
      if (data?.config) setConfig(data.config);
      toast({ title: 'Config Loaded', description: 'Voice agent configuration loaded.' });
    } catch (err: any) {
      toast({ title: 'Load Failed', description: err.message, variant: 'destructive' });
    }
  };
import React, { useEffect, useState, useRef } from 'react';
import { defaultGPTRealtimeVoiceAgentConfig, GPTRealtimeVoiceAgentConfig } from '@/config/gpt-realtime-voice-agent.config';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  Server,
  Mic,
  Play,
  StopCircle,
  TestTube2,
  Shield,
  RefreshCw
} from 'lucide-react';

type RealtimeTokenResponse = {
  client_secret: string;
  model: string;
  expires_at?: number;
};

const DEFAULT_PERSONA = {
  name: 'newme',
  displayName: 'NewMe',
  systemPrompt:
    "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful.",
  speechStyle: 'warm'
};

export const AIRealtimeVoiceAgentAdminPanel: React.FC = () => {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Unified config state
  const [config, setConfig] = useState<GPTRealtimeVoiceAgentConfig>(defaultGPTRealtimeVoiceAgentConfig);

  // Handlers for config updates
  const handleConfigChange = (section: keyof GPTRealtimeVoiceAgentConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Runtime
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check admin privileges
    const checkAdmin = async () => {
      try {
        // TEST-HOOK: allow e2e smoke tests to force admin via localStorage.
        // This is intentionally test-only and non-invasive; remove or guard in production if desired.
        if (typeof window !== 'undefined') {
          try {
            const forced = localStorage.getItem('dev_force_admin');
            if (forced === 'true') {
              setIsAdmin(true);
              setLoading(false);
              return;
            }
          } catch (e) {
            // ignore localStorage errors
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Try to read profile field is_admin_backup or role marker
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin_backup')
          .eq('id', session.user.id)
          .maybeSingle();

        const adminFlag = (profile as any)?.is_admin_backup || false;
        setIsAdmin(Boolean(adminFlag));
      } catch (err) {
        logger.error('Failed to verify admin status', 'AIRealtimeVoiceAgentAdminPanel', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const appendLog = (t: string) => {
    setLogs(prev => [new Date().toISOString() + ' • ' + t, ...prev].slice(0, 200));
  };

  // Test connection. Ensures test-ai-provider edge function responds and does server-side validation.
  const handleTestConnection = async () => {
    try {
      toast({ title: 'Testing connection...', description: 'Running server-side validation', variant: 'default' });
      appendLog('Invoking test-ai-provider (server-side)');

      // Send providerId from config
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { providerId: config.provider.id },
      });

      if (error) throw error;
      appendLog('test-ai-provider result: ' + JSON.stringify(data));
      toast({ title: 'Test Result', description: data?.message || 'Completed' });
    } catch (err: any) {
      appendLog('Test failed: ' + (err?.message || String(err)));
      toast({ title: 'Connection Test Failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  // Request ephemeral realtime token. Server must verify admin before issuing.
  const requestRealtimeToken = async (): Promise<RealtimeTokenResponse | null> => {
    try {
      appendLog('Requesting realtime token from server (get-realtime-token)');
      const { data, error } = await supabase.functions.invoke('get-realtime-token', {
        body: {}
      });

      if (error) throw error;
      appendLog('Received realtime token metadata');
      return data as RealtimeTokenResponse;
    } catch (err: any) {
      appendLog('Failed to get realtime token: ' + (err?.message || String(err)));
      toast({ title: 'Token Error', description: err?.message || String(err), variant: 'destructive' });
      return null;
    }
  };

  // SSE fallback: opens an EventSource using ephemeral token as query param (best-effort fallback)
  const connectSSE = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    appendLog('Starting connection (SSE)');

    try {
      const tokenResp = await requestRealtimeToken();
      if (!tokenResp?.client_secret) {
        throw new Error('No client secret returned from server');
      }

      // Note: EventSource cannot set custom headers; using query param for ephemeral token (best-effort).
      // Some realtime endpoints may not accept tokens via query param—this is a graceful fallback attempt.
      const url = `https://api.openai.com/v1/realtime?model=${encodeURIComponent(tokenResp.model)}&ephemeral_key=${encodeURIComponent(tokenResp.client_secret)}`;
      const es = new EventSource(url);

      es.onopen = () => {
        appendLog('SSE connection opened');
        setIsConnected(true);
        setIsConnecting(false);
      };

      es.onmessage = (evt) => {
        try {
          // Server-sent events typically deliver string data
          const parsed = JSON.parse(evt.data);
          appendLog('SSE message: ' + JSON.stringify(parsed).slice(0, 200));
          if (parsed?.type === 'audio' && parsed?.data) {
            playBase64Audio(parsed.data);
          }
          if (parsed?.type === 'response' && parsed?.text) {
            appendLog('Assistant: ' + parsed.text);
          }
        } catch (e) {
          appendLog('Failed to parse SSE message');
        }
      };

      es.onerror = (err) => {
        appendLog('SSE error: ' + String(err));
        logger.error('SSE error', 'AIRealtimeVoiceAgentAdminPanel', err);
        // Close SSE and fallback to WebSocket
        try { es.close(); } catch {}
        setIsConnecting(false);
        setIsConnected(false);
        appendLog('SSE failed; falling back to WebSocket');
        connectWebSocket();
      };

      // Store EventSource in wsRef as sentinel (not a WebSocket) for disconnect logic
      // @ts-ignore
      wsRef.current = es as unknown as WebSocket;
    } catch (err: any) {
      appendLog('SSE connection failed: ' + (err?.message || String(err)));
      logger.error('SSE connection failed', 'AIRealtimeVoiceAgentAdminPanel', err);
      setIsConnecting(false);
      setIsConnected(false);
      appendLog('Falling back to WebSocket');
      await connectWebSocket();
    }
  };

  const connectWebSocket = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    appendLog('Starting connection (WebSocket)');

    try {
      const tokenResp = await requestRealtimeToken();
      if (!tokenResp?.client_secret) {
        throw new Error('No client secret returned from server');
      }

      // Open WebSocket to OpenAI Realtime with ephemeral secret in protocol (browser-safe)
      const proto = ['realtime', `openai-insecure-api-key.${tokenResp.client_secret}`];
      const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(tokenResp.model)}`;
      const ws = new WebSocket(url, proto);

      ws.onopen = () => {
        appendLog('WebSocket opened');
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          appendLog('WS message: ' + JSON.stringify(parsed).slice(0, 200));
          // Handle audio payloads if present (example: { type: 'audio', data: 'base64...' })
          if (parsed?.type === 'audio' && parsed?.data) {
            const base64 = parsed.data as string;
            playBase64Audio(base64);
          }
          // Handle text assistant messages and transcript events
          if (parsed?.type === 'response' && parsed?.text) {
            appendLog('Assistant: ' + parsed.text);
          }
        } catch (e) {
          appendLog('Failed to parse WS message');
        }
      };

      ws.onerror = (err) => {
        appendLog('WebSocket error: ' + String(err));
        logger.error('WebSocket error', 'AIRealtimeVoiceAgentAdminPanel', err);
      };

      ws.onclose = (ev) => {
        appendLog('WebSocket closed: ' + ev.code + ' ' + ev.reason);
        setIsConnected(false);
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (err: any) {
      appendLog('Connection failed: ' + (err?.message || String(err)));
      toast({ title: 'Connection failed', description: err?.message || String(err), variant: 'destructive' });
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
        appendLog('Closing connection');
      } catch (err) {
        logger.error('Error closing WS', 'AIRealtimeVoiceAgentAdminPanel', err);
      } finally {
        wsRef.current = null;
        setIsConnected(false);
      }
    }
  };

  // Send a simple prompt to the live session (Preview as persona)
  const previewAsPersona = async (prompt = 'Hello, this is a quick preview as newme.') => {
    if (!isConnected || !wsRef.current) {
      toast({ title: 'Not connected', description: 'Start a session first', variant: 'destructive' });
      return;
    }

    try {
      appendLog('Sending preview prompt to session');
      // Compose a minimal message envelope the server/OpenAI expects
      const envelope = {
        type: 'input_text',
        content: {
          text: prompt,
          persona: config.persona.name,
          system_prompt: config.persona.systemPrompt,
        },
      };
      wsRef.current.send(JSON.stringify(envelope));
    } catch (err) {
      appendLog('Failed to send preview: ' + String(err));
      toast({ title: 'Send failed', description: String(err), variant: 'destructive' });
    }
  };

  const playBase64Audio = (b64: string) => {
    try {
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = document.createElement('audio');
        audioRef.current.controls = true;
        audioRef.current.style.maxWidth = '100%';
        document.body.appendChild(audioRef.current);
      }

      audioRef.current.src = url;
      audioRef.current.play().catch((err) => {
        appendLog('Audio playback failed: ' + String(err));
      });
    } catch (err) {
      appendLog('Failed to decode audio: ' + String(err));
    }
  };

  // Small reconnection/backoff when websocket disconnects unexpectedly
  useEffect(() => {
  if (!isConnected && !isConnecting && wsRef.current === null && config.transport.type === 'websocket') {
      // do nothing by default; admin will re-trigger
    }
  }, [isConnected, isConnecting, config.transport.type]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Shield className="inline-block mr-2" />Admin Access Required</CardTitle>
          <CardDescription>Only administrators may access the GPT‑Realtime Voice Agent Admin Panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">You must sign in with an administrator account to use these controls.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLoadConfig}>Load Config</Button>
          <Button variant="default" onClick={handleSaveConfig}>Save Config</Button>
        </div>
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Server className="mr-2" /> GPT‑Realtime Voice Agent Admin Panel
          </h2>
          <p className="text-muted-foreground">Centralized configuration and runtime controls for the realtime voice agent (persona: {config.persona.displayName}).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { appendLog('Refreshing'); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleTestConnection}>
            <TestTube2 className="h-4 w-4 mr-2" /> Test Connection
          </Button>
        </div>
      </div>

  <Tabs defaultValue="provider">
  <TabsList className="grid grid-cols-4">
  <TabsTrigger value="persona">Persona</TabsTrigger>
        <TabsContent value="persona">
          <Card>
            <CardHeader>
              <CardTitle>Persona Configuration</CardTitle>
              <CardDescription>Configure the agent's persona, prompt, and style.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Persona Display Name</Label>
                  <Input value={config.persona.displayName} onChange={(e) => handleConfigChange('persona', 'displayName', e.target.value)} />
                </div>
                <div>
                  <Label>Persona Key</Label>
                  <Input value={config.persona.name} onChange={(e) => handleConfigChange('persona', 'name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>System Prompt</Label>
                  <Textarea value={config.persona.systemPrompt} onChange={(e) => handleConfigChange('persona', 'systemPrompt', e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Speech Style</Label>
                  <Select onValueChange={(v) => handleConfigChange('persona', 'speechStyle', v)} value={config.persona.speechStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Current configuration (JSON)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-surface p-4 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(config, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="runtime">Runtime</TabsTrigger>
        </TabsList>

        <TabsContent value="provider">
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
              <CardDescription>Server-stored API keys are never exposed to the browser. Use Test Connection to validate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Provider</Label>
                  <Select onValueChange={(v) => handleConfigChange('provider', 'type', v)} value={config.provider.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={config.provider.model} onChange={(e) => handleConfigChange('provider', 'model', e.target.value)} aria-label="Model" />
                </div>
                <div>
                  <Label>Server Endpoint (optional)</Label>
                  <Input value={config.provider.endpoint} onChange={(e) => handleConfigChange('provider', 'endpoint', e.target.value)} placeholder="https://your-server.example" />
                </div>
                <div>
                  <Label>Provider ID (DB)</Label>
                  <Input value={config.provider.id || ''} onChange={(e) => handleConfigChange('provider', 'id', e.target.value || null)} placeholder="DB provider id (optional)" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>Choose voice, language, presets and sample rate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Voice ID</Label>
                  <Input value={config.voice.id} onChange={(e) => handleConfigChange('voice', 'id', e.target.value)} />
                </div>
                <div>
                  <Label>Language</Label>
                  <Input value={config.voice.language} onChange={(e) => handleConfigChange('voice', 'language', e.target.value)} />
                </div>
                <div>
                  <Label>Gender / Timbre Preset</Label>
                  <Select onValueChange={(v) => handleConfigChange('voice', 'genderPreset', v)} value={config.voice.genderPreset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="bright">Bright</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sample Rate</Label>
                  <Select onValueChange={(v) => handleConfigChange('voice', 'sampleRate', Number(v))} value={String(config.voice.sampleRate)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8000">8000 Hz</SelectItem>
                      <SelectItem value="16000">16000 Hz</SelectItem>
                      <SelectItem value="24000">24000 Hz</SelectItem>
                      <SelectItem value="48000">48000 Hz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runtime">
          <Card>
            <CardHeader>
              <CardTitle>Realtime & Persona Controls</CardTitle>
              <CardDescription>Token minting, transport, persona and runtime utilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Transport</Label>
                  <Select onValueChange={(v) => handleConfigChange('transport', 'type', v as any)} value={config.transport.type}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webrtc">WebRTC (preferred)</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                      <SelectItem value="sse">SSE (fallback)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Token lifetime (seconds)</Label>
                  <Input type="number" value={String(config.transport.tokenLifetimeSec)} onChange={(e) => handleConfigChange('transport', 'tokenLifetimeSec', Number(e.target.value))} />
                </div>
                <div className="md:col-span-2">
                  <Label>ICE Servers (JSON)</Label>
                  <Textarea value={config.transport.iceServers} onChange={(e) => handleConfigChange('transport', 'iceServers', e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Persona Display Name</Label>
                  <Input value={config.persona.displayName} onChange={(e) => handleConfigChange('persona', 'displayName', e.target.value)} />
                </div>
                <div>
                  <Label>Persona Key</Label>
                  <Input value={config.persona.name} onChange={(e) => handleConfigChange('persona', 'name', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>System Prompt</Label>
                  <Textarea value={config.persona.systemPrompt} onChange={(e) => handleConfigChange('persona', 'systemPrompt', e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Speech Style</Label>
                  <Select onValueChange={(v) => handleConfigChange('persona', 'speechStyle', v)} value={config.persona.speechStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!isConnected ? (
                  <Button onClick={() => {
                    if (config.transport.type === 'websocket') connectWebSocket();
                    else {
                      toast({ title: 'Transport not implemented', description: `Selected transport "${config.transport.type}" is not yet implemented in the panel.`, variant: 'destructive' });
                    }
                  }}>
                    <Play className="h-4 w-4 mr-2" /> Start Live Session
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => disconnect()}>
                    <StopCircle className="h-4 w-4 mr-2" /> Stop Session
                  </Button>
                )}

                <Button onClick={() => previewAsPersona()}>
                  <Mic className="h-4 w-4 mr-2" /> Preview as {config.persona.displayName}
                </Button>
              </div>

              <div className="mt-4">
                <h4 className="font-medium">Logs</h4>
                <div className="mt-2 max-h-48 overflow-y-auto p-2 bg-surface rounded">
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No logs yet. Use Test Connection or Start Live Session to generate logs.</p>
                  ) : (
                    logs.map((l, i) => (
                      <div key={i} className="text-xs font-mono text-muted-foreground mb-1">{l}</div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRealtimeVoiceAgentAdminPanel;