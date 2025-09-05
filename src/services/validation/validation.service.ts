/**
 * Validation Service
 * Comprehensive input validation and sanitization
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData?: Record<string, any>;
}

class ValidationService {
  /**
   * Validate data against schema
   */
  public validate(
    data: Record<string, any>,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Sanitize value first
      sanitizedData[field] = this.sanitizeValue(value, field);

      // Apply validation rules
      for (const rule of rules) {
        const error = this.validateRule(sanitizedData[field], rule, field);
        if (error) {
          fieldErrors.push(error);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid,
      errors,
      sanitizedData: isValid ? sanitizedData : undefined,
    };
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    value: any,
    rule: ValidationRule,
    fieldName: string
  ): string | null {
    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          return rule.message || `${this.humanize(fieldName)} is required`;
        }
        break;

      case 'email':
        if (value && !validator.isEmail(value)) {
          return rule.message || `${this.humanize(fieldName)} must be a valid email`;
        }
        break;

      case 'url':
        if (value && !validator.isURL(value)) {
          return rule.message || `${this.humanize(fieldName)} must be a valid URL`;
        }
        break;

      case 'phone':
        if (value && !this.isValidPhone(value)) {
          return rule.message || `${this.humanize(fieldName)} must be a valid phone number`;
        }
        break;

      case 'min':
        if (value !== undefined && value !== null) {
          const length = typeof value === 'string' ? value.length : value;
          if (length < rule.value) {
            return rule.message || `${this.humanize(fieldName)} must be at least ${rule.value} characters`;
          }
        }
        break;

      case 'max':
        if (value !== undefined && value !== null) {
          const length = typeof value === 'string' ? value.length : value;
          if (length > rule.value) {
            return rule.message || `${this.humanize(fieldName)} must be no more than ${rule.value} characters`;
          }
        }
        break;

      case 'pattern':
        if (value && !new RegExp(rule.value).test(value)) {
          return rule.message || `${this.humanize(fieldName)} format is invalid`;
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message || `${this.humanize(fieldName)} is invalid`;
        }
        break;
    }

    return null;
  }

  /**
   * Sanitize value based on type
   */
  private sanitizeValue(value: any, fieldName: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Sanitize strings
    if (typeof value === 'string') {
      // Basic sanitization
      let sanitized = value.trim();

      // HTML sanitization for rich text fields
      if (this.isRichTextField(fieldName)) {
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a'],
          ALLOWED_ATTR: ['href', 'target'],
        });
      } else {
        // Remove all HTML for regular text fields
        sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
      }

      // SQL injection prevention (basic)
      sanitized = sanitized.replace(/['";\\]/g, '');

      return sanitized;
    }

    // Sanitize numbers
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return 0;
      }
      return value;
    }

    // Sanitize arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => this.sanitizeValue(item, `${fieldName}[${index}]`));
    }

    // Sanitize objects
    if (typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val, `${fieldName}.${key}`);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Check if field should allow rich text
   */
  private isRichTextField(fieldName: string): boolean {
    const richTextFields = ['description', 'content', 'bio', 'instructions', 'notes'];
    return richTextFields.some(field => fieldName.toLowerCase().includes(field));
  }

  /**
   * Validate phone number
   */
  private isValidPhone(phone: string): boolean {
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Check if it's a valid phone number (basic check)
    return /^\+?[1-9]\d{7,14}$/.test(cleaned);
  }

  /**
   * Convert field name to human-readable format
   */
  private humanize(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\./g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Common validation schemas
   */
  public schemas = {
    // User registration
    registration: {
      email: [
        { type: 'required' as const },
        { type: 'email' as const },
      ],
      password: [
        { type: 'required' as const },
        { type: 'min' as const, value: 8, message: 'Password must be at least 8 characters' },
        { 
          type: 'pattern' as const, 
          value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
          message: 'Password must contain uppercase, lowercase, and numbers' 
        },
      ],
      display_name: [
        { type: 'required' as const },
        { type: 'min' as const, value: 2 },
        { type: 'max' as const, value: 50 },
      ],
    },

    // Profile update
    profile: {
      display_name: [
        { type: 'min' as const, value: 2 },
        { type: 'max' as const, value: 50 },
      ],
      bio: [
        { type: 'max' as const, value: 500 },
      ],
      avatar_url: [
        { type: 'url' as const },
      ],
    },

    // Assessment creation
    assessment: {
      title: [
        { type: 'required' as const },
        { type: 'min' as const, value: 3 },
        { type: 'max' as const, value: 100 },
      ],
      description: [
        { type: 'required' as const },
        { type: 'min' as const, value: 10 },
        { type: 'max' as const, value: 1000 },
      ],
      category: [
        { type: 'required' as const },
      ],
    },

    // Community post
    post: {
      title: [
        { type: 'required' as const },
        { type: 'min' as const, value: 3 },
        { type: 'max' as const, value: 200 },
      ],
      content: [
        { type: 'required' as const },
        { type: 'min' as const, value: 10 },
        { type: 'max' as const, value: 5000 },
      ],
      category: [
        { type: 'required' as const },
      ],
    },

    // Voice configuration
    voiceConfig: {
      name: [
        { type: 'required' as const },
        { type: 'min' as const, value: 2 },
        { type: 'max' as const, value: 50 },
      ],
      model: [
        { type: 'required' as const },
      ],
      voice: [
        { type: 'required' as const },
      ],
      temperature: [
        { 
          type: 'custom' as const,
          validator: (value: number) => value >= 0 && value <= 1,
          message: 'Temperature must be between 0 and 1',
        },
      ],
    },
  };

  /**
   * Validate email
   */
  public isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  /**
   * Validate URL
   */
  public isValidUrl(url: string): boolean {
    return validator.isURL(url);
  }

  /**
   * Validate password strength
   */
  public getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score++;
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Include special characters');

    return {
      score: Math.min(score / 6, 1), // Normalize to 0-1
      feedback,
    };
  }

  /**
   * Sanitize HTML content
   */
  public sanitizeHtml(html: string, options?: any): string {
    return DOMPurify.sanitize(html, options) as string;
  }

  /**
   * Validate file upload
   */
  public validateFile(
    file: File,
    options: {
      maxSize?: number; // bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size must not exceed ${this.formatFileSize(options.maxSize)}`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${options.allowedTypes.join(', ')}`);
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !options.allowedExtensions.includes(extension)) {
        errors.push(`File extension must be one of: ${options.allowedExtensions.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? { file: errors } : {},
    };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Export types
export type { ValidationRule, ValidationSchema, ValidationResult };