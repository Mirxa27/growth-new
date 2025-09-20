import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Auth Service Fallback
 * Handles missing user_profiles table gracefully
 */
export class AuthFallbackService {
  static async ensureUserProfile(userId: string, userData: any) {
    try {
      // Try to get from user_profiles first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === '42P01') {
        // Table doesn't exist, try profiles table
        logger.warn('user_profiles table not found, trying profiles table');
        
        const { data: profile, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fallbackError && fallbackError.code === '42P01') {
          // Neither table exists, create minimal profile
          logger.warn('No profile tables found, creating minimal profile');
          return {
            id: userId,
            email: userData.email,
            display_name: userData.display_name || userData.email?.split('@')[0],
            role: 'user',
            is_admin: false,
            created_at: new Date().toISOString()
          };
        }

        return profile;
      }

      return userProfile;
    } catch (error) {
      logger.error('Failed to load user profile', 'AuthFallbackService', error);
      
      // Return minimal profile as fallback
      return {
        id: userId,
        email: userData.email,
        display_name: userData.display_name || 'User',
        role: 'user',
        is_admin: false,
        created_at: new Date().toISOString()
      };
    }
  }

  static async createOrUpdateProfile(userId: string, userData: any) {
    try {
      // Try user_profiles first
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: userData.email,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error && error.code === '42P01') {
        // Fallback to profiles table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userData.email,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (fallbackError) {
          throw fallbackError;
        }

        return fallbackData;
      }

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to create/update profile', 'AuthFallbackService', error);
      throw error;
    }
  }
}

export default AuthFallbackService;
