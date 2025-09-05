import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Sparkles, 
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Assessment } from '@/types/assessment';

interface QuizTakerProps {
  assessment: Assessment;
  onComplete: (results: { score: number; totalQuestions: number; percentage: number }) => void;
  onBack: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ assessment, onComplete, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(assessment.estimatedTime ? assessment.estimatedTime * 60 : Infinity);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<{ score: number; totalQuestions: number; percentage: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (assessment.estimatedTime && assessment.estimatedTime > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessment.estimatedTime]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const finishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    let score = 0;
    let correctAnswers = 0;

    // Calculate score based on assessment type
    if (assessment.scoring.type === 'cumulative') {
      assessment.questions.forEach((question, index) => {
        const userAnswer = answers[question.id];
        if (userAnswer) {
          // For now, we'll count any answer as correct for scoring purposes
          // In a real implementation, you'd have correct answers defined
          score += 1;
          correctAnswers++;
        }
      });
    } else if (assessment.scoring.type === 'personality') {
      // Personality assessments don't have right/wrong answers
      score = assessment.questions.length;
      correctAnswers = assessment.questions.length;
    } else {
      // Default scoring
      assessment.questions.forEach(question => {
        if (answers[question.id]) {
          score += 1;
          correctAnswers++;
        }
      });
    }

    const finalResults = {
      score,
      totalQuestions: assessment.questions.length,
      percentage: Math.round((score / assessment.questions.length) * 100)
    };
    
    setResults(finalResults);

    // Save results to database if user is logged in
    if (user) {
      try {
        const { data, error } = await supabase
          .from('assessment_results')
          .insert({
            user_id: user.id,
            assessment_id: parseInt(assessment.id),
            score: finalResults.score,
            percentage: finalResults.percentage,
            answers: answers,
            submitted_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;
        toast({ title: "Assessment completed!", description: "Your results have been saved." });
      } catch (error) {
        console.error('Error saving assessment results:', error);
        toast({ title: "Error", description: "Could not save your results.", variant: "destructive" });
      }
    }
    
    onComplete(finalResults);
  };

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  if (isFinished && results) {
    return (
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle>Assessment Results: {assessment.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${results.percentage >= 70 ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
            {results.percentage >= 70 ? <CheckCircle className="w-12 h-12 text-green-500" /> : <CheckCircle className="w-12 h-12 text-orange-500" />}
          </div>
          <h3 className="text-2xl font-bold">Assessment Complete!</h3>
          <p>You scored {results.score} out of {results.totalQuestions} questions.</p>
          <Badge variant={results.percentage >= 70 ? "default" : "secondary"}>
            {results.percentage}% Complete
          </Badge>
          <Button onClick={onBack} className="w-full">Back to Hub</Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="glass-card border-glass">
        <CardContent className="text-center py-8">
          <p>No questions available for this assessment.</p>
          <Button onClick={onBack} className="mt-4">Back to Hub</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <CardTitle>{assessment.title}</CardTitle>
          {assessment.estimatedTime && assessment.estimatedTime > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              <span className="text-primary">{currentQuestionIndex + 1}.</span> {currentQuestion.text}
            </h3>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options?.map((option, optIndex) => (
                <Label key={`${currentQuestion.id}-option-${optIndex}`} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-primary/5">
                  <RadioGroupItem value={option.id} />
                  <span>{option.text}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            {currentQuestionIndex < assessment.questions.length - 1 ? (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next</Button>
            ) : (
              <Button onClick={finishQuiz} className="bg-gradient-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Finish Assessment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizTaker;
