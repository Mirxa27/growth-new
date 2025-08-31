import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PersonalityAssessmentProps {
  onComplete?: (results: any) => void;
  embedded?: boolean;
}

const personalityQuestions = [
  {
    id: 'energy_source',
    question: 'Where do you typically gain energy?',
    options: [
      { value: 'social', label: 'Being around people and social activities' },
      { value: 'solitude', label: 'Quiet time alone for reflection' },
      { value: 'balanced', label: 'A mix of both social and alone time' }
    ]
  },
  {
    id: 'decision_style',
    question: 'How do you prefer to make decisions?',
    options: [
      { value: 'analytical', label: 'Careful analysis of facts and data' },
      { value: 'intuitive', label: 'Following my gut feelings and instincts' },
      { value: 'collaborative', label: 'Discussing with others and seeking input' }
    ]
  },
  {
    id: 'communication',
    question: 'What communication style feels most natural to you?',
    options: [
      { value: 'direct', label: 'Direct and straightforward communication' },
      { value: 'empathetic', label: 'Warm and socially aware communication' },
      { value: 'thoughtful', label: 'Careful and considered communication' }
    ]
  }
];

export const PersonalityAssessment = ({ onComplete, embedded = false }: PersonalityAssessmentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnswerSelect = (value: string) => {
    setAnswers({ ...answers, [personalityQuestions[currentQuestion].id]: value });
  };

  const nextQuestion = () => {
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeAssessment = () => {
    const results = {
      answers,
      personality_type: determinePersonalityType(answers),
      completed_at: new Date().toISOString()
    };

    setIsComplete(true);
    
    if (onComplete) {
      onComplete(results);
    }

    toast({
      title: "Assessment Complete!",
      description: "Your personality insights are ready.",
    });
  };

  const determinePersonalityType = (answers: Record<string, string>) => {
    // Simple personality type determination logic
    const traits = Object.values(answers);
    
    if (traits.includes('analytical') && traits.includes('direct')) {
      return 'Analytical Leader';
    } else if (traits.includes('empathetic') && traits.includes('social')) {
      return 'Empathetic Connector';
    } else if (traits.includes('intuitive') && traits.includes('thoughtful')) {
      return 'Intuitive Thinker';
    } else {
      return 'Balanced Personality';
    }
  };

  const progress = ((currentQuestion + 1) / personalityQuestions.length) * 100;
  const currentAnswerValue = answers[personalityQuestions[currentQuestion]?.id];
  const canProceed = currentAnswerValue !== undefined;

  if (isComplete) {
    const personalityType = determinePersonalityType(answers);
    
    return (
      <Card className="glass border-card-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          <CardDescription>
            Your personality type has been identified
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-6 glass rounded-2xl bg-gradient-primary/10">
            <h3 className="text-xl font-bold mb-2 text-primary">{personalityType}</h3>
            <p className="text-muted-foreground">
              This assessment provides insights into your communication style and decision-making preferences.
            </p>
          </div>
          
          {!embedded && (
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-primary"
              >
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="glass"
              >
                Retake Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Personality Assessment</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {personalityQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {personalityQuestions[currentQuestion]?.question}
          </h3>
          
          <RadioGroup 
            value={currentAnswerValue || ''} 
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {personalityQuestions[currentQuestion]?.options.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem 
                  value={option.value} 
                  id={option.value}
                  className="peer sr-only"
                />
                <Label 
                  htmlFor={option.value} 
                  className="block p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </motion.div>

        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            variant="outline"
            className="glass"
          >
            Previous
          </Button>

          <Button
            onClick={nextQuestion}
            disabled={!canProceed}
            className="bg-gradient-primary"
          >
            {currentQuestion === personalityQuestions.length - 1 ? (
              <>
                Complete
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
