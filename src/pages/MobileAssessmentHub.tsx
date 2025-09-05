import React, { useEffect, useState, useCallback } from 'react';
import { MobileAssessmentCard } from '@/components/assessments/MobileAssessmentCard';
import { getPublicAssessments } from '@/services/api/assessment.service';
import { Assessment } from '@/data/assessments';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MobileAssessmentHub: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAssessments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      
      const publicAssessments = await getPublicAssessments();
      setAssessments(publicAssessments);
    } catch (err) {
      console.error('Failed to load assessments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessments. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAssessments(false);
  };

  const handleRetry = async () => {
    await loadAssessments();
  };

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Assessments</h2>
          <p className="text-muted-foreground">Preparing your personalized assessment experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="glass-card p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Assessments</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRetry} className="w-full sm:w-auto">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="w-full sm:w-auto"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="glass-card p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Assessments Available</h2>
            <p className="text-muted-foreground mb-6">
              No assessments are currently available. Please check back later or contact support.
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Personal Growth Assessments</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="glass hover:glass-glow"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assessments.map((assessment) => (
          <MobileAssessmentCard key={assessment.id} assessment={assessment} isPublic />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Discover your strengths, understand your personality, and unlock your potential with our scientifically-designed assessments.
        </p>
      </div>
    </div>
  );
};

export default MobileAssessmentHub;
