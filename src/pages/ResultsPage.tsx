import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FreeAssessmentResults } from '@/components/assessment/FreeAssessmentResults';
import { getAssessmentById, Assessment } from '@/data/assessments';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setError('Missing result id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('assessment_results')
          .select('id, result_data')
          .eq('id', id)
          .single();

        if (error) throw error;

        const rd = (data as any)?.result_data || {};
        const ai = rd?.ai_enrichment || {};

        // Prepare results object compatible with FreeAssessmentResults normalization
        const shapedResults = {
          result_id: data.id,
          summary: ai.summary,
          insights: ai.insights,
          recommendations: ai.recommendations,
          persisted: {
            id: data.id,
            assessment_results: rd,
            ai_insights: ai,
          },
        };
        setResults(shapedResults);

        // Resolve assessment for header display
        const aid = String(rd.assessment_id ?? '');
        const local = aid ? getAssessmentById(aid) : null;
        if (local) {
          setAssessment(local);
        } else {
          // Fallback to a minimal Assessment-like object based on stored data
          const minimal: Assessment = {
            id: aid || 'unknown',
            title: rd.assessment_title || 'Assessment Results',
            description: '',
            type: rd.assessment_type || 'public',
            category: 'general',
            visibility: 'public',
            estimatedTime: rd.time_taken_seconds ? Math.ceil(Number(rd.time_taken_seconds) / 60) : 0,
            questions: [],
            scoring: { type: 'cumulative' },
            results: { summary: '', insights: [], recommendations: [] },
          };
          setAssessment(minimal);
        }
      } catch (e: any) {
        console.error('Failed to load result:', e);
        setError(e?.message || 'Unable to load result');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !results || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2 font-medium">{error || 'Result not found'}</div>
            <Button variant="outline" onClick={() => navigate('/mobile-assessment-hub')}>Back to Hub</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4">
      <div className="max-w-4xl mx-auto">
        <FreeAssessmentResults
          results={results}
          assessment={assessment}
          onRetake={() => navigate(`/assessment/${assessment.id}`)}
          onNewAssessment={() => navigate('/mobile-assessment-hub')}
        />
      </div>
    </div>
  );
};

export default ResultsPage;

