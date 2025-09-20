import { supabase } from '@/integrations/supabase/client';
import { 
  CreateUser, 
  UpdateUser, 
  UserResponse,
  CreateAssessment,
  UpdateAssessment,
  AssessmentResponse,
  CreateAIBuildJob,
  AIBuildJobResponse,
  VoiceAgentConfig,
  VoiceAgentConfigResponse,
  PayPalConfig,
  CreatePayPalPlan,
  PayPalPlanResponse,
  CreateContentChallenge,
  ContentChallengeResponse,
  CreateCommunityPost,
  CommunityPostResponse,
  AnalyticsMetrics,
  SuccessResponse,
  // Schema imports
  CreateUserSchema,
  UpdateUserSchema,
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  CreateAIBuildJobSchema,
  VoiceAgentConfigSchema,
  PayPalConfigSchema,
  CreatePayPalPlanSchema,
  CreateContentChallengeSchema,
  CreateCommunityPostSchema,
} from '@/schemas/admin.schemas';
import { 
  AdminErrorHandler, 
  AdminError,
  AdminAuthenticationError,
  AdminAuthorizationError,
  AdminNotFoundError,
  AdminErrorContext
} from './admin-error-handler.service';
import { logger } from '@/utils/logger';

export class ComprehensiveAdminService {
  private static instance: ComprehensiveAdminService;

  public static getInstance(): ComprehensiveAdminService {
    if (!ComprehensiveAdminService.instance) {
      ComprehensiveAdminService.instance = new ComprehensiveAdminService();
    }
    return ComprehensiveAdminService.instance;
  }

  /**
   * Get current user context for error handling
   */
  private async getCurrentUserContext(): Promise<{ userId: string; userRole: string }> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AdminAuthenticationError({ 
        component: 'ComprehensiveAdminService', 
        action: 'getCurrentUserContext' 
      });
    }

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.warn('Could not fetch user profile', 'ComprehensiveAdminService', profileError);
    }

    return {
      userId: user.id,
      userRole: profile?.role || 'user'
    };
  }

  // USER MANAGEMENT
  
  /**
   * Create a new user
   */
  async createUser(userData: CreateUser): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'createUser' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(CreateUserSchema, userData, context);
      
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError) {
        AdminErrorHandler.handleDatabaseError(authError, context);
      }

      if (!authUser.user) {
        throw new AdminError('Failed to create user', 'USER_CREATION_FAILED', 500, context);
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: validatedData.role,
          is_active: validatedData.is_active,
        });

      if (profileError) {
        AdminErrorHandler.handleDatabaseError(profileError, context);
      }

      logger.info(`User created successfully: ${validatedData.email}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { userId: authUser.user.id },
        'User created successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to create user',
        'USER_CREATION_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, userData: UpdateUser): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'updateUser',
      additionalData: { targetUserId: userId }
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(UpdateUserSchema, userData, context);
      
      const { error } = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('id', userId);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      logger.info(`User updated successfully: ${userId}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { userId },
        'User updated successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to update user',
        'USER_UPDATE_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Get users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20): Promise<{ data: UserResponse[]; total: number }> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getUsers' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const offset = (page - 1) * limit;
      
      const { data: users, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      return {
        data: users || [],
        total: count || 0
      };
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch users',
        'USERS_FETCH_ERROR',
        500,
        context
      );
    }
  }

  // ASSESSMENT MANAGEMENT
  
  /**
   * Create a new assessment
   */
  async createAssessment(assessmentData: CreateAssessment): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'createAssessment' 
    };
    
    try {
      const { userId, userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(CreateAssessmentSchema, assessmentData, context);
      
      // Extract questions from the validated data
      const { questions, ...assessmentInfo } = validatedData;
      
      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          ...assessmentInfo,
          created_by: userId,
        })
        .select('id')
        .single();

      if (assessmentError) {
        AdminErrorHandler.handleDatabaseError(assessmentError, context);
      }

      if (!assessment) {
        throw new AdminError('Failed to create assessment', 'ASSESSMENT_CREATION_FAILED', 500, context);
      }

      // Create questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((question, index) => ({
          assessment_id: assessment.id,
          question_text: question.question_text,
          question_type: question.question_type,
          order_index: question.order_index ?? index,
          points: question.points ?? 1,
          options: question.options ? JSON.stringify(question.options) : null,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          required: question.required ?? true,
        }));

        const { error: questionsError } = await supabase
          .from('assessment_questions')
          .insert(questionsToInsert);

        if (questionsError) {
          // Cleanup: delete the assessment if questions failed to insert
          await supabase.from('assessments').delete().eq('id', assessment.id);
          AdminErrorHandler.handleDatabaseError(questionsError, context);
        }
      }

      logger.info(`Assessment created successfully: ${assessment.id}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { assessmentId: assessment.id },
        'Assessment created successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to create assessment',
        'ASSESSMENT_CREATION_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Update an assessment
   */
  async updateAssessment(assessmentData: UpdateAssessment): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'updateAssessment',
      additionalData: { assessmentId: assessmentData.id }
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(UpdateAssessmentSchema, assessmentData, context);
      
      const { id, questions, ...assessmentInfo } = validatedData;
      
      // Update assessment
      const { error: updateError } = await supabase
        .from('assessments')
        .update(assessmentInfo)
        .eq('id', id);

      if (updateError) {
        AdminErrorHandler.handleDatabaseError(updateError, context);
      }

      // Update questions if provided
      if (questions && questions.length > 0) {
        // Delete existing questions
        await supabase
          .from('assessment_questions')
          .delete()
          .eq('assessment_id', id);

        // Insert updated questions
        const questionsToInsert = questions.map((question, index) => ({
          assessment_id: id,
          question_text: question.question_text,
          question_type: question.question_type,
          order_index: question.order_index ?? index,
          points: question.points ?? 1,
          options: question.options ? JSON.stringify(question.options) : null,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          required: question.required ?? true,
        }));

        const { error: questionsError } = await supabase
          .from('assessment_questions')
          .insert(questionsToInsert);

        if (questionsError) {
          AdminErrorHandler.handleDatabaseError(questionsError, context);
        }
      }

      logger.info(`Assessment updated successfully: ${id}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { assessmentId: id },
        'Assessment updated successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to update assessment',
        'ASSESSMENT_UPDATE_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Get assessments with pagination
   */
  async getAssessments(page: number = 1, limit: number = 20): Promise<{ data: AssessmentResponse[]; total: number }> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getAssessments' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const offset = (page - 1) * limit;
      
      const { data: assessments, error, count } = await supabase
        .from('assessments')
        .select(`
          *,
          questions:assessment_questions(count),
          completions:assessment_results(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      const formattedData = assessments?.map(assessment => ({
        ...assessment,
        questions_count: assessment.questions?.[0]?.count || 0,
        completions_count: assessment.completions?.[0]?.count || 0,
        average_score: null, // TODO: Calculate from assessment_results
      })) || [];

      return {
        data: formattedData,
        total: count || 0
      };
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch assessments',
        'ASSESSMENTS_FETCH_ERROR',
        500,
        context
      );
    }
  }

  // AI CONTENT BUILDER MANAGEMENT
  
  /**
   * Create AI build job
   */
  async createAIBuildJob(jobData: CreateAIBuildJob): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'createAIBuildJob' 
    };
    
    try {
      const { userId, userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(CreateAIBuildJobSchema, jobData, context);
      
      const { data: job, error } = await supabase
        .from('ai_build_jobs')
        .insert({
          ...validatedData,
          admin_id: userId,
          status: 'pending',
          progress: 0,
        })
        .select('id')
        .single();

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      if (!job) {
        throw new AdminError('Failed to create AI build job', 'AI_JOB_CREATION_FAILED', 500, context);
      }

      logger.info(`AI build job created: ${job.id}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { jobId: job.id },
        'AI build job created successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to create AI build job',
        'AI_JOB_CREATION_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Get AI build jobs
   */
  async getAIBuildJobs(page: number = 1, limit: number = 20): Promise<{ data: AIBuildJobResponse[]; total: number }> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getAIBuildJobs' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const offset = (page - 1) * limit;
      
      const { data: jobs, error, count } = await supabase
        .from('ai_build_jobs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      return {
        data: jobs || [],
        total: count || 0
      };
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch AI build jobs',
        'AI_JOBS_FETCH_ERROR',
        500,
        context
      );
    }
  }

  // VOICE AGENT CONFIGURATION
  
  /**
   * Create or update voice agent configuration
   */
  async saveVoiceAgentConfig(configData: VoiceAgentConfig): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'saveVoiceAgentConfig' 
    };
    
    try {
      const { userId, userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(VoiceAgentConfigSchema, configData, context);
      
      const { id, ...configInfo } = validatedData;
      
      if (id) {
        // Update existing config
        const { error } = await supabase
          .from('voice_agent_configs')
          .update(configInfo)
          .eq('id', id);

        if (error) {
          AdminErrorHandler.handleDatabaseError(error, context);
        }

        return AdminErrorHandler.createSuccessResponse(
          { configId: id },
          'Voice agent configuration updated successfully'
        );
      } else {
        // Create new config
        const { data: config, error } = await supabase
          .from('voice_agent_configs')
          .insert({
            ...configInfo,
            created_by: userId,
          })
          .select('id')
          .single();

        if (error) {
          AdminErrorHandler.handleDatabaseError(error, context);
        }

        if (!config) {
          throw new AdminError('Failed to create voice agent configuration', 'VOICE_CONFIG_CREATION_FAILED', 500, context);
        }

        return AdminErrorHandler.createSuccessResponse(
          { configId: config.id },
          'Voice agent configuration created successfully'
        );
      }
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to save voice agent configuration',
        'VOICE_CONFIG_SAVE_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Get voice agent configurations
   */
  async getVoiceAgentConfigs(): Promise<VoiceAgentConfigResponse[]> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getVoiceAgentConfigs' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const { data: configs, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      return configs || [];
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch voice agent configurations',
        'VOICE_CONFIGS_FETCH_ERROR',
        500,
        context
      );
    }
  }

  // CONTENT CHALLENGE MANAGEMENT
  
  /**
   * Create a content challenge
   */
  async createContentChallenge(challengeData: CreateContentChallenge): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'createContentChallenge' 
    };
    
    try {
      const { userId, userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const validatedData = AdminErrorHandler.validateOrThrow(CreateContentChallengeSchema, challengeData, context);
      
      const { data: challenge, error } = await supabase
        .from('content_challenges')
        .insert({
          ...validatedData,
          created_by: userId,
        })
        .select('id')
        .single();

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      if (!challenge) {
        throw new AdminError('Failed to create content challenge', 'CHALLENGE_CREATION_FAILED', 500, context);
      }

      logger.info(`Content challenge created: ${challenge.id}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { challengeId: challenge.id },
        'Content challenge created successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to create content challenge',
        'CHALLENGE_CREATION_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Update a content challenge
   */
  async updateContentChallenge(challengeId: string, challengeData: Partial<CreateContentChallenge>): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'updateContentChallenge',
      additionalData: { challengeId }
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      // Validate the partial data against a partial schema
      const partialSchema = CreateContentChallengeSchema.partial();
      const validatedData = AdminErrorHandler.validateOrThrow(partialSchema, challengeData, context);
      
      const { error } = await supabase
        .from('content_challenges')
        .update(validatedData)
        .eq('id', challengeId);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      logger.info(`Content challenge updated: ${challengeId}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { challengeId },
        'Content challenge updated successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to update content challenge',
        'CHALLENGE_UPDATE_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Get content challenges with pagination
   */
  async getContentChallenges(page: number = 1, limit: number = 20): Promise<{ data: ContentChallengeResponse[]; total: number }> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getContentChallenges' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const offset = (page - 1) * limit;
      
      const { data: challenges, error, count } = await supabase
        .from('content_challenges')
        .select(`
          *,
          participants:user_challenge_progress(user_id.count),
          completions:user_challenge_progress(count).eq(status, 'completed')
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      const formattedData = challenges?.map(challenge => ({
        ...challenge,
        participants_count: challenge.participants?.[0]?.count || 0,
        completions_count: challenge.completions?.[0]?.count || 0,
      })) || [];

      return {
        data: formattedData,
        total: count || 0
      };
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch content challenges',
        'CHALLENGES_FETCH_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Delete a content challenge
   */
  async deleteContentChallenge(challengeId: string): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'deleteContentChallenge',
      additionalData: { challengeId }
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      const { error } = await supabase
        .from('content_challenges')
        .delete()
        .eq('id', challengeId);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      logger.info(`Content challenge deleted: ${challengeId}`, 'ComprehensiveAdminService');
      
      return AdminErrorHandler.createSuccessResponse(
        { challengeId },
        'Content challenge deleted successfully'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to delete content challenge',
        'CHALLENGE_DELETE_ERROR',
        500,
        context
      );
    }
  }

  // ANALYTICS
  
  /**
   * Get comprehensive analytics metrics
   */
  async getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'getAnalyticsMetrics' 
    };
    
    try {
      const { userRole } = await this.getCurrentUserContext();
      AdminErrorHandler.validateAdminAccess(userRole, context);
      
      // Use Promise.allSettled to ensure partial data on failures
      const [
        totalUsersResult,
        activeUsersTodayResult,
        activeUsersWeekResult,
        newUsersWeekResult,
        totalAssessmentsResult,
        totalCompletionsResult,
        totalCommunityPostsResult,
        totalLibraryItemsResult
      ] = await Promise.allSettled([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('last_sign_in', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('last_sign_in', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('assessments').select('*', { count: 'exact', head: true }),
        supabase.from('assessment_results').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('library_items').select('*', { count: 'exact', head: true })
      ]);

      // Extract counts with fallback to 0
      const totalUsers = totalUsersResult.status === 'fulfilled' ? (totalUsersResult.value.count || 0) : 0;
      const activeUsersToday = activeUsersTodayResult.status === 'fulfilled' ? (activeUsersTodayResult.value.count || 0) : 0;
      const activeUsersWeek = activeUsersWeekResult.status === 'fulfilled' ? (activeUsersWeekResult.value.count || 0) : 0;
      const newUsersWeek = newUsersWeekResult.status === 'fulfilled' ? (newUsersWeekResult.value.count || 0) : 0;
      const totalAssessments = totalAssessmentsResult.status === 'fulfilled' ? (totalAssessmentsResult.value.count || 0) : 0;
      const totalCompletions = totalCompletionsResult.status === 'fulfilled' ? (totalCompletionsResult.value.count || 0) : 0;
      const totalCommunityPosts = totalCommunityPostsResult.status === 'fulfilled' ? (totalCommunityPostsResult.value.count || 0) : 0;
      const totalLibraryItems = totalLibraryItemsResult.status === 'fulfilled' ? (totalLibraryItemsResult.value.count || 0) : 0;

      // Calculate derived metrics
      const userRetentionRate = totalUsers > 0 ? (activeUsersWeek / totalUsers) * 100 : 0;
      const growthPercentage = totalUsers > newUsersWeek ? ((newUsersWeek / (totalUsers - newUsersWeek)) * 100) : 0;
      const averageSessionDuration = 15; // Placeholder - would need session tracking
      const bounceRate = 25; // Placeholder - would need proper analytics

      return {
        total_users: totalUsers,
        active_users_today: activeUsersToday,
        active_users_week: activeUsersWeek,
        new_users_week: newUsersWeek,
        total_assessments: totalAssessments,
        total_completions: totalCompletions,
        total_community_posts: totalCommunityPosts,
        total_library_items: totalLibraryItems,
        average_session_duration: averageSessionDuration,
        bounce_rate: bounceRate,
        user_retention_rate: userRetentionRate,
        growth_percentage: growthPercentage,
      };
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Failed to fetch analytics metrics',
        'ANALYTICS_FETCH_ERROR',
        500,
        context
      );
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<SuccessResponse> {
    const context: AdminErrorContext = { 
      component: 'ComprehensiveAdminService', 
      action: 'healthCheck' 
    };
    
    try {
      // Test database connection
      const { error } = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (error) {
        AdminErrorHandler.handleDatabaseError(error, context);
      }

      return AdminErrorHandler.createSuccessResponse(
        { timestamp: new Date().toISOString(), status: 'healthy' },
        'Service is healthy'
      );
      
    } catch (error) {
      throw error instanceof AdminError ? error : new AdminError(
        'Health check failed',
        'HEALTH_CHECK_FAILED',
        500,
        context
      );
    }
  }
}

// Export singleton instance
export const adminService = ComprehensiveAdminService.getInstance();