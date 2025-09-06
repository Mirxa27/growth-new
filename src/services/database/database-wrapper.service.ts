import { supabase } from '@/integrations/supabase/client';
import { fallbackDb } from './fallback-service';

/**
 * Database wrapper that automatically falls back to mock data when tables don't exist
 */
export class DatabaseWrapperService {
  private static tableExists = new Map<string, boolean>();
  private static checkInProgress = new Set<string>();

  /**
   * Check if a table exists (cached)
   */
  private static async checkTableExists(tableName: string): Promise<boolean> {
    // Return cached result if available
    if (this.tableExists.has(tableName)) {
      return this.tableExists.get(tableName)!;
    }

    // Prevent multiple simultaneous checks for the same table
    if (this.checkInProgress.has(tableName)) {
      // Wait for ongoing check to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.tableExists.get(tableName) || false;
    }

    this.checkInProgress.add(tableName);

    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      const exists = !error || (error.code !== 'PGRST116' && error.code !== '42P01');
      this.tableExists.set(tableName, exists);
      
      if (!exists) {
        console.warn(`Table '${tableName}' does not exist, using fallback data`);
      }
      
      return exists;
    } catch (error) {
      console.warn(`Error checking table '${tableName}':`, error);
      this.tableExists.set(tableName, false);
      return false;
    } finally {
      this.checkInProgress.delete(tableName);
    }
  }

  /**
   * Get user profile with fallback
   */
  static async getUserProfile(userId: string) {
    try {
      const exists = await this.checkTableExists('user_profiles');
      if (!exists) {
        return await fallbackDb.getUserProfile(userId);
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('Database error, using fallback:', error);
        return await fallbackDb.getUserProfile(userId);
      }

      return data;
    } catch (error) {
      console.warn('getUserProfile failed, using fallback:', error);
      return await fallbackDb.getUserProfile(userId);
    }
  }

  /**
   * Get community posts with fallback
   */
  static async getCommunityPosts(limit = 20) {
    try {
      const exists = await this.checkTableExists('community_posts');
      if (!exists) {
        return await fallbackDb.getCommunityPosts(limit);
      }

      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Database error, using fallback:', error);
        return await fallbackDb.getCommunityPosts(limit);
      }

      return data || [];
    } catch (error) {
      console.warn('getCommunityPosts failed, using fallback:', error);
      return await fallbackDb.getCommunityPosts(limit);
    }
  }

  /**
   * Get library items with fallback
   */
  static async getLibraryItems(limit = 50) {
    try {
      const exists = await this.checkTableExists('library_items');
      if (!exists) {
        return await fallbackDb.getLibraryItems(limit);
      }

      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Database error, using fallback:', error);
        return await fallbackDb.getLibraryItems(limit);
      }

      return data || [];
    } catch (error) {
      console.warn('getLibraryItems failed, using fallback:', error);
      return await fallbackDb.getLibraryItems(limit);
    }
  }

  /**
   * Get exploration sessions with fallback
   */
  static async getExplorationSessions(userId: string) {
    try {
      const exists = await this.checkTableExists('exploration_sessions');
      if (!exists) {
        return await fallbackDb.getExplorationSessions(userId);
      }

      const { data, error } = await supabase
        .from('exploration_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database error, using fallback:', error);
        return await fallbackDb.getExplorationSessions(userId);
      }

      return data || [];
    } catch (error) {
      console.warn('getExplorationSessions failed, using fallback:', error);
      return await fallbackDb.getExplorationSessions(userId);
    }
  }

  /**
   * Record performance metric with fallback
   */
  static async recordPerformanceMetric(metricType: string, name: string, value: number) {
    try {
      const exists = await this.checkTableExists('performance_metrics');
      if (!exists) {
        return await fallbackDb.recordPerformanceMetric(metricType, name, value);
      }

      const { error } = await supabase.rpc('record_performance_metric', {
        metric_type_param: metricType,
        name_param: name,
        value_param: value,
        unit_param: 'ms',
        tags_param: {},
        metadata_param: {},
        user_agent_param: navigator.userAgent,
        url_param: window.location.href,
        session_id_param: `session_${Date.now()}`
      });

      if (error) {
        return await fallbackDb.recordPerformanceMetric(metricType, name, value);
      }

      return true;
    } catch (error) {
      return await fallbackDb.recordPerformanceMetric(metricType, name, value);
    }
  }

  /**
   * Log error with fallback
   */
  static async logError(message: string, code?: string, severity = 'error') {
    try {
      const exists = await this.checkTableExists('error_logs');
      if (!exists) {
        return await fallbackDb.logError(message, code, severity);
      }

      const { error } = await supabase.rpc('log_error', {
        message_param: message,
        code_param: code,
        severity_param: severity,
        category_param: 'general',
        context_param: {},
        user_id_param: null,
      });

      if (error) {
        return await fallbackDb.logError(message, code, severity);
      }

      return true;
    } catch (error) {
      return await fallbackDb.logError(message, code, severity);
    }
  }

  /**
   * Clear table existence cache (useful after migrations)
   */
  static clearTableCache() {
    this.tableExists.clear();
    this.checkInProgress.clear();
    console.log('Database table cache cleared');
  }
}

export const dbWrapper = DatabaseWrapperService;