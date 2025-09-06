import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { MobileNavigation } from '@/components/MobileNavigation';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Star,
  Target,
  BookOpen,
  Heart,
  AlertCircle,
  Clock,
  Users,
  Play,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RealAssessmentService } from '@/services/realAssessmentService';
import { Assessment, AssessmentResult } from '@/types/assessment';
import { useAuth } from '@/hooks/useAuth';

interface AssessmentPageState {
  loading: boolean;
  assessments: Assessment[];
  selectedAssessment: Assessment | null;
  currentQuestion: number;
  responses: Record<string, string | number | boolean | string[]>;
  showResults: boolean;
  results: AssessmentResult | null;
  submitting: boolean;
  error: string | null;
}

const PublicAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [state, setState] = useState<AssessmentPageState>({
    loading: true,
    assessments: [],
    selectedAssessment: null,
    currentQuestion: 0,
    responses: {},
    showResults: false,
    results: null,
    submitting: false,
    error: null
  });

  // Load public assessments on mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const assessments = await RealAssessmentService.getPublicAssessments();
        setState(prev => ({ ...prev, assessments, loading: false }));
      } catch (error) {
        console.error('Failed to load assessments:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load assessments' 
        }));
        toast({
          title: "Error",
          description: "Failed to load assessments. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadAssessments();
  }, [toast]);

  // Select an assessment to take
  const selectAssessment = useCallback((assessment: Assessment) => {
    setState(prev => ({
      ...prev,
      selectedAssessment: assessment,
      currentQuestion: 0,
      responses: {},
      showResults: false,
      results: null
    }));
  }, []);

  // Handle question response
  const handleResponse = useCallback((questionId: string, value: string | number | boolean | string[]) => {
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: value
      }
    }));
  }, []);

  // Navigate between questions
  const navigateToQuestion = useCallback((direction: 'next' | 'prev') => {
    setState(prev => {
      const { selectedAssessment, currentQuestion } = prev;
      if (!selectedAssessment) return prev;

      const questionsLength = selectedAssessment.questions?.length || 0;
      let newQuestionIndex = currentQuestion;

      if (direction === 'next' && currentQuestion < questionsLength - 1) {
        newQuestionIndex = currentQuestion + 1;
      } else if (direction === 'prev' && currentQuestion > 0) {
        newQuestionIndex = currentQuestion - 1;
      }

      return { ...prev, currentQuestion: newQuestionIndex };
    });
  }, []);

  // Submit assessment
  const submitAssessment = useCallback(async () => {
    const { selectedAssessment, responses } = state;
    if (!selectedAssessment) return;

    try {
      setState(prev => ({ ...prev, submitting: true }));
      
      const result = await RealAssessmentService.submitAssessment({
        assessmentId: selectedAssessment.id,
        responses
      });

      setState(prev => ({ 
        ...prev, 
        results: result,
        showResults: true,
        submitting: false
      }));

      toast({
        title: "Assessment Complete!",
        description: "Your results are ready. Discover your insights below.",
      });

    } catch (error) {
      setState(prev => ({ ...prev, submitting: false }));
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  }, [state, toast]);

  const resetAssessment = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedAssessment: null,
      currentQuestion: 0,
      responses: {},
      showResults: false,
      results: null
    }));
  }, []);

  // Get assessment icon based on type
  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'personality': return <Brain className="w-6 h-6 text-purple-300" />;
      case 'career': return <Target className="w-6 h-6 text-blue-300" />;
      case 'relationships': return <Heart className="w-6 h-6 text-pink-300" />;
      default: return <Star className="w-6 h-6 text-yellow-300" />;
    }
  };

  // Render assessment selection
  const renderAssessmentSelection = () => (
    <div className="space-y-12">
      {/* Hero Section - Matching Auth Page Style */}
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium text-white/90">Discover Your True Self</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Personality 
          <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"> Assessment</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4 mb-8">
          Unlock deep insights about your personality, strengths, and growth areas through our 
          scientifically-designed assessments powered by AI analysis.
        </p>

        {!user && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md mx-auto">
            <p className="text-purple-200 font-medium mb-4 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5" />
              Create a free account to save your results!
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium"
            >
              Sign Up Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Assessment Grid - Glassmorphism Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.assessments.map((assessment) => (
          <Card 
            key={assessment.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-white/15 hover:border-white/30"
            onClick={() => selectAssessment(assessment)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                {getAssessmentIcon(assessment.type)}
                <Badge className="bg-white/20 text-white/90 text-xs px-3 py-1 rounded-full">
                  {assessment.type}
                </Badge>
              </div>
              
              <CardTitle className="text-lg font-bold text-white mb-3 line-clamp-2 leading-tight">
                {assessment.title}
              </CardTitle>
              
              <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
                {assessment.description}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-6 text-xs text-white/60">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{assessment.questions?.length || 10} questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3" />
                  <span>~{Math.ceil((assessment.questions?.length || 10) * 0.5)} min</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium shadow-lg border-0"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section - Glassmorphism Style */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Why Our Assessments?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Brain className="w-10 h-10 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">AI-Powered Insights</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Advanced AI analysis provides personalized insights and recommendations for your unique growth journey.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Users className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Scientifically Validated</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Based on established psychological frameworks and validated through extensive research.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Star className="w-10 h-10 text-pink-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Personalized Results</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Receive customized feedback and actionable steps tailored to your personality and goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render question taking interface
  const renderQuestionTaking = () => {
    const { selectedAssessment, currentQuestion, responses } = state;
    if (!selectedAssessment || !selectedAssessment.questions) return null;

    const question = selectedAssessment.questions[currentQuestion];
    if (!question) return null;

    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;
    const canGoNext = responses[question.id] !== undefined;
    const canGoPrev = currentQuestion > 0;
    const isLastQuestion = currentQuestion === selectedAssessment.questions.length - 1;

    return (
      <div className="space-y-8">
        {/* Header with Progress - Glassmorphism Style */}
        <div className="text-center">
          <Button
            variant="ghost" 
            onClick={resetAssessment}
            className="text-white/70 hover:text-white hover:bg-white/10 mb-8 backdrop-blur-md border border-white/20 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              {selectedAssessment.title}
            </h2>
            <p className="text-white/80 mb-6 text-lg">
              Question {currentQuestion + 1} of {selectedAssessment.questions.length}
            </p>
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card - Glassmorphism Style */}
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl max-w-4xl mx-auto">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-white leading-relaxed text-center">
              {question.text || question.question_text}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {question.type === 'multiple_choice' ? (
              <RadioGroup
                value={String(responses[question.id] || '')}
                onValueChange={(value) => handleResponse(question.id, value)}
                className="space-y-4"
              >
                {question.options?.map((option, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem 
                        value={String(index)} 
                        id={`option-${index}`}
                        className="border-white/40 text-purple-300 focus:ring-purple-300"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-white flex-1 cursor-pointer leading-relaxed text-base"
                      >
                        {typeof option === 'string' ? option : option.text || option.option_text}
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={String(responses[question.id] || '')}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full min-h-[140px] p-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-purple-300 focus:ring-2 focus:ring-purple-300/20 resize-none text-base"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation - Glassmorphism Buttons */}
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigateToQuestion('prev')}
            disabled={!canGoPrev}
            className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/40 py-3 px-6 rounded-xl font-medium disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={submitAssessment}
              disabled={!canGoNext || state.submitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-8 rounded-xl font-medium shadow-lg disabled:opacity-50"
            >
              {state.submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Complete Assessment
                  <CheckCircle className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => navigateToQuestion('next')}
              disabled={!canGoNext}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-8 rounded-xl font-medium shadow-lg disabled:opacity-50"
            >
              Next Question
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    const { results, selectedAssessment } = state;
    if (!results || !selectedAssessment) return null;

    return (
      <div className="space-y-8">
        {/* Results Header - Glassmorphism Style */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 border border-white/20">
            <CheckCircle className="w-16 h-16 text-green-300" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6">
            Assessment Complete!
          </h1>
          
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            You've completed the <span className="text-purple-300 font-semibold">{selectedAssessment.title}</span> assessment.
            Here are your personalized insights.
          </p>
        </div>

        {/* Results Cards - Glassmorphism Style */}
        <div className="grid gap-8 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-purple-300" />
                Your Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-300 mb-4">
                  {results.percentage}%
                </div>
                <p className="text-white/70 text-lg">
                  {results.score} out of {results.maxScore} points
                </p>
              </div>
            </CardContent>
          </Card>

          {results.insights && results.insights.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <Brain className="w-6 h-6 text-blue-300" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <Sparkles className="w-5 h-5 text-purple-300 mt-1 flex-shrink-0" />
                      <p className="text-white/80 leading-relaxed text-base">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.recommendations && results.recommendations.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <BookOpen className="w-6 h-6 text-pink-300" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <Star className="w-5 h-5 text-pink-300 mt-1 flex-shrink-0" />
                      <p className="text-white/80 leading-relaxed text-base">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons - Glassmorphism Style */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-md mx-auto">
          <Button
            onClick={resetAssessment}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-8 rounded-xl font-medium shadow-lg"
          >
            Take Another Assessment
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/40 py-3 px-8 rounded-xl font-medium"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 px-12">
          <Loader2 className="w-12 h-12 text-purple-300 mb-6 animate-spin" />
          <p className="text-white/80 text-lg">Loading assessments...</p>
        </CardContent>
      </Card>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="bg-white/10 backdrop-blur-md border border-red-300/30 rounded-2xl max-w-md">
        <CardContent className="text-center py-16 px-12">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-white mb-4">Unable to Load Assessments</h3>
          <p className="text-white/70 mb-8 leading-relaxed">{state.error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-medium"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background - Matching Auth Page */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/hero-meditation.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Deep Purple Glassmorphism Overlay - Exact Match to Auth Page */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-violet-900/90 to-indigo-900/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/30 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-pulse opacity-40" />
        <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-purple-300/30 animate-pulse delay-1000 opacity-30" />
        <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse delay-2000 opacity-25" />
        <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-purple-300/25 animate-pulse delay-500 opacity-20" />
        <div className="absolute bottom-[20%] left-[30%] w-2 h-2 rounded-full bg-white/10 animate-pulse delay-3000 opacity-15" />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {state.loading && renderLoading()}
          {state.error && renderError()}
          {!state.loading && !state.error && !state.selectedAssessment && renderAssessmentSelection()}
          {!state.loading && !state.error && state.selectedAssessment && !state.showResults && renderQuestionTaking()}
          {!state.loading && !state.error && state.showResults && renderResults()}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default PublicAssessment;