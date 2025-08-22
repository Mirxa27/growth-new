
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface PersonalityQuestion {
  id: string;
  question_text: string;
  options: string[];
  category: string;
  order_index: number;
}

interface PersonalityAssessmentProps {
  onComplete: (results: any) => void;
}

export const PersonalityAssessment = ({ onComplete }: PersonalityAssessmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<PersonalityQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('personality_questions')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment questions.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const categoryScores: Record<string, number> = {};
    const answerPatterns: Record<string, string[]> = {};

    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = 0;
          answerPatterns[question.category] = [];
        }
        categoryScores[question.category]++;
        answerPatterns[question.category].push(answer);
      }
    });

    // Determine personality type based on dominant patterns
    const dominantCategory = Object.keys(categoryScores).reduce((a, b) =>
      categoryScores[a] > categoryScores[b] ? a : b
    );

    const personalityTypes = {
      energy: 'Energetic Explorer',
      decision_making: 'Thoughtful Analyst',
      lifestyle: 'Balanced Harmonizer',
      relationships: 'Connected Empath',
      growth: 'Ambitious Achiever'
    };

    return {
      personality_type: personalityTypes[dominantCategory as keyof typeof personalityTypes] || 'Unique Individual',
      category_scores: categoryScores,
      dominant_traits: answerPatterns[dominantCategory] || [],
      insights: generateInsights(dominantCategory, answerPatterns[dominantCategory] || [])
    };
  };

  const generateInsights = (category: string, traits: string[]) => {
    const insights: Record<string, string[]> = {
      energy: [
        'You have a natural ability to find energy in different ways',
        'Consider balancing solitude with social connection',
        'Your energy patterns can guide your daily routines'
      ],
      decision_making: [
        'You have a structured approach to making choices',
        'Trust both logic and intuition in your decisions',
        'Your decision-making style is a strength in leadership'
      ],
      lifestyle: [
        'You value balance and variety in your life',
        'Consider how your ideal lifestyle aligns with your current reality',
        'Small changes can bring you closer to your ideal way of living'
      ],
      relationships: [
        'You understand the importance of meaningful connections',
        'Your relationship values guide how you connect with others',
        'Consider deepening the relationships that matter most'
      ],
      growth: [
        'You have a clear vision for personal development',
        'Your growth approach can be applied to different life areas',
        'Consider setting specific milestones for your journey'
      ]
    };

    return insights[category] || ['You have a unique perspective on life that brings value to every situation.'];
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const results = calculateResults();
      
      const { data, error } = await supabase.rpc('save_personality_assessment', {
        user_id_input: user.id,
        answers_input: answers,
        results_input: results
      });

      if (error) throw error;

      // Update user profile with personality type
      await supabase
        .from('profiles')
        .update({
          personality_type: results.personality_type,
          personality_data: results
        })
        .eq('user_id', user.id);

      toast({
        title: 'Assessment Complete!',
        description: `You've earned 50 crystals and discovered you're a ${results.personality_type}!`
      });

      onComplete(results);
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment results.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto glass-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No assessment questions available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const canProceed = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">Personality Discovery</h1>
          <p className="text-muted-foreground">Let's uncover your unique perspective</p>
        </div>

        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">Question {currentIndex + 1} of {questions.length}</CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardDescription className="text-lg font-medium text-foreground">
              {currentQuestion.question_text}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3 p-4 rounded-lg glass-surface hover:bg-white/10 transition-all duration-200">
                  <RadioGroupItem value={option} id={`option-${optionIndex}`} />
                  <Label htmlFor={`option-${optionIndex}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="glass-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Assessment
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
