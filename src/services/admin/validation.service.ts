import { z } from 'zod';
import { logger } from '@/utils/logger';

// Common validation schemas
export const adminValidationSchemas = {
  // Assessment validation
  assessment: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters')
      .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, 'Title contains invalid characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must be less than 500 characters'),
    type: z.enum(['personality', 'career', 'mental-health', 'relationships', 'skills', 'wellness']),
    visibility: z.enum(['public', 'users', 'premium']),
    estimatedTime: z.number()
      .min(1, 'Estimated time must be at least 1 minute')
      .max(180, 'Estimated time must be less than 180 minutes'),
    questions: z.array(z.object({
      id: z.string(),
      text: z.string().min(5, 'Question text must be at least 5 characters'),
      type: z.enum(['single', 'multiple', 'scale', 'text']),
      options: z.array(z.string()).optional(),
      required: z.boolean(),
    })).min(1, 'At least one question is required'),
  }),

  // Exploration validation
  exploration: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must be less than 500 characters'),
    prompts: z.array(z.string().min(5, 'Each prompt must be at least 5 characters'))
      .min(1, 'At least one prompt is required')
      .max(20, 'Maximum 20 prompts allowed'),
    difficulty_level: z.enum(['easy', 'medium', 'hard']),
    category: z.string().min(1, 'Category is required'),
    crystal_reward: z.number()
      .min(0, 'Crystal reward must be non-negative')
      .max(1000, 'Crystal reward must be less than 1000'),
    estimated_duration: z.number()
      .min(5, 'Duration must be at least 5 minutes')
      .max(180, 'Duration must be less than 180 minutes'),
  }),

  // Challenge validation
  challenge: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must be less than 500 characters'),
    challenge_type: z.enum(['completion', 'streak', 'community']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    reward: z.number()
      .min(0, 'Reward must be non-negative')
      .max(1000, 'Reward must be less than 1000'),
  }),

  // Voice Agent validation
  voiceAgent: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    provider: z.string().min(1, 'Provider is required'),
    voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
    model: z.string().min(1, 'Model is required'),
    temperature: z.number()
      .min(0, 'Temperature must be between 0 and 1')
      .max(1, 'Temperature must be between 0 and 1'),
    instructions: z.string()
      .max(2000, 'Instructions must be less than 2000 characters')
      .optional(),
  }),

  // PayPal configuration validation
  paypalConfig: z.object({
    clientId: z.string()
      .min(10, 'Client ID must be at least 10 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Client ID contains invalid characters'),
    clientSecret: z.string()
      .min(10, 'Client secret must be at least 10 characters')
      .optional(),
    mode: z.enum(['sandbox', 'live']),
    currency: z.string()
      .length(3, 'Currency must be 3 characters')
      .regex(/^[A-Z]+$/, 'Currency must be uppercase letters'),
    brandName: z.string()
      .min(1, 'Brand name is required')
      .max(50, 'Brand name must be less than 50 characters'),
    returnUrl: z.string().url('Return URL must be a valid URL'),
    cancelUrl: z.string().url('Cancel URL must be a valid URL'),
  }),

  // User management validation
  userUpdate: z.object({
    email: z.string().email('Invalid email address').optional(),
    full_name: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be less than 100 characters')
      .optional(),
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    is_active: z.boolean().optional(),
  }),
};

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Validation service class
export class AdminValidationService {
  /**
   * Validate data against a schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation failed', 'AdminValidationService', { errors });

        return {
          success: false,
          errors,
        };
      }

      logger.error('Unexpected validation error', 'AdminValidationService', error);
      return {
        success: false,
        errors: [{ field: 'general', message: 'An unexpected validation error occurred' }],
      };
    }
  }

  /**
   * Validate assessment data
   */
  static validateAssessment(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.assessment>> {
    return this.validate(adminValidationSchemas.assessment, data);
  }

  /**
   * Validate exploration data
   */
  static validateExploration(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.exploration>> {
    return this.validate(adminValidationSchemas.exploration, data);
  }

  /**
   * Validate challenge data
   */
  static validateChallenge(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.challenge>> {
    return this.validate(adminValidationSchemas.challenge, data);
  }

  /**
   * Validate voice agent configuration
   */
  static validateVoiceAgent(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.voiceAgent>> {
    return this.validate(adminValidationSchemas.voiceAgent, data);
  }

  /**
   * Validate PayPal configuration
   */
  static validatePayPalConfig(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.paypalConfig>> {
    return this.validate(adminValidationSchemas.paypalConfig, data);
  }

  /**
   * Validate user update data
   */
  static validateUserUpdate(data: unknown): ValidationResult<z.infer<typeof adminValidationSchemas.userUpdate>> {
    return this.validate(adminValidationSchemas.userUpdate, data);
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}): ValidationResult<File> {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    const errors: ValidationError[] = [];

    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: 'FILE_TOO_LARGE',
      });
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `File type ${file.type} is not allowed`,
        code: 'INVALID_FILE_TYPE',
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: file };
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string, provider: 'openai' | 'anthropic' | 'google'): ValidationResult<string> {
    const patterns = {
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-_]{95}$/,
      google: /^[a-zA-Z0-9_-]{39}$/,
    };

    const pattern = patterns[provider];
    if (!pattern.test(apiKey)) {
      return {
        success: false,
        errors: [{
          field: 'apiKey',
          message: `Invalid ${provider} API key format`,
          code: 'INVALID_API_KEY',
        }],
      };
    }

    return { success: true, data: apiKey };
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(identifier: string, limit: number, window: number): boolean {
    // This would integrate with a rate limiting service in production
    // For now, return true (no rate limiting)
    logger.info('Rate limit check', 'AdminValidationService', { identifier, limit, window });
    return true;
  }

  /**
   * Validate permissions for admin actions
   */
  static validateAdminPermission(userRole: string, action: string): ValidationResult<boolean> {
    const permissions: Record<string, string[]> = {
      admin: ['*'],
      moderator: ['read', 'update_content', 'manage_users'],
      user: ['read'],
    };

    const userPermissions = permissions[userRole] || [];
    const hasPermission = userPermissions.includes('*') || userPermissions.includes(action);

    if (!hasPermission) {
      return {
        success: false,
        errors: [{
          field: 'permission',
          message: `Insufficient permissions for action: ${action}`,
          code: 'INSUFFICIENT_PERMISSIONS',
        }],
      };
    }

    return { success: true, data: true };
  }
}

// Export validation utilities
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED',
    };
  }
  return null;
};

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_EMAIL',
    };
  }
  return null;
};

export const validateUrl = (url: string, fieldName: string): ValidationError | null => {
  try {
    new URL(url);
    return null;
  } catch {
    return {
      field: fieldName,
      message: 'Invalid URL format',
      code: 'INVALID_URL',
    };
  }
};

export const validateLength = (
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): ValidationError | null => {
  if (min && value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters`,
      code: 'TOO_SHORT',
    };
  }
  if (max && value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be less than ${max} characters`,
      code: 'TOO_LONG',
    };
  }
  return null;
};

export default AdminValidationService;