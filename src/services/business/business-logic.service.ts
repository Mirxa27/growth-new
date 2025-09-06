/**
 * Business Logic Service
 * Core business rules, validation, and processing logic
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logging/logger.service';
import {
  validateDTO,
  validatePartialDTO,
  ValidationHelper,
  CreateUserSchema,
  UpdateUserSchema,
  UserProfile,
  CreateAssessmentSchema,
  SubmitAssessmentSchema,
  AssessmentResult,
  CreateCommunityPostSchema,
  CreateCommentSchema,
  VoiceAgentConfigSchema,
  CreateVoiceSessionSchema,
  type CreateUser,
  type UpdateUser,
  type CreateAssessment,
  type SubmitAssessment,
  type CreateCommunityPost,
  type CreateComment,
  type VoiceAgentConfig,
  type CreateVoiceSession,
} from '@/types/dto';

export interface BusinessRuleContext {
  userId?: string;
  userRole?: 'user' | 'admin' | 'super_admin';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface BusinessRuleResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
  businessErrors?: string[];
  warnings?: string[];
}

class BusinessLogicService {
  private static instance: BusinessLogicService;

  private constructor() {}

  static getInstance(): BusinessLogicService {
    if (!BusinessLogicService.instance) {
      BusinessLogicService.instance = new BusinessLogicService();
    }
    return BusinessLogicService.instance;
  }

  /**
   * User Management Business Logic
   */
  async createUser(userData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult<UserProfile>> {
    try {
      // Validate input data
      const validatedData = validateDTO(CreateUserSchema, userData);

      // Business rules validation
      const businessValidation = await this.validateUserBusinessRules(validatedData, 'create', context);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', validatedData.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          businessErrors: ['User with this email already exists']
        };
      }

      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            name: validatedData.name,
            role: validatedData.role,
          }
        }
      });

      if (authError) {
        logger.error('User creation failed', {
          action: 'createUser',
          error: authError,
          context
        });
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Create profile
      const profileData = {
        id: authData.user!.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        preferences: validatedData.preferences || {},
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        logger.error('Profile creation failed', {
          action: 'createUser',
          error: profileError,
          context
        });
        return {
          success: false,
          error: 'Failed to create user profile'
        };
      }

      logger.info('User created successfully', {
        action: 'createUser',
        metadata: { userId: profile.id, email: validatedData.email },
        context
      });

      return {
        success: true,
        data: profile as UserProfile
      };

    } catch (error) {
      logger.error('User creation validation failed', {
        action: 'createUser',
        error,
        context
      });

      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  async updateUser(userId: string, userData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult<UserProfile>> {
    try {
      const validatedData = validatePartialDTO(UpdateUserSchema, userData);

      // Check permissions
      if (context.userId !== userId && context.userRole !== 'admin' && context.userRole !== 'super_admin') {
        return {
          success: false,
          businessErrors: ['Insufficient permissions to update this user']
        };
      }

      // Business rules validation
      const businessValidation = await this.validateUserBusinessRules(validatedData, 'update', context);
      if (!businessValidation.success) {
        return businessValidation;
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('User update failed', {
          action: 'updateUser',
          error,
          metadata: { userId },
          context
        });
        return {
          success: false,
          error: 'Failed to update user'
        };
      }

      return {
        success: true,
        data: updatedProfile as UserProfile
      };

    } catch (error) {
      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  /**
   * Assessment Business Logic
   */
  async createAssessment(assessmentData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    try {
      const validatedData = validateDTO(CreateAssessmentSchema, assessmentData);

      // Check permissions
      if (context.userRole !== 'admin' && context.userRole !== 'super_admin') {
        return {
          success: false,
          businessErrors: ['Only administrators can create assessments']
        };
      }

      // Business rules for assessment creation
      const businessValidation = await this.validateAssessmentBusinessRules(validatedData, context);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // Create assessment
      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          ...validatedData,
          created_by: context.userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Assessment creation failed', {
          action: 'createAssessment',
          error,
          context
        });
        return {
          success: false,
          error: 'Failed to create assessment'
        };
      }

      return {
        success: true,
        data: assessment
      };

    } catch (error) {
      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  async submitAssessment(submissionData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult<AssessmentResult>> {
    try {
      const validatedData = validateDTO(SubmitAssessmentSchema, submissionData);

      // Business rules for assessment submission
      const businessValidation = await this.validateAssessmentSubmissionBusinessRules(validatedData, context);
      if (!businessValidation.success) {
        return businessValidation;
      }

      // Get assessment details
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', validatedData.assessment_id)
        .single();

      if (assessmentError || !assessment) {
        return {
          success: false,
          businessErrors: ['Assessment not found']
        };
      }

      if (!assessment.is_active) {
        return {
          success: false,
          businessErrors: ['Assessment is no longer active']
        };
      }

      // Calculate score
      const scoreResult = await this.calculateAssessmentScore(assessment, validatedData.responses);
      if (!scoreResult.success) {
        return scoreResult;
      }

      // Create assessment result
      const resultData = {
        assessment_id: validatedData.assessment_id,
        user_id: validatedData.user_id || context.userId,
        score: scoreResult.data!.score,
        max_score: scoreResult.data!.maxScore,
        percentage: scoreResult.data!.percentage,
        passed: scoreResult.data!.percentage >= (assessment.passing_score || 60),
        personality_type: scoreResult.data!.personalityType,
        insights: scoreResult.data!.insights,
        recommendations: scoreResult.data!.recommendations,
        ai_feedback: scoreResult.data!.aiFeedback,
      };

      const { data: result, error: resultError } = await supabase
        .from('assessment_results')
        .insert(resultData)
        .select()
        .single();

      if (resultError) {
        logger.error('Assessment result creation failed', {
          action: 'submitAssessment',
          error: resultError,
          context
        });
        return {
          success: false,
          error: 'Failed to save assessment result'
        };
      }

      return {
        success: true,
        data: result as AssessmentResult
      };

    } catch (error) {
      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  /**
   * Community Business Logic
   */
  async createCommunityPost(postData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    try {
      const validatedData = validateDTO(CreateCommunityPostSchema, postData);

      // Rate limiting check
      const rateLimitResult = await this.checkPostRateLimit(context.userId!, context);
      if (!rateLimitResult.success) {
        return rateLimitResult;
      }

      // Content moderation
      const moderationResult = await this.moderateContent(validatedData.content, context);
      if (!moderationResult.success) {
        return moderationResult;
      }

      // Create post
      const { data: post, error } = await supabase
        .from('community_posts')
        .insert({
          ...validatedData,
          author_id: context.userId,
          is_approved: moderationResult.data?.autoApprove ?? false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Community post creation failed', {
          action: 'createCommunityPost',
          error,
          context
        });
        return {
          success: false,
          error: 'Failed to create post'
        };
      }

      return {
        success: true,
        data: post,
        warnings: moderationResult.data?.autoApprove ? [] : ['Post is pending moderation']
      };

    } catch (error) {
      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  /**
   * Voice Agent Business Logic
   */
  async createVoiceSession(sessionData: unknown, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    try {
      const validatedData = validateDTO(CreateVoiceSessionSchema, sessionData);

      // Check voice session limits
      const limitResult = await this.checkVoiceSessionLimits(context.userId!, context);
      if (!limitResult.success) {
        return limitResult;
      }

      // Create session
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .insert({
          ...validatedData,
          user_id: context.userId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Voice session creation failed', {
          action: 'createVoiceSession',
          error,
          context
        });
        return {
          success: false,
          error: 'Failed to create voice session'
        };
      }

      return {
        success: true,
        data: session
      };

    } catch (error) {
      return {
        success: false,
        validationErrors: error instanceof Error ? [error.message] : ['Validation failed']
      };
    }
  }

  /**
   * Private validation methods
   */
  private async validateUserBusinessRules(
    userData: Partial<CreateUser>, 
    operation: 'create' | 'update',
    context: BusinessRuleContext
  ): Promise<BusinessRuleResult> {
    const businessErrors: string[] = [];
    const warnings: string[] = [];

    // Email validation
    if (userData.email && !ValidationHelper.isEmail(userData.email)) {
      businessErrors.push('Invalid email format');
    }

    // Password strength (for creation)
    if (operation === 'create' && userData.password && !ValidationHelper.isStrongPassword(userData.password)) {
      warnings.push('Password could be stronger (include uppercase, lowercase, numbers, and special characters)');
    }

    // Name validation
    if (userData.name && userData.name.length < 2) {
      businessErrors.push('Name must be at least 2 characters long');
    }

    // Role validation
    if (userData.role && userData.role !== 'user' && context.userRole !== 'super_admin') {
      businessErrors.push('Insufficient permissions to assign admin roles');
    }

    return {
      success: businessErrors.length === 0,
      businessErrors,
      warnings
    };
  }

  private async validateAssessmentBusinessRules(
    assessmentData: CreateAssessment,
    context: BusinessRuleContext
  ): Promise<BusinessRuleResult> {
    const businessErrors: string[] = [];

    // Title length check
    if (assessmentData.title.length > 200) {
      businessErrors.push('Assessment title cannot exceed 200 characters');
    }

    // Description length check
    if (assessmentData.description.length > 1000) {
      businessErrors.push('Assessment description cannot exceed 1000 characters');
    }

    // Time limit validation
    if (assessmentData.time_limit_minutes && assessmentData.time_limit_minutes < 1) {
      businessErrors.push('Time limit must be at least 1 minute');
    }

    // Passing score validation
    if (assessmentData.passing_score && (assessmentData.passing_score < 0 || assessmentData.passing_score > 100)) {
      businessErrors.push('Passing score must be between 0 and 100');
    }

    return {
      success: businessErrors.length === 0,
      businessErrors
    };
  }

  private async validateAssessmentSubmissionBusinessRules(
    submissionData: SubmitAssessment,
    context: BusinessRuleContext
  ): Promise<BusinessRuleResult> {
    const businessErrors: string[] = [];

    // Check if user has already submitted this assessment recently
    if (submissionData.user_id || context.userId) {
      const userId = submissionData.user_id || context.userId;
      const { data: recentSubmission } = await supabase
        .from('assessment_results')
        .select('id, created_at')
        .eq('assessment_id', submissionData.assessment_id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentSubmission) {
        const submissionTime = new Date(recentSubmission.created_at);
        const hoursSinceSubmission = (Date.now() - submissionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSubmission < 24) {
          businessErrors.push('You can only take this assessment once per day');
        }
      }
    }

    // Validate responses structure
    if (Object.keys(submissionData.responses).length === 0) {
      businessErrors.push('Assessment responses cannot be empty');
    }

    return {
      success: businessErrors.length === 0,
      businessErrors
    };
  }

  private async calculateAssessmentScore(assessment: any, responses: Record<string, any>): Promise<BusinessRuleResult> {
    try {
      // This is a simplified scoring algorithm
      // In a real implementation, you would have more sophisticated scoring based on question types
      
      const totalQuestions = assessment.questions?.length || Object.keys(responses).length;
      const totalScore = Object.values(responses).reduce((sum, response) => {
        if (typeof response === 'number') return sum + response;
        if (typeof response === 'boolean') return sum + (response ? 1 : 0);
        return sum + 1; // Default score for text responses
      }, 0) as number;

      const maxScore = totalQuestions * 4; // Assuming max 4 points per question
      const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100));

      // Generate insights based on score
      const insights = this.generateAssessmentInsights(percentage, assessment.type);
      const recommendations = this.generateRecommendations(percentage, assessment.type);
      const personalityType = this.determinePersonalityType(responses, assessment.type);

      return {
        success: true,
        data: {
          score: totalScore,
          maxScore,
          percentage,
          insights,
          recommendations,
          personalityType,
          aiFeedback: `Based on your responses, you scored ${percentage}% on this ${assessment.type} assessment.`
        }
      };

    } catch (error) {
      logger.error('Score calculation failed', {
        action: 'calculateAssessmentScore',
        error,
        metadata: { assessmentId: assessment.id }
      });

      return {
        success: false,
        error: 'Failed to calculate assessment score'
      };
    }
  }

  private generateAssessmentInsights(percentage: number, assessmentType: string): string[] {
    const insights: string[] = [];
    
    if (percentage >= 80) {
      insights.push(`Excellent performance in ${assessmentType} assessment`);
      insights.push('You demonstrate strong understanding and skills in this area');
    } else if (percentage >= 60) {
      insights.push(`Good performance in ${assessmentType} assessment`);
      insights.push('You have a solid foundation with room for growth');
    } else {
      insights.push(`Developing performance in ${assessmentType} assessment`);
      insights.push('Consider focusing on this area for improvement');
    }

    return insights;
  }

  private generateRecommendations(percentage: number, assessmentType: string): string[] {
    const recommendations: string[] = [];
    
    if (percentage < 60) {
      recommendations.push(`Consider taking additional ${assessmentType} focused activities`);
      recommendations.push('Practice regularly to improve your skills');
    } else if (percentage < 80) {
      recommendations.push(`Continue building your ${assessmentType} skills`);
      recommendations.push('You are on the right track - keep practicing');
    } else {
      recommendations.push(`Excellent work! Consider helping others in ${assessmentType}`);
      recommendations.push('You might enjoy more advanced challenges');
    }

    return recommendations;
  }

  private determinePersonalityType(responses: Record<string, any>, assessmentType: string): string {
    // Simplified personality type determination
    // In a real implementation, this would be much more sophisticated
    
    if (assessmentType === 'personality') {
      const responseValues = Object.values(responses);
      const avgResponse = responseValues.reduce((sum: number, val: any) => {
        return sum + (typeof val === 'number' ? val : 1);
      }, 0) / responseValues.length;

      if (avgResponse > 3) return 'Extroverted';
      if (avgResponse > 2) return 'Balanced';
      return 'Introverted';
    }

    return 'General';
  }

  private async checkPostRateLimit(userId: string, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    // Check how many posts the user has made in the last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('community_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .gte('created_at', hourAgo);

    if ((count || 0) >= 5) { // Max 5 posts per hour
      return {
        success: false,
        businessErrors: ['Rate limit exceeded. Please wait before posting again.']
      };
    }

    return { success: true };
  }

  private async moderateContent(content: string, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    // Simple content moderation - in reality, you'd use AI services
    const forbiddenWords = ['spam', 'abuse', 'hate'];
    const lowerContent = content.toLowerCase();
    
    const hasForbiddenContent = forbiddenWords.some(word => lowerContent.includes(word));
    
    return {
      success: true,
      data: {
        autoApprove: !hasForbiddenContent,
        requiresReview: hasForbiddenContent
      }
    };
  }

  private async checkVoiceSessionLimits(userId: string, context: BusinessRuleContext): Promise<BusinessRuleResult> {
    // Check active voice sessions for the user
    const { count } = await supabase
      .from('voice_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if ((count || 0) >= 3) { // Max 3 concurrent sessions
      return {
        success: false,
        businessErrors: ['Maximum concurrent voice sessions reached']
      };
    }

    return { success: true };
  }
}

// Export singleton instance
export const businessLogic = BusinessLogicService.getInstance();
export default businessLogic;
