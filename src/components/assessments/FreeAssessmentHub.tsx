import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Heart, 
  Target, 
  Compass, 
  Users, 
  Sparkles,
  Clock,
  Star,
  ArrowRight,
  Gift
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';

interface Assessment {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  estimatedTime: number;
  questions: number;
  category: 'personality' | 'relationships' | 'wellness' | 'growth';
  benefits: string[];
  isFree: boolean;
  isPopular?: boolean;
}

const FREE_ASSESSMENTS: Assessment[] = [
  {
    id: 'personality_insights',
    title: 'Personality Insights',
    description: 'Discover your unique personality patterns and how they shape your relationships and decisions.',
    icon: Brain,
    color: 'text-primary',
    estimatedTime: 8,
    questions: 25,
    category: 'personality',
    benefits: [
      'Understand your core personality traits',
      'Learn your communication style',
      'Discover your decision-making patterns',
      'Get personalized growth recommendations'
    ],
    isFree: true,
    isPopular: true
  },
  {
    id: 'relationship_patterns',
    title: 'Relationship Patterns',
    description: 'Explore how you connect with others and identify patterns in your relationships.',
    icon: Heart,
    color: 'text-secondary',
    estimatedTime: 10,
    questions: 20,
    category: 'relationships',
    benefits: [
      'Identify your attachment style',
      'Understand relationship patterns',
      'Learn about communication preferences',
      'Improve relationship satisfaction'
    ],
    isFree: true
  },
  {
    id: 'life_balance_wheel',
    title: 'Life Balance Assessment',
    description: 'Evaluate different areas of your life to identify where you want to focus your growth.',
    icon: Target,
    color: 'text-accent',
    estimatedTime: 6,
    questions: 15,
    category: 'wellness',
    benefits: [
      'Map your current life satisfaction',
      'Identify priority growth areas',
      'Create a balanced development plan',
      'Track progress over time'
    ],
    isFree: true
  },
  {
    id: 'values_compass',
    title: 'Values Compass',
    description: 'Discover your core values and how they guide your decisions and life choices.',
    icon: Compass,
    color: 'text-primary',
    estimatedTime: 12,
    questions: 30,
    category: 'growth',
    benefits: [
      'Identify your top 5 core values',
      'Understand value conflicts',
      'Align decisions with values',
      'Create value-driven goals'
    ],
    isFree: true
  },
  {
    id: 'communication_style',
    title: 'Communication Style',
    description: 'Learn how you communicate and how others perceive your communication style.',
    icon: Users,
    color: 'text-secondary',
    estimatedTime: 7,
    questions: 18,
    category: 'relationships',
    benefits: [
      'Discover your communication strengths',
      'Identify potential blind spots',
      'Improve relationship communication',
      'Adapt to different communication styles'
    ],
    isFree: true
  },
  {
    id: 'growth_mindset',
    title: 'Growth Mindset Assessment',
    description: 'Evaluate your mindset patterns and discover opportunities for personal development.',
    icon: Sparkles,
    color: 'text-accent',
    estimatedTime: 9,
    questions: 22,
    category: 'growth',
    benefits: [
      'Assess your growth vs fixed mindset',
      'Identify learning opportunities',
      'Develop resilience strategies',
      'Embrace challenges confidently'
    ],
    isFree: true
  }
];

export const FreeAssessmentHub = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'All Assessments', count: FREE_ASSESSMENTS.length },
    { id: 'personality', name: 'Personality', count: FREE_ASSESSMENTS.filter(a => a.category === 'personality').length },
    { id: 'relationships', name: 'Relationships', count: FREE_ASSESSMENTS.filter(a => a.category === 'relationships').length },
    { id: 'wellness', name: 'Wellness', count: FREE_ASSESSMENTS.filter(a => a.category === 'wellness').length },
    { id: 'growth', name: 'Growth', count: FREE_ASSESSMENTS.filter(a => a.category === 'growth').length },
  ];

  const filteredAssessments = selectedCategory === 'all' 
    ? FREE_ASSESSMENTS 
    : FREE_ASSESSMENTS.filter(a => a.category === selectedCategory);

  const handleStartAssessment = (assessmentId: string) => {
    navigate(`/assessment/${assessmentId}`);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <MobileContainer className="py-8">
          {/* Header */}
          <Card className="glass-strong mb-6">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Free Growth Assessments</CardTitle>
              <p className="text-muted-foreground">
                Discover insights about yourself with our AI-powered assessments - completely free!
              </p>
            </CardHeader>
          </Card>

          {/* Benefits */}
          <Card className="glass-strong mb-6 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                What You'll Get
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Personalized AI analysis of your responses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Detailed insights and growth recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Progress tracking and crystal rewards</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Cultural sensitivity and personalized guidance</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card className="glass-strong mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className={`glass-button ${selectedCategory === category.id ? 'bg-primary text-white' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessments Grid */}
          <div className="space-y-4">
            {filteredAssessments.map((assessment) => {
              const AssessmentIcon = assessment.icon;
              return (
                <Card key={assessment.id} className="glass-strong hover:glass-glow transition-all hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${assessment.color.split('-')[1]}/20 rounded-full flex items-center justify-center`}>
                            <AssessmentIcon className={`w-6 h-6 ${assessment.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{assessment.title}</h3>
                              {assessment.isPopular && (
                                <Badge className="bg-primary/20 text-primary text-xs">
                                  Popular
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                FREE
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {assessment.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{assessment.estimatedTime} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          <span>{assessment.questions} questions</span>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {assessment.category}
                        </Badge>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">You'll discover:</h4>
                        <div className="grid gap-1">
                          {assessment.benefits.slice(0, 2).map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                          {assessment.benefits.length > 2 && (
                            <div className="text-xs text-muted-foreground ml-4">
                              +{assessment.benefits.length - 2} more insights
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => handleStartAssessment(assessment.id)}
                        className="w-full bg-gradient-primary hover:opacity-90"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            Start Assessment
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Note */}
          <Card className="glass-subtle mt-8 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Powered by NewMe AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All assessments are analyzed by our culturally-sensitive AI to provide 
                personalized insights that respect your background and values.
              </p>
            </CardContent>
          </Card>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};