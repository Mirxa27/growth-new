/**
 * Data Transfer Objects (DTOs) with Validation
 * Strict typing and validation for all API inputs/outputs
 */

import { z } from 'zod';

// Base schemas for common patterns
export const IdSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const DateSchema = z.string().datetime('Invalid datetime format');
export const NonEmptyStringSchema = z.string().min(1, 'Field is required').trim();
export const OptionalStringSchema = z.string().optional();

// User DTOs
export const CreateUserSchema = z.object({
  email: EmailSchema,
  name: NonEmptyStringSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin', 'super_admin']).default('user'),
  preferences: z.record(z.unknown()).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const UserProfileSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: NonEmptyStringSchema,
  role: z.enum(['user', 'admin', 'super_admin']),
  avatar_url: OptionalStringSchema,
  preferences: z.record(z.unknown()).default({}),
  created_at: DateSchema,
  updated_at: DateSchema,
  last_activity: DateSchema.optional(),
});

// Assessment DTOs
export const AssessmentOptionSchema = z.object({
  id: IdSchema,
  option_text: NonEmptyStringSchema,
  score_value: z.number().min(0).max(10),
  feedback: OptionalStringSchema,
  position: z.number().positive(),
});

export const AssessmentQuestionSchema = z.object({
  id: IdSchema,
  question_text: NonEmptyStringSchema,
  question_type: z.enum(['single_choice', 'multiple_choice', 'text', 'scale', 'boolean']),
  is_required: z.boolean().default(true),
  position: z.number().positive(),
  points: z.number().positive().default(1),
  metadata: z.record(z.unknown()).default({}),
  options: z.array(AssessmentOptionSchema).min(2, 'At least 2 options required for choice questions'),
});

export const CreateAssessmentSchema = z.object({
  title: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  category_id: IdSchema,
  type: z.enum(['personality', 'skills', 'knowledge', 'custom']),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  time_limit_minutes: z.number().positive().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  instructions: OptionalStringSchema,
  ai_analysis_prompt: OptionalStringSchema,
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const AssessmentSchema = CreateAssessmentSchema.extend({
  id: IdSchema,
  created_at: DateSchema,
  updated_at: DateSchema,
  created_by: IdSchema,
  questions: z.array(AssessmentQuestionSchema).default([]),
});

export const SubmitAssessmentSchema = z.object({
  assessment_id: IdSchema,
  user_id: IdSchema.optional(), // For anonymous submissions
  responses: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ])),
  time_taken_seconds: z.number().positive().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const AssessmentResultSchema = z.object({
  id: IdSchema,
  assessment_id: IdSchema,
  user_id: IdSchema.optional(),
  score: z.number().min(0),
  max_score: z.number().positive(),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
  personality_type: OptionalStringSchema,
  insights: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  ai_feedback: OptionalStringSchema,
  created_at: DateSchema,
});

// Voice Agent DTOs
export const VoiceAgentConfigSchema = z.object({
  id: IdSchema.optional(),
  name: NonEmptyStringSchema,
  provider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  voice: z.string().default('nova'),
  model: NonEmptyStringSchema,
  instructions: NonEmptyStringSchema,
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(1000),
  top_p: z.number().min(0).max(1).default(1.0),
  frequency_penalty: z.number().min(-2).max(2).default(0),
  presence_penalty: z.number().min(-2).max(2).default(0),
  is_active: z.boolean().default(true),
  enable_realtime: z.boolean().default(true),
  use_proxy: z.boolean().default(false),
  language: z.string().default('en'),
  arabic_support: z.boolean().default(false),
  emotion_detection: z.boolean().default(false),
});

export const CreateVoiceSessionSchema = z.object({
  config_id: IdSchema.optional(),
  user_id: IdSchema.optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const VoiceSessionSchema = z.object({
  id: IdSchema,
  user_id: IdSchema.optional(),
  config_id: IdSchema.optional(),
  status: z.enum(['pending', 'active', 'completed', 'failed']),
  started_at: DateSchema,
  ended_at: DateSchema.optional(),
  duration_seconds: z.number().nonnegative().optional(),
  conversation_data: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
});

// Community DTOs
export const CreateCommunityPostSchema = z.object({
  title: NonEmptyStringSchema,
  content: NonEmptyStringSchema,
  category_ids: z.array(IdSchema).min(1, 'At least one category required'),
  tags: z.array(z.string()).default([]),
  is_anonymous: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
});

export const CommunityPostSchema = CreateCommunityPostSchema.extend({
  id: IdSchema,
  author_id: IdSchema,
  created_at: DateSchema,
  updated_at: DateSchema,
  view_count: z.number().nonnegative().default(0),
  like_count: z.number().nonnegative().default(0),
  comment_count: z.number().nonnegative().default(0),
  is_featured: z.boolean().default(false),
  is_approved: z.boolean().default(false),
});

export const CreateCommentSchema = z.object({
  post_id: IdSchema,
  parent_comment_id: IdSchema.optional(),
  content: NonEmptyStringSchema,
  is_anonymous: z.boolean().default(false),
});

export const CommentSchema = CreateCommentSchema.extend({
  id: IdSchema,
  author_id: IdSchema,
  created_at: DateSchema,
  updated_at: DateSchema,
  like_count: z.number().nonnegative().default(0),
  is_approved: z.boolean().default(false),
});

// Analytics DTOs
export const AnalyticsQuerySchema = z.object({
  start_date: DateSchema.optional(),
  end_date: DateSchema.optional(),
  metrics: z.array(z.string()).optional(),
  group_by: z.enum(['day', 'week', 'month']).optional(),
  filters: z.record(z.unknown()).optional(),
});

export const AnalyticsDataSchema = z.object({
  users: z.object({
    total: z.number().nonnegative(),
    active: z.number().nonnegative(),
    new_this_week: z.number().nonnegative(),
    growth_rate: z.number(),
  }),
  assessments: z.object({
    total: z.number().nonnegative(),
    completed: z.number().nonnegative(),
    average_score: z.number().min(0).max(100),
    popular_categories: z.array(z.object({
      category: z.string(),
      count: z.number().nonnegative(),
    })),
  }),
  community: z.object({
    total_posts: z.number().nonnegative(),
    total_comments: z.number().nonnegative(),
    engagement_rate: z.number().min(0).max(100),
    active_users: z.number().nonnegative(),
  }),
  system: z.object({
    database_size: z.string(),
    api_calls_today: z.number().nonnegative(),
    error_rate: z.number().min(0).max(100),
    uptime: z.number().min(0).max(100),
  }),
});

// API Response DTOs
export const ApiErrorSchema = z.object({
  message: NonEmptyStringSchema,
  code: OptionalStringSchema,
  details: z.unknown().optional(),
  timestamp: DateSchema.optional(),
});

export const PaginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(10),
  offset: z.number().nonnegative().default(0),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().positive(),
      limit: z.number().positive(),
      total: z.number().nonnegative(),
      total_pages: z.number().nonnegative(),
      has_next: z.boolean(),
      has_previous: z.boolean(),
    }),
  });

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: ApiErrorSchema.nullable(),
    success: z.boolean(),
    timestamp: DateSchema,
  });

// Export type definitions
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type AssessmentOption = z.infer<typeof AssessmentOptionSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type SubmitAssessment = z.infer<typeof SubmitAssessmentSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

export type VoiceAgentConfig = z.infer<typeof VoiceAgentConfigSchema>;
export type CreateVoiceSession = z.infer<typeof CreateVoiceSessionSchema>;
export type VoiceSession = z.infer<typeof VoiceSessionSchema>;

export type CreateCommunityPost = z.infer<typeof CreateCommunityPostSchema>;
export type CommunityPost = z.infer<typeof CommunityPostSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type Comment = z.infer<typeof CommentSchema>;

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

// Validation utilities
export function validateDTO<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return result.data;
}

export function validatePartialDTO<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
  const result = schema.partial().safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return result.data as Partial<T>;
}

// Custom validation helpers
export const ValidationHelper = {
  isUUID: (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  
  isEmail: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  sanitizeString: (value: string): string => value.trim().replace(/\s+/g, ' '),
  
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  },
  
  normalizePhoneNumber: (phone: string): string => {
    return phone.replace(/\D/g, '');
  },
  
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

export default {
  CreateUserSchema,
  UpdateUserSchema,
  UserProfileSchema,
  AssessmentSchema,
  CreateAssessmentSchema,
  SubmitAssessmentSchema,
  AssessmentResultSchema,
  VoiceAgentConfigSchema,
  CreateVoiceSessionSchema,
  VoiceSessionSchema,
  CreateCommunityPostSchema,
  CommunityPostSchema,
  CreateCommentSchema,
  CommentSchema,
  AnalyticsQuerySchema,
  AnalyticsDataSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  validateDTO,
  validatePartialDTO,
  ValidationHelper,
};
