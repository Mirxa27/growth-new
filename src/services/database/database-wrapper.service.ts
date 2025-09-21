import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
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
        logger.warn(`Table '${tableName}' does not exist, using fallback data`, 'DatabaseWrapperService');
      }

      return exists;
    } catch (error) {
      logger.warn(`Error checking table '${tableName}'`, 'DatabaseWrapperService', error);
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
        logger.warn('Database error, using fallback profile lookup', 'DatabaseWrapperService', error);
        return await fallbackDb.getUserProfile(userId);
      }

      return data;
    } catch (error) {
      logger.warn('getUserProfile failed, using fallback', 'DatabaseWrapperService', error);
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
        logger.warn('Database error, using fallback community posts', 'DatabaseWrapperService', error);
        return await fallbackDb.getCommunityPosts(limit);
      }

      return data || [];
    } catch (error) {
      logger.warn('getCommunityPosts failed, using fallback', 'DatabaseWrapperService', error);
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
        logger.warn('Database error, using fallback library items', 'DatabaseWrapperService', error);
        return await fallbackDb.getLibraryItems(limit);
      }

      return data || [];
    } catch (error) {
      logger.warn('getLibraryItems failed, using fallback', 'DatabaseWrapperService', error);
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
        logger.warn('Database error, using fallback exploration sessions', 'DatabaseWrapperService', error);
        return await fallbackDb.getExplorationSessions(userId);
      }

      return data || [];
    } catch (error) {
      logger.warn('getExplorationSessions failed, using fallback', 'DatabaseWrapperService', error);
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

      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'unknown';
      const sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `session_${crypto.randomUUID()}`
        : `session_${Date.now()}`;

      const { error } = await supabase.rpc('record_performance_metric', {
        metric_type_param: metricType,
        name_param: name,
        value_param: value,
        unit_param: 'ms',
        tags_param: {},
        metadata_param: {},
        user_agent_param: userAgent,
        url_param: currentUrl,
        session_id_param: sessionId,
      });

      if (error) {
        return await fallbackDb.recordPerformanceMetric(metricType, name, value);
      }

      return true;
    } catch (error) {
      logger.warn('Failed to persist performance metric via RPC, using fallback', 'DatabaseWrapperService', error);
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
      logger.warn('Failed to persist error log via RPC, using fallback', 'DatabaseWrapperService', error);
      return await fallbackDb.logError(message, code, severity);
    }
  }

  /**
   * Clear table existence cache (useful after migrations)
   */
  static clearTableCache() {
    this.tableExists.clear();
    this.checkInProgress.clear();
    logger.info('Database table cache cleared', 'DatabaseWrapperService');
  }
}

export const dbWrapper = DatabaseWrapperService;