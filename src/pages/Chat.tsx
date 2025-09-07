import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  MicOff, 
  MessageCircle, 
  Brain,
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { EnhancedLoading, ChatSkeleton } from '@/components/ui/enhanced-loading';
import { newMeAI, ConversationContext } from '@/services/ai/newme-ai-service';
import { newMeVoice } from '@/services/voice/newme-voice-service';
import { useNavigate } from 'react-router-dom';
import { useViewportHeight, useKeyboardVisible } from '@/hooks/useResponsive';
import { useDebounce, usePerformanceMonitor, globalCache } from '@/utils/performance';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotion?: string;
  insights?: string[];
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible();
  useViewportHeight();

  // Load existing conversation from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`chat_messages_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch {
        // If parsing fails, return default message
      }
    }
    
    return [{
      id: '1',
      content: "Hello beautiful soul! I'm NewMe, your AI companion for personal growth and self-discovery. I'm here to guide you through narrative identity exploration in a safe, culturally sensitive space. What story would you like to explore today?",
      sender: 'ai',
      timestamp: new Date(),
      emotion: 'supportive'
    }];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring
  const startTiming = usePerformanceMonitor('chat-message-send');

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && messages.length > 1) { // Don't save just the initial message
      localStorage.setItem(`chat_messages_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Debounced scroll to bottom for performance
  const scrollToBottom = useDebounce(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle keyboard visibility for mobile
  useEffect(() => {
    if (isKeyboardVisible) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isKeyboardVisible]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    const endTiming = startTiming();
    const cacheKey = `user_profile_${user.id}`;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get user memory profile with caching
      let userProfile = globalCache.get(cacheKey);
      if (!userProfile) {
        userProfile = await newMeAI.getUserMemoryProfile(user.id);
        if (userProfile) {
          globalCache.set(cacheKey, userProfile, 5 * 60 * 1000); // Cache for 5 minutes
        }
      }
      
      if (!userProfile) {
        throw new Error('Unable to load your profile. Please try again.');
      }

      // Create conversation context
      const context: ConversationContext = {
        userId: user.id,
        sessionId: `chat_${Date.now()}`,
        userProfile,
        conversationGoal: 'personal_growth_exploration',
      };

      // Generate AI response using NewMe service
      const aiResult = await newMeAI.generateResponse(content.trim(), context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResult.response,
        sender: 'ai',
        timestamp: new Date(),
        emotion: aiResult.emotionalAnalysis.detectedEmotion,
        insights: aiResult.insights
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // End performance timing
      endTiming();

      // Text-to-speech if enabled
      if (isSoundEnabled && aiResult.response) {
        try {
          const utterance = new SpeechSynthesisUtterance(aiResult.response);
          utterance.voice = speechSynthesis.getVoices().find(voice => 
            voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen')
          ) || speechSynthesis.getVoices()[0];
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 0.7;
          speechSynthesis.speak(utterance);
        } catch (audioError) {
          // Text-to-speech failed silently
        }
      }
    } catch (error) {
      // Log error for debugging in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending message:', error);
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having a moment of reflection, but I'm still here with you. Your thoughts and feelings matter to me. Could you share what's on your heart again?",
        sender: 'ai',
        timestamp: new Date(),
        emotion: 'apologetic'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
    }
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      if (isRecording) {
        await stopVoiceRecording();
      }
      await newMeVoice.endSession();
      setIsVoiceMode(false);
    } else {
      if (!newMeVoice.constructor.isSupported()) {
        setVoiceError('Voice features are not supported in your browser');
        return;
      }

      try {
        const result = await newMeVoice.startVoiceSession({
          userId: user!.id,
          language: 'en',
          enableEmotionDetection: true,
          enableRealtimeProcessing: true,
        });

        if (result.success) {
          setIsVoiceMode(true);
          setVoiceError(null);
        } else {
          setVoiceError(result.error || 'Failed to start voice session');
        }
      } catch (error) {
        setVoiceError('Failed to initialize voice features');
      }
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      await stopVoiceRecording();
    } else {
      await startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      setIsRecording(true);
      setVoiceError(null);
      await newMeVoice.startRecording();
    } catch (error) {
      setVoiceError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      await newMeVoice.stopRecording();
      setIsProcessing(false);
    } catch (error) {
      setVoiceError('Failed to process recording');
      setIsProcessing(false);
    }
  };

  const getMessageIcon = (emotion?: string) => {
    switch (emotion) {
      case 'supportive':
        return <Heart className="w-3 h-3 text-primary flex-shrink-0" />;
      case 'insightful':
        return <Brain className="w-3 h-3 text-secondary flex-shrink-0" />;
      case 'encouraging':
        return <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />;
      case 'empowering':
        return <Zap className="w-3 h-3 text-primary flex-shrink-0" />;
      default:
        return <MessageCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />;
    }
  };

  const clearChat = () => {
    if (user) {
      localStorage.removeItem(`chat_messages_${user.id}`);
      setMessages([{
        id: '1',
        content: "Hello beautiful soul! I'm NewMe, your AI companion for personal growth and self-discovery. I'm here to guide you through narrative identity exploration in a safe, culturally sensitive space. What story would you like to explore today?",
        sender: 'ai',
        timestamp: new Date(),
        emotion: 'supportive'
      }]);
    }
  };

  return (
    <EnhancedErrorBoundary>
      <div className="h-screen-safe flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex-shrink-0 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 safe-area-padding">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-muted/50 touch-target"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-sm">NewMe</h1>
                  <p className="text-xs text-muted-foreground">AI Companion</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 hover:bg-muted/50 touch-target"
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Badge variant={isVoiceMode ? "default" : "secondary"} className="text-xs">
                {isVoiceMode ? "Voice" : "Text"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ScrollArea 
            ref={scrollAreaRef}
            className="flex-1 px-4"
            style={{ 
              paddingBottom: isKeyboardVisible ? `${keyboardHeight}px` : '0px'
            }}
          >
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-background/80 backdrop-blur-sm border border-border/50 rounded-bl-md'
                    }`}
                  >
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        {getMessageIcon(message.emotion)}
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {message.emotion || 'NewMe'}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Insights:</p>
                        {message.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground opacity-70">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-4 h-4 rounded-full bg-primary-foreground/20" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] p-3 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-muted-foreground">NewMe is reflecting...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-background/80 backdrop-blur-lg border-t border-border/50 p-4 safe-area-padding">
            {voiceError && (
              <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive">{voiceError}</p>
              </div>
            )}
            
            {isVoiceMode ? (
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleVoiceInput}
                  className={`w-16 h-16 rounded-full touch-target-large ${
                    isRecording 
                      ? 'bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg shadow-destructive/30' 
                      : 'bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/30'
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <LoadingSpinner size="sm" />
                  ) : isRecording ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  {isProcessing 
                    ? 'Processing your beautiful words...'
                    : isRecording 
                    ? 'Listening to your heart... Tap to stop'
                    : 'Tap to share your thoughts with NewMe'
                  }
                </p>
                <Button
                  variant="outline"
                  onClick={toggleVoiceMode}
                  size="sm"
                  className="touch-target-large"
                >
                  Switch to Text
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Share what's in your heart..."
                    className="min-h-[44px] text-base resize-none border-border/50 bg-background/50 focus:bg-background"
                    disabled={isLoading}
                    maxLength={1000}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleVoiceMode}
                  className="p-3 touch-target"
                  disabled={isLoading}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-primary hover:bg-primary/90 touch-target"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      </EnhancedErrorBoundary>
  );
};

export default Chat;