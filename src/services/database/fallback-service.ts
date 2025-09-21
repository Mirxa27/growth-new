import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface FallbackUserProfileTemplate {
  full_name?: string;
  display_name?: string;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  created_at?: string;
}

interface FallbackCommunityPost {
  id?: string;
  title?: string;
  content?: string;
  author?: string;
  likes?: number;
  category?: string | null;
  created_at?: string;
}

interface FallbackLibraryItem {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  category?: string | null;
  duration?: number | null;
  audio_url?: string | null;
  media_url?: string | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  visibility?: 'public' | 'private';
}

interface FallbackExplorationSession {
  id?: string;
  user_id?: string;
  started_at?: string;
  completed_at?: string | null;
  context?: Record<string, unknown> | null;
  summary?: string | null;
}

interface PersistedMetricEntry {
  metric_type: string;
  name: string;
  value: number;
  recorded_at: string;
}

interface PersistedErrorEntry {
  message: string;
  code?: string;
  severity: string;
  recorded_at: string;
}

const FALLBACK_KEYS = {
  userProfileTemplate: 'fallback_user_profile_template',
  communityPosts: 'fallback_community_posts',
  libraryItems: 'fallback_library_items',
  explorationSessions: 'fallback_exploration_sessions',
  performanceMetrics: 'fallback_performance_metrics_queue',
  errorLogs: 'fallback_error_log_queue',
} as const;

/**
 * Fallback service to handle missing database tables gracefully
 * by storing minimal viable data in the platform_settings table.
 */
export class FallbackDatabaseService {
  private static async loadSettingValue<T>(key: string, fallback: T): Promise<T> {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .maybeSingle();

      if (error) {
        logger.warn('Failed to load fallback setting from Supabase', 'FallbackDatabaseService', { key, error });
        return fallback;
      }

      if (!data?.setting_value) {
        return fallback;
      }

      const rawValue = typeof data.setting_value === 'string'
        ? JSON.parse(data.setting_value)
        : data.setting_value;

      return (rawValue as T) ?? fallback;
    } catch (error) {
      logger.error('Error parsing fallback setting value', 'FallbackDatabaseService', { key, error });
      return fallback;
    }
  }

  private static async persistSettingValue<T>(key: string, value: T): Promise<boolean> {
    const { error } = await supabase.rpc('update_platform_setting', {
      key_name: key,
      new_value: value,
    });

    if (error) {
      logger.error('Failed to persist fallback setting', 'FallbackDatabaseService', { key, error });
      return false;
    }

    return true;
  }

  static async getUserProfile(userId: string) {
    const template = await this.loadSettingValue<FallbackUserProfileTemplate>(
      FALLBACK_KEYS.userProfileTemplate,
      {},
    );

    return {
      id: userId,
      user_id: userId,
      full_name: template.full_name ?? '',
      display_name: template.display_name ?? template.full_name ?? 'Member',
      avatar_url: template.avatar_url ?? null,
      onboarding_completed: template.onboarding_completed ?? false,
      created_at: template.created_at ?? new Date().toISOString(),
    };
  }

  static async getCommunityPosts(limit = 20) {
    const posts = await this.loadSettingValue<FallbackCommunityPost[]>(
      FALLBACK_KEYS.communityPosts,
      [],
    );

    const normalized = posts
      .filter((post): post is FallbackCommunityPost => Boolean(post && post.title && post.content))
      .map((post, index) => ({
        id: post.id && typeof post.id === 'string' ? post.id : `fallback-post-${index + 1}`,
        title: post.title ?? 'Untitled',
        content: post.content ?? '',
        author: post.author ?? 'Community Team',
        likes: typeof post.likes === 'number' ? post.likes : 0,
        category: post.category ?? null,
        created_at: post.created_at ?? new Date().toISOString(),
      }));

    return normalized.slice(0, limit);
  }

  static async getLibraryItems(limit = 50) {
    const items = await this.loadSettingValue<FallbackLibraryItem[]>(
      FALLBACK_KEYS.libraryItems,
      [],
    );

    const normalized = items
      .filter((item): item is FallbackLibraryItem => Boolean(item && item.title && item.type))
      .map((item, index) => ({
        id: item.id && typeof item.id === 'string' ? item.id : `fallback-library-${index + 1}`,
        title: item.title ?? 'Untitled Resource',
        description: item.description ?? '',
        type: item.type ?? 'article',
        category: item.category ?? null,
        duration: typeof item.duration === 'number' ? item.duration : null,
        audio_url: item.audio_url ?? null,
        media_url: item.media_url ?? null,
        is_featured: Boolean(item.is_featured),
        created_at: item.created_at ?? new Date().toISOString(),
        visibility: item.visibility ?? 'private',
      }));

    return normalized.slice(0, limit);
  }

  static async getExplorationSessions(userId: string) {
    const sessions = await this.loadSettingValue<FallbackExplorationSession[]>(
      FALLBACK_KEYS.explorationSessions,
      [],
    );

    return sessions
      .filter((session): session is FallbackExplorationSession => Boolean(session && session.user_id))
      .filter((session) => session.user_id === userId)
      .map((session, index) => ({
        id: session.id && typeof session.id === 'string' ? session.id : `fallback-session-${index + 1}`,
        user_id: session.user_id!,
        started_at: session.started_at ?? new Date().toISOString(),
        completed_at: session.completed_at ?? null,
        context: session.context ?? null,
        summary: session.summary ?? null,
      }));
  }

  static async recordPerformanceMetric(metricType: string, name: string, value: number) {
    const existingMetrics = await this.loadSettingValue<PersistedMetricEntry[]>(
      FALLBACK_KEYS.performanceMetrics,
      [],
    );

    const entry: PersistedMetricEntry = {
      metric_type: metricType,
      name,
      value,
      recorded_at: new Date().toISOString(),
    };

    const nextMetrics = [...existingMetrics.slice(-49), entry];
    return this.persistSettingValue(FALLBACK_KEYS.performanceMetrics, nextMetrics);
  }

  static async logError(message: string, code?: string, severity = 'error') {
    const existingLogs = await this.loadSettingValue<PersistedErrorEntry[]>(
      FALLBACK_KEYS.errorLogs,
      [],
    );

    const entry: PersistedErrorEntry = {
      message,
      code,
      severity,
      recorded_at: new Date().toISOString(),
    };

    const nextLogs = [...existingLogs.slice(-49), entry];
    return this.persistSettingValue(FALLBACK_KEYS.errorLogs, nextLogs);
  }
}

export const fallbackDb = FallbackDatabaseService;