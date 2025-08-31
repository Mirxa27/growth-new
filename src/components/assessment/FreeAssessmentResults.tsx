import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RotateCcw, 
  Share2, 
  Download, 
  Home,
  TrendingUp,
  Lightbulb,
  Target,
  Award
} from 'lucide-react';
import { Assessment } from '@/data/assessments';

interface FreeAssessmentResultsProps {
  results: any;
  assessment: Assessment;
  onRetake: () => void;
  onNewAssessment: () => void;
}

export const FreeAssessmentResults: React.FC<FreeAssessmentResultsProps> = ({
  results,
  assessment,
  onRetake,
  onNewAssessment
}) => {
  const getScoreColor = (score: number, maxScore: number = 25) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, maxScore: number = 25) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'destructive';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderScoreBar = (label: string, score: number, maxScore: number = 25) => {
    const percentage = Math.min((score / maxScore) * 100, 100);
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-sm font-bold ${getScoreColor(score, maxScore)}`}>
            {score}/{maxScore}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };

  const renderCategoryResults = () => {
    if (!results.scores) return null;

    const entries = Object.entries(results.scores);
    if (entries.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Assessment Results
          </CardTitle>
          <CardDescription>
            Your scores across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.map(([key, value]) => {
            if (typeof value === 'number') {
              return renderScoreBar(
                key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                value as number
              );
            }
            return null;
          })}
        </CardContent>
      </Card>
    );
  };

  const renderInsights = () => {
    if (!results.insights || results.insights.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Key Insights
          </CardTitle>
          <CardDescription>
            What your responses reveal about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!results.recommendations || results.recommendations.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>
            Actionable steps based on your results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.recommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSummary = () => {
    const completionRate = (results.answeredQuestions / results.totalQuestions) * 100;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{results.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.answeredQuestions}</div>
              <div className="text-sm text-gray-600">Answered</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatTime(results.completionTime)}</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <Badge variant={completionRate >= 80 ? 'default' : 'secondary'}>
                {completionRate.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
          <p className="text-gray-600">
            Your {assessment.title} results are ready
          </p>
        </div>

        {/* Summary */}
        {renderSummary()}

        {/* Category Results */}
        {renderCategoryResults()}

        {/* Insights */}
        {renderInsights()}

        {/* Recommendations */}
        {renderRecommendations()}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={onRetake}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
          
          <Button 
            onClick={onNewAssessment}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Try Another Assessment
          </Button>
        </div>

        {/* Share Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center text-lg">Share Your Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Share your insights with friends or save for later reflection
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Want more detailed insights? Consider creating an account for personalized recommendations and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
};
