import { supabase } from '@/integrations/supabase/client';
import { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload,
  RealtimePostgresChangesFilter
} from '@supabase/supabase-js';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  event?: RealtimeEvent | RealtimeEvent[];
  filter?: string;
  callback: (payload: any) => void;
}

class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private presence: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to database changes
   */
  subscribe(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    options?: {
      event?: RealtimeEvent | RealtimeEvent[];
      filter?: string;
      schema?: string;
    }
  ): string {
    const id = `${table}_${Date.now()}_${Math.random()}`;
    const schema = options?.schema || 'public';
    
    try {
      const channel = supabase
        .channel(id)
        .on(
          'postgres_changes' as any,
          {
            event: options?.event || '*',
            schema,
            table,
            filter: options?.filter
          } as RealtimePostgresChangesFilter<any>,
          (payload) => {
            console.log(`Realtime event on ${table}:`, payload);
            callback(payload);
          }
        )
        .subscribe((status) => {
          console.log(`Subscription ${id} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${table}`);
          } else if (status === 'CLOSED') {
            this.unsubscribe(id);
          } else if (status === 'CHANNEL_ERROR') {
            errorHandler.handleError(new Error(`Channel error for ${table}`), {
              severity: ErrorSeverity.MEDIUM,
              category: ErrorCategory.REALTIME,
              context: { table, subscriptionId: id }
            });
          }
        });

      this.subscriptions.set(id, {
        id,
        channel,
        table,
        event: options?.event,
        filter: options?.filter,
        callback
      });

      return id;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.REALTIME,
        context: { table, options }
      });
      throw error;
    }
  }

  /**
   * Subscribe to specific user's data changes
   */
  subscribeToUserData(
    userId: string,
    callbacks: {
      onGoalChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onAssessmentChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onJournalChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onNotificationChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
    }
  ): string[] {
    const subscriptionIds: string[] = [];

    if (callbacks.onGoalChange) {
      subscriptionIds.push(
        this.subscribe('goals', callbacks.onGoalChange, {
          filter: `user_id=eq.${userId}`
        })
      );
    }

    if (callbacks.onAssessmentChange) {
      subscriptionIds.push(
        this.subscribe('assessments', callbacks.onAssessmentChange, {
          filter: `user_id=eq.${userId}`
        })
      );
    }

    if (callbacks.onJournalChange) {
      subscriptionIds.push(
        this.subscribe('journal_entries', callbacks.onJournalChange, {
          filter: `user_id=eq.${userId}`
        })
      );
    }

    if (callbacks.onNotificationChange) {
      subscriptionIds.push(
        this.subscribe('notifications', callbacks.onNotificationChange, {
          filter: `user_id=eq.${userId}`
        })
      );
    }

    return subscriptionIds;
  }

  /**
   * Subscribe to chat messages in a session
   */
  subscribeToChatSession(
    sessionId: string,
    onNewMessage: (message: any) => void
  ): string {
    return this.subscribe('chat_messages', (payload) => {
      if (payload.eventType === 'INSERT') {
        onNewMessage(payload.new);
      }
    }, {
      event: 'INSERT',
      filter: `session_id=eq.${sessionId}`
    });
  }

  /**
   * Create a presence channel
   */
  createPresenceChannel(
    channelName: string,
    options?: {
      onSync?: () => void;
      onJoin?: (key: string, currentPresences: any, newPresences: any) => void;
      onLeave?: (key: string, currentPresences: any, leftPresences: any) => void;
    }
  ): RealtimeChannel {
    try {
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: supabase.auth.getUser().then(({ data }) => data?.user?.id || 'anonymous')
          }
        }
      });

      if (options?.onSync) {
        channel.on('presence', { event: 'sync' }, options.onSync);
      }

      if (options?.onJoin) {
        channel.on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
          options.onJoin!(key, currentPresences, newPresences);
        });
      }

      if (options?.onLeave) {
        channel.on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
          options.onLeave!(key, currentPresences, leftPresences);
        });
      }

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Presence channel ${channelName} subscribed`);
          
          // Track your own presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
              user_info: {
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url
              }
            });
          }
        }
      });

      this.presence.set(channelName, channel);
      return channel;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.REALTIME,
        context: { channelName }
      });
      throw error;
    }
  }

  /**
   * Send message to presence channel
   */
  async sendToPresenceChannel(channelName: string, event: string, payload: any): Promise<void> {
    const channel = this.presence.get(channelName);
    if (!channel) {
      throw new Error(`Presence channel ${channelName} not found`);
    }

    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.REALTIME,
        context: { channelName, event, payload }
      });
      throw error;
    }
  }

  /**
   * Update presence state
   */
  async updatePresence(channelName: string, state: any): Promise<void> {
    const channel = this.presence.get(channelName);
    if (!channel) {
      throw new Error(`Presence channel ${channelName} not found`);
    }

    try {
      await channel.track(state);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.REALTIME,
        context: { channelName, state }
      });
    }
  }

  /**
   * Leave presence channel
   */
  async leavePresenceChannel(channelName: string): Promise<void> {
    const channel = this.presence.get(channelName);
    if (!channel) return;

    try {
      await channel.untrack();
      await channel.unsubscribe();
      this.presence.delete(channelName);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.REALTIME,
        context: { channelName }
      });
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      await subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from ${subscription.table}`);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.REALTIME,
        context: { subscriptionId, table: subscription.table }
      });
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(id => 
      this.unsubscribe(id)
    );
    
    const leavePromises = Array.from(this.presence.keys()).map(name =>
      this.leavePresenceChannel(name)
    );

    await Promise.all([...unsubscribePromises, ...leavePromises]);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get active presence channels
   */
  getActivePresenceChannels(): string[] {
    return Array.from(this.presence.keys());
  }
}

export const realtimeService = RealtimeService.getInstance();