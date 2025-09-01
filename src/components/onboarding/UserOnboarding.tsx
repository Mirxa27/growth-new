/**
 * User Onboarding Component
 * Guides new users through initial setup and assessment
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  User,
  Target,
  Heart,
  Brain,
  Compass,
  CheckCircle,
  Star,
  Zap,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { assessmentService } from '@/services/assessment.service';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

const UserOnboarding = ({ onComplete }: { onComplete?: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    goals: [] as string[],
    interests: [] as string[],
    experienceLevel: '',
    preferredTime: '',
    communicationStyle: ''
  });

  // Check if user has completed onboarding
  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      if (data?.onboarding_completed) {
        onComplete?.();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Growth Journey',
      description: 'Let\'s personalize your experience',
      icon: Sparkles,
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to NewMe!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're excited to support you on your journey of self-discovery and personal growth. 
              Let's take a few moments to personalize your experience.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">What should we call you?</Label>
            <Input
              id="displayName"
              placeholder="Enter your preferred name"
              value={userData.displayName}
              onChange={(e) => setUserData(prev => ({ ...prev, displayName: e.target.value }))}
            />
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Your Growth Goals',
      description: 'What brings you here today?',
      icon: Target,
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">What are your main goals?</h3>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'confidence', label: 'Build Confidence', icon: Star },
              { id: 'relationships', label: 'Improve Relationships', icon: Heart },
              { id: 'career', label: 'Career Growth', icon: Zap },
              { id: 'wellness', label: 'Mental Wellness', icon: Brain },
              { id: 'mindfulness', label: 'Practice Mindfulness', icon: Compass },
              { id: 'community', label: 'Find Community', icon: Users }
            ].map((goal) => (
              <button
                key={goal.id}
                onClick={() => {
                  setUserData(prev => ({
                    ...prev,
                    goals: prev.goals.includes(goal.id)
                      ? prev.goals.filter(g => g !== goal.id)
                      : [...prev.goals, goal.id]
                  }));
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userData.goals.includes(goal.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <goal.icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{goal.label}</p>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'experience',
      title: 'Your Experience',
      description: 'Help us tailor content to your level',
      icon: Brain,
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Your self-growth experience</h3>
            <p className="text-sm text-muted-foreground">This helps us recommend the right content</p>
          </div>
          
          <RadioGroup
            value={userData.experienceLevel}
            onValueChange={(value) => setUserData(prev => ({ ...prev, experienceLevel: value }))}
          >
            <div className="space-y-3">
              {[
                { 
                  value: 'beginner', 
                  label: 'Just Starting', 
                  description: 'New to personal development'
                },
                { 
                  value: 'intermediate', 
                  label: 'Some Experience', 
                  description: 'Have tried some techniques'
                },
                { 
                  value: 'advanced', 
                  label: 'Experienced', 
                  description: 'Regular practice and knowledge'
                }
              ].map((level) => (
                <div key={level.value} className="relative">
                  <RadioGroupItem
                    value={level.value}
                    id={level.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={level.value}
                    className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )
    },
    {
      id: 'preferences',
      title: 'Your Preferences',
      description: 'How can we best support you?',
      icon: Heart,
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Your preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred time for daily check-ins</Label>
              <RadioGroup
                value={userData.preferredTime}
                onValueChange={(value) => setUserData(prev => ({ ...prev, preferredTime: value }))}
              >
                <div className="grid grid-cols-2 gap-2">
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                    <div key={time} className="relative">
                      <RadioGroupItem
                        value={time.toLowerCase()}
                        id={time.toLowerCase()}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={time.toLowerCase()}
                        className="block p-3 text-center rounded-lg border-2 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5"
                      >
                        {time}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Communication style preference</Label>
              <RadioGroup
                value={userData.communicationStyle}
                onValueChange={(value) => setUserData(prev => ({ ...prev, communicationStyle: value }))}
              >
                <div className="space-y-2">
                  {[
                    { value: 'gentle', label: 'Gentle & Supportive' },
                    { value: 'direct', label: 'Direct & Practical' },
                    { value: 'motivational', label: 'Motivational & Energetic' },
                    { value: 'analytical', label: 'Analytical & Detailed' }
                  ].map((style) => (
                    <div key={style.value} className="relative">
                      <RadioGroupItem
                        value={style.value}
                        id={style.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={style.value}
                        className="block p-3 rounded-lg border-2 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5"
                      >
                        {style.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Ready to begin your journey',
      icon: CheckCircle,
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Welcome aboard, {userData.displayName}!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your personalized growth journey is ready. We've customized your experience based on your preferences.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">Personalized dashboard created</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">AI assistant configured to your style</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm">First assessment ready</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Next step:</p>
            <Badge variant="default" className="text-sm px-4 py-1">
              Take your personality assessment
            </Badge>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Complete onboarding
      await completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update user profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: userData.displayName,
          onboarding_completed: true,
          onboarding_data: userData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      // Sync any local assessment results
      await assessmentService.syncLocalResults();
      
      toast({
        title: 'Welcome to NewMe!',
        description: 'Your journey begins now.',
      });
      
      onComplete?.();
      navigate('/mobile-assessment');
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return userData.displayName.trim().length > 0;
      case 1:
        return userData.goals.length > 0;
      case 2:
        return userData.experienceLevel !== '';
      case 3:
        return userData.preferredTime !== '' && userData.communicationStyle !== '';
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Step {currentStep + 1} of {steps.length}
              </CardTitle>
              <Badge variant="outline">
                {steps[currentStep].title}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
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
    </div>
  );
};

export default UserOnboarding;