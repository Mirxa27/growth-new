import validator from "validator";
import DOMPurify from "dompurify";

// Input validation utilities
export const validationUtils = {
  // Email validation
  validateEmail: (email: string): boolean => {
    return validator.isEmail(email);
  },

  // Text content sanitization
  sanitizeText: (text: string): string => {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  },

  // HTML sanitization for user content
  sanitizeHTML: (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  },

  // URL validation
  validateURL: (url: string): boolean => {
    return validator.isURL(url, { 
      protocols: ['http', 'https'], 
      require_protocol: true 
    });
  },

  // User input length validation
  validateLength: (text: string, min: number = 1, max: number = 1000): boolean => {
    return validator.isLength(text, { min, max });
  },

  // Alpha-numeric validation for usernames/nicknames
  validateAlphaNumeric: (text: string): boolean => {
    return validator.isAlphanumeric(text, 'en-US', { ignore: '_-' });
  },

  // JSON validation
  validateJSON: (jsonString: string): boolean => {
    return validator.isJSON(jsonString);
  },

  // UUID validation
  validateUUID: (uuid: string): boolean => {
    return validator.isUUID(uuid);
  },

  // Rate limiting key generation
  generateRateLimitKey: (ip: string, endpoint: string): string => {
    return `rate_limit:${endpoint}:${ip}`;
  },

  // Sanitize CSS properties for chart theming
  sanitizeCSSProperty: (property: string, value: string): string | null => {
    const allowedProperties = [
      'color', 'background-color', 'border-color', 'fill', 'stroke',
      'opacity', 'font-size', 'font-weight', 'font-family'
    ];
    
    if (!allowedProperties.includes(property)) {
      return null;
    }
    
    // Basic CSS value sanitization
    const sanitizedValue = value.replace(/[<>"']/g, '');
    
    // Check for valid CSS color formats (hex, rgb, hsl, named colors)
    if (property.includes('color') || property === 'fill' || property === 'stroke') {
      if (!/^(#[0-9a-fA-F]{3,6}|rgb\(.*\)|hsl\(.*\)|rgba\(.*\)|hsla\(.*\)|[a-zA-Z]+)$/.test(sanitizedValue)) {
        return null;
      }
    }
    
    return sanitizedValue;
  }
};

// Type-safe validation schemas
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export const validateUserInput = (data: {
  email?: string;
  displayName?: string;
  content?: string;
  url?: string;
}): ValidationResult => {
  const errors: string[] = [];
  const sanitizedData: any = {};

  if (data.email) {
    if (!validationUtils.validateEmail(data.email)) {
      errors.push("Invalid email format");
    } else {
      sanitizedData.email = data.email;
    }
  }

  if (data.displayName) {
    if (!validationUtils.validateLength(data.displayName, 1, 50)) {
      errors.push("Display name must be between 1 and 50 characters");
    } else {
      sanitizedData.displayName = validationUtils.sanitizeText(data.displayName);
    }
  }

  if (data.content) {
    if (!validationUtils.validateLength(data.content, 1, 10000)) {
      errors.push("Content must be between 1 and 10000 characters");
    } else {
      sanitizedData.content = validationUtils.sanitizeHTML(data.content);
    }
  }

  if (data.url) {
    if (!validationUtils.validateURL(data.url)) {
      errors.push("Invalid URL format");
    } else {
      sanitizedData.url = data.url;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
};