/**
 * Realtime Voice Interface Component
 * Implements OpenAI Realtime API for voice conversations
 * Based on the latest OpenAI Realtime API documentation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  Activity,
  AlertCircle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { voiceService } from '@/services/api/voice.service';
import { env } from '@/config/environment';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  latency?: number;
}

interface AudioState {
  isMuted: boolean;
  isListening: boolean;
  volume: number;
  noiseLevel: number;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  duration?: number;
}

const RealtimeVoiceInterface = () => {
  const { toast } = useToast();
  
  // WebSocket and WebRTC references
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected'
  });
  
  const [audioState, setAudioState] = useState<AudioState>({
    isMuted: false,
    isListening: false,
    volume: 100,
    noiseLevel: 0
  });
  
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'websocket' | 'webrtc'>('websocket');
  
  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);
  
  /**
   * Connect to OpenAI Realtime API via WebSocket
   */
  const connectWebSocket = async () => {
    try {
      setConnectionState({ status: 'connecting' });
      
      // Get configuration
      const { data: config, error: configError } = await voiceService.getRealtimeConfig();
      if (configError || !config) {
        throw new Error('Failed to get voice configuration');
      }
      
      // Create WebSocket connection
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${config.model}`;
      const ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${config.apiKey}`
      ]);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState({ status: 'connected' });
        setSessionId(`ws_${Date.now()}`);
        
        // Send session configuration without type (already set during connection)
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: config.instructions || "You are a helpful AI assistant. Be concise and friendly.",
            voice: config.voice || 'alloy',
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
            tools: config.tools || [],
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        }));
        
        toast({
          title: 'Connected',
          description: 'Voice session is ready',
        });
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState({ 
          status: 'error', 
          error: 'Connection error occurred' 
        });
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState({ status: 'disconnected' });
        setSessionId(null);
      };
      
      wsRef.current = ws;
      
      // Start audio capture
      await startAudioCapture();
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to connect' 
      });
      
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: 'destructive',
      });
    }
  };
  
  /**
   * Connect via WebRTC for lower latency
   */
  const connectWebRTC = async () => {
    try {
      setConnectionState({ status: 'connecting' });
      
      // Get ephemeral token
      const { data: tokenData, error: tokenError } = await voiceService.generateVoiceToken('user');
      if (tokenError || !tokenData) {
        throw new Error('Failed to get ephemeral token');
      }
      
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      // Add audio track
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle incoming audio
      pc.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
      };
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send offer to server (this would be your signaling server)
      // For now, we'll use WebSocket as fallback
      console.log('WebRTC offer created, falling back to WebSocket for now');
      await connectWebSocket();
      
      pcRef.current = pc;
      
    } catch (error) {
      console.error('WebRTC connection error:', error);
      setConnectionState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'WebRTC connection failed' 
      });
      
      // Fallback to WebSocket
      await connectWebSocket();
    }
  };
  
  /**
   * Start audio capture from microphone
   */
  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      if (audioContextRef.current && wsRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        // Create script processor for audio processing
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN && !audioState.isMuted) {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32Array to Int16Array (PCM16)
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Send audio data
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
            }));
            
            // Update noise level
            const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
            setAudioState(prev => ({ ...prev, noiseLevel: rms * 100 }));
          }
        };
        
        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
        
        setAudioState(prev => ({ ...prev, isListening: true }));
      }
      
    } catch (error) {
      console.error('Audio capture error:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };
  
  /**
   * Handle incoming Realtime API messages
   */
  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case 'session.created':
        console.log('Session created:', message.session);
        break;
        
      case 'session.updated':
        console.log('Session updated:', message.session);
        break;
        
      case 'conversation.item.created':
        if (message.item.role === 'assistant' && message.item.content) {
          const entry: TranscriptEntry = {
            id: message.item.id,
            role: 'assistant',
            content: message.item.content[0]?.text || '',
            timestamp: new Date()
          };
          setTranscript(prev => [...prev, entry]);
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        const userEntry: TranscriptEntry = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: message.transcript,
          timestamp: new Date()
        };
        setTranscript(prev => [...prev, userEntry]);
        break;
        
      case 'response.audio.delta':
        // Play audio chunk
        if (message.delta) {
          playAudioChunk(message.delta);
        }
        break;
        
      case 'response.audio_transcript.delta':
        // Update assistant transcript in real-time
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            last.content += message.delta;
            return [...prev.slice(0, -1), last];
          }
          return prev;
        });
        break;
        
      case 'response.done':
        setIsProcessing(false);
        break;
        
      case 'error':
        console.error('Realtime API error:', message.error);
        toast({
          title: 'Error',
          description: message.error.message,
          variant: 'destructive',
        });
        break;
    }
  };
  
  /**
   * Play audio chunk from response
   */
  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert to Float32Array for Web Audio API
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 0x8000;
      }
      
      // Create and play audio buffer
      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };
  
  /**
   * Disconnect from Realtime API
   */
  const disconnect = () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Close WebRTC
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setConnectionState({ status: 'disconnected' });
    setAudioState(prev => ({ ...prev, isListening: false }));
    setSessionId(null);
    
    toast({
      title: 'Disconnected',
      description: 'Voice session ended',
    });
  };
  
  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setAudioState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.clear'
      }));
    }
  };
  
  /**
   * Clear conversation
   */
  const clearConversation = () => {
    setTranscript([]);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.truncate',
        item_id: 'root'
      }));
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Realtime Voice Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={connectionState.status === 'connected' ? 'default' : 'secondary'}>
              {connectionState.status === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : connectionState.status === 'connecting' ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            {sessionId && (
              <Badge variant="outline" className="text-xs">
                {sessionId.substring(0, 8)}...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          {connectionState.status === 'disconnected' ? (
            <>
              <Button
                onClick={() => connectionType === 'websocket' ? connectWebSocket() : connectWebRTC()}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Start Voice Session
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setConnectionType(prev => prev === 'websocket' ? 'webrtc' : 'websocket')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={disconnect}
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Session
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
              >
                {audioState.isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={clearConversation}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        
        {/* Connection Error */}
        {connectionState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionState.error}</AlertDescription>
          </Alert>
        )}
        
        {/* Audio Levels */}
        {connectionState.status === 'connected' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Microphone Level</span>
              <span>{Math.round(audioState.noiseLevel)}%</span>
            </div>
            <Progress value={audioState.noiseLevel} className="h-2" />
          </div>
        )}
        
        <Separator />
        
        {/* Transcript */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Conversation</h3>
          <div className="max-h-96 overflow-y-auto space-y-2 p-4 bg-muted/50 rounded-lg">
            {transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {connectionState.status === 'connected' 
                  ? 'Start speaking to begin the conversation...'
                  : 'Connect to start a voice session'}
              </p>
            ) : (
              transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex gap-2 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      entry.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="text-sm">{entry.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex gap-2">
                <div className="bg-background border rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Connection Type Info */}
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Using {connectionType === 'websocket' ? 'WebSocket' : 'WebRTC'} connection.
            {connectionType === 'websocket' 
              ? ' Server-side processing with more control.'
              : ' Peer-to-peer connection with lower latency.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RealtimeVoiceInterface;