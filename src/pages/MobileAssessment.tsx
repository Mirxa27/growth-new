import { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Star,
  Target,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    id: 'stress_response',
    text: 'When you feel overwhelmed or stressed, you tend to:',
    options: [
      {
        value: 'withdraw_reflect',
        label: 'Withdraw and spend time reflecting alone',
        personality_weight: { introvert: 2, analytical: 1 }
      },
      {
        value: 'seek_support',
        label: 'Reach out to friends or family for support',
        personality_weight: { social: 2, empathetic: 1 }
      },
      {
        value: 'stay_busy',
        label: 'Keep busy with activities or work',
        personality_weight: { action_oriented: 2, structured: 1 }
      },
      {
        value: 'creative_outlet',
        label: 'Express yourself through creative activities',
        personality_weight: { creative: 2, expressive: 1 }
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
  },
  {
    id: 'challenge_approach',
    text: 'When facing a personal challenge, you prefer to:',
    options: [
      {
        value: 'methodical_planning',
        label: 'Create a detailed plan and follow it step by step',
        personality_weight: { structured: 2, analytical: 1 }
      },
      {
        value: 'intuitive_flow',
        label: 'Trust the process and let solutions emerge naturally',
        personality_weight: { intuitive: 2, flexible: 1 }
      },
      {
        value: 'collaborative_approach',
        label: 'Work through it with the help of others',
        personality_weight: { social: 2, empathetic: 1 }
      },
      {
        value: 'creative_solutions',
        label: 'Find unique, creative approaches to overcome it',
        personality_weight: { creative: 2, innovative: 1 }
      }
    ]
  },
  {
    id: 'self_reflection',
    text: 'How do you prefer to process your thoughts and emotions?',
    options: [
      {
        value: 'journaling_writing',
        label: 'Writing in a journal or diary',
        personality_weight: { reflective: 2, structured: 1 }
      },
      {
        value: 'talking_aloud',
        label: 'Talking through them with someone I trust',
        personality_weight: { verbal: 2, social: 1 }
      },
      {
        value: 'meditation_quiet',
        label: 'Quiet meditation or mindfulness practices',
        personality_weight: { introspective: 2, calm: 1 }
      },
      {
        value: 'creative_expression',
        label: 'Creative expression like art, music, or movement',
        personality_weight: { creative: 2, expressive: 1 }
      }
    ]
  },
  {
    id: 'learning_style',
    text: 'What learning approach resonates most with you?',
    options: [
      {
        value: 'structured_curriculum',
        label: 'Structured courses with clear learning objectives',
        personality_weight: { structured: 2, goal_oriented: 1 }
      },
      {
        value: 'experiential_learning',
        label: 'Learning through direct experience and practice',
        personality_weight: { hands_on: 2, practical: 1 }
      },
      {
        value: 'discussion_groups',
        label: 'Group discussions and shared learning experiences',
        personality_weight: { social: 2, collaborative: 1 }
      },
      {
        value: 'self_directed',
        label: 'Self-directed exploration based on personal interests',
        personality_weight: { independent: 2, curious: 1 }
      }
    ]
  },
  {
    id: 'ideal_outcome',
    text: 'What would be your ideal outcome from personal growth work?',
    options: [
      {
        value: 'inner_peace',
        label: 'Greater inner peace and emotional balance',
        personality_weight: { peace_seeking: 2, emotional: 1 }
      },
      {
        value: 'authentic_relationships',
        label: 'More authentic and meaningful relationships',
        personality_weight: { authentic: 2, relational: 1 }
      },
      {
        value: 'clear_purpose',
        label: 'Clarity on my life purpose and direction',
        personality_weight: { purpose_driven: 2, visionary: 1 }
      },
      {
        value: 'creative_fulfillment',
        label: 'Full expression of my creative potential',
        personality_weight: { creative: 2, expressive: 1 }
      }
    ]
  }
];

const MobileAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [, setDirection] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const controls = useAnimation();

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
      introvert: {
        strengths: ['Deep thinking', 'Meaningful connections', 'Self-awareness', 'Independent work'],
        growth_areas: ['Social confidence', 'Public speaking', 'Networking'],
        recommended_explorations: ['Social Confidence Building', 'Finding Your Voice']
      },
      extrovert: {
        strengths: ['Social connections', 'Leadership', 'Inspiring others', 'Adaptability'],
        growth_areas: ['Quiet reflection', 'Deep self-analysis', 'Listening skills'],
        recommended_explorations: ['The Power of Solitude', 'Deep Listening Skills']
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
      setDirection(1);
      controls.start({ x: -100, opacity: 0 }).then(() => {
        setCurrentQuestion(currentQuestion + 1);
        controls.set({ x: 100, opacity: 0 });
        controls.start({ x: 0, opacity: 1 });
      });
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      controls.start({ x: 100, opacity: 0 }).then(() => {
        setCurrentQuestion(currentQuestion - 1);
        controls.set({ x: -100, opacity: 0 });
        controls.start({ x: 0, opacity: 1 });
      });
    }
  };

  const handleSwipe = (event: PanInfo) => {
    const threshold = 50;
    if (event.offset.x > threshold && currentQuestion > 0) {
      prevQuestion();
    } else if (event.offset.x < -threshold && currentQuestion < questions.length - 1) {
      nextQuestion();
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
            <Card className="glass-card border-glass mb-8 text-center">
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
              <Card className="glass-card border-glass">
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

              <Card className="glass-card border-glass">
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
              <Card className="glass-card border-glass">
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

              <Card className="glass-card border-glass">
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

            <Card className="glass-card border-glass text-center">
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
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <span className="text-sm font-medium">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <Progress value={progress} className="h-1" />
          </div>

          {/* Question */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleSwipe(info)}
            animate={controls}
            className="mb-6"
          >
            <Card className="glass-card border-glass">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 leading-relaxed">
                  {questions[currentQuestion]?.text}
                </h2>
                
                <RadioGroup 
                  value={currentAnswerValue || ''} 
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
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
                          "block p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          "peer-checked:border-primary peer-checked:bg-primary/10",
                          "text-sm leading-relaxed"
                        )}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              variant="outline"
              size="sm"
              className="glass"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Swipe to navigate
              </p>
            </div>

            {isLastQuestion ? (
              <Button
                onClick={completeAssessment}
                disabled={!canProceed}
                className="bg-gradient-primary"
                size="sm"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={!canProceed}
                className="bg-gradient-primary"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAssessment;
