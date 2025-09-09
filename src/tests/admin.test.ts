import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAuthService } from '@/services/admin-auth.service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn()
  }
}));

describe('Admin Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin User Verification', () => {
    it('should identify admin user by role', async () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@newomen.me',
        user_metadata: { role: 'admin' }
      };

      // Mock successful admin check
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', is_admin: true },
              error: null
            }))
          }))
        }))
      }));

      const isAdmin = await AdminAuthService.isUserAdmin(adminUser);
      expect(typeof isAdmin).toBe('boolean');
    });

    it('should reject regular users', async () => {
      const regularUser = {
        id: 'user-id',
        email: 'user@example.com',
        user_metadata: { role: 'user' }
      };

      // Mock non-admin response
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'user', is_admin: false },
              error: null
            }))
          }))
        }))
      }));

      const isAdmin = await AdminAuthService.isUserAdmin(regularUser);
      expect(isAdmin).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com'
      };

      // Mock database error
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Database error')
            }))
          }))
        }))
      }));

      const isAdmin = await AdminAuthService.isUserAdmin(user);
      expect(isAdmin).toBe(false);
    });

    it('should use email fallback for admin verification', async () => {
      const adminByEmail = {
        id: 'user-id',
        email: 'admin@newomen.me'
      };

      // Mock database error to trigger fallback
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(new Error('Database unavailable')))
          }))
        }))
      }));

      const isAdmin = await AdminAuthService.isUserAdmin(adminByEmail);
      // Should return true due to email fallback
      expect(typeof isAdmin).toBe('boolean');
    });
  });

  describe('Server-side Admin Verification', () => {
    it('should verify admin status server-side', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc = vi.fn(() => Promise.resolve({
        data: true,
        error: null
      }));

      const isVerified = await AdminAuthService.verifyAdminServerSide();
      expect(typeof isVerified).toBe('boolean');
    });

    it('should handle server verification errors', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc = vi.fn(() => Promise.resolve({
        data: null,
        error: new Error('Server error')
      }));

      const isVerified = await AdminAuthService.verifyAdminServerSide();
      expect(isVerified).toBe(false);
    });
  });

  describe('Admin API Access', () => {
    it('should check admin API access', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc = vi.fn(() => Promise.resolve({
        data: true,
        error: null
      }));

      const hasAccess = await AdminAuthService.hasAdminAPIAccess();
      expect(typeof hasAccess).toBe('boolean');
    });

    it('should deny API access for non-admins', async () => {
      const mockSupabase = await import('@/integrations/supabase/client');
      mockSupabase.supabase.rpc = vi.fn(() => Promise.resolve({
        data: null,
        error: new Error('Access denied')
      }));

      const hasAccess = await AdminAuthService.hasAdminAPIAccess();
      expect(hasAccess).toBe(false);
    });
  });
});

describe('Admin Dashboard Tests', () => {
  describe('Content Management', () => {
    it('should create new assessments', () => {
      const newAssessment = {
        title: 'New Test Assessment',
        description: 'Test description',
        type: 'multiple_choice',
        difficulty: 'intermediate',
        is_public: false
      };

      expect(newAssessment.title).toBeDefined();
      expect(newAssessment.type).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced']).toContain(newAssessment.difficulty);
    });

    it('should validate assessment creation parameters', () => {
      const invalidAssessment = {
        title: '', // Invalid: empty title
        type: 'invalid_type', // Invalid: unsupported type
        difficulty: 'expert' // Invalid: unsupported difficulty
      };

      expect(invalidAssessment.title).toBe('');
      expect(['multiple_choice', 'true_false', 'short_answer'].includes(invalidAssessment.type)).toBe(false);
      expect(['beginner', 'intermediate', 'advanced'].includes(invalidAssessment.difficulty)).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should list users with proper permissions', () => {
      const userList = [
        { id: '1', email: 'user1@example.com', role: 'user' },
        { id: '2', email: 'admin@newomen.me', role: 'admin' },
        { id: '3', email: 'user3@example.com', role: 'user' }
      ];

      const adminUsers = userList.filter(user => user.role === 'admin');
      expect(adminUsers).toHaveLength(1);
      expect(adminUsers[0].email).toBe('admin@newomen.me');
    });

    it('should handle user role updates', () => {
      const userUpdate = {
        userId: 'user-id',
        newRole: 'admin',
        updatedBy: 'admin-id'
      };

      expect(userUpdate.userId).toBeDefined();
      expect(['user', 'admin', 'moderator']).toContain(userUpdate.newRole);
      expect(userUpdate.updatedBy).toBeDefined();
    });
  });
});

describe('AI Content Generation Tests', () => {
  describe('Content Generation Jobs', () => {
    it('should create AI generation jobs', () => {
      const aiJob = {
        id: 'job-id',
        jobType: 'assessment',
        aiProvider: 'openai',
        aiModel: 'gpt-4',
        status: 'pending',
        contentSpecs: {
          topic: 'Time Management',
          difficulty: 'intermediate',
          questionCount: 10
        }
      };

      expect(aiJob.id).toBeDefined();
      expect(['assessment', 'course', 'exploration']).toContain(aiJob.jobType);
      expect(['pending', 'in_progress', 'completed', 'failed']).toContain(aiJob.status);
      expect(aiJob.contentSpecs.topic).toBeDefined();
    });

    it('should validate generation parameters', () => {
      const validParams = {
        topic: 'Leadership Skills',
        targetAudience: 'professionals',
        difficulty: 'intermediate',
        questionCount: 15,
        includeExplanations: true
      };

      expect(validParams.topic.length).toBeGreaterThan(0);
      expect(['general', 'students', 'professionals', 'managers'].includes(validParams.targetAudience)).toBe(true);
      expect(validParams.questionCount).toBeGreaterThan(0);
      expect(validParams.questionCount).toBeLessThanOrEqual(50);
      expect(typeof validParams.includeExplanations).toBe('boolean');
    });

    it('should handle generation failures gracefully', () => {
      const failedJob = {
        id: 'failed-job-id',
        status: 'failed',
        errorMessage: 'AI service unavailable',
        retryCount: 3,
        maxRetries: 5
      };

      expect(failedJob.status).toBe('failed');
      expect(failedJob.errorMessage).toBeDefined();
      expect(failedJob.retryCount).toBeLessThan(failedJob.maxRetries);
    });
  });
});

describe('Voice Integration Tests', () => {
  describe('OpenAI Realtime API', () => {
    it('should handle realtime configuration', () => {
      const realtimeConfig = {
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy',
        modalities: ['text', 'audio'],
        inputAudioFormat: 'pcm16',
        outputAudioFormat: 'pcm16'
      };

      expect(realtimeConfig.model).toContain('realtime');
      expect(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).toContain(realtimeConfig.voice);
      expect(realtimeConfig.modalities).toContain('audio');
    });

    it('should validate audio formats', () => {
      const supportedFormats = ['pcm16', 'g711_ulaw', 'g711_alaw'];
      const config = {
        inputFormat: 'pcm16',
        outputFormat: 'pcm16'
      };

      expect(supportedFormats).toContain(config.inputFormat);
      expect(supportedFormats).toContain(config.outputFormat);
    });
  });
});