import { MinimalPlaceholder } from '../admin/MinimalPlaceholder';

interface AssessmentBrowserProps {
  onAssessmentSelect?: (assessment: any) => void;
}

export const AssessmentBrowser: React.FC<AssessmentBrowserProps> = () => {
  return <MinimalPlaceholder />;

  import { useEffect, useState } from 'react';
  import { supabase } from '../../integrations/supabase/client';

  interface Assessment {
    id: number;
    title: string;
    description: string;
    type: string;
  }

  const AssessmentBrowser: React.FC<AssessmentBrowserProps> = () => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchAssessments = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('assessments')
          .select('id, title, description, type')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });
        if (error) {
          setError(error.message);
        } else {
          setAssessments(data);
        }
        setLoading(false);
      };
      fetchAssessments();
    }, []);

    if (loading) return <div className="glass-card p-4">Loading...</div>;
    if (error) return <div className="glass-card p-4 text-red-500">Error: {error}</div>;
    if (!assessments.length) return <div className="glass-card p-4">No assessments available.</div>;

    return (
      <div className="glass-card p-4">
        <h2 className="text-heading mb-2">Available Assessments</h2>
        <ul className="flex flex-col gap-3">
          {assessments.map(a => (
            <li key={a.id} className="border-b border-white/10 pb-2">
              <div className="font-bold text-lg">{a.title}</div>
              <div className="text-sm text-foreground/70 mb-1">{a.description}</div>
              <div className="text-xs text-primary">Type: {a.type}</div>
              {/* TODO: Add link/button to take assessment */}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  export default AssessmentBrowser;