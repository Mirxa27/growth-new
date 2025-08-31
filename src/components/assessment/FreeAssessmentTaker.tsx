import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Assessment } from '@/data/assessments';

interface FreeAssessmentTakerProps {
  assessment: Assessment;
  onComplete: (results: any) => void;
  onBack: () => void;
}

interface QuestionAnswer {
  questionId: string;
  answer: any;
  questionText: string;
  questionType: string;
}

export const FreeAssessmentTaker: React.FC<FreeAssessmentTakerProps> = ({
  assessment,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, answer: any) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    const answerData: QuestionAnswer = {
      questionId,
      answer,
      questionText: currentQuestion.text,
      questionType: currentQuestion.type
    };

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = answerData;
      setAnswers(newAnswers);
    } else {
      setAnswers([...answers, answerData]);
    }
  };

  const getCurrentAnswer = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.answer;
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload expected by the submit-result Edge Function
      const payload = {
        assessment_id: assessment.id,
        answers: answers.map(a => ({
          question_id: a.questionId,
          value: a.answer
        })),
        time_taken_seconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        meta: {
          source: 'web-free-assessment'
        }
      };

      // Prefer using Supabase Functions client; fallback to fetch if unavailable
      let responseData: any = null;
      try {
        // supabase.functions.invoke returns { data, error } in the client library
        // Use invoke to call the Edge Function named "submit-result"
        // @ts-ignore - functions might not be typed in all environments
        const fn = (supabase as any).functions?.invoke
          ? await (supabase as any).functions.invoke('submit-result', { body: JSON.stringify(payload) })
          : null;

        if (fn && fn.data) {
          responseData = typeof fn.data === 'string' ? JSON.parse(fn.data) : fn.data;
        } else if (fn && fn.error) {
          throw fn.error;
        } else {
          // Fallback: call the direct Supabase Functions URL
          const SUPABASE_URL = (supabase as any).url || '';
          const SUPABASE_KEY = (supabase as any).anonKey || '';
          const resp = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/submit-result`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY
            },
            body: JSON.stringify(payload)
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Function call failed: ${resp.status} ${text}`);
          }
          responseData = await resp.json();
        }
      } catch (fnErr) {
        console.error('Function invocation failed, attempting direct DB insert as fallback:', fnErr);
        throw new Error('Failed to process assessment results on server.');
      }

      // Normalize and pass to onComplete
      onComplete(responseData);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit assessment. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = getCurrentAnswer(currentQuestion.id);

    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {assessment.estimatedTime} min
            </span>
          </div>
          <CardTitle className="text-lg leading-tight">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'single' && (
            <RadioGroup 
              value={currentAnswer || ''} 
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'multiple' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Checkbox
                    id={`multi-${index}`}
                    checked={currentAnswer?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentAnswers = currentAnswer || [];
                      const newAnswers = checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter((a: string) => a !== option);
                      handleAnswer(currentQuestion.id, newAnswers);
                    }}
                  />
                  <Label htmlFor={`multi-${index}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <Slider
                value={[currentAnswer || 3]}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Strongly Disagree</span>
                <span>Neutral</span>
                <span>Strongly Agree</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold">{currentAnswer || 3}</span>
              </div>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full text-sm"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-destructive text-lg mb-2">No Questions Found</div>
            <p className="text-gray-600 mb-4">This assessment doesn't have any questions yet.</p>
            <Button variant="outline" onClick={onBack}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-gray-600 text-sm">{assessment.description}</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question */}
        {renderQuestion()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !getCurrentAnswer(currentQuestion.id)}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin">⟳</div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!getCurrentAnswer(currentQuestion.id)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};