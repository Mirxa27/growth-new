import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  is_public: boolean;
  time_limit_minutes?: number;
  passing_score: number;
  show_correct_answers: boolean;
  quiz_questions: any[];
}

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (results: any) => void;
  onBack: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onComplete, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : Infinity);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      startQuizAttempt();
    }
    if (quiz.time_limit_minutes) {
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
  }, [quiz.time_limit_minutes, user]);

  const startQuizAttempt = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quiz_attempts' as any)
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          status: 'in-progress'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      setQuizAttemptId((data as any).id);
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      toast({ title: "Error", description: "Could not start quiz attempt.", variant: "destructive" });
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const finishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    let score = 0;
    let correctAnswers = 0;
    const answerInserts: any[] = [];

    quiz.quiz_questions.forEach(q => {
      const userAnswer = answers[q.id];
      const correctAnswer = q.quiz_question_options.find((opt: any) => opt.is_correct)?.id;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) {
        score += q.points || 1;
        correctAnswers++;
      }
      if (userAnswer) {
        answerInserts.push({
          quiz_attempt_id: quizAttemptId,
          quiz_question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: isCorrect ? (q.points || 1) : 0
        });
      }
    });

    const finalResults = {
      score,
      correctAnswers,
      totalQuestions: quiz.quiz_questions.length,
      passed: score >= quiz.passing_score,
      timeTaken: quiz.time_limit_minutes ? (quiz.time_limit_minutes * 60) - timeLeft : null
    };
    setResults(finalResults);

    if (user && quizAttemptId) {
      try {
        // Update quiz attempt
        const { error: attemptError } = await supabase
          .from('quiz_attempts' as any)
          .update({
            status: 'completed',
            score: finalResults.score,
            completed_at: new Date().toISOString(),
            time_taken_seconds: finalResults.timeTaken
          })
          .eq('id', quizAttemptId);
        if (attemptError) throw attemptError;

        // Insert answers
        const { error: answersError } = await supabase
          .from('quiz_answers' as any)
          .insert(answerInserts);
        if (answersError) throw answersError;

        toast({ title: "Quiz completed!", description: "Your results have been saved." });
      } catch (error) {
        console.error('Error saving quiz results:', error);
        toast({ title: "Error", description: "Could not save your results.", variant: "destructive" });
      }
    }
    onComplete(finalResults);
  };

  const currentQuestion = quiz.quiz_questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.quiz_questions.length) * 100;

  if (isFinished && results) {
    return (
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle>Quiz Results: {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${results.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {results.passed ? <CheckCircle className="w-12 h-12 text-green-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
          </div>
          <h3 className="text-2xl font-bold">{results.passed ? 'Congratulations!' : 'Keep Trying!'}</h3>
          <p>You scored {results.score} points ({results.correctAnswers}/{results.totalQuestions} correct).</p>
          <Badge>{results.passed ? 'Passed' : 'Failed'}</Badge>
          <Button onClick={onBack} className="w-full">Back to Hub</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.time_limit_minutes && (
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
              <span className="text-primary">{currentQuestionIndex + 1}.</span> {currentQuestion.question_text}
            </h3>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.quiz_question_options.map((opt: any) => (
                <Label key={opt.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-primary/5">
                  <RadioGroupItem value={opt.id} />
                  <span>{opt.option_text}</span>
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
            {currentQuestionIndex < quiz.quiz_questions.length - 1 ? (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next</Button>
            ) : (
              <Button onClick={finishQuiz} className="bg-gradient-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Finish Quiz
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizTaker;