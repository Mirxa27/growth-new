
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { VoiceInterface } from './VoiceInterface';
import { AnalysisResults } from './AnalysisResults';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Exploration {
  id: string;
  title: string;
  description: string;
  questions: string[];
  facilitator_prompt: string;
  higher_self_prompt: string;
}

interface ExplorationSession {
  id: string;
  user_id: string;
  exploration_id: string;
  status: 'in-progress' | 'completed';
  current_question: number;
  user_answers: string[];
  final_analysis?: any;
}

export const ExplorationSession = () => {
  const { explorationId } = useParams<{ explorationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exploration, setExploration] = useState<Exploration | null>(null);
  const [session, setSession] = useState<ExplorationSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (explorationId) {
      initializeSession();
    }
  }, [explorationId]);

  const initializeSession = async () => {
    try {
      setIsProcessing(true);
      
      // Fetch exploration details
      const { data: explorationData, error: explorationError } = await supabase
        .from('explorations')
        .select('*')
        .eq('id', explorationId)
        .single();

      if (explorationError) throw explorationError;
      
      // Transform the data to match our interface, properly casting JSON fields
      const transformedExploration: Exploration = {
        id: explorationData.id,
        title: explorationData.title,
        description: explorationData.description,
        questions: Array.isArray(explorationData.questions) ? explorationData.questions as string[] : [],
        facilitator_prompt: explorationData.facilitator_prompt,
        higher_self_prompt: explorationData.higher_self_prompt
      };
      
      setExploration(transformedExploration);

      // Start new session
      const { data: sessionId, error: sessionError } = await supabase.rpc('start_exploration_session', {
        exploration_id_input: explorationId,
        user_id_input: (await supabase.auth.getUser()).data.user?.id
      });

      if (sessionError) throw sessionError;

      // Create session object
      const newSession: ExplorationSession = {
        id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        exploration_id: explorationId,
        status: 'in-progress',
        current_question: 0,
        user_answers: []
      };

      setSession(newSession);
      setCurrentQuestion(0);
      setAnswers([]);

      // Speak the first question
      if (transformedExploration.questions.length > 0) {
        speakQuestion(transformedExploration.questions[0]);
      }

    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to start exploration session",
        variant: "destructive"
      });
      navigate('/explorations');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakQuestion = async (question: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleSpeechResult = async (transcript: string) => {
    if (!exploration || !session) return;

    setCurrentTranscript(transcript);
    setIsProcessing(true);

    try {
      // Update the session with the new answer
      await supabase.rpc('update_exploration_progress', {
        session_id_input: session.id,
        question_index_input: currentQuestion,
        answer_input: transcript
      });

      const newAnswers = [...answers, transcript];
      setAnswers(newAnswers);

      // Check if we've completed all questions
      if (currentQuestion + 1 >= exploration.questions.length) {
        // Time for analysis phase
        await performAnalysis(newAnswers);
      } else {
        // Move to next question
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setCurrentTranscript('');
        
        // Speak the next question
        setTimeout(() => {
          speakQuestion(exploration.questions[nextQuestion]);
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing answer:', error);
      toast({
        title: "Error",
        description: "Failed to process your answer",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const performAnalysis = async (allAnswers: string[]) => {
    if (!exploration || !session) return;

    try {
      setIsProcessing(true);
      
      // Call our edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: exploration.higher_self_prompt
            },
            {
              role: 'user',
              content: `Here are my answers to the exploration questions:\n\n${allAnswers.map((answer, i) => `Question ${i + 1}: ${exploration.questions[i]}\nAnswer: ${answer}`).join('\n\n')}\n\nPlease provide your analysis as my Higher Self.`
            }
          ]
        }
      });

      if (error) throw error;

      const analysis = data.choices[0].message.content;
      
      // Complete the session
      await supabase.rpc('complete_exploration_session', {
        session_id_input: session.id,
        final_analysis_input: { analysis }
      });

      setAnalysisResult({ analysis });
      setIsAnalysisComplete(true);

      toast({
        title: "Exploration Complete!",
        description: "You've earned crystals for completing this journey",
      });

    } catch (error) {
      console.error('Error performing analysis:', error);
      toast({
        title: "Error",
        description: "Failed to generate analysis",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartListening = () => {
    setIsListening(true);
    setCurrentTranscript('');
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  const progress = exploration ? ((currentQuestion + 1) / exploration.questions.length) * 100 : 0;

  if (isAnalysisComplete && analysisResult && exploration) {
    return (
      <AnalysisResults 
        analysis={analysisResult}
        exploration={exploration}
        onClose={() => navigate('/explorations')}
        onSaveToJournal={async () => {
          // Implementation for saving to journal
          console.log('Save to journal');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-ambient p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/explorations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              {exploration?.title}
            </span>
          </div>
        </div>

        {/* Progress */}
        {exploration && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestion + 1} of {exploration.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Question */}
        {exploration && (
          <div className="glass rounded-2xl p-8 mb-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {exploration.questions[currentQuestion]}
            </h2>
            <p className="text-muted-foreground text-sm">
              Take your time and speak from the heart. NewMe is here to listen.
            </p>
          </div>
        )}

        {/* Voice Interface */}
        <div className="glass rounded-2xl p-8 mb-8">
          <VoiceInterface
            isListening={isListening}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            onSpeechResult={handleSpeechResult}
            currentText={currentTranscript}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Previous Answers */}
        {answers.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-medium text-foreground mb-4">Your Journey So Far</h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="border-l-2 border-primary/30 pl-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Question {index + 1}
                  </p>
                  <p className="text-sm text-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
