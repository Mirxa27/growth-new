import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Clock, 
  Target, 
  Share2, 
  Download, 
  RefreshCw,
  TrendingUp,
  BookOpen,
  Award,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

export interface AssessmentResult {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  passing_score: number;
  time_taken_seconds: number;
  completed_at: string;
  questions_answered?: number;
  total_questions?: number;
  detailed_breakdown?: {
    correct_answers: number;
    incorrect_answers: number;
    skipped_answers: number;
    category_scores?: Record<string, { score: number; max_score: number }>;
  };
}

interface AssessmentResultsProps {
  results: AssessmentResult;
  showDetailedBreakdown?: boolean;
  showRecommendations?: boolean;
  onRetakeAssessment?: () => void;
  onShareResults?: () => void;
  onBackToHub?: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  results,
  showDetailedBreakdown = true,
  showRecommendations = true,
  onRetakeAssessment,
  onShareResults,
  onBackToHub
}) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceLevel = (percentage: number): {
    level: string;
    color: string;
    description: string;
  } => {
    if (percentage >= 90) {
      return {
        level: 'Excellent',
        color: 'text-green-600',
        description: 'Outstanding performance! You have mastered this topic.'
      };
    } else if (percentage >= 80) {
      return {
        level: 'Very Good',
        color: 'text-blue-600',
        description: 'Great job! You have a strong understanding of this topic.'
      };
    } else if (percentage >= 70) {
      return {
        level: 'Good',
        color: 'text-purple-600',
        description: 'Well done! You have a good grasp of the fundamentals.'
      };
    } else if (percentage >= 60) {
      return {
        level: 'Fair',
        color: 'text-yellow-600',
        description: 'You understand the basics but could benefit from more practice.'
      };
    } else {
      return {
        level: 'Needs Improvement',
        color: 'text-red-600',
        description: 'Consider reviewing the material and trying again.'
      };
    }
  };

  const performance = getPerformanceLevel(results.percentage);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareData = {
        title: `My ${results.assessment_title} Results`,
        text: `I scored ${results.percentage}% on the ${results.assessment_title} assessment!`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text} Check it out: ${shareData.url}`
        );
        toast({
          title: 'Results Copied!',
          description: 'Your results have been copied to clipboard.'
        });
      }

      onShareResults?.();
    } catch (error) {
      console.warn('Sharing failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const generateRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (results.percentage >= 90) {
      recommendations.push('Consider taking more advanced assessments to challenge yourself further.');
      recommendations.push('Share your knowledge by helping others or creating content.');
      recommendations.push('Explore related topics to broaden your expertise.');
    } else if (results.percentage >= 70) {
      recommendations.push('Review the areas where you missed questions to solidify your understanding.');
      recommendations.push('Practice with similar assessments to reinforce your knowledge.');
      recommendations.push('Consider exploring advanced topics in this area.');
    } else {
      recommendations.push('Review the fundamental concepts covered in this assessment.');
      recommendations.push('Take your time to understand each topic before retaking the assessment.');
      recommendations.push('Consider seeking additional resources or guidance on this topic.');
    }

    return recommendations;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          {results.passed ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Target className="h-10 w-10 text-orange-600" />
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold">{results.assessment_title}</h1>
        <p className="text-muted-foreground">
          Assessment completed on {format(new Date(results.completed_at), 'PPP')}
        </p>
      </div>

      {/* Main Results Card */}
      <Card className="glass-strong">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">
            {results.percentage}%
          </CardTitle>
          <CardDescription className={`text-lg font-semibold ${performance.color}`}>
            {performance.level}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{performance.description}</p>
            <Progress value={results.percentage} className="w-full h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-semibold">Score</span>
              </div>
              <p className="text-2xl font-bold">{results.score}/{results.max_score}</p>
              <p className="text-sm text-muted-foreground">Points earned</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-semibold">Time</span>
              </div>
              <p className="text-2xl font-bold">{formatTime(results.time_taken_seconds)}</p>
              <p className="text-sm text-muted-foreground">Total time</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-semibold">Status</span>
              </div>
              <Badge variant={results.passed ? "default" : "secondary"} className="text-lg px-3 py-1">
                {results.passed ? 'Passed' : 'Not Passed'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Required: {results.passing_score}%
              </p>
            </div>
          </div>

          <Separator />

          {/* Detailed Breakdown */}
          {showDetailedBreakdown && results.detailed_breakdown && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Correct
                  </span>
                  <span className="font-bold text-green-600">
                    {results.detailed_breakdown.correct_answers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    Incorrect
                  </span>
                  <span className="font-bold text-red-600">
                    {results.detailed_breakdown.incorrect_answers}
                  </span>
                </div>
                
                {results.detailed_breakdown.skipped_answers > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      Skipped
                    </span>
                    <span className="font-bold text-yellow-600">
                      {results.detailed_breakdown.skipped_answers}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Scores */}
              {results.detailed_breakdown.category_scores && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Performance by Category</h4>
                  {Object.entries(results.detailed_breakdown.category_scores).map(([category, score]) => {
                    const categoryPercentage = (score.score / score.max_score) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span className="font-semibold">
                            {score.score}/{score.max_score} ({categoryPercentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={categoryPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Recommendations */}
          {showRecommendations && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {generateRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleShare} variant="outline" disabled={isSharing} className="flex-1">
              {isSharing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Share Results
            </Button>

            {onRetakeAssessment && (
              <Button onClick={onRetakeAssessment} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Assessment
              </Button>
            )}

            {onBackToHub && (
              <Button onClick={onBackToHub} className="flex-1">
                <BookOpen className="h-4 w-4 mr-2" />
                More Assessments
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badge (if passed with high score) */}
      {results.passed && results.percentage >= 90 && (
        <Card className="glass border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Achievement Unlocked!</h3>
            <p className="text-yellow-700">
              Congratulations! You've earned a high-performance badge for scoring {results.percentage}% 
              on the {results.assessment_title} assessment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Continue Learning</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Explore related assessments</li>
                <li>• Take advanced level tests</li>
                <li>• Join our learning community</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Track Progress</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• View your assessment history</li>
                <li>• Set learning goals</li>
                <li>• Earn certificates and badges</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentResults;