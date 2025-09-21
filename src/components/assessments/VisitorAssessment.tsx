import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { visitorAssessments, VisitorAssessment, VisitorQuestion, ResultCategory } from '@/data/visitor-assessments';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Star,
  Share2,
  Download,
  RotateCcw,
  TrendingUp
} from 'lucide-react';

interface VisitorResponse {
  questionId: string;
  value: number;
  category?: string;
}

export const VisitorAssessmentComponent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<VisitorAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<VisitorResponse[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ResultCategory | null>(null);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load assessment data
  useEffect(() => {
    if (slug) {
      const foundAssessment = visitorAssessments.find(a => a.slug === slug && a.isActive);
      if (foundAssessment) {
        setAssessment(foundAssessment);
      } else {
        toast({
          title: 'Assessment Not Found',
          description: 'The requested assessment could not be found.',
          variant: 'destructive',
        });
        navigate('/assessments');
      }
    }
  }, [slug, navigate, toast]);

  const currentQuestion = assessment?.questions[currentQuestionIndex];
  const progress = assessment ? ((currentQuestionIndex + 1) / assessment.questions.length) * 100 : 0;

  /**
   * Handle response change
   */
  const handleResponseChange = (value: number, category?: string) => {
    if (!currentQuestion) return;

    const newResponse: VisitorResponse = {
      questionId: currentQuestion.id,
      value,
      category: category || currentQuestion.category,
    };

    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
      return [...filtered, newResponse];
    });
  };

  /**
   * Get current response
   */
  const getCurrentResponse = (): VisitorResponse | undefined => {
    return responses.find(r => r.questionId === currentQuestion?.id);
  };

  /**
   * Check if current question is answered
   */
  const isCurrentQuestionAnswered = (): boolean => {
    return getCurrentResponse() !== undefined;
  };

  /**
   * Go to next question
   */
  const handleNext = () => {
    if (!assessment || !isCurrentQuestionAnswered()) return;

    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  /**
   * Go to previous question
   */
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  /**
   * Calculate result
   */
  const calculateResult = (): ResultCategory | null => {
    if (!assessment || responses.length === 0) return null;

    // Calculate total score
    const totalScore = responses.reduce((sum, response) => sum + response.value, 0);

    // Find matching result category
    const matchingCategory = assessment.resultCategories.find(category => 
      totalScore >= category.minScore && totalScore <= category.maxScore
    );

    return matchingCategory || assessment.resultCategories[0];
  };

  /**
   * Submit assessment
   */
  const handleSubmit = async () => {
    if (!assessment) return;

    setIsSubmitting(true);

    try {
      // Calculate result
      const calculatedResult = calculateResult();
      setResult(calculatedResult);

      // Mark as completed
      setIsCompleted(true);

      // Store result in localStorage for potential later use
      const assessmentResult = {
        assessmentId: assessment.id,
        responses,
        result: calculatedResult,
        completedAt: new Date().toISOString(),
        duration: Date.now() - startTime.getTime(),
      };

      localStorage.setItem(`visitor_assessment_${assessment.id}`, JSON.stringify(assessmentResult));

      toast({
        title: 'Assessment Completed!',
        description: 'Your results are ready to view.',
      });

    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: 'Error',
        description: 'There was an error processing your assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Restart assessment
   */
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setResponses([]);
    setIsCompleted(false);
    setResult(null);
  };

  /**
   * Share result
   */
  const handleShare = async () => {
    if (!assessment || !result) return;

    const shareData = {
      title: `My ${assessment.title} Result`,
      text: `I just completed the ${assessment.title} and got: ${result.name}. ${result.description}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: 'Copied to Clipboard',
          description: 'Share text copied to clipboard!',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  /**
   * Download result as PDF (placeholder)
   */
  const handleDownload = () => {
    toast({
      title: 'Download Feature',
      description: 'PDF download will be available soon. For now, you can screenshot your results.',
    });
  };

  /**
   * Render question content
   */
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const currentResponse = getCurrentResponse();

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentResponse?.value?.toString() || ""}
            onValueChange={(value) => {
              const option = currentQuestion.options?.find(opt => opt.value.toString() === value);
              if (option) {
                handleResponseChange(option.value, option.category);
              }
            }}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={option.value.toString()} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'scale':
        return (
          <div className="space-y-6">
            <div className="px-4">
              <Slider
                value={currentResponse ? [currentResponse.value] : [5]}
                onValueChange={([value]) => handleResponseChange(value, currentQuestion.category)}
                min={currentQuestion.scaleMin || 1}
                max={currentQuestion.scaleMax || 10}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground px-2">
              <span>{currentQuestion.scaleLabels?.min}</span>
              <span className="font-semibold text-primary">
                {currentResponse?.value || Math.floor(((currentQuestion.scaleMax || 10) + (currentQuestion.scaleMin || 1)) / 2)}
              </span>
              <span>{currentQuestion.scaleLabels?.max}</span>
            </div>
          </div>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={currentResponse?.value?.toString() || ""}
            onValueChange={(value) => handleResponseChange(parseInt(value), currentQuestion.category)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="1" id="true" />
              <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="0" id="false" />
              <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  /**
   * Render result page
   */
  const renderResult = () => {
    if (!assessment || !result) return null;

    const totalScore = responses.reduce((sum, response) => sum + response.value, 0);
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000 / 60);

    return (
      <div className="space-y-6">
        {/* Result Header */}
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full ${result.color} flex items-center justify-center text-white text-2xl font-bold`}>
                <Star className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">{result.name}</CardTitle>
            <CardDescription className="text-lg">
              {result.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <div className="font-semibold">Your Score</div>
                <div>{totalScore} points</div>
              </div>
              <div>
                <div className="font-semibold">Time Taken</div>
                <div>{duration} minutes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recommendations for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={handleShare} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleRestart} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Again
          </Button>
          <Button onClick={() => navigate('/assessments')} className="bg-primary">
            Explore More Assessments
          </Button>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="text-center py-6">
            <h3 className="text-lg font-semibold mb-2">Want More Personalized Insights?</h3>
            <p className="text-muted-foreground mb-4">
              Create a free account to access 20+ detailed assessments, track your progress, and get personalized growth plans.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/auth/register')} className="bg-primary">
                Create Free Account
              </Button>
              <Button onClick={() => navigate('/auth/login')} variant="outline">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {renderResult()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className={`text-lg ${assessment.icon}`}>{assessment.icon}</span>
            <span className="capitalize">{assessment.category}</span>
            <span>•</span>
            <Clock className="w-4 h-4" />
            <span>{assessment.estimatedTime} min</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-gray-600 mt-2">{assessment.description}</p>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} of {assessment.questions.length}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <CardDescription className="text-lg">
              {currentQuestion?.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderQuestionContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {assessment.questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < currentQuestionIndex
                    ? 'bg-green-500'
                    : index === currentQuestionIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
            className="bg-primary"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : currentQuestionIndex === assessment.questions.length - 1 ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {currentQuestionIndex === assessment.questions.length - 1 ? 'Complete Assessment' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VisitorAssessmentComponent;