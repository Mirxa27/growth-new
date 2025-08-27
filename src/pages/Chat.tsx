import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  MessageCircle,
  Zap,
  Phone
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { RealtimeVoiceInterface } from '@/components/chat/RealtimeVoiceInterface';

// Type definitions
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audio_url?: string;
}

interface Exploration {
  title: string;
  questions: string[];
  facilitator_prompt: string;
  higher_self_prompt: string;
}

interface ExplorationSession {
  id: string;
  exploration_id: string;
  current_question: number;
  user_answers: string[];
  status: 'in-progress' | 'completed';
  exploration?: Exploration;
}

// Constants for headlines
const HEADLINES = [
  "Ready to explore the depths of your potential?",
  "What whispers does your inner wisdom have today?",
  "Let's unlock the mysteries within your heart.",
  "Your journey of self-discovery continues here.",
  "What would your highest self want to tell you?",
  "Ready to dive deep into your authentic truth?",
  "Let's explore the beautiful complexity of you.",
  "What patterns are ready to be transformed today?"
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [explorationSession, setExplorationSession] = useState<ExplorationSession | null>(null);
  const [headline, setHeadline] = useState('');
  const [activeTab, setActiveTab] = useState('voice');

  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
    initializeConversation();

    const sessionId = searchParams.get('session');
    if (sessionId) {
      loadExplorationSession(sessionId);
    }
  }, [searchParams, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const initializeConversation = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_conversations')
        .insert({})
        .select()
        .single();

      if (error) throw error;
      
      // Add user as participant
      await supabase
        .from('user_conversation_participants')
        .insert({
          conversation_id: data.id,
          user_id: user.id
        });
      
      setConversationId(data.id);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
    }
  };

  const loadExplorationSession = async (sessionId: string) => {
    try {
      const { data: session, error } = await supabase
        .from('exploration_sessions')
        .select(`*, explorations:exploration_id (*)`)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const exploration = session.explorations;
      const sessionData: ExplorationSession = {
        id: session.id,
        exploration_id: session.exploration_id,
        current_question: session.current_question,
        status: session.status as 'in-progress' | 'completed',
        user_answers: Array.isArray(session.user_answers) ? (session.user_answers as string[]).filter(Boolean) : [],
        exploration: exploration ? {
          title: exploration.title,
          questions: Array.isArray(exploration.questions) ? (exploration.questions as string[]).filter(Boolean) : [],
          facilitator_prompt: exploration.facilitator_prompt,
          higher_self_prompt: exploration.higher_self_prompt,
        } : undefined,
      };

      setExplorationSession(sessionData);

      const welcomeMessage: Message = {
        id: 'welcome-exploration',
        role: 'assistant',
        content: `Welcome to "${sessionData.exploration?.title}". I'm here to guide you through this transformative journey. Let's begin with our first question:\n\n${sessionData.exploration?.questions[sessionData.current_question] || 'Loading question...'}`,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
    } catch (error: any) {
      toast({
        title: "Error loading exploration",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check your browser permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioMessage = async (audioBlob: Blob) => {
    // For production implementation, integrate with a speech-to-text service
    // like OpenAI Whisper, Google Speech-to-Text, or similar
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '[Voice message - processing with speech recognition...]',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // TODO: Implement real speech-to-text
    // For now, simulate processing
    setTimeout(() => {
      const transcribedText = "This is a simulated transcription. In production, this would be the actual speech-to-text result.";
      
      const updatedMessage: Message = {
        ...userMessage,
        content: transcribedText
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? updatedMessage : msg
      ));
      
      sendMessageToAI(transcribedText);
    }, 2000);
  };

  const sendTextMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    await sendMessageToAI(userMessage.content);
  };

  const sendMessageToAI = async (userContent: string) => {
    setLoading(true);
    try {
      if (conversationId && user) {
        await supabase.from('user_messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: userContent
        });
      }

      if (explorationSession?.status === 'in-progress') {
        await handleExplorationResponse(userContent);
      } else {
        await handleRegularConversation(userContent);
      }
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

  const handleExplorationResponse = async (userContent: string) => {
    if (!explorationSession?.exploration) return;

    const currentAnswers = [...explorationSession.user_answers, userContent];
    const nextQuestionIndex = explorationSession.current_question + 1;

    await supabase
      .from('exploration_sessions')
      .update({ user_answers: currentAnswers, current_question: nextQuestionIndex })
      .eq('id', explorationSession.id);

    if (nextQuestionIndex < explorationSession.exploration.questions.length) {
      const nextQuestion = explorationSession.exploration.questions[nextQuestionIndex];
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Thank you for sharing. ${nextQuestion}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setExplorationSession(prev => prev ? { ...prev, current_question: nextQuestionIndex, user_answers: currentAnswers } : null);
    } else {
      await generateExplorationAnalysis(currentAnswers);
    }
  };

  const generateExplorationAnalysis = async (answers: string[]) => {
    if (!explorationSession?.exploration) return;

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-chat-completion', {
        body: {
          message: 'Generate analysis',
          conversationId,
          context: {
            isExploration: true,
            phase: 'analysis',
            higherSelfPrompt: explorationSession.exploration.higher_self_prompt,
            userAnswers: answers
          }
        }
      });

      if (error) throw error;

      const analysis = {
        aiGenerated: true,
        content: data.response,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('exploration_sessions')
        .update({ status: 'completed', final_analysis: analysis, completed_at: new Date().toISOString() })
        .eq('id', explorationSession.id);

      if (user) {
        await supabase.rpc('award_crystals', { user_id_input: user.id, crystal_amount: 100 });
      }

      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🌟 **Exploration Complete!** 🌟\n\n${data.response}\n\nYou've earned 100 crystals for completing this profound journey! 💎`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, analysisMessage]);
      setExplorationSession(prev => prev ? { ...prev, status: 'completed' } : null);

      toast({
        title: "Exploration Complete! 🎉",
        description: "You've earned 100 crystals for your insights!",
      });
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      // Fallback to static analysis
      const analysis = {
        corePattern: "Based on your responses, I see a pattern of seeking authentic connection while navigating boundaries.",
        hiddenPotential: "Your responses reveal an untapped capacity for intuitive leadership and creative problem-solving.",
        actionableSteps: [
          "Practice daily mindfulness to strengthen your inner voice",
          "Set aside time weekly for creative expression",
          "Engage in one meaningful conversation each day"
        ],
        affirmations: [
          "I trust my inner wisdom to guide me",
          "I am worthy of the love and success I desire",
          "My authentic self is my greatest strength"
        ],
        encouragement: "You've shown incredible courage in this exploration. Trust the insights that have emerged and take them forward with confidence."
      };

      await supabase
        .from('exploration_sessions')
        .update({ status: 'completed', final_analysis: analysis, completed_at: new Date().toISOString() })
        .eq('id', explorationSession.id);

      if (user) {
        await supabase.rpc('award_crystals', { user_id_input: user.id, crystal_amount: 100 });
      }

      const analysisMessageContent = `🌟 **Exploration Complete!** 🌟

**Core Pattern Discovered:**
${analysis.corePattern}

**Hidden Potential:**
${analysis.hiddenPotential}

**Your Action Steps:**
${analysis.actionableSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Daily Affirmations:**
${analysis.affirmations.map(affirmation => `• ${affirmation}`).join('\n')}

**Encouragement:**
${analysis.encouragement}

You've earned 100 crystals for completing this profound journey! 💎`;

      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: analysisMessageContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, analysisMessage]);
      setExplorationSession(prev => prev ? { ...prev, status: 'completed' } : null);

      toast({
        title: "Exploration Complete! 🎉",
        description: "You've earned 100 crystals for your insights!",
      });
    }
  };

  const handleRegularConversation = async (userContent: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-chat-completion', {
        body: {
          message: userContent,
          conversationId,
          context: {
            isExploration: false
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI conversation error:', error);
      // Fallback to canned responses if AI fails
      const responses = [
        "That's a profound reflection. What feelings come up for you when you think about that more deeply?",
        "I can sense the wisdom in your words. How does this connect to your journey of growth?",
        "Thank you for sharing that with me. What would it look like if you trusted this insight completely?"
      ];
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const toggleSpeaking = () => setIsSpeaking(prev => !prev);

  const handleVoiceMessage = useCallback((message: any) => {
    // Handle voice messages from the realtime interface
    if (message.type === 'conversation.item.input_audio_transcription.completed') {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message.transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              NewMe AI Companion
            </h1>
          </div>
          <p className="text-muted-foreground italic">{headline}</p>
        </header>

        {/* Main Interface Tabs */}
        <Card className="glass-card border-glass">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              {explorationSession ? `Exploration: ${explorationSession.exploration?.title || 'Loading...'}` : 'NewMe Conversation'}
              {explorationSession?.status === 'in-progress' && (
                <div className="flex items-center gap-1 text-sm text-accent">
                  <Zap className="w-4 h-4" />
                  Question {explorationSession.current_question + 1}/{explorationSession.exploration?.questions.length || 0}
                </div>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mx-6 mb-4">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Voice Chat
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Text Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="px-6 pb-6">
                <div className="min-h-[60vh] flex items-center justify-center">
                  <RealtimeVoiceInterface 
                    onMessage={handleVoiceMessage}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="h-[60vh] flex flex-col">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={message.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'}>
                              {message.role === 'user' ? 'You' : 'AI'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`p-3 rounded-2xl ${message.role === 'user' ? 'bg-primary text-white ml-auto' : 'glass border-glass'}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary text-white">AI</AvatarFallback>
                          </Avatar>
                          <div className="glass border-glass p-3 rounded-2xl">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="p-6 border-t border-glass">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Share what's on your mind..."
                        onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                        disabled={loading}
                        className="glass border-glass"
                      />
                      <Button onClick={sendTextMessage} disabled={!inputMessage.trim() || loading} size="icon" className="bg-gradient-primary">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "outline"} size="icon" className={isRecording ? "" : "glass"}>
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button onClick={toggleSpeaking} variant="outline" size="icon" className="glass">
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;