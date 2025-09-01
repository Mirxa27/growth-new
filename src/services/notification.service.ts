/**
 * Notification Service
 * Handles in-app notifications, push notifications, and email notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'reminder';
  category: 'system' | 'social' | 'progress' | 'achievement' | 'reminder';
  read: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  in_app: boolean;
  sound: boolean;
  categories: {
    system: boolean;
    social: boolean;
    progress: boolean;
    achievement: boolean;
    reminder: boolean;
  };
}

class NotificationService {
  private userId: string | null = null;
  private preferences: NotificationPreferences | null = null;
  private unreadCount: number = 0;
  private listeners: Set<(count: number) => void> = new Set();
  private pushSubscription: PushSubscription | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize notification service
   */
  private async initialize() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      await this.loadPreferences();
      await this.loadUnreadCount();
      this.setupRealtimeSubscription();
      await this.initializePushNotifications();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        await this.loadPreferences();
        await this.loadUnreadCount();
        this.setupRealtimeSubscription();
      } else {
        this.userId = null;
        this.preferences = null;
        this.unreadCount = 0;
      }
    });
  }

  /**
   * Load user notification preferences
   */
  private async loadPreferences() {
    if (!this.userId) return;

    const { data } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('user_id', this.userId)
      .single();

    if (data?.notification_settings) {
      this.preferences = {
        email: data.notification_settings.email ?? true,
        push: data.notification_settings.push ?? false,
        in_app: data.notification_settings.in_app ?? true,
        sound: data.notification_settings.sound ?? true,
        categories: {
          system: data.notification_settings.categories?.system ?? true,
          social: data.notification_settings.categories?.social ?? true,
          progress: data.notification_settings.categories?.progress ?? true,
          achievement: data.notification_settings.categories?.achievement ?? true,
          reminder: data.notification_settings.categories?.reminder ?? true,
        }
      };
    } else {
      // Default preferences
      this.preferences = {
        email: true,
        push: false,
        in_app: true,
        sound: true,
        categories: {
          system: true,
          social: true,
          progress: true,
          achievement: true,
          reminder: true,
        }
      };
    }
  }

  /**
   * Save notification preferences
   */
  async savePreferences(preferences: Partial<NotificationPreferences>) {
    if (!this.userId) return;

    this.preferences = { ...this.preferences!, ...preferences };

    const { error } = await supabase
      .from('profiles')
      .update({ 
        notification_settings: this.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);

    if (error) {
      console.error('Failed to save notification preferences:', error);
      throw error;
    }

    return this.preferences;
  }

  /**
   * Load unread notification count
   */
  private async loadUnreadCount() {
    if (!this.userId) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('read', false);

    this.unreadCount = count || 0;
    this.notifyListeners();
  }

  /**
   * Setup realtime subscription for new notifications
   */
  private setupRealtimeSubscription() {
    if (!this.userId) return;

    // Subscribe to new notifications
    supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
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
    // Check if category is enabled
    if (!this.preferences?.categories[notification.category]) return;

    // Show in-app notification
    if (this.preferences?.in_app) {
      this.showInAppNotification(notification);
    }

    // Play sound
    if (this.preferences?.sound) {
      this.playNotificationSound();
    }

    // Update unread count
    this.unreadCount++;
    this.notifyListeners();

    // Send push notification if enabled
    if (this.preferences?.push && this.pushSubscription) {
      this.sendPushNotification(notification);
    }
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: Notification) {
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
      action: notification.action_url ? {
        label: notification.action_label || 'View',
        onClick: () => window.location.href = notification.action_url!
      } : undefined
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(console.error);
  }

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      this.pushSubscription = subscription;

      // Save subscription to backend
      await this.savePushSubscription(subscription);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string) {
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

  /**
   * Save push subscription to backend
   */
  private async savePushSubscription(subscription: PushSubscription) {
    if (!this.userId) return;

    await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: this.userId,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: Notification) {
    // This would typically call a backend endpoint
    // that uses web-push library to send the notification
    console.log('Sending push notification:', notification);
  }

  /**
   * Get all notifications
   */
  async getNotifications(limit = 50): Promise<Notification[]> {
    if (!this.userId) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    if (!this.userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', this.userId);

    if (!error) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (!this.userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', this.userId)
      .eq('read', false);

    if (!error) {
      this.unreadCount = 0;
      this.notifyListeners();
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    if (!this.userId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for user
   */
  async createNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'read'>
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ...notification,
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Subscribe to unread count changes
   */
  subscribeToUnreadCount(listener: (count: number) => void) {
    this.listeners.add(listener);
    listener(this.unreadCount); // Initial value
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of unread count change
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.unreadCount));
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();