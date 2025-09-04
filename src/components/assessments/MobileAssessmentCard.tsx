import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Target, Brain, Heart, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicAssessments } from '@/services/api/assessment.service';
import { Assessment } from '@/types/assessment';

interface AssessmentCardProps {
  assessment: Assessment;
  isPublic?: boolean;
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

export const MobileAssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, isPublic = false }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const fetchAssessments = async () => {
      const data = await getPublicAssessments();
      setAssessments(data);
    };

    fetchAssessments();
  }, []);

  const handleStart = () => {
    if (isPublic) {
      navigate(`/assessment/${assessment.id}`);
    } else {
      navigate(`/assessment/${assessment.id}`);
    }
  };

  return (
    <Card className="glass-card border-glass hover:shadow-lg transition-all duration-300 touch-manipulation">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getCategoryIcon(assessment.category)}
            <Badge variant="secondary" className="text-xs">
              {assessment.type === 'quiz' ? 'Quiz' : assessment.type === 'exploration' ? 'Exploration' : 'Assessment'}
            </Badge>
          </div>
          {assessment.difficulty && (
            <Badge className={`text-xs ${getDifficultyColor(assessment.difficulty)}`}>
              {assessment.difficulty}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2">{assessment.title}</CardTitle>
        <CardDescription className="text-sm line-clamp-3 mt-1">
          {assessment.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            {assessment.question_count && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {assessment.question_count} questions
              </span>
            )}
            {assessment.estimated_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {assessment.estimated_time} min
              </span>
            )}
          </div>
        </div>
        <Button 
          onClick={handleStart}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="sm"
        >
          {isPublic ? 'Start Free Assessment' : 'Begin Assessment'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};