import { z } from 'zod';

// Base schemas for common data types
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const URLSchema = z.string().url();
export const DateTimeSchema = z.string().datetime();

// User related schemas
export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required").max(100),
  role: z.enum(['user', 'admin']).default('user'),
  is_active: z.boolean().default(true),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const UserResponseSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  full_name: z.string(),
  role: z.enum(['user', 'admin']),
  is_active: z.boolean(),
  avatar_url: z.string().url().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  last_sign_in: DateTimeSchema.nullable(),
});

// Assessment related schemas
export const AssessmentQuestionSchema = z.object({
  id: UUIDSchema.optional(),
  question_text: z.string().min(1, "Question text is required"),
  question_type: z.enum(['multiple_choice', 'single_choice', 'text', 'scale', 'boolean']),
  order_index: z.number().min(0),
  points: z.number().min(0).default(1),
  options: z.array(z.object({
    text: z.string().min(1),
    value: z.string().min(1),
    is_correct: z.boolean().default(false),
  })).optional(),
  correct_answer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  required: z.boolean().default(true),
});

export const CreateAssessmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['personality', 'skills', 'knowledge', 'wellness']),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration: z.number().min(1, "Duration must be positive").max(300),
  is_public: z.boolean().default(false),
  is_free: z.boolean().default(true),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  tags: z.array(z.string()).default([]),
  questions: z.array(AssessmentQuestionSchema).min(1, "At least one question is required"),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial().extend({
  id: UUIDSchema,
});

export const AssessmentResponseSchema = z.object({
  id: UUIDSchema,
  title: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  category: z.string(),
  difficulty: z.string(),
  estimated_duration: z.number(),
  is_public: z.boolean(),
  is_free: z.boolean(),
  price: z.number().nullable(),
  currency: z.string(),
  tags: z.array(z.string()),
  questions_count: z.number(),
  completions_count: z.number(),
  average_score: z.number().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  created_by: UUIDSchema,
});

// AI Content Builder schemas
export const AIContentSpecsSchema = z.object({
  target_audience: z.enum(['general', 'students', 'professionals', 'seniors', 'children']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  length: z.enum(['short', 'medium', 'long']),
  topic: z.string().min(1, "Topic is required").max(200),
  learning_objectives: z.array(z.string().min(1)).min(1, "At least one learning objective required"),
  question_count: z.number().min(1).max(50).optional(),
  assessment_type: z.enum(['multiple_choice', 'single_choice', 'mixed', 'likert_scale']).optional(),
  include_explanations: z.boolean().default(true),
  include_media: z.boolean().default(false),
  tone: z.enum(['professional', 'friendly', 'casual', 'academic', 'supportive']),
});

export const CreateAIBuildJobSchema = z.object({
  job_type: z.string().min(1),
  target_type: z.enum(['assessment', 'course', 'exploration']),
  ai_provider: z.enum(['openai', 'anthropic', 'google']),
  ai_model: z.string().min(1),
  prompt: z.string().min(1, "Prompt is required"),
  parameters: z.record(z.any()).default({}),
  content_specs: AIContentSpecsSchema,
});

export const AIBuildJobResponseSchema = z.object({
  id: UUIDSchema,
  job_type: z.string(),
  target_type: z.string(),
  ai_provider: z.string(),
  ai_model: z.string(),
  prompt: z.string(),
  parameters: z.record(z.any()),
  content_specs: AIContentSpecsSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100),
  generated_content: z.record(z.any()).nullable(),
  error_message: z.string().nullable(),
  published_content_id: UUIDSchema.nullable(),
  created_at: DateTimeSchema,
  completed_at: DateTimeSchema.nullable(),
  admin_id: UUIDSchema,
});

// Voice Agent Configuration schemas
export const VoiceAgentConfigSchema = z.object({
  id: UUIDSchema.optional(),
  name: z.string().min(1, "Name is required").max(100),
  ai_provider: z.enum(['openai']),
  ai_model: z.enum(['gpt-4o-realtime-preview', 'gpt-4o-mini-realtime-preview']),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
  instructions: z.string().min(1, "Instructions are required").max(2000),
  temperature: z.number().min(0).max(2).default(0.7),
  max_response_output_tokens: z.number().min(1).max(4096).default(1000),
  turn_detection_type: z.enum(['server_vad', 'none']).default('server_vad'),
  turn_detection_threshold: z.number().min(0).max(1).default(0.5),
  turn_detection_prefix_padding_ms: z.number().min(0).default(300),
  turn_detection_silence_duration_ms: z.number().min(0).default(500),
  input_audio_transcription: z.boolean().default(false),
  emotion_detection: z.boolean().default(false),
  conversation_memory: z.boolean().default(true),
  context_window_messages: z.number().min(1).max(50).default(10),
  arabic_support: z.boolean().default(false),
  is_active: z.boolean().default(false),
});

export const VoiceAgentConfigResponseSchema = VoiceAgentConfigSchema.extend({
  id: UUIDSchema,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  created_by: UUIDSchema,
});

// PayPal Configuration schemas
export const PayPalConfigSchema = z.object({
  client_id: z.string().min(1, "Client ID is required"),
  client_secret: z.string().min(1, "Client Secret is required"),
  mode: z.enum(['sandbox', 'live']),
  webhook_id: z.string().min(1, "Webhook ID is required"),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),
  business_name: z.string().min(1, "Business name is required"),
  return_url: URLSchema,
  cancel_url: URLSchema,
  is_active: z.boolean().default(false),
});

export const CreatePayPalPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(100),
  description: z.string().max(500),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),
  interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  interval_count: z.number().min(1).max(365),
});

export const PayPalPlanResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CREATED']),
  price: z.number(),
  currency: z.string(),
  interval: z.string(),
  interval_count: z.number(),
  product_id: z.string(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  created_by: UUIDSchema,
});

// Content Challenge schemas
export const CreateContentChallengeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
  challenge_type: z.enum(['completion', 'streak', 'community', 'exploration']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_days: z.number().min(1).max(365),
  points_reward: z.number().min(0).default(0),
  badge_reward: z.string().optional(),
  requirements: z.record(z.any()).default({}),
  content: z.record(z.any()).default({}),
  is_active: z.boolean().default(true),
  start_date: DateTimeSchema.optional(),
  end_date: DateTimeSchema.optional(),
});

export const ContentChallengeResponseSchema = CreateContentChallengeSchema.extend({
  id: UUIDSchema,
  participants_count: z.number(),
  completions_count: z.number(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  created_by: UUIDSchema,
});

// Community Post schemas
export const CreateCommunityPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  category: z.enum(['discussion', 'question', 'sharing', 'announcement']),
  tags: z.array(z.string()).default([]),
  is_pinned: z.boolean().default(false),
  is_locked: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
});

export const CommunityPostResponseSchema = CreateCommunityPostSchema.extend({
  id: UUIDSchema,
  author_id: UUIDSchema,
  author_name: z.string(),
  likes_count: z.number(),
  comments_count: z.number(),
  views_count: z.number(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

// Analytics schemas
export const AnalyticsMetricsSchema = z.object({
  total_users: z.number(),
  active_users_today: z.number(),
  active_users_week: z.number(),
  new_users_week: z.number(),
  total_assessments: z.number(),
  total_completions: z.number(),
  total_community_posts: z.number(),
  total_library_items: z.number(),
  average_session_duration: z.number(),
  bounce_rate: z.number(),
  user_retention_rate: z.number(),
  growth_percentage: z.number(),
});

export const AnalyticsTimeSeriesSchema = z.object({
  date: z.string(),
  users: z.number(),
  sessions: z.number(),
  completions: z.number(),
  revenue: z.number().optional(),
});

// API Response schemas
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string(),
  data: z.any().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const PaginatedResponseSchema = <T>(itemSchema: z.ZodType<T>) => z.object({
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
});

// Export types
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessment = z.infer<typeof UpdateAssessmentSchema>;
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;

export type AIContentSpecs = z.infer<typeof AIContentSpecsSchema>;
export type CreateAIBuildJob = z.infer<typeof CreateAIBuildJobSchema>;
export type AIBuildJobResponse = z.infer<typeof AIBuildJobResponseSchema>;

export type VoiceAgentConfig = z.infer<typeof VoiceAgentConfigSchema>;
export type VoiceAgentConfigResponse = z.infer<typeof VoiceAgentConfigResponseSchema>;

export type PayPalConfig = z.infer<typeof PayPalConfigSchema>;
export type CreatePayPalPlan = z.infer<typeof CreatePayPalPlanSchema>;
export type PayPalPlanResponse = z.infer<typeof PayPalPlanResponseSchema>;

export type CreateContentChallenge = z.infer<typeof CreateContentChallengeSchema>;
export type ContentChallengeResponse = z.infer<typeof ContentChallengeResponseSchema>;

export type CreateCommunityPost = z.infer<typeof CreateCommunityPostSchema>;
export type CommunityPostResponse = z.infer<typeof CommunityPostResponseSchema>;

export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;
export type AnalyticsTimeSeries = z.infer<typeof AnalyticsTimeSeriesSchema>;

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;