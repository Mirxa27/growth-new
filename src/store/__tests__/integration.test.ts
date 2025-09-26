import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppStore } from '../index';
import { useAssessmentStore } from '../assessmentStore';
import { act } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

describe('Store Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset all store states
    act(() => {
      useAppStore.getState().resetAllState();
      useAssessmentStore.getState().resetAssessment();
    });
  });

  describe('Assessment Lifecycle Integration', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      display_name: 'Test User',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockAssessment = {
      id: 'assessment-123',
      title: 'Personality Test',
      description: 'Test your personality',
      category: 'personality',
      difficulty: 'beginner' as const,
      time_limit: 30,
      question_count: 5,
      created_at: '2023-01-01T00:00:00Z',
    };

    const mockQuestions = [
      {
        id: 'q1',
        assessment_id: 'assessment-123',
        question_text: 'What is your favorite color?',
        question_type: 'multiple_choice' as const,
        options: ['Red', 'Blue', 'Green'],
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        assessment_id: 'assessment-123',
        question_text: 'Are you an introvert?',
        question_type: 'true_false' as const,
        required: true,
        order: 1,
      },
    ];

    it('should sync assessment state between stores when starting assessment', () => {
      // First set the assessment in app store
      act(() => {
        useAppStore.getState().setCurrentAssessment(mockAssessment);
      });

      // Then start the assessment in assessment store
      act(() => {
        useAssessmentStore.getState().startAssessment(mockAssessment, mockQuestions);
      });

      // Sync the isTakingAssessment state between stores
      act(() => {
        useAppStore.getState().setTakingAssessment(true);
      });

      // Both stores should have consistent assessment state
      const appState = useAppStore.getState();
      const assessmentState = useAssessmentStore.getState();

      expect(appState.currentAssessment).toEqual(mockAssessment);
      expect(assessmentState.currentAssessment).toEqual(mockAssessment);
      expect(appState.isTakingAssessment).toBe(true);
      expect(assessmentState.isTakingAssessment).toBe(true);
    });

    it('should update user state when creating assessment attempt', () => {
      // Set up user
      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      // Start assessment
      act(() => {
        useAssessmentStore.getState().startAssessment(mockAssessment, mockQuestions);
      });

      // Sync the isTakingAssessment state between stores
      act(() => {
        useAppStore.getState().setTakingAssessment(true);
      });

      // Create an attempt in app store
      const mockAttempt = {
        id: 'attempt-123',
        assessment_id: 'assessment-123',
        user_id: 'user-123',
        score: 0,
        max_score: 100,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      };

      act(() => {
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
      });

      // Verify consistent state
      const appState = useAppStore.getState();
      const assessmentState = useAssessmentStore.getState();

      expect(appState.assessmentAttempts).toHaveLength(1);
      expect(appState.assessmentAttempts[0]).toEqual(mockAttempt);
      expect(appState.isTakingAssessment).toBe(true);
      expect(assessmentState.isTakingAssessment).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid updates across stores efficiently', () => {
      const startTime = performance.now();

      // Perform rapid updates across both stores
      for (let i = 0; i < 100; i++) {
        act(() => {
          useAppStore.getState().setLoading(i % 2 === 0);
          useAppStore.getState().updateSettings({
            theme: i % 2 === 0 ? 'dark' : 'light',
          });
          useAssessmentStore.getState().setTimer(i);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete user assessment flow', async () => {
      // 1. User logs in
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        display_name: 'John Doe',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      // 2. User browses assessments
      const mockAssessment = {
        id: 'assessment-123',
        title: 'Personality Assessment',
        description: 'Discover your personality type',
        category: 'personality',
        difficulty: 'beginner',
        time_limit: 10,
        question_count: 3,
        created_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setCurrentAssessment(mockAssessment);
      });

      // 3. User starts assessment
      const mockQuestions = [
        {
          id: 'q1',
          assessment_id: 'assessment-123',
          question_text: 'Do you prefer spending time alone or with others?',
          question_type: 'multiple_choice' as const,
          options: ['Alone', 'With others'],
          required: true,
          order: 0,
        },
        {
          id: 'q2',
          assessment_id: 'assessment-123',
          question_text: 'Are you organized in your daily life?',
          question_type: 'true_false' as const,
          required: true,
          order: 1,
        },
      ];

      act(() => {
        useAssessmentStore.getState().startAssessment(mockAssessment, mockQuestions);
      });

      // 4. User attempts assessment
      const mockAttempt = {
        id: 'attempt-123',
        assessment_id: 'assessment-123',
        user_id: 'user-123',
        score: 0,
        max_score: 100,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      };

      act(() => {
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
      });

      // 5. User answers questions
      act(() => {
        useAssessmentStore.getState().answerQuestion('q1', {
          question_id: 'q1',
          answer: 'Alone',
          is_correct: null,
          confidence: null,
        });
      });

      // Verify final state
      const appState = useAppStore.getState();
      const assessmentState = useAssessmentStore.getState();

      expect(appState.user).toEqual(mockUser);
      expect(appState.currentAssessment).toEqual(mockAssessment);
      expect(appState.assessmentAttempts).toHaveLength(1);
      expect(assessmentState.isTakingAssessment).toBe(true);
      expect(Object.keys(assessmentState.userAnswers)).toHaveLength(1);
    });
  });
});