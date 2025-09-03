import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QuestionDisplay } from '@/components/assessments/QuestionDisplay';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'free_text';
  position: number;
  explanation?: string;
  assessment_options: Option[];
}

interface Option {
  id: number;
  option_text: string;
  position: number;
}

const AssessmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    try {
      // Load assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;

      // Check if assessment is private and user is not authenticated
      if (assessmentData.visibility === 'private' && !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access this assessment.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      setAssessment(assessmentData);

      // Load questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          *,
          assessment_options (*)
        `)
        .eq('assessment_id', id)
        .order('position');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      // For public assessments, just show results without saving
      const resultId = `temp-${Date.now()}`;
      navigate(`/results/${resultId}`, {
        state: {
          assessment,
          answers,
          questions
        }
      });
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score for quizzes
      let score = 0;
      let totalPoints = 0;

      if (assessment?.type === 'quiz') {
        questions.forEach(question => {
          if (question.question_type === 'multiple_choice') {
            const selectedOptionId = parseInt(answers[question.id]);
            const selectedOption = question.assessment_options.find(opt => opt.id === selectedOptionId);
            // Note: We need to add is_correct field to options table
            totalPoints += 1;
          }
        });
      }

      // Save results
      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_id: parseInt(id!),
          score,
          total_points: totalPoints,
          percentage: totalPoints > 0 ? (score / totalPoints) * 100 : 0,
          answers,
          completed: true,
          time_taken: 0 // TODO: Implement time tracking
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/results/${data.id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Assessment not found.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto">
        <QuestionDisplay
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswerChange={handleAnswerChange}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentQuestionIndex === 0}
          isLast={currentQuestionIndex === questions.length - 1}
        />
      </div>
      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Submitting your assessment...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentPage;