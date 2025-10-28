import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface Option {
  id: number;
  option_text: string;
  position: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'free_text';
  position: number;
  explanation?: string;
  options?: Option[];
}

interface QuestionDisplayProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}) => {
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 min-h-screen-safe flex flex-col">
      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 sm:h-3" />
      </div>

      {/* Question Card */}
      <Card className="glass-card border-glass flex-1 flex flex-col">
        <CardHeader className="pb-4 sm:pb-6">
          <h2 className="text-lg sm:text-xl font-semibold leading-relaxed text-balance">
            {question.question_text}
          </h2>
          {question.explanation && (
            <p className="text-sm text-muted-foreground mt-2">
              {question.explanation}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {question.question_type === 'multiple_choice' && question.options ? (
            <RadioGroup
              value={currentAnswer || ""}
              onValueChange={onAnswerChange}
              className="space-y-3"
            >
              {question.options
                .sort((a, b) => a.position - b.position)
                .map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer touch-target-large"
                    onClick={() => onAnswerChange(option.id.toString())}
                  >
                    <RadioGroupItem
                      value={option.id.toString()}
                      id={`option-${option.id}`}
                      className="mt-0.5 touch-target"
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="cursor-pointer text-sm sm:text-base leading-relaxed flex-1 touch-target-large"
                    >
                      {option.option_text}
                    </Label>
                    {currentAnswer === option.id.toString() ? (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[150px] sm:min-h-[180px] resize-none text-base"
              maxLength={1000}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst}
              className="flex-1 order-2 sm:order-1 touch-target-large"
              size="lg"
            >
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!currentAnswer}
              className="flex-1 bg-gradient-primary order-1 sm:order-2 touch-target-large"
              size="lg"
            >
              {isLast ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-friendly spacing */}
      <div className="h-20 md:h-0" />
    </div>
  );
};