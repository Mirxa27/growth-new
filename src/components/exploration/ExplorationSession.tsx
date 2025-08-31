import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Compass, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Clock,
  Sparkles,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Exploration {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  crystal_reward: number;
  questions: string[];
}

interface ExplorationResponse {
  id: string;
  exploration_id: string;
  user_id: string;
  responses: Record<string, string>;
  completed_at?: string;
  crystal_reward: number;
}

const ExplorationSession = () => {
  const { explorationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exploration, setExploration] = useState<Exploration | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);

  useEffect(() => {
    loadExploration();
  }, [explorationId]);

  const loadExploration = async () => {
    try {
      setIsLoading(true);
      
      const { data: explorationData, error: explorationError } = await supabase
        .from('explorations')
        .select('*')
        .eq('id', explorationId)
        .single();

      if (explorationError) throw explorationError;

      const explorationWithQuestions: Exploration = {
        ...explorationData,
        questions: Array.isArray(explorationData.questions) ? explorationData.questions as string[] : []
      };

      setExploration(explorationWithQuestions);

      if (user) {
        const { data: existingResponse } = await supabase
          .from('exploration_responses' as any)
          .select('*')
          .eq('exploration_id', explorationId)
          .eq('user_id', user.id)
          .single();

        if (existingResponse) {
          setResponseId(existingResponse.id);
          setAnswers(existingResponse.responses || {});
          
          if (existingResponse.completed_at) {
            setIsComplete(true);
          }
        }
      }

    } catch (error) {
      console.error('Error loading exploration:', error);
      toast({
        title: "Error",
        description: "Failed to load exploration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const questionId = currentQuestion.toString();
    setAnswers({ ...answers, [questionId]: value });
  };

  const saveProgress = async () => {
    if (!user || !exploration) return;

    try {
      const responseData = {
        exploration_id: explorationId,
        user_id: user.id,
        responses: answers,
        crystal_reward: exploration.crystal_reward
      };

      if (responseId) {
        await supabase
          .from('exploration_responses' as any)
          .update(responseData)
          .eq('id', responseId);
      } else {
        const { data, error } = await supabase
          .from('exploration_responses' as any)
          .insert(responseData)
          .select()
          .single();
        
        if (error) throw error;
        setResponseId(data.id);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const nextQuestion = async () => {
    if (!exploration) return;

    await saveProgress();
    
    if (currentQuestion < exploration.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeExploration();
    }
  };

  const prevQuestion = async () => {
    if (currentQuestion > 0) {
      await saveProgress();
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeExploration = async () => {
    if (!user || !exploration) return;

    try {
      await saveProgress();
      
      if (responseId) {
        await supabase
          .from('exploration_responses' as any)
          .update({ completed_at: new Date().toISOString() })
          .eq('id', responseId);
      }

      await (supabase as any).rpc('increment_user_crystals', {
        user_id: user.id,
        amount: exploration.crystal_reward
      });

      setIsComplete(true);
      toast({
        title: "Exploration Complete! ✨",
        description: `You've earned ${exploration.crystal_reward} crystals!`,
      });
    } catch (error) {
      console.error('Error completing exploration:', error);
      toast({
        title: "Error",
        description: "Failed to complete exploration. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Exploration not found</h2>
          <Button onClick={() => navigate('/explorations')} className="bg-gradient-primary">
            Back to Explorations
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="glass border-card-border max-w-2xl w-full text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Exploration Complete!</h1>
            <p className="text-muted-foreground mb-6">
              You've successfully completed "{exploration.title}". Your insights have been saved and you've earned {exploration.crystal_reward} crystals!
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/explorations')}
                className="bg-gradient-primary"
              >
                <Compass className="w-4 h-4 mr-2" />
                More Explorations
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="glass"
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / exploration.questions.length) * 100;
  const currentQuestionData = exploration.questions[currentQuestion];
  const currentAnswer = answers[currentQuestion.toString()] || '';
  const canProceed = currentAnswer.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/explorations')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{exploration.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {exploration.estimated_duration} min
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {exploration.crystal_reward} crystals
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {exploration.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="glass border-card-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Reflection Question
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-medium leading-relaxed">
              {currentQuestionData}
            </h2>

            <Textarea
              placeholder="Take your time to reflect and share your thoughts..."
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="glass min-h-[150px]"
            />

            <div className="text-sm text-muted-foreground">
              💡 Take your time to reflect deeply. There are no right or wrong answers.
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            variant="outline"
            className="glass"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Swipe or use buttons to navigate
            </p>
          </div>

          {currentQuestion === exploration.questions.length - 1 ? (
            <Button
              onClick={completeExploration}
              disabled={!canProceed}
              className="bg-gradient-primary"
            >
              Complete
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="bg-gradient-primary"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorationSession;