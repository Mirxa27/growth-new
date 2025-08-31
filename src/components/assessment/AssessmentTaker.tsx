import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { cn } from '@/lib/utils';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type AssessmentQuestion = Tables<'assessment_questions'>;
type AssessmentOption = Tables<'assessment_options'>;
type AssessmentResultInsert = TablesInsert<'assessment_results'>;

interface AssessmentTakerProps {
  assessmentId: number;
  userId?: string;
  onComplete?: (results: any) => void;
  onBack?: () => void;
}

const AssessmentTaker = ({ assessmentId, userId, onComplete, onBack }: AssessmentTakerProps) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [options, setOptions] = useState<Record<number, AssessmentOption[]>>({});
  const [answers, setAnswers] = useState<{ [key: number]: number | string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data: qData, error: qError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('position', { ascending: true });
      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }
      setQuestions(qData as AssessmentQuestion[]);
      // Fetch options for each question
      const optionMap: Record<number, AssessmentOption[]> = {};
      for (const q of qData as AssessmentQuestion[]) {
        if (q.question_type === 'multiple_choice') {
          const { data: oData } = await supabase
            .from('assessment_options')
            .select('*')
            .eq('question_id', q.id)
            .order('position', { ascending: true });
          optionMap[q.id] = (oData as AssessmentOption[]) || [];
        }
      }
      setOptions(optionMap);
      setLoading(false);
    };
    fetchQuestions();
  }, [assessmentId]);

  const handleAnswer = (questionId: number, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);
    // Calculate score for multiple choice
    let score = 0;
    for (const q of questions) {
      if (q.question_type === 'multiple_choice') {
        const selectedOptionId = answers[q.id];
        const option = options[q.id]?.find(o => o.id === selectedOptionId);
        if (option?.is_correct) score += 1;
      }
    }
    // Store result for signed-in users
    if (userId) {
      const { error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          score,
          answers,
        } as AssessmentResultInsert); // Explicitly type insert
      if (error) {
        setError(error.message);
        setSubmitting(false);
        return;
      }
    }
    
    if (onComplete) {
      onComplete({ score, answers, assessment_id: assessmentId, user_id: userId });
    } else {
      setSubmitted(true);
    }
  };

  if (loading) return (
    <div className="glass-card p-4 flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" />
    </div>
  );
  if (error) return <div className="glass-card p-4 text-red-500">Error: {error}</div>;
  if (submitted) return <div className="glass-card p-4">Assessment submitted! Thank you.</div>;

  return (
    <form
      ref={formRef}
      className="glass-card p-4"
      onSubmit={handleSubmit}
      role="form"
      aria-label="Assessment Questions"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-heading mb-2">Take Assessment</h2>
        {onBack && <Button type="button" variant="ghost" onClick={onBack}>Back</Button>}
      </div>
      {questions.map(q => (
        <div key={q.id} className="mb-4">
          <div
            className="mb-1 font-semibold"
            role="heading"
            aria-level={2}
          >
            {q.position}. {q.question_text}
          </div>
          {q.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {options[q.id]?.map(opt => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleAnswer(q.id, opt.id);
                    }
                  }}
                  tabIndex={0}
                  role="radio"
                  aria-checked={answers[q.id] === opt.id}
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => handleAnswer(q.id, opt.id)}
                  />
                  {opt.option_text}
                </label>
              ))}
            </div>
          )}
          {q.question_type === 'free_text' && (
            <textarea
              className="glass-input w-full mt-1 min-h-[80px] p-3"
              aria-label={`Answer for question ${q.position}`}
              rows={2}
              value={answers[q.id] as string || ''}
              onChange={e => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        className={cn(
          "glass-btn interactive mt-4 w-full sm:w-auto min-h-[44px] px-6 py-2",
          submitting && "opacity-50 cursor-not-allowed"
        )}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <LoadingSpinner size="sm" />
            Submitting...
          </>
        ) : (
          "Submit Assessment"
        )}
      </button>
    </form>
  );
};

export default AssessmentTaker;