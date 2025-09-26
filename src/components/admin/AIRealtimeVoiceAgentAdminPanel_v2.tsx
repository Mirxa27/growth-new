import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceClient, VoiceClientConfig } from '@/utils/VoiceClient';
import { Mic, MicOff, Play, Pause, Save, Edit, Trash2, Plus, Eye, Settings, Volume2 } from 'lucide-react';

interface VoiceAgentConfig {
  id: string;
  agent_name: string;
  openai_model: string;
  openai_voice: string;
  system_prompt: string;
  initial_message: string;
  created_at: string;
  updated_at: string;
}

interface VoiceSession {
  id: string;
  user_id: string;
  agent_config_id: string;
  session_started_at: string;
  session_ended_at?: string;
  status: string;
  transcript?: any;
}

interface AuditLog {
  id: number;
  admin_user_id: string;
  action: string;
  target_resource_id: string;
  payload: any;
  created_at: string;
}

export default function AIRealtimeVoiceAgentAdminPanel() {
  const [configs, setConfigs] = useState<VoiceAgentConfig[]>([]);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<VoiceAgentConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceClient, setVoiceClient] = useState<VoiceClient | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    agent_name: '',
    openai_model: 'gpt-4o',
    openai_voice: 'alloy',
    system_prompt: '',
    initial_message: ''
  });

  const openaiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ];

  const openaiVoices = [
    'alloy',
    'echo',
    'fable',
    'onyx',
    'nova',
    'shimmer'
  ];

  useEffect(() => {
    loadConfigs();
    loadSessions();
    loadAuditLogs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load voice agent configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .order('session_started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (isCreating) {
        const { data, error } = await supabase
          .from('voice_agent_configs')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        
        // Log audit event
        await logAuditEvent('create_voice_agent', data.id, formData);
        
        toast({
          title: "Success",
          description: "Voice agent configuration created successfully"
        });
      } else {
        const { data, error } = await supabase
          .from('voice_agent_configs')
          .update(formData)
          .eq('id', selectedConfig?.id)
          .select()
          .single();

        if (error) throw error;
        
        // Log audit event
        await logAuditEvent('update_voice_agent', selectedConfig?.id || '', formData);
        
        toast({
          title: "Success",
          description: "Voice agent configuration updated successfully"
        });
      }
      
      await loadConfigs();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (config: VoiceAgentConfig) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('voice_agent_configs')
        .delete()
        .eq('id', config.id);

      if (error) throw error;
      
      // Log audit event
      await logAuditEvent('delete_voice_agent', config.id, { agent_name: config.agent_name });
      
      toast({
        title: "Success",
        description: "Voice agent configuration deleted successfully"
      });
      
      await loadConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logAuditEvent = async (action: string, targetResourceId: string, payload: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('audit_logs')
        .insert([{
          admin_user_id: user.id,
          action,
          target_resource_id: targetResourceId,
          payload
        }]);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  const startVoiceTest = async (config: VoiceAgentConfig) => {
    try {
      setIsTestingVoice(true);
      setTranscript('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const clientConfig: VoiceClientConfig = {
        serverUrl: import.meta.env.VITE_VOICE_AGENT_SERVER_URL || 'https://voice-agent.your-domain.com',
        userId: user.id,
        agentConfigId: config.id,
        fallbackToWebSocket: true
      };

      const client = new VoiceClient(clientConfig);
      
      client.onTranscript = (text, isFinal) => {
        setTranscript(prev => isFinal ? text : `${prev} ${text}`);
      };
      
      client.onError = (error) => {
        toast({
          title: "Voice Test Error",
          description: error.message,
          variant: "destructive"
        });
        setIsTestingVoice(false);
      };
      
      client.onStatusChange = (status) => {
        if (status === 'disconnected') {
          setIsTestingVoice(false);
        }
      };

      await client.initialize();
      setVoiceClient(client);
      
      toast({
        title: "Voice Test Started",
        description: `Testing voice agent: ${config.agent_name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voice test",
        variant: "destructive"
      });
      setIsTestingVoice(false);
    }
  };

  const stopVoiceTest = async () => {
    if (voiceClient) {
      await voiceClient.disconnect();
      setVoiceClient(null);
    }
    setIsTestingVoice(false);
  };

  const resetForm = () => {
    setFormData({
      agent_name: '',
      openai_model: 'gpt-4o',
      openai_voice: 'alloy',
      system_prompt: '',
      initial_message: ''
    });
    setSelectedConfig(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  const editConfig = (config: VoiceAgentConfig) => {
    setSelectedConfig(config);
    setFormData({
      agent_name: config.agent_name,
      openai_model: config.openai_model,
      openai_voice: config.openai_voice,
      system_prompt: config.system_prompt,
      initial_message: config.initial_message
    });
    setIsEditing(true);
  };

  const createConfig = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Realtime Voice Agent Admin Panel</h1>
          <p className="text-muted-foreground">Manage voice agents, monitor sessions, and configure AI responses</p>
        </div>
        <Button onClick={createConfig} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Voice Agents</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <Card key={config.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{config.agent_name}</CardTitle>
                      <CardDescription>
                        Model: {config.openai_model} • Voice: {config.openai_voice}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startVoiceTest(config)}
                        disabled={isTestingVoice}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editConfig(config)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium">System Prompt</Label>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.system_prompt || 'No system prompt'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Initial Message</Label>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.initial_message || 'No initial message'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Badge variant="secondary" className="text-xs">
                    Created {new Date(config.created_at).toLocaleDateString()}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Sessions</CardTitle>
              <CardDescription>Monitor active and recent voice conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">{session.id.slice(0, 8)}...</TableCell>
                      <TableCell>{session.agent_config_id}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(session.session_started_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {session.session_ended_at 
                          ? `${Math.round((new Date(session.session_ended_at).getTime() - new Date(session.session_started_at).getTime()) / 1000)}s`
                          : 'Ongoing'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Track administrative actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{log.admin_user_id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.target_resource_id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Global settings for voice agent system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Voice Agent System</Label>
                  <p className="text-sm text-muted-foreground">Allow users to interact with voice agents</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require user authentication for voice sessions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Session Recording</Label>
                  <p className="text-sm text-muted-foreground">Record voice sessions for analysis</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Voice Test Dialog */}
      {isTestingVoice && (
        <Dialog open={isTestingVoice} onOpenChange={setIsTestingVoice}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Voice Agent Test</DialogTitle>
              <DialogDescription>
                Testing voice interaction with the selected agent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <Button
                  variant={isTestingVoice ? "destructive" : "default"}
                  size="lg"
                  onClick={isTestingVoice ? stopVoiceTest : () => {}}
                  className="rounded-full h-16 w-16"
                >
                  {isTestingVoice ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <div>
                <Label>Live Transcript</Label>
                <div className="mt-2 p-4 bg-muted rounded-md min-h-[100px]">
                  <p className="text-sm">{transcript || 'Speak to see your transcript here...'}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={stopVoiceTest}>
                Stop Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit/Create Configuration Dialog */}
      {(isEditing || isCreating) && (
        <Dialog open={isEditing || isCreating} onOpenChange={() => resetForm()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? 'Create Voice Agent' : 'Edit Voice Agent'}
              </DialogTitle>
              <DialogDescription>
                Configure the AI voice agent settings and behavior
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent_name">Agent Name</Label>
                  <Input
                    id="agent_name"
                    value={formData.agent_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                    placeholder="Enter agent name"
                  />
                </div>
                <div>
                  <Label htmlFor="openai_model">OpenAI Model</Label>
                  <Select
                    value={formData.openai_model}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, openai_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {openaiModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="openai_voice">Voice</Label>
                <Select
                  value={formData.openai_voice}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, openai_voice: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {openaiVoices.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Enter system prompt to define the agent's behavior..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="initial_message">Initial Message</Label>
                <Textarea
                  id="initial_message"
                  value={formData.initial_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_message: e.target.value }))}
                  placeholder="Enter the initial message the agent will say..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Create Agent' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
