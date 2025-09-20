import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RotateCcw, 
  Share2, 
  Download, 
  Home,
  TrendingUp,
  Lightbulb,
  Target,
  Award,
  BookOpen
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data?.user));
  }, []);
  const normalized = useMemo(() => {
    const persisted = (results && (results.persisted || results.inserted)) || null as any;
    const assessmentResults = (persisted && persisted.assessment_results) || {} as any;
    const ai = (persisted && persisted.ai_insights) || {} as any;
    return {
      summary: results?.summary ?? ai?.summary ?? '',
      insights: results?.insights ?? ai?.insights ?? [],
      recommendations: results?.recommendations ?? ai?.recommendations ?? [],
      scores: results?.scores ?? assessmentResults?.scores ?? {},
      perQuestion: assessmentResults?.per_question ?? [],
      answeredQuestions: results?.answeredQuestions ?? (assessmentResults?.per_question?.length ?? 0),
      totalQuestions: results?.totalQuestions ?? (assessmentResults?.per_question?.length ?? 0),
      completionTime: results?.completionTime ?? (assessmentResults?.time_taken_seconds ?? 0),
      resultId: results?.result_id ?? (persisted?.id ?? null),
    };
  }, [results]);
  const getScoreColor = (score: number, maxScore: number = 25) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
    if (!normalized.scores) return null;

    const entries = Object.entries(normalized.scores as Record<string, number>);
    if (entries.length === 0) return null;

    return (
      <Card className="mb-6 glass border-card-border">
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
    if (!normalized.insights || (normalized.insights as any[]).length === 0) return null;

    return (
      <Card className="mb-6 glass border-card-border">
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
            {(normalized.insights as string[]).map((insight: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 glass border-card-border rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!normalized.recommendations || (normalized.recommendations as any[]).length === 0) return null;

    return (
      <Card className="mb-6 glass border-card-border">
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
            {(normalized.recommendations as string[]).map((rec: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 glass border-card-border rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnswersBreakdown = () => {
    const items = (normalized.perQuestion as any[]) || [];
    if (!items || items.length === 0) return null;

    return (
      <Card className="mb-6 glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Answers Breakdown
          </CardTitle>
          <CardDescription>
            Your responses per question with any available scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((row: any, idx: number) => (
              <div key={idx} className="p-3 glass border-card-border rounded-lg">
                <div className="text-sm font-medium mb-1">{row.question_text || `Question ${idx + 1}`}</div>
                <div className="text-xs text-muted-foreground">
                  Answer: {Array.isArray(row.raw_answer) ? row.raw_answer.join(', ') : String(row.raw_answer ?? '')}
                </div>
                {(typeof row.score === 'number') && (
                  <div className="text-xs text-muted-foreground">Score: {row.score}{row.max_score ? ` / ${row.max_score}` : ''}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSummary = () => {
    const total = normalized.totalQuestions || normalized.answeredQuestions || 0;
    const answered = normalized.answeredQuestions || 0;
    const completionRate = total > 0 ? (answered / total) * 100 : 0;
    
    return (
      <Card className="mb-6 glass border-card-border">
        <CardHeader>
          <CardTitle className="text-center">Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 glass border-card-border rounded-lg">
              <div className="text-2xl font-bold text-primary">{total}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="p-4 glass border-card-border rounded-lg">
              <div className="text-2xl font-bold text-primary">{answered}</div>
              <div className="text-sm text-muted-foreground">Answered</div>
            </div>
            <div className="p-4 glass border-card-border rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatTime(Number(normalized.completionTime || 0))}</div>
              <div className="text-sm text-muted-foreground">Time Taken</div>
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
          {normalized.resultId && (
            <div className="text-center mt-4 text-xs text-muted-foreground">Result ID: {String(normalized.resultId)}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleShare = async () => {
    const url = normalized.resultId ? `${window.location.origin}/results/${encodeURIComponent(String(normalized.resultId))}` : undefined;
    const shareData = {
      title: `${assessment.title} — Assessment Results`,
      text: normalized.summary || `My results for ${assessment.title}`,
      url
    } as ShareData;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        const content = `${shareData.title}\n\n${shareData.text}${url ? `\n\n${url}` : ''}`;
        await navigator.clipboard.writeText(content);
        toast({ title: 'Copied', description: 'Results copied to clipboard.' });
      } else {
        toast({ title: 'Share unavailable', description: 'Use your browser menu to share.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Share canceled', description: 'No problem, you can try again later.' });
    }
  };

  const handleDownload = () => {
    const data = {
      assessment: { id: assessment.id, title: assessment.title },
      summary: normalized.summary,
      insights: normalized.insights,
      recommendations: normalized.recommendations,
      scores: normalized.scores,
      resultId: normalized.resultId,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.id}-results.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const renderAIResults = () => {
    if (!results.aiAnalysis || results.aiAnalysis.length === 0) return null;
  
    return (
      <Card className="mb-6 glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            AI-Driven Insights
          </CardTitle>
          <CardDescription>
            Advanced analysis based on your responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.aiAnalysis.map((analysis: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 glass-subtle rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-glass-muted">{analysis}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
          <p className="text-muted-foreground">Your {assessment.title} results are ready</p>
          {normalized.summary && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">{normalized.summary}</p>
          )}
        </div>

        {/* Summary */}
        {renderSummary()}

        {/* Category Results */}
        {renderCategoryResults()}

        {/* Insights */}
        {renderInsights()}

        {/* Recommendations */}
        {renderRecommendations()}

        {/* Answers Breakdown */}
        {renderAnswersBreakdown()}

        {/* Save CTA for visitors */}
        {!isLoggedIn && normalized.resultId && (
          <Card className="glass border-card-border mt-6">
            <CardHeader>
              <CardTitle className="text-center text-lg">Save Your Results</CardTitle>
              <CardDescription className="text-center">Create a free account to store your results and track progress</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate(`/auth?from=results&rid=${encodeURIComponent(String(normalized.resultId))}`)}>
                Create Account to Save
              </Button>
            </CardContent>
          </Card>
        )}

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
        <Card className="mt-6 glass border-card-border">
          <CardHeader>
            <CardTitle className="text-center text-lg">Share Your Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Share your insights with friends or save for later reflection
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
              {normalized.resultId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const link = `${window.location.origin}/results/${encodeURIComponent(String(normalized.resultId))}`;
                      try {
                        await navigator.clipboard.writeText(link);
                        toast({ title: 'Link copied', description: 'Results link copied to clipboard.' });
                      } catch {
                        toast({ title: 'Copy failed', description: 'Unable to copy link.', variant: 'destructive' });
                      }
                    }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = `${window.location.origin}/results/${encodeURIComponent(String(normalized.resultId))}`;
                      window.open(link, '_blank');
                    }}
                  >
                    Open Link
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Want more detailed insights? Consider creating an account for personalized recommendations and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
}; 
