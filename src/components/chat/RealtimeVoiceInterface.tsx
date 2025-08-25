import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Phone,
  PhoneOff,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { useToast } from '@/hooks/use-toast';

interface RealtimeVoiceInterfaceProps {
  onMessage?: (message: any) => void;
  className?: string;
}

export const RealtimeVoiceInterface = ({ 
  onMessage, 
  className 
}: RealtimeVoiceInterfaceProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const { toast } = useToast();
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const handleMessage = useCallback((message: any) => {
    console.log('Voice chat message:', message);
    
    if (message.type === 'error') {
      toast({
        title: "Voice Chat Error",
        description: message.error?.message || 'An error occurred',
        variant: "destructive"
      });
    }

    onMessage?.(message);
  }, [onMessage, toast]);

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setUserTranscript(transcript);
      console.log('Final user transcript:', transcript);
    }
  }, []);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    if (speaking) {
      setAiTranscript(''); // Clear previous AI transcript when starting new response
    }
  }, []);

  const startVoiceChat = async () => {
    try {
      setIsConnecting(true);
      
      voiceChatRef.current = new RealtimeVoiceChat(
        handleMessage,
        handleTranscript,
        handleSpeakingChange
      );

      await voiceChatRef.current.connect();
      setIsConnected(true);
      setIsConnecting(false);

      // Start audio level monitoring
      startAudioMonitoring();

      toast({
        title: "Voice Chat Connected",
        description: "You can now speak with NewMe naturally",
      });

    } catch (error) {
      console.error('Error starting voice chat:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Could not connect to voice chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endVoiceChat = () => {
    if (voiceChatRef.current) {
      voiceChatRef.current.disconnect();
      voiceChatRef.current = null;
    }
    
    stopAudioMonitoring();
    setIsConnected(false);
    setIsSpeaking(false);
    setUserTranscript('');
    setAiTranscript('');
    setAudioLevel(0);

    toast({
      title: "Voice Chat Ended",
      description: "You can restart the conversation anytime",
    });
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
        if (analyserRef.current && isConnected) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        if (isConnected) {
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
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
      endVoiceChat();
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center space-y-6", className)}>
      {/* Connection Status & Control */}
      <div className="flex flex-col items-center space-y-4">
        {!isConnected ? (
          <Button
            onClick={startVoiceChat}
            disabled={isConnecting}
            size="lg"
            className="w-32 h-32 rounded-full bg-gradient-primary hover:scale-105 transition-all duration-300 shadow-glow"
          >
            {isConnecting ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : (
              <div className="flex flex-col items-center">
                <Phone className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Start Voice Chat</span>
              </div>
            )}
          </Button>
        ) : (
          <div className="relative">
            {/* Outer Glow Rings */}
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-300",
              isSpeaking 
                ? "animate-ping bg-secondary/30 scale-150" 
                : "bg-primary/20 scale-125"
            )}></div>
            
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-500",
              isSpeaking 
                ? "animate-pulse bg-secondary/20 scale-125" 
                : "bg-primary/10 scale-110"
            )}></div>

            {/* Main Voice Button */}
            <Button
              onClick={endVoiceChat}
              size="lg"
              className={cn(
                "relative w-32 h-32 rounded-full transition-all duration-300 border-2",
                isSpeaking 
                  ? "bg-secondary border-secondary-glow shadow-glow scale-110" 
                  : "bg-primary border-primary-glow shadow-glow",
                "hover:scale-105"
              )}
              style={{
                transform: `scale(${1.1 + audioLevel * 0.3})`
              }}
            >
              <div className="flex flex-col items-center">
                {isSpeaking ? (
                  <Volume2 className="w-8 h-8 mb-2" />
                ) : (
                  <Sparkles className="w-8 h-8 mb-2" />
                )}
                <span className="text-sm font-medium">
                  {isSpeaking ? "Speaking" : "Listening"}
                </span>
              </div>
            </Button>

            {/* Audio Level Indicator */}
            {isConnected && !isSpeaking && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 bg-primary rounded-full transition-all duration-100",
                        audioLevel * 10 > i ? "h-4" : "h-1",
                        audioLevel * 10 > i ? "bg-primary" : "bg-primary/30"
                      )}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Text */}
        <div className="text-center">
          <p className={cn(
            "text-lg font-medium transition-colors",
            isConnected 
              ? isSpeaking 
                ? "text-secondary" 
                : "text-primary" 
              : "text-muted-foreground"
          )}>
            {isConnecting 
              ? "Connecting..."
              : isConnected 
                ? isSpeaking 
                  ? "NewMe is speaking..." 
                  : "Speak naturally with NewMe"
                : "Start a voice conversation"
            }
          </p>
          
          {isConnected && (
            <p className="text-sm text-muted-foreground mt-1">
              Tap the button to end the conversation
            </p>
          )}
        </div>
      </div>

      {/* Transcripts */}
      {isConnected && (userTranscript || aiTranscript) && (
        <div className="w-full max-w-2xl space-y-4">
          {userTranscript && (
            <Card className="glass border-glass">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
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

          {aiTranscript && (
            <Card className="glass border-glass">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">NewMe:</p>
                    <p className="text-foreground">{aiTranscript}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-center max-w-md">
        <p className="text-xs text-muted-foreground">
          {!isConnected 
            ? "Experience natural conversation with NewMe using voice-to-voice technology"
            : "Speak naturally - NewMe will respond with voice and understand the flow of conversation"
          }
        </p>
      </div>
    </div>
  );
};