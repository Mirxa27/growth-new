import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Target,
  Sparkles,
  Brain
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DiagnosticAssessmentProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  language: 'en' | 'ar';
  personalityType?: string;
  balanceWheelScores?: Record<string, number>;
  initialData?: any;
}

const DIAGNOSTIC_QUESTIONS = {
  en: [
    {
      id: 'primary_challenge',
      question: 'What is your biggest challenge right now?',
      options: [
        { value: 'self_confidence', label: 'Building self-confidence', areas: ['personal_growth', 'relationships'] },
        { value: 'relationships', label: 'Improving relationships', areas: ['relationships', 'family'] },
        { value: 'career_direction', label: 'Finding career direction', areas: ['career', 'personal_growth'] },
        { value: 'life_balance', label: 'Achieving work-life balance', areas: ['health', 'career', 'family'] },
        { value: 'emotional_wellbeing', label: 'Managing emotions and stress', areas: ['health', 'personal_growth'] },
      ]
    },
    {
      id: 'growth_priority',
      question: 'What area would make the biggest positive impact on your life?',
      options: [
        { value: 'inner_strength', label: 'Developing inner strength and resilience', areas: ['personal_growth', 'health'] },
        { value: 'communication', label: 'Improving communication skills', areas: ['relationships', 'career'] },
        { value: 'purpose', label: 'Finding my life purpose', areas: ['spirituality', 'career'] },
        { value: 'boundaries', label: 'Setting healthy boundaries', areas: ['relationships', 'personal_growth'] },
        { value: 'self_care', label: 'Prioritizing self-care', areas: ['health', 'personal_growth'] },
      ]
    },
    {
      id: 'support_style',
      question: 'How do you prefer to receive guidance?',
      options: [
        { value: 'gentle', label: 'Gentle encouragement and support', tier: 'discovery' },
        { value: 'structured', label: 'Structured plans and clear steps', tier: 'growth' },
        { value: 'deep', label: 'Deep exploration and challenging questions', tier: 'transformation' },
        { value: 'flexible', label: 'Flexible approach based on my mood', tier: 'growth' },
      ]
    }
  ],
  ar: [
    {
      id: 'primary_challenge',
      question: 'ما هو أكبر تحدٍ تواجهينه الآن؟',
      options: [
        { value: 'self_confidence', label: 'بناء الثقة بالنفس', areas: ['personal_growth', 'relationships'] },
        { value: 'relationships', label: 'تحسين العلاقات', areas: ['relationships', 'family'] },
        { value: 'career_direction', label: 'إيجاد الاتجاه المهني', areas: ['career', 'personal_growth'] },
        { value: 'life_balance', label: 'تحقيق التوازن بين العمل والحياة', areas: ['health', 'career', 'family'] },
        { value: 'emotional_wellbeing', label: 'إدارة المشاعر والضغط', areas: ['health', 'personal_growth'] },
      ]
    },
    {
      id: 'growth_priority',
      question: 'أي مجال سيحدث أكبر تأثير إيجابي على حياتك؟',
      options: [
        { value: 'inner_strength', label: 'تطوير القوة الداخلية والمرونة', areas: ['personal_growth', 'health'] },
        { value: 'communication', label: 'تحسين مهارات التواصل', areas: ['relationships', 'career'] },
        { value: 'purpose', label: 'إيجاد هدف حياتي', areas: ['spirituality', 'career'] },
        { value: 'boundaries', label: 'وضع حدود صحية', areas: ['relationships', 'personal_growth'] },
        { value: 'self_care', label: 'إعطاء الأولوية للعناية بالذات', areas: ['health', 'personal_growth'] },
      ]
    },
    {
      id: 'support_style',
      question: 'كيف تفضلين تلقي التوجيه؟',
      options: [
        { value: 'gentle', label: 'التشجيع اللطيف والدعم', tier: 'discovery' },
        { value: 'structured', label: 'خطط منظمة وخطوات واضحة', tier: 'growth' },
        { value: 'deep', label: 'استكشاف عميق وأسئلة تحدي', tier: 'transformation' },
        { value: 'flexible', label: 'نهج مرن حسب مزاجي', tier: 'growth' },
      ]
    }
  ]
};

export const DiagnosticAssessment = ({ 
  onComplete, 
  onSkip, 
  language, 
  personalityType, 
  balanceWheelScores,
  initialData 
}: DiagnosticAssessmentProps) => {
  const [responses, setResponses] = useState<Record<string, string>>(
    initialData?.diagnosticResponses || {}
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const questions = DIAGNOSTIC_QUESTIONS[language];

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const analyzeResponses = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate focus areas based on responses
    const focusAreaCounts: Record<string, number> = {};
    const tierVotes: Record<string, number> = { discovery: 0, growth: 0, transformation: 0 };

    questions.forEach(question => {
      const response = responses[question.id];
      const selectedOption = question.options.find(opt => opt.value === response);
      
      if (selectedOption) {
        // Count focus areas
        if ('areas' in selectedOption) {
          selectedOption.areas.forEach(area => {
            focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
          });
        }
        
        // Count tier preferences
        if ('tier' in selectedOption) {
          tierVotes[selectedOption.tier] += 1;
        }
      }
    });

    // Determine primary focus areas (top 3)
    const primaryFocusAreas = Object.entries(focusAreaCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area);

    // Determine recommended tier
    let recommendedTier: 'discovery' | 'growth' | 'transformation' = 'discovery';
    const maxVotes = Math.max(...Object.values(tierVotes));
    const topTier = Object.entries(tierVotes).find(([,votes]) => votes === maxVotes)?.[0] as any;
    if (topTier) recommendedTier = topTier;

    // Generate insights based on personality and balance wheel
    const insights = generateInsights(personalityType, balanceWheelScores, primaryFocusAreas, language);

    const analysisResults = {
      primaryFocusAreas,
      recommendedTier,
      insights,
      diagnosticResponses: responses
    };

    setResults(analysisResults);
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const generateInsights = (
    personality?: string, 
    balanceScores?: Record<string, number>, 
    focusAreas?: string[], 
    lang: 'en' | 'ar' = 'en'
  ): string[] => {
    const insights: string[] = [];

    if (lang === 'en') {
      if (personality?.includes('Social')) {
        insights.push('Your social nature is a strength - use it to build supportive networks');
      }
      if (personality?.includes('Creative')) {
        insights.push('Channel your creativity into personal growth practices');
      }
      if (focusAreas?.includes('relationships')) {
        insights.push('Focusing on relationships will create positive ripple effects in other life areas');
      }
      if (balanceScores && Math.min(...Object.values(balanceScores)) < 4) {
        insights.push('Your balance wheel shows clear areas for growth - this is your starting point');
      }
      insights.push('Your willingness to explore personal growth shows remarkable self-awareness');
    } else {
      if (personality?.includes('Social')) {
        insights.push('طبيعتك الاجتماعية نقطة قوة - استخدميها لبناء شبكات داعمة');
      }
      if (personality?.includes('Creative')) {
        insights.push('وجهي إبداعك نحو ممارسات النمو الشخصي');
      }
      if (focusAreas?.includes('relationships')) {
        insights.push('التركيز على العلاقات سيخلق تأثيرات إيجابية في مجالات الحياة الأخرى');
      }
      if (balanceScores && Math.min(...Object.values(balanceScores)) < 4) {
        insights.push('عجلة التوازن تظهر مجالات واضحة للنمو - هذه نقطة البداية');
      }
      insights.push('استعدادك لاستكشاف النمو الشخصي يظهر وعياً ذاتياً رائعاً');
    }

    return insights;
  };

  const handleComplete = () => {
    onComplete({
      diagnosticResults: results
    });
  };

  const allQuestionsAnswered = questions.every(q => responses[q.id]);

  if (showResults && results) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {language === 'en' ? 'Your Growth Plan' : 'خطة نموك'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Based on your responses, here\'s your personalized growth plan'
              : 'بناءً على إجاباتك، هذه خطة نموك الشخصية'
            }
          </p>
        </div>

        {/* Recommended Tier */}
        <Card className="glass-strong border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {language === 'en' ? 'Recommended Tier' : 'المستوى الموصى به'}
                </h3>
                <Badge className="bg-primary/20 text-primary capitalize">
                  {results.recommendedTier}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? `The ${results.recommendedTier} tier is perfect for your current growth needs and preferred support style.`
                : `مستوى ${results.recommendedTier} مثالي لاحتياجات نموك الحالية وأسلوب الدعم المفضل لديك.`
              }
            </p>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">
                {language === 'en' ? 'Primary Focus Areas' : 'مجالات التركيز الأساسية'}
              </h3>
            </div>
            <div className="space-y-3">
              {results.primaryFocusAreas.map((area: string, index: number) => (
                <div key={area} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="capitalize">{area.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">
                {language === 'en' ? 'Personal Insights' : 'رؤى شخصية'}
              </h3>
            </div>
            <div className="space-y-3">
              {results.insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          {language === 'en' ? 'Continue to Welcome' : 'المتابعة إلى الترحيب'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold">
            {language === 'en' ? 'Analyzing Your Responses' : 'تحليل إجاباتك'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Creating your personalized growth plan...'
              : 'إنشاء خطة نموك الشخصية...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">
          {language === 'en' ? 'Smart Assessment' : 'التقييم الذكي'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? 'A few questions to create your personalized growth plan'
            : 'بضعة أسئلة لإنشاء خطة نموك الشخصية'
          }
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question) => (
          <Card key={question.id} className="glass-strong">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{question.question}</h3>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <Button
                      key={option.value}
                      variant={responses[question.id] === option.value ? "default" : "outline"}
                      className={`w-full justify-start text-left p-4 h-auto ${
                        responses[question.id] === option.value
                          ? 'bg-primary text-white'
                          : 'glass-button hover:glass-strong'
                      }`}
                      onClick={() => handleResponse(question.id, option.value)}
                    >
                      <div className="flex items-center gap-3">
                        {responses[question.id] === option.value ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 border border-current rounded-full" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analyze Button */}
      {allQuestionsAnswered && (
        <Button
          onClick={analyzeResponses}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          {language === 'en' ? 'Analyze My Responses' : 'تحليل إجاباتي'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};