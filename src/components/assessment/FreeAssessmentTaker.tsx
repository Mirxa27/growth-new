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
import { Assessment } from '@/types/assessment';
import { useToast } from '@/hooks/use-toast';
import { errorHandler, ErrorSeverity, ErrorCategory } from '@/services/error/error-handler.service';

type AnswerValue = string | number | boolean | string[];

interface FreeAssessmentTakerProps {
  assessment: Assessment;
  onComplete: (results: AssessmentResults) => void;
  onBack: () => void;
}

interface AssessmentResults {
  responses: Record<string, AnswerValue>;
  score: number;
  maxScore: number;
  percentage: number;
  personalityType?: string;
  insights?: string[];
  recommendations?: string[];
  nextSteps?: string[];
  analysis?: Record<string, unknown>;
  feedback?: string;
}

interface QuestionAnswer {
  questionId: string;
  answer: AnswerValue;
  questionText: string;
  questionType: string;
}

export const FreeAssessmentTaker: React.FC<FreeAssessmentTakerProps> = ({
  assessment,
  onComplete,
  onBack
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, answer: AnswerValue) => {
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

  const getOrCreateVisitorSessionId = () => {
    try {
      const key = 'visitor_session_id';
      let id = (typeof localStorage !== 'undefined') ? localStorage.getItem(key) : null;
      if (!id) {
        const rand = crypto?.getRandomValues?.(new Uint8Array(16));
        const hex = rand ? Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('') : Math.random().toString(36).slice(2);
        id = `visitor_${hex}`;
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return `visitor_${Date.now()}`;
    }
  };

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      toast({ title: 'Incomplete', description: 'Please answer all questions before submitting.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      const visitor_session_id = userId ? null : getOrCreateVisitorSessionId();

      const payload = {
        assessment_id: assessment.id,
        client_questions: (assessment.questions || []).map(q => ({
          id: String(q.id),
          text: q.text,
          type: q.type as 'single' | 'multiple' | 'scale' | 'text',
          options: q.options,
          scale: q.scale
        })),
        answers: answers.map(a => ({
          question_id: a.questionId,
          value: a.answer
        })),
        user_id: userId,
        visitor_session_id,
        time_taken_seconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        meta: {
          source: 'web-free-assessment',
          assessment_title: assessment.title,
          assessment_type: assessment.type,
        }
      };

      const { data, error } = await supabase.functions.invoke('submit-result', { body: payload });
      if (error) {
        throw error;
      }

      const totalQuestions = questions.length;
      const answeredQuestions = answers.length;
      const completionTime = payload.time_taken_seconds;
      const score = answeredQuestions;
      const maxScore = totalQuestions;
      const percentage = Math.round((score / maxScore) * 100);

      // Convert answers to responses format
      const responses: Record<string, AnswerValue> = {};
      answers.forEach(answer => {
        responses[answer.questionId] = answer.answer;
      });

      const results: AssessmentResults = {
        responses,
        score,
        maxScore,
        percentage,
        personalityType: data?.personality_type || 'Unknown',
        insights: data?.insights || [`You completed ${percentage}% of the assessment.`],
        recommendations: data?.recommendations || ['Continue your personal growth journey.'],
        nextSteps: data?.next_steps || ['Review your results and plan next actions.'],
        analysis: {
          totalQuestions,
          answeredQuestions,
          completionTime,
          ...data?.analysis
        },
        feedback: data?.feedback || `Assessment completed with ${answeredQuestions} out of ${totalQuestions} questions answered.`
      };

      onComplete(results);
      toast({ title: 'Assessment Complete', description: 'Your results are ready.', duration: 2500 });
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.DATABASE,
        context: { action: 'submit_assessment' }
      });
      toast({ title: 'Submission failed', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = getCurrentAnswer(currentQuestion.id);

    return (
      <Card className="w-full max-w-2xl mx-auto glass-card border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {assessment.estimatedTime} min
            </span>
          </div>
          <CardTitle className="text-lg leading-tight">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'single' && (
            <RadioGroup
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 mb-3 p-3 rounded-lg transition-colors glass-subtle hover:glass-strong border border-card-border">
                  <RadioGroupItem value={option.id} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer text-sm text-foreground">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'multiple' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg transition-colors glass-subtle hover:glass-strong border border-card-border">
                    <Checkbox
                      id={`multi-${index}`}
                      checked={currentAnswers.includes(option.id)}
                      onCheckedChange={(checked) => {
                        const newAnswers = checked
                          ? [...currentAnswers, option.id]
                          : currentAnswers.filter((a: string) => a !== option.id);
                        handleAnswer(currentQuestion.id, newAnswers);
                      }}
                    />
                    <Label htmlFor={`multi-${index}`} className="cursor-pointer text-sm text-foreground">
                      {option.text}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <Slider
                value={[typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.scale?.min ?? 1)]}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value[0])}
                min={currentQuestion.scale?.min ?? 1}
                max={currentQuestion.scale?.max ?? 5}
                step={1}
                className="w-full"
              />
              {currentQuestion.scale?.labels && currentQuestion.scale.labels.length > 0 ? (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentQuestion.scale.labels[0] || ''}</span>
                  <span>{currentQuestion.scale.labels[Math.floor((currentQuestion.scale.labels.length - 1)/2)] || ''}</span>
                  <span>{currentQuestion.scale.labels[currentQuestion.scale.labels.length - 1] || ''}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              )}
              <div className="text-center">
                <span className="text-lg font-semibold">{typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.scale?.min ?? 1)}</span>
              </div>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full text-sm glass-input"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md glass-card border-card-border">
          <CardContent className="text-center py-8">
            <div className="text-destructive text-lg mb-2">No Questions Found</div>
            <p className="text-muted-foreground mb-4">This assessment doesn't have any questions yet.</p>
            <Button variant="outline" onClick={onBack}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
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
        <div className="mb-6 glass-subtle p-3 rounded-xl border border-card-border">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
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
