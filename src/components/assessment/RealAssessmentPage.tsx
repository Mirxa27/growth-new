/**
 * Real Assessment Page Component
 * Replaces mock data with real database integration
 * Uses RealAssessmentService for data fetching and scoring
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import RealAssessmentService from '@/services/realAssessmentService';
import { Assessment, AssessmentResult, AssessmentQuestion } from '@/types/assessment';

// Mock router for now - replace with actual router when integrated
const mockRouter = {
  push: (path: string) => {
    console.log('Navigate to:', path);
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
};

// Mock params for now - replace with actual params when integrated
const mockParams = { id: '1' };

export default function RealAssessmentPage(): JSX.Element {
  const router = mockRouter;
  const params = mockParams;
  const { id } = params;
  
  // State management
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assessment data
  useEffect(() => {
    const loadAssessment = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid assessment ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const assessmentData = await RealAssessmentService.getAssessmentById(id);
        
        if (!assessmentData) {
          setError('Assessment not found');
          return;
        }

        setAssessment(assessmentData);
        setError(null);
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [id]);

  // Handle response changes
  const handleResponseChange = (questionId: string, response: unknown) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  // Navigate to next question
  const handleNext = () => {
    if (!assessment) return;

    const currentQuestion = assessment.questions[currentQuestionIndex];
    if (!responses[currentQuestion.id]) {
      toast.error('Please answer the current question before proceeding');
      return;
    }

    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitAssessment();
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit assessment
  const handleSubmitAssessment = async () => {
    if (!assessment || !id) return;

    try {
      setIsSubmitting(true);
      
      const submissionResult = await RealAssessmentService.submitAssessment({
        assessmentId: id as string,
        userId: 'anonymous', // For now, until auth is implemented
        responses: responses as Record<string, string | number | boolean | string[]>
      });

      setResult(submissionResult);
      setIsCompleted(true);
      toast.success('Assessment completed successfully!');
    } catch (err) {
      console.error('Error submitting assessment:', err);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Available</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested assessment could not be found.'}</p>
          <button
            onClick={() => router.push('/assessments')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Assessments
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h1>
              <p className="text-xl text-gray-600">Thank you for completing {assessment.title}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{result.score}</div>
                  <p className="text-gray-600">Score</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{result.totalScore}</div>
                  <p className="text-gray-600">Total Possible</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{Math.round(result.percentage)}%</div>
                  <p className="text-gray-600">Percentage</p>
                </div>
              </div>
            </div>

            {result.insights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {result.insights.map((insight, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">💡</span>
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/assessments')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Another Assessment
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assessment taking state
  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/assessments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Assessments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-gray-600 mt-2">{assessment.description}</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.text}</h2>
          <QuestionInput
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : currentQuestionIndex === assessment.questions.length - 1 ? (
              'Complete Assessment'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Question input component
function QuestionInput({ 
  question, 
  value, 
  onChange 
}: { 
  question: AssessmentQuestion; 
  value: unknown; 
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case 'single':
      return (
        <div className="space-y-3">
          {question.options?.map((option, index: number) => (
            <label
              key={index}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name={question.id}
                value={typeof option === 'string' ? option : option.text}
                checked={value === (typeof option === 'string' ? option : option.text)}
                onChange={(e) => onChange(e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">
                {typeof option === 'string' ? option : option.text}
              </span>
            </label>
          ))}
        </div>
      );

    case 'multiple':
      return (
        <div className="space-y-3">
          {question.options?.map((option, index: number) => (
            <label
              key={index}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                value={typeof option === 'string' ? option : option.text}
                checked={Array.isArray(value) && value.includes(typeof option === 'string' ? option : option.text)}
                onChange={(e) => {
                  const currentValues = Array.isArray(value) ? value : [];
                  if (e.target.checked) {
                    onChange([...currentValues, e.target.value]);
                  } else {
                    onChange(currentValues.filter(v => v !== e.target.value));
                  }
                }}
                className="mr-3"
              />
              <span className="text-gray-700">
                {typeof option === 'string' ? option : option.text}
              </span>
            </label>
          ))}
        </div>
      );

    case 'scale':
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            {question.scale?.labels?.map((label: string, index: number) => (
              <label key={index} className="flex flex-col items-center cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={index + 1}
                  checked={value === index + 1}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  className="mb-2"
                />
                <span className="text-sm text-gray-600 text-center">{label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'text':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter your response..."
        />
      );

    default:
      return <div>Unsupported question type</div>;
  }
}
