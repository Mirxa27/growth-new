import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  MessageCircle,
  Activity,
  User,
  Brain
} from 'lucide-react';

interface VoiceSession {
  session_id: string;
  client_secret: string;
  model: string;
  expires_at: string;
}

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface RealtimeEvent {
  type: string;
  transcript?: string;
  delta?: {
    text?: string;
    audio?: string;
  };
  error?: {
    message: string;
  };
}

const RealtimeVoiceAgent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);

  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

  const initializeVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      // Get auth session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('Authentication required');
      }

      // Request Realtime session token from Edge Function
      const response = await fetch('/functions/v1/get-realtime-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create voice session');
      }

      const sessionData: VoiceSession = await response.json();
      
      // Initialize WebRTC or WebSocket connection to OpenAI Realtime API
      await connectToRealtime(sessionData);

      setIsConnected(true);
      setConnectionStatus('connected');

      toast({
        title: "Voice Assistant Connected",
        description: "You can now start your voice session.",
      });

    } catch (error: any) {
      console.error('Voice session initialization error:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to voice assistant.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToRealtime = async (sessionData: VoiceSession) => {
    try {
      // Initialize audio context and media stream
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        } 
      });

      // Create WebSocket connection to OpenAI Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${sessionData.model}`;
      wsRef.current = new WebSocket(wsUrl, ['realtime']);

      wsRef.current.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Send authentication
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            model: sessionData.model,
            instructions: "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful.",
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        }));

        setupAudioProcessing();
      };

      wsRef.current.onmessage = (event) => {
        handleRealtimeMessage(JSON.parse(event.data));
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        toast({
          title: "Connection Error",
          description: "Lost connection to voice assistant.",
          variant: "destructive"
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        cleanup();
      };

    } catch (error) {
      console.error('Failed to connect to Realtime API:', error);
      throw error;
    }
  };

  const setupAudioProcessing = () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    
    // Create audio worklet for processing
    audioContextRef.current.audioWorklet.addModule('/audio-processor.js').then(() => {
      if (!audioContextRef.current) return;
      
      audioWorkletRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      audioWorkletRef.current.port.onmessage = (event) => {
        if (event.data.type === 'audio-data' && wsRef.current?.readyState === WebSocket.OPEN && isMicEnabled) {
          // Send audio data to Realtime API
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: event.data.audio
          }));
        } else if (event.data.type === 'audio-level') {
          setAudioLevel(event.data.level);
        }
      };

      source.connect(audioWorkletRef.current);
    }).catch(error => {
      console.error('Failed to load audio worklet:', error);
    });
  };

  const handleRealtimeMessage = (message: RealtimeEvent) => {
    console.log('Received Realtime message:', message);

    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          addTranscriptEntry('user', message.transcript);
        }
        break;

      case 'response.audio_transcript.delta':
        if (message.delta?.text) {
          updateAssistantTranscript(message.delta.text);
        }
        break;

      case 'response.audio.delta':
        if (isSpeakerEnabled && message.delta?.audio) {
          playAudioDelta(message.delta.audio);
        }
        break;

      case 'response.done':
        console.log('Response completed');
        break;

      case 'error':
        console.error('Realtime API error:', message.error);
        toast({
          title: "Voice Assistant Error",
          description: message.error?.message || "An error occurred during conversation.",
          variant: "destructive"
        });
        break;
    }
  };

  const addTranscriptEntry = (speaker: 'user' | 'assistant', text: string) => {
    const entry: TranscriptEntry = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date()
    };
    
    setTranscript(prev => [...prev, entry]);
  };

  const updateAssistantTranscript = (delta: string) => {
    setTranscript(prev => {
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && lastEntry.speaker === 'assistant') {
        // Update existing assistant entry
        return prev.map((entry, index) => 
          index === prev.length - 1 
            ? { ...entry, text: entry.text + delta }
            : entry
        );
      } else {
        // Create new assistant entry
        return [...prev, {
          id: Date.now().toString(),
          speaker: 'assistant',
          text: delta,
          timestamp: new Date()
        }];
      }
    });
  };

  const playAudioDelta = async (audioData: string) => {
    if (!audioContextRef.current) return;

    try {
      const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      const floatBuffer = new Float32Array(audioBuffer.length / 2);
      
      // Convert PCM16 to Float32
      for (let i = 0; i < floatBuffer.length; i++) {
        const sample = (audioBuffer[i * 2] | (audioBuffer[i * 2 + 1] << 8));
        floatBuffer[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768;
      }

      const buffer = audioContextRef.current.createBuffer(1, floatBuffer.length, 24000);
      buffer.getChannelData(0).set(floatBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const disconnect = () => {
    cleanup();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setTranscript([]);

    toast({
      title: "Voice Assistant Disconnected",
      description: "Session ended successfully.",
    });
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const toggleMic = () => {
    setIsMicEnabled(prev => !prev);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicEnabled;
      });
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(prev => !prev);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              Voice Assistant
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            </div>
            <Badge variant="outline">
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your personal guide for voice conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            {!isConnected ? (
              <Button 
                onClick={initializeVoiceSession}
                disabled={isConnecting}
                size="lg"
                className="min-w-[160px]"
              >
                {isConnecting ? (
                  <>
                    <Activity className="w-5 h-5 mr-2 animate-pulse" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleMic}
                  variant={isMicEnabled ? "default" : "destructive"}
                  size="lg"
                >
                  {isMicEnabled ? (
                    <Mic className="w-5 h-5 mr-2" />
                  ) : (
                    <MicOff className="w-5 h-5 mr-2" />
                  )}
                  {isMicEnabled ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  onClick={toggleSpeaker}
                  variant={isSpeakerEnabled ? "default" : "secondary"}
                  size="lg"
                >
                  {isSpeakerEnabled ? (
                    <Volume2 className="w-5 h-5 mr-2" />
                  ) : (
                    <VolumeX className="w-5 h-5 mr-2" />
                  )}
                  {isSpeakerEnabled ? 'Speaker On' : 'Speaker Off'}
                </Button>

                <Button
                  onClick={disconnect}
                  variant="outline"
                  size="lg"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Call
                </Button>
              </div>
            )}
          </div>

          {/* Audio Level Indicator */}
          {isConnected && isMicEnabled && (
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center gap-1">
                <Mic className="w-4 h-4 text-muted-foreground" />
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Transcript */}
      {isConnected && transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversation
            </CardTitle>
            <CardDescription>
              Real-time transcript of your voice conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((entry) => (
                <div 
                  key={entry.id}
                  className={`flex gap-3 ${entry.speaker === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    entry.speaker === 'assistant' 
                      ? 'bg-muted' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {entry.speaker === 'assistant' ? (
                        <Brain className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {entry.speaker === 'assistant' ? 'NewMe' : 'You'}
                      </span>
                      <span className="text-xs opacity-70">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtimeVoiceAgent;