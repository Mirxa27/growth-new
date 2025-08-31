import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPE DEFINITIONS ---
interface VoiceChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  isFinal?: boolean;
}

type VoiceChatStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// --- CUSTOM HOOK for Voice Chat Logic ---
const useVoiceChat = (onMessage?: (message: VoiceChatMessage) => void) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<VoiceChatStatus>('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  
  const voiceChatRef = useRef<RealtimeVoiceChat | null>(null);

  const addMessage = useCallback((message: Omit<VoiceChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: VoiceChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    onMessage?.(newMessage);
  }, [onMessage]);

  const handleRealtimeMessage = useCallback((data: any) => {
    if (data?.type === 'error') {
      addMessage({ type: 'error', content: data?.error?.message ?? 'Unknown error' });
      return;
    }
    if (data?.type === 'response.audio_transcript.delta' && data.delta) {
      const text = data.delta?.text ?? data.transcript ?? '';
      addMessage({ type: 'assistant', content: text });
    }
  }, [addMessage]);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      // If the last message was a user's non-final transcript, update it. Otherwise, add a new one.
      if (lastMessage?.type === 'user' && !lastMessage.isFinal) {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...lastMessage, content: text, isFinal };
        return newMessages;
      }
      return [...prev, { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date(), isFinal }];
    });
  }, []);

  const start = useCallback(async () => {
    if (status !== 'disconnected' && status !== 'error') return;
    setStatus('connecting');
    try {
      voiceChatRef.current = new RealtimeVoiceChat(handleRealtimeMessage, handleTranscript, () => {});
      await voiceChatRef.current.connect();
      setStatus('connected');
      toast({ title: 'Connected', description: 'Realtime voice chat is active.' });
    } catch (err) {
      console.error('startVoiceChat error', err);
      toast({ title: 'Connection failed', description: String((err as Error)?.message ?? err), variant: 'destructive' });
      setStatus('error');
    }
  }, [status, toast, handleRealtimeMessage, handleTranscript]);

  const stop = useCallback(async () => {
    voiceChatRef.current?.disconnect();
    voiceChatRef.current = null;
    setStatus('disconnected');
    setIsRecording(false);
    toast({ title: 'Disconnected', description: 'Voice chat session ended.' });
  }, [toast]);

  const toggleRecording = useCallback(() => {
    if (status !== 'connected' || !voiceChatRef.current) return;
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
  }, [status, isRecording, toast]);

  useEffect(() => {
    return () => { voiceChatRef.current?.disconnect(); };
  }, []);

  return { status, isRecording, messages, start, stop, toggleRecording };
};


// --- UI COMPONENT ---
interface EnhancedVoiceInterfaceProps {
  className?: string;
  onMessage?: (message: VoiceChatMessage) => void;
}

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({ className, onMessage }) => {
  const { status, isRecording, messages, start, stop, toggleRecording } = useVoiceChat(onMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const latestUserTranscript = [...messages].reverse().find(m => m.type === 'user')?.content || '';
  const latestAiResponse = [...messages].reverse().find(m => m.type === 'assistant')?.content || '';

  return (
    <ErrorBoundary>
      <Card className={cn('w-full max-w-md mx-auto p-4 flex flex-col', className)}>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Voice Assistant</CardTitle>
            <Badge variant={status === 'connected' ? 'default' : 'secondary'}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col space-y-4 overflow-hidden">
          {/* Transcript Display */}
          <div className="flex-shrink-0 space-y-2">
            <div className="bg-muted p-3 rounded-lg min-h-[50px]">
              <div className="text-xs text-muted-foreground mb-1">You said:</div>
              <p className="font-medium">{latestUserTranscript || <span className="text-muted-foreground">...</span>}</p>
            </div>
            <AnimatePresence>
              {latestAiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-primary/10 p-3 rounded-lg border border-primary/20"
                >
                  <div className="text-xs text-primary mb-1">Assistant:</div>
                  <p className="font-medium text-primary">{latestAiResponse}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Log */}
          <div className="flex-grow bg-black/10 rounded-lg p-2 overflow-y-auto space-y-2">
            {messages.map(m => (
              <div key={m.id} className={cn("p-2 rounded-md text-sm", {
                'bg-blue-100 text-blue-900': m.type === 'user',
                'bg-green-100 text-green-900': m.type === 'assistant',
                'bg-gray-200 text-gray-600 text-xs': m.type === 'system',
                'bg-red-100 text-red-900': m.type === 'error',
              })}>
                <span className="font-bold capitalize">{m.type}: </span>{m.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex items-center justify-center space-x-4 pt-4">
            <Button
              onClick={status === 'connected' ? stop : start}
              disabled={status === 'connecting'}
              size="lg"
              className={cn(
                "rounded-full w-16 h-16",
                status === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              )}
            >
              {status === 'connecting' ? <Loader2 className="animate-spin h-6 w-6" /> :
               status === 'connected' ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </Button>

            <Button
              onClick={toggleRecording}
              disabled={status !== 'connected'}
              size="lg"
              className={cn(
                "rounded-full w-20 h-20 text-white transition-all duration-300",
                isRecording ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-blue-500',
                'disabled:bg-gray-400 disabled:scale-100'
              )}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default EnhancedVoiceInterface;