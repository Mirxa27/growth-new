import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentResults } from '@/components/assessments/AssessmentResults';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorHandler, ErrorSeverity, ErrorCategory } from '@/services/error/error-handler.service';

interface AssessmentResult {
  id: string;
  score: number;
  total_points: number;
  percentage: number;
  answers: any;
  assessment: {
    id: number;
    title: string;
    type: string;
  };
}

const ResultsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (id?.startsWith('temp-')) {
      // Handle temporary results from public assessments
      handleTempResults();
    } else {
      loadResults();
    }
  }, [id]);

  const handleTempResults = () => {
    const state = location.state as any;
    if (!state?.assessment || !state?.answers) {
      toast({
        title: "Error",
        description: "Results not found. Please take the assessment again.",
        variant: "destructive"
      });
      navigate('/mobile-assessment-hub');
      return;
    }

    // Calculate temporary results
    const tempResult: AssessmentResult = {
      id: id!,
      score: 0,
      total_points: state.questions.length,
      percentage: 75, // Default for explorations
      answers: state.answers,
      assessment: state.assessment
    };

    setResult(tempResult);
    generateInsights(tempResult);
    setLoading(false);
  };

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select(`
          *,
          assessment:assessments (
            id,
            title,
            type
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setResult(data);
      generateInsights(data);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.DATABASE,
        context: { action: 'load_assessment_results', assessmentId: id }
      });
      toast({
        title: "Error",
        description: "Failed to load results. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (resultData: AssessmentResult) => {
    // Generate insights based on assessment type and score
    const score = resultData.percentage;

    const baseInsights = [
      "Your responses show a thoughtful approach to personal growth.",
      "You demonstrate self-awareness in key areas of development.",
      "There are exciting opportunities for continued growth ahead."
    ];

    const baseRecommendations = [
      "Continue with daily self-reflection practices to deepen insights.",
      "Consider joining our community to connect with like-minded individuals.",
      "Explore our guided meditations for enhanced self-awareness.",
      "Track your progress by retaking this assessment in 30 days."
    ];

    if (score >= 80) {
      baseInsights.push("You're showing exceptional strength in this area!");
      baseRecommendations.unshift("Focus on sharing your wisdom with others who can benefit.");
    } else if (score >= 60) {
      baseInsights.push("You're on a positive trajectory with room for growth.");
      baseRecommendations.unshift("Consider our advanced workshops to accelerate your progress.");
    } else {
      baseInsights.push("This is a wonderful starting point for transformation.");
      baseRecommendations.unshift("Start with our beginner-friendly resources and practices.");
    }

    setInsights(baseInsights);
    setRecommendations(baseRecommendations);
  };

  const handleRetake = () => {
    if (result?.assessment.id) {
      navigate(`/assessment/${result.assessment.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Results not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <AssessmentResults
        assessmentTitle={result.assessment.title}
        score={result.score}
        totalPoints={result.total_points}
        percentage={result.percentage}
        insights={insights}
        recommendations={recommendations}
        onRetake={handleRetake}
      />
    </div>
  );
};

export default ResultsPage;
