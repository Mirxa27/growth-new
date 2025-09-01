/**
 * Realtime API Test Page
 * Complete testing interface for all Realtime API features
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/optimized-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Image,
  FileText,
  Activity,
  MessageSquare,
  Zap,
  Camera,
  Upload,
  Download,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import RealtimeSettingsPanel from '@/components/realtime/RealtimeSettingsPanel';
import { realtimeAgentService } from '@/services/realtime/realtime-agent.service';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image';
  metadata?: any;
}

interface TranscriptionSegment {
  text: string;
  timestamp: string;
  isFinal: boolean;
}

const RealtimeTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [isConnected, setIsConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Messages and transcription
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [textInput, setTextInput] = useState('');
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Audio visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    latency: 0,
    messagesCount: 0,
    tokensUsed: 0,
    audioMinutes: 0
  });

  // Check connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = realtimeAgentService.isConnectedToAPI();
      setIsConnected(connected);
      
      if (connected) {
        const currentMetrics = realtimeAgentService.getMetrics();
        setMetrics({
          latency: currentMetrics.latency,
          messagesCount: messages.length,
          tokensUsed: 0, // Would need to track this
          audioMinutes: 0 // Would need to track this
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  // Setup audio visualization
  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setAudioLevel(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.error('Failed to setup audio visualization:', error);
    }
  };

  // Cleanup audio visualization
  const cleanupAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!isConnected) {
      toast.error('Please connect to Realtime API first');
      return;
    }

    if (isMicActive) {
      setIsMicActive(false);
      cleanupAudioVisualization();
      toast.info('Microphone disabled');
    } else {
      setIsMicActive(true);
      await setupAudioVisualization();
      toast.success('Microphone enabled');
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerActive(!isSpeakerActive);
    toast.info(isSpeakerActive ? 'Speaker disabled' : 'Speaker enabled');
  };

  // Send text message
  const sendTextMessage = async () => {
    if (!textInput.trim() || !isConnected) return;

    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textInput,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    
    try {
      await realtimeAgentService.sendText(textInput);
      setTextInput('');
    } catch (error) {
      console.error('Failed to send text:', error);
      toast.error('Failed to send message');
    }
  };

  // Send image
  const sendImage = async (file: File) => {
    if (!isConnected) {
      toast.error('Please connect to Realtime API first');
      return;
    }

    try {
      // Convert to blob
      const blob = new Blob([file], { type: file.type });
      
      // Create preview
      const url = URL.createObjectURL(blob);
      const message: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: url,
        timestamp: new Date().toISOString(),
        type: 'image',
        metadata: { filename: file.name }
      };
      
      setMessages(prev => [...prev, message]);
      
      // Send to API
      await realtimeAgentService.sendImage(blob);
      toast.success('Image sent');
    } catch (error) {
      console.error('Failed to send image:', error);
      toast.error('Failed to send image');
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!isConnected) {
      toast.error('Please connect to Realtime API first');
      return;
    }

    setIsRecording(true);
    // Recording implementation would go here
    toast.info('Recording started');
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    // Stop recording implementation
    toast.info('Recording stopped');
  };

  // Start transcription
  const startTranscription = async () => {
    if (!isConnected) {
      toast.error('Please connect to Realtime API first');
      return;
    }

    try {
      await realtimeAgentService.startTranscription({
        language: 'en',
        punctuate: true,
        includeTimestamps: true
      });
      
      setIsTranscribing(true);
      toast.success('Transcription started');
    } catch (error) {
      console.error('Failed to start transcription:', error);
      toast.error('Failed to start transcription');
    }
  };

  // Stop transcription
  const stopTranscription = async () => {
    try {
      await realtimeAgentService.stopTranscription();
      setIsTranscribing(false);
      toast.info('Transcription stopped');
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  };

  // Export conversation
  const exportConversation = () => {
    const data = {
      messages,
      transcription,
      metrics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setTranscription([]);
    toast.info('Conversation cleared');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Realtime API Testing</CardTitle>
              <CardDescription>Test all features of the OpenAI Realtime API</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <Activity className="h-4 w-4 mr-2" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Activity className="h-4 w-4 mr-2" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Bar */}
      {isConnected && (
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Latency</p>
                <p className="text-xl font-bold">{metrics.latency}ms</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-xl font-bold">{metrics.messagesCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-xl font-bold">{metrics.tokensUsed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Audio Minutes</p>
                <p className="text-xl font-bold">{metrics.audioMinutes.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full glass">
          <TabsTrigger value="conversation">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="transcription">
            <FileText className="h-4 w-4 mr-2" />
            Transcription
          </TabsTrigger>
          <TabsTrigger value="multimodal">
            <Image className="h-4 w-4 mr-2" />
            Multimodal
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Zap className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Conversation Tab */}
        <TabsContent value="conversation" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Voice & Text Conversation</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isMicActive ? "default" : "outline"}
                    onClick={toggleMicrophone}
                  >
                    {isMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={isSpeakerActive ? "default" : "outline"}
                    onClick={toggleSpeaker}
                  >
                    {isSpeakerActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearConversation}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportConversation}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Level Indicator */}
              {isMicActive && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Audio Level</p>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="h-[400px] w-full rounded border p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Start a conversation!
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          {message.type === 'image' ? (
                            <img 
                              src={message.content} 
                              alt="Uploaded" 
                              className="max-w-full rounded"
                            />
                          ) : (
                            <p>{message.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Type a message..."
                  disabled={!isConnected}
                />
                <Button onClick={sendTextMessage} disabled={!isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcription Tab */}
        <TabsContent value="transcription" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Real-time Transcription</CardTitle>
                <div className="flex gap-2">
                  {!isTranscribing ? (
                    <Button onClick={startTranscription} disabled={!isConnected}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Transcription
                    </Button>
                  ) : (
                    <Button onClick={stopTranscription} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Transcription
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded border p-4">
                <div className="space-y-2">
                  {transcription.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No transcription yet. Start transcribing to see results.
                    </p>
                  ) : (
                    transcription.map((segment, index) => (
                      <div key={index} className="space-y-1">
                        <p className={segment.isFinal ? '' : 'opacity-60'}>
                          {segment.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {segment.timestamp}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multimodal Tab */}
        <TabsContent value="multimodal" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Multimodal Input</CardTitle>
              <CardDescription>Send images and audio to the model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image Input</Label>
                <div className="flex gap-2">
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) sendImage(file);
                    }}
                  />
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!isConnected}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!isConnected}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              </div>

              {/* Audio Recording */}
              <div className="space-y-2">
                <Label>Audio Recording</Label>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={!isConnected}
                      className="w-full"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>File Input</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.info(`File selected: ${file.name}`);
                    }
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isConnected}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <RealtimeSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtimeTestPage;