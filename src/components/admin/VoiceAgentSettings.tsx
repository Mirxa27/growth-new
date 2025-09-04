import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Mic,
  Volume2,
  Settings,
  Play,
  Square, // Replaces Stop
  Activity,
  Clock,
  VolumeX,
  Brain,
  User,
  Phone,
  PhoneOff,
  Monitor,
  RefreshCw,
  Users,
  Database,
  AlertCircle,
  Plus
} from 'lucide-react';
import RealtimeVoiceAgent from '@/components/chat/RealtimeVoiceAgent';

interface VoiceSession {
  id: string;
  user_id: string;
  model: string;
  voice: string;
  status: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript: any[];
  metadata: Record<string, any>;
  audio_quality_metrics: Record<string, any>;
  error_message?: string;
}

interface VoiceConfig {
  id: string;
  name: string;
  voice_id: string;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  input_audio_format: string;
  output_audio_format: string;
  sample_rate: number;
  channels: number;
  enable_vad: boolean;
  vad_threshold: number;
  enable_noise_suppression: boolean;
  enable_echo_cancellation: boolean;
  max_session_duration: number;
  language: string;
  enable_auto_punctuation: boolean;
  enable_timestamps: boolean;
}

const VoiceAgentSettings: React.FC = () => {
  const [voiceConfigs, setVoiceConfigs] = useState<VoiceConfig[]>([]);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<VoiceConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VoiceConfig>>({});
  const [activeTab, setActiveTab] = useState<'configs' | 'sessions' | 'testing'>('configs');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'connecting' | 'testing' | 'completed' | 'error'>('idle');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const fetchVoiceConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoiceConfigs(data || []);
      
      // Auto-select first active config if none selected
      if (!selectedConfig && data && data.length > 0) {
        const activeConfig = data.find(config => config.is_active) || data[0];
        setSelectedConfig(activeConfig);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch voice configs: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [toast, selectedConfig]);

  const fetchVoiceSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVoiceSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch voice sessions: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVoiceConfigs(), fetchVoiceSessions()]);
      setLoading(false);
    };

    loadData();
  }, [fetchVoiceConfigs, fetchVoiceSessions]);

  const handleOpenEdit = (config?: VoiceConfig) => {
    if (config) {
      setIsEditing(true);
      setSelectedConfig(config);
      setFormData(config);
    } else {
      setIsEditing(true);
      setSelectedConfig(null);
      setFormData({
        name: '',
        voice_id: 'alloy',
        model: 'gpt-4o-realtime-preview-2024-10-01',
        system_prompt: 'You are NewMe, a supportive growth guide for women\'s personal growth. Be warm, encouraging, and insightful.',
        temperature: 0.7,
        max_tokens: 1000,
        is_active: true,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        sample_rate: 24000,
        channels: 1,
        enable_vad: true,
        vad_threshold: -45,
        enable_noise_suppression: true,
        enable_echo_cancellation: true,
        max_session_duration: 1800,
        language: 'en',
        enable_auto_punctuation: true,
        enable_timestamps: true
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name) throw new Error('Configuration name is required');

      const saveData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      let result;
      if (selectedConfig?.id) {
        result = await supabase
          .from('voice_agent_configs')
          .update(saveData)
          .eq('id', selectedConfig.id);
      } else {
        result = await supabase
          .from('voice_agent_configs')
          .insert([saveData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Voice configuration ${selectedConfig ? 'updated' : 'created'} successfully`,
      });

      setIsEditing(false);
      setSelectedConfig(null);
      setFormData({});
      await fetchVoiceConfigs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save configuration: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (configId: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const { error } = await supabase
        .from('voice_agent_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });

      await fetchVoiceConfigs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete configuration: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleTestConfig = async (config: VoiceConfig) => {
    setIsTesting(true);
    setTestStatus('connecting');
    setTestResults({});

    try {
      // Test 1: Check database connectivity
      const { data: testData, error: testError } = await supabase
        .from('voice_sessions')
        .select('count')
        .limit(1);

      if (testError) throw testError;

      setTestResults(prev => ({ ...prev, database: '✅ Connected' }));
      setTestStatus('testing');

      // Test 2: Simulate voice session creation
      const testSession = {
        id: `test_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        config_id: config.id,
        model: config.model,
        voice: config.voice_id,
        status: 'active',
        started_at: new Date().toISOString(),
        transcript: [],
        metadata: { test: true },
        audio_quality_metrics: {}
      };

      const { error: sessionError } = await supabase
        .from('voice_sessions')
        .insert([testSession]);

      if (sessionError) throw sessionError;

      setTestResults(prev => ({ ...prev, sessionCreation: '✅ Session creation works' }));

      // Test 3: Check OpenAI connectivity (through edge function)
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession) {
        const response = await fetch('/functions/v1/get-realtime-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authSession.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setTestResults(prev => ({ ...prev, openai: '✅ OpenAI connection successful' }));
        } else {
          setTestResults(prev => ({ ...prev, openai: '⚠️ OpenAI connection issue' }));
        }
      }

      setTestStatus('completed');
      toast({
        title: "Test Complete",
        description: "Voice configuration tests completed",
      });
    } catch (error: any) {
      setTestStatus('error');
      setTestResults(prev => ({ ...prev, error: `❌ Error: ${error.message}` }));
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderVoiceConfigCard = (config: VoiceConfig) => (
    <Card key={config.id} className={`${config.is_active ? 'border-green-200' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>{config.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.is_active ? "default" : "secondary"}>
              {config.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTestConfig(config)}
              disabled={isTesting}
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(config)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Model: {config.model} | Voice: {config.voice_id}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Sample Rate:</strong> {config.sample_rate}Hz
          </div>
          <div>
            <strong>Temperature:</strong> {config.temperature}
          </div>
          <div>
            <strong>VAD:</strong> {config.enable_vad ? 'Enabled' : 'Disabled'}
          </div>
          <div>
            <strong>Max Duration:</strong> {config.max_session_duration}s
          </div>
        </div>
        
        {config.system_prompt && (
          <div className="mt-3">
            <strong className="text-xs text-muted-foreground">System Prompt:</strong>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {config.system_prompt}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderVoiceSessionCard = (session: VoiceSession) => {
    const duration = session.ended_at 
      ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000)
      : session.duration_seconds || 0;

    return (
      <Card key={session.id} className="mb-3">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                session.status === 'active' ? 'bg-green-500' :
                session.status === 'completed' ? 'bg-blue-500' :
                session.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <div>
                <div className="font-medium">{session.model}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(session.started_at).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{session.voice}</div>
              <div className="text-sm text-muted-foreground">
                {duration}s • {session.transcript?.length || 0} messages
              </div>
            </div>
          </div>
          
          {session.error_message && (
            <Alert className="mt-3" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{session.error_message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Voice Agent Settings</h2>
          <p className="text-muted-foreground">
            Manage AI voice agent configurations and monitor voice sessions
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configs">Configurations</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {voiceConfigs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No voice configurations</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first voice agent configuration
                </p>
                <Button onClick={() => handleOpenEdit()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Configuration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {voiceConfigs.map(renderVoiceConfigCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Voice Sessions</h3>
            <Button variant="outline" size="sm" onClick={fetchVoiceSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {voiceSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No voice sessions</h3>
                <p className="text-muted-foreground">
                  Voice sessions will appear here when users interact with the voice agent
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {voiceSessions.map(renderVoiceSessionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice System Testing</CardTitle>
              <CardDescription>
                Test your voice configuration and system connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedConfig ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Testing: {selectedConfig.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedConfig.model} • {selectedConfig.voice_id}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleTestConfig(selectedConfig)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Tests
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {(Object.entries(testResults).map(([test, result]) => (
                      <Card key={test}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            {result.toString().includes('✅') ? (
                              <Activity className="h-4 w-4 text-green-500" />
                            ) : result.toString().includes('⚠️') ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <div className="font-medium capitalize">{test.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-sm">{result as string}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Select a voice configuration to test
                  </p>
                  <Select value="" onValueChange={(value) => {
                    const config = voiceConfigs.find(c => c.id === value);
                    if (config) setSelectedConfig(config);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceConfigs.map(config => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Live Voice Testing
              </CardTitle>
              <CardDescription>
                Test the voice agent with real-time interaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeVoiceAgent />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Configuration Dialog */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {selectedConfig ? 'Edit Configuration' : 'New Configuration'}
                </h3>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Configuration Name</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter configuration name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Voice</Label>
                    <Select
                      value={formData.voice_id || ''}
                      onValueChange={(value) => setFormData({ ...formData, voice_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">Echo (Warm)</SelectItem>
                        <SelectItem value="fable">Fable (Expressive)</SelectItem>
                        <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                        <SelectItem value="nova">Nova (Friendly)</SelectItem>
                        <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Model</Label>
                    <Select
                      value={formData.model || ''}
                      onValueChange={(value) => setFormData({ ...formData, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-realtime-preview-2024-10-01">GPT-4o Realtime</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>System Prompt</Label>
                  <Textarea
                    value={formData.system_prompt || ''}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    placeholder="Enter system prompt for the AI"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature || 0.7}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={formData.max_tokens || 1000}
                      onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Sample Rate</Label>
                    <Select
                      value={formData.sample_rate?.toString() || '24000'}
                      onValueChange={(value) => setFormData({ ...formData, sample_rate: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8000">8000 Hz</SelectItem>
                        <SelectItem value="16000">16000 Hz</SelectItem>
                        <SelectItem value="24000">24000 Hz</SelectItem>
                        <SelectItem value="48000">48000 Hz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    id="is-active"
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgentSettings;
