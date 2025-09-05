import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Target, Brain, Heart, Star, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Assessment } from '@/types/assessment';
import { useToast } from '@/hooks/use-toast';

interface AssessmentCardProps {
  assessment: Assessment;
  isPublic?: boolean;
  onAssessmentClick?: (assessmentId: string) => void;
}

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'personal development':
    case 'confidence':
      return <Star className="w-4 h-4" />;
    case 'emotional intelligence':
    case 'relationships':
      return <Heart className="w-4 h-4" />;
    case 'wellness':
    case 'health':
      return <Sparkles className="w-4 h-4" />;
    case 'purpose':
    case 'career':
      return <Target className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
};

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  }
};

const getCategoryColor = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'personal development':
    case 'confidence':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    case 'emotional intelligence':
    case 'relationships':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100';
    case 'wellness':
    case 'health':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'purpose':
    case 'career':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  }
};

export const MobileAssessmentCard: React.FC<AssessmentCardProps> = ({ 
  assessment, 
  isPublic = false,
  onAssessmentClick 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = useCallback(async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      if (onAssessmentClick) {
        onAssessmentClick(assessment.id);
      } else {
        await navigate(`/assessment/${assessment.id}`);
      }
    } catch (error) {
      console.error('Failed to start assessment:', error);
      toast({
        title: "Unable to Start Assessment",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  }, [assessment.id, isStarting, navigate, onAssessmentClick, toast]);

  const getAssessmentTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'quiz':
        return 'Quiz';
      case 'exploration':
        return 'Exploration';
      case 'personality':
        return 'Personality Test';
      case 'cognitive':
        return 'Cognitive Assessment';
      case 'communication':
        return 'Communication Style';
      case 'lifestyle':
        return 'Lifestyle Check';
      default:
        return 'Assessment';
    }
  };

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  };

  return (
    <Card className="glass-card border-glass hover:shadow-lg transition-all duration-300 touch-manipulation group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getCategoryColor(assessment.category)}`}>
              {getCategoryIcon(assessment.category)}
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {getAssessmentTypeLabel(assessment.type)}
            </Badge>
          </div>
          {(assessment as Assessment & { difficulty?: string }).difficulty && (
            <Badge className={`text-xs font-medium ${getDifficultyColor((assessment as Assessment & { difficulty?: string }).difficulty)}`}>
              {(assessment as Assessment & { difficulty?: string }).difficulty}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
          {assessment.title}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-3 mt-2 leading-relaxed">
          {assessment.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            {assessment.questions?.length && (
              <span className="flex items-center gap-1 font-medium">
                <Target className="w-3 h-3" />
                {assessment.questions.length} questions
              </span>
            )}
            {assessment.estimatedTime && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {formatEstimatedTime(assessment.estimatedTime)}
              </span>
            )}
          </div>
          {assessment.category && (
            <Badge variant="outline" className="text-xs">
              {assessment.category}
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleStart}
          className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 group-hover:shadow-glow"
          size="sm"
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              {isPublic ? 'Start Free Assessment' : 'Begin Assessment'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
