import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Volume2, 
  Phone,
  PhoneOff,
  Sparkles,
  Zap,
  Heart,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/config/environment';

interface RealtimeVoiceInterfaceProps {
  onMessage?: (message: RealtimeEvent) => void;
  className?: string;
}

interface RealtimeEvent {
  type: string;
  event_id?: string;
  conversation?: { id: string };
  item?: {
    type: string;
    role: string;
    content?: Array<{ type: string; text: string }>;
  };
  delta?: { audio?: string; text?: string; transcript?: string };
  transcript?: string;
  error?: { type: string; code: string; message: string };
}

export const RealtimeVoiceInterface = ({ 
  onMessage, 
  className 
}: RealtimeVoiceInterfaceProps) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // WebSocket connection to OpenAI Realtime API
  const connectToOpenAI = useCallback(async () => {
    if (connectionStatus === 'connecting' || isConnected) return;
    
    setConnectionStatus('connecting');
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get ephemeral client secret and model from server (admin-configured)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication required');

      const tokenResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-realtime-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!tokenResp.ok) {
        const err = await tokenResp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get realtime token');
      }
      const tokenData = await tokenResp.json();
      const clientSecret: string = tokenData.client_secret?.value || tokenData.client_secret;
      const model: string = tokenData.model || 'gpt-realtime-2025-08-28';

      // Generate session
      const newSessionId = `voice_session_${Date.now()}`;
      setSessionId(newSessionId);
      
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        ['realtime', `openai-insecure-api-key.${clientSecret}`]
      );
      
      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        
        // Configure session with voice config
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are a supportive growth guide dedicated to helping users on their journey of self-discovery and personal growth. Speak warmly and with care.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: []
          }
        }));
        
        startRecording();
        
      };
      
      ws.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        setIsRecording(false);
        setIsSpeaking(false);
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to connect to OpenAI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to voice service';
      setError(errorMessage);
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      setConnectionStatus('disconnected');
      setIsConnecting(false);
    }
  }, [connectionStatus, isConnected, toast]);

  // Handle realtime events from OpenAI
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    console.log('Realtime event:', event.type, event);
    
    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setUserTranscript(event.transcript);
        }
        break;
        
      case 'response.audio.delta':
        if (event.delta?.audio) {
          // Queue audio for playback
          const audioData = atob(event.delta.audio);
          const buffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
          }
          audioQueueRef.current.push(buffer);
          
          if (!isPlayingRef.current) {
            playQueuedAudio();
          }
        }
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsRecording(true);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsRecording(false);
        break;
        
      case 'error':
        console.error('OpenAI Realtime API error:', event.error);
        break;
    }

    onMessage?.(event);
  }, [onMessage]);

  // Audio playback
  const playQueuedAudio = useCallback(async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }
    
    isPlayingRef.current = true;
    setIsSpeaking(true);
    
    try {
      while (audioQueueRef.current.length > 0) {
        const audioBuffer = audioQueueRef.current.shift();
        if (!audioBuffer) continue;
        
        // Convert raw PCM16 to AudioBuffer
        const audioData = new Int16Array(audioBuffer);
        const audioBuffer2 = audioContextRef.current.createBuffer(1, audioData.length, 24000);
        const channelData = audioBuffer2.getChannelData(0);
        
        for (let i = 0; i < audioData.length; i++) {
          channelData[i] = audioData[i] / 32768;
        }
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer2;
        source.connect(audioContextRef.current.destination);
        
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      isPlayingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (!isConnected || !audioContextRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Create audio processor
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const outputData = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(outputData.buffer)));
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isConnected]);

  // Initialize audio context
  const initializeAudioContext = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  // Disconnect from OpenAI
  const disconnect = useCallback(async () => {
    // Save session transcript if we have one
    if (sessionId && wsRef.current) {
      try {
        const transcript = [userTranscript]; // In production, collect full conversation
        await voiceService.saveSessionTranscript(sessionId, transcript, {
          duration: Date.now() - parseInt(sessionId.split('_')[2]),
          status: 'completed'
        });
      } catch (error) {
        console.error('Failed to save session transcript:', error);
      }
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setIsRecording(false);
    setIsSpeaking(false);
    setUserTranscript('');
    setSessionId('');
    setError(null);
    
  }, [sessionId, userTranscript]);

  // Initialize on mount
  useEffect(() => {
    initializeAudioContext();
    
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initializeAudioContext, disconnect]);

  const startVoiceChat = async () => {
    await connectToOpenAI();
  };

  const endVoiceChat = () => {
    disconnect();
  };

  return (
    <Card className={cn("glass-card border-glass", className)}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2">
          <Phone className="w-5 h-5" />
          Real-time Voice Chat
        </CardTitle>
        <div className="flex justify-center">
          <Badge variant={isConnected ? "default" : "secondary"} className="glass">
            {connectionStatus === 'connecting' && "Connecting..."}
            {connectionStatus === 'connected' && "Connected"}
            {connectionStatus === 'disconnected' && "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="glass-card">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Main Voice Interface */}
        <div className="flex flex-col items-center space-y-4">
          {/* Voice Visualization */}
          <div className="relative">
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
              isConnected ? "bg-gradient-primary shadow-glow" : "bg-muted",
              isRecording && "animate-pulse scale-110",
              isSpeaking && "bg-gradient-secondary"
            )}>
              {isRecording ? (
                <Mic className="w-12 h-12 text-white" />
              ) : isSpeaking ? (
                <Volume2 className="w-12 h-12 text-white" />
              ) : (
                <Phone className="w-12 h-12 text-white opacity-60" />
              )}
            </div>
            
            {/* Audio level visualization */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              {!isConnected && "Ready to connect"}
              {isConnected && !isRecording && !isSpeaking && "Listening..."}
              {isRecording && "You're speaking"}
              {isSpeaking && "NewMe is responding"}
            </p>
            
            {userTranscript && (
              <div className="glass rounded-lg p-3 max-w-md">
                <p className="text-sm text-muted-foreground">You said:</p>
                <p className="text-sm">{userTranscript}</p>
              </div>
            )}
          </div>

          {/* Connection Controls */}
          <div className="flex gap-4">
            {!isConnected ? (
              <Button 
                onClick={startVoiceChat} 
                disabled={isConnecting}
                className="bg-gradient-primary px-8"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Start Voice Chat'}
              </Button>
            ) : (
              <Button 
                onClick={endVoiceChat} 
                variant="destructive"
                className="px-8"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}
          </div>
        </div>

        {/* Feature Highlights */
        }
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-medium">Real-time</p>
            <p className="text-xs text-muted-foreground">Instant voice responses</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-sm font-medium">Supportive</p>
            <p className="text-xs text-muted-foreground">Sensitive to tone</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm font-medium">Contextual</p>
            <p className="text-xs text-muted-foreground">Remembers context</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
