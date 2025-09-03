import { z } from 'zod';

/**
 * User and Authentication Schemas
 */
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
  preferences: z.record(z.any()).optional(),
});

/**
 * Assessment Schemas
 */
export const CreateAssessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  type: z.enum(['quiz', 'survey', 'evaluation', 'personality']),
  category: z.string().min(2).max(50),
  questions: z.array(z.object({
    id: z.string().uuid(),
    text: z.string().min(5, 'Question must be at least 5 characters'),
    type: z.enum(['multiple_choice', 'rating', 'text', 'boolean']),
    options: z.array(z.object({
      id: z.string().uuid(),
      text: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean()]),
      score: z.number().optional(),
    })).optional(),
    required: z.boolean().default(true),
    order: z.number().int().min(0),
  })).min(1, 'Assessment must have at least one question'),
  is_public: z.boolean().default(false),
  time_limit: z.number().int().positive().optional(),
  passing_score: z.number().min(0).max(100).optional(),
});

export const AssessmentResponseSchema = z.object({
  assessment_id: z.string().uuid(),
  answers: z.record(z.string(), z.any()),
  time_taken: z.number().int().positive().optional(),
  completed_at: z.string().datetime().optional(),
});

/**
 * Community Schemas
 */
export const CreatePostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000),
  tags: z.array(z.string().min(2).max(30)).max(5).optional(),
  is_anonymous: z.boolean().default(false),
});

export const CreateCommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parent_id: z.string().uuid().optional(),
});

export const ReactionSchema = z.object({
  target_id: z.string().uuid(),
  target_type: z.enum(['post', 'comment']),
  reaction_type: z.enum(['like', 'love', 'insightful', 'support']),
});

/**
 * Library Item Schemas
 */
export const CreateLibraryItemSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['article', 'video', 'exercise', 'guide', 'resource']),
  category: z.string().min(2).max(50),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  tags: z.array(z.string()).max(10).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_duration: z.number().int().positive().optional(),
  is_public: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

/**
 * Voice Agent Schemas
 */
export const VoiceConfigSchema = z.object({
  provider: z.enum(['openai', 'elevenlabs', 'azure']),
  model: z.string().min(1),
  voice: z.string().min(1),
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code'),
  instructions: z.string().min(10).max(5000),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});

export const VoiceSessionSchema = z.object({
  config_id: z.string().uuid(),
  metadata: z.object({
    browser: z.string().optional(),
    device: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

/**
 * Admin Schemas
 */
export const UpdateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['user', 'moderator', 'admin']),
  reason: z.string().min(10, 'Please provide a reason').optional(),
});

export const SystemSettingsSchema = z.object({
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().max(500).optional(),
  allow_registrations: z.boolean(),
  require_email_verification: z.boolean(),
  session_timeout: z.number().int().min(300).max(86400), // 5 minutes to 24 hours
  max_upload_size: z.number().int().positive(),
  allowed_file_types: z.array(z.string()),
  rate_limits: z.object({
    requests_per_minute: z.number().int().positive(),
    requests_per_hour: z.number().int().positive(),
  }),
});

/**
 * Exploration Schemas
 */
export const ExplorationSessionSchema = z.object({
  exploration_id: z.string().uuid(),
  responses: z.array(z.object({
    prompt_id: z.string(),
    response: z.string().min(1),
    timestamp: z.string().datetime(),
  })),
  reflections: z.string().max(5000).optional(),
  mood_before: z.number().int().min(1).max(10).optional(),
  mood_after: z.number().int().min(1).max(10).optional(),
});

/**
 * Utility validation functions
 */
export const validateEmail = (email: string) => {
  return z.string().email().safeParse(email);
};

export const validateUUID = (uuid: string) => {
  return z.string().uuid().safeParse(uuid);
};

export const validateURL = (url: string) => {
  return z.string().url().safeParse(url);
};

/**
 * Error handling helper
 */
export const formatValidationErrors = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Generic validation wrapper
 */
export function validateDTO<T>(schema: z.ZodSchema<T>, data: unknown): { success: true, data: T } | { success: false, errors: ReturnType<typeof formatValidationErrors> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: formatValidationErrors(result.error) };
}