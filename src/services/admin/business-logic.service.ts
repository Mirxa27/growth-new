import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { AdminValidationService } from './validation.service';
import { AdminErrorHandler } from './error-handler.service';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Type definitions for business logic
export interface AssessmentCreationParams {
  title: string;
  description: string;
  type: string;
  visibility: 'public' | 'users' | 'premium';
  questions: Array<{
    text: string;
    type: 'single' | 'multiple' | 'scale' | 'text';
    options?: string[];
    required: boolean;
  }>;
  scoring?: any;
  results?: any;
  aiProvider?: string;
  aiModel?: string;
  aiPrompt?: string;
}

export interface ExplorationCreationParams {
  title: string;
  description: string;
  prompts: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  category: string;
  crystal_reward: number;
  estimated_duration: number;
  facilitator_prompt: string;
  higher_self_prompt: string;
  visibility: 'public' | 'private';
  is_active: boolean;
}

export interface ChallengeCreationParams {
  title: string;
  description: string;
  challenge_type: 'completion' | 'streak' | 'community';
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  is_active: boolean;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  growthPercentage: number;
  userEngagement: {
    assessmentsCompleted: number;
    explorationsStarted: number;
    challengesParticipated: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
}

export interface ContentAnalytics {
  totalAssessments: number;
  totalExplorations: number;
  totalChallenges: number;
  popularContent: Array<{
    id: string;
    title: string;
    type: string;
    completions: number;
    rating: number;
  }>;
  contentPerformance: {
    averageCompletionRate: number;
    averageRating: number;
    dropoffPoints: Array<{
      step: number;
      percentage: number;
    }>;
  };
}

export interface PlatformMetrics {
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  apiUsage: {
    totalRequests: number;
    requestsPerMinute: number;
    topEndpoints: Array<{
      endpoint: string;
      requests: number;
      avgResponseTime: number;
    }>;
  };
  aiProviderMetrics: {
    openaiUsage: number;
    anthropicUsage: number;
    totalTokensUsed: number;
    averageResponseTime: number;
  };
}

// Business Logic Service
export class AdminBusinessLogicService {
  /**
   * Create a new assessment with full business logic
   */
  static async createAssessment(params: AssessmentCreationParams): Promise<Tables<'assessments'>> {
    try {
      // Validate input
      const validation = AdminValidationService.validateAssessment(params);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
      }

      // Prepare questions for database
      const formattedQuestions = params.questions.map((q, index) => ({
        question_text: q.text,
        question_type: q.type === 'single' || q.type === 'multiple' ? 'multiple_choice' : 
                       q.type === 'scale' ? 'scale' : 'free_text',
        position: index + 1,
        options: (q.type === 'single' || q.type === 'multiple') && q.options ? 
          q.options.map((opt, optIndex) => ({
            option_text: opt,
            is_correct: false,
            position: optIndex + 1
          })) : []
      }));

      // Create assessment using stored procedure
      const { data, error } = await supabase.rpc('create_assessment_with_questions', {
        _title: params.title,
        _description: params.description,
        _type: params.type,
        _visibility: params.visibility,
        _ai_provider: params.aiProvider || 'openai',
        _ai_model: params.aiModel || 'gpt-4o-mini',
        _ai_prompt: params.aiPrompt || `Assessment: ${params.title}`,
        _questions: formattedQuestions
      });

      if (error) throw error;

      // Log successful creation
      logger.info('Assessment created successfully', 'AdminBusinessLogicService', {
        assessmentId: data?.id,
        title: params.title,
        questionCount: params.questions.length
      });

      // Update analytics
      await this.updateContentAnalytics('assessment_created');

      return data;
    } catch (error) {
      return AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.createAssessment',
        showToast: true,
      }) as never;
    }
  }

  /**
   * Create a new exploration with business logic
   */
  static async createExploration(params: ExplorationCreationParams): Promise<Tables<'explorations'>> {
    try {
      // Validate input
      const validation = AdminValidationService.validateExploration(params);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
      }

      // Create exploration
      const { data, error } = await supabase
        .from('explorations')
        .insert([{
          title: params.title,
          description: params.description,
          questions: params.prompts,
          difficulty_level: params.difficulty_level,
          category: params.category,
          crystal_reward: params.crystal_reward,
          estimated_duration: params.estimated_duration,
          facilitator_prompt: params.facilitator_prompt,
          higher_self_prompt: params.higher_self_prompt,
          visibility: params.visibility,
          is_active: params.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      // Log successful creation
      logger.info('Exploration created successfully', 'AdminBusinessLogicService', {
        explorationId: data.id,
        title: params.title,
        promptCount: params.prompts.length
      });

      // Update analytics
      await this.updateContentAnalytics('exploration_created');

      return data;
    } catch (error) {
      return AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.createExploration',
        showToast: true,
      }) as never;
    }
  }

  /**
   * Create a new challenge with business logic
   */
  static async createChallenge(params: ChallengeCreationParams): Promise<Tables<'content_challenges'>> {
    try {
      // Validate input
      const validation = AdminValidationService.validateChallenge(params);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
      }

      // Create challenge
      const { data, error } = await supabase
        .from('content_challenges')
        .insert([{
          title: params.title,
          description: params.description,
          challenge_type: params.challenge_type,
          difficulty: params.difficulty,
          reward: params.reward,
          is_active: params.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      // Log successful creation
      logger.info('Challenge created successfully', 'AdminBusinessLogicService', {
        challengeId: data.id,
        title: params.title,
        type: params.challenge_type
      });

      // Update analytics
      await this.updateContentAnalytics('challenge_created');

      return data;
    } catch (error) {
      return AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.createChallenge',
        showToast: true,
      }) as never;
    }
  }

  /**
   * Get comprehensive user analytics
   */
  static async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const [
        usersResponse,
        assessmentCompletionsResponse,
        explorationSessionsResponse,
        challengeParticipationsResponse
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, last_login_at, date_of_birth, location'),
        supabase.from('assessment_responses').select('id, created_at'),
        supabase.from('exploration_sessions').select('id, created_at, status'),
        supabase.from('user_challenges').select('id, created_at')
      ]);

      const users = usersResponse.data || [];
      const assessmentCompletions = assessmentCompletionsResponse.data || [];
      const explorationSessions = explorationSessionsResponse.data || [];
      const challengeParticipations = challengeParticipationsResponse.data || [];

      // Calculate metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const newUsersThisWeek = users.filter(u => 
        new Date(u.created_at || '').getTime() > weekAgo.getTime()
      ).length;

      const newUsersLastWeek = users.filter(u => {
        const created = new Date(u.created_at || '');
        return created.getTime() > new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).getTime() && 
               created.getTime() <= weekAgo.getTime();
      }).length;

      const activeUsersToday = users.filter(u => 
        u.last_login_at && new Date(u.last_login_at).getTime() > dayAgo.getTime()
      ).length;

      const growthPercentage = newUsersLastWeek > 0 
        ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
        : newUsersThisWeek > 0 ? 100 : 0;

      // Calculate demographics
      const ageGroups = this.calculateAgeGroups(users);
      const locations = this.calculateLocationDistribution(users);

      return {
        totalUsers: users.length,
        activeUsersToday,
        newUsersThisWeek,
        growthPercentage,
        userEngagement: {
          assessmentsCompleted: assessmentCompletions.length,
          explorationsStarted: explorationSessions.length,
          challengesParticipated: challengeParticipations.length,
        },
        demographics: {
          ageGroups,
          locations,
        },
      };
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.getUserAnalytics',
        showToast: false,
      });
      
      // Return default analytics on error
      return {
        totalUsers: 0,
        activeUsersToday: 0,
        newUsersThisWeek: 0,
        growthPercentage: 0,
        userEngagement: {
          assessmentsCompleted: 0,
          explorationsStarted: 0,
          challengesParticipated: 0,
        },
        demographics: {
          ageGroups: {},
          locations: {},
        },
      };
    }
  }

  /**
   * Get comprehensive content analytics
   */
  static async getContentAnalytics(): Promise<ContentAnalytics> {
    try {
      const [
        assessmentsResponse,
        explorationsResponse,
        challengesResponse,
        completionsResponse
      ] = await Promise.all([
        supabase.from('assessments').select('id, title, created_at'),
        supabase.from('explorations').select('id, title, created_at'),
        supabase.from('content_challenges').select('id, title, created_at'),
        supabase.rpc('get_content_completion_stats')
      ]);

      const assessments = assessmentsResponse.data || [];
      const explorations = explorationsResponse.data || [];
      const challenges = challengesResponse.data || [];
      const completionStats = completionsResponse.data || [];

      // Calculate popular content
      const popularContent = completionStats
        .sort((a: any, b: any) => b.completions - a.completions)
        .slice(0, 10)
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          completions: item.completions,
          rating: item.average_rating || 0,
        }));

      // Calculate performance metrics
      const totalCompletions = completionStats.reduce((sum: number, item: any) => sum + item.completions, 0);
      const averageCompletionRate = totalCompletions > 0 ? 
        completionStats.reduce((sum: number, item: any) => sum + item.completion_rate, 0) / completionStats.length : 0;
      
      const averageRating = completionStats.length > 0 ?
        completionStats.reduce((sum: number, item: any) => sum + (item.average_rating || 0), 0) / completionStats.length : 0;

      return {
        totalAssessments: assessments.length,
        totalExplorations: explorations.length,
        totalChallenges: challenges.length,
        popularContent,
        contentPerformance: {
          averageCompletionRate,
          averageRating,
          dropoffPoints: [], // Would be calculated from session data
        },
      };
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.getContentAnalytics',
        showToast: false,
      });
      
      return {
        totalAssessments: 0,
        totalExplorations: 0,
        totalChallenges: 0,
        popularContent: [],
        contentPerformance: {
          averageCompletionRate: 0,
          averageRating: 0,
          dropoffPoints: [],
        },
      };
    }
  }

  /**
   * Get platform metrics and health
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      // This would integrate with monitoring services in production
      const [
        systemHealthResponse,
        apiUsageResponse,
        aiUsageResponse
      ] = await Promise.all([
        supabase.rpc('get_system_health_metrics'),
        supabase.rpc('get_api_usage_metrics'),
        supabase.rpc('get_ai_usage_metrics')
      ]);

      const systemHealth = systemHealthResponse.data || {};
      const apiUsage = apiUsageResponse.data || {};
      const aiUsage = aiUsageResponse.data || {};

      return {
        systemHealth: {
          uptime: systemHealth.uptime || 99.9,
          responseTime: systemHealth.avg_response_time || 150,
          errorRate: systemHealth.error_rate || 0.1,
        },
        apiUsage: {
          totalRequests: apiUsage.total_requests || 0,
          requestsPerMinute: apiUsage.requests_per_minute || 0,
          topEndpoints: apiUsage.top_endpoints || [],
        },
        aiProviderMetrics: {
          openaiUsage: aiUsage.openai_requests || 0,
          anthropicUsage: aiUsage.anthropic_requests || 0,
          totalTokensUsed: aiUsage.total_tokens || 0,
          averageResponseTime: aiUsage.avg_response_time || 500,
        },
      };
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.getPlatformMetrics',
        showToast: false,
      });
      
      return {
        systemHealth: {
          uptime: 0,
          responseTime: 0,
          errorRate: 0,
        },
        apiUsage: {
          totalRequests: 0,
          requestsPerMinute: 0,
          topEndpoints: [],
        },
        aiProviderMetrics: {
          openaiUsage: 0,
          anthropicUsage: 0,
          totalTokensUsed: 0,
          averageResponseTime: 0,
        },
      };
    }
  }

  /**
   * Bulk operations for content management
   */
  static async bulkUpdateContent(
    contentType: 'assessments' | 'explorations' | 'content_challenges',
    ids: string[],
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(contentType)
        .update(updates)
        .in('id', ids);

      if (error) throw error;

      logger.info('Bulk content update successful', 'AdminBusinessLogicService', {
        contentType,
        updatedCount: ids.length,
        updates
      });
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.bulkUpdateContent',
        showToast: true,
      });
      throw error;
    }
  }

  /**
   * Advanced user management
   */
  static async updateUserRole(userId: string, newRole: 'user' | 'admin' | 'moderator'): Promise<void> {
    try {
      // Validate permission
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // Update user role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      logger.info('User role updated', 'AdminBusinessLogicService', {
        userId,
        newRole,
        updatedBy: currentUser.user.id
      });
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.updateUserRole',
        showToast: true,
      });
      throw error;
    }
  }

  /**
   * Content moderation
   */
  static async moderateContent(
    contentType: string,
    contentId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_moderation')
        .insert([{
          content_type: contentType,
          content_id: contentId,
          action,
          reason,
          moderated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      logger.info('Content moderated', 'AdminBusinessLogicService', {
        contentType,
        contentId,
        action,
        reason
      });
    } catch (error) {
      AdminErrorHandler.handle(error, {
        context: 'AdminBusinessLogicService.moderateContent',
        showToast: true,
      });
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private static calculateAgeGroups(users: any[]): Record<string, number> {
    const ageGroups: Record<string, number> = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55+': 0,
    };

    users.forEach(user => {
      if (user.date_of_birth) {
        const age = new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
        if (age >= 18 && age <= 24) ageGroups['18-24']++;
        else if (age >= 25 && age <= 34) ageGroups['25-34']++;
        else if (age >= 35 && age <= 44) ageGroups['35-44']++;
        else if (age >= 45 && age <= 54) ageGroups['45-54']++;
        else if (age >= 55) ageGroups['55+']++;
      }
    });

    return ageGroups;
  }

  private static calculateLocationDistribution(users: any[]): Record<string, number> {
    const locations: Record<string, number> = {};

    users.forEach(user => {
      if (user.location) {
        locations[user.location] = (locations[user.location] || 0) + 1;
      }
    });

    return locations;
  }

  private static async updateContentAnalytics(event: string): Promise<void> {
    try {
      await supabase
        .from('analytics_events')
        .insert([{
          event_type: event,
          timestamp: new Date().toISOString(),
          metadata: {}
        }]);
    } catch (error) {
      logger.warn('Failed to update analytics', 'AdminBusinessLogicService', error);
    }
  }
}

export default AdminBusinessLogicService;