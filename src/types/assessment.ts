/**
 * Assessment Types
 * Comprehensive type definitions for assessment system
 */

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels: string[] };
  category?: string;
}

export interface AIAnalysis {
  insights: string[];
  recommendations: string[];
  summary: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  visibility: 'public' | 'users' | 'premium';
  estimatedTime: number;
  questions: AssessmentQuestion[];
  scoring: {
    type: 'cumulative' | 'categorical' | 'personality';
    categories?: string[];
    interpretation?: Record<string, string>;
  };
  results: {
    summary: string;
    insights: string[];
    recommendations: string[];
    aiAnalysis?: AIAnalysis;
  };
  createdBy?: string;
  difficulty?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId?: string;
  userId?: string;
  visitorSessionId?: string;
  score: number;
  totalScore: number;
  percentage: number;
  personalityType?: string;
  responses: Record<string, string | number | boolean | string[]>;
  insights: string[];
  recommendations: string[];
  completedAt: string;
  createdAt: string;
  assessment?: Assessment;
}

export interface AssessmentFilters {
  category?: string;
  type?: string;
  difficulty?: string;
  visibility?: 'public' | 'private' | 'premium';
  limit?: number;
  offset?: number;
}

export interface AssessmentAnalytics {
  totalCompletions: number;
  averageScore: number;
  averagePercentage: number;
  recentResults: Array<{
    score: number;
    percentage: number;
    completed_at: string;
  }>;
}

export interface AssessmentSubmissionParams {
  assessmentId: string;
  userId?: string;
  visitorSessionId?: string;
  responses: Record<string, string | number | boolean | string[]>;
}

export interface AssessmentError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface AssessmentScoringResult {
  score: number;
  maxScore: number;
  percentage: number;
  normalizedScore: number;
  categoryScores: Record<string, number>;
  personalityType?: string;
  confidenceLevel: number;
  factors: Record<string, number>;
}

export interface AssessmentScoringConfig {
  type: 'summation' | 'average' | 'weighted' | 'percentile' | 'personality' | 'composite';
  weights?: Record<string, number>;
  personalityTypes?: Record<string, any>;
  categories?: string[];
  interpretation?: Record<string, string>;
}

export interface AssessmentCreationData {
  title: string;
  description: string;
  type: string;
  category: string;
  visibility: 'public' | 'users' | 'premium';
  estimatedTime: number;
  questions: AssessmentQuestion[];
  scoring: AssessmentScoringConfig;
  createdBy?: string;
}

export interface AssessmentUpdateData {
  title?: string;
  description?: string;
  category?: string;
  visibility?: 'public' | 'users' | 'premium';
  estimatedTime?: number;
  scoring?: AssessmentScoringConfig;
}
