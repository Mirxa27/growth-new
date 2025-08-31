import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth'; // Correctly import the auth hook
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Define types for our data structures
interface QuestionOption {
  value: string;
  label: string;
}

interface PersonalityQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

interface PersonalityAssessmentProps {
  onComplete?: (results: any) => void;
  embedded?: boolean;
}

export const PersonalityAssessment = ({ onComplete, embedded = false }: PersonalityAssessmentProps) => {
  const [personalityQuestions, setPersonalityQuestions] = useState<PersonalityQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalityResult, setPersonalityResult] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from the auth context

  // Fetch questions when the component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      const { data, error } = await supabase
        .from('personality_questions')
        .select('id, question_text, options')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching personality questions:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment questions.",
          variant: "destructive",
        });
        setIsLoadingQuestions(false);
        return;
      }

      // Ensure options are correctly formatted
      const formattedQuestions = data.map(q => ({
        id: q.id,
        question: q.question_text,
        // Safely map options, providing a default empty array if options are null/undefined
        options: (q.options as any[])?.map(opt => ({ value: opt.value, label: opt.text })) || [],
      }));

      setPersonalityQuestions(formattedQuestions);
      setIsLoadingQuestions(false);
    };

    fetchQuestions();
  }, [toast]);

  const handleAnswerSelect = (value: string) => {
    setAnswers({ ...answers, [personalityQuestions[currentQuestion].id]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeAssessment = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to complete the assessment.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Calculate personality type via RPC call
      const { data: rpcData, error: rpcError } = await supabase.rpc('calculate_personality_type', { user_answers: answers });
      if (rpcError) throw rpcError;

      const personalityType = rpcData.personality_type || 'Balanced Personality';
      setPersonalityResult(personalityType); // Store result in state

      const resultsPayload = {
        answers,
        personality_type: personalityType,
        completed_at: new Date().toISOString()
      };

      // 2. Save results to the database
      const { error: insertError } = await supabase
        .from('user_personality_results')
        .insert([{ user_id: user.id, results: resultsPayload }]);
      if (insertError) throw insertError;

      setIsComplete(true);
      if (onComplete) {
        onComplete(resultsPayload);
      }

      toast({
        title: "Assessment Complete!",
        description: "Your personality insights are ready.",
      });

    } catch (error: any) {
      console.error('Error completing assessment:', error);
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    setPersonalityResult(null);
  };

  if (isLoadingQuestions) {
    return (
      <Card className="glass border-card-border flex items-center justify-center p-10">
        <LoadingSpinner />
        <p className="ml-4">Loading assessment...</p>
      </Card>
    );
  }

  if (personalityQuestions.length === 0) {
    return (
        <Card className="glass border-card-border p-10 text-center">
            <CardTitle>Assessment Unavailable</CardTitle>
            <CardDescription>We couldn't load the questions. Please try again later.</CardDescription>
        </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="glass border-card-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          <CardDescription>Your personality type has been identified.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-6 glass rounded-2xl bg-gradient-primary/10">
            <h3 className="text-xl font-bold mb-2 text-primary">{personalityResult || 'Calculating...'}</h3>
            <p className="text-muted-foreground">
              This provides insights into your communication style and decision-making preferences.
            </p>
          </div>
          
          {!embedded && (
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-primary">
                Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={resetAssessment} className="glass">
                Retake Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / personalityQuestions.length) * 100;
  const currentAnswerValue = answers[personalityQuestions[currentQuestion]?.id];
  const canProceed = currentAnswerValue !== undefined;

  return (
    <Card className="glass border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Personality Assessment</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {personalityQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {personalityQuestions[currentQuestion]?.question}
          </h3>
          
          <RadioGroup 
            value={currentAnswerValue || ''} 
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {personalityQuestions[currentQuestion]?.options.map((option) => (
              <Label 
                key={option.value}
                htmlFor={option.value} 
                className={cn(
                  "block p-4 rounded-lg border-2 cursor-pointer transition-all",
                  "bg-white/5 border-white/20 hover:bg-white/10",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/20"
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        </motion.div>

        <div className="flex justify-between items-center pt-4">
          <Button onClick={prevQuestion} disabled={currentQuestion === 0} variant="outline" className="glass">
            Previous
          </Button>

          <Button onClick={nextQuestion} disabled={!canProceed || isSubmitting} className="bg-gradient-primary">
            {isSubmitting ? <LoadingSpinner size="sm" /> : (
              currentQuestion === personalityQuestions.length - 1 ? (
                <>Complete <Sparkles className="w-4 h-4 ml-2" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
              )
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};