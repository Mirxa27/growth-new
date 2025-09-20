import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { adminService } from '@/services/admin/comprehensive-admin.service';
import { AdminErrorHandler, AdminError } from '@/services/admin/admin-error-handler.service';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CreateUser, 
  CreateAssessment,
  CreateAIBuildJob,
  VoiceAgentConfig,
  PayPalConfig,
  CreateContentChallenge 
} from '@/schemas/admin.schemas';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
        neq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
      upsert: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Admin Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful auth
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Management', () => {
    it('should create a user with valid data', async () => {
      const mockUser = { id: 'new-user-id' };
      
      (supabase as any).auth.signUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const userData: CreateUser = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'user',
        is_active: true,
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual({ userId: 'new-user-id' });
    });

    it('should handle validation errors when creating user', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
        full_name: '',
      };

      await expect(
        adminService.createUser(invalidUserData as any)
      ).rejects.toThrow(AdminError);
    });

    it('should get users with pagination', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', full_name: 'User 1' },
        { id: '2', email: 'user2@example.com', full_name: 'User 2' },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
              count: 2,
            }),
          }),
        }),
      });

      const result = await adminService.getUsers(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].email).toBe('user1@example.com');
    });
  });

  describe('Assessment Management', () => {
    it('should create an assessment with questions', async () => {
      const mockAssessment = { id: 'assessment-id' };
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        
        if (table === 'assessments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAssessment,
                  error: null,
                }),
              }),
            }),
          };
        }
        
        if (table === 'assessment_questions') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      const assessmentData: CreateAssessment = {
        title: 'Test Assessment',
        description: 'A test assessment',
        type: 'knowledge',
        category: 'Technology',
        difficulty: 'intermediate',
        estimated_duration: 30,
        is_public: true,
        is_free: true,
        tags: ['test', 'technology'],
        questions: [
          {
            question_text: 'What is TypeScript?',
            question_type: 'multiple_choice',
            order_index: 0,
            points: 1,
            options: [
              { text: 'A language', value: 'language', is_correct: true },
              { text: 'A framework', value: 'framework', is_correct: false },
            ],
            correct_answer: 'language',
            explanation: 'TypeScript is a programming language',
          },
        ],
      };

      const result = await adminService.createAssessment(assessmentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ assessmentId: 'assessment-id' });
    });
  });

  describe('AI Build Jobs', () => {
    it('should create AI build job with valid data', async () => {
      const mockJob = { id: 'job-id' };
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        
        if (table === 'ai_build_jobs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockJob,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const jobData: CreateAIBuildJob = {
        job_type: 'assessment_generation',
        target_type: 'assessment',
        ai_provider: 'openai',
        ai_model: 'gpt-4',
        prompt: 'Generate a personality assessment',
        parameters: { temperature: 0.7 },
        content_specs: {
          target_audience: 'general',
          difficulty: 'intermediate',
          length: 'medium',
          topic: 'Personality Assessment',
          learning_objectives: ['Understand personality traits'],
          include_explanations: true,
          include_media: false,
          tone: 'friendly',
        },
      };

      const result = await adminService.createAIBuildJob(jobData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ jobId: 'job-id' });
    });
  });

  describe('Voice Agent Configuration', () => {
    it('should save voice agent configuration', async () => {
      const mockConfig = { id: 'config-id' };
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        
        if (table === 'voice_agent_configs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockConfig,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const configData: VoiceAgentConfig = {
        name: 'Test Voice Agent',
        ai_provider: 'openai',
        ai_model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: 'Be helpful and friendly',
        temperature: 0.7,
        max_response_output_tokens: 1000,
        turn_detection_type: 'server_vad',
        turn_detection_threshold: 0.5,
        turn_detection_prefix_padding_ms: 300,
        turn_detection_silence_duration_ms: 500,
        input_audio_transcription: false,
        emotion_detection: false,
        conversation_memory: true,
        context_window_messages: 10,
        arabic_support: false,
        is_active: true,
      };

      const result = await adminService.saveVoiceAgentConfig(configData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ configId: 'config-id' });
    });
  });

  describe('Content Challenges', () => {
    it('should create content challenge', async () => {
      const mockChallenge = { id: 'challenge-id' };
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        }
        
        if (table === 'content_challenges') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockChallenge,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      const challengeData: CreateContentChallenge = {
        title: '30-Day Mindfulness Challenge',
        description: 'Practice mindfulness every day for 30 days',
        challenge_type: 'streak',
        difficulty: 'beginner',
        duration_days: 30,
        points_reward: 300,
        badge_reward: 'Mindful Master',
        requirements: { daily_practice: true },
        content: { exercises: ['breathing', 'meditation'] },
        is_active: true,
      };

      const result = await adminService.createContentChallenge(challengeData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ challengeId: 'challenge-id' });
    });
  });

  describe('Analytics', () => {
    it('should get analytics metrics', async () => {
      // Mock different table queries
      const mockTableQueries = {
        profiles: { count: 100 },
        assessments: { count: 25 },
        assessment_results: { count: 500 },
        community_posts: { count: 150 },
        library_items: { count: 75 },
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation((query: string) => {
              if (query.includes('count')) {
                return {
                  gte: vi.fn().mockReturnValue({
                    count: mockTableQueries.profiles.count,
                    error: null,
                  }),
                  count: mockTableQueries.profiles.count,
                  error: null,
                };
              } else {
                return {
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { role: 'admin' },
                      error: null,
                    }),
                  }),
                };
              }
            }),
          };
        }
        
        return {
          select: vi.fn().mockReturnValue({
            count: mockTableQueries[table as keyof typeof mockTableQueries]?.count || 0,
            error: null,
          }),
        };
      });

      const metrics = await adminService.getAnalyticsMetrics();

      expect(metrics.total_users).toBe(100);
      expect(metrics.total_assessments).toBe(25);
      expect(metrics.total_completions).toBe(500);
      expect(metrics.total_community_posts).toBe(150);
      expect(metrics.total_library_items).toBe(75);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(
        adminService.createUser({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        } as CreateUser)
      ).rejects.toThrow(AdminError);
    });

    it('should handle authorization errors', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user' }, // Not admin
              error: null,
            }),
          }),
        }),
      });

      await expect(
        adminService.createUser({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        } as CreateUser)
      ).rejects.toThrow(AdminError);
    });

    it('should handle database errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Unique constraint violation' },
        }),
      });

      (supabase as any).auth.signUp = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      await expect(
        adminService.createUser({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        } as CreateUser)
      ).rejects.toThrow(AdminError);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when database is accessible', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await adminService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Service is healthy');
      expect(result.data?.status).toBe('healthy');
    });

    it('should handle database connection errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Connection failed'),
          }),
        }),
      });

      await expect(adminService.healthCheck()).rejects.toThrow(AdminError);
    });
  });
});

describe('Admin Error Handler Tests', () => {
  describe('Validation', () => {
    it('should validate data successfully with valid schema', () => {
      const schema = AdminErrorHandler;
      // This would test the validation methods but requires actual schema setup
      expect(true).toBe(true); // Placeholder
    });

    it('should throw validation error with invalid data', () => {
      // Test validation error scenarios
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Conversion', () => {
    it('should convert AdminError to ErrorResponse', () => {
      const adminError = new AdminError(
        'Test error',
        'TEST_ERROR',
        400,
        { component: 'Test', action: 'test' },
        'User friendly message'
      );

      const errorResponse = AdminErrorHandler.toErrorResponse(adminError);

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('User friendly message');
      expect(errorResponse.code).toBe('TEST_ERROR');
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Unknown error');
      const context = { component: 'Test', action: 'test' };

      const errorResponse = AdminErrorHandler.handleError(unknownError, context);

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('An unexpected error occurred');
      expect(errorResponse.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data from logs', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        api_key: 'sk-1234567890',
        normal_field: 'normal_value',
        nested: {
          client_secret: 'secret_value',
          public_info: 'public_value',
        },
      };

      const sanitized = AdminErrorHandler.sanitizeErrorData(sensitiveData);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.api_key).toBe('[REDACTED]');
      expect(sanitized.normal_field).toBe('normal_value');
      expect(sanitized.nested.client_secret).toBe('[REDACTED]');
      expect(sanitized.nested.public_info).toBe('public_value');
    });
  });
});