import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  Target, 
  TrendingUp,
  RotateCcw,
  Share2,
  Download,
  Timer,
  Zap
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  timeLimit?: number; // seconds
  points: number;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // total time in minutes
  passingScore: number; // percentage
  questions: QuizQuestion[];
  tags: string[];
  icon: string;
  color: string;
}

export interface QuizResult {
  score: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  passed: boolean;
  breakdown: {
    category: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}

interface QuizSystemProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onExit?: () => void;
}

export const QuizSystem: React.FC<QuizSystemProps> = ({
  quiz,
  onComplete,
  onExit
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60); // convert to seconds
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(new Date());
  const [showExplanation, setShowExplanation] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  /**
   * Start timers
   */
  useEffect(() => {
    // Overall quiz timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Question timer
    if (currentQuestion.timeLimit) {
      setQuestionTimeRemaining(currentQuestion.timeLimit);
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeRemaining(prev => {
          if (prev !== null && prev <= 1) {
            handleQuestionTimeUp();
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [currentQuestionIndex]);

  /**
   * Handle overall time up
   */
  const handleTimeUp = () => {
    toast({
      title: 'Time\'s Up!',
      description: 'The quiz has been automatically submitted.',
      variant: 'destructive',
    });
    handleSubmit();
  };

  /**
   * Handle question time up
   */
  const handleQuestionTimeUp = () => {
    toast({
      title: 'Question Time Up',
      description: 'Moving to next question automatically.',
    });
    handleNext(true); // Auto-advance
  };

  /**
   * Handle answer selection
   */
  const handleAnswerSelect = (optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
  };

  /**
   * Go to next question
   */
  const handleNext = (autoAdvance = false) => {
    const hasAnswer = userAnswers[currentQuestion.id];
    
    if (!hasAnswer && !autoAdvance) {
      toast({
        title: 'Answer Required',
        description: 'Please select an answer before continuing.',
        variant: 'destructive',
      });
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
      
      // Reset question timer
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    }
  };

  /**
   * Go to previous question
   */
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  /**
   * Submit quiz
   */
  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const result = calculateResult();
    setResult(result);
    setIsCompleted(true);
    onComplete(result);

    toast({
      title: result.passed ? 'Quiz Passed!' : 'Quiz Completed',
      description: `You scored ${result.percentage}% (${result.correctAnswers}/${result.totalQuestions})`,
      variant: result.passed ? 'default' : 'destructive',
    });
  };

  /**
   * Calculate quiz result
   */
  const calculateResult = (): QuizResult => {
    let totalScore = 0;
    let correctAnswers = 0;
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

    quiz.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const correctOption = question.options.find(opt => opt.isCorrect);
      
      if (!categoryBreakdown[question.category]) {
        categoryBreakdown[question.category] = { correct: 0, total: 0 };
      }
      categoryBreakdown[question.category].total++;

      if (userAnswer === correctOption?.id) {
        totalScore += question.points;
        correctAnswers++;
        categoryBreakdown[question.category].correct++;
      }
    });

    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const timeTaken = Math.round((Date.now() - startTime.getTime()) / 1000);

    const breakdown = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100)
    }));

    return {
      score: totalScore,
      percentage,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeTaken,
      passed: percentage >= quiz.passingScore,
      breakdown
    };
  };

  /**
   * Format time
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get difficulty color
   */
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Render result page
   */
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        {/* Result Header */}
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full ${
                result.passed ? 'bg-green-500' : 'bg-red-500'
              } flex items-center justify-center text-white`}>
                {result.passed ? (
                  <Award className="w-10 h-10" />
                ) : (
                  <Target className="w-10 h-10" />
                )}
              </div>
            </div>
            <CardTitle className="text-3xl">
              {result.passed ? 'Congratulations!' : 'Quiz Complete'}
            </CardTitle>
            <CardDescription className="text-lg">
              You scored {result.percentage}% ({result.correctAnswers}/{result.totalQuestions} correct)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{result.score}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{result.percentage}%</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{formatTime(result.timeTaken)}</div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-sm text-muted-foreground">Result</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.breakdown.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{category.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.correct}/{category.total} ({category.percentage}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
          <Button onClick={() => {}} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Result
          </Button>
          <Button onClick={() => {}} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Certificate
          </Button>
          {onExit && (
            <Button onClick={onExit} className="bg-primary">
              Continue Learning
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {renderResult()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{quiz.icon}</span>
                {quiz.title}
              </CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${getDifficultyColor(quiz.difficulty)} text-white`}>
                {quiz.difficulty}
              </Badge>
              <Badge variant="outline">
                <Timer className="w-3 h-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentQuestionIndex + 1} of {quiz.questions.length}</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {currentQuestion.category}
              </Badge>
              <Badge variant="outline">
                <Zap className="w-3 h-3 mr-1" />
                {currentQuestion.points} pts
              </Badge>
              {questionTimeRemaining !== null && (
                <Badge variant="outline" className={questionTimeRemaining <= 10 ? 'bg-red-500 text-white' : ''}>
                  <Clock className="w-3 h-3 mr-1" />
                  {questionTimeRemaining}s
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="text-lg">
            {currentQuestion.question}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={userAnswers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerSelect(value)}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                  userAnswers[currentQuestion.id] === option.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Show explanation after answering */}
          {showExplanation && userAnswers[currentQuestion.id] && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  {userAnswers[currentQuestion.id] === currentQuestion.correctAnswer ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    {userAnswers[currentQuestion.id] === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentQuestionIndex
                  ? userAnswers[quiz.questions[index].id] === quiz.questions[index].correctAnswer
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : index === currentQuestionIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {userAnswers[currentQuestion.id] && !showExplanation && (
            <Button
              onClick={() => setShowExplanation(true)}
              variant="outline"
            >
              Show Explanation
            </Button>
          )}
          
          <Button
            onClick={() => handleNext()}
            disabled={!userAnswers[currentQuestion.id]}
            className="bg-primary"
          >
            {isLastQuestion ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Quiz
              </>
            ) : (
              'Next Question'
            )}
          </Button>
        </div>
      </div>

      {/* Quiz Info */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold">Passing Score</div>
              <div className="text-muted-foreground">{quiz.passingScore}%</div>
            </div>
            <div>
              <div className="font-semibold">Total Points</div>
              <div className="text-muted-foreground">
                {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
              </div>
            </div>
            <div>
              <div className="font-semibold">Questions</div>
              <div className="text-muted-foreground">{quiz.questions.length}</div>
            </div>
            <div>
              <div className="font-semibold">Time Limit</div>
              <div className="text-muted-foreground">{quiz.timeLimit} min</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizSystem;