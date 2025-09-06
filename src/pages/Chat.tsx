import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Zap
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer } from '@/components/responsive/MobileOptimized';
import { newMeAI, ConversationContext } from '@/services/ai/newme-ai-service';
import { newMeVoice } from '@/services/voice/newme-voice-service';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello beautiful soul! I'm NewMe, your AI companion for personal growth and self-discovery. I'm here to guide you through narrative identity exploration in a safe, culturally sensitive space. What story would you like to explore today?",
      sender: 'ai',
      timestamp: new Date(),
      emotion: 'supportive'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [dailyHeadline, setDailyHeadline] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate dynamic daily headline
  useEffect(() => {
    const headlines = [
      "What story will you rewrite today? 💫",
      "Your authentic self is waiting to be discovered ✨",
      "Every conversation with me is a step toward your true potential 🌟",
      "Ready to explore the narratives that shape your life? 🎭",
      "Today is perfect for uncovering your hidden strengths 💎",
      "What patterns are you ready to transform? 🦋",
      "Your journey of self-discovery continues here 🌸",
      "Let's explore the stories that define who you're becoming 📖"
    ];
    setDailyHeadline(headlines[Math.floor(Math.random() * headlines.length)]);
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

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
      // Get user memory profile
      const userProfile = await newMeAI.getUserMemoryProfile(user.id);
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
          console.warn('Text-to-speech failed:', audioError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
    sendMessage(inputMessage);
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
          language: 'en', // Could be from user profile
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
        return <Heart className="w-4 h-4 text-primary" />;
      case 'insightful':
        return <Brain className="w-4 h-4 text-secondary" />;
      case 'encouraging':
        return <Sparkles className="w-4 h-4 text-accent" />;
      case 'empowering':
        return <Zap className="w-4 h-4 text-primary" />;
      default:
        return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <MobileContainer className="h-screen flex flex-col">
          {/* Header */}
          <Card className="glass-strong mb-4 flex-shrink-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">NewMe AI Companion</CardTitle>
                    <p className="text-sm text-muted-foreground">{dailyHeadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className="glass-button"
                  >
                    {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  <Badge variant={isVoiceMode ? "default" : "secondary"}>
                    {isVoiceMode ? "Voice Mode" : "Text Mode"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <Card className="glass-strong flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl glass-subtle ${
                          message.sender === 'user'
                            ? 'bg-primary/20 text-primary-foreground'
                            : 'bg-secondary/10 text-secondary-foreground'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {message.sender === 'ai' && getMessageIcon(message.emotion)}
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.insights && message.insights.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Insights:</p>
                                {message.insights.map((insight, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Sparkles className="w-3 h-3" />
                                    <span>{insight}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-4 rounded-2xl glass-subtle bg-secondary/10">
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-sm text-muted-foreground">NewMe is reflecting on your words...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                {voiceError && (
                  <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs text-destructive">{voiceError}</p>
                  </div>
                )}
                
                {isVoiceMode ? (
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      onClick={handleVoiceInput}
                      className={`w-20 h-20 rounded-full ${
                        isRecording 
                          ? 'bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg shadow-destructive/30' 
                          : 'bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/30'
                      }`}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <LoadingSpinner size="sm" />
                      ) : isRecording ? (
                        <MicOff className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {isProcessing 
                        ? 'Processing your beautiful words...'
                        : isRecording 
                        ? 'I\'m listening to your heart... Tap to stop'
                        : 'Tap to share your thoughts with NewMe'
                      }
                    </p>
                    <Button
                      variant="outline"
                      onClick={toggleVoiceMode}
                      className="glass-button"
                    >
                      Switch to Text
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Share what's in your heart..."
                      className="flex-1 glass-input"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="glass-button px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleVoiceMode}
                      className="glass-button px-4"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};

export default Chat;