
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { PersonalityAssessment } from '@/components/personality/PersonalityAssessment';
import { BalanceWheel } from '@/components/onboarding/BalanceWheel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, Heart } from 'lucide-react';

type OnboardingStep = 'welcome' | 'personality' | 'balance' | 'complete';

export const OnboardingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [personalityResults, setPersonalityResults] = useState(null);

  const handlePersonalityComplete = (results: any) => {
    setPersonalityResults(results);
    setStep('balance');
  };

  const handleBalanceComplete = () => {
    setStep('complete');
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const getStepProgress = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'personality': return 33;
      case 'balance': return 66;
      case 'complete': return 100;
      default: return 0;
    }
  };

  if (step === 'personality') {
    return <PersonalityAssessment onComplete={handlePersonalityComplete} />;
  }

  if (step === 'balance') {
    return <BalanceWheel onComplete={handleBalanceComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome to Newomen</h1>
          <p className="text-xl text-muted-foreground">Your journey of self-discovery begins here</p>
        </div>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-center">Getting Started</CardTitle>
            <Progress value={getStepProgress()} className="mt-4" />
          </CardHeader>
        </Card>

        {step === 'welcome' && (
          <Card className="glass-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4">Hello, {user?.email?.split('@')[0]}!</CardTitle>
              <CardDescription className="text-lg">
                Let's take a few minutes to personalize your experience and discover what makes you unique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-lg glass-surface">
                  <Heart className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Personality Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Uncover your unique traits and growth patterns through a personalized assessment.
                  </p>
                </div>
                <div className="p-6 rounded-lg glass-surface">
                  <Target className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-semibold mb-2">Life Balance Wheel</h3>
                  <p className="text-sm text-muted-foreground">
                    Evaluate different areas of your life to identify focus areas for growth.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Button
                  onClick={() => setStep('personality')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  Begin Your Journey
                  <Sparkles className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="glass-card">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl gradient-text mb-4">Welcome to Your Journey!</CardTitle>
              <CardDescription className="text-lg">
                Your personalized experience is now ready. You've earned crystals and unlocked your first insights!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {personalityResults && (
                <div className="p-6 rounded-lg glass-surface">
                  <h3 className="text-xl font-semibold mb-2">Your Personality Profile</h3>
                  <p className="text-primary font-medium text-lg">{personalityResults.personality_type}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This insight will help NewMe provide personalized guidance throughout your journey.
                  </p>
                </div>
              )}
              <div className="text-center">
                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  Enter Your Dashboard
                  <Target className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
