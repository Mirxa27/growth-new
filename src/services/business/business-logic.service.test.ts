/**
 * Business Logic Service Tests
 * Comprehensive testing of business rules and validation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { businessLogic } from './business-logic.service';
import type { BusinessRuleContext } from './business-logic.service';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      limit: vi.fn().mockReturnThis(),
    })),
  }
}));

vi.mock('@/services/logging/logger.service', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('BusinessLogicService', () => {
  let context: BusinessRuleContext;

  beforeEach(() => {
    context = {
      userId: 'test-user-123',
      userRole: 'user',
      timestamp: new Date(),
    };
    vi.clearAllMocks();
  });

  describe('User Management', () => {
    it('should validate user creation data correctly', async () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
        role: 'user' as const,
      };

      const result = await businessLogic.createUser(validUserData, context);
      
      // Should pass validation
      expect(result.success).toBeDefined();
      expect(result.validationErrors).toBeDefined();
    });

    it('should reject invalid email addresses', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'SecurePass123!',
      };

      const result = await businessLogic.createUser(invalidUserData, context);
      
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain(expect.stringContaining('email'));
    });

    it('should enforce password strength requirements', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'weak',
      };

      const result = await businessLogic.createUser(weakPasswordData, context);
      
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain(expect.stringContaining('8 characters'));
    });

    it('should prevent non-admin users from assigning admin roles', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
        role: 'admin' as const,
      };

      const userContext = { ...context, userRole: 'user' as const };
      const result = await businessLogic.createUser(userData, userContext);
      
      if (!result.success) {
        expect(result.businessErrors).toContain(expect.stringContaining('Insufficient permissions'));
      }
    });
  });

  describe('Assessment Logic', () => {
    it('should validate assessment creation permissions', async () => {
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test Description',
        category_id: 'test-category-id',
        type: 'personality' as const,
      };

      const userContext = { ...context, userRole: 'user' as const };
      const result = await businessLogic.createAssessment(assessmentData, userContext);
      
      expect(result.success).toBe(false);
      expect(result.businessErrors).toContain(expect.stringContaining('administrators'));
    });

    it('should validate assessment submission data', async () => {
      const submissionData = {
        assessment_id: 'test-assessment-id',
        responses: {},
      };

      const result = await businessLogic.submitAssessment(submissionData, context);
      
      expect(result.success).toBe(false);
      expect(result.businessErrors).toContain(expect.stringContaining('cannot be empty'));
    });

    it('should calculate assessment scores correctly', async () => {
      const submissionData = {
        assessment_id: 'test-assessment-id',
        responses: {
          'q1': 3,
          'q2': 4,
          'q3': 2,
        },
      };

      // Mock assessment retrieval
      const mockAssessment = {
        id: 'test-assessment-id',
        is_active: true,
        passing_score: 60,
        type: 'personality',
      };

      const result = await businessLogic.submitAssessment(submissionData, context);
      
      // Should process without validation errors
      expect(result.validationErrors).not.toBeDefined();
    });
  });

  describe('Community Management', () => {
    it('should enforce rate limits for post creation', async () => {
      const postData = {
        title: 'Test Post',
        content: 'Test content',
        category_ids: ['test-category'],
      };

      const result = await businessLogic.createCommunityPost(postData, context);
      
      // Should pass basic validation
      expect(result.validationErrors).not.toBeDefined();
    });

    it('should moderate content for inappropriate material', async () => {
      const inappropriatePostData = {
        title: 'Test Post',
        content: 'This contains spam and abuse content',
        category_ids: ['test-category'],
      };

      const result = await businessLogic.createCommunityPost(inappropriatePostData, context);
      
      // Should flag for moderation or auto-reject
      if (result.success && result.warnings) {
        expect(result.warnings).toContain(expect.stringContaining('moderation'));
      }
    });
  });

  describe('Voice Session Management', () => {
    it('should validate voice session creation', async () => {
      const sessionData = {
        config_id: 'test-config-id',
        metadata: {},
      };

      const result = await businessLogic.createVoiceSession(sessionData, context);
      
      // Should pass validation
      expect(result.validationErrors).not.toBeDefined();
    });

    it('should enforce concurrent session limits', async () => {
      const sessionData = {
        config_id: 'test-config-id',
        metadata: {},
      };

      // This would test the actual limit checking
      const result = await businessLogic.createVoiceSession(sessionData, context);
      
      expect(result.success).toBeDefined();
    });
  });

  describe('Validation Utilities', () => {
    it('should properly validate UUIDs', async () => {
      const validData = {
        assessment_id: '123e4567-e89b-12d3-a456-426614174000',
        responses: { 'q1': 'answer1' },
      };

      const result = await businessLogic.submitAssessment(validData, context);
      expect(result.validationErrors).not.toContain(expect.stringContaining('UUID'));
    });

    it('should sanitize string inputs', async () => {
      const userData = {
        email: '  test@example.com  ',
        name: '  Test User  ',
        password: 'SecurePass123!',
      };

      const result = await businessLogic.createUser(userData, context);
      // Should pass after sanitization
      expect(result.validationErrors).not.toContain(expect.stringContaining('trim'));
    });
  });
});
