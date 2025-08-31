
import { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';

interface AssessmentResult {
  id: number;
  score: number;
  submitted_at: string;
  answers: any;
}

interface AssessmentResultsProps {
  userId: string;
  assessmentId: number;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({ userId, assessmentId }) => {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_id', assessmentId)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setResult(data);
      }
      setLoading(false);
    };
    fetchResult();
  }, [userId, assessmentId]);

  if (loading) return <div className="glass-card p-4">Loading...</div>;
  if (error) return <div className="glass-card p-4 text-red-500">Error: {error}</div>;
  if (!result) return <div className="glass-card p-4">No results found.</div>;

  return (
    <div className="glass-card p-4">
      <h2 className="text-heading mb-2">Your Assessment Result</h2>
      <div>Score: {result.score}</div>
      <div>Submitted: {new Date(result.submitted_at).toLocaleString()}</div>
      <div className="mt-2">
        <h3 className="text-display mb-1">Answers</h3>
        <pre className="bg-black/10 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(result.answers, null, 2)}</pre>
      </div>
    </div>
  );
};