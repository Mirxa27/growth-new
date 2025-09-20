import { z } from 'zod';

/**
 * Base validation schemas and DTOs for the application
 */

// Common field validations
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
export const urlSchema = z.string().url('Invalid URL format');
export const uuidSchema = z.string().uuid('Invalid UUID format');

// User DTOs
export const CreateUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().datetime().optional(),
  phone: phoneSchema.optional(),
  avatar: urlSchema.optional(),
  preferences: z.object({
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark', 'auto']).default('auto')
  }).optional()
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  dateOfBirth: z.string().datetime().optional(),
  phone: phoneSchema.optional(),
  avatar: urlSchema.optional(),
  preferences: z.object({
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional()
  }).optional()
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false)
});

export const ResetPasswordSchema = z.object({
  email: emailSchema
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Assessment DTOs
export const CreateAssessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['personality', 'career', 'mental-health', 'relationships', 'skills', 'wellness']),
  category: z.string().min(1, 'Category is required'),
  visibility: z.enum(['public', 'users', 'premium']).default('public'),
  estimatedTime: z.number().min(1, 'Estimated time must be at least 1 minute'),
  questions: z.array(z.object({
    text: z.string().min(5, 'Question text must be at least 5 characters'),
    type: z.enum(['single', 'multiple', 'scale', 'text']),
    options: z.array(z.string()).optional(),
    scale: z.object({
      min: z.number(),
      max: z.number(),
      labels: z.array(z.string()).optional()
    }).optional(),
    required: z.boolean().default(true),
    category: z.string().optional()
  })).min(1, 'At least one question is required'),
  scoring: z.object({
    type: z.enum(['cumulative', 'categorical', 'personality']),
    categories: z.array(z.string()).optional(),
    interpretation: z.record(z.any()).optional()
  }).optional()
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial();

export const AssessmentResponseSchema = z.object({
  assessmentId: uuidSchema,
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.number(), z.array(z.string())]),
    timestamp: z.string().datetime()
  })),
  completedAt: z.string().datetime().optional()
});

// Voice Agent DTOs
export const VoiceAgentConfigSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.string().default('openai'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
  model: z.string().min(3, 'Model name is required'),
  temperature: z.number().min(0).max(1, 'Temperature must be between 0 and 1'),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
  enableRealtime: z.boolean().default(true),
  useProxy: z.boolean().default(true),
  proxyUrl: urlSchema.optional(),
  inputAudioTranscriptionModel: z.string().default('whisper-1'),
  inputAudioFormat: z.string().default('pcm16'),
  outputAudioFormat: z.string().default('pcm16'),
  turnDetectionType: z.enum(['server_vad', 'none']).default('server_vad'),
  turnDetectionThreshold: z.number().min(0).max(1).default(0.5),
  turnDetectionPrefixPaddingMs: z.number().min(0).max(2000).default(300),
  turnDetectionSilenceDurationMs: z.number().min(100).max(3000).default(1000),
  language: z.string().default('en'),
  arabicSupport: z.boolean().default(true),
  emotionDetection: z.boolean().default(true)
});

// AI Content Builder DTOs
export const AIContentSpecsSchema = z.object({
  targetAudience: z.enum(['general', 'students', 'professionals', 'managers', 'entrepreneurs']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  length: z.enum(['short', 'medium', 'long']),
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  learningObjectives: z.array(z.string().min(5, 'Learning objective must be at least 5 characters')),
  questionCount: z.number().min(5).max(50).optional(),
  assessmentType: z.enum(['multiple_choice', 'true_false', 'short_answer', 'timed_quiz']).optional(),
  includeExplanations: z.boolean().default(true),
  includeMedia: z.boolean().default(false),
  tone: z.enum(['professional', 'casual', 'academic', 'friendly', 'motivational'])
});

export const AIGenerationJobSchema = z.object({
  jobType: z.enum(['assessment', 'course', 'exploration']),
  targetType: z.string(),
  aiProvider: z.string(),
  aiModel: z.string(),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  parameters: z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().min(100).max(4000)
  }),
  contentSpecs: AIContentSpecsSchema
});

// PayPal DTOs
export const PayPalConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  mode: z.enum(['sandbox', 'live']),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  webhookId: z.string().optional(),
  returnUrl: urlSchema.optional(),
  cancelUrl: urlSchema.optional(),
  isActive: z.boolean().default(false)
});

// Community DTOs
export const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true)
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const CreateCommentSchema = z.object({
  postId: uuidSchema,
  content: z.string().min(1, 'Comment cannot be empty'),
  parentId: uuidSchema.optional()
});

// Library DTOs
export const CreateLibraryItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['article', 'video', 'audio', 'document', 'course']),
  category: z.string().min(1, 'Category is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'users', 'premium']).default('public'),
  metadata: z.record(z.any()).optional()
});

export const UpdateLibraryItemSchema = CreateLibraryItemSchema.partial();

// Analytics DTOs
export const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum(['users', 'assessments', 'completions', 'revenue', 'engagement'])),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  filters: z.record(z.any()).optional()
});

// Settings DTOs
export const PlatformSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().optional(),
  enableSignups: z.boolean().default(true),
  welcomeCrystals: z.number().min(0).default(100),
  maxFileSize: z.number().min(1024).default(10485760), // 10MB
  allowedFileTypes: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  analyticsEnabled: z.boolean().default(true),
  privacyPolicy: urlSchema.optional(),
  termsOfService: urlSchema.optional()
});

// Export types
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessment = z.infer<typeof UpdateAssessmentSchema>;
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;
export type VoiceAgentConfig = z.infer<typeof VoiceAgentConfigSchema>;
export type AIContentSpecs = z.infer<typeof AIContentSpecsSchema>;
export type AIGenerationJob = z.infer<typeof AIGenerationJobSchema>;
export type PayPalConfig = z.infer<typeof PayPalConfigSchema>;
export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type CreateLibraryItem = z.infer<typeof CreateLibraryItemSchema>;
export type UpdateLibraryItem = z.infer<typeof UpdateLibraryItemSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type PlatformSettings = z.infer<typeof PlatformSettingsSchema>;

/**
 * Validation helper functions
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const validatePartialData = <T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> => {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

/**
 * Common validation patterns
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape
});

export type Pagination = z.infer<typeof paginationSchema>;
export type Search = z.infer<typeof searchSchema>;