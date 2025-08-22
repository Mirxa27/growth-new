import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Sparkles, Heart, Brain, Target, Star } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: {
    value: string;
    text: string;
    score: number;
  }[];
}

interface AssessmentResult {
  type: string;
  title: string;
  description: string;
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
  color: string;
  icon: React.ReactNode;
}

const PublicAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const questions: Question[] = [
    {
      id: 'stress_response',
      text: 'When faced with a challenging situation, I typically:',
      options: [
        { value: 'analyze', text: 'Analyze the situation carefully before acting', score: 3 },
        { value: 'seek_support', text: 'Reach out to friends or family for advice', score: 2 },
        { value: 'take_action', text: 'Take immediate action to solve the problem', score: 4 },
        { value: 'feel_overwhelmed', text: 'Feel overwhelmed and need time to process', score: 1 }
      ]
    },
    {
      id: 'self_care',
      text: 'How often do you prioritize self-care in your daily routine?',
      options: [
        { value: 'daily', text: 'Daily - it\'s a non-negotiable part of my routine', score: 4 },
        { value: 'few_times_week', text: 'A few times a week when I remember', score: 3 },
        { value: 'occasionally', text: 'Occasionally when I feel particularly stressed', score: 2 },
        { value: 'rarely', text: 'Rarely - I struggle to make time for myself', score: 1 }
      ]
    },
    {
      id: 'emotional_awareness',
      text: 'When it comes to understanding my emotions, I:',
      options: [
        { value: 'very_aware', text: 'Am very aware of my emotions and their triggers', score: 4 },
        { value: 'somewhat_aware', text: 'Have some awareness but sometimes get confused', score: 3 },
        { value: 'struggle_identify', text: 'Struggle to identify what I\'m feeling in the moment', score: 2 },
        { value: 'prefer_not_focus', text: 'Prefer not to focus on emotions too much', score: 1 }
      ]
    },
    {
      id: 'goal_setting',
      text: 'My approach to personal goals is:',
      options: [
        { value: 'clear_structured', text: 'Clear and structured with specific timelines', score: 4 },
        { value: 'general_direction', text: 'I have a general direction but flexible approach', score: 3 },
        { value: 'vague_ideas', text: 'I have vague ideas but struggle with planning', score: 2 },
        { value: 'live_moment', text: 'I prefer to live in the moment without fixed goals', score: 1 }
      ]
    },
    {
      id: 'relationships',
      text: 'In my relationships with others, I tend to:',
      options: [
        { value: 'open_vulnerable', text: 'Be open and vulnerable, sharing my true feelings', score: 4 },
        { value: 'supportive_listening', text: 'Focus on being supportive and listening to others', score: 3 },
        { value: 'maintain_boundaries', text: 'Maintain clear boundaries and expectations', score: 2 },
        { value: 'keep_private', text: 'Keep my personal matters private', score: 1 }
      ]
    },
    {
      id: 'change_adaptation',
      text: 'When life changes unexpectedly, I:',
      options: [
        { value: 'embrace_opportunity', text: 'Embrace it as an opportunity for growth', score: 4 },
        { value: 'adapt_gradually', text: 'Adapt gradually with some initial resistance', score: 3 },
        { value: 'feel_anxious', text: 'Feel anxious but eventually find my way', score: 2 },
        { value: 'prefer_stability', text: 'Strongly prefer stability and predictability', score: 1 }
      ]
    },
    {
      id: 'inner_voice',
      text: 'My inner dialogue is typically:',
      options: [
        { value: 'encouraging_compassionate', text: 'Encouraging and compassionate', score: 4 },
        { value: 'practical_realistic', text: 'Practical and realistic', score: 3 },
        { value: 'critical_demanding', text: 'Critical and demanding', score: 2 },
        { value: 'anxious_worried', text: 'Anxious and worried', score: 1 }
      ]
    },
    {
      id: 'personal_growth',
      text: 'My attitude toward personal growth is:',
      options: [
        { value: 'passionate_committed', text: 'Passionate and committed - I actively seek growth', score: 4 },
        { value: 'interested_open', text: 'Interested and open when opportunities arise', score: 3 },
        { value: 'hesitant_cautious', text: 'Hesitant but cautious about making changes', score: 2 },
        { value: 'satisfied_current', text: 'Satisfied with who I am currently', score: 1 }
      ]
    }
  ];

  const calculateResult = (): AssessmentResult => {
    const totalScore = Object.values(answers).reduce((sum, answer) => {
      const question = questions.find(q => answers[q.id] === answer);
      const option = question?.options.find(opt => opt.value === answer);
      return sum + (option?.score || 0);
    }, 0);

    const maxScore = questions.length * 4;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage >= 85) {
      return {
        type: 'empowered_leader',
        title: 'The Empowered Leader',
        description: 'You demonstrate exceptional self-awareness and emotional intelligence. You\'re naturally equipped to navigate challenges with grace and inspire others through your authentic approach to growth.',
        strengths: [
          'High emotional intelligence and self-awareness',
          'Strong resilience and adaptability',
          'Natural leadership qualities',
          'Balanced approach to relationships and boundaries'
        ],
        growthAreas: [
          'Sharing your wisdom with others who are earlier in their journey',
          'Exploring advanced mindfulness and spiritual practices',
          'Developing systems to maintain your well-being during high-stress periods'
        ],
        recommendations: [
          'Consider mentoring or coaching others in their growth journey',
          'Explore advanced explorations like "Embodying Authentic Leadership"',
          'Join our Transformation tier for access to exclusive content and community'
        ],
        color: 'from-purple-500 to-pink-500',
        icon: <Star className="w-6 h-6" />
      };
    } else if (percentage >= 70) {
      return {
        type: 'conscious_explorer',
        title: 'The Conscious Explorer',
        description: 'You\'re on a beautiful journey of self-discovery with a solid foundation of self-awareness. You actively seek growth opportunities and have developed healthy coping strategies.',
        strengths: [
          'Good self-awareness and emotional regulation',
          'Open to growth and new experiences',
          'Healthy approach to relationships',
          'Developing resilience and coping strategies'
        ],
        growthAreas: [
          'Deepening your emotional intelligence',
          'Building stronger daily self-care routines',
          'Exploring your authentic values and purpose'
        ],
        recommendations: [
          'Try our themed explorations like "Discovering Your Authentic Self"',
          'Establish a daily mindfulness or journaling practice',
          'Consider our Growth tier for guided development programs'
        ],
        color: 'from-blue-500 to-purple-500',
        icon: <Brain className="w-6 h-6" />
      };
    } else if (percentage >= 55) {
      return {
        type: 'awakening_seeker',
        title: 'The Awakening Seeker',
        description: 'You\'re beginning to recognize the importance of personal growth and self-care. You have moments of clarity and are ready to develop deeper self-awareness and emotional skills.',
        strengths: [
          'Growing awareness of the importance of self-care',
          'Willingness to explore personal growth',
          'Developing emotional awareness',
          'Open to learning and changing'
        ],
        growthAreas: [
          'Building consistent self-care practices',
          'Developing emotional vocabulary and awareness',
          'Learning healthy coping strategies for stress',
          'Exploring your values and boundaries'
        ],
        recommendations: [
          'Start with our foundational explorations like "Building Self-Compassion"',
          'Try our guided breathing practices and daily affirmations',
          'Join our Discovery tier to begin your structured growth journey'
        ],
        color: 'from-green-500 to-blue-500',
        icon: <Target className="w-6 h-6" />
      };
    } else {
      return {
        type: 'emerging_butterfly',
        title: 'The Emerging Butterfly',
        description: 'You\'re at the beginning of a beautiful transformation. Every butterfly starts as a caterpillar, and your awareness that growth is possible is the first step toward profound change.',
        strengths: [
          'Courage to take this assessment and face your current reality',
          'Potential for significant positive change',
          'Opportunity to build strong foundations',
          'Fresh perspective on personal development'
        ],
        growthAreas: [
          'Developing basic emotional awareness and vocabulary',
          'Creating simple, sustainable self-care routines',
          'Learning to recognize and manage stress',
          'Building a supportive environment for growth'
        ],
        recommendations: [
          'Start with gentle self-compassion practices',
          'Explore our beginner-friendly breathing exercises',
          'Consider working with NewMe, our AI companion, for daily support',
          'Join our supportive community for encouragement and guidance'
        ],
        color: 'from-pink-500 to-rose-500',
        icon: <Heart className="w-6 h-6" />
      };
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const assessmentResult = calculateResult();
      setResult(assessmentResult);
      setShowResult(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const startOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setShowResult(false);
  };

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full glass-card border-glass">
          <CardHeader className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${result.color} flex items-center justify-center`}>
              <div className="text-white">
                {result.icon}
              </div>
            </div>
            <CardTitle className="text-3xl mb-2">{result.title}</CardTitle>
            <CardDescription className="text-lg leading-relaxed">
              {result.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" />
                  Growth Opportunities
                </h3>
                <ul className="space-y-2">
                  {result.growthAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-accent" />
                Recommended Next Steps
              </h3>
              <div className="grid gap-3">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={() => navigate('/auth')}
                className="flex-1 bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                Start Your Journey with NewMe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                onClick={startOver}
                variant="outline"
                className="glass-button"
                size="lg"
              >
                Take Assessment Again
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Join thousands of women on their journey of self-discovery and empowerment.
                <br />
                Your personal AI companion is waiting to support you every step of the way.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full glass-card border-glass">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              Free Personal Growth Assessment
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mb-4" />
          <CardTitle className="text-xl">
            Discover Your Personal Growth Profile
          </CardTitle>
          <CardDescription>
            This assessment will help you understand your current relationship with personal growth, 
            emotional well-being, and self-awareness.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {questions[currentQuestion].text}
            </h3>
            
            <RadioGroup 
              value={answers[questions[currentQuestion].id] || ''} 
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {questions[currentQuestion].options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer text-sm leading-relaxed">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              variant="outline"
              className="glass-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button 
              onClick={nextQuestion}
              disabled={!answers[questions[currentQuestion].id]}
              className="bg-gradient-primary hover:opacity-90"
            >
              {currentQuestion === questions.length - 1 ? 'Get My Results' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicAssessment;