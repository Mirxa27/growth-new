/**
 * Real Authentication Service
 * Implements secure authentication with role-based access control
 */

import { supabase } from '@/integrations/supabase/client';
import { User, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials extends AuthCredentials {
  displayName: string;
  role?: 'user' | 'premium';
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new AuthError('No user returned');

      const userProfile = await this.getUserProfile(data.user.id);
      return userProfile;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new Error('Invalid credentials');
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new AuthError('Registration failed');

      const userProfile: Partial<AuthUser> = {
        id: data.user.id,
        email: data.user.email!,
        role: credentials.role || 'user',
        profileComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(userProfile);

      if (profileError) throw profileError;

      return userProfile as AuthUser;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new Error('Registration failed');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user with profile
   */
  async getUserProfile(userId: string): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as AuthUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as AuthUser;
  }

  /**
   * Get current auth user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await this.getUserProfile(user.id);
    } catch {
      return null;
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        callback(profile);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  /**
   * Check if user has premium access
   */
  async hasPremiumAccess(userId: string): Promise<boolean> {
    const user = await this.getUserProfile(userId);
    return user.role === 'premium' && user.subscriptionStatus === 'active';
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();