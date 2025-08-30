import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  Heart,
  TrendingUp,
  Target,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'boolean' | 'multi_select';
  category?: string;
  is_required: boolean;
  order_index: number;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  value: string;
  score_weights: Record<string, number>;
}

interface Assessment {
  id: string;
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
    question: Question;
    order_index: number;
    is_required: boolean;
    weight: number;
  }[];
}

interface AssessmentResponse {
  [questionId: string]: any;
}

interface AssessmentTakerProps {
  assessment: Assessment;
  onComplete?: (results: any) => void;
  onBack?: () => void;
}

export const AssessmentTaker: React.FC<AssessmentTakerProps> = ({
  assessment,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse>({});
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(new Date());
  const [responseId, setResponseId] = useState<string | null>(null);
  const [visitorSession] = useState(() => 
    `visitor_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
  );
  const { user } = useAuth();
  const { toast } = useToast();

  // Sort questions by order_index
  const sortedQuestions = assessment.assessment_questions
    .sort((a, b) => a.order_index - b.order_index)
    .map(aq => aq.question);

  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sortedQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === sortedQuestions.length - 1;

  useEffect(() => {
    // Create initial assessment response record
    createAssessmentResponse();
  }, []);

  const createAssessmentResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .insert({
          assessment_id: assessment.id,
          user_id: user?.id || null,
          visitor_session_id: user ? null : visitorSession,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      setResponseId(data.id);
    } catch (error) {
      console.error('Error creating assessment response:', error);
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveQuestionResponse = async (questionId: string, response: any) => {
    if (!responseId) return;

    try {
      const { error } = await supabase
        .from('question_responses')
        .upsert({
          assessment_response_id: responseId,
          question_id: questionId,
          response_text: typeof response === 'string' ? response : null,
          response_value: typeof response === 'string' ? response : JSON.stringify(response),
          selected_options: Array.isArray(response) ? response : null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving question response:', error);
    }
  };

  const handleResponse = (value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    
    // Auto-save response
    saveQuestionResponse(currentQuestion.id, value);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    if (assessment.scoring_algorithm === 'personality_weights') {
      const scores: Record<string, number> = {};
      
      Object.entries(responses).forEach(([questionId, response]) => {
        const question = sortedQuestions.find(q => q.id === questionId);
        if (!question?.options) return;

        const selectedOption = question.options.find(opt => opt.value === response);
        if (!selectedOption?.score_weights) return;

        Object.entries(selectedOption.score_weights).forEach(([trait, weight]) => {
          scores[trait] = (scores[trait] || 0) + weight;
        });
      });

      // Determine primary personality type
      const primaryType = Object.entries(scores).reduce((a, b) => 
        scores[a[0]] > scores[b[0]] ? a : b
      )[0];

      return {
        primary_type: primaryType,
        scores,
        confidence_score: Math.min(100, Math.max(0, (scores[primaryType] / sortedQuestions.length) * 100))
      };
    }

    return { total_score: Object.keys(responses).length };
  };

  const completeAssessment = async () => {
    if (!responseId) return;

    setLoading(true);
    try {
      const results = calculateResults();
      const endTime = new Date();
      const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      // Update assessment response with results
      const { error } = await supabase
        .from('assessment_responses')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          total_score: results.confidence_score || results.total_score,
          result_type: results.primary_type,
          result_data: results,
          metadata: { time_spent_seconds: timeSpent }
        })
        .eq('id', responseId);

      if (error) throw error;

      toast({
        title: "Assessment Complete!",
        description: "Your results are ready to view.",
      });

      onComplete?.(results);
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionInput = () => {
    const currentResponse = responses[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentResponse || ''}
            onValueChange={handleResponse}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.id} />
                <Label 
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">
                {currentResponse || 5}
              </span>
            </div>
            <Slider
              value={[currentResponse || 5]}
              onValueChange={(value) => handleResponse(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Neutral</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={currentResponse || ''}
            onChange={(e) => handleResponse(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[120px]"
          />
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="true"
                id="yes"
                checked={currentResponse === true}
                onClick={() => handleResponse(true)}
              />
              <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="false"
                id="no"
                checked={currentResponse === false}
                onClick={() => handleResponse(false)}
              />
              <Label htmlFor="no" className="cursor-pointer">No</Label>
            </div>
          </div>
        );

      case 'multi_select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={(currentResponse || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = currentResponse || [];
                    if (checked) {
                      handleResponse([...currentValues, option.value]);
                    } else {
                      handleResponse(currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label 
                  htmlFor={option.id}
                  className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors flex-1"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (!currentQuestion.is_required) return true;
    
    const response = responses[currentQuestion.id];
    if (currentQuestion.type === 'multi_select') {
      return response && Array.isArray(response) && response.length > 0;
    }
    return response !== undefined && response !== null && response !== '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">{assessment.title}</h1>
          <p className="text-muted-foreground mt-2">{assessment.description}</p>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {assessment.assessment_type.estimated_duration} min
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Question {currentQuestionIndex + 1} of {sortedQuestions.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="w-full h-2" />
        <div className="text-center text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.text}
                </CardTitle>
                {currentQuestion.is_required && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    Required
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderQuestionInput()}
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={completeAssessment}
                    disabled={!canProceed() || loading}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Assessment
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={!canProceed()}
                  >
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AssessmentTaker;
