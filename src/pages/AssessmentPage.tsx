import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnonymousAssessment, Assessment } from '@/components/assessments/AnonymousAssessment';
import { AssessmentResults } from '@/components/assessments/AssessmentResults';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

const AssessmentPage: React.FC = () => {
  const { id: assessmentSlug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (assessmentSlug) {
      loadAssessment(assessmentSlug);
    } else {
      setError('No assessment specified');
      setLoading(false);
    }
  }, [assessmentSlug]);

  const loadAssessment = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get assessment by slug using the new RPC function
      const { data, error } = await supabase.rpc('get_assessment_with_questions', {
        p_assessment_id: null // We'll need to get by slug instead
      });

      // Alternative approach - get assessment by slug directly
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          id,
          slug,
          title,
          description,
          instructions,
          type,
          difficulty,
          estimated_time,
          passing_score,
          max_attempts,
          is_public,
          requires_auth,
          tags,
          learning_outcomes
        `)
        .eq('slug', slug)
        .eq('is_public', true)
        .eq('is_active', true)
        .single();

      if (assessmentError || !assessmentData) {
        throw new Error('Assessment not found or not accessible');
      }

      // Get questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          id,
          question_text,
          question_type,
          order_index,
          points,
          time_limit,
          hint,
          explanation,
          media_type,
          media_url,
          media_caption
        `)
        .eq('assessment_id', assessmentData.id)
        .order('order_index');

      if (questionsError) {
        throw new Error('Failed to load assessment questions');
      }

      // Get options for each question
      const questions = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: optionsData } = await supabase
            .from('assessment_options')
            .select(`
              id,
              option_text,
              order_index,
              media_url,
              media_type
            `)
            .eq('question_id', question.id)
            .order('order_index');

          return {
            ...question,
            options: optionsData || []
          };
        })
      );

      // Create assessment object
      const loadedAssessment: Assessment = {
        ...assessmentData,
        questions: questions
      };

      setAssessment(loadedAssessment);
      logger.info('Assessment loaded successfully', { slug, title: assessmentData.title });

    } catch (error) {
      logger.error('Failed to load assessment', 'AssessmentPage', error);
      setError(error instanceof Error ? error.message : 'Failed to load assessment');
      
      toast({
        title: 'Assessment Not Found',
        description: 'The requested assessment could not be loaded.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = (assessmentResults: any) => {
    setResults(assessmentResults);
    setShowResults(true);
    
    toast({
      title: 'Assessment Complete!',
      description: 'Your results are ready to view.',
    });

    logger.info('Assessment completed', { 
      assessmentSlug, 
      score: assessmentResults.percentage 
    });
  };

  const handleRetakeAssessment = () => {
    setResults(null);
    setShowResults(false);
    
    toast({
      title: 'Starting Fresh',
      description: 'Beginning a new assessment attempt.',
    });
  };

  const handleBackToHub = () => {
    navigate('/mobile-assessment-hub');
  };

  const handleBackToAssessment = () => {
    setShowResults(false);
    setResults(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold">Loading Assessment</h2>
          <p className="text-muted-foreground">Preparing your personalized assessment experience...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="glass-strong max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment Not Available</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The requested assessment could not be found.'}
            </p>
            <div className="space-y-2">
              <Button onClick={handleBackToHub} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assessment Hub
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <AssessmentResults
          results={results}
          showDetailedBreakdown={true}
          showRecommendations={true}
          onRetakeAssessment={handleRetakeAssessment}
          onBackToHub={handleBackToHub}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <AnonymousAssessment
        assessment={assessment}
        onComplete={handleAssessmentComplete}
        onBack={handleBackToAssessment}
      />
    </div>
  );
};

export default AssessmentPage;