import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle
} from 'lucide-react';

interface PersonalityTestProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  language: 'en' | 'ar';
  initialData?: any;
}

const PERSONALITY_QUESTIONS = {
  en: [
    {
      id: 'social_energy',
      question: 'I feel energized when I\'m around other people',
      category: 'extraversion',
      weight: 1
    },
    {
      id: 'detail_focus',
      question: 'I prefer to focus on details rather than the big picture',
      category: 'sensing',
      weight: 1
    },
    {
      id: 'logical_decisions',
      question: 'I make decisions based on logic rather than feelings',
      category: 'thinking',
      weight: 1
    },
    {
      id: 'structured_life',
      question: 'I like to have my life planned and organized',
      category: 'judging',
      weight: 1
    },
    {
      id: 'new_experiences',
      question: 'I actively seek out new experiences and adventures',
      category: 'openness',
      weight: 1
    },
    {
      id: 'emotional_support',
      question: 'I often provide emotional support to friends and family',
      category: 'agreeableness',
      weight: 1
    },
    {
      id: 'goal_achievement',
      question: 'I am determined to achieve my goals no matter what',
      category: 'conscientiousness',
      weight: 1
    },
    {
      id: 'stress_handling',
      question: 'I handle stress and pressure well',
      category: 'emotional_stability',
      weight: 1
    },
    {
      id: 'creative_thinking',
      question: 'I enjoy creative and artistic activities',
      category: 'openness',
      weight: 0.8
    },
    {
      id: 'leadership_role',
      question: 'I naturally take on leadership roles in groups',
      category: 'extraversion',
      weight: 0.9
    }
  ],
  ar: [
    {
      id: 'social_energy',
      question: 'أشعر بالنشاط عندما أكون محاطة بأشخاص آخرين',
      category: 'extraversion',
      weight: 1
    },
    {
      id: 'detail_focus',
      question: 'أفضل التركيز على التفاصيل بدلاً من الصورة الكبيرة',
      category: 'sensing',
      weight: 1
    },
    {
      id: 'logical_decisions',
      question: 'أتخذ قراراتي بناءً على المنطق وليس المشاعر',
      category: 'thinking',
      weight: 1
    },
    {
      id: 'structured_life',
      question: 'أحب أن تكون حياتي مخططة ومنظمة',
      category: 'judging',
      weight: 1
    },
    {
      id: 'new_experiences',
      question: 'أسعى بنشاط للحصول على تجارب ومغامرات جديدة',
      category: 'openness',
      weight: 1
    },
    {
      id: 'emotional_support',
      question: 'غالباً ما أقدم الدعم العاطفي للأصدقاء والعائلة',
      category: 'agreeableness',
      weight: 1
    },
    {
      id: 'goal_achievement',
      question: 'أنا مصممة على تحقيق أهدافي مهما كان الأمر',
      category: 'conscientiousness',
      weight: 1
    },
    {
      id: 'stress_handling',
      question: 'أتعامل مع الضغط والتوتر بشكل جيد',
      category: 'emotional_stability',
      weight: 1
    },
    {
      id: 'creative_thinking',
      question: 'أستمتع بالأنشطة الإبداعية والفنية',
      category: 'openness',
      weight: 0.8
    },
    {
      id: 'leadership_role',
      question: 'أتولى بطبيعتي أدوار قيادية في المجموعات',
      category: 'extraversion',
      weight: 0.9
    }
  ]
};

const RESPONSE_OPTIONS = {
  en: [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
  ],
  ar: [
    { value: 1, label: 'لا أوافق بشدة' },
    { value: 2, label: 'لا أوافق' },
    { value: 3, label: 'محايدة' },
    { value: 4, label: 'أوافق' },
    { value: 5, label: 'أوافق بشدة' }
  ]
};

export const PersonalityTest = ({ onComplete, onSkip, language, initialData }: PersonalityTestProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>(
    initialData?.personalityResponses || {}
  );

  const questions = PERSONALITY_QUESTIONS[language];
  const options = RESPONSE_OPTIONS[language];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleResponse = (value: number) => {
    const question = questions[currentQuestion];
    setResponses(prev => ({ ...prev, [question.id]: value }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate personality scores and complete
      calculatePersonalityType();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculatePersonalityType = () => {
    const categoryScores: Record<string, number> = {};
    
    // Calculate weighted scores for each category
    questions.forEach(question => {
      const response = responses[question.id] || 3;
      const score = (response - 3) * question.weight; // Convert to -2 to +2 scale
      
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = 0;
      }
      categoryScores[question.category] += score;
    });

    // Determine personality type based on scores
    const personalityTraits = [];
    
    // Big Five personality traits
    if (categoryScores.extraversion > 0) personalityTraits.push('Extraverted');
    else personalityTraits.push('Introverted');
    
    if (categoryScores.openness > 0) personalityTraits.push('Open');
    else personalityTraits.push('Traditional');
    
    if (categoryScores.conscientiousness > 0) personalityTraits.push('Organized');
    else personalityTraits.push('Flexible');
    
    if (categoryScores.agreeableness > 0) personalityTraits.push('Collaborative');
    else personalityTraits.push('Competitive');
    
    if (categoryScores.emotional_stability > 0) personalityTraits.push('Resilient');
    else personalityTraits.push('Sensitive');

    // Determine primary personality type
    let personalityType = 'Balanced Explorer';
    
    if (categoryScores.extraversion > 1 && categoryScores.openness > 1) {
      personalityType = 'Social Innovator';
    } else if (categoryScores.conscientiousness > 1 && categoryScores.agreeableness > 1) {
      personalityType = 'Caring Organizer';
    } else if (categoryScores.openness > 1 && categoryScores.emotional_stability > 0) {
      personalityType = 'Creative Thinker';
    } else if (categoryScores.agreeableness > 1 && categoryScores.emotional_stability > 0) {
      personalityType = 'Supportive Nurturer';
    } else if (categoryScores.conscientiousness > 1 && categoryScores.extraversion > 0) {
      personalityType = 'Goal-Oriented Leader';
    } else if (categoryScores.openness > 0 && Math.abs(categoryScores.extraversion) < 1) {
      personalityType = 'Thoughtful Explorer';
    }

    onComplete({
      personalityType,
      personalityScores: categoryScores,
      personalityTraits,
      personalityResponses: responses
    });
  };

  const currentQuestionData = questions[currentQuestion];
  const hasResponse = responses[currentQuestionData?.id] !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">
          {language === 'en' ? 'Personality Assessment' : 'تقييم الشخصية'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? 'Help us understand your unique personality to personalize your experience'
            : 'ساعدينا في فهم شخصيتك الفريدة لنخصص تجربتك'
          }
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {language === 'en' ? 'Progress' : 'التقدم'}
          </span>
          <span className="font-medium">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question */}
            <div className="text-center space-y-3">
              <Badge variant="outline" className="text-xs">
                {language === 'en' ? 'Question' : 'سؤال'} {currentQuestion + 1}
              </Badge>
              <h3 className="text-lg font-semibold leading-relaxed">
                {currentQuestionData?.question}
              </h3>
            </div>

            {/* Response Options */}
            <div className="space-y-3">
              {options.map((option) => (
                <Button
                  key={option.value}
                  variant={responses[currentQuestionData?.id] === option.value ? "default" : "outline"}
                  className={`w-full justify-start text-left p-4 h-auto ${
                    responses[currentQuestionData?.id] === option.value
                      ? 'bg-primary text-white'
                      : 'glass-button hover:glass-strong'
                  }`}
                  onClick={() => handleResponse(option.value)}
                >
                  <div className="flex items-center gap-3">
                    {responses[currentQuestionData?.id] === option.value ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                    <span>{option.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="glass-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'en' ? 'Previous' : 'السابق'}
        </Button>

        {hasResponse && currentQuestion === questions.length - 1 && (
          <Button
            onClick={calculatePersonalityType}
            className="bg-gradient-primary hover:opacity-90"
          >
            {language === 'en' ? 'Complete Assessment' : 'إكمال التقييم'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentQuestion
                ? 'bg-primary w-6'
                : index < currentQuestion
                ? 'bg-primary/60'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};