import { supabase } from '@/integrations/supabase/client';
import { 
  Assessment, 
  AssessmentResult, 
  AssessmentSubmissionParams,
  AssessmentQuestion
} from '@/types/assessment';
import { Database } from '@/integrations/supabase/types';
import { paymentService } from '@/services/api/payment.service';
import { RealtimeChannel } from '@supabase/supabase-js';

// Type aliases for better type safety
type AssessmentRow = Database['public']['Tables']['assessments']['Row'];
type AssessmentQuestionRow = Database['public']['Tables']['assessment_questions']['Row'];
type AssessmentOptionRow = Database['public']['Tables']['assessment_options']['Row'];
type AssessmentResultRow = Database['public']['Tables']['assessment_results']['Row'];

// Enhanced error class for better error handling
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

// Cache management
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Realtime subscriptions
let realtimeChannel: RealtimeChannel | null = null;

// Utility function for cache management
const getFromCache = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
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
  throw new AssessmentError('Failed to fetch public assessments', 'FETCH_FAILED', 500);
};

// Determine if current user has an active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const { data } = await paymentService.getCurrentSubscription();
    return !!data;
  } catch {
    return false;
  }
};

// Compute whether current user can access a given assessment by visibility
export const canAccessAssessment = async (visibility: 'public' | 'users' | 'premium'): Promise<boolean> => {
  if (visibility === 'public') return true;
  const { data: sessionData } = await supabase.auth.getSession();
  const isLoggedIn = !!sessionData.session?.user;
  if (visibility === 'users') return isLoggedIn;
  if (visibility === 'premium') {
    if (!isLoggedIn) return false;
    return await hasActiveSubscription();
  }
  return false;
};

// Fetch assessments available to the current user (visitor/user/subscriber)
export const getAccessibleAssessments = async (): Promise<Assessment[]> => {
  const cacheKey = 'accessible-assessments';
  const cached = getFromCache<Assessment[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const isLoggedIn = !!sessionData.session?.user;
    const subscribed = isLoggedIn ? await hasActiveSubscription() : false;

    let visibilities: Array<'public' | 'users' | 'premium'> = ['public'];
    if (isLoggedIn) visibilities = ['public', 'users'];
    if (subscribed) visibilities = ['public', 'users', 'premium'];

    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions:assessment_questions(
          *,
          options:assessment_options(*)
        )
      `)
      .in('visibility', visibilities)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const assessments = (data || []).map(transformAssessmentRow);
    setCache(cacheKey, assessments);
    return assessments;
  } catch (error) {
    handleError(error, 'getAccessibleAssessments');
  }
  throw new AssessmentError('Failed to fetch accessible assessments', 'FETCH_FAILED', 500);
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
  throw new AssessmentError('Failed to fetch assessments', 'FETCH_FAILED', 500);
};

// Fetch single assessment by ID
export const getAssessmentById = async (id: string): Promise<Assessment | null> => {
  // Validate ID to prevent NaN issues
  if (!id || id === 'null' || id === 'undefined' || isNaN(Number(id))) {
    console.error('Invalid assessment ID provided:', id);
    return null;
  }

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
      .eq('id', Number(id)) // Ensure ID is a number
      .single();

    if (error) throw error;
    if (!data) return null;

    const assessment = transformAssessmentRow(data);
    // Enforce access control
    const allowed = await canAccessAssessment(assessment.visibility);
    if (!allowed) {
      throw new AssessmentError('You do not have access to this assessment', 'FORBIDDEN', 403, { visibility: assessment.visibility });
    }
    setCache(cacheKey, assessment);
    return assessment;
  } catch (error) {
    handleError(error, 'getAssessmentById');
  }
  throw new AssessmentError('Failed to fetch assessment', 'FETCH_FAILED', 500);
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
        title: assessment.title || 'Untitled Assessment',
        description: assessment.description || '',
        type: assessment.type || 'personality',
        category: assessment.category || 'general',
        visibility: assessment.visibility || 'public',
        created_by: assessment.createdBy || 'system'
      })
      .select()
      .single();

    if (error) throw error;
    
    invalidateCache('assessments');
    return transformAssessmentRow(data);
  } catch (error) {
    handleError(error, 'createAssessment');
  }
  throw new AssessmentError('Failed to create assessment', 'CREATE_FAILED', 500);
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
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(id))
      .select()
      .single();

    if (error) throw error;
    
    invalidateCache(`assessment-${id}`);
    invalidateCache('assessments');
    return transformAssessmentRow(data);
  } catch (error) {
    handleError(error, 'updateAssessment');
  }
  throw new AssessmentError('Failed to update assessment', 'UPDATE_FAILED', 500);
};

// Delete assessment
export const deleteAssessment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', Number(id));

    if (error) throw error;
    
    invalidateCache(`assessment-${id}`);
    invalidateCache('assessments');
  } catch (error) {
    handleError(error, 'deleteAssessment');
  }
};

// Submit assessment results with real scoring
export const submitAssessmentResult = async (params: AssessmentSubmissionParams): Promise<AssessmentResult> => {
  try {
    // Get assessment to calculate proper scoring
    const assessment = await getAssessmentById(params.assessmentId);
    if (!assessment) {
      throw new AssessmentError('Assessment not found', 'NOT_FOUND', 404);
    }

    // Import scoring service dynamically to avoid circular dependencies
    const { default: AssessmentScoringService } = await import('../scoring/assessmentScoring.service');
    
    // Calculate real score using proper algorithms
    const scoringResult = AssessmentScoringService.calculateScore(assessment, params.responses);

    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        assessment_id: Number(params.assessmentId),
        user_id: params.userId || 'anonymous',
        answers: params.responses,
        score: scoringResult.score,
        percentage: scoringResult.percentage,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from assessment result insertion');

    return transformResultRow(data);
  } catch (error) {
    handleError(error, 'submitAssessmentResult');
  }
  throw new AssessmentError('Failed to submit assessment result', 'SUBMIT_FAILED', 500);
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
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformResultRow);
  } catch (error) {
    handleError(error, 'getUserResults');
  }
  throw new AssessmentError('Failed to get user results', 'FETCH_FAILED', 500);
};

// Get assessment results with analytics
export const getAssessmentAnalytics = async (assessmentId: string) => {
  try {
    const [
      { data: results, error: resultsError },
      { count: totalCompletions, error: countError }
    ] = await Promise.all([
      supabase
        .from('assessment_results')
        .select('score, percentage, submitted_at')
        .eq('assessment_id', Number(assessmentId))
        .order('submitted_at', { ascending: false })
        .limit(100),
      
      supabase
        .from('assessment_results')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_id', Number(assessmentId))
    ]);

    if (resultsError || countError) {
      throw resultsError || countError;
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
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new && payload.new.id) {
          invalidateCache(`assessment-${payload.new.id}`);
        }
      }
    )
    .subscribe();

  return realtimeChannel;
};

// Utility function to transform database rows to application types
function transformAssessmentRow(row: AssessmentRow): Assessment {
  // Transform questions from the database structure - handle the joined data properly
  const rawData = row as any;
  const questions: AssessmentQuestion[] = [];
  
  if (rawData.questions && Array.isArray(rawData.questions)) {
    for (const q of rawData.questions) {
      const question: AssessmentQuestion = {
        id: q.id?.toString() || Math.random().toString(),
        text: q.question_text || q.text || 'Question',
        type: (q.question_type || q.type || 'single') as 'single' | 'multiple' | 'scale' | 'text',
        category: q.category || 'general'
      };

      // Handle options if they exist
      if (q.options && Array.isArray(q.options)) {
        question.options = q.options.map((o: { option_text?: string; text?: string }) => o.option_text || o.text || 'Option');
      }

      // Handle scale if it exists
      if (q.scale) {
        question.scale = q.scale;
      }

      questions.push(question);
    }
  }

  return {
    id: row.id.toString(),
    title: row.title || 'Untitled Assessment',
    description: row.description || '',
    type: row.type || 'personality',
    category: row.category || 'general',
    visibility: (row.visibility || 'public') as 'public' | 'users' | 'premium',
    estimatedTime: 5, // Default estimated time
    questions,
    scoring: {
      type: 'cumulative',
      categories: [],
      interpretation: {}
    },
    results: {
      summary: 'Assessment completed successfully',
      insights: ['Your assessment has been completed.'],
      recommendations: ['Review your results to gain insights about yourself.'],
      aiAnalysis: undefined
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function transformResultRow(row: AssessmentResultRow): AssessmentResult {
  // Handle the answers which could be Json type - safely cast to unknown first
  const rawData = row as unknown as Record<string, unknown>;
  let responses: Record<string, string | number | boolean | string[]> = {};
  
  if (rawData.answers && typeof rawData.answers === 'object' && rawData.answers !== null) {
    responses = rawData.answers as Record<string, string | number | boolean | string[]>;
  }

  return {
    id: (rawData.id as number)?.toString() || '0',
    assessmentId: (rawData.assessment_id as number)?.toString(),
    userId: (rawData.user_id as string) || '',
    visitorSessionId: undefined, // Not available in current schema
    score: (rawData.score as number) || 0,
    totalScore: (rawData.total_points as number) || 100,
    percentage: (rawData.percentage as number) || 0,
    personalityType: undefined, // Not available in current schema
    responses,
    insights: [], // Not available in current schema
    recommendations: [], // Not available in current schema
    completedAt: (rawData.submitted_at as string) || new Date().toISOString(),
    createdAt: (rawData.created_at as string) || (rawData.submitted_at as string) || new Date().toISOString(), // Use submitted_at as fallback
    assessment: undefined // Would need to fetch separately if needed
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
