import { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  position: number;
}
interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  position: number;
}

const AssessmentTaker = ({ assessmentId, userId, onComplete, onBack }: { assessmentId: number; userId?: string; onComplete?: (results: any) => void; onBack?: () => void }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<{ [key: number]: Option[] }>({});
  const [answers, setAnswers] = useState<{ [key: number]: number | string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data: qData, error: qError } = await supabase
        .from('assessment_questions' as any)
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('position', { ascending: true });
      if (qError) {
        setError(qError.message);
        setLoading(false);
        return;
      }
      setQuestions(qData as any);
      // Fetch options for each question
      const optionMap: { [key: number]: Option[] } = {};
      for (const q of qData as any[]) {
        if (q.question_type === 'multiple_choice') {
          const { data: oData } = await supabase
            .from('assessment_options' as any)
            .select('*')
            .eq('question_id', q.id)
            .order('position', { ascending: true });
          optionMap[q.id] = (oData as any) || [];
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

  const handleSubmit = async () => {
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
        .from('assessment_results' as any)
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          score,
          answers,
        } as any);
      if (error) {
        setError(error.message);
        return;
      }
    }
    
    if (onComplete) {
      onComplete({ score, answers });
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
    <form className="glass-card p-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-heading mb-2">Take Assessment</h2>
        {onBack && <Button type="button" variant="ghost" onClick={onBack}>Back</Button>}
      </div>
      {questions.map(q => (
        <div key={q.id} className="mb-4">
          <div className="mb-1 font-semibold">{q.position}. {q.question_text}</div>
          {q.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {options[q.id]?.map(opt => (
                <label key={opt.id} className="flex items-center gap-2">
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
              className="glass-input w-full mt-1"
              rows={2}
              value={answers[q.id] as string || ''}
              onChange={e => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
            />
          )}
        </div>
      ))}
      <button type="submit" className="glass-btn interactive mt-2">Submit</button>
    </form>
  );
};

export default AssessmentTaker;