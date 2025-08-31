import React, { useEffect } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';

interface NewVoiceAgentProps {
  className?: string;
  onMessage?: (message: any) => void;
}

export const NewVoiceAgent: React.FC<NewVoiceAgentProps> = ({ className, onMessage }) => {
  const { toast } = useToast();
  
  const voiceConfig = {
    name: 'NewMe Voice Agent',
    instructions: `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. Speak warmly and empathetically, understanding their unique challenges and aspirations. Provide thoughtful, personalized guidance that helps them navigate life's complexities with confidence and grace.`,
    voice: 'alloy' as const,
    temperature: 0.7,
    maxTokens: 1000,
  };

  const {
    state,
    messages,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearMessages,
  } = useVoiceAgent(voiceConfig);

  useEffect(() => {
    if (onMessage) {
      messages.forEach(message => onMessage(message));
    }
  }, [messages, onMessage]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to voice agent",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleToggleRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Card className={cn("glass-card border-glass", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Assistant</span>
          <Badge 
            variant={state.isConnected ? "default" : "secondary"}
            className={cn(
              "transition-all duration-300",
              state.isConnected && "bg-green-500/20 text-green-300"
            )}
          >
            {state.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Controls */}
        {!state.isConnected ? (
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={handleConnect}
              className="bg-gradient-primary hover:scale-105 transition-transform"
            >
              <Phone className="w-4 h-4 mr-2" />
              Connect Voice Agent
            </Button>
            <p className="text-sm text-muted-foreground">
              Click to start your voice conversation with NewMe
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Voice Controls */}
            <div className="flex justify-center">
              <div className="relative">
                <Button
                  onClick={handleToggleRecording}
                  disabled={state.isSpeaking}
                  className={cn(
                    "w-20 h-20 rounded-full transition-all duration-300",
                    state.isRecording 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse scale-110" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {state.isRecording ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
                
                {state.isSpeaking && (
                  <div className="absolute -inset-2 rounded-full border-2 border-secondary animate-ping" />
                )}
              </div>
            </div>

            {/* Status */}
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">
                {state.isRecording ? "Listening..." : 
                 state.isSpeaking ? "NewMe is responding..." : 
                 "Ready to chat"}
              </p>
              
              {state.transcript && (
                <div className="glass rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">You said:</p>
                  <p className="text-sm">{state.transcript}</p>
                </div>
              )}
            </div>

            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={cn(
                      "p-3 rounded-lg",
                      message.type === 'user' 
                        ? "bg-primary/10 ml-8" 
                        : "bg-secondary/10 mr-8"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Disconnect Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                className="glass-button"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Conversation
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
