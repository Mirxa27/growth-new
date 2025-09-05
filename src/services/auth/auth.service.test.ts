import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
    vi.clearAllMocks();
  });

  it('should sign in a user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockProfile = { id: '123', email: 'test@example.com', role: 'user' };
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase.from('user_profiles').select().eq().single as any).mockResolvedValue({ data: mockProfile, error: null });

    const user = await authService.signIn({ email: 'test@example.com', password: 'password' });
    expect(user).toEqual(mockProfile);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
  });

  it('should register a new user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockProfile = { id: '123', email: 'test@example.com', role: 'user' };
    (supabase.auth.signUp as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase.from('user_profiles').insert().select().single as any).mockResolvedValue({ data: mockProfile, error: null });

    const user = await authService.register({ email: 'test@example.com', password: 'password', displayName: 'Test User' });
    expect(user).toEqual(mockProfile);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
  });
});