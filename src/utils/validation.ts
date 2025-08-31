import DOMPurify from 'dompurify';

// --- Type Definitions ---

export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: string[];
}

export interface AssessmentValidationDTO {
  title: string;
  description?: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  questions: {
    question_text: string;
    question_type: 'multiple_choice' | 'free_text';
    options?: { option_text: string; is_correct?: boolean }[];
  }[];
}

export interface ExplorationValidationDTO {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prompts: {
    facilitator: string;
    higher_self: string;
  };
  questions: string[];
  rewards: {
    crystals: number;
  };
}

// --- Custom Error Classes ---

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// --- Core Validation Functions ---

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: { field: string; message: string }[] = [];
  const warnings: string[] = [];
  
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }
  if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }
  if (!/\d/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    warnings.push('Consider adding a special character for a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateAssessment = (data: AssessmentValidationDTO): ValidationResult => {
  const errors: { field: string; message: string }[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters long' });
  }
  if (!['quiz', 'personality', 'test'].includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid assessment type' });
  }
  if (!data.questions || data.questions.length === 0) {
    errors.push({ field: 'questions', message: 'Assessment must have at least one question' });
  } else {
    data.questions.forEach((q, index) => {
      if (!q.question_text || q.question_text.trim().length === 0) {
        errors.push({ field: `questions[${index}].question_text`, message: 'Question text cannot be empty' });
      }
      if (q.question_type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        errors.push({ field: `questions[${index}].options`, message: 'Multiple choice questions must have at least 2 options' });
      }
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
};

export const validateExploration = (data: ExplorationValidationDTO): ValidationResult => {
  const errors: { field: string; message: string }[] = [];

  if (!data.title || data.title.trim().length < 5) {
    errors.push({ field: 'title', message: 'Title must be at least 5 characters long' });
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
  }
  if (!data.prompts.facilitator) {
    errors.push({ field: 'prompts.facilitator', message: 'Facilitator prompt is required' });
  }
  if (data.rewards.crystals < 0) {
    errors.push({ field: 'rewards.crystals', message: 'Crystal reward cannot be negative' });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
};

// --- Sanitization ---

export const sanitizeInput = (input: string): string => {
  return input.trim();
};

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
};

// --- Rate Limiting (Simple In-Memory Example) ---

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const rateLimiter = {
  attempts: new Map<string, RateLimitRecord>(),
  
  isAllowed: (identifier: string, maxAttempts: number, windowMs: number): boolean => {
    const now = Date.now();
    const record = rateLimiter.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimiter.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count < maxAttempts) {
      record.count++;
      return true;
    }

    return false;
  },

  reset: (identifier: string): void => {
    rateLimiter.attempts.delete(identifier);
  }
};

// --- Logging ---

export const logError = (error: Error, context?: Record<string, any>): void => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, error.message, {
    name: error.name,
    stack: error.stack,
    ...context,
  });
  // In a real app, you'd send this to a logging service (e.g., Sentry, LogRocket)
};

// --- Utility Functions ---

/**
 * A simple debounce function.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * A simple throttle function.
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// --- Security ---

/**
 * Basic check for common XSS patterns in a string.
 * Note: This is not a substitute for proper output encoding and sanitization.
 */
export const hasXSS = (input: string): boolean => {
  const patterns = [
    /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
    /javascript:/gim,
    /onerror\s*=/gim,
    /onload\s*=/gim,
  ];
  return patterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes a DOM element by removing potentially dangerous attributes.
 */
export const sanitizeElement = (element: HTMLElement): void => {
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))];
  allElements.forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  });
};

// --- Password Strength ---

export const checkPasswordStrength = (password: string): ValidationResult => {
  const data = { password };
  const warnings: string[] = [];
  const errors: { field: string; message: string }[] = [];

  if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  } else if (data.password.length < 12) {
    warnings.push('Consider using a longer password for better security');
  }

  if (!/[A-Z]/.test(data.password)) {
    errors.push({ field: 'password', message: 'Password must contain an uppercase letter' });
  }
  if (!/[a-z]/.test(data.password)) {
    errors.push({ field: 'password', message: 'Password must contain a lowercase letter' });
  }
  if (!/\d/.test(data.password)) {
    errors.push({ field: 'password', message: 'Password must contain a number' });
  }
  if (!/[^A-Za-z0-9]/.test(data.password)) {
    warnings.push('Consider adding a special character for a stronger password');
  }

  return { isValid: errors.length === 0, errors, warnings };
};