
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, MessageSquare, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ExplorationSessionProps {
  explorationId: string;
  onComplete: (analysis: any) => void;
  onCancel: () => void;
}

interface Exploration {
  id: string;
  title: string;
  questions: string[];
  facilitator_prompt: string;
  higher_self_prompt: string;
}

interface SessionState {
  id: string;
  current_question: number;
  user_answers: string[];
  status: 'in-progress' | 'completed';
}

export const ExplorationSession = ({ explorationId, onComplete, onCancel }: ExplorationSessionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exploration, setExploration] = useState<Exploration | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    initializeSession();
  }, [explorationId, user]);

  const initializeSession = async () => {
    if (!user) return;

    try {
      // Fetch exploration details
      const { data: explorationData, error: explorationError } = await supabase
        .from('explorations')
        .select('*')
        .eq('id', explorationId)
        .single();

      if (explorationError) throw explorationError;
      setExploration(explorationData);

      // Start new session
      const { data: sessionId, error: sessionError } = await supabase.rpc('start_exploration_session', {
        exploration_id_input: explorationId,
        user_id_input: user.id
      });

      if (sessionError) throw sessionError;

      setSession({
        id: sessionId,
        current_question: 0,
        user_answers: [],
        status: 'in-progress'
      });
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start exploration session.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // This would typically use a speech-to-text service
    // For now, we'll prompt the user to type their response
    toast({
      title: 'Voice Recording Complete',
      description: 'Please type your response in the text area below.',
    });
  };

  const handleAnswerSubmit = async () => {
    if (!session || !exploration || !currentAnswer.trim()) return;

    try {
      // Update session progress
      await supabase.rpc('update_exploration_progress', {
        session_id_input: session.id,
        question_index_input: session.current_question,
        answer_input: currentAnswer.trim()
      });

      const newAnswers = [...session.user_answers, currentAnswer.trim()];
      const nextQuestion = session.current_question + 1;

      setSession(prev => prev ? {
        ...prev,
        current_question: nextQuestion,
        user_answers: newAnswers
      } : null);

      setCurrentAnswer('');

      // Check if all questions are answered
      if (nextQuestion >= exploration.questions.length) {
        await generateAnalysis(newAnswers);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your response.',
        variant: 'destructive'
      });
    }
  };

  const generateAnalysis = async (allAnswers: string[]) => {
    if (!session || !exploration) return;

    setIsAnalyzing(true);
    try {
      // Create analysis prompt
      const analysisPrompt = `${exploration.higher_self_prompt}

USER'S RESPONSES:
${allAnswers.map((answer, index) => `${index + 1}. ${exploration.questions[index]}\nAnswer: ${answer}`).join('\n\n')}

Please provide a structured analysis with the following sections:
- Core Pattern: The main theme or pattern in their responses
- Hidden Potential: Untapped strengths or opportunities they revealed
- Actionable Steps: 3-5 specific, concrete steps they can take
- Affirmations: Positive statements based on their responses
- Encouragement: Supportive closing message

Format as JSON with these exact keys: core_pattern, hidden_potential, actionable_steps, affirmations, encouragement`;

      // This would typically call an AI service
      // For demo purposes, creating a structured response
      const mockAnalysis = {
        core_pattern: "Your responses reveal a deep desire for authentic connection and meaningful growth, with a tendency to prioritize others' needs while sometimes neglecting your own.",
        hidden_potential: "You possess remarkable emotional intelligence and intuitive wisdom that others naturally gravitate toward. Your ability to see multiple perspectives is a rare gift.",
        actionable_steps: [
          "Set aside 15 minutes daily for self-reflection and journaling",
          "Practice saying 'no' to one request this week to honor your boundaries",
          "Identify one relationship where you can express your needs more openly",
          "Create a daily ritual that nurtures your emotional well-being"
        ],
        affirmations: [
          "I am worthy of love and respect exactly as I am",
          "My needs and feelings are valid and important", 
          "I trust my inner wisdom to guide me toward growth",
          "I deserve relationships built on mutual care and understanding"
        ],
        encouragement: "Your journey of self-discovery is already yielding beautiful insights. Trust the process and be gentle with yourself as you continue to grow. You have everything within you to create the life and relationships you truly desire."
      };

      // Complete the session
      await supabase.rpc('complete_exploration_session', {
        session_id_input: session.id,
        final_analysis_input: mockAnalysis
      });

      toast({
        title: 'Exploration Complete!',
        description: 'You\'ve earned crystals and gained valuable insights about yourself.'
      });

      onComplete(mockAnalysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate your analysis.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exploration || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto glass-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Unable to load exploration session.</p>
            <Button onClick={onCancel} variant="outline" className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((session.current_question + 1) / exploration.questions.length) * 100;
  const currentQuestion = exploration.questions[session.current_question];
  const isLastQuestion = session.current_question >= exploration.questions.length;

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto glass-card">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Analyzing Your Responses</h2>
            <p className="text-muted-foreground mb-6">
              Your Higher Self is reviewing your answers and preparing personalized insights...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold gradient-text mb-2">{exploration.title}</h1>
          <p className="text-muted-foreground">Take your time and be honest with yourself</p>
        </div>

        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">Question {session.current_question + 1} of {exploration.questions.length}</CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardDescription className="text-lg font-medium text-foreground">
              {currentQuestion}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={isVoiceMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className="glass-button"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Voice
                </Button>
                <Button
                  variant={!isVoiceMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className="glass-button"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Type
                </Button>
              </div>
            </div>

            {isVoiceMode ? (
              <div className="text-center">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="rounded-full h-16 w-16 p-0"
                >
                  {isRecording ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Share your thoughts here..."
                className="min-h-[120px] glass-input"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            className="glass-button"
          >
            Exit Session
          </Button>

          <Button
            onClick={handleAnswerSubmit}
            disabled={!currentAnswer.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isLastQuestion ? (
              <>
                Complete Exploration
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
