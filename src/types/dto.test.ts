/**
 * DTO Validation Tests
 * Testing data transfer objects and validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  validateDTO,
  validatePartialDTO,
  ValidationHelper,
  CreateUserSchema,
  AssessmentSchema,
  SubmitAssessmentSchema,
  VoiceAgentConfigSchema,
  CreateCommunityPostSchema,
  AnalyticsDataSchema,
} from './dto';

describe('DTO Validation', () => {
  describe('User DTOs', () => {
    it('should validate correct user creation data', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePassword123!',
        role: 'user',
      };

      expect(() => validateDTO(CreateUserSchema, validUser)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'SecurePassword123!',
      };

      expect(() => validateDTO(CreateUserSchema, invalidUser)).toThrow(/email/);
    });

    it('should enforce minimum password length', () => {
      const weakPasswordUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'weak',
      };

      expect(() => validateDTO(CreateUserSchema, weakPasswordUser)).toThrow(/8 characters/);
    });

    it('should require name field', () => {
      const noNameUser = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      expect(() => validateDTO(CreateUserSchema, noNameUser)).toThrow(/Required/);
    });
  });

  describe('Assessment DTOs', () => {
    it('should validate correct assessment structure', () => {
      const validAssessment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Assessment',
        description: 'Valid description',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'personality',
        visibility: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        questions: [],
      };

      expect(() => validateDTO(AssessmentSchema, validAssessment)).not.toThrow();
    });

    it('should validate assessment submission data', () => {
      const validSubmission = {
        assessment_id: '123e4567-e89b-12d3-a456-426614174000',
        responses: {
          'q1': 'answer1',
          'q2': 3,
          'q3': true,
          'q4': ['option1', 'option2']
        },
      };

      expect(() => validateDTO(SubmitAssessmentSchema, validSubmission)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidSubmission = {
        assessment_id: 'invalid-uuid',
        responses: { 'q1': 'answer' },
      };

      expect(() => validateDTO(SubmitAssessmentSchema, invalidSubmission)).toThrow(/UUID/);
    });

    it('should allow empty responses for partial validation', () => {
      const partialSubmission = {
        assessment_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(() => validatePartialDTO(SubmitAssessmentSchema, partialSubmission)).not.toThrow();
    });
  });

  describe('Voice Agent DTOs', () => {
    it('should validate voice agent configuration', () => {
      const validConfig = {
        name: 'Test Voice Agent',
        provider: 'openai',
        voice: 'nova',
        model: 'gpt-4o-realtime-preview-2024-10-01',
        instructions: 'You are a helpful assistant.',
        temperature: 0.7,
      };

      expect(() => validateDTO(VoiceAgentConfigSchema, validConfig)).not.toThrow();
    });

    it('should enforce temperature range limits', () => {
      const invalidConfig = {
        name: 'Test Voice Agent',
        temperature: 3.0, // Invalid: max is 2.0
      };

      expect(() => validateDTO(VoiceAgentConfigSchema, invalidConfig)).toThrow();
    });

    it('should set default values correctly', () => {
      const minimalConfig = {
        name: 'Minimal Agent',
        model: 'gpt-4o-realtime-preview-2024-10-01',
        instructions: 'Basic instructions',
      };

      const result = validateDTO(VoiceAgentConfigSchema, minimalConfig);
      expect(result.provider).toBe('openai');
      expect(result.temperature).toBe(0.7);
      expect(result.is_active).toBe(true);
    });
  });

  describe('Community DTOs', () => {
    it('should validate community post creation', () => {
      const validPost = {
        title: 'Test Post',
        content: 'Valid post content',
        category_ids: ['123e4567-e89b-12d3-a456-426614174000'],
      };

      expect(() => validateDTO(CreateCommunityPostSchema, validPost)).not.toThrow();
    });

    it('should require at least one category', () => {
      const invalidPost = {
        title: 'Test Post',
        content: 'Valid post content',
        category_ids: [],
      };

      expect(() => validateDTO(CreateCommunityPostSchema, invalidPost)).toThrow(/category required/);
    });

    it('should set default values for optional fields', () => {
      const basicPost = {
        title: 'Test Post',
        content: 'Valid post content',
        category_ids: ['123e4567-e89b-12d3-a456-426614174000'],
      };

      const result = validateDTO(CreateCommunityPostSchema, basicPost);
      expect(result.is_anonymous).toBe(false);
      expect(result.allow_comments).toBe(true);
      expect(Array.isArray(result.tags)).toBe(true);
    });
  });

  describe('Analytics DTOs', () => {
    it('should validate analytics data structure', () => {
      const validAnalytics = {
        users: {
          total: 100,
          active: 50,
          new_this_week: 10,
          growth_rate: 5.2,
        },
        assessments: {
          total: 25,
          completed: 20,
          average_score: 75.5,
          popular_categories: [
            { category: 'personality', count: 15 },
            { category: 'skills', count: 10 }
          ],
        },
        community: {
          total_posts: 150,
          total_comments: 300,
          engagement_rate: 25.5,
          active_users: 45,
        },
        system: {
          database_size: '250MB',
          api_calls_today: 1500,
          error_rate: 0.5,
          uptime: 99.9,
        },
      };

      expect(() => validateDTO(AnalyticsDataSchema, validAnalytics)).not.toThrow();
    });

    it('should enforce non-negative constraints', () => {
      const invalidAnalytics = {
        users: {
          total: -10, // Invalid: negative number
          active: 50,
          new_this_week: 10,
          growth_rate: 5.2,
        },
        assessments: {
          total: 25,
          completed: 20,
          average_score: 75.5,
          popular_categories: [],
        },
        community: {
          total_posts: 150,
          total_comments: 300,
          engagement_rate: 25.5,
          active_users: 45,
        },
        system: {
          database_size: '250MB',
          api_calls_today: 1500,
          error_rate: 0.5,
          uptime: 99.9,
        },
      };

      expect(() => validateDTO(AnalyticsDataSchema, invalidAnalytics)).toThrow();
    });
  });

  describe('Validation Utilities', () => {
    it('should validate UUID format correctly', () => {
      expect(ValidationHelper.isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(ValidationHelper.isUUID('invalid-uuid')).toBe(false);
      expect(ValidationHelper.isUUID('')).toBe(false);
    });

    it('should validate email format correctly', () => {
      expect(ValidationHelper.isEmail('test@example.com')).toBe(true);
      expect(ValidationHelper.isEmail('invalid-email')).toBe(false);
      expect(ValidationHelper.isEmail('test@')).toBe(false);
      expect(ValidationHelper.isEmail('@example.com')).toBe(false);
    });

    it('should sanitize strings properly', () => {
      expect(ValidationHelper.sanitizeString('  test   string  ')).toBe('test string');
      expect(ValidationHelper.sanitizeString('multiple   spaces')).toBe('multiple spaces');
    });

    it('should validate strong passwords', () => {
      expect(ValidationHelper.isStrongPassword('SecurePass123!')).toBe(true);
      expect(ValidationHelper.isStrongPassword('weak')).toBe(false);
      expect(ValidationHelper.isStrongPassword('NoNumbers!')).toBe(false);
      expect(ValidationHelper.isStrongPassword('nonuppercase123!')).toBe(false);
    });

    it('should normalize phone numbers', () => {
      expect(ValidationHelper.normalizePhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
      expect(ValidationHelper.normalizePhoneNumber('555.123.4567')).toBe('5551234567');
    });

    it('should validate URLs correctly', () => {
      expect(ValidationHelper.isValidUrl('https://example.com')).toBe(true);
      expect(ValidationHelper.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidationHelper.isValidUrl('invalid-url')).toBe(false);
      expect(ValidationHelper.isValidUrl('ftp://example.com')).toBe(true);
    });
  });

  describe('UUID Validation Edge Cases', () => {
    it('should validate various UUID versions', () => {
      // Version 4 UUID (most common)
      expect(ValidationHelper.isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      // Version 1 UUID  
      expect(ValidationHelper.isUUID('123e4567-e89b-12d3-9456-426614174000')).toBe(true);
      // Invalid cases
      expect(ValidationHelper.isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
      expect(ValidationHelper.isUUID('not-a-uuid-at-all')).toBe(false);
    });
  });

  describe('Partial Validation', () => {
    it('should handle partial DTO validation', () => {
      const partialUser = {
        name: 'Updated Name',
      };

      expect(() => validatePartialDTO(CreateUserSchema, partialUser)).not.toThrow();
    });

    it('should validate partial data with existing validation rules', () => {
      const partialUserWithInvalidEmail = {
        email: 'invalid-email',
      };

      expect(() => validatePartialDTO(CreateUserSchema, partialUserWithInvalidEmail)).toThrow(/email/);
    });
  });
});
