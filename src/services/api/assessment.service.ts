import { supabase } from '@/integrations/supabase/client';
import { Assessment, AssessmentQuestion, AssessmentResult } from '@/types/assessment';
import { Database } from '@/integrations/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { queryClient } from '@/lib/react-query';

// Type aliases for better type safety
type AssessmentRow = Database['public']['Tables']['assessments']['Row'];
type AssessmentQuestionRow = Database['public']['Tables']['assessment_questions']['Row'];
type AssessmentOptionRow = Database['public']['Tables']['assessment_options']['Row'];
type AssessmentResultRow = Database['public']['Tables']['assessment_results']['Row'];
type UserAssessmentResultRow = Database['public']['Tables']['user_assessment_results']['Row'];

// Enhanced error class for better error handling
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Realtime subscriptions
let realtimeChannel: RealtimeChannel | null = null;

// Utility function for cache management
const getFromCache = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

const invalidateCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Enhanced error handling wrapper
const handleError = (error: any, context: string): never => {
  console.error(`[AssessmentService] ${context}:`, error);
  
  if (error.code === 'PGRST116') {
    throw new AssessmentError('Assessment not found', 'NOT_FOUND', 404);
  }
  
  if (error.code === 'PGRST301') {
    throw new AssessmentError('Invalid request parameters', 'INVALID_PARAMS', 400);
  }
  
  if (error.code === '23505') {
    throw new AssessmentError('Duplicate entry', 'DUPLICATE', 409);
  }
  
  throw new AssessmentError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  );
};

// Fetch all public assessments with caching
export const getPublicAssessments = async (): Promise<Assessment[]> => {
  const cacheKey = 'public-assessments';
  const cached = getFromCache<Assessment[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions:assessment_questions(
          *,
          options:assessment_options(*)
        )
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const assessments = (data || []).map(transformAssessmentRow);
    setCache(cacheKey, assessments);
    return assessments;
  } catch (error) {
    handleError(error, 'getPublicAssessments');
  }
};

// Fetch assessments with advanced filtering
export const getAssessments = async (filters?: {
  category?: string;
  type?: string;
  difficulty?: string;
  visibility?: 'public' | 'private' | 'premium';
  limit?: number;
  offset?: number;
}): Promise<{ data: Assessment[]; total: number }> => {
  const cacheKey = `assessments-${JSON.stringify(filters || {})}`;
  const cached = getFromCache<{ data: Assessment[]; total: number }>(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('assessments')
      .select(`
        *,
        questions:assessment_questions(
          *,
          options:assessment_options(*)
        )
      `, { count: 'exact' });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const assessments = (data || []).map(transformAssessmentRow);
    const result = { data: assessments, total: count || 0 };
    
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    handleError(error, 'getAssessments');
  }
};

// Fetch single assessment by ID
export const getAssessmentById = async (id: string): Promise<Assessment | null> => {
  const cacheKey = `assessment-${id}`;
  const cached = getFromCache<Assessment>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions:assessment_questions(
          *,
          options:assessment_options(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const assessment = transformAssessmentRow(data);
    setCache(cacheKey, assessment);
    return assessment;
  } catch (error) {
    handleError(error, 'getAssessmentById');
  }
};

// Fetch full assessment details
export const getFullAssessment = async (id: string): Promise<Assessment | null> => {
  return getAssessmentById(id); // Using the enhanced version
};

// Create new assessment
export const createAssessment = async (assessment: Partial<Assessment>): Promise<Assessment> => {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        category: assessment.category,
        visibility: assessment.visibility,
        estimated_time: assessment.estimatedTime,
        scoring: assessment.scoring,
        created_by: assessment.createdBy
      })
      .select()
      .single();

    if (error) throw error;
    
    invalidateCache('assessments');
    return transformAssessmentRow(data);
  } catch (error) {
    handleError(error, 'createAssessment');
  }
};

// Update existing assessment
export const updateAssessment = async (id: string, updates: Partial<Assessment>): Promise<Assessment> => {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        visibility: updates.visibility,
        estimated_time: updates.estimatedTime,
        scoring: updates.scoring,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    invalidateCache(`assessment-${id}`);
    invalidateCache('assessments');
    return transformAssessmentRow(data);
  } catch (error) {
    handleError(error, 'updateAssessment');
  }
};

// Delete assessment
export const deleteAssessment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    invalidateCache(`assessment-${id}`);
    invalidateCache('assessments');
  } catch (error) {
    handleError(error, 'deleteAssessment');
  }
};

// Submit assessment results
export const submitAssessmentResult = async (params: {
  assessmentId: string;
  userId?: string;
  visitorSessionId?: string;
  responses: Record<string, any>;
  score: number;
  totalScore: number;
  percentage: number;
  personalityType?: string;
  insights?: string[];
  recommendations?: string[];
}): Promise<AssessmentResult> => {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        assessment_id: params.assessmentId,
        user_id: params.userId,
        visitor_session_id: params.visitorSessionId,
        score: params.score,
        total_score: params.totalScore,
        percentage: params.percentage,
        personality_type: params.personalityType,
        responses: params.responses,
        insights: params.insights,
        recommendations: params.recommendations,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return transformResultRow(data);
  } catch (error) {
    handleError(error, 'submitAssessmentResult');
  }
};

// Get user assessment results
export const getUserResults = async (userId: string): Promise<AssessmentResult[]> => {
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select(`
        *,
        assessment:assessments(*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformResultRow);
  } catch (error) {
    handleError(error, 'getUserResults');
  }
};

// Get assessment results with analytics
export const getAssessmentAnalytics = async (assessmentId: string) => {
  try {
    const [
      { data: results, error: resultsError },
      { count: totalCompletions, error: countError },
      { data: avgScore, error: avgError }
    ] = await Promise.all([
      supabase
        .from('assessment_results')
        .select('score, percentage, completed_at')
        .eq('assessment_id', assessmentId)
        .order('completed_at', { ascending: false })
        .limit(100),
      
      supabase
        .from('assessment_results')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_id', assessmentId),
      
      supabase
        .from('assessment_results')
        .select('score')
        .eq('assessment_id', assessmentId)
    ]);

    if (resultsError || countError || avgError) {
      throw resultsError || countError || avgError;
    }

    const totalScore = results?.reduce((sum, r) => sum + (r.score || 0), 0) || 0;
    const averageScore = results?.length ? totalScore / results.length : 0;
    const averagePercentage = results?.length 
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length 
      : 0;

    return {
      totalCompletions: totalCompletions || 0,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      recentResults: results || []
    };
  } catch (error) {
    handleError(error, 'getAssessmentAnalytics');
  }
};

// Real-time subscriptions
export const subscribeToAssessments = (
  callback: (payload: { eventType: string; assessment: Assessment }) => void
): RealtimeChannel => {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }

  realtimeChannel = supabase
    .channel('assessments-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'assessments' },
      (payload) => {
        const assessment = transformAssessmentRow(payload.new as AssessmentRow);
        callback({
          eventType: payload.eventType,
          assessment
        });
        
        // Invalidate relevant caches
        invalidateCache('assessments');
        if (payload.new?.id) {
          invalidateCache(`assessment-${payload.new.id}`);
        }
      }
    )
    .subscribe();

  return realtimeChannel;
};

// Utility function to transform database rows to application types
function transformAssessmentRow(row: any): Assessment {
  const questions = (row.questions || []).map((q: any) => ({
    id: q.id.toString(),
    text: q.question_text || q.text,
    type: q.question_type || q.type,
    options: (q.options || []).map((o: any) => ({
      id: o.id.toString(),
      text: o.option_text || o.text,
      value: o.value || o.option_text || o.text
    })),
    category: q.category,
    scale: q.scale,
    position: q.position || q.order
  }));

  return {
    id: row.id.toString(),
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category,
    visibility: row.visibility,
    estimatedTime: row.estimated_time || row.estimatedTime,
    questions,
    scoring: row.scoring,
    results: {
      summary: row.results?.summary || '',
      insights: row.results?.insights || [],
      recommendations: row.results?.recommendations || [],
      aiAnalysis: row.results?.aiAnalysis
    },
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function transformResultRow(row: any): AssessmentResult {
  return {
    id: row.id.toString(),
    assessmentId: row.assessment_id?.toString(),
    userId: row.user_id,
    visitorSessionId: row.visitor_session_id,
    score: row.score,
    totalScore: row.total_score || row.totalScore,
    percentage: row.percentage,
    personalityType: row.personality_type,
    responses: row.responses || {},
    insights: row.insights || [],
    recommendations: row.recommendations || [],
    completedAt: row.completed_at || row.completedAt,
    createdAt: row.created_at || row.createdAt,
    assessment: row.assessment ? transformAssessmentRow(row.assessment) : undefined
  };
}

// Cleanup function
export const cleanup = () => {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
  cache.clear();
};

// Export types for external use
export type { AssessmentRow, AssessmentQuestionRow, AssessmentOptionRow, AssessmentResultRow };