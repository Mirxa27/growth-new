import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Heart, 
  Brain, 
  Target, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Circle
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer } from '@/components/responsive/MobileOptimized';
import { supabase } from '@/integrations/supabase/client';
import { newMeAI } from '@/services/ai/newme-ai-service';

// Step Components
import { LanguageSelection } from './steps/LanguageSelection';
import { PersonalityTest } from './steps/PersonalityTest';
import { BalanceWheel } from './steps/BalanceWheel';
import { DiagnosticAssessment } from './steps/DiagnosticAssessment';
import { WelcomeComplete } from './steps/WelcomeComplete';

interface OnboardingData {
  language: 'en' | 'ar';
  culturalContext: {
    region: string;
    culturalSensitivities: string[];
  };
  personalityType: string;
  personalityScores: Record<string, number>;
  balanceWheelScores: Record<string, number>;
  diagnosticResults: {
    primaryFocusAreas: string[];
    recommendedTier: 'discovery' | 'growth' | 'transformation';
    insights: string[];
  };
}

const STEPS = [
  { id: 'language', title: 'Language & Culture', icon: Globe },
  { id: 'personality', title: 'Personality Test', icon: Brain },
  { id: 'balance', title: 'Balance Wheel', icon: Target },
  { id: 'diagnostic', title: 'Smart Assessment', icon: Heart },
  { id: 'complete', title: 'Welcome!', icon: Sparkles },
];

export const NewomenOnboardingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});

  const currentStepId = STEPS[currentStep]?.id;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  useEffect(() => {
    // Check if user has already completed onboarding
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('user_memory_profiles')
        .select('personality_type, balance_wheel_scores')
        .eq('user_id', user.id)
        .single();

      if (profile?.personality_type && profile?.balance_wheel_scores) {
        // User has completed onboarding, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user || !onboardingData) return;

    setIsLoading(true);
    try {
      // Create user memory profile
      const userProfile = {
        user_id: user.id,
        personality_type: onboardingData.personalityType || 'exploring',
        balance_wheel_scores: onboardingData.balanceWheelScores || {},
        cultural_context: {
          language: onboardingData.language || 'en',
          region: onboardingData.culturalContext?.region || 'global',
          culturalSensitivities: onboardingData.culturalContext?.culturalSensitivities || [],
        },
        subscription_tier: onboardingData.diagnosticResults?.recommendedTier || 'discovery',
        current_level: 1,
        crystal_balance: 100, // Welcome bonus
        progress_metrics: onboardingData.personalityScores || {},
        narrative_patterns: [],
        emotional_state_history: [],
        conversation_history: [],
      };

      // Save to database
      const { error } = await supabase
        .from('user_memory_profiles')
        .upsert(userProfile);

      if (error) throw error;

      // Generate welcome affirmation
      const userMemoryProfile = await newMeAI.getUserMemoryProfile(user.id);
      if (userMemoryProfile) {
        const affirmation = await newMeAI.generateDailyAffirmation(userMemoryProfile);
        
        await supabase
          .from('daily_affirmations')
          .upsert({
            user_id: user.id,
            affirmation_text: affirmation,
            generated_date: new Date().toISOString().split('T')[0],
          });
      }

      // Award welcome crystals
      await supabase.rpc('award_crystals_to_user', {
        user_id_param: user.id,
        crystal_amount: 100,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case 'language':
        return (
          <LanguageSelection
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
            initialData={onboardingData}
          />
        );
      case 'personality':
        return (
          <PersonalityTest
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
            language={onboardingData.language || 'en'}
            initialData={onboardingData}
          />
        );
      case 'balance':
        return (
          <BalanceWheel
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
            language={onboardingData.language || 'en'}
            initialData={onboardingData}
          />
        );
      case 'diagnostic':
        return (
          <DiagnosticAssessment
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
            language={onboardingData.language || 'en'}
            personalityType={onboardingData.personalityType}
            balanceWheelScores={onboardingData.balanceWheelScores}
            initialData={onboardingData}
          />
        );
      case 'complete':
        return (
          <WelcomeComplete
            onComplete={completeOnboarding}
            onboardingData={onboardingData}
            isLoading={isLoading}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <MobileContainer className="py-8">
          {/* Header */}
          <Card className="glass-strong mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Welcome to Newomen</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Let's personalize your growth journey
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="glass-button">
                  {currentStep + 1} / {STEPS.length}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Steps Navigation */}
              <div className="flex justify-between mt-4 overflow-x-auto">
                {STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center gap-2 min-w-0 flex-1 px-2 ${
                        isCurrent ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-white'
                            : isCurrent
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs text-center font-medium truncate">
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardHeader>
          </Card>

          {/* Current Step Content */}
          <Card className="glass-strong mb-6">
            <CardContent className="p-6">
              {renderCurrentStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {currentStepId !== 'complete' && (
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="glass-button flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSkipStep}
                className="glass-button"
              >
                Skip
              </Button>
            </div>
          )}

          {/* Cultural Sensitivity Note */}
          <Card className="glass-subtle mt-6 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary mb-1">
                    Culturally Sensitive & Safe
                  </p>
                  <p className="text-muted-foreground">
                    Your responses are private and help us create a personalized experience 
                    that respects your cultural background and values.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};

export default NewomenOnboardingFlow;