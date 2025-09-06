import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RealAssessmentService } from '@/services/realAssessmentService';
import { Assessment, AssessmentResult } from '@/types/assessment';

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

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestion: Math.min(prev.currentQuestion + 1, (prev.selectedAssessment?.questions.length || 1) - 1)
    }));
  }, []);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0)
    }));
  }, []);

  // Submit assessment
  const submitAssessment = useCallback(async () => {
    if (!state.selectedAssessment) return;

    try {
      setState(prev => ({ ...prev, submitting: true, error: null }));
      
      const result = await RealAssessmentService.submitAssessment({
        assessmentId: state.selectedAssessment.id,
        userId: null, // Anonymous submission for public assessments
        responses: state.responses
      });

      setState(prev => ({
        ...prev,
        submitting: false,
        showResults: true,
        results: result
      }));

      toast({
        title: "Assessment Completed!",
        description: "Your results are ready to view.",
      });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit assessment';
      setState(prev => ({ ...prev, submitting: false, error: errorMessage }));
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [state.selectedAssessment, state.responses, toast]);

  // Reset to assessment selection
  const resetToSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedAssessment: null,
      currentQuestion: 0,
      responses: {},
      showResults: false,
      results: null,
      error: null
    }));
  }, []);

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 text-center">Loading assessments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.error && !state.selectedAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Assessments</h3>
                <p className="text-gray-600 mb-4">{state.error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment selection screen
  if (!state.selectedAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Free Public Assessments
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover more about yourself with our scientifically-backed personality and skills assessments.
              No signup required - get instant results!
            </p>
          </div>

          {/* Assessment Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {state.assessments.map((assessment) => (
              <Card 
                key={assessment.id} 
                className="group hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => selectAssessment(assessment)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {assessment.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {assessment.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {assessment.estimatedTime}min
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {assessment.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {assessment.questions.length} questions
                    </span>
                    <Button size="sm" className="group-hover:bg-blue-600 group-hover:text-white">
                      Start Assessment
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {state.assessments.length === 0 && (
            <Card className="mt-8">
              <CardContent className="pt-8">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Available</h3>
                  <p className="text-gray-600">
                    Check back later for new assessments, or contact support if you believe this is an error.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  if (state.showResults && state.results) {
    const { results } = state;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Assessment Complete!
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Here are your personalized results
              </p>
            </CardHeader>
          </Card>

          {/* Score Overview */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {Math.round(results.percentage)}%
                  </div>
                  <p className="text-sm text-gray-600">Overall Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {results.score}
                  </div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {results.totalScore}
                  </div>
                  <p className="text-sm text-gray-600">Total Possible</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personality Type (if applicable) */}
          {results.personalityType && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Your Personality Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {results.personalityType}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 text-blue-500 mr-2" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.insights?.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <Sparkles className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 text-green-500 mr-2" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.recommendations?.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetToSelection} variant="outline">
              Take Another Assessment
            </Button>
            <Button onClick={() => navigate('/auth')}>
              <Heart className="w-4 h-4 mr-2" />
              Sign Up for More Features
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment taking screen
  const currentQ = state.selectedAssessment.questions[state.currentQuestion];
  const progress = ((state.currentQuestion + 1) / state.selectedAssessment.questions.length) * 100;
  const isLastQuestion = state.currentQuestion === state.selectedAssessment.questions.length - 1;
  const hasAnswer = currentQ.id in state.responses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {state.selectedAssessment.title}
          </h1>
          <Progress value={progress} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-gray-600 mt-2">
            Question {state.currentQuestion + 1} of {state.selectedAssessment.questions.length}
          </p>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {currentQ.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQ.type === 'single' && (
              <RadioGroup 
                value={state.responses[currentQ.id] as string || ""} 
                onValueChange={(value) => handleResponse(currentQ.id, value)}
              >
                <div className="space-y-3">
                  {currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={typeof option === 'string' ? option : option.text} 
                        id={`option-${index}`} 
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {typeof option === 'string' ? option : option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQ.type === 'scale' && currentQ.scale && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{currentQ.scale.min}</span>
                  <span>{currentQ.scale.max}</span>
                </div>
                <input
                  type="range"
                  min={currentQ.scale.min}
                  max={currentQ.scale.max}
                  value={state.responses[currentQ.id] as number || currentQ.scale.min}
                  onChange={(e) => handleResponse(currentQ.id, parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {state.responses[currentQ.id] || currentQ.scale.min}
                  </span>
                </div>
              </div>
            )}

            {currentQ.type === 'text' && (
              <textarea
                placeholder="Enter your response..."
                value={state.responses[currentQ.id] as string || ""}
                onChange={(e) => handleResponse(currentQ.id, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={previousQuestion}
            disabled={state.currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button onClick={resetToSelection} variant="ghost" size="sm">
            Exit Assessment
          </Button>

          {isLastQuestion ? (
            <Button 
              onClick={submitAssessment}
              disabled={!hasAnswer || state.submitting}
              className={cn(
                "min-w-[120px]",
                hasAnswer && "bg-green-600 hover:bg-green-700"
              )}
            >
              {state.submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {state.submitting ? 'Submitting...' : 'Complete Assessment'}
            </Button>
          ) : (
            <Button 
              onClick={nextQuestion}
              disabled={!hasAnswer}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Error Display */}
        {state.error && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{state.error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicAssessment;