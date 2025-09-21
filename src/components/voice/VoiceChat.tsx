import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { realtimeService, RealtimeConfig } from '@/services/ai/realtime.service';
import { realtimeTranscriptionService } from '@/services/ai/realtime-transcription.service';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Phone, 
  PhoneOff,
  MessageSquare,
  User,
  Bot,
  Loader2,
  Play,
  Pause,
  Square,
  Download,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  transcription?: string;
  confidence?: number;
}

interface VoiceChatProps {
  config?: Partial<RealtimeConfig>;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string) => void;
  className?: string;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  config = {},
  onSessionStart,
  onSessionEnd,
  className = ''
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  const transcriptionSessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Generate session ID
   */
  const generateSessionId = useCallback(() => {
    return `voice_chat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }, []);

  /**
   * Add message to chat
   */
  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  /**
   * Start voice session
   */
  const startSession = useCallback(async () => {
    if (isConnected || isConnecting) return;

    try {
      setIsConnecting(true);
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      // Create and connect realtime session
      await realtimeService.createSession(sessionId, config);
      await realtimeService.connectSession(sessionId);

      // Create transcription session if enabled
      if (config.enableTranscription !== false) {
        const transcriptionSessionId = `${sessionId}_transcription`;
        transcriptionSessionIdRef.current = transcriptionSessionId;
        
        await realtimeTranscriptionService.createTranscriptionSession(
          transcriptionSessionId,
          {
            model: 'whisper-1',
            language: 'en',
            response_format: 'verbose_json',
            enable_word_timestamps: true,
          },
          (transcript, isFinal) => {
            if (isFinal && transcript.trim()) {
              addMessage({
                type: 'user',
                content: transcript,
                timestamp: new Date(),
                transcription: transcript,
              });
            }
          },
          (error) => {
            console.error('Transcription error:', error);
            toast({
              title: 'Transcription Error',
              description: error,
              variant: 'destructive',
            });
          }
        );
      }

      setIsConnected(true);
      setConnectionTime(0);
      
      // Start connection timer
      connectionTimerRef.current = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);

      // Add welcome message
      addMessage({
        type: 'assistant',
        content: 'Hello! I\'m your AI voice assistant. You can speak to me or type your messages.',
        timestamp: new Date(),
      });

      onSessionStart?.(sessionId);

      toast({
        title: 'Voice Chat Started',
        description: 'Connected to AI voice assistant',
      });

    } catch (error) {
      console.error('Failed to start voice session:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start voice session',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, config, onSessionStart, toast, generateSessionId, addMessage]);

  /**
   * End voice session
   */
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Stop recording if active
      if (isRecording) {
        setIsRecording(false);
        mediaRecorderRef.current?.stop();
      }

      // Disconnect sessions
      await realtimeService.disconnectSession(sessionIdRef.current);
      
      if (transcriptionSessionIdRef.current) {
        await realtimeTranscriptionService.disconnectTranscriptionSession(transcriptionSessionIdRef.current);
      }

      // Stop connection timer
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }

      setIsConnected(false);
      setConnectionTime(0);

      // Add goodbye message
      addMessage({
        type: 'assistant',
        content: 'Voice session ended. Thank you for chatting!',
        timestamp: new Date(),
      });

      onSessionEnd?.(sessionIdRef.current);

      sessionIdRef.current = null;
      transcriptionSessionIdRef.current = null;

      toast({
        title: 'Voice Chat Ended',
        description: 'Session disconnected successfully',
      });

    } catch (error) {
      console.error('Failed to end voice session:', error);
      toast({
        title: 'Error',
        description: 'Failed to end session properly',
        variant: 'destructive',
      });
    }
  }, [isRecording, onSessionEnd, toast, addMessage]);

  /**
   * Send text message
   */
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !sessionIdRef.current || !isConnected) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    addMessage({
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    });

    try {
      // Send message to realtime service
      await realtimeService.sendMessage(sessionIdRef.current, messageContent);

      // Simulate assistant response (in real implementation, this would come from the service)
      setTimeout(() => {
        addMessage({
          type: 'assistant',
          content: `I received your message: "${messageContent}". This is a simulated response.`,
          timestamp: new Date(),
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Message Failed',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [inputMessage, isConnected, addMessage, toast]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (!isConnected || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (transcriptionSessionIdRef.current) {
          setIsTranscribing(true);
          try {
            // Convert blob to array buffer for transcription
            const arrayBuffer = await audioBlob.arrayBuffer();
            await realtimeTranscriptionService.sendAudioForTranscription(
              transcriptionSessionIdRef.current,
              arrayBuffer
            );
            await realtimeTranscriptionService.commitTranscriptionBuffer(
              transcriptionSessionIdRef.current
            );
          } catch (error) {
            console.error('Transcription failed:', error);
          } finally {
            setIsTranscribing(false);
          }
        }

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Recording Failed',
        description: 'Failed to access microphone',
        variant: 'destructive',
      });
    }
  }, [isConnected, isRecording, toast]);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, [isRecording]);

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    toast({
      title: 'Chat Cleared',
      description: 'Message history has been cleared',
    });
  }, [toast]);

  /**
   * Format connection time
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
    };
  }, [endSession]);

  return (
    <Card className={`voice-chat h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Voice Chat
            </CardTitle>
            <CardDescription>
              AI-powered voice conversation
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="bg-green-500 text-white">
                Connected - {formatTime(connectionTime)}
              </Badge>
            )}
            
            <div className="flex gap-2">
              {!isConnected ? (
                <Button
                  onClick={startSession}
                  disabled={isConnecting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-1" />
                      Start Chat
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={endSession}
                  size="sm"
                  variant="destructive"
                >
                  <PhoneOff className="w-4 h-4 mr-1" />
                  End Chat
                </Button>
              )}
              
              <Button
                onClick={clearChat}
                size="sm"
                variant="outline"
                disabled={messages.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-500 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.transcription && message.confidence && (
                    <div className="mt-2 text-xs opacity-70">
                      <span>Transcription confidence: {Math.round(message.confidence * 100)}%</span>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs opacity-70">
                    {formatDistanceToNow(message.timestamp)} ago
                  </div>
                  
                  {message.audioUrl && (
                    <div className="mt-2">
                      <audio controls className="w-full h-8">
                        <source src={message.audioUrl} type="audio/webm" />
                      </audio>
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-green-500 text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isTranscribing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Transcribing audio...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Voice Controls */}
        {isConnected && (
          <div className="flex items-center justify-center gap-4 py-2 border-t">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={!isConnected}
              className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Hold to Speak
                </>
              )}
            </Button>

            <Button
              variant={isSpeakerMuted ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isConnected ? "Type a message..." : "Start a session to chat"}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceChat;