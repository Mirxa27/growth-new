import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/ai/openai.service';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';

interface VoiceChatWebSocketProps {
  onTranscript?: (text: string, isUser: boolean) => void;
}

export const VoiceChatWebSocket: React.FC<VoiceChatWebSocketProps> = ({ onTranscript }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const realtimeChatRef = useRef<RealtimeVoiceChat | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      // Check if OpenAI is configured
      if (!openaiService.isConfigured()) {
        toast({
          title: 'OpenAI Not Configured',
          description: 'Please configure your OpenAI API key in the admin settings.',
          variant: 'destructive',
        });
        return;
      }

      // Create realtime voice chat instance
      const realtimeChat = new RealtimeVoiceChat((message) => {
        console.log('Realtime message:', message);
        
        switch (message.type) {
          case 'connected':
            setIsConnected(true);
            toast({
              title: 'Connected',
              description: 'Voice chat is now active',
            });
            break;
            
          case 'disconnected':
            setIsConnected(false);
            setIsRecording(false);
            break;
            
          case 'error':
            toast({
              title: 'Voice Error',
              description: message.error?.message || 'An error occurred',
              variant: 'destructive',
            });
            break;
            
          case 'transcription':
            if (message.text) {
              onTranscript?.(message.text, message.isUser || false);
            }
            break;
            
          case 'audio_level':
            setAudioLevel(Math.round(message.level * 100));
            break;
        }
      });
      
      realtimeChatRef.current = realtimeChat;
      
      // Connect using the existing implementation
      await realtimeChat.connect();
      
      // Start recording immediately after connection
      setTimeout(() => {
        if (realtimeChatRef.current) {
          realtimeChatRef.current.startRecording();
          setIsRecording(true);
        }
      }, 1000);

    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to voice chat',
        variant: 'destructive',
      });
    }
  };

  const disconnect = () => {
    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setAudioLevel(0);
  };

  const toggleMute = () => {
    if (realtimeChatRef.current && isRecording) {
      if (isMuted) {
        realtimeChatRef.current.startRecording();
      } else {
        realtimeChatRef.current.stopRecording();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <Card className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Voice Chat (WebSocket)</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4" />
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${Math.min(audioLevel, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isConnected ? disconnect : connect}
          variant={isConnected ? 'destructive' : 'default'}
          size="lg"
          className="flex-1"
        >
          {isConnected ? (
            <>
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Start Voice Chat
            </>
          )}
        </Button>

        {isConnected && (
          <Button
            onClick={toggleMute}
            variant={isMuted ? 'destructive' : 'secondary'}
            size="lg"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          {isRecording ? 'Listening...' : 'Connecting...'}
        </div>
      )}
    </Card>
  );
};