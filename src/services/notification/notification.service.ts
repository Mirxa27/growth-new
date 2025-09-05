/**
 * Notification Service
 * Handles in-app notifications, push notifications, and email notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';
import { z } from 'zod';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  MESSAGE = 'message',
  REMINDER = 'reminder',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  read: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    categories: NotificationType[];
  };
  push: {
    enabled: boolean;
    categories: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

const NotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  data: z.record(z.string(), z.any()).optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
});

class NotificationService {
  private static instance: NotificationService;
  private userId: string | null = null;
  private subscription: any = null;
  private notificationHandlers: Map<NotificationType, ((notification: Notification) => void)[]> = new Map();
  private pushRegistration: PushSubscription | null = null;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  private async initializeService() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      this.subscribeToNotifications();
      this.loadPreferences();
      this.registerPushNotifications();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        this.subscribeToNotifications();
        this.loadPreferences();
        this.registerPushNotifications();
      } else {
        this.cleanup();
      }
    });
  }

  /**
   * Subscribe to real-time notifications
   */
  private subscribeToNotifications() {
    if (!this.userId) return;

    // Unsubscribe from previous subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Subscribe to user's notifications
    this.subscription = supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          this.handleNewNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Handle new notification
   */
  private handleNewNotification(notification: Notification) {
    // Show in-app notification
    if (notification.channels.includes(NotificationChannel.IN_APP)) {
      this.showInAppNotification(notification);
    }

    // Call registered handlers
    const handlers = this.notificationHandlers.get(notification.type) || [];
    handlers.forEach(handler => handler(notification));

    // Update unread count
    this.updateUnreadCount();
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: Notification) {
    // Check if document is visible
    if (document.hidden) {
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: notification.id,
          data: notification,
        });

        browserNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          this.markAsRead(notification.id);
        };
      }
    }

    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('notification', { 
      detail: notification 
    }));
  }

  /**
   * Send a notification
   */
  async sendNotification(
    userId: string,
    notification: z.infer<typeof NotificationSchema>
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Validate notification data
      const validated = NotificationSchema.parse(notification);

      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      const allowedChannels = this.filterChannelsByPreferences(validated.channels, preferences, validated.type);

      if (allowedChannels.length === 0) {
        return { success: true, error: 'User has disabled notifications for this type' };
      }

      // Create notification record
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: validated.type,
          title: validated.title,
          message: validated.message,
          data: validated.data,
          channels: allowedChannels,
          expires_at: validated.expiresAt,
          action_url: validated.actionUrl,
          action_label: validated.actionLabel,
        }] as any)
        .select()
        .single() as any;

      if (error) throw error;

      // Send to different channels
      const promises: Promise<any>[] = [];

      if (allowedChannels.includes(NotificationChannel.EMAIL)) {
        promises.push(this.sendEmailNotification(userId, data));
      }

      if (allowedChannels.includes(NotificationChannel.PUSH)) {
        promises.push(this.sendPushNotification(userId, data));
      }

      await Promise.allSettled(promises);
 
      return { success: true, notificationId: (data as any).id };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        context: {
          action: 'send_notification',
          metadata: { userId, type: notification.type },
        },
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(userId: string, notification: Notification) {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          userId,
          template: 'notification',
          data: {
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.EXTERNAL_API,
        context: { action: 'send_email_notification', userId, notificationId: notification?.id }
      });
      // keep silent for end-user flow; admin UI can surface via error events
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, notification: Notification) {
    try {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) return;

      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          subscriptions,
          notification: {
            title: notification.title,
            body: notification.message,
            data: notification.data,
            url: notification.actionUrl,
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.EXTERNAL_API,
        context: { action: 'send_push_notification', userId, notificationId: notification?.id }
      });
      // Do not throw further to avoid breaking caller flow
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId?: string): Promise<NotificationPreferences> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      return this.getDefaultPreferences();
    }

    const cacheKey = `notifications:preferences:${targetUserId}`;
    const cached = cache.get<NotificationPreferences>(cacheKey);
    if (cached) return cached;

    try {
      // Try to get preferences from the database
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('preferences')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
    // Log structured error for observability and fall back safely
    errorHandler.handleError(error, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.DATABASE,
      context: { action: 'fetch_notification_preferences', userId: targetUserId }
    });

    // If table doesn't exist (common in fresh DBs) attempt to seed defaults
    const errCode = typeof (error as any)?.code === 'string' ? (error as any).code : String((error as any)?.code || '');
    if (errCode.includes('42P01') || errCode.toUpperCase().includes('PGRST')) {
      const defaultPrefs = this.getDefaultPreferences();

      try {
        await supabase
          .from('notification_preferences')
          .insert([{
            user_id: targetUserId,
            preferences: defaultPrefs
          }] as any)
          .select()
          .maybeSingle();
      } catch {
        // ignore failures while seeding defaults
      }

      cache.set(cacheKey, defaultPrefs, { ttl: 300000 });
      return defaultPrefs;
    }
  }

      const preferences = data?.preferences || this.getDefaultPreferences();
      cache.set(cacheKey, preferences, { ttl: 300000 }); // 5 minutes

      return preferences;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        context: { action: 'get_user_preferences', userId: targetUserId }
      });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const current = await this.getUserPreferences();
      const updated = { ...current, ...preferences };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert([{
          user_id: this.userId,
          preferences: updated,
        }] as any);

      if (error) throw error;

      // Clear cache
      cache.remove(`notifications:preferences:${this.userId}`);

      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.BUSINESS_LOGIC,
        context: { action: 'update_notification_preferences' },
      });
      return false;
    }
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    type?: NotificationType;
    unreadOnly?: boolean;
  }): Promise<{ notifications: Notification[]; total: number }> {
    if (!this.userId) return { notifications: [], total: 0 };

    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.unreadOnly) {
        query = query.is('read_at', null);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data || [],
        total: count || 0,
      };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.DATABASE,
        context: { action: 'get_notifications' },
      });
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        } as any)
        .eq('id', notificationId)
        .eq('user_id', this.userId);

      if (error) throw error;

      this.updateUnreadCount();
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.DATABASE,
        context: { action: 'mark_notification_read', notificationId }
      });
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        } as any)
        .eq('user_id', this.userId)
        .is('read_at', null);

      if (error) throw error;

      this.updateUnreadCount();
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.DATABASE,
        context: { action: 'mark_all_notifications_read' }
      });
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .is('read_at', null);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.DATABASE,
        context: { action: 'get_unread_count' }
      });
      return 0;
    }
  }

  /**
   * Update unread count
   */
  private async updateUnreadCount() {
    const count = await this.getUnreadCount();
    window.dispatchEvent(new CustomEvent('notification-count', { detail: count }));
  }

  /**
   * Register for push notifications
   */
  async registerPushNotifications(): Promise<boolean> {
    if (!this.userId || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Validate VAPID key
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      if (!vapidKey || vapidKey.length < 20) {
        console.warn('Push registration skipped: VAPID public key missing or invalid');
        return false;
      }

      // Reuse existing subscription if available
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        try {
          const { error } = await supabase
            .from('push_subscriptions')
            .upsert([{
              user_id: this.userId,
              subscription: existing.toJSON(),
              user_agent: navigator.userAgent,
            }] as any);
          if (error) throw error;
          this.pushRegistration = existing;
          return true;
        } catch (e) {
          console.warn('Failed to persist existing push subscription, attempting re-subscribe');
        }
      }

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert([{
          user_id: this.userId,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
        }] as any);

      if (error) throw error;

      this.pushRegistration = subscription;
      return true;
    } catch (error) {
      console.error('Failed to register push notifications:', error);
      return false;
    }
  }

  /**
   * Register notification handler
   */
  on(type: NotificationType, handler: (notification: Notification) => void) {
    const handlers = this.notificationHandlers.get(type) || [];
    handlers.push(handler);
    this.notificationHandlers.set(type, handlers);

    // Return unsubscribe function
    return () => {
      const updatedHandlers = this.notificationHandlers.get(type) || [];
      const index = updatedHandlers.indexOf(handler);
      if (index > -1) {
        updatedHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Helper functions
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: {
        enabled: true,
        frequency: 'immediate',
        categories: [NotificationType.ACHIEVEMENT, NotificationType.MESSAGE, NotificationType.SYSTEM],
      },
      push: {
        enabled: true,
        categories: Object.values(NotificationType),
      },
      inApp: {
        enabled: true,
        sound: true,
        vibration: true,
      },
    };
  }

  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    preferences: NotificationPreferences,
    type: NotificationType
  ): NotificationChannel[] {
    return channels.filter(channel => {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return preferences.email.enabled && preferences.email.categories.includes(type);
        case NotificationChannel.PUSH:
          return preferences.push.enabled && preferences.push.categories.includes(type);
        case NotificationChannel.IN_APP:
          return preferences.inApp.enabled;
        default:
          return true;
      }
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private loadPreferences() {
    // Load preferences on initialization
    this.getUserPreferences();
  }

  private cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.userId = null;
    this.notificationHandlers.clear();
    this.pushRegistration = null;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export convenience functions
export const notifications = {
  send: (userId: string, notification: any) => 
    notificationService.sendNotification(userId, notification),
  
  get: (options?: any) => 
    notificationService.getNotifications(options),
  
  markAsRead: (id: string) => 
    notificationService.markAsRead(id),
  
  markAllAsRead: () => 
    notificationService.markAllAsRead(),
  
  getUnreadCount: () => 
    notificationService.getUnreadCount(),
  
  updatePreferences: (prefs: any) => 
    notificationService.updatePreferences(prefs),
  
  on: (type: NotificationType, handler: (n: Notification) => void) => 
    notificationService.on(type, handler),
  
  enablePush: () => 
    notificationService.registerPushNotifications(),
};
