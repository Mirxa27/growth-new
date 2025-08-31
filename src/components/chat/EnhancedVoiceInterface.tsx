import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface VoiceChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  audioUrl?: string;
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
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);

  const handleRealtimeMessage = (data: any) => {
    const now = new Date();
    if (data?.type === 'error') {
      const msg: VoiceChatMessage = { id: now.getTime().toString(), type: 'error', content: data?.error?.message ?? 'Unknown error', timestamp: now };
      setMessages(prev => [...prev, msg]);
      onMessage?.(msg);
      return;
    }

    if (data?.type === 'response.audio_transcript.delta' && data.delta) {
      const text = data.delta?.text ?? data.transcript ?? '';
      const msg: VoiceChatMessage = { id: now.getTime().toString(), type: 'assistant', content: text, timestamp: now };
      setMessages(prev => [...prev, msg]);
      setAiResponse(text);
      onMessage?.(msg);
      setTimeout(() => setAiResponse(''), 6000);
      return;
    }

    const msg: VoiceChatMessage = { id: now.getTime().toString(), type: 'system', content: `[${data?.type}] ${JSON.stringify(data?.item ?? '')}`, timestamp: now };
    setMessages(prev => [...prev, msg]);
    onMessage?.(msg);
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    setUserTranscript(text);
    if (isFinal) {
      const msg: VoiceChatMessage = { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() };
      setMessages(prev => [...prev, msg]);
      onMessage?.(msg);
      setTimeout(() => setUserTranscript(''), 2500);
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    if (!speaking) setAiResponse('');
  };

  const startVoiceChat = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setConnectionStatus('connecting');
    try {
      voiceChatRef.current = new RealtimeVoiceChat(handleRealtimeMessage, handleTranscript, handleSpeakingChange);
      await voiceChatRef.current.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      toast({ title: 'Connected', description: 'Realtime voice chat connected.' });
    } catch (err) {
      console.error('startVoiceChat error', err);
      toast({ title: 'Connection failed', description: String((err as Error)?.message ?? err), variant: 'destructive' });
      setIsConnected(false);
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const endVoiceChat = async () => {
    try {
      voiceChatRef.current?.disconnect();
    } catch (err) {
      console.warn('endVoiceChat disconnect error', err);
    } finally {
      voiceChatRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setIsRecording(false);
      setUserTranscript('');
      setAiResponse('');
      toast({ title: 'Disconnected', description: 'Voice chat session ended.' });
    }
  };

  const toggleRecording = () => {
    if (!voiceChatRef.current || !isConnected) {
      toast({ title: 'Not connected', description: 'Please connect first.' });
      return;
    }

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
      toast({ title: 'Recording error', description: String((error as Error)?.message ?? error), variant: 'destructive' });
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        voiceChatRef.current?.disconnect();
      } catch (e) {
        // noop
      }
      voiceChatRef.current = null;
    };
  }, []);

  return (
    <ErrorBoundary>
      <Card className={cn('w-full max-w-xl mx-auto p-4', className || '')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Voice Assistant</CardTitle>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Button onClick={startVoiceChat} disabled={isConnected || isConnecting} variant="outline">
                {isConnecting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
                Connect
              </Button>

              <Button onClick={endVoiceChat} disabled={!isConnected} variant="outline">
                <MicOff className="mr-2 h-4 w-4" /> Disconnect
              </Button>

              <Button onClick={toggleRecording} disabled={!isConnected} variant={isRecording ? 'destructive' : 'default'}>
                {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecording ? 'Stop' : 'Record'}
              </Button>
            </div>

            <div className="bg-muted p-3 rounded">
              <div className="text-xs text-muted-foreground mb-2">Live Transcript</div>
              <div className="min-h-[48px]">{userTranscript || <span className="text-muted-foreground">No transcript yet</span>}</div>
            </div>

            {aiResponse ? (
              <div className="bg-surface p-3 rounded border">
                <div className="text-xs text-muted-foreground mb-1">AI</div>
                <div className="font-medium">{aiResponse}</div>
              </div>
            ) : null}

            <div className="space-y-2 max-h-48 overflow-auto">
              {messages.slice().reverse().map(m => (
                <div key={m.id} className="p-2 rounded-md border bg-white/50">
                  <div className="text-xs text-muted-foreground">{m.type} • {m.timestamp.toLocaleTimeString()}</div>
                  <div>{m.content}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default EnhancedVoiceInterface;