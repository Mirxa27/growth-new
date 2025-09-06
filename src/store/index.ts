/**
 * Global State Management with Zustand
 * Centralized store for application state with TypeScript support
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import React from 'react';

// Types for our state
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  personality_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time_limit?: number;
  question_count: number;
  created_at: string;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  score: number;
  max_score: number;
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  time_spent?: number;
}

export interface VoiceSettings {
  enabled: boolean;
  voice_id?: string;
  language: string;
  auto_start: boolean;
  volume: number;
  speed: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    assessment_reminders: boolean;
    community_updates: boolean;
  };
  privacy: {
    profile_visibility: boolean;
    activity_status: boolean;
    share_results: boolean;
  };
  accessibility: {
    reduced_motion: boolean;
    high_contrast: boolean;
    larger_text: boolean;
  };
}

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Assessment state
  currentAssessment: Assessment | null;
  assessmentAttempts: AssessmentAttempt[];
  isTakingAssessment: boolean;

  // UI state
  settings: AppSettings;
  voiceSettings: VoiceSettings;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;

  // App state
  isOnline: boolean;
  lastSync: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;

  setCurrentAssessment: (assessment: Assessment | null) => void;
  addAssessmentAttempt: (attempt: AssessmentAttempt) => void;
  updateAssessmentAttempt: (id: string, updates: Partial<AssessmentAttempt>) => void;
  setTakingAssessment: (taking: boolean) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;

  setOnlineStatus: (online: boolean) => void;
  setLastSync: (timestamp: string) => void;

  // Reset actions
  resetUserState: () => void;
  resetAssessmentState: () => void;
  resetUIState: () => void;
  resetAllState: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'auto',
  notifications: {
    email: true,
    push: true,
    assessment_reminders: true,
    community_updates: false,
  },
  privacy: {
    profile_visibility: true,
    activity_status: true,
    share_results: false,
  },
  accessibility: {
    reduced_motion: false,
    high_contrast: false,
    larger_text: false,
  },
};

const defaultVoiceSettings: VoiceSettings = {
  enabled: true,
  language: 'en-US',
  auto_start: false,
  volume: 0.8,
  speed: 1.0,
};

// Create the store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,

        currentAssessment: null,
        assessmentAttempts: [],
        isTakingAssessment: false,

        settings: defaultSettings,
        voiceSettings: defaultVoiceSettings,
        sidebarOpen: false,
        mobileMenuOpen: false,

        isOnline: navigator.onLine,
        lastSync: null,

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setLoading: (isLoading) => set({ isLoading }),

        // Assessment actions
        setCurrentAssessment: (currentAssessment) => set({ currentAssessment }),
        addAssessmentAttempt: (attempt) => set((state) => ({
          assessmentAttempts: [...state.assessmentAttempts, attempt]
        })),
        updateAssessmentAttempt: (id, updates) => set((state) => ({
          assessmentAttempts: state.assessmentAttempts.map(attempt =>
            attempt.id === id ? { ...attempt, ...updates } : attempt
          )
        })),
        setTakingAssessment: (isTakingAssessment) => set({ isTakingAssessment }),

        // UI actions
        updateSettings: (newSettings) => set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
        updateVoiceSettings: (newVoiceSettings) => set((state) => ({
          voiceSettings: { ...state.voiceSettings, ...newVoiceSettings }
        })),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

        // App state actions
        setOnlineStatus: (isOnline) => set({ isOnline }),
        setLastSync: (lastSync) => set({ lastSync }),

        // Reset actions
        resetUserState: () => set({ user: null, isAuthenticated: false }),
        resetAssessmentState: () => set({
          currentAssessment: null,
          assessmentAttempts: [],
          isTakingAssessment: false
        }),
        resetUIState: () => set({
          settings: defaultSettings,
          voiceSettings: defaultVoiceSettings,
          sidebarOpen: false,
          mobileMenuOpen: false,
        }),
        resetAllState: () => set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          currentAssessment: null,
          assessmentAttempts: [],
          isTakingAssessment: false,
          settings: defaultSettings,
          voiceSettings: defaultVoiceSettings,
          sidebarOpen: false,
          mobileMenuOpen: false,
          isOnline: navigator.onLine,
          lastSync: null,
        }),
      }),
      {
        name: 'growth-echo-storage',
        // Only persist these fields
        partialize: (state) => ({
          settings: state.settings,
          voiceSettings: state.voiceSettings,
          user: state.user ? {
            id: state.user.id,
            email: state.user.email,
            display_name: state.user.display_name,
            avatar_url: state.user.avatar_url,
            personality_type: state.user.personality_type,
          } : null,
        }),
        version: 1,
      }
    ),
    {
      name: 'growth-echo-store',
    }
  )
);

// Derived selectors for common patterns
export const userSelectors = {
  isLoggedIn: (state: AppState) => state.isAuthenticated,
  userDisplayName: (state: AppState) => state.user?.display_name || state.user?.email || 'User',
  userAvatar: (state: AppState) => state.user?.avatar_url,
  personalityType: (state: AppState) => state.user?.personality_type,
};

export const assessmentSelectors = {
  currentAttempt: (state: AppState) =>
    state.assessmentAttempts.find(attempt => attempt.status === 'in_progress'),
  completedAttempts: (state: AppState) =>
    state.assessmentAttempts.filter(attempt => attempt.status === 'completed'),
  averageScore: (state: AppState) => {
    const completed = state.assessmentAttempts.filter(a => a.status === 'completed');
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, attempt) => sum + (attempt.score / attempt.max_score), 0);
    return (total / completed.length) * 100;
  },
};

export const uiSelectors = {
  isDarkMode: (state: AppState) => {
    if (state.settings.theme === 'dark') return true;
    if (state.settings.theme === 'light') return false;
    // Auto theme based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  notificationEnabled: (type: keyof AppSettings['notifications']) =>
    (state: AppState) => state.settings.notifications[type],
};

// Hook for online/offline status
export const useOnlineStatus = () => {
  const isOnline = useAppStore((state) => state.isOnline);
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);

  React.useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
};

// Export types for external use - remove conflicting exports

// Re-export assessment store for convenience
export * from './assessmentStore';