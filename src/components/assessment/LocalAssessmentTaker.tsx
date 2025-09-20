import React, { useState } from 'react';
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
import { Assessment, AssessmentQuestion } from '../../data/assessments';
import { cn } from '@/lib/utils';

interface LocalAssessmentTakerProps {
  assessment: Assessment;
  onComplete?: (results: any) => void;
  onBack?: () => void;
}

const LocalAssessmentTaker = ({ assessment, onComplete, onBack }: LocalAssessmentTakerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const canProceed = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeAssessment = () => {
    const results = {
      assessmentId: assessment.id,
      answers,
      completedAt: new Date().toISOString(),
      summary: assessment.results.summary,
      insights: assessment.results.insights,
      recommendations: assessment.results.recommendations
    };
    
    setShowResults(true);
    onComplete?.(results);
  };

  const renderQuestionInput = (question: AssessmentQuestion) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`} 
                  className="flex-1 cursor-pointer p-3 rounded-lg glass-subtle hover:glass-glow transition-colors"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const selectedOptions = currentAnswer || [];
              const isChecked = selectedOptions.includes(option);
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newSelection = checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((item: string) => item !== option);
                      handleAnswer(question.id, newSelection);
                    }}
                  />
                  <Label 
                    htmlFor={`${question.id}-${index}`} 
                    className="flex-1 cursor-pointer p-3 rounded-lg glass-subtle hover:glass-glow transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'scale':
        const scale = question.scale;
        if (!scale) return null;
        
        return (
          <div className="space-y-4">
            <Slider
              value={[currentAnswer || scale.min]}
              onValueChange={([value]) => handleAnswer(question.id, value)}
              min={scale.min}
              max={scale.max}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-white/60">
              {scale.labels.map((label, index) => (
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

      case 'text':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px] input-glass text-glass placeholder:text-glass-muted"
          />
        );

      default:
        return null;
    }
  };

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="glass-strong">
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
              <p className="text-white/80">{assessment.results.summary}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
              <ul className="space-y-2">
                {assessment.results.insights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-2 text-white/80">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {assessment.results.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-white/80">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={onBack} variant="outline" className="flex-1">
                Back to Assessments
              </Button>
              <Button 
                onClick={() => {
                  // Could implement sharing or saving functionality here
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
          <Card className="glass-strong mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                {currentQuestion?.text}
              </CardTitle>
              {currentQuestion?.category && (
                <div className="text-sm text-white/60">
                  Category: {currentQuestion.category}
                </div>
              )}
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

export default LocalAssessmentTaker;