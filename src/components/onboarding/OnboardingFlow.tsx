import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PersonalityAssessment } from '@/components/personality/PersonalityAssessment';
import { BalanceWheel } from '@/components/onboarding/BalanceWheel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type OnboardingStep = 'welcome' | 'personality' | 'balance' | 'complete';

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [personalityResults, setPersonalityResults] = useState<any>(null);
  const [balanceResults, setBalanceResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const steps: OnboardingStep[] = ['welcome', 'personality', 'balance', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handlePersonalityComplete = (results: any) => {
    setPersonalityResults(results);
    setTimeout(() => setCurrentStep('balance'), 1000);
  };

  const handleBalanceComplete = (results: any) => {
    setBalanceResults(results);
    setTimeout(() => setCurrentStep('complete'), 1000);
  };

  const saveOnboardingData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Save personality assessment results
      if (personalityResults) {
        await supabase.from('assessment_results').insert([{
          user_id: user.id,
          assessment_type: 'personality',
          answers: personalityResults.answers,
          results: {
            personality_type: personalityResults.personality_type,
            completed_at: personalityResults.completed_at
          }
        }]);
      }

      // Save balance wheel results
      if (balanceResults) {
        await supabase.from('assessment_results').insert([{
          user_id: user.id,
          assessment_type: 'balance_wheel',
          answers: balanceResults.ratings,
          results: {
            goals: balanceResults.goals,
            overall_satisfaction: balanceResults.overall_satisfaction,
            completed_at: balanceResults.completed_at
          }
        }]);
      }

      toast({
        title: "Onboarding Complete!",
        description: "Your profile has been set up successfully.",
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error",
        description: "There was an issue saving your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Card className="glass border-card-border max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-4">Welcome to Newomen!</CardTitle>
              <CardDescription className="text-lg">
                Let's get to know you better with a quick onboarding process. This will help us personalize your experience and provide better recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass rounded-2xl">
                  <Target className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Personality Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand your communication style and decision-making preferences
                  </p>
                </div>
                <div className="p-6 glass rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Life Balance Wheel</h3>
                  <p className="text-sm text-muted-foreground">
                    Assess different areas of your life and set improvement goals
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => setCurrentStep('personality')}
                  size="lg"
                  className="bg-gradient-primary text-lg px-8"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  This will take about 5-10 minutes to complete
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'personality':
        return (
          <div className="max-w-2xl mx-auto">
            <PersonalityAssessment 
              onComplete={handlePersonalityComplete}
              embedded={true}
            />
          </div>
        );

      case 'balance':
        return (
          <div className="max-w-2xl mx-auto">
            <BalanceWheel 
              onComplete={handleBalanceComplete}
              embedded={true}
            />
          </div>
        );

      case 'complete':
        return (
          <Card className="glass border-card-border max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-4">Onboarding Complete!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for completing your profile setup. Your personalized experience is now ready!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {personalityResults && (
                  <div className="p-6 glass rounded-2xl bg-primary/5">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Personality Type</h3>
                    <p className="text-sm text-primary font-medium">
                      {personalityResults.personality_type}
                    </p>
                  </div>
                )}
                
                {balanceResults && (
                  <div className="p-6 glass rounded-2xl bg-secondary/5">
                    <Target className="w-8 h-8 text-secondary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Life Balance</h3>
                    <p className="text-sm text-secondary font-medium">
                      {balanceResults.overall_satisfaction.toFixed(1)}/10 Overall Satisfaction
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={saveOnboardingData}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-primary text-lg px-8"
                >
                  {isLoading ? 'Saving...' : 'Continue to Dashboard'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup Your Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};