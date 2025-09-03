import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, TrendingUp, Share2, Download, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssessmentResultsProps {
  assessmentTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  insights?: string[];
  recommendations?: string[];
  strengths?: string[];
  growthAreas?: string[];
  personalityType?: string;
  onRetake?: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessmentTitle,
  score,
  totalPoints,
  percentage,
  insights = [],
  recommendations = [],
  strengths = [],
  growthAreas = [],
  personalityType,
  onRetake,
}) => {
  const navigate = useNavigate();

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreMessage = (percent: number) => {
    if (percent >= 80) return 'Excellent! You\'re thriving in this area.';
    if (percent >= 60) return 'Good progress! Keep building on your strengths.';
    return 'Great starting point! Focus on growth opportunities.';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header Card */}
      <Card className="glass-card border-glass mb-6">
        <CardHeader className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          <CardDescription className="text-lg mt-2">
            {assessmentTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {/* Score Display */}
          <div className="mb-6">
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <p className="text-muted-foreground">
              {score} out of {totalPoints} points
            </p>
            <p className="text-sm mt-2 font-medium">
              {getScoreMessage(percentage)}
            </p>
          </div>

          {/* Personality Type Badge */}
          {personalityType && (
            <Badge className="mb-4 py-2 px-4 text-lg">
              {personalityType}
            </Badge>
          )}

          {/* Progress Bar */}
          <Progress value={percentage} className="h-3 mb-6" />
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Growth Areas */}
        {growthAreas.length > 0 && (
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {growthAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card className="glass-card border-glass mb-6">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="glass-card border-glass mb-6">
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-primary font-bold">{index + 1}.</span>
                  <p className="text-sm leading-relaxed flex-1">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="flex-1"
        >
          <Home className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
        {onRetake && (
          <Button
            onClick={onRetake}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
        )}
        <Button
          onClick={() => {/* TODO: Implement sharing */}}
          className="flex-1 bg-gradient-primary"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
      </div>
    </div>
  );
};