/**
 * Data Validation Utilities
 * Ensures all data flows work correctly with real Supabase data
 */

import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schemas for Supabase data
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const AssessmentSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  visibility: z.enum(['public', 'private']).default('public'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const QuestionSchema = z.object({
  id: z.number(),
  assessment_id: z.number(),
  question_text: z.string().min(1),
  question_type: z.enum(['multiple_choice', 'free_text']),
  position: z.number(),
  explanation: z.string().optional(),
});

export const OptionSchema = z.object({
  id: z.number(),
  question_id: z.number(),
  option_text: z.string().min(1),
  position: z.number(),
  is_correct: z.boolean().default(false),
  score_value: z.number().default(0),
});

export const UserResponseSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  assessment_id: z.number(),
  question_id: z.number(),
  response_value: z.string(),
  created_at: z.string().datetime(),
});

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  crystals: z.number().default(0),
  unlocked: z.boolean().default(false),
  unlocked_at: z.string().datetime().optional(),
});

// Data validation class
export class DataValidator {
  private static instance: DataValidator;
  
  static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  // Validate user profile data
  async validateUserProfile(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        errors.push(`Profile fetch error: ${error.message}`);
        return { valid: false, errors };
      }

      if (!data) {
        errors.push('Profile not found');
        return { valid: false, errors };
      }

      // Validate against schema
      const result = UserProfileSchema.safeParse(data);
      if (!result.success) {
        errors.push(...result.error.errors.map(e => `Profile validation: ${e.path.join('.')} - ${e.message}`));
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Profile validation error: ${error}`);
      return { valid: false, errors };
    }
  }

  // Validate assessment data
  async validateAssessment(assessmentId: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) {
        errors.push(`Assessment fetch error: ${assessmentError.message}`);
        return { valid: false, errors };
      }

      if (!assessment) {
        errors.push('Assessment not found');
        return { valid: false, errors };
      }

      const assessmentResult = AssessmentSchema.safeParse(assessment);
      if (!assessmentResult.success) {
        errors.push(...assessmentResult.error.errors.map(e => `Assessment validation: ${e.path.join('.')} - ${e.message}`));
      }

      // Validate questions
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select(`
          *,
          assessment_options (*)
        `)
        .eq('assessment_id', assessmentId)
        .order('position');

      if (questionsError) {
        errors.push(`Questions fetch error: ${questionsError.message}`);
      } else if (questions) {
        questions.forEach((question, index) => {
          const questionResult = QuestionSchema.safeParse(question);
          if (!questionResult.success) {
            errors.push(...questionResult.error.errors.map(e => `Question ${index + 1} validation: ${e.path.join('.')} - ${e.message}`));
          }

          // Validate options for multiple choice questions
          if (question.question_type === 'multiple_choice' && question.assessment_options) {
            question.assessment_options.forEach((option: any, optionIndex: number) => {
              const optionResult = OptionSchema.safeParse(option);
              if (!optionResult.success) {
                errors.push(...optionResult.error.errors.map(e => `Question ${index + 1}, Option ${optionIndex + 1} validation: ${e.path.join('.')} - ${e.message}`));
              }
            });
          }
        });
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Assessment validation error: ${error}`);
      return { valid: false, errors };
    }
  }

  // Validate user responses
  async validateUserResponses(userId: string, assessmentId: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const { data: responses, error } = await supabase
        .from('user_assessment_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_id', assessmentId);

      if (error) {
        errors.push(`Responses fetch error: ${error.message}`);
        return { valid: false, errors };
      }

      if (responses) {
        responses.forEach((response, index) => {
          const responseResult = UserResponseSchema.safeParse(response);
          if (!responseResult.success) {
            errors.push(...responseResult.error.errors.map(e => `Response ${index + 1} validation: ${e.path.join('.')} - ${e.message}`));
          }
        });
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Response validation error: ${error}`);
      return { valid: false, errors };
    }
  }

  // Validate gamification data
  async validateGamificationData(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Check user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') { // PGRST116 is "not found"
        errors.push(`Progress fetch error: ${progressError.message}`);
      }

      // Check achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (achievementsError) {
        errors.push(`Achievements fetch error: ${achievementsError.message}`);
      }

      // Check daily streak
      const { data: streaks, error: streaksError } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1);

      if (streaksError) {
        errors.push(`Streaks fetch error: ${streaksError.message}`);
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Gamification validation error: ${error}`);
      return { valid: false, errors };
    }
  }

  // Validate AI provider configuration
  async validateAIProviders(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const { data: providers, error } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        errors.push(`AI providers fetch error: ${error.message}`);
        return { valid: false, errors };
      }

      if (!providers || providers.length === 0) {
        errors.push('No active AI providers found');
        return { valid: false, errors };
      }

      // Check for OpenAI provider
      const openaiProvider = providers.find(p => p.provider_type === 'openai');
      if (!openaiProvider) {
        errors.push('No active OpenAI provider found');
      } else {
        if (!openaiProvider.configuration?.api_key) {
          errors.push('OpenAI provider missing API key');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`AI provider validation error: ${error}`);
      return { valid: false, errors };
    }
  }

  // Comprehensive data validation
  async validateAllDataFlows(userId: string, assessmentId?: number): Promise<{ 
    valid: boolean; 
    results: Record<string, { valid: boolean; errors: string[] }>;
    summary: string;
  }> {
    const results: Record<string, { valid: boolean; errors: string[] }> = {};

    // Validate user profile
    results.userProfile = await this.validateUserProfile(userId);

    // Validate assessment if provided
    if (assessmentId) {
      results.assessment = await this.validateAssessment(assessmentId);
      results.userResponses = await this.validateUserResponses(userId, assessmentId);
    }

    // Validate gamification data
    results.gamification = await this.validateGamificationData(userId);

    // Validate AI providers
    results.aiProviders = await this.validateAIProviders();

    // Calculate overall validity
    const allValid = Object.values(results).every(result => result.valid);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);

    const summary = allValid 
      ? 'All data flows are valid and working correctly'
      : `Found ${totalErrors} validation errors across data flows`;

    return {
      valid: allValid,
      results,
      summary
    };
  }
}

// Export singleton instance
export const dataValidator = DataValidator.getInstance();

// Helper function for quick validation
export const validateDataFlow = async (
  userId: string, 
  assessmentId?: number
): Promise<boolean> => {
  const result = await dataValidator.validateAllDataFlows(userId, assessmentId);
  
  if (!result.valid && process.env.NODE_ENV === 'development') {
    console.warn('Data validation failed:', result.summary);
    console.table(result.results);
  }
  
  return result.valid;
};

// Type guards for runtime type checking
export const isValidUser = (user: any): user is z.infer<typeof UserProfileSchema> => {
  return UserProfileSchema.safeParse(user).success;
};

export const isValidAssessment = (assessment: any): assessment is z.infer<typeof AssessmentSchema> => {
  return AssessmentSchema.safeParse(assessment).success;
};

export const isValidQuestion = (question: any): question is z.infer<typeof QuestionSchema> => {
  return QuestionSchema.safeParse(question).success;
};