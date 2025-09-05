import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';
import { QuestionDisplay } from '@/components/assessments/QuestionDisplay';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Interface for a formatted question used within the component state
interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'free_text';
  position: number;
  explanation?: string;
  options: Option[];
}

// Interface for a question's option
interface Option {
  id: string;
  option_text: string;
  position: number;
  is_correct?: boolean;
}

// Interface for the raw question structure coming from Supabase JSON
interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'free_text';
  position: number;
  explanation?: string;
  options: {
    id: string;
    text: string;
    position: number;
    is_correct?: boolean;
  }[];
}

// Extended Assessment type to include typed questions and scoring info
type ExtendedAssessment = Database['public']['Tables']['assessments']['Row'] & {
  questions?: Json;
  scoring?: {
    type: string;
    categories?: Record<string, Record<string, number>>;
  };
};

const AssessmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<ExtendedAssessment | null>(null);

  // Validate and parse ID from URL params
  const validateId = (id: string | undefined): number | null => {
    if (!id) return null;
    const parsedId = parseInt(id, 10);
    return isNaN(parsedId) ? null : parsedId;
  };

  // Load assessment and questions from the database
  useEffect(() => {
    const loadAssessment = async () => {
      const assessmentId = validateId(id);

      if (!assessmentId) {
        toast({
          title: "Invalid Assessment ID",
          description: "A valid assessment ID is required.",
          variant: "destructive",
        });
        navigate('/mobile-assessment-hub');
        return;
      }

      try {
        setIsLoading(true);

        // Fetch assessment details from Supabase
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (error || !data) {
          throw new Error('Assessment not found');
        }
        
        const assess = data as ExtendedAssessment;

        // Cast questions from JSON to a typed array
        const rawQuestions = assess.questions as unknown as AssessmentQuestion[];
        if (!Array.isArray(rawQuestions)) {
          throw new Error('Invalid questions format');
        }

        // Format the raw questions into the structure used by the component state
        const formattedQuestions: Question[] = rawQuestions.map(q => ({
          id: q.id,
          question_text: q.text,
          question_type: q.type,
          position: q.position,
          explanation: q.explanation,
          options: q.options.map(opt => ({
            id: opt.id,
            option_text: opt.text,
            position: opt.position,
            is_correct: opt.is_correct ?? false,
          })),
        }));

        setAssessment(assess as ExtendedAssessment);
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Error loading assessment:', err);
        toast({
          title: "Error",
          description: "Failed to load the assessment.",
          variant: "destructive",
        });
        navigate('/mobile-assessment-hub');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [id, navigate, toast]);

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[questionIndex];
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const assessmentId = validateId(id);
    if (!assessmentId) {
      toast({
        title: "Error",
        description: "Invalid assessment ID.",
        variant: "destructive",
      });
      return;
    }

    // For anonymous users, show results without saving to the database
    if (!user) {
      const resultId = `temp-${Date.now()}`;
      navigate(`/results/${resultId}`, {
        state: {
          assessment,
          answers: userAnswers,
          questions,
        },
      });
      return;
    }

    setSubmitting(true);
    try {
      let score = 0;
      let max_score = questions.length; // Default max score

      if (assessment?.scoring?.type === 'personality' && assessment.scoring.categories) {
        // Example logic for a personality assessment
        const personalityMapping: Record<string, Record<string, number>> = {
          'Initiate conversations with new people': { E: 2, F: 3 },
          'Logic and objective analysis': { T: 3, N: 2 },
          'Adventure and new experiences': { E: 3, S: 2 },
          'Stability and security': { J: 3, S: 2 },
        };
        const scores: Record<string, number> = {};
        questions.forEach(q => {
          const answer = userAnswers[q.id];
          if (answer && personalityMapping[answer]) {
            Object.entries(personalityMapping[answer]).forEach(([cat, val]) => {
              scores[cat] = (scores[cat] || 0) + val;
            });
          }
        });
        // For this example, total score is the sum of category scores
        score = Object.values(scores).reduce((a, b) => a + b, 0);
      } else {
        // Standard quiz-style scoring based on correct answers
        let correctCount = 0;
        questions.forEach(q => {
          const userAnswer = userAnswers[q.id];
          if (q.options && q.options.length > 0) {
            const correctOption = q.options.find(opt => opt.is_correct);
            if (correctOption && userAnswer === correctOption.id) {
              correctCount++;
            }
          } else if (q.explanation && userAnswer && userAnswer.trim().toLowerCase() === q.explanation.trim().toLowerCase()) {
            // Fallback for free-text questions with an answer in the explanation
            correctCount++;
          }
        });
        score = correctCount;
        max_score = questions.filter(q => q.options.some(opt => opt.is_correct)).length;
      }
      
      // Create the result object to insert into the database
      const resultToInsert: Database['public']['Tables']['assessment_results']['Insert'] = {
        user_id: user.id,
        assessment_id: assessmentId,
        score: score,
        total_points: max_score,
        answers: userAnswers as Json,
      };

      // Insert the result
      const { data, error } = await supabase
        .from('assessment_results')
        .insert(resultToInsert)
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('No result ID was returned after submission.');

      // Navigate to the results page
      navigate(`/results/${data.id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      const errorMessage = error instanceof PostgrestError || error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Submission Error",
        description: `Failed to submit assessment: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Assessment could not be found.</p>
      </div>
    );
  }

  const currentQuestion = questions[questionIndex];
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] || '' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto">
        {currentQuestion && (
          <QuestionDisplay
            assessmentId={id || ''}
            {...currentQuestion}
            currentAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            questionNumber={questionIndex + 1}
            totalQuestions={questions.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={questionIndex === 0}
            isLast={questionIndex === questions.length - 1}
          />
        )}
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