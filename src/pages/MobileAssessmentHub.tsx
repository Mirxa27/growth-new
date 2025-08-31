import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, Target, Sparkles, BookOpen, Users, Heart, TrendingUp } from 'lucide-react';
// import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import our new components
import { AssessmentBrowser } from '@/components/assessment/AssessmentBrowser';
import AssessmentTaker from '@/components/assessment/AssessmentTaker';
import { AssessmentResults } from '@/components/assessment/AssessmentResults';
import QuizBrowser from '@/components/quiz/QuizBrowser';
import QuizTaker from '@/components/quiz/QuizTaker';

interface Assessment {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  is_public: boolean;
  scoring_algorithm: string;
  assessment_type: {
    estimated_duration: number;
    category: string;
  };
  assessment_questions: {
    question: any;
    order_index: number;
    is_required: boolean;
    weight: number;
  }[];
}

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

type ViewMode = 'home' | 'assessment-browser' | 'assessment-taking' | 'assessment-results' | 'quiz-browser' | 'quiz-taking';

const MobileAssessmentHub: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [, setQuizResults] = useState<any>(null);
  const navigate = useNavigate();

  const handleAssessmentSelect = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setViewMode('assessment-taking');
  };

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setViewMode('quiz-taking');
  };

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results);
    setViewMode('assessment-results');
  };

  const handleQuizComplete = (results: any) => {
    setQuizResults(results);
    setViewMode('home'); // Quiz results are shown within QuizTaker
  };

  const goBack = () => {
    switch (viewMode) {
      case 'assessment-taking':
      case 'quiz-taking':
        setViewMode('home');
        setSelectedAssessment(null);
        setSelectedQuiz(null);
        break;
      case 'assessment-results':
        setViewMode('home');
        setAssessmentResults(null);
        break;
      case 'assessment-browser':
      case 'quiz-browser':
        setViewMode('home');
        break;
      default:
        navigate('/');
    }
  };

  const featuredContent = [
    {
      type: 'assessment',
      title: 'Personality Discovery',
      description: 'Uncover your core personality traits and natural tendencies',
      category: 'personality',
      icon: Brain,
      color: 'from-purple-400 to-pink-400',
      estimatedTime: 15,
      isPublic: true
    },
    {
      type: 'quiz',
      title: 'Stress Management Basics',
      description: 'Test your knowledge of stress management techniques',
      category: 'wellness',
      icon: Heart,
      color: 'from-green-400 to-teal-400',
      estimatedTime: 10,
      isPublic: true
    },
    {
      type: 'assessment',
      title: 'Relationship Style',
      description: 'Understand your attachment patterns and relationship approach',
      category: 'relationships',
      icon: Users,
      color: 'from-pink-400 to-rose-400',
      estimatedTime: 12,
      isPublic: true
    },
    {
      type: 'assessment',
      title: 'Life Balance Check',
      description: 'Assess your current life balance across key areas',
      category: 'lifestyle',
      icon: TrendingUp,
      color: 'from-blue-400 to-indigo-400',
      estimatedTime: 8,
      isPublic: true
    }
  ];

  const categories = [
    { id: 'assessments', label: 'Assessments', icon: Brain, count: '20+' },
    { id: 'quizzes', label: 'Quizzes', icon: Target, count: '15+' },
    { id: 'explorations', label: 'Explorations', icon: Sparkles, count: '30+' },
    { id: 'courses', label: 'Courses', icon: BookOpen, count: '5+' }
  ];

  // Render different views based on current mode
  if (viewMode === 'assessment-taking' && selectedAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
        <AssessmentTaker
          assessmentId={selectedAssessment.id}
          onComplete={handleAssessmentComplete}
          onBack={goBack}
        />
      </div>
    );
  }

  if (viewMode === 'assessment-results' && assessmentResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
        <AssessmentResults
          results={assessmentResults}
          assessmentTitle={selectedAssessment?.title || 'Assessment'}
          assessmentCategory={selectedAssessment?.assessment_type.category || 'general'}
          onRetake={() => {
            setAssessmentResults(null);
            setViewMode('assessment-taking');
          }}
          onNewAssessment={() => {
            setAssessmentResults(null);
            setSelectedAssessment(null);
            setViewMode('home');
          }}
        />
      </div>
    );
  }

  if (viewMode === 'quiz-taking' && selectedQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
        <QuizTaker
          quiz={selectedQuiz}
          onComplete={handleQuizComplete}
          onBack={goBack}
        />
      </div>
    );
  }

  if (viewMode === 'assessment-browser') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>
        </div>
        <AssessmentBrowser
          onAssessmentSelect={handleAssessmentSelect as any}
          filterPublic={true}
        />
      </div>
    );
  }

  if (viewMode === 'quiz-browser') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>
        </div>
        <QuizBrowser
          onQuizSelect={handleQuizSelect as any}
          filterPublic={true}
        />
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Discovery Hub
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore your inner world with free assessments, quizzes, and guided explorations. 
              No signup required - start your journey of self-discovery now.
            </p>
          </div>
        </div>

        {/* Quick Access Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="glass hover:glass-glow transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  if (category.id === 'assessments') setViewMode('assessment-browser');
                  if (category.id === 'quizzes') setViewMode('quiz-browser');
                }}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.label}</h3>
                    <p className="text-sm text-muted-foreground">{category.count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Featured Content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Start Your Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredContent.map((content, index) => {
              const Icon = content.icon;
              return (
                <div
                  key={index}
                  className="h-full"
                >
                  <Card className="h-full glass hover:glass-glow transition-all duration-300 cursor-pointer group">
                    <div className={`h-2 bg-gradient-to-r ${content.color}`}></div>
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-white/50 rounded-lg">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {content.category}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Free
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{content.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {content.description}
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{content.estimatedTime} minutes</span>
                        <span>{content.type}</span>
                      </div>
                      
                      <Button 
                        className="w-full group-hover:bg-primary/90 transition-colors"
                        onClick={() => {
                          if (content.type === 'assessment') {
                            setViewMode('assessment-browser');
                          } else if (content.type === 'quiz') {
                            setViewMode('quiz-browser');
                          }
                        }}
                      >
                        Start {content.type === 'assessment' ? 'Assessment' : 'Quiz'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="text-center space-y-4">
          <Card className="glass border-primary/20">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Why Start Your Journey Here?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium">Free & Instant</h4>
                  <p className="text-muted-foreground">No signup required. Start exploring immediately.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium">Science-Based</h4>
                  <p className="text-muted-foreground">Backed by psychology and personal development research.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium">Personalized</h4>
                  <p className="text-muted-foreground">Tailored insights and recommendations just for you.</p>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-muted-foreground text-sm">
                  Ready for deeper growth? 
                  <Button variant="link" className="p-0 h-auto font-normal" onClick={() => navigate('/auth')}>
                    Create a free account
                  </Button> 
                  to access advanced assessments and track your progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MobileAssessmentHub;