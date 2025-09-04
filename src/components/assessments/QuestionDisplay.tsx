import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { getFullAssessment } from '@/services/api/assessment.service';
import { Assessment, AssessmentQuestion } from '@/types/assessment';

interface QuestionDisplayProps {
  assessmentId: string;
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
  assessmentId,
  currentAnswer,
  onAnswerChange,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const progress = (questionNumber / totalQuestions) * 100;

  useEffect(() => {
    const fetchAssessment = async () => {
      const data = await getFullAssessment(assessmentId);
      setAssessment(data);
      if (data) {
        setQuestion(data.questions[questionNumber - 1]);
      }
    };

    fetchAssessment();
  }, [assessmentId, questionNumber]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <h2 className="text-xl font-semibold leading-relaxed">
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
              value={currentAnswer}
              onValueChange={onAnswerChange}
              className="space-y-3"
            >
              {question.options
                .sort((a, b) => a.position - b.position)
                .map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onAnswerChange(option.id.toString())}
                  >
                    <RadioGroupItem
                      value={option.id.toString()}
                      id={`option-${option.id}`}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="cursor-pointer text-sm leading-relaxed flex-1"
                    >
                      {option.option_text}
                    </Label>
                    {currentAnswer === option.id.toString() ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[150px] resize-none"
              maxLength={1000}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!currentAnswer}
              className="flex-1 bg-gradient-primary"
            >
              {isLast ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-friendly spacing */}
      <div className="h-20 md:h-0" />
    </div>
  );
};