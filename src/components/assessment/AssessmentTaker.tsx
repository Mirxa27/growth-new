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
      setQuestions(qData || []);
      // Fetch options for each question
      const optionMap: Record<number, AssessmentOption[]> = {};
      for (const q of qData || []) {
        if (q.question_type === 'multiple_choice') {
          const { data: oData } = await supabase
            .from('assessment_options')
            .select('*')
            .eq('question_id', q.id)
            .order('position', { ascending: true });
          optionMap[q.id] = oData || [];
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
          assessment_type: 'assessment',
          results: { score, total_questions: questions.length, percentage: Math.round((score / questions.length) * 100) },
          answers,
        })
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
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl transition-all duration-300 cursor-pointer border-2",
                    answers[q.id] === opt.id
                      ? "glass-card-selected bg-white/20 border-primary/50 shadow-lg shadow-primary/20 scale-[1.02]"
                      : "glass-card hover:bg-white/10 hover:border-white/20 border-transparent hover:scale-[1.01]"
                  )}
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
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    answers[q.id] === opt.id
                      ? "border-primary bg-primary"
                      : "border-white/40 bg-white/10"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      answers[q.id] === opt.id ? "bg-white" : "bg-transparent"
                    )} />
                  </div>
                  <span className={cn(
                    "transition-all duration-300",
                    answers[q.id] === opt.id ? "text-white font-medium" : "text-white/80"
                  )}>
                    {opt.option_text}
                  </span>
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