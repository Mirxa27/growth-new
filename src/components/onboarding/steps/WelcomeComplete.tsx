import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ArrowRight,
  Gift,
  Target,
  Brain,
  Heart
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface WelcomeCompleteProps {
  onComplete: () => void;
  onboardingData: any;
  isLoading: boolean;
}

export const WelcomeComplete = ({ onComplete, onboardingData, isLoading }: WelcomeCompleteProps) => {
  const language = onboardingData.language || 'en';
  const personalityType = onboardingData.personalityType || 'Balanced Explorer';
  const recommendedTier = onboardingData.diagnosticResults?.recommendedTier || 'discovery';
  const primaryFocusAreas = onboardingData.diagnosticResults?.primaryFocusAreas || [];

  const tierDescriptions = {
    en: {
      discovery: 'Perfect for exploring personal growth basics with gentle guidance',
      growth: 'Ideal for structured development with actionable insights',
      transformation: 'Designed for deep exploration and significant life changes'
    },
    ar: {
      discovery: 'مثالي لاستكشاف أساسيات النمو الشخصي مع التوجيه اللطيف',
      growth: 'مثالي للتطوير المنظم مع الرؤى القابلة للتنفيذ',
      transformation: 'مصمم للاستكشاف العميق والتغييرات الحياتية المهمة'
    }
  };

  const welcomeMessages = {
    en: {
      title: 'Welcome to Your Growth Journey!',
      subtitle: 'Your personalized experience is ready',
      crystalBonus: 'Welcome Bonus: 100 Crystals!',
      ready: 'Ready to begin your transformation?'
    },
    ar: {
      title: 'مرحباً بك في رحلة نموك!',
      subtitle: 'تجربتك الشخصية جاهزة',
      crystalBonus: 'مكافأة الترحيب: ١٠٠ كريستالة!',
      ready: 'هل أنت مستعدة لبدء تحولك؟'
    }
  };

  const messages = welcomeMessages[language];
  const tierDesc = tierDescriptions[language][recommendedTier];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {messages.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {messages.subtitle}
        </p>
      </div>

      {/* Crystal Bonus */}
      <Card className="glass-strong border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gift className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold text-primary">
              {messages.crystalBonus}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'en' 
              ? 'Use crystals to unlock insights, track progress, and celebrate milestones'
              : 'استخدمي الكريستالات لفتح الرؤى وتتبع التقدم والاحتفال بالإنجازات'
            }
          </p>
        </CardContent>
      </Card>

      {/* Personality Summary */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {language === 'en' ? 'Your Personality Type' : 'نوع شخصيتك'}
              </h3>
              <Badge className="bg-secondary/20 text-secondary">
                {personalityType}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Tier */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {language === 'en' ? 'Your Growth Tier' : 'مستوى نموك'}
              </h3>
              <Badge className="bg-primary/20 text-primary capitalize">
                {recommendedTier}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {tierDesc}
          </p>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      {primaryFocusAreas.length > 0 && (
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">
                {language === 'en' ? 'Your Focus Areas' : 'مجالات تركيزك'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryFocusAreas.map((area: string, index: number) => (
                <Badge key={area} variant="outline" className="capitalize">
                  {area.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Next */}
      <Card className="glass-subtle border-accent/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-accent mb-3">
            {language === 'en' ? "What's Next?" : 'ما التالي؟'}
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• {language === 'en' ? 'Chat with NewMe for personalized guidance' : 'تحدثي مع نيومي للحصول على إرشاد شخصي'}</p>
            <p>• {language === 'en' ? 'Explore narrative identity sessions' : 'استكشفي جلسات الهوية السردية'}</p>
            <p>• {language === 'en' ? 'Track your progress with crystals' : 'تتبعي تقدمك بالكريستالات'}</p>
            <p>• {language === 'en' ? 'Connect with like-minded women' : 'تواصلي مع نساء متشابهات في التفكير'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ready Message */}
      <div className="text-center py-4">
        <p className="text-lg font-medium mb-4">
          {messages.ready}
        </p>
      </div>

      {/* Complete Button */}
      <Button
        onClick={onComplete}
        disabled={isLoading}
        className="w-full bg-gradient-primary hover:opacity-90"
        size="lg"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">
              {language === 'en' ? 'Setting up your profile...' : 'إعداد ملفك الشخصي...'}
            </span>
          </>
        ) : (
          <>
            {language === 'en' ? 'Enter Newomen' : 'ادخلي إلى نيومن'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {/* Cultural Note */}
      <Card className="glass-subtle border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">
                {language === 'en' ? 'A Safe Space for Growth' : 'مساحة آمنة للنمو'}
              </p>
              <p className="text-muted-foreground">
                {language === 'en' 
                  ? 'NewMe respects your cultural values and provides guidance that honors your background and beliefs.'
                  : 'تحترم نيومي قيمك الثقافية وتقدم إرشاداً يكرم خلفيتك ومعتقداتك.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};