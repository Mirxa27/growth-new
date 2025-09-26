import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Assessment, AssessmentQuestion, AssessmentOption } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface LocalAssessmentTakerProps {
  assessment: Assessment;
  onComplete?: (responses: Record<string, string | number | boolean | string[]>) => void;
  onBack?: () => void;
}

const LocalAssessmentTaker = ({ assessment, onComplete, onBack }: LocalAssessmentTakerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const canProceed = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = useCallback((questionId: string, answer: string | number | boolean | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, assessment.questions.length]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const completeAssessment = () => {
    setShowResults(true);
    onComplete?.(answers); // Pass raw answers to onComplete
  };

  const getOptionText = (option: AssessmentOption): string => {
    return option.text;
  };

  const getOptionValue = (option: AssessmentOption): string => {
    return String(option.value);
  };

  const renderQuestionInput = (question: AssessmentQuestion) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <RadioGroup
            value={currentAnswer as string || ''}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={getOptionValue(option)} id={`${question.id}-${option.id}`} />
                <Label
                  htmlFor={`${question.id}-${option.id}`}
                  className="flex-1 cursor-pointer p-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
                >
                  {getOptionText(option)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const selectedOptions = (currentAnswer as string[]) || [];
              const optionValue = getOptionValue(option);
              const isChecked = selectedOptions.includes(optionValue);

              return (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newSelection = checked
                        ? [...selectedOptions, optionValue]
                        : selectedOptions.filter((item: string) => item !== optionValue);
                      handleAnswer(question.id, newSelection);
                    }}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.id}`}
                    className="flex-1 cursor-pointer p-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
                  >
                    {getOptionText(option)}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'scale': {
        const scale = question.scale;
        if (!scale) return null;

        return (
          <div className="space-y-4">
            <Slider
              value={[Number(currentAnswer) || scale.min]}
              onValueChange={([value]) => handleAnswer(question.id, value)}
              min={scale.min}
              max={scale.max}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-white/60">
              {scale.labels?.map((label, index) => (
                <span key={index} className="text-center">
                  {label}
                </span>
              ))}
            </div>
            {currentAnswer && (
              <div className="text-center text-white font-medium">
                Selected: {currentAnswer}
              </div>
            )}
          </div>
        );
      }

      case 'text':
        return (
          <Textarea
            value={currentAnswer as string || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
        );

      default:
        return null;
    }
  };

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white mb-2">
              Assessment Complete!
            </CardTitle>
            <p className="text-white/70">
              {assessment.title}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
              <p className="text-white/80">{assessment.description}</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={onBack} variant="outline" className="flex-1">
                Back to Assessments
              </Button>
              <Button
                onClick={() => {
                  onBack?.();
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Continue Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{assessment.title}</h1>
          <p className="text-white/60 text-sm">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/60 mb-1">Progress</div>
          <div className="text-lg font-semibold text-white">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
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
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                {currentQuestion?.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion && renderQuestionInput(currentQuestion)}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <div className="flex space-x-2">
          {assessment.questions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentQuestionIndex
                  ? "bg-blue-400"
                  : index < currentQuestionIndex
                  ? "bg-green-400"
                  : "bg-white/20"
              )}
            />
          ))}
        </div>

        {isLastQuestion ? (
          <Button
            onClick={completeAssessment}
            disabled={!canProceed}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600"
          >
            <span>Complete</span>
            <CheckCircle className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={!canProceed}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default memo(LocalAssessmentTaker);