import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User,
  Heart,
  Brain,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'voice';
}

const Chat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: `Hello! I'm NewMe, your AI companion. I'm here to support your personal growth journey. How are you feeling today?`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async (content: string, type: 'text' | 'voice' = 'text') => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. You are warm, empathetic, and insightful. Always respond in a supportive, non-judgmental way. Keep responses concise but meaningful, around 2-3 sentences. Focus on emotional support and gentle guidance.`
            },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content || "I'm here to support you. Could you tell me more about what's on your mind?";

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response for when API is not configured
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm here to support you on your journey. What would you like to explore together today?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
      if (error instanceof Error && error.message.includes('API key')) {
        toast({
          title: "AI Features Limited",
          description: "OpenAI API key not configured. Using fallback responses.",
          variant: "default"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        title: "Voice recording stopped",
        description: "Processing your message...",
      });
      // For now, simulate voice processing with text
      setTimeout(() => {
        sendMessage("Voice message processed", 'voice');
      }, 1000);
    } else {
      setIsRecording(true);
      toast({
        title: "Voice recording started",
        description: "Speak your message now...",
      });
    }
  };

  const quickReplies = [
    "I'm feeling anxious today",
    "I want to work on self-confidence",
    "Tell me about mindfulness",
    "I need motivation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="glass border-card-border mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  NewMe AI Companion
                  <Badge className="bg-green-500/10 text-green-500">Online</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your personal growth companion
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Interface */}
        <Card className="glass border-card-border">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="p-4 border-b border-border">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Text Chat
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="text" className="m-0">
                {/* Messages Area */}
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={
                            message.sender === 'user' 
                              ? 'bg-primary text-white' 
                              : 'bg-secondary text-white'
                          }>
                            {message.sender === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`max-w-[80%] ${
                          message.sender === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-primary text-white'
                              : 'glass border-card-border'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            {message.type === 'voice' && (
                              <div className="flex items-center gap-1 mt-1 opacity-70">
                                <Mic className="w-3 h-3" />
                                <span className="text-xs">Voice message</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="glass border-card-border p-3 rounded-2xl">
                          <LoadingSpinner size="sm" />
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick Replies */}
                <div className="p-4 border-t border-border">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="glass text-xs"
                        onClick={() => sendMessage(reply)}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                      className="glass"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage(inputMessage)}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-primary"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="m-0">
                <div className="h-[500px] flex flex-col items-center justify-center p-8">
                  <div className="text-center space-y-6">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? 'bg-red-500/20 border-4 border-red-500 animate-pulse' 
                        : 'bg-primary/20 border-4 border-primary'
                    }`}>
                      {isRecording ? (
                        <MicOff className="w-16 h-16 text-red-500" />
                      ) : (
                        <Mic className="w-16 h-16 text-primary" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {isRecording ? 'Recording...' : 'Voice Chat'}
                      </h3>
                      <p className="text-muted-foreground">
                        {isRecording 
                          ? 'Speak now, tap to stop recording'
                          : 'Tap the microphone to start voice chat'
                        }
                      </p>
                    </div>

                    <Button
                      onClick={handleVoiceToggle}
                      size="lg"
                      className={isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-primary'}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Capabilities */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card className="glass border-card-border p-4 text-center">
            <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Emotional Support</h4>
            <p className="text-xs text-muted-foreground">Empathetic conversations</p>
          </Card>
          
          <Card className="glass border-card-border p-4 text-center">
            <Brain className="w-8 h-8 text-secondary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Personal Insights</h4>
            <p className="text-xs text-muted-foreground">Self-discovery guidance</p>
          </Card>
          
          <Card className="glass border-card-border p-4 text-center">
            <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Growth Coaching</h4>
            <p className="text-xs text-muted-foreground">Personalized development</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;