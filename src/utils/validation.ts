// Validation and sanitization utilities
import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();

// Assessment validation schemas
export const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  type: z.enum(['personality', 'cognitive', 'communication', 'lifestyle', 'relationships', 'wellness', 'quiz']),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be 50 characters or less'),
  visibility: z.enum(['public', 'users', 'premium']),
  estimatedTime: z.number().min(1, 'Estimated time must be at least 1 minute').max(120, 'Estimated time must be 120 minutes or less'),
  questions: z.array(z.object({
    id: z.string().min(1, 'Question ID is required'),
    text: z.string().min(1, 'Question text is required').max(500, 'Question text must be 500 characters or less'),
    type: z.enum(['single', 'multiple', 'scale', 'text']),
    options: z.array(z.string()).optional(),
    category: z.string().optional(),
    scale: z.object({
      min: z.number(),
      max: z.number(),
      labels: z.array(z.string())
    }).optional()
  })).min(1, 'At least one question is required'),
  scoring: z.object({
    type: z.enum(['cumulative', 'categorical', 'personality']),
    categories: z.array(z.string()).optional(),
    interpretation: z.record(z.string()).optional()
  })
});

// Community post validation schemas
export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be 5000 characters or less'),
  authorId: z.string().uuid('Invalid author ID'),
  categoryIds: z.array(z.string().uuid()).min(1, 'At least one category is required'),
  isAnonymous: z.boolean().optional(),
  tags: z.array(z.string().max(30, 'Tag must be 30 characters or less')).max(10, 'Maximum 10 tags allowed').optional()
});

// Community comment validation schemas
export const commentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z.string().min(1, 'Comment is required').max(1000, 'Comment must be 1000 characters or less'),
  authorId: z.string().uuid('Invalid author ID'),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
  isAnonymous: z.boolean().optional()
});

// User profile validation
export const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional()
});

// Assessment result validation
export const assessmentResultSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  responses: z.record(z.any()),
  score: z.number().min(0, 'Score must be non-negative'),
  totalScore: z.number().min(0, 'Total score must be non-negative'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  personalityType: z.string().optional(),
  insights: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional()
});

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .slice(0, 5000); // Limit length
};

// Email sanitization
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// URL sanitization
export const sanitizeUrl = (url: string): string => {
  const sanitized = url.trim();
  if (sanitized && !sanitized.startsWith('http')) {
    return `https://${sanitized}`;
  }
  return sanitized;
};

// Phone number sanitization
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 15);
};

// Username sanitization
export const sanitizeUsername = (username: string): string => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
};

// Content sanitization for rich text
export const sanitizeRichText = (content: string): string => {
  if (typeof content !== 'string') return '';
  
  return content
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .slice(0, 10000); // Limit length
};

// XSS protection
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Input length validation
export const validateLength = (input: string | undefined | null, min: number, max: number): boolean => {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  return trimmed.length >= min && trimmed.length <= max;
};

// File upload validation
export const validateFile = (file: File, maxSizeMB: number, allowedTypes: string[]): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return false;
  }
  
  return allowedTypes.includes(file.type);
};

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character');

// Date validation
export const validateDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && parsed < new Date();
};

// Age validation
export const validateAge = (birthDate: string, minAge: number = 13): boolean => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  
  if (today.getMonth() < birth.getMonth() || 
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }
  
  return age >= minAge;
};

// Validate and sanitize form data
export const validateAndSanitize = (
  data: Record<string, unknown>,
  schema: z.ZodSchema<unknown>
): { success: boolean; data?: Record<string, unknown>; errors?: Record<string, string> } => {
  try {
    const validated = schema.parse(data) as Record<string, unknown>;

    // Sanitize string fields into a plain record
    const sanitized: Record<string, unknown> = {};
    Object.entries(validated).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value as string);
      } else {
        sanitized[key] = value;
      }
    });

    return { success: true, data: sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.toString()] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxAttempts: number;

  constructor(windowMs: number = 60000, maxAttempts: number = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  check(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Export validation utilities
export const validationUtils = {
  validateLength,
  validateFile,
  validateDate,
  validateAge,
  escapeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeUsername,
  sanitizeRichText,
  sanitizePhone
};
