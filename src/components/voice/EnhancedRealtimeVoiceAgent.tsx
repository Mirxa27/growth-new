import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Brain,
  Loader2
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
  confidence?: number;
}

interface RealtimeMessage {
  type: string;
  event_id?: string;
  [key: string]: any;
}

interface AudioConfig {
  sampleRate: number;
  channels: number;
  format: 'pcm16' | 'g711_ulaw';
}

const AUDIO_CONFIG: AudioConfig = {
  sampleRate: 24000,
  channels: 1,
  format: 'pcm16'
};

export const EnhancedRealtimeVoiceAgent: React.FC = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Audio state
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVADActive, setIsVADActive] = useState(false);
  
  // Conversation state
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { toast } = useToast();

  // Refs for WebSocket and Audio
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);
  const audioBufferRef = useRef<Int16Array[]>([]);

  // Session management
  const initializeVoiceSession = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Get ephemeral token from our edge function
      const { data: sessionData, error } = await supabase.functions.invoke('get-realtime-token', {
        body: { model: 'gpt-4o-realtime-preview' }
      });

      if (error) throw error;

      // Initialize audio context and microphone
      await initializeAudio();
      
      // Connect to OpenAI Realtime API
      await connectToRealtimeAPI(sessionData);

      setIsConnected(true);
      setConnectionStatus('connected');
      setCurrentSessionId(sessionData.session_id);

      toast({
        title: "Voice Assistant Connected",
        description: "You can now start talking to NewMe.",
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

  const initializeAudio = async () => {
    try {
      // Create a single AudioContext for the entire session
      if (audioContextRef.current?.state === 'closed' || !audioContextRef.current) {
        audioContextRef.current = new AudioContext({
          sampleRate: AUDIO_CONFIG.sampleRate,
          latencyHint: 'interactive'
        });
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channels
        }
      });

      // Setup audio monitoring using the same context
      setupAudioMonitoring();

      // Setup remote audio for playback
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }

    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw new Error('Failed to access microphone. Please check permissions.');
    }
  };

  const setupAudioMonitoring = () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    try {
      // Create analyser for audio level monitoring
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect media stream to analyser using the same context
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(analyserRef.current);

      // Start audio level monitoring
      startAudioLevelMonitoring();

      // Setup audio worklet for real-time processing
      setupAudioWorklet();

    } catch (error) {
      console.error('Audio monitoring setup failed:', error);
    }
  };

  const setupAudioWorklet = async () => {
    if (!audioContextRef.current) return;

    try {
      // Load audio worklet for real-time audio processing
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      
      audioWorkletRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: {
          sampleRate: AUDIO_CONFIG.sampleRate,
          channels: AUDIO_CONFIG.channels
        }
      });

      // Connect audio stream to worklet
      if (mediaStreamRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        source.connect(audioWorkletRef.current);
      }

      // Handle processed audio data
      audioWorkletRef.current.port.onmessage = (event) => {
        const { audioData, isVoiceActive } = event.data;
        
        setIsVADActive(isVoiceActive);
        
        if (isVoiceActive && audioData && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send audio data to OpenAI
          sendAudioToAPI(audioData);
        }
      };

    } catch (error) {
      console.warn('Audio worklet setup failed, falling back to basic monitoring:', error);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128);
    
    audioLevelIntervalRef.current = window.setInterval(() => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Convert to 0-100 scale
      const level = (average / 255) * 100;
      setAudioLevel(level);
    }, 100);
  };

  const connectToRealtimeAPI = async (sessionData: VoiceSession) => {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${sessionData.model}`;
      
      wsRef.current = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${sessionData.client_secret}`
      ]);

      wsRef.current.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Send session configuration
        sendMessage({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: "You are NewMe, a supportive AI companion for women's personal growth and empowerment. Speak warmly and encouragingly, offering insights and guidance.",
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        });

        resolve();
      };

      wsRef.current.onmessage = handleRealtimeMessage;

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        if (event.code !== 1000) {
          toast({
            title: "Connection Lost",
            description: "Voice assistant disconnected unexpectedly.",
            variant: "destructive"
          });
        }
      };
    });
  };

  const handleRealtimeMessage = (event: MessageEvent) => {
    try {
      const message: RealtimeMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'conversation.item.input_audio_transcription.completed':
          if (message.transcript) {
            addTranscriptEntry('user', message.transcript);
          }
          break;

        case 'response.audio.delta':
          if (message.delta && isSpeakerEnabled) {
            playAudioDelta(message.delta);
          }
          break;

        case 'response.audio_transcript.delta':
          if (message.delta) {
            updateAssistantTranscript(message.delta);
          }
          break;

        case 'response.done':
          setIsAssistantSpeaking(false);
          break;

        case 'response.created':
          setIsAssistantSpeaking(true);
          break;

        case 'error':
          console.error('Realtime API error:', message);
          toast({
            title: "API Error",
            description: message.error?.message || "An error occurred",
            variant: "destructive"
          });
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing realtime message:', error);
    }
  };

  const sendMessage = (message: RealtimeMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const sendAudioToAPI = (audioData: Int16Array) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Convert Int16Array to base64
    const uint8Array = new Uint8Array(audioData.buffer);
    const base64Audio = btoa(String.fromCharCode(...uint8Array));

    sendMessage({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    });
  };

  const playAudioDelta = (deltaBase64: string) => {
    try {
      // Decode base64 audio data
      const binaryString = atob(deltaBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Int16Array (PCM16)
      const audioData = new Int16Array(bytes.buffer);
      
      // Play audio using Web Audio API
      playPCM16Audio(audioData);
    } catch (error) {
      console.error('Error playing audio delta:', error);
    }
  };

  const playPCM16Audio = (audioData: Int16Array) => {
    if (!audioContextRef.current || !isSpeakerEnabled) return;

    try {
      // Create audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        audioData.length,
        AUDIO_CONFIG.sampleRate
      );

      // Convert Int16 to Float32
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / 32768; // Convert to -1.0 to 1.0 range
      }

      // Create buffer source and play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing PCM16 audio:', error);
    }
  };

  const addTranscriptEntry = (speaker: 'user' | 'assistant', text: string, confidence?: number) => {
    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random()}`,
      speaker,
      text,
      timestamp: new Date(),
      confidence
    };

    setTranscript(prev => [...prev, entry]);
  };

  const updateAssistantTranscript = (delta: string) => {
    setTranscript(prev => {
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && lastEntry.speaker === 'assistant') {
        // Update the last assistant entry
        return prev.map((entry, index) => 
          index === prev.length - 1 
            ? { ...entry, text: entry.text + delta }
            : entry
        );
      } else {
        // Create new assistant entry
        return [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          speaker: 'assistant',
          text: delta,
          timestamp: new Date()
        }];
      }
    });
  };

  const toggleMicrophone = () => {
    setIsMicEnabled(prev => {
      const newState = !prev;
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = newState;
        });
      }

      return newState;
    });
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(prev => !prev);
  };

  const disconnect = () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    // Stop audio monitoring
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset state
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsAssistantSpeaking(false);
    setCurrentSessionId(null);
    setAudioLevel(0);
    setIsVADActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Voice Interface */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Enhanced Voice Assistant
          </CardTitle>
          <CardDescription>
            Real-time conversation with NewMe using OpenAI's latest GPT-4o model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isConnected ? (
              <Button
                onClick={initializeVoiceSession}
                disabled={isConnecting}
                className="bg-gradient-primary text-white px-8 py-3"
                size="lg"
              >
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Phone className="h-5 w-5 mr-2" />
                )}
                {isConnecting ? 'Connecting...' : 'Start Voice Session'}
              </Button>
            ) : (
              <Button
                onClick={disconnect}
                variant="destructive"
                size="lg"
                className="px-8 py-3"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Session
              </Button>
            )}
          </div>

          {/* Status and Controls */}
          {isConnected && (
            <div className="space-y-4">
              {/* Status Indicators */}
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
                  <span className="text-sm capitalize">{connectionStatus}</span>
                </div>
                
                {isAssistantSpeaking && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Brain className="h-3 w-3 mr-1" />
                    NewMe is speaking
                  </Badge>
                )}

                {isVADActive && (
                  <Badge variant="outline" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Voice detected
                  </Badge>
                )}
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isMicEnabled ? "default" : "secondary"}
                  size="lg"
                  onClick={toggleMicrophone}
                  className="relative"
                >
                  {isMicEnabled ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>

                {/* Audio Level Indicator */}
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(audioLevel)}%
                  </span>
                </div>

                <Button
                  variant={isSpeakerEnabled ? "default" : "secondary"}
                  size="lg"
                  onClick={toggleSpeaker}
                >
                  {isSpeakerEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Transcript */}
      {isConnected && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcript.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Start speaking to begin your conversation with NewMe...
                </p>
              ) : (
                transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 ${
                      entry.speaker === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.speaker === 'assistant' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {entry.speaker === 'assistant' ? (
                        <Brain className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 ${entry.speaker === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-3xl p-3 rounded-lg ${
                        entry.speaker === 'assistant'
                          ? 'bg-purple-50 text-purple-900'
                          : 'bg-blue-50 text-blue-900'
                      }`}>
                        <p className="text-sm">{entry.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.timestamp.toLocaleTimeString()}
                          {entry.confidence && ` • ${Math.round(entry.confidence * 100)}% confidence`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedRealtimeVoiceAgent;
