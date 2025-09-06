import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  ArrowRight,
  Heart,
  Briefcase,
  Activity,
  BookOpen,
  Users,
  Sparkles,
  DollarSign,
  Gamepad2
} from 'lucide-react';

interface BalanceWheelProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  language: 'en' | 'ar';
  initialData?: any;
}

const LIFE_AREAS = {
  en: [
    { id: 'relationships', name: 'Love & Relationships', icon: Heart, color: '#E91E63', description: 'Romantic relationships, dating, intimacy' },
    { id: 'career', name: 'Career & Purpose', icon: Briefcase, color: '#2196F3', description: 'Work, professional growth, life purpose' },
    { id: 'health', name: 'Health & Wellness', icon: Activity, color: '#4CAF50', description: 'Physical health, mental wellbeing, self-care' },
    { id: 'personal_growth', name: 'Personal Growth', icon: BookOpen, color: '#9C27B0', description: 'Learning, self-improvement, skills' },
    { id: 'family', name: 'Family & Friends', icon: Users, color: '#FF9800', description: 'Family relationships, friendships, social life' },
    { id: 'spirituality', name: 'Spirituality & Values', icon: Sparkles, color: '#673AB7', description: 'Spiritual practice, core values, meaning' },
    { id: 'finances', name: 'Money & Security', icon: DollarSign, color: '#795548', description: 'Financial stability, money management' },
    { id: 'recreation', name: 'Fun & Recreation', icon: Gamepad2, color: '#607D8B', description: 'Hobbies, entertainment, relaxation' },
  ],
  ar: [
    { id: 'relationships', name: 'الحب والعلاقات', icon: Heart, color: '#E91E63', description: 'العلاقات العاطفية والزواج والحميمية' },
    { id: 'career', name: 'المهنة والهدف', icon: Briefcase, color: '#2196F3', description: 'العمل والنمو المهني وهدف الحياة' },
    { id: 'health', name: 'الصحة والعافية', icon: Activity, color: '#4CAF50', description: 'الصحة الجسدية والنفسية والعناية بالذات' },
    { id: 'personal_growth', name: 'النمو الشخصي', icon: BookOpen, color: '#9C27B0', description: 'التعلم وتطوير الذات والمهارات' },
    { id: 'family', name: 'الأسرة والأصدقاء', icon: Users, color: '#FF9800', description: 'العلاقات الأسرية والصداقات والحياة الاجتماعية' },
    { id: 'spirituality', name: 'الروحانية والقيم', icon: Sparkles, color: '#673AB7', description: 'الممارسة الروحية والقيم الأساسية والمعنى' },
    { id: 'finances', name: 'المال والأمان', icon: DollarSign, color: '#795548', description: 'الاستقرار المالي وإدارة المال' },
    { id: 'recreation', name: 'المرح والترفيه', icon: Gamepad2, color: '#607D8B', description: 'الهوايات والترفيه والاسترخاء' },
  ]
};

export const BalanceWheel = ({ onComplete, onSkip, language, initialData }: BalanceWheelProps) => {
  const [scores, setScores] = useState<Record<string, number>>(
    initialData?.balanceWheelScores || 
    Object.fromEntries(LIFE_AREAS[language].map(area => [area.id, 5]))
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const areas = LIFE_AREAS[language];

  useEffect(() => {
    drawWheel();
  }, [scores, language]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    for (let i = 1; i <= 10; i++) {
      const radius = (maxRadius / 10) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + (i * 0.05)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw sections
    const angleStep = (2 * Math.PI) / areas.length;
    
    areas.forEach((area, index) => {
      const startAngle = index * angleStep - Math.PI / 2;
      const endAngle = (index + 1) * angleStep - Math.PI / 2;
      const score = scores[area.id] || 5;
      const radius = (maxRadius / 10) * score;

      // Draw section
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Fill with area color
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `${area.color}20`);
      gradient.addColorStop(1, `${area.color}60`);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Border
      ctx.strokeStyle = area.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw section dividers
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(startAngle) * maxRadius,
        centerY + Math.sin(startAngle) * maxRadius
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw labels
      const labelAngle = startAngle + angleStep / 2;
      const labelRadius = maxRadius + 20;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      ctx.fillStyle = area.color;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(area.name.split(' ')[0], labelX, labelY);
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#666';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Life', centerX, centerY - 5);
    ctx.fillText('Balance', centerX, centerY + 8);
  };

  const handleScoreChange = (areaId: string, newScore: number) => {
    setScores(prev => ({ ...prev, [areaId]: newScore }));
  };

  const handleContinue = () => {
    onComplete({
      balanceWheelScores: scores
    });
  };

  const getAverageScore = () => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total / areas.length * 10) / 10;
  };

  const getLowestAreas = () => {
    return areas
      .map(area => ({ ...area, score: scores[area.id] }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">
          {language === 'en' ? 'Life Balance Wheel' : 'عجلة توازن الحياة'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? 'Rate your satisfaction in each area of life from 1-10'
            : 'قيّمي مستوى رضاك في كل مجال من مجالات الحياة من ١-١٠'
          }
        </p>
      </div>

      {/* Balance Wheel Visualization */}
      <Card className="glass-strong">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="max-w-full h-auto"
            />
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-primary/20 text-primary">
                {language === 'en' ? 'Average' : 'المتوسط'}: {getAverageScore()}/10
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Life Area Sliders */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          {language === 'en' ? 'Rate Each Life Area' : 'قيّمي كل مجال من مجالات الحياة'}
        </h3>
        <div className="space-y-4">
          {areas.map((area) => {
            const AreaIcon = area.icon;
            return (
              <Card key={area.id} className="glass-subtle">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${area.color}20` }}
                        >
                          <AreaIcon className="w-4 h-4" style={{ color: area.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-xs text-muted-foreground">{area.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {scores[area.id]}/10
                      </Badge>
                    </div>
                    <Slider
                      value={[scores[area.id]]}
                      onValueChange={(value) => handleScoreChange(area.id, value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <Card className="glass-subtle border-secondary/20">
        <CardContent className="p-4">
          <h4 className="font-medium text-secondary mb-3">
            {language === 'en' ? 'Areas for Growth' : 'مجالات للنمو'}
          </h4>
          <div className="space-y-2">
            {getLowestAreas().map((area, index) => (
              <div key={area.id} className="flex items-center gap-3">
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{area.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Current score' : 'النتيجة الحالية'}: {area.score}/10
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {language === 'en' 
              ? 'NewMe will focus on these areas to help you achieve better balance'
              : 'ستركز نيومي على هذه المجالات لمساعدتك في تحقيق توازن أفضل'
            }
          </p>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        className="w-full bg-gradient-primary hover:opacity-90"
        size="lg"
      >
        {language === 'en' ? 'Continue' : 'متابعة'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};