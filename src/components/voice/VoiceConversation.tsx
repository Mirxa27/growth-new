import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Settings,
  Phone,
  PhoneOff,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';
import { OpenAIRealtimeService, ConversationItem } from '@/services/voice/openai-realtime.service';
import { logger } from '@/utils/logger';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface VoiceConversationProps {
  onConversationEnd?: (items: ConversationItem[]) => void;
  initialInstructions?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export const VoiceConversation: React.FC<VoiceConversationProps> = ({
  onConversationEnd,
  initialInstructions,
  voice = 'alloy'
}) => {
  const { toast } = useToast();
  const { isAdmin, verified } = useAdminAuth();
  const [realtimeService, setRealtimeService] = useState<OpenAIRealtimeService | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [textMessage, setTextMessage] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const conversationRef = useRef<HTMLDivElement>(null);

  // Initialize the realtime service
  const initializeService = useCallback(async () => {
    if (!verified) {
      toast({
        title: 'Access Denied',
        description: 'Admin verification required for voice features.',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      const service = new OpenAIRealtimeService({
        voice,
        instructions: initialInstructions,
        modalities: ['text', 'audio'],
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        temperature: 0.8
      });

      // Set up event listeners
      service.on('session_created', () => {
        logger.info('Voice session created');
        setIsConnected(true);
        setConnectionStatus('connected');
        toast({
          title: 'Connected',
          description: 'Voice conversation is ready!',
        });
      });

      service.on('transcription_completed', (data: { item_id: string; transcript: string }) => {
        setCurrentTranscript(data.transcript);
        logger.info('Transcription completed', { transcript: data.transcript });
      });

      service.on('text_delta', (data: { delta: string }) => {
        setCurrentResponse(prev => prev + data.delta);
      });

      service.on('text_complete', (data: { text: string }) => {
        setCurrentResponse('');
        logger.info('AI response complete', { text: data.text });
      });

      service.on('item_created', (item: ConversationItem) => {
        setConversationItems(prev => [...prev, item]);
      });

      service.on('response_item_added', (item: ConversationItem) => {
        setConversationItems(prev => [...prev, item]);
      });

      service.on('conversation_started', () => {
        setIsRecording(true);
        logger.info('Voice recording started');
      });

      service.on('conversation_stopped', () => {
        setIsRecording(false);
        logger.info('Voice recording stopped');
      });

      service.on('error', (error: any) => {
        logger.error('Realtime service error', 'VoiceConversation', error);
        setConnectionStatus('error');
        toast({
          title: 'Voice Error',
          description: error.message || 'An error occurred during voice conversation',
          variant: 'destructive'
        });
      });

      service.on('disconnected', (data: { code: number; reason: string }) => {
        setIsConnected(false);
        setIsRecording(false);
        setConnectionStatus('disconnected');
        logger.info('Voice session disconnected', data);
      });

      await service.initialize();
      setRealtimeService(service);

    } catch (error) {
      logger.error('Failed to initialize voice service', 'VoiceConversation', error);
      setConnectionStatus('error');
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to voice service. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  }, [verified, voice, initialInstructions, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeService) {
        realtimeService.disconnect();
      }
    };
  }, [realtimeService]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationItems, currentResponse]);

  const handleConnect = () => {
    if (!isConnected && !isConnecting) {
      initializeService();
    }
  };

  const handleDisconnect = () => {
    if (realtimeService) {
      realtimeService.disconnect();
      setRealtimeService(null);
      setConversationItems([]);
      setCurrentTranscript('');
      setCurrentResponse('');
      
      if (onConversationEnd) {
        onConversationEnd(conversationItems);
      }
    }
  };

  const handleStartRecording = async () => {
    if (realtimeService && isConnected) {
      try {
        await realtimeService.startConversation();
      } catch (error) {
        logger.error('Failed to start recording', 'VoiceConversation', error);
        toast({
          title: 'Recording Error',
          description: 'Failed to start voice recording',
          variant: 'destructive'
        });
      }
    }
  };

  const handleStopRecording = () => {
    if (realtimeService) {
      realtimeService.stopConversation();
    }
  };

  const handleSendTextMessage = () => {
    if (realtimeService && textMessage.trim()) {
      realtimeService.sendMessage(textMessage.trim());
      setTextMessage('');
      setShowTextInput(false);
    }
  };

  const handleClearConversation = () => {
    if (realtimeService) {
      realtimeService.clearConversation();
      setConversationItems([]);
      setCurrentTranscript('');
      setCurrentResponse('');
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      disconnected: { color: 'text-gray-500', icon: PhoneOff, text: 'Disconnected' },
      connecting: { color: 'text-yellow-500', icon: Loader2, text: 'Connecting...', animate: true },
      connected: { color: 'text-green-500', icon: CheckCircle, text: 'Connected' },
      error: { color: 'text-red-500', icon: AlertCircle, text: 'Connection Error' }
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <div className={`flex items-center space-x-2 ${config.color}`}>
        <Icon className={`h-4 w-4 ${config.animate ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  const renderConversationItem = (item: ConversationItem, index: number) => {
    const isUser = item.role === 'user';
    const content = item.content?.[0];
    
    return (
      <div key={item.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {content?.type === 'text' && (
            <p className="text-sm">{content.text}</p>
          )}
          {content?.type === 'input_text' && (
            <p className="text-sm">{content.text}</p>
          )}
          {content?.type === 'audio' && content.transcript && (
            <div>
              <p className="text-sm">{content.transcript}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                <Volume2 className="h-3 w-3 mr-1" />
                Audio
              </Badge>
            </div>
          )}
          {content?.type === 'input_audio' && content.transcript && (
            <div>
              <p className="text-sm">{content.transcript}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                <Mic className="h-3 w-3 mr-1" />
                Voice
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            Admin privileges required for voice conversation features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Voice Conversation
              </CardTitle>
              <CardDescription>
                Real-time voice chat with AI using OpenAI's Realtime API
              </CardDescription>
            </div>
            {renderConnectionStatus()}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="flex items-center"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <>
                <Button onClick={handleDisconnect} variant="destructive">
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
                
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant={isRecording ? "destructive" : "default"}
                  disabled={!isConnected}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowTextInput(!showTextInput)}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text Message
                </Button>

                <Button
                  onClick={handleClearConversation}
                  variant="outline"
                >
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Text Input */}
          {showTextInput && isConnected && (
            <div className="mt-4 space-y-2">
              <Textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSendTextMessage} disabled={!textMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
                <Button onClick={() => setShowTextInput(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Activity */}
      {(currentTranscript || currentResponse || isRecording) && (
        <Card className="glass">
          <CardContent className="p-4">
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-600 mb-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
            
            {currentTranscript && (
              <div className="mb-2">
                <Badge variant="outline" className="mb-2">Your speech</Badge>
                <p className="text-sm text-muted-foreground italic">"{currentTranscript}"</p>
              </div>
            )}
            
            {currentResponse && (
              <div>
                <Badge variant="outline" className="mb-2">AI responding</Badge>
                <p className="text-sm">{currentResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={conversationRef}
            className="h-96 overflow-y-auto space-y-2 p-4 bg-muted/20 rounded-lg"
          >
            {conversationItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation by connecting and speaking or typing a message</p>
              </div>
            ) : (
              conversationItems.map(renderConversationItem)
            )}
            
            {/* Show current response in conversation */}
            {currentResponse && (
              <div className="flex justify-start mb-4">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                  <p className="text-sm">{currentResponse}</p>
                  <div className="flex items-center mt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    <span className="text-xs">AI is speaking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Voice: {voice}</Badge>
              <Badge variant="outline">Model: GPT-4o Realtime</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceConversation;