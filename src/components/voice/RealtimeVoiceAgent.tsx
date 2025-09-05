import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadRealtimeSettings, type RealtimeSettings } from '@/services/realtime/settings.service';
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

interface RealtimeMessage {
  type: string;
  [key: string]: unknown;
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
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeSettingsRef = useRef<RealtimeSettings | null>(null);
  // Analyzer + buffer for audio level monitoring
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const initializeVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      // Get auth session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('Authentication required');
      }

      // Load realtime settings with admin configuration
      const settings = await loadRealtimeSettings();
      realtimeSettingsRef.current = settings;

      // Request ephemeral client secret from edge function (admin-configured)
      const { data: tokenData, error } = await supabase.functions.invoke('get-realtime-token', { body: {} });
      if (error) throw error;

      const sessionData: VoiceSession = {
        session_id: tokenData?.session_id || crypto.randomUUID(),
        client_secret: tokenData?.client_secret?.value || tokenData?.client_secret,
        model: tokenData?.model || 'gpt-realtime-2025-08-28',
        expires_at: tokenData?.expires_at || new Date(Date.now() + 3600000).toISOString()
      };

      // Initialize WebRTC or WebSocket connection to OpenAI Realtime API
      if (settings.connectionMethod === 'webrtc') {
        await connectWithWebRTC(sessionData);
      } else {
        await connectWithWebSocket(sessionData);
      }

      setIsConnected(true);
      setConnectionStatus('connected');

      toast({
        title: "Voice Assistant Connected",
        description: "You can now start your voice session.",
      });

    } catch (error: unknown) {
      console.error('Voice session initialization error:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to voice assistant.';
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWithWebSocket = async (sessionData: VoiceSession) => {
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

      // Create WebSocket connection to OpenAI Realtime API using admin-configured base URL
      const settings = realtimeSettingsRef.current!;
      const wsUrl = `${settings.base_url.replace('https://', 'wss://').replace('http://', 'ws://')}/realtime?model=${encodeURIComponent(sessionData.model)}`;
      
      // Create WebSocket with proper authorization via subprotocol
      wsRef.current = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${sessionData.client_secret}`]);

      wsRef.current.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Send authentication and session config with standardized settings
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            model: 'gpt-realtime-2025-08-28', // Standardized model
            instructions: settings.instructions,
            voice: settings.voice,
            input_audio_format: settings.inputFormat,
            output_audio_format: settings.outputFormat,
            input_audio_transcription: {
              model: settings.sttModel
            },
            turn_detection: {
              type: settings.vad.type,
              threshold: settings.vad.threshold,
              prefix_padding_ms: settings.vad.prefixPaddingMs,
              silence_duration_ms: settings.vad.silenceDurationMs
            },
            temperature: settings.temperature,
            max_tokens: settings.max_tokens
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

  const connectWithWebRTC = async (sessionData: VoiceSession) => {
    try {
      // Prepare audio element for remote playback
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
        remoteAudioRef.current.autoplay = true;
      }

      // Get microphone
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        },
        video: false
      });

      // Optional: audio context for level/VAD only
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      await setupAudioLevelMonitoring();

      // Create peer connection
      pcRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add mic track
      mediaStreamRef.current.getTracks().forEach(track => pcRef.current!.addTrack(track, mediaStreamRef.current!));

      // Handle remote tracks
      pcRef.current.ontrack = (event) => {
        const [remoteTrack] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteTrack;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Data channel for events
      dcRef.current = pcRef.current.createDataChannel('oai-events');
      dcRef.current.onopen = () => {
        const settings = realtimeSettingsRef.current!;
        const sessionUpdate = {
          type: 'session.update',
          session: {
            model: 'gpt-realtime-2025-08-28', // Standardized model
            instructions: settings.instructions,
            voice: settings.voice,
            turn_detection: {
              type: settings.vad.type,
              threshold: settings.vad.threshold,
              prefix_padding_ms: settings.vad.prefixPaddingMs,
              silence_duration_ms: settings.vad.silenceDurationMs
            },
            temperature: settings.temperature,
            max_tokens: settings.max_tokens
          }
        };
        try {
          dcRef.current?.send(JSON.stringify(sessionUpdate));
        } catch (error) {
          console.warn('Failed to send session update:', error);
        }
      };
      pcRef.current.ondatachannel = (ev) => {
        // If server opens channels, capture them if needed
        if (!dcRef.current) {
          dcRef.current = ev.channel;
        }
      };

      // Create offer
      const offer = await pcRef.current.createOffer({ offerToReceiveAudio: true });
      await pcRef.current.setLocalDescription(offer);

      // Exchange SDP with OpenAI Realtime
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${sessionData.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.client_secret}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp || ''
      });
      const answerSdp = await sdpResponse.text();
      await pcRef.current.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setIsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to establish WebRTC connection:', error);
      setConnectionStatus('error');
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
      
      let silenceTimer: number | null = null;
      let lastLevel = 0;
      audioWorkletRef.current.port.onmessage = (event) => {
        const data = event.data as {
          type?: string;
          audio?: string;
          audioData?: Int16Array;
          level?: number;
          audioLevel?: number;
        };

        // Prefer raw PCM16 from worklet and encode here
        if (data?.audioData && isMicEnabled && wsRef.current?.readyState === WebSocket.OPEN) {
          const uint8 = new Uint8Array(data.audioData.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
          const base64Audio = btoa(binary);
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64Audio }));
          return;
        }

        // Backward compatibility if the worklet posts base64 itself
        if (data?.type === 'audio-data' && typeof data.audio === 'string' && isMicEnabled && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: data.audio }));
          return;
        }

        // Handle audio level updates (typed or untyped)
        const level = typeof data?.audioLevel === 'number' ? data.audioLevel : (typeof data?.level === 'number' ? data.level : undefined);
        if (typeof level === 'number') {
          setAudioLevel(level);
          // Basic silence detection: when level drops below threshold after being higher, commit
          const threshold = 0.02; // tune if needed
          const nowSpeaking = level > threshold;
          const wasSpeaking = lastLevel > threshold;
          lastLevel = level;

          if (wasSpeaking && !nowSpeaking && wsRef.current?.readyState === WebSocket.OPEN) {
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = window.setTimeout(() => {
              try {
                wsRef.current?.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
                wsRef.current?.send(JSON.stringify({ type: 'response.create' }));
              } catch (error) {
                console.warn('Failed to play audio delta:', error);
              }
            }, 200);
          } else if (wasSpeaking && !nowSpeaking && dcRef.current && dcRef.current.readyState === 'open') {
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = window.setTimeout(() => {
              try { 
                dcRef.current?.send(JSON.stringify({ type: 'response.create' })); 
              } catch (error) {
                console.warn('Failed to send response.create:', error);
              }
            }, 200);
          }
        }
      };
 
      source.connect(audioWorkletRef.current);
    }).catch(error => {
      console.error('Failed to load audio worklet:', error);
    });
  };
 
  // Setup audio level monitoring (copied from EnhancedRealtimeVoiceAgent implementation).
  const setupAudioLevelMonitoring = () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;
 
    // Create analyser for audio level monitoring
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    
    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    source.connect(analyserRef.current);
    
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    // Monitor audio levels
    const monitorAudioLevel = () => {
      if (!analyserRef.current) return;
      
      // Create a fresh array for the frequency data
      const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(frequencyData);
      
      // Calculate average volume
      const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
      const normalizedLevel = average / 255;
      
      setAudioLevel(normalizedLevel);
      
      if (isConnected) {
        requestAnimationFrame(monitorAudioLevel);
      }
    };
    
    monitorAudioLevel();
  };

  const handleRealtimeMessage = (message: RealtimeMessage) => {
    console.log('Received Realtime message:', message);

    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (typeof message.transcript === 'string') {
          addTranscriptEntry('user', message.transcript);
        }
        break;

      case 'response.audio_transcript.delta':
        if (typeof message.delta === 'string') {
          updateAssistantTranscript(message.delta);
        }
        break;

      case 'response.audio.delta':
        if (isSpeakerEnabled && typeof message.delta === 'string') {
          playAudioDelta(message.delta);
        }
        break;

      case 'response.done':
        console.log('Response completed');
        break;

      case 'error': {
        console.error('Realtime API error:', message.error);
        const errorMessage = message.error && 
          typeof message.error === 'object' && 
          'message' in message.error && 
          typeof message.error.message === 'string' 
          ? message.error.message 
          : "An error occurred during conversation.";
        
        toast({
          title: "Voice Assistant Error",
          description: errorMessage,
          variant: "destructive"
        });
        break;
      }
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

    if (dcRef.current) {
      try { 
        dcRef.current.close(); 
      } catch (error) {
        console.warn('Failed to close data channel:', error);
      }
      dcRef.current = null;
    }

    if (pcRef.current) {
      try { 
        pcRef.current.close(); 
      } catch (error) {
        console.warn('Failed to close peer connection:', error);
      }
      pcRef.current = null;
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
