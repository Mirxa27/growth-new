import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Star,
  Target,
  BookOpen,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  text: string;
  options: {
    value: string;
    label: string;
    personality_weight: Record<string, number>;
  }[];
}

interface AssessmentResult {
  primary_type: string;
  secondary_type?: string;
  strengths: string[];
  growth_areas: string[];
  recommended_explorations: string[];
  confidence_score: number;
}

const questions: Question[] = [
  {
    id: 'social_energy',
    text: 'Where do you typically gain energy and feel most authentic?',
    options: [
      {
        value: 'large_groups',
        label: 'Large social gatherings and meeting new people',
        personality_weight: { extrovert: 2, social: 1 }
      },
      {
        value: 'small_groups',
        label: 'Small intimate gatherings with close friends',
        personality_weight: { balanced: 2, empathetic: 1 }
      },
      {
        value: 'one_on_one',
        label: 'Deep one-on-one conversations',
        personality_weight: { introvert: 1, empathetic: 2 }
      },
      {
        value: 'alone_time',
        label: 'Quiet time alone for reflection and recharging',
        personality_weight: { introvert: 2, analytical: 1 }
      }
    ]
  },
  {
    id: 'decision_making',
    text: 'When facing an important life decision, what guides you most?',
    options: [
      {
        value: 'logic_analysis',
        label: 'Logical analysis and weighing pros and cons',
        personality_weight: { analytical: 2, structured: 1 }
      },
      {
        value: 'gut_feeling',
        label: 'My intuition and gut feelings',
        personality_weight: { intuitive: 2, creative: 1 }
      },
      {
        value: 'others_input',
        label: 'Seeking advice from trusted friends and family',
        personality_weight: { social: 1, empathetic: 1 }
      },
      {
        value: 'values_alignment',
        label: 'How well it aligns with my core values',
        personality_weight: { value_driven: 2, authentic: 1 }
      }
    ]
  },
  {
    id: 'growth_motivation',
    text: 'What motivates you most in your personal growth journey?',
    options: [
      {
        value: 'self_understanding',
        label: 'Deeper understanding of myself and my patterns',
        personality_weight: { self_aware: 2, analytical: 1 }
      },
      {
        value: 'better_relationships',
        label: 'Improving my relationships with others',
        personality_weight: { empathetic: 2, social: 1 }
      },
      {
        value: 'achieving_goals',
        label: 'Achieving specific goals and milestones',
        personality_weight: { goal_oriented: 2, structured: 1 }
      },
      {
        value: 'creative_expression',
        label: 'Expressing my authentic self more fully',
        personality_weight: { creative: 2, authentic: 1 }
      }
    ]
  }
];

const PublicAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnswerSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
  };

  const calculateResults = (): AssessmentResult => {
    const personalityScores: Record<string, number> = {};
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      const option = question?.options.find(opt => opt.value === answer);
      
      if (option?.personality_weight) {
        Object.entries(option.personality_weight).forEach(([trait, weight]) => {
          personalityScores[trait] = (personalityScores[trait] || 0) + weight;
        });
      }
    });

    const sortedTypes = Object.entries(personalityScores)
      .sort(([,a], [,b]) => b - a);
    
    const primary_type = sortedTypes[0]?.[0] || 'balanced';
    const secondary_type = sortedTypes[1]?.[0];

    const typeResults = {
      analytical: {
        strengths: ['Logical thinking', 'Problem-solving', 'Objective analysis', 'Strategic planning'],
        growth_areas: ['Emotional intelligence', 'Intuitive decision-making', 'Spontaneity'],
        recommended_explorations: ['Understanding Your Emotions', 'Balancing Logic and Intuition']
      },
      creative: {
        strengths: ['Innovation', 'Artistic expression', 'Thinking outside the box', 'Inspiring others'],
        growth_areas: ['Structure and organization', 'Practical implementation', 'Focus and consistency'],
        recommended_explorations: ['Unleashing Your Creative Power', 'Balancing Dreams and Reality']
      },
      empathetic: {
        strengths: ['Understanding others', 'Emotional support', 'Building connections', 'Compassion'],
        growth_areas: ['Setting boundaries', 'Self-care', 'Assertiveness'],
        recommended_explorations: ['Healthy Boundaries', 'Self-Compassion Journey']
      },
      balanced: {
        strengths: ['Adaptability', 'Well-rounded perspective', 'Flexibility', 'Understanding different viewpoints'],
        growth_areas: ['Specialization', 'Deep expertise', 'Clear preferences'],
        recommended_explorations: ['Discovering Your Core Values', 'Finding Your Unique Path']
      }
    };

    const result = typeResults[primary_type as keyof typeof typeResults] || typeResults.balanced;

    return {
      primary_type,
      secondary_type,
      ...result,
      confidence_score: Math.min(95, Math.max(75, (sortedTypes[0]?.[1] || 0) * 10))
    };
  };

  const completeAssessment = () => {
    const assessmentResults = calculateResults();
    setResults(assessmentResults);
    setShowResults(true);
    
    toast({
      title: "Assessment Complete!",
      description: "Discover your personality insights and recommended growth paths.",
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
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

  const currentAnswerValue = answers[questions[currentQuestion]?.id];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = currentAnswerValue !== undefined;

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="glass border-card-border mb-8 text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Your Personality Insights
                </h1>
                <p className="text-muted-foreground mb-6">
                  Based on your responses, we've identified your unique personality pattern and growth opportunities.
                </p>
                <Badge className="bg-primary/20 text-primary text-lg px-4 py-2">
                  {results.confidence_score}% Confidence Match
                </Badge>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Primary Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold capitalize mb-2 bg-gradient-primary bg-clip-text text-transparent">
                      {results.primary_type.replace('_', ' ')}
                    </h3>
                    {results.secondary_type && (
                      <p className="text-muted-foreground">
                        with {results.secondary_type.replace('_', ' ')} tendencies
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-secondary" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.growth_areas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-secondary" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-card-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.recommended_explorations.map((exploration, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-accent" />
                        <span className="text-sm">{exploration}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-card-border text-center">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Begin Your Journey?</h2>
                <p className="text-muted-foreground mb-6">
                  Join Newomen to unlock personalized explorations, start guided sessions, 
                  and begin your transformation journey today.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-primary text-lg px-8 py-3"
                    size="lg"
                  >
                    Join Newomen
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    variant="outline" 
                    size="lg"
                    className="glass"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Personality Assessment</h1>
            <p className="text-muted-foreground">
              Discover your unique personality traits and growth opportunities
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <Card className="glass border-card-border mb-8">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-6 leading-relaxed">
                {questions[currentQuestion]?.text}
              </h2>
              
              <RadioGroup
                value={currentAnswerValue || ''}
                onValueChange={handleAnswerSelect}
                className="space-y-4"
              >
                {questions[currentQuestion]?.options.map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor={option.value} 
                      className={cn(
                        "block p-4 rounded-lg border-2 cursor-pointer transition-all duration-300",
                        "bg-white/5 backdrop-blur-sm border-white/20",
                        "hover:bg-white/10 hover:border-white/30 hover:shadow-lg",
                        "peer-checked:bg-gradient-to-r peer-checked:from-primary/20 peer-checked:to-secondary/20",
                        "peer-checked:border-primary peer-checked:shadow-xl peer-checked:scale-[1.02]",
                        "peer-checked:text-white peer-checked:font-medium",
                        "text-sm leading-relaxed"
                      )}
                    >
                      <span className="flex items-center">
                        <span className={cn(
                          "w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all",
                          "border-white/30",
                          "peer-checked:border-primary peer-checked:bg-primary",
                          "peer-checked:after:content-[''] peer-checked:after:w-2 peer-checked:after:h-2 peer-checked:after:rounded-full peer-checked:after:bg-white"
                        )} />
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-muted-foreground"
            >
              Exit Assessment
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={completeAssessment}
                disabled={!canProceed}
                className="bg-gradient-primary"
              >
                Complete Assessment
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={!canProceed}
                className="bg-gradient-primary"
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAssessment;
