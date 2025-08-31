import { useEffect, useRef } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { VoiceAgentConfig } from '@/types/voice';

export const NewVoiceAgent = () => {
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const voiceConfig: VoiceAgentConfig = {
    name: 'NewMe Agent',
    instructions: 'You are a helpful assistant.',
  };

  const {
    state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  } = useVoiceAgent(voiceConfig);

  const { isConnected, isRecording, isSpeaking, transcript } = state;

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
            <Button onClick={connect}>
              <Phone className="w-4 h-4 mr-2" />
              Start Call
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