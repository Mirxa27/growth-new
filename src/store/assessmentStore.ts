/**
 * Assessment-specific store using Zustand
 * Manages complex assessment state and logic
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import React from 'react';
import { Assessment, AssessmentAttempt, UserAnswer } from '@/types/assessment';

interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay' | 'rating' | 'text';
  options?: string[];
  required: boolean;
  order: number;
}

interface AssessmentState {
  // Current assessment session
  currentAssessment: Assessment | null;
  currentQuestion: AssessmentQuestion | null;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  userAnswers: Record<string, UserAnswer>;

  // Session state
  isTakingAssessment: boolean;
  isSubmitting: boolean;
  timeRemaining: number | null;
  startTime: Date | null;
  attemptId: string | null;

  // Results
  currentScore: number;
  maxScore: number;
  results: any | null;

  // Actions
  startAssessment: (assessment: Assessment, questions: AssessmentQuestion[]) => void;
  answerQuestion: (questionId: string, answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitAssessment: () => Promise<void | { id: string; score: number; max_score: number; percentage: number; passed: boolean; completed_at: string }>;
  pauseAssessment: () => void;
  resumeAssessment: () => void;
  endAssessment: () => void;

  // Timer actions
  setTimer: (seconds: number) => void;
  decrementTimer: () => void;

  // Reset
  resetAssessment: () => void;

  // Getters
  getProgress: () => number;
  getCurrentAnswer: () => UserAnswer | null;
  isQuestionAnswered: (questionId: string) => boolean;
  getAnsweredQuestions: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

export const useAssessmentStore = create<AssessmentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentAssessment: null,
      currentQuestion: null,
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      isTakingAssessment: false,
      isSubmitting: false,
      timeRemaining: null,
      startTime: null,
      attemptId: null,
      currentScore: 0,
      maxScore: 0,
      results: null,

      // Actions
      startAssessment: (assessment, questions) => {
        set({
          currentAssessment: assessment,
          questions,
          currentQuestion: questions[0] || null,
          currentQuestionIndex: 0,
          userAnswers: {},
          isTakingAssessment: true,
          isSubmitting: false,
          timeRemaining: assessment.estimatedTime ? assessment.estimatedTime * 60 : null,
          startTime: new Date(),
          attemptId: null,
          currentScore: 0,
          maxScore: questions.length,
          results: null,
        });
      },

      answerQuestion: (questionId, answer) => {
        set((state) => ({
          userAnswers: {
            ...state.userAnswers,
            [questionId]: {
              ...answer,
              timestamp: new Date().toISOString(),
            },
          },
        }));
      },

      nextQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex < state.questions.length - 1) {
          const nextIndex = state.currentQuestionIndex + 1;
          set({
            currentQuestionIndex: nextIndex,
            currentQuestion: state.questions[nextIndex],
          });
        }
      },

      previousQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex > 0) {
          const prevIndex = state.currentQuestionIndex - 1;
          set({
            currentQuestionIndex: prevIndex,
            currentQuestion: state.questions[prevIndex],
          });
        }
      },

      goToQuestion: (index) => {
        const state = get();
        if (index >= 0 && index < state.questions.length) {
          set({
            currentQuestionIndex: index,
            currentQuestion: state.questions[index],
          });
        }
      },

      submitAssessment: async () => {
        const state = get();
        if (!state.currentAssessment || !state.startTime) return;

        set({ isSubmitting: true });

        try {
          // Calculate score and prepare submission
          const submissionData = {
            assessment_id: state.currentAssessment.id,
            answers: Object.values(state.userAnswers),
            time_spent: state.startTime ?
              Math.floor((Date.now() - state.startTime.getTime()) / 1000) : 0,
          };

          // Here you would typically make an API call to submit the assessment
          // const result = await assessmentAPI.submit(submissionData);

          // For now, simulate a result
          const result = {
            id: `attempt_${Date.now()}`,
            score: Math.floor(Math.random() * state.maxScore),
            max_score: state.maxScore,
            percentage: Math.floor(Math.random() * 100),
            passed: Math.random() > 0.3,
            completed_at: new Date().toISOString(),
          };

          set({
            results: result,
            currentScore: result.score,
            isTakingAssessment: false,
            isSubmitting: false,
          });

          return result;
        } catch (error) {
          set({ isSubmitting: false });
          throw error;
        }
      },

      pauseAssessment: () => {
        set({ isTakingAssessment: false });
      },

      resumeAssessment: () => {
        set({ isTakingAssessment: true });
      },

      endAssessment: () => {
        set({
          currentAssessment: null,
          currentQuestion: null,
          questions: [],
          currentQuestionIndex: 0,
          userAnswers: {},
          isTakingAssessment: false,
          isSubmitting: false,
          timeRemaining: null,
          startTime: null,
          attemptId: null,
          currentScore: 0,
          maxScore: 0,
          results: null,
        });
      },

      setTimer: (seconds) => {
        set({ timeRemaining: seconds });
      },

      decrementTimer: () => {
        const state = get();
        if (state.timeRemaining !== null && state.timeRemaining > 0) {
          set({ timeRemaining: state.timeRemaining - 1 });
        } else if (state.timeRemaining === 0) {
          // Time's up - auto submit
          get().submitAssessment();
        }
      },

      resetAssessment: () => {
        set({
          currentAssessment: null,
          currentQuestion: null,
          questions: [],
          currentQuestionIndex: 0,
          userAnswers: {},
          isTakingAssessment: false,
          isSubmitting: false,
          timeRemaining: null,
          startTime: null,
          attemptId: null,
          currentScore: 0,
          maxScore: 0,
          results: null,
        });
      },

      // Getters
      getProgress: () => {
        const state = get();
        if (state.questions.length === 0) return 0;
        return (state.currentQuestionIndex / state.questions.length) * 100;
      },

      getCurrentAnswer: () => {
        const state = get();
        if (!state.currentQuestion) return null;
        return state.userAnswers[state.currentQuestion.id] || null;
      },

      isQuestionAnswered: (questionId) => {
        const state = get();
        return !!state.userAnswers[questionId];
      },

      getAnsweredQuestions: () => {
        const state = get();
        return Object.keys(state.userAnswers).length;
      },

      canGoNext: () => {
        const state = get();
        return state.currentQuestionIndex < state.questions.length - 1;
      },

      canGoPrevious: () => {
        const state = get();
        return state.currentQuestionIndex > 0;
      },
    })),
    {
      name: 'assessment-store',
    }
  )
);

// Timer hook for assessments
export const useAssessmentTimer = () => {
  const timeRemaining = useAssessmentStore((state) => state.timeRemaining);
  const isTakingAssessment = useAssessmentStore((state) => state.isTakingAssessment);
  const decrementTimer = useAssessmentStore((state) => state.decrementTimer);

  React.useEffect(() => {
    if (!isTakingAssessment || timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTakingAssessment, timeRemaining, decrementTimer]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    formattedTime: timeRemaining !== null ? formatTime(timeRemaining) : null,
    isTimeRunning: isTakingAssessment && timeRemaining !== null && timeRemaining > 0,
  };
};

// Auto-save hook
export const useAssessmentAutoSave = () => {
  const userAnswers = useAssessmentStore((state) => state.userAnswers);
  const isTakingAssessment = useAssessmentStore((state) => state.isTakingAssessment);
  const currentAssessment = useAssessmentStore((state) => state.currentAssessment);

  React.useEffect(() => {
    if (!isTakingAssessment || !currentAssessment) return;

    const autoSaveInterval = setInterval(() => {
      // Save progress to localStorage or backend
      const progressData = {
        assessmentId: currentAssessment.id,
        answers: userAnswers,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(
        `assessment_progress_${currentAssessment.id}`,
        JSON.stringify(progressData)
      );
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isTakingAssessment, currentAssessment, userAnswers]);

  // Load saved progress
  const loadSavedProgress = (assessmentId: string) => {
    try {
      const saved = localStorage.getItem(`assessment_progress_${assessmentId}`);
      if (saved) {
        const progressData = JSON.parse(saved);
        useAssessmentStore.getState().userAnswers = progressData.answers || {};
        return true;
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error);
    }
    return false;
  };

  // Clear saved progress
  const clearSavedProgress = (assessmentId: string) => {
    localStorage.removeItem(`assessment_progress_${assessmentId}`);
  };

  return {
    loadSavedProgress,
    clearSavedProgress,
  };
};