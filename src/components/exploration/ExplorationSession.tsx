import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Compass, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Brain,
  Heart,
  Sparkles,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ExplorationQuestion {
  id: string;
  question: string;
  type: 'reflection' | 'choice' | 'scale';
  options?: string[];
}

const ExplorationSession = () => {
  const { explorationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const exploration = {
    id: explorationId,
    title: 'Discovering Your Core Values',
    description: 'A deep dive into understanding what truly matters to you',
    estimatedDuration: '45 min',
    crystalReward: 150,
    questions: [
      {
        id: 'values_importance',
        question: 'Think about a time when you felt most fulfilled and authentic. What values were you honoring in that moment?',
        type: 'reflection'
      },
      {
        id: 'decision_values',
        question: 'When making important decisions, which of these considerations matters most to you?',
        type: 'choice',
        options: [
          'Impact on family and loved ones',
          'Personal growth and learning',
          'Financial security and stability',
          'Creative expression and authenticity',
          'Contributing to something bigger than myself'
        ]
      },
      {
        id: 'values_conflict',
        question: 'Describe a situation where your values conflicted with external expectations. How did you navigate this?',
        type: 'reflection'
      }
    ] as ExplorationQuestion[]
  };

  useEffect(() => {
    // Simulate loading exploration data
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [exploration.questions[currentQuestion].id]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < exploration.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeExploration();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeExploration = () => {
    setIsComplete(true);
    toast({
      title: "Exploration Complete!",
      description: `You've earned ${exploration.crystalReward} crystals!`,
    });
  };

  const progress = ((currentQuestion + 1) / exploration.questions.length) * 100;
  const currentAnswer = answers[exploration.questions[currentQuestion]?.id] || '';
  const canProceed = currentAnswer.trim().length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
              You've successfully completed "{exploration.title}". Your insights have been saved and you've earned {exploration.crystalReward} crystals!
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

  const currentQuestionData = exploration.questions[currentQuestion];

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
                {exploration.estimatedDuration}
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {exploration.crystalReward} crystals
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
              {currentQuestionData?.question}
            </h2>

            {currentQuestionData?.type === 'reflection' && (
              <Textarea
                placeholder="Take your time to reflect and share your thoughts..."
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="glass min-h-[150px]"
              />
            )}

            {currentQuestionData?.type === 'choice' && currentQuestionData.options && (
              <div className="space-y-3">
                {currentQuestionData.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={currentAnswer === option ? "default" : "outline"}
                    className={`w-full text-left justify-start p-4 h-auto ${
                      currentAnswer === option ? "bg-gradient-primary" : "glass"
                    }`}
                    onClick={() => handleAnswerChange(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

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