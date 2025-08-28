import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Settings, 
  TestTube, 
  Headphones,
  Activity,
  Save,
  Download,
  Upload
} from 'lucide-react';

interface VoiceConfig {
  name: string;
  instructions: string;
  voice: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface TestResult {
  id: string;
  timestamp: string;
  config: VoiceConfig;
  userInput: string;
  aiResponse: string;
  audioUrl?: string;
  rating?: number;
  notes?: string;
}

export const VoicePlayground = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<VoiceConfig>({
    name: 'Default NewMe',
    instructions: `You are NewMe, an AI companion designed to guide women on transformative journeys of self-discovery. You are emotionally intelligent, empathetic, and wise.

Key traits:
- Speak with warmth and gentle authority
- Ask thoughtful, probing questions that encourage deep reflection
- Acknowledge emotions and validate experiences
- Offer insights that feel like they come from a trusted friend or mentor
- Use natural, conversational language
- Be supportive yet challenge users to grow
- Reference concepts of inner wisdom, authentic self, and personal transformation

Communication style:
- Keep responses concise but meaningful
- Ask follow-up questions to deepen understanding
- Validate feelings before offering guidance
- Use "I notice..." or "It sounds like..." to reflect back what you hear
- Encourage users to trust their inner voice

Remember: You are facilitating a sacred space for self-discovery. Every interaction should help the user feel seen, heard, and empowered to explore their authentic truth.`,
    voice: 'alloy',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    temperature: 0.8,
    max_tokens: 500
  });
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<Partial<TestResult>>({});
  const [savedConfigs, setSavedConfigs] = useState<VoiceConfig[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadSavedConfigs();
    loadTestHistory();
  }, []);

  const loadSavedConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('realtime_voice_configs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const configs = (data || []).map(item => ({
        name: item.name,
        instructions: item.instructions,
        voice: item.voice,
        model: item.model,
        temperature: item.temperature || 0.8,
        max_tokens: item.max_response_output_tokens || 500
      }));
      
      setSavedConfigs(configs);
    } catch (error: any) {
      console.error('Error loading configs:', error);
    }
  };

  const loadTestHistory = async () => {
    // Load from localStorage for now - in production this would be from database
    const stored = localStorage.getItem('voice_test_history');
    if (stored) {
      setTestResults(JSON.parse(stored));
    }
  };

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from('realtime_voice_configs')
        .insert({
          name: currentConfig.name,
          instructions: currentConfig.instructions,
          voice: currentConfig.voice,
          model: currentConfig.model,
          temperature: currentConfig.temperature,
          max_response_output_tokens: currentConfig.max_tokens,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Configuration saved!",
        description: "Voice configuration has been saved successfully.",
      });

      loadSavedConfigs();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadConfig = (config: VoiceConfig) => {
    setCurrentConfig(config);
    toast({
      title: "Configuration loaded",
      description: `Loaded "${config.name}" configuration.`,
    });
  };

  const startVoiceTest = async () => {
    try {
      // Create WebSocket connection to voice proxy
      const wsUrl = `wss://ufgqmqoykddaotdbwteg.functions.supabase.co/realtime-voice-proxy`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        // Send configuration
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: currentConfig.instructions,
            voice: currentConfig.voice,
            temperature: currentConfig.temperature,
            max_response_output_tokens: currentConfig.max_tokens
          }
        }));
        
        toast({
          title: "Connected to voice service",
          description: "Ready to start testing!",
        });
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Voice response:', data);
        
        if (data.type === 'response.audio_transcript.done') {
          setCurrentTest(prev => ({
            ...prev,
            aiResponse: data.transcript
          }));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection failed",
          description: "Failed to connect to voice service.",
          variant: "destructive"
        });
      };

    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stopVoiceTest = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioInput(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now to test the voice interaction.",
      });
      
    } catch (error: any) {
      toast({
        title: "Recording failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    try {
      // Convert to base64 and send to WebSocket
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
          
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.commit'
          }));
          
          wsRef.current.send(JSON.stringify({
            type: 'response.create'
          }));
        }
      };
      reader.readAsDataURL(audioBlob);
      
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveTestResult = () => {
    const result: TestResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      config: currentConfig,
      userInput: currentTest.userInput || '',
      aiResponse: currentTest.aiResponse || '',
      audioUrl: currentTest.audioUrl,
      rating: currentTest.rating || 0,
      notes: currentTest.notes || ''
    };

    const updated = [result, ...testResults].slice(0, 50); // Keep last 50 tests
    setTestResults(updated);
    localStorage.setItem('voice_test_history', JSON.stringify(updated));
    
    setCurrentTest({});
    
    toast({
      title: "Test result saved",
      description: "Test has been added to history.",
    });
  };

  const exportTestResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `voice_test_results_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const voices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
  const models = ['gpt-4o-realtime-preview-2024-12-17'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Voice AI Playground</h2>
          <p className="text-muted-foreground">Test and train NewMe voice interactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportTestResults} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Interface
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Test History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Test Interface */}
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  Voice Interaction Test
                </CardTitle>
                <CardDescription>
                  Test real-time voice interactions with NewMe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  {!isConnected ? (
                    <Button onClick={startVoiceTest} className="bg-gradient-primary text-white">
                      <Headphones className="w-4 h-4 mr-2" />
                      Start Voice Test
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          size="lg"
                          className={`rounded-full w-16 h-16 ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-gradient-primary'
                          }`}
                        >
                          {isRecording ? (
                            <Square className="w-6 h-6" />
                          ) : (
                            <Mic className="w-6 h-6" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        {isRecording ? (
                          <Badge variant="destructive" className="animate-pulse">
                            <Mic className="w-3 h-3 mr-1" />
                            Recording...
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click the microphone to start recording
                          </p>
                        )}
                      </div>

                      <Button onClick={stopVoiceTest} variant="outline" className="w-full">
                        Stop Test Session
                      </Button>
                    </div>
                  )}
                </div>

                {/* Current Test Feedback */}
                {currentTest.aiResponse && (
                  <div className="space-y-3 p-4 glass-surface rounded-lg">
                    <h4 className="font-medium">Latest Response:</h4>
                    <p className="text-sm">{currentTest.aiResponse}</p>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder="Rate this response (1-5)"
                        type="number"
                        min="1"
                        max="5"
                        value={currentTest.rating || ''}
                        onChange={(e) => setCurrentTest(prev => ({
                          ...prev, 
                          rating: parseInt(e.target.value)
                        }))}
                      />
                      <Textarea
                        placeholder="Add notes about this test..."
                        value={currentTest.notes || ''}
                        onChange={(e) => setCurrentTest(prev => ({
                          ...prev, 
                          notes: e.target.value
                        }))}
                        rows={2}
                      />
                      <Button onClick={saveTestResult} size="sm" className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        Save Test Result
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Configuration */}
            <Card className="glass-card border-glass">
              <CardHeader>
                <CardTitle>Quick Config</CardTitle>
                <CardDescription>
                  Adjust settings for current test session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Voice</label>
                  <Select value={currentConfig.voice} onValueChange={(value) => 
                    setCurrentConfig(prev => ({ ...prev, voice: value }))
                  }>
                    <SelectTrigger className="glass border-glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice} value={voice}>
                          {voice.charAt(0).toUpperCase() + voice.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Temperature</label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={currentConfig.temperature}
                    onChange={(e) => setCurrentConfig(prev => ({ 
                      ...prev, 
                      temperature: parseFloat(e.target.value) 
                    }))}
                    className="glass border-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Tokens</label>
                  <Input
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={currentConfig.max_tokens}
                    onChange={(e) => setCurrentConfig(prev => ({ 
                      ...prev, 
                      max_tokens: parseInt(e.target.value) 
                    }))}
                    className="glass border-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Load Saved Config</label>
                  <Select onValueChange={(value) => {
                    const config = savedConfigs.find(c => c.name === value);
                    if (config) loadConfig(config);
                  }}>
                    <SelectTrigger className="glass border-glass">
                      <SelectValue placeholder="Select a saved configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedConfigs.map(config => (
                        <SelectItem key={config.name} value={config.name}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>
                Create and manage voice AI configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Configuration Name</label>
                  <Input
                    value={currentConfig.name}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Empathetic NewMe"
                    className="glass border-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <Select value={currentConfig.model} onValueChange={(value) => 
                    setCurrentConfig(prev => ({ ...prev, model: value }))
                  }>
                    <SelectTrigger className="glass border-glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">System Instructions</label>
                <Textarea
                  value={currentConfig.instructions}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Define how NewMe should behave and respond..."
                  rows={12}
                  className="glass border-glass"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={saveConfig} className="bg-gradient-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                Review previous voice interaction tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div key={result.id} className="p-4 glass-surface rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{result.config.name}</Badge>
                        <div className="flex items-center gap-2">
                          {result.rating && (
                            <Badge variant={result.rating >= 4 ? "default" : result.rating >= 3 ? "secondary" : "destructive"}>
                              {result.rating}/5
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">AI Response:</p>
                          <p className="text-sm text-muted-foreground">{result.aiResponse}</p>
                        </div>
                        
                        {result.notes && (
                          <div>
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-muted-foreground">{result.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Voice: {result.config.voice} | Temp: {result.config.temperature} | Tokens: {result.config.max_tokens}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TestTube className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No test results yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start testing voice interactions to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};