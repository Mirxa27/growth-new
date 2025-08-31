import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { getPublicAssessments } from '@/data/assessments';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Tables } from '@/integrations/supabase/types';

type Assessment = Tables<'assessments'>;

interface AssessmentBrowserProps {
  onAssessmentSelect?: (assessment: Assessment) => void;
  filterPublic?: boolean;
}

export const AssessmentBrowser: React.FC<AssessmentBrowserProps> = ({ onAssessmentSelect, filterPublic = false }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('assessments')
          .select('id, title, description, type')
          .order('created_at', { ascending: false });

        if (filterPublic) {
          query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setAssessments(data || []);
      } catch (err: any) {
        console.error('Failed to fetch assessments from supabase.', err?.message || err);
        setError((err && err.message) || String(err));
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [filterPublic]);

  if (loading) return (
    <div className="glass-strong p-4 flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (error) return <div className="glass-strong p-4 text-red-500">Error: {error}</div>;
  if (!assessments.length) return <div className="glass-strong p-4 text-center">No assessments available.</div>;

  return (
    <div className="glass-strong p-4">
      <h2 className="text-heading mb-4 text-center">Available Assessments</h2>
      <ul className="flex flex-col gap-4">
        {assessments.map(a => (
          <li key={a.id} className="border-b border-white/10 pb-4 last:border-b-0">
            <div className="font-bold text-lg">{a.title}</div>
            <div className="text-sm text-foreground/70 my-1">{a.description}</div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-primary uppercase font-semibold">Type: {a.type}</div>
              {onAssessmentSelect && (
                <Button size="sm" onClick={() => onAssessmentSelect(a)}>
                  Start Assessment
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssessmentBrowser;
