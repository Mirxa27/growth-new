import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Mic, MicOff, Sparkles, Heart, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  emotional_tone?: any;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id,
          title: 'New Conversation',
          ai_provider: 'openai'
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);

      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm NewMe, your personal AI companion for growth and self-discovery. I'm here to listen, understand, and guide you on your journey. What's on your mind today?`,
        role: 'assistant',
        created_at: new Date().toISOString(),
        emotional_tone: { warmth: 0.9, empathy: 0.8 }
      };
      setMessages([welcomeMessage]);
    } catch (error: any) {
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Save user message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user?.id,
          content: userMessage.content,
          role: 'user'
        });

      // Simulate AI response (In production, this would call your AI service)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const responses = [
        "I hear you, and I want you to know that what you're feeling is completely valid. Sometimes our inner world can feel overwhelming, but remember that growth often comes from these challenging moments. What aspect of this situation feels most important to explore right now?",
        "That's a beautiful insight you've shared. I can sense the depth of your reflection in what you've told me. These moments of self-awareness are precious - they're the foundation of personal transformation. How does acknowledging this make you feel?",
        "Thank you for trusting me with your thoughts. I can feel the courage it takes to be this honest with yourself. Your willingness to explore these feelings shows incredible strength. What would it mean for you to fully embrace this part of yourself?",
        "I'm moved by your openness. The fact that you're questioning, exploring, and seeking deeper understanding shows how committed you are to your growth. Sometimes the most profound changes begin with exactly these kinds of conversations. What feels like the next step for you?",
        "Your words resonate with such authenticity. I can sense both vulnerability and strength in what you've shared. This balance - being open to growth while honoring where you are right now - is truly beautiful. How can we build on this awareness together?"
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        role: 'assistant',
        created_at: new Date().toISOString(),
        emotional_tone: { warmth: 0.8, empathy: 0.9, wisdom: 0.7 }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user?.id,
          content: aiMessage.content,
          role: 'assistant',
          emotional_tone: aiMessage.emotional_tone
        });

    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice functionality would be implemented here
    toast({
      title: isListening ? "Voice recording stopped" : "Voice recording started",
      description: isListening ? "Processing your message..." : "Speak now, I'm listening..."
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="glass border-b border-glass px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">NewMe</h1>
            <p className="text-sm text-muted-foreground">Your AI Companion</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Empathetic
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Wise
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm">
                    N
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-primary text-white ml-auto'
                    : 'glass border-glass'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.emotional_tone && (
                  <div className="flex gap-1 mt-2">
                    {Object.entries(message.emotional_tone).map(([emotion, level]) => (
                      <Badge key={emotion} variant="secondary" className="text-xs opacity-60">
                        {emotion}: {Math.round((level as number) * 100)}%
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-secondary text-white text-sm">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-gradient-primary text-white text-sm">
                  N
                </AvatarFallback>
              </Avatar>
              <div className="glass border-glass rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">NewMe is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="glass border-t border-glass px-4 py-4 pb-8 md:pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="min-h-[60px] max-h-32 resize-none glass-input"
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={toggleVoice}
                variant="outline"
                size="icon"
                className={`glass-button ${isListening ? 'bg-red-500/20 text-red-400' : ''}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-gradient-primary hover:opacity-90"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;