/**
 * Assessment constants and utilities
 */

// Assessment categories for filtering
export const ASSESSMENT_CATEGORIES = [
  { id: 'personality', name: 'Personality', icon: '🧠' },
  { id: 'career', name: 'Career', icon: '💼' },
  { id: 'skills', name: 'Skills', icon: '🛠️' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'wellness', name: 'Wellness', icon: '🌱' },
  { id: 'general', name: 'General', icon: '📋' }
];

// Assessment difficulty levels
export const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', color: 'green' },
  { id: 'intermediate', name: 'Intermediate', color: 'yellow' },
  { id: 'advanced', name: 'Advanced', color: 'red' }
];

// Assessment types
export const ASSESSMENT_TYPES = [
  { id: 'quiz', name: 'Quiz' },
  { id: 'test', name: 'Test' },
  { id: 'exploration', name: 'Exploration' },
  { id: 'course', name: 'Course' }
];

// Visibility options
export const VISIBILITY_OPTIONS = [
  { id: 'public', name: 'Public' },
  { id: 'private', name: 'Private' },
  { id: 'premium', name: 'Premium' }
];

// Utility functions
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getCategoryIcon = (categoryId: string): string => {
  const category = ASSESSMENT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.icon || '📋';
};

export const getCategoryName = (categoryId: string): string => {
  const category = ASSESSMENT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.name || 'General';
};
