import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Loader2, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface VoiceChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
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

interface EnhancedVoiceInterfaceProps {
  className?: string;
  onMessage?: (message: VoiceChatMessage) => void;
}

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({
  className,
  onMessage
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const handleMessage = (data: RealtimeEvent) => {
    if (data.type === 'response.audio_transcript.delta' && data.delta) {
      const message: VoiceChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.delta.text || '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      onMessage?.(message);
      setAiResponse(data.delta.text || '');
      setTimeout(() => setAiResponse(''), 5000);
    }
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    setUserTranscript(text);
    if (isFinal) {
      setTimeout(() => setUserTranscript(''), 3000);
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
    if (speaking) {
      setAiResponse('');
    }
  };

  const startVoiceChat = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      
      voiceChatRef.current = new RealtimeVoiceChat(
        handleMessage,
        handleTranscript,
        handleSpeakingChange
      );

      await voiceChatRef.current.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      await startAudioMonitoring();

      toast({
        title: "Connected! 🎤",
        description: "Voice chat is ready. Start speaking to NewMe.",
      });

    } catch (error) {
      console.error('Error starting voice chat:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      toast({
        title: "Connection Failed",
        description: "Please check your microphone permissions and try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endVoiceChat = async () => {
    if (voiceChatRef.current) {
      await voiceChatRef.current.disconnect();
      voiceChatRef.current = null;
    }
    
    stopAudioMonitoring();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsRecording(false);
    setUserTranscript('');
    setAiResponse('');
    
    toast({
      title: "Disconnected",
      description: "Voice chat session ended.",
    });
  };

  const toggleRecording = () => {
    if (!voiceChatRef.current || !isConnected) return;

    try {
      if (isRecording) {
        voiceChatRef.current.stopRecording();
        setIsRecording(false);
      } else {
        voiceChatRef.current.startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to toggle recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      if (voiceChatRef.current) {
        voiceChatRef.current.disconnect();
      }
      stopAudioMonitoring();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className={cn("space-y-6", className)}>
        <Card className="glass-card border-glass">
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
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {isConnected && (
                  <>
                    <div className={cn(
                      "absolute inset-0 rounded-full transition-all duration-300",
                      isRecording
                        ? "animate-ping bg-primary/20 scale-150"
                        : isSpeaking
                          ? "animate-pulse bg-secondary/30 scale-125"
                          : "bg-glass-ambient/10 scale-100"
                    )}></div>
                    
                    <div className={cn(
                      "absolute inset-0 rounded-full transition-all duration-500",
                      isRecording
                        ? "animate-pulse bg-primary/30 scale-125"
                        : isSpeaking
                          ? "bg-secondary/20 scale-110"
                          : "bg-glass-ambient/5 scale-100"
                    )}></div>
                  </>
                )}

                <Button
                  onClick={isConnected ? toggleRecording : startVoiceChat}
                  disabled={isConnecting}
                  className={cn(
                    "relative w-32 h-32 rounded-full transition-all duration-300 border-2 micro-bounce",
                    isConnected
                      ? isRecording
                        ? "bg-primary border-primary-glow shadow-glow scale-110"
                        : isSpeaking
                          ? "bg-secondary border-secondary-glow shadow-glow"
                          : "glass border-glass-border hover:scale-105"
                      : "bg-gradient-primary hover:scale-105",
                    isConnecting && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    transform: isRecording
                      ? `scale(${1.1 + audioLevel * 0.3})`
                      : undefined
                  }}
                >
                  <div className="flex flex-col items-center">
                    {isConnecting ? (
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-8 h-8 mb-2" />
                    ) : isConnected ? (
                      isRecording ? (
                        <MicOff className="w-8 h-8 mb-2" />
                      ) : (
                        <Mic className="w-8 h-8 mb-2" />
                      )
                    ) : (
                      <MessageSquare className="w-8 h-8 mb-2" />
                    )}
                    
                    <span className="text-sm font-medium">
                      {isConnecting
                        ? "Connecting..."
                        : isSpeaking
                          ? "NewMe"
                          : isConnected
                            ? isRecording
                              ? "Stop"
                              : "Speak"
                            : "Start Chat"
                      }
                    </span>
                  </div>
                </Button>

                {isRecording && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 bg-primary rounded-full transition-all duration-100",
                            audioLevel * 10 > i ? "h-4" : "h-1"
                          )}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isRecording && <Badge variant="outline">Recording</Badge>}
                  {isSpeaking && <Badge variant="outline">Speaking</Badge>}
                </div>
                
                <p className={cn(
                  "text-lg font-medium transition-colors",
                  isRecording ? "text-primary" : "text-foreground"
                )}>
                  {isConnecting
                    ? "Connecting to NewMe..."
                    : isSpeaking
                      ? "NewMe is speaking..."
                      : isRecording
                        ? "Listening..."
                        : isConnected
                          ? "Tap to speak with NewMe"
                          : "Start a voice conversation"
                  }
                </p>
                
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? isRecording
                      ? "Speak clearly and tap again when you're done"
                      : "Real-time voice conversation with NewMe"
                    : "Connect your microphone to begin"
                  }
                </p>
              </div>

              {isConnected && (
                <Button
                  onClick={endVoiceChat}
                  variant="outline"
                  size="sm"
                  className="glass-button"
                >
                  End Conversation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(userTranscript || aiResponse) && (
          <div className="space-y-4">
            {userTranscript && (
              <Card className="glass-card border-glass">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">You said:</p>
                      <p className="text-foreground">{userTranscript}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {aiResponse && (
              <Card className="glass-card border-glass">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">NewMe:</p>
                      <p className="text-foreground">{aiResponse}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {messages.length > 0 && (
          <Card className="glass-card border-glass">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation History
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.slice(-5).map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      message.type === 'user' ? "bg-primary/20" : "bg-secondary/20"
                    )}>
                      {message.type === 'user' ? (
                        <Mic className="w-3 h-3 text-primary" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.type === 'user' ? 'You' : 'NewMe'} • {message.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-foreground">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};