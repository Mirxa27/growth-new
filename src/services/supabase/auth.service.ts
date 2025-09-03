import { supabase } from '@/integrations/supabase/client';
import type { 
  User,
  Session,
  AuthError,
  Provider,
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials,
  SignInWithOAuthCredentials,
  AuthChangeEvent
} from '@supabase/supabase-js';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';

export interface AuthProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  provider?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  initialized: boolean;
}

class AuthService {
  private static instance: AuthService;
  private listeners: Set<(event: AuthChangeEvent, session: Session | null) => void> = new Set();
  private currentState: AuthState = {
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth state and listeners
   */
  private async initialize() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        this.currentState.user = session.user;
        this.currentState.session = session;
        await this.loadUserProfile(session.user.id);
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        this.currentState.user = session?.user || null;
        this.currentState.session = session;
        
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
        } else {
          this.currentState.profile = null;
          cache.delete('auth:profile');
        }
        
        // Notify listeners
        this.listeners.forEach(listener => listener(event, session));
      });
      
      this.currentState.loading = false;
      this.currentState.initialized = true;
      
      // Cleanup on window unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          subscription.unsubscribe();
        });
      }
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'initialize_auth' }
      });
      this.currentState.loading = false;
      this.currentState.initialized = true;
    }
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string): Promise<void> {
    const cacheKey = 'auth:profile';
    const cached = cache.get<AuthProfile>(cacheKey);
    
    if (cached) {
      this.currentState.profile = cached;
      return;
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profile) {
        this.currentState.profile = profile as AuthProfile;
        cache.set(cacheKey, profile, { ttl: 300000 }); // 5 minutes
      }
    } catch (error) {
      console.warn('Failed to load user profile:', error);
      // Create default profile if none exists
      await this.createDefaultProfile(userId);
    }
  }

  /**
   * Create default profile for new users
   */
  private async createDefaultProfile(userId: string): Promise<void> {
    try {
      const user = this.currentState.user;
      if (!user) return;
      
      const profile = {
        id: userId,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider || 'email',
        metadata: {
          email_verified: user.email_confirmed_at != null,
          phone_verified: user.phone_confirmed_at != null
        }
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single();
      
      if (!error && data) {
        this.currentState.profile = data as AuthProfile;
        cache.set('auth:profile', data, { ttl: 300000 });
      }
    } catch (error) {
      // Don't throw error, just log it
      console.warn('Failed to create default profile:', error);
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpWithPasswordCredentials & { full_name?: string }): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'sign_up', email: credentials.email }
      });
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'sign_in', email: credentials.email }
      });
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: Provider): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined
        }
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'oauth_sign_in', provider }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with magic link
   */
  async signInWithMagicLink(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'magic_link_sign_in', email }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear cache
      cache.delete('auth:profile');
      cache.clear(/^auth:/);
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'sign_out' }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'reset_password', email }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'update_password' }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthProfile>): Promise<{ error: Error | null }> {
    try {
      const userId = this.currentState.user?.id;
      if (!userId) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        this.currentState.profile = data as AuthProfile;
        cache.set('auth:profile', data, { ttl: 300000 });
      }
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.DATABASE,
        context: { action: 'update_profile', updates }
      });
      return { error: error as Error };
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyOtp(email: string, token: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'verify_otp', email }
      });
      return { error: error as AuthError };
    }
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.currentState.user;
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.currentState.session;
  }

  /**
   * Get current profile
   */
  getProfile(): AuthProfile | null {
    return this.currentState.profile;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentState.session;
  }

  /**
   * Check if auth is initialized
   */
  isInitialized(): boolean {
    return this.currentState.initialized;
  }
}

export const authService = AuthService.getInstance();