import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BalanceWheelProps {
  onComplete?: (results: any) => void;
  embedded?: boolean;
}

const lifeAreas = [
  {
    id: 'career',
    name: 'Career & Work',
    description: 'Professional growth and job satisfaction',
    color: 'text-blue-500'
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Family, friends, and romantic connections',
    color: 'text-pink-500'
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Physical and mental well-being',
    color: 'text-green-500'
  },
  {
    id: 'personal_growth',
    name: 'Personal Growth',
    description: 'Learning, skills, and self-development',
    color: 'text-purple-500'
  },
  {
    id: 'finances',
    name: 'Finances',
    description: 'Financial security and money management',
    color: 'text-yellow-500'
  },
  {
    id: 'recreation',
    name: 'Recreation & Fun',
    description: 'Hobbies, entertainment, and leisure time',
    color: 'text-orange-500'
  }
];

export const BalanceWheel = ({ onComplete, embedded = false }: BalanceWheelProps) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [goals, setGoals] = useState<Record<string, string>>({});
  const [currentArea, setCurrentArea] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRatingChange = (areaId: string, value: number[]) => {
    setRatings({ ...ratings, [areaId]: value[0] });
  };

  const handleGoalChange = (areaId: string, goal: string) => {
    setGoals({ ...goals, [areaId]: goal });
  };

  const nextArea = () => {
    if (currentArea < lifeAreas.length - 1) {
      setCurrentArea(currentArea + 1);
    } else {
      completeAssessment();
    }
  };

  const prevArea = () => {
    if (currentArea > 0) {
      setCurrentArea(currentArea - 1);
    }
  };

  const completeAssessment = () => {
    const results = {
      ratings,
      goals,
      completed_at: new Date().toISOString(),
      overall_satisfaction: Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length
    };

    setIsComplete(true);
    
    if (onComplete) {
      onComplete(results);
    }

    toast({
      title: "Balance Wheel Complete!",
      description: "Your life balance assessment is ready.",
    });
  };

  const progress = ((currentArea + 1) / lifeAreas.length) * 100;
  const currentAreaData = lifeAreas[currentArea];
  const currentRating = ratings[currentAreaData?.id] || 5;
  const canProceed = ratings[currentAreaData?.id] !== undefined;

  if (isComplete) {
    const overallSatisfaction = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;
    
    return (
      <Card className="glass border-card-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Balance Wheel Complete!</CardTitle>
          <CardDescription>
            Your life balance assessment is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-6 glass rounded-2xl bg-gradient-primary/10">
            <h3 className="text-xl font-bold mb-2 text-primary">
              Overall Satisfaction: {overallSatisfaction.toFixed(1)}/10
            </h3>
            <p className="text-muted-foreground">
              This assessment helps identify areas for growth and improvement in your life.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {lifeAreas.map((area) => (
              <div key={area.id} className="flex justify-between p-3 glass rounded-lg">
                <span className={area.color}>{area.name}</span>
                <span className="font-semibold">{ratings[area.id] || 0}/10</span>
              </div>
            ))}
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
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Life Balance Wheel</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentArea + 1} / {lifeAreas.length}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <motion.div
          key={currentArea}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <h3 className={`text-xl font-semibold mb-2 ${currentAreaData?.color}`}>
              {currentAreaData?.name}
            </h3>
            <p className="text-muted-foreground">
              {currentAreaData?.description}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                How satisfied are you with this area? ({currentRating}/10)
              </Label>
              <div className="mt-3">
                <Slider
                  value={[currentRating]}
                  onValueChange={(value) => handleRatingChange(currentAreaData.id, value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Very Unsatisfied</span>
                  <span>Very Satisfied</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor={`goal-${currentAreaData.id}`} className="text-base font-medium">
                What would you like to improve in this area? (Optional)
              </Label>
              <Textarea
                id={`goal-${currentAreaData.id}`}
                placeholder="Describe your goals or what you'd like to change..."
                value={goals[currentAreaData.id] || ''}
                onChange={(e) => handleGoalChange(currentAreaData.id, e.target.value)}
                className="mt-2 glass"
                rows={3}
              />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={prevArea}
            disabled={currentArea === 0}
            variant="outline"
            className="glass"
          >
            Previous
          </Button>

          <Button
            onClick={nextArea}
            disabled={!canProceed}
            className="bg-gradient-primary"
          >
            {currentArea === lifeAreas.length - 1 ? (
              <>
                Complete
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next Area
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};