import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalityQuestion {
  id: string;
  question: string;
  options: Array<{
    value: string;
    label: string;
    category: string;
  }>;
}

interface PersonalityTestProps {
  onComplete: (results: PersonalityResults) => void;
  onBack?: () => void;
}

interface PersonalityResults {
  type: string;
  description: string;
  strengths: string[];
  growthAreas: string[];
  recommendedExplorations: string[];
}

const personalityQuestions: PersonalityQuestion[] = [
  {
    id: '1',
    question: 'When faced with a difficult decision, I tend to:',
    options: [
      { value: 'intuitive', label: 'Trust my gut feeling', category: 'intuitive' },
      { value: 'analytical', label: 'Research and analyze all options', category: 'analytical' },
      { value: 'collaborative', label: 'Seek advice from trusted friends', category: 'collaborative' },
      { value: 'practical', label: 'Focus on what works best in practice', category: 'practical' }
    ]
  },
  {
    id: '2',
    question: 'In my free time, I most enjoy:',
    options: [
      { value: 'creative', label: 'Creative pursuits and artistic expression', category: 'creative' },
      { value: 'social', label: 'Spending quality time with loved ones', category: 'social' },
      { value: 'learning', label: 'Learning new skills or knowledge', category: 'learning' },
      { value: 'nature', label: 'Being in nature and finding peace', category: 'nature' }
    ]
  },
  {
    id: '3',
    question: 'When I think about personal growth, I am most motivated by:',
    options: [
      { value: 'achievement', label: 'Achieving my goals and ambitions', category: 'achievement' },
      { value: 'connection', label: 'Deepening my relationships', category: 'connection' },
      { value: 'understanding', label: 'Understanding myself better', category: 'understanding' },
      { value: 'contribution', label: 'Making a positive impact on others', category: 'contribution' }
    ]
  },
  {
    id: '4',
    question: 'During challenging times, I find strength in:',
    options: [
      { value: 'resilience', label: 'My inner resilience and determination', category: 'resilience' },
      { value: 'support', label: 'The support of my community', category: 'support' },
      { value: 'spirituality', label: 'My spiritual beliefs and practices', category: 'spirituality' },
      { value: 'optimism', label: 'My positive outlook and hope', category: 'optimism' }
    ]
  },
  {
    id: '5',
    question: 'The way I prefer to process emotions is:',
    options: [
      { value: 'reflection', label: 'Through quiet reflection and journaling', category: 'reflection' },
      { value: 'expression', label: 'Through creative expression or movement', category: 'expression' },
      { value: 'discussion', label: 'Through talking with others', category: 'discussion' },
      { value: 'action', label: 'Through taking constructive action', category: 'action' }
    ]
  }
];

const personalityTypes = {
  'intuitive-analytical': {
    type: 'The Insightful Explorer',
    description: 'You blend deep intuition with analytical thinking, creating a powerful combination for self-discovery.',
    strengths: ['Deep self-awareness', 'Balanced decision-making', 'Pattern recognition'],
    growthAreas: ['Trusting initial instincts', 'Balancing logic with emotion'],
    recommendedExplorations: ['Shadow Work', 'Inner Wisdom', 'Decision Making Patterns']
  },
  'creative-social': {
    type: 'The Expressive Connector',
    description: 'You thrive on creative expression and meaningful connections with others.',
    strengths: ['Creative problem-solving', 'Empathy and compassion', 'Inspiring others'],
    growthAreas: ['Setting healthy boundaries', 'Solo reflection time'],
    recommendedExplorations: ['Creative Blocks', 'Relationship Patterns', 'Authentic Expression']
  },
  'learning-understanding': {
    type: 'The Conscious Student',
    description: 'You are driven by continuous learning and deep self-understanding.',
    strengths: ['Growth mindset', 'Self-reflection', 'Wisdom seeking'],
    growthAreas: ['Applying knowledge to action', 'Trusting intuition over analysis'],
    recommendedExplorations: ['Life Purpose', 'Inner Critic', 'Wisdom Integration']
  },
  'resilience-contribution': {
    type: 'The Empowered Leader',
    description: 'You combine personal resilience with a desire to uplift and support others.',
    strengths: ['Natural leadership', 'Emotional strength', 'Service orientation'],
    growthAreas: ['Self-care practices', 'Receiving support from others'],
    recommendedExplorations: ['Leadership Style', 'Burnout Prevention', 'Service vs. Sacrifice']
  }
};

export const PersonalityTest = ({ onComplete, onBack }: PersonalityTestProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeTest();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack?.();
    }
  };

  const completeTest = async () => {
    setIsCompleting(true);
    
    // Analyze answers to determine personality type
    const categories = Object.values(answers).reduce((acc, answer) => {
      const option = personalityQuestions
        .flatMap(q => q.options)
        .find(opt => opt.value === answer);
      
      if (option) {
        acc[option.category] = (acc[option.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get top 2 categories
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);

    const typeKey = sortedCategories.join('-') as keyof typeof personalityTypes;
    const results = personalityTypes[typeKey] || personalityTypes['intuitive-analytical'];

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete(results);
  };

  const currentQ = personalityQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / personalityQuestions.length) * 100;
  const currentAnswer = answers[currentQ.id];
  const canProceed = Boolean(currentAnswer);

  return (
    <div className="min-h-screen bg-gradient-ambient p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Personality Discovery</h1>
          <p className="text-muted-foreground">
            Let's understand your unique approach to growth and self-discovery
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {personalityQuestions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="glass-card border-glass mb-8">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQ.question}
            </CardTitle>
            <CardDescription>
              Choose the option that best reflects your natural tendency
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <RadioGroup
              value={currentAnswer || ''}
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
              className="space-y-4"
            >
              {currentQ.options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                    currentAnswer === option.value 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentQuestion === 0 ? 'Back' : 'Previous'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isCompleting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : currentQuestion === personalityQuestions.length - 1 ? (
              <>
                Complete Assessment
                <Brain className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-8 space-x-2">
          {personalityQuestions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index <= currentQuestion ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};