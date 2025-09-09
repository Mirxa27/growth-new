import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Secure admin authentication service
 * Provides server-side verified admin checks with multiple fallbacks
 */
export class AdminAuthService {
  private static readonly ADMIN_EMAILS = [
    'admin@newomen.me',
    'administrator@newomen.me'
  ];

  /**
   * Verify if a user is an admin using multiple authentication methods
   * This method should be used on the client side for UI decisions
   */
  static async isUserAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;

    try {
      // Method 1: Check profile role and admin flag in database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_admin, is_admin_backup')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        // Check role-based admin
        if (profile.role === 'admin') return true;
        
        // Check admin flags
        if (profile.is_admin === true || profile.is_admin_backup === true) return true;
      }

      // Method 2: Check user metadata from auth
      if (user.user_metadata?.role === 'admin') return true;
      if (user.app_metadata?.role === 'admin') return true;

      // Method 3: Check email allowlist (fallback)
      if (this.ADMIN_EMAILS.includes(user.email || '')) return true;

      return false;
    } catch (error) {
      console.warn('Admin check failed:', error);
      
      // Fallback to email check only
      return this.ADMIN_EMAILS.includes(user.email || '');
    }
  }

  /**
   * Get current user's admin status
   */
  static async getCurrentUserAdminStatus(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return await this.isUserAdmin(user);
    } catch (error) {
      console.warn('Failed to get current user admin status:', error);
      return false;
    }
  }

  /**
   * Verify admin status server-side using RPC function
   * This should be used for critical operations
   */
  static async verifyAdminServerSide(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('verify_admin_status');
      
      if (error) {
        console.warn('Server-side admin verification failed:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.warn('Server-side admin verification error:', error);
      return false;
    }
  }

  /**
   * Check if current session has admin privileges for API calls
   */
  static async hasAdminAPIAccess(): Promise<boolean> {
    try {
      // Test admin access by calling a protected function
      const { error } = await supabase.rpc('check_admin_access');
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create admin session token for elevated operations
   */
  static async createAdminToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-token');
      
      if (error || !data?.token) {
        console.warn('Failed to create admin token:', error);
        return null;
      }
      
      return data.token;
    } catch (error) {
      console.warn('Admin token creation error:', error);
      return null;
    }
  }
}

/**
 * Admin authentication status interface
 */
export interface AdminAuthStatus {
  isAdmin: boolean;
  loading: boolean;
  verified: boolean; // True only if server-side verification passed
  refresh: () => Promise<void>;
}

// Re-export for compatibility
export default AdminAuthService;