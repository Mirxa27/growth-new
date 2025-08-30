import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Brain,
  Zap,
  Target,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  quiz_questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  correct_answer: string;
  explanation?: string;
  points: number;
  order_index: number;
  quiz_question_options?: QuizQuestionOption[];
}

interface QuizQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizTakerProps {
  quiz: Quiz;
  onComplete?: (results: QuizResults) => void;
  onBack?: () => void;
}

interface QuizResults {
  score: number;
  passed: boolean;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  answers: Array<{
    question_id: string;
    user_answer: string;
    is_correct: boolean;
    correct_answer: string;
    explanation?: string;
  }>;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({
  quiz,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState(
    quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null
  );
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [visitorSession] = useState(() => 
    `visitor_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
  );
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Sort questions by order_index
  const sortedQuestions = quiz.quiz_questions.sort((a, b) => a.order_index - b.order_index);
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sortedQuestions.length) * 100;

  useEffect(() => {
    createQuizAttempt();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            submitQuiz(); // Auto-submit when time runs out
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults]);

  const createQuizAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          user_id: user?.id || null,
          visitor_session_id: user ? null : visitorSession,
          total_questions: sortedQuestions.length,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      setQuizAttemptId(data.id);
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateResults = (): QuizResults => {
    let correctCount = 0;
    const questionResults = sortedQuestions.map(question => {
      const userAnswer = answers[question.id] || '';
      const isCorrect = userAnswer.toLowerCase() === question.correct_answer.toLowerCase();
      
      if (isCorrect) correctCount++;

      return {
        question_id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation
      };
    });

    const score = (correctCount / sortedQuestions.length) * 100;
    const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

    return {
      score,
      passed: score >= quiz.passing_score,
      total_questions: sortedQuestions.length,
      correct_answers: correctCount,
      time_taken_seconds: timeTaken,
      answers: questionResults
    };
  };

  const submitQuiz = async () => {
    if (!quizAttemptId) return;

    setIsSubmitting(true);
    try {
      const quizResults = calculateResults();
      
      // Update quiz attempt
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score: quizResults.score,
          passed: quizResults.passed,
          correct_answers: quizResults.correct_answers,
          time_taken_seconds: quizResults.time_taken_seconds,
          status: 'completed'
        })
        .eq('id', quizAttemptId);

      if (attemptError) throw attemptError;

      // Save individual answers
      const answerInserts = quizResults.answers.map(answer => ({
        quiz_attempt_id: quizAttemptId,
        quiz_question_id: answer.question_id,
        user_answer: answer.user_answer,
        is_correct: answer.is_correct,
        points_earned: answer.is_correct ? 1 : 0
      }));

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerInserts);

      if (answersError) throw answersError;

      setResults(quizResults);
      setShowResults(true);
      
      toast({
        title: quizResults.passed ? "Quiz Passed!" : "Quiz Complete",
        description: `You scored ${quizResults.score.toFixed(1)}%`,
        variant: quizResults.passed ? "default" : "destructive"
      });

      onComplete?.(quizResults);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <RadioGroup value={currentAnswer || ''} onValueChange={handleAnswer}>
            <div className="space-y-3">
              {currentQuestion.quiz_question_options
                ?.sort((a, b) => a.order_index - b.order_index)
                .map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.option_text} id={option.id} />
                    <Label 
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      {option.option_text}
                    </Label>
                  </div>
                ))}
            </div>
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup value={currentAnswer || ''} onValueChange={handleAnswer}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-1">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-1">
                  False
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'fill_blank':
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="text-lg p-4"
          />
        );

      default:
        return null;
    }
  };

  if (showResults && results) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center">
            <div className={`p-6 rounded-full ${results.passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {results.passed ? (
                <Award className="w-12 h-12 text-green-600" />
              ) : (
                <Target className="w-12 h-12 text-yellow-600" />
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold">
              {results.passed ? 'Congratulations!' : 'Quiz Complete'}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              You scored {results.score.toFixed(1)}% ({results.correct_answers}/{results.total_questions} correct)
            </p>
          </div>

          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time: {formatTime(results.time_taken_seconds)}
            </div>
            <div className="flex items-center gap-1">
              {results.passed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              {results.passed ? 'Passed' : 'Needs Improvement'}
            </div>
          </div>
        </motion.div>

        {/* Score Progress */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Score</span>
                <span>{results.score.toFixed(1)}%</span>
              </div>
              <Progress value={results.score} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-primary">Passing: {quiz.passing_score}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        {quiz.show_correct_answers && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Review Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.answers.map((answer, index) => {
                const question = sortedQuestions.find(q => q.id === answer.question_id);
                if (!question) return null;

                return (
                  <div key={answer.question_id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${answer.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                        {answer.is_correct ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Your answer:</span>{' '}
                            <span className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                              {answer.user_answer || 'No answer'}
                            </span>
                          </p>
                          {!answer.is_correct && (
                            <p>
                              <span className="text-muted-foreground">Correct answer:</span>{' '}
                              <span className="text-green-600">{answer.correct_answer}</span>
                            </p>
                          )}
                          {answer.explanation && (
                            <p className="text-muted-foreground mt-2">
                              <strong>Explanation:</strong> {answer.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
          <Button>
            <ArrowRight className="w-4 h-4 mr-2" />
            Try Another Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back to Quizzes
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground mt-2">{quiz.description}</p>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            {quiz.category}
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {quiz.difficulty}
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            Pass: {quiz.passing_score}%
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time: {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="w-full h-2" />
        <div className="text-center text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {sortedQuestions.length}
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question_text}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderQuestionInput()}
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentQuestionIndex === sortedQuestions.length - 1 ? (
                  <Button
                    onClick={submitQuiz}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Quiz
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizTaker;
