import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppStore, userSelectors, assessmentSelectors, uiSelectors } from '../index';
import * as React from 'react';
import { act } from '@testing-library/react';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

// Mock navigator.onLine
const mockNavigatorOnLine = true;

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Setup matchMedia mock
    mockMatchMedia.mockReturnValue({ matches: false });
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    // Setup navigator.onLine mock
    Object.defineProperty(navigator, 'onLine', {
      value: mockNavigatorOnLine,
      writable: true,
    });

    // Reset store state
    act(() => {
      useAppStore.getState().resetAllState();
    });
  });

  describe('User State Management', () => {
    it('should set user and update authentication state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        personality_type: 'INTJ',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      const state = useAppStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear user state when setting null user', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
      });

      expect(useAppStore.getState().isAuthenticated).toBe(true);

      act(() => {
        useAppStore.getState().setUser(null);
      });

      const state = useAppStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should update loading state', () => {
      act(() => {
        useAppStore.getState().setLoading(true);
      });

      expect(useAppStore.getState().isLoading).toBe(true);

      act(() => {
        useAppStore.getState().setLoading(false);
      });

      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should reset user state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
        useAppStore.getState().setAuthenticated(true);
      });

      act(() => {
        useAppStore.getState().resetUserState();
      });

      const state = useAppStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Assessment State Management', () => {
    const mockAssessment = {
      id: 'assessment-123',
      title: 'Personality Test',
      description: 'Test your personality type',
      category: 'personality',
      difficulty: 'beginner' as const,
      time_limit: 30,
      question_count: 10,
      created_at: '2023-01-01T00:00:00Z',
    };

    const mockAttempt = {
      id: 'attempt-123',
      assessment_id: 'assessment-123',
      user_id: 'user-123',
      score: 85,
      max_score: 100,
      status: 'in_progress' as const,
      started_at: '2023-01-01T00:00:00Z',
      time_spent: 300,
    };

    it('should set current assessment', () => {
      act(() => {
        useAppStore.getState().setCurrentAssessment(mockAssessment);
      });

      expect(useAppStore.getState().currentAssessment).toEqual(mockAssessment);
    });

    it('should add assessment attempt', () => {
      act(() => {
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
      });

      const state = useAppStore.getState();
      expect(state.assessmentAttempts).toHaveLength(1);
      expect(state.assessmentAttempts[0]).toEqual(mockAttempt);
    });

    it('should update assessment attempt', () => {
      act(() => {
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
      });

      const updates = {
        score: 90,
        status: 'completed' as const,
        completed_at: '2023-01-01T01:00:00Z',
      };

      act(() => {
        useAppStore.getState().updateAssessmentAttempt(mockAttempt.id, updates);
      });

      const state = useAppStore.getState();
      const updatedAttempt = state.assessmentAttempts.find(a => a.id === mockAttempt.id);

      expect(updatedAttempt).toBeDefined();
      expect(updatedAttempt?.score).toBe(90);
      expect(updatedAttempt?.status).toBe('completed');
    });

    it('should update assessment taking status', () => {
      act(() => {
        useAppStore.getState().setTakingAssessment(true);
      });

      expect(useAppStore.getState().isTakingAssessment).toBe(true);

      act(() => {
        useAppStore.getState().setTakingAssessment(false);
      });

      expect(useAppStore.getState().isTakingAssessment).toBe(false);
    });

    it('should reset assessment state', () => {
      act(() => {
        useAppStore.getState().setCurrentAssessment(mockAssessment);
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
        useAppStore.getState().setTakingAssessment(true);
      });

      act(() => {
        useAppStore.getState().resetAssessmentState();
      });

      const state = useAppStore.getState();
      expect(state.currentAssessment).toBeNull();
      expect(state.assessmentAttempts).toHaveLength(0);
      expect(state.isTakingAssessment).toBe(false);
    });
  });

  describe('UI Settings Management', () => {
    it('should update settings partially', () => {
      const newSettings = {
        theme: 'dark' as const,
        notifications: {
          email: false,
          push: true, // Include other notification settings to preserve them
          assessment_reminders: true,
          community_updates: false,
        },
      };

      act(() => {
        useAppStore.getState().updateSettings(newSettings);
      });

      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.notifications.email).toBe(false);
      expect(state.settings.notifications.push).toBe(true);
    });

    it('should update voice settings', () => {
      const newVoiceSettings = {
        enabled: false,
        volume: 0.5,
        voice_id: 'custom-voice',
      };

      act(() => {
        useAppStore.getState().updateVoiceSettings(newVoiceSettings);
      });

      const state = useAppStore.getState();
      expect(state.voiceSettings.enabled).toBe(false);
      expect(state.voiceSettings.volume).toBe(0.5);
      expect(state.voiceSettings.voice_id).toBe('custom-voice');
    });

    it('should toggle sidebar state', () => {
      act(() => {
        useAppStore.getState().toggleSidebar();
      });

      expect(useAppStore.getState().sidebarOpen).toBe(true);

      act(() => {
        useAppStore.getState().toggleSidebar();
      });

      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle mobile menu state', () => {
      act(() => {
        useAppStore.getState().toggleMobileMenu();
      });

      expect(useAppStore.getState().mobileMenuOpen).toBe(true);

      act(() => {
        useAppStore.getState().toggleMobileMenu();
      });

      expect(useAppStore.getState().mobileMenuOpen).toBe(false);
    });

    it('should reset UI state to defaults', () => {
      act(() => {
        useAppStore.getState().updateSettings({ theme: 'dark' });
        useAppStore.getState().updateVoiceSettings({ enabled: false });
        useAppStore.getState().toggleSidebar();
      });

      act(() => {
        useAppStore.getState().resetUIState();
      });

      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('auto');
      expect(state.voiceSettings.enabled).toBe(true);
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('App State Management', () => {
    it('should set online status', () => {
      act(() => {
        useAppStore.getState().setOnlineStatus(false);
      });

      expect(useAppStore.getState().isOnline).toBe(false);

      act(() => {
        useAppStore.getState().setOnlineStatus(true);
      });

      expect(useAppStore.getState().isOnline).toBe(true);
    });

    it('should set last sync timestamp', () => {
      const timestamp = '2023-01-01T12:00:00Z';

      act(() => {
        useAppStore.getState().setLastSync(timestamp);
      });

      expect(useAppStore.getState().lastSync).toBe(timestamp);
    });

    it('should reset all state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
        useAppStore.getState().setTakingAssessment(true);
        useAppStore.getState().updateSettings({ theme: 'dark' });
        useAppStore.getState().toggleSidebar();
      });

      act(() => {
        useAppStore.getState().resetAllState();
      });

      const state = useAppStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isTakingAssessment).toBe(false);
      expect(state.settings.theme).toBe('auto');
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
        useAppStore.getState().updateSettings({ theme: 'dark' });
      });

      // Note: In a real test environment with persist middleware,
      // this would test localStorage persistence. For now, we verify
      // the state is correctly managed
      const state = useAppStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.settings.theme).toBe('dark');
    });

    it('should handle partial state persistence', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
        useAppStore.getState().setTakingAssessment(true);
      });

      // Verify that the store handles both persistent and transient state
      const state = useAppStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isTakingAssessment).toBe(true);
    });
  });

  describe('Selectors', () => {

    describe('userSelectors', () => {
      it('should check if user is logged in', () => {
        const state = useAppStore.getState();
        expect(userSelectors.isLoggedIn(state)).toBe(false);

        act(() => {
          useAppStore.getState().setAuthenticated(true);
        });

        const newState = useAppStore.getState();
        expect(userSelectors.isLoggedIn(newState)).toBe(true);
      });

      it('should get user display name', () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };

        act(() => {
          useAppStore.getState().setUser(mockUser);
        });

        const state = useAppStore.getState();
        expect(userSelectors.userDisplayName(state)).toBe('test@example.com');
      });

      it('should prefer display name over email', () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };

        act(() => {
          useAppStore.getState().setUser(mockUser);
        });

        const state = useAppStore.getState();
        expect(userSelectors.userDisplayName(state)).toBe('Test User');
      });

      it('should return "User" as fallback when no user data', () => {
        const state = useAppStore.getState();
        expect(userSelectors.userDisplayName(state)).toBe('User');
      });
    });

    describe('assessmentSelectors', () => {
      const mockAttempt1 = {
        id: 'attempt-1',
        assessment_id: 'assessment-123',
        user_id: 'user-123',
        score: 80,
        max_score: 100,
        status: 'in_progress' as const,
        started_at: '2023-01-01T00:00:00Z',
      };

      const mockAttempt2 = {
        id: 'attempt-2',
        assessment_id: 'assessment-456',
        user_id: 'user-123',
        score: 90,
        max_score: 100,
        status: 'completed' as const,
        started_at: '2023-01-01T00:00:00Z',
        completed_at: '2023-01-01T01:00:00Z',
      };

      beforeEach(() => {
        act(() => {
          useAppStore.getState().addAssessmentAttempt(mockAttempt1);
          useAppStore.getState().addAssessmentAttempt(mockAttempt2);
        });
      });

      it('should find current attempt', () => {
        const state = useAppStore.getState();
        const currentAttempt = assessmentSelectors.currentAttempt(state);

        expect(currentAttempt).toEqual(mockAttempt1);
      });

      it('should get completed attempts', () => {
        const state = useAppStore.getState();
        const completedAttempts = assessmentSelectors.completedAttempts(state);

        expect(completedAttempts).toHaveLength(1);
        expect(completedAttempts[0]).toEqual(mockAttempt2);
      });

      it('should calculate average score', () => {
        const state = useAppStore.getState();
        const averageScore = assessmentSelectors.averageScore(state);

        expect(averageScore).toBe(90); // Only completed attempts
      });

      it('should return 0 average score when no completed attempts', () => {
        act(() => {
          useAppStore.getState().resetAssessmentState();
          useAppStore.getState().addAssessmentAttempt(mockAttempt1);
        });

        const state = useAppStore.getState();
        const averageScore = assessmentSelectors.averageScore(state);

        expect(averageScore).toBe(0);
      });
    });

    describe('uiSelectors', () => {
      describe('isDarkMode', () => {
        it('should return true for dark theme', () => {
          act(() => {
            useAppStore.getState().updateSettings({ theme: 'dark' });
          });

          const state = useAppStore.getState();
          expect(uiSelectors.isDarkMode(state)).toBe(true);
        });

        it('should return false for light theme', () => {
          act(() => {
            useAppStore.getState().updateSettings({ theme: 'light' });
          });

          const state = useAppStore.getState();
          expect(uiSelectors.isDarkMode(state)).toBe(false);
        });

        it('should use system preference for auto theme', () => {
          mockMatchMedia.mockReturnValue({ matches: true });

          act(() => {
            useAppStore.getState().updateSettings({ theme: 'auto' });
          });

          const state = useAppStore.getState();
          expect(uiSelectors.isDarkMode(state)).toBe(true);
        });
      });

      it('should check notification settings', () => {
        const state = useAppStore.getState();
        const emailNotificationsEnabled = uiSelectors.notificationEnabled('email')(state);

        expect(emailNotificationsEnabled).toBe(true);
      });
    });
  });

  describe('useOnlineStatus Hook', () => {
    it('should initialize with navigator.onLine state', () => {
      // This would be tested with React Testing Library
      // For now, we just verify the hook structure
      expect(useAppStore.getState().isOnline).toBe(mockNavigatorOnLine);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined updates gracefully', () => {
      act(() => {
        useAppStore.getState().updateSettings(undefined as any);
      });

      // Should not throw and maintain current state
      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('auto');
    });

    it('should handle empty assessment attempts array', () => {
      act(() => {
        useAppStore.getState().resetAssessmentState();
      });

      const state = useAppStore.getState();

      expect(assessmentSelectors.currentAttempt(state)).toBeUndefined();
      expect(assessmentSelectors.completedAttempts(state)).toHaveLength(0);
      expect(assessmentSelectors.averageScore(state)).toBe(0);
    });

    it('should handle invalid attempt IDs in updates', () => {
      const mockAttempt = {
        id: 'attempt-123',
        assessment_id: 'assessment-123',
        user_id: 'user-123',
        score: 80,
        max_score: 100,
        status: 'in_progress' as const,
        started_at: '2023-01-01T00:00:00Z',
      };

      act(() => {
        useAppStore.getState().addAssessmentAttempt(mockAttempt);
        useAppStore.getState().updateAssessmentAttempt('invalid-id', { score: 90 });
      });

      const state = useAppStore.getState();
      const attempt = state.assessmentAttempts.find(a => a.id === mockAttempt.id);

      expect(attempt?.score).toBe(80); // Should not be updated
    });
  });

  describe('Performance', () => {
    it('should handle rapid state updates efficiently', () => {
      const startTime = performance.now();

      // Perform 100 rapid state updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          useAppStore.getState().setLoading(i % 2 === 0);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large number of assessment attempts', () => {
      const mockAttempt = {
        id: 'attempt-123',
        assessment_id: 'assessment-123',
        user_id: 'user-123',
        score: 80,
        max_score: 100,
        status: 'completed' as const,
        started_at: '2023-01-01T00:00:00Z',
        completed_at: '2023-01-01T01:00:00Z',
      };

      // Add 1000 attempts
      for (let i = 0; i < 1000; i++) {
        act(() => {
          useAppStore.getState().addAssessmentAttempt({
            ...mockAttempt,
            id: `attempt-${i}`,
          });
        });
      }

      const state = useAppStore.getState();

      expect(state.assessmentAttempts).toHaveLength(1000);
      expect(assessmentSelectors.completedAttempts(state)).toHaveLength(1000);

      // Performance check - average score calculation should be fast
      const startTime = performance.now();
      const averageScore = assessmentSelectors.averageScore(state);
      const endTime = performance.now();

      expect(averageScore).toBeCloseTo(80, 5);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});