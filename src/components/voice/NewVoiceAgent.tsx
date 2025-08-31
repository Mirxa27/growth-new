import { useEffect, useRef } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

export const NewVoiceAgent = () => {
  const { toast } = useToast();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const voiceConfig = {
    onConnect: () => toast({ title: "Voice agent connected" }),
    onDisconnect: () => toast({ title: "Voice agent disconnected" }),
    onMessage: (message: any) => {
      if (message.type === 'response.audio.delta' && message.delta?.audio) {
        // Handle audio streaming
      }
    },
    onError: (error: Error) => toast({ title: "Voice Error", description: error.message, variant: "destructive" }),
  };

  const {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    transcript,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  } = useVoiceAgent(voiceConfig);

  useEffect(() => {
    if (audioPlayerRef.current) {
      // Logic to handle audio playback
    }
  }, [isSpeaking]);

  return (
    <Card className="glass-card border-glass">
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        
        <div className="flex gap-4 justify-center">
          {!isConnected ? (
            <Button onClick={connect} disabled={isConnecting}>
              <Phone className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Start Call'}
            </Button>
          ) : (
            <>
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? 'Stop' : 'Speak'}
              </Button>
              <Button onClick={disconnect} variant="destructive">
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            </>
          )}
        </div>
        
        {transcript && (
          <p className="text-sm text-muted-foreground">
            You said: <em>{transcript}</em>
          </p>
        )}
        
        <audio ref={audioPlayerRef} hidden />
      </CardContent>
    </Card>
  );
};