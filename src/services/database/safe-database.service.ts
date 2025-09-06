import { supabase } from '@/integrations/supabase/client';

/**
 * Safe database service that uses database functions to prevent 404 errors
 */
export class SafeDatabaseService {
  /**
   * Get user profile safely
   */
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_safe', {
        user_id_param: userId
      });

      if (error) {
        console.warn('Error getting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Get community posts safely
   */
  static async getCommunityPosts(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_community_posts_safe', {
        limit_param: limit
      });

      if (error) {
        console.warn('Error getting community posts:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to get community posts:', error);
      return [];
    }
  }

  /**
   * Get exploration sessions safely
   */
  static async getExplorationSessions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_exploration_sessions_safe', {
        user_id_param: userId
      });

      if (error) {
        console.warn('Error getting exploration sessions:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to get exploration sessions:', error);
      return [];
    }
  }

  /**
   * Get library items safely
   */
  static async getLibraryItems(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_library_items_safe', {
        limit_param: limit
      });

      if (error) {
        console.warn('Error getting library items:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to get library items:', error);
      return [];
    }
  }

  /**
   * Record performance metric safely
   */
  static async recordPerformanceMetric(
    metricType: string,
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: any
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('record_performance_metric', {
        metric_type_param: metricType,
        name_param: name,
        value_param: value,
        unit_param: unit,
        metadata_param: metadata || {},
        user_agent_param: navigator.userAgent,
        url_param: window.location.href,
        session_id_param: `session_${Date.now()}`
      });

      if (error) {
        console.warn('Error recording performance metric:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Failed to record performance metric:', error);
      return false;
    }
  }

  /**
   * Create exploration session safely
   */
  static async createExplorationSession(userId: string, explorationType: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_exploration_session', {
        user_id_param: userId,
        exploration_type_param: explorationType
      });

      if (error) {
        console.warn('Error creating exploration session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to create exploration session:', error);
      return null;
    }
  }

  /**
   * Increment post likes safely
   */
  static async incrementPostLikes(postId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('increment_post_likes', {
        post_id_param: postId
      });

      if (error) {
        console.warn('Error incrementing post likes:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.warn('Failed to increment post likes:', error);
      return 0;
    }
  }

  /**
   * Check if table exists
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      // If we get data or a specific error, table exists
      return !error || error.code !== 'PGRST116';
    } catch (error) {
      return false;
    }
  }
}

export const safeDb = SafeDatabaseService;