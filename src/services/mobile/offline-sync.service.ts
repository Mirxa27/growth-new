import { Capacitor } from '@capacitor/core';
import { Storage } from '@capacitor/storage';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface OfflineData {
  assessments: any[];
  attempts: any[];
  responses: any[];
  userProgress: any[];
  lastSync: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'assessment_attempt' | 'assessment_response' | 'user_progress';
  data: any;
  timestamp: string;
  retryCount: number;
}

/**
 * Offline Sync Service for Mobile App
 * Handles caching, offline storage, and data synchronization
 */
export class OfflineSyncService {
  private static readonly STORAGE_KEYS = {
    OFFLINE_DATA: 'newomen_offline_data',
    SYNC_QUEUE: 'newomen_sync_queue',
    LAST_SYNC: 'newomen_last_sync',
    USER_PROGRESS: 'newomen_user_progress',
    CACHED_ASSESSMENTS: 'newomen_cached_assessments'
  };

  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static syncTimer: NodeJS.Timeout | null = null;
  private static isOnline = true;

  /**
   * Initialize the offline sync service
   */
  static async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      logger.info('Offline sync service not needed for web platform');
      return;
    }

    try {
      // Check network status
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      // Listen for network changes
      Network.addListener('networkStatusChange', (status) => {
        this.isOnline = status.connected;
        logger.info(`Network status changed: ${status.connected ? 'online' : 'offline'}`);
        
        if (status.connected) {
          this.syncOfflineData();
        }
      });

      // Set up periodic sync
      this.startPeriodicSync();

      // Initialize push notifications
      await this.initializePushNotifications();

      logger.info('Offline sync service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize offline sync service', 'OfflineSyncService', error);
    }
  }

  /**
   * Initialize push notifications
   */
  private static async initializePushNotifications(): Promise<void> {
    try {
      // Request permission for notifications
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await PushNotifications.register();
        
        // Listen for registration
        PushNotifications.addListener('registration', (token) => {
          logger.info('Push registration success:', token.value);
          this.savePushToken(token.value);
        });

        // Listen for push notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          logger.info('Push notification received:', notification);
          this.handlePushNotification(notification);
        });

        // Handle notification actions
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          logger.info('Push notification action performed:', notification);
          this.handleNotificationAction(notification);
        });
      }
    } catch (error) {
      logger.warn('Push notifications not available or permission denied', error);
    }
  }

  /**
   * Cache assessment data for offline access
   */
  static async cacheAssessment(assessmentId: string): Promise<void> {
    try {
      // Fetch assessment with questions
      const { data: assessmentData } = await supabase.rpc('get_assessment_with_questions', {
        p_assessment_id: assessmentId
      });

      if (assessmentData) {
        const cached = await this.getCachedAssessments();
        cached[assessmentId] = {
          ...assessmentData,
          cachedAt: new Date().toISOString()
        };

        await Storage.set({
          key: this.STORAGE_KEYS.CACHED_ASSESSMENTS,
          value: JSON.stringify(cached)
        });

        logger.info(`Assessment ${assessmentId} cached successfully`);
      }
    } catch (error) {
      logger.error('Failed to cache assessment', 'OfflineSyncService', error);
    }
  }

  /**
   * Get cached assessments
   */
  static async getCachedAssessments(): Promise<Record<string, any>> {
    try {
      const { value } = await Storage.get({ key: this.STORAGE_KEYS.CACHED_ASSESSMENTS });
      return value ? JSON.parse(value) : {};
    } catch (error) {
      logger.error('Failed to get cached assessments', 'OfflineSyncService', error);
      return {};
    }
  }

  /**
   * Start an assessment attempt (works offline)
   */
  static async startAssessmentAttempt(assessmentId: string, isAnonymous = false): Promise<string> {
    const attemptId = `offline_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const attemptData = {
      id: attemptId,
      assessment_id: assessmentId,
      user_id: isAnonymous ? null : (await supabase.auth.getUser()).data.user?.id,
      visitor_session_id: isAnonymous ? this.generateSessionId() : null,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      responses: {},
      offline: true
    };

    // Add to sync queue
    await this.addToSyncQueue({
      id: attemptId,
      type: 'assessment_attempt',
      data: attemptData,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });

    // Cache locally
    const offlineData = await this.getOfflineData();
    offlineData.attempts.push(attemptData);
    await this.saveOfflineData(offlineData);

    return attemptId;
  }

  /**
   * Submit a question response (works offline)
   */
  static async submitQuestionResponse(
    attemptId: string,
    questionId: string,
    responseData: any
  ): Promise<void> {
    const responseId = `offline_response_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const response = {
      id: responseId,
      attempt_id: attemptId,
      question_id: questionId,
      ...responseData,
      responded_at: new Date().toISOString(),
      offline: true
    };

    // Add to sync queue
    await this.addToSyncQueue({
      id: responseId,
      type: 'assessment_response',
      data: response,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });

    // Update local attempt
    const offlineData = await this.getOfflineData();
    const attempt = offlineData.attempts.find(a => a.id === attemptId);
    if (attempt) {
      attempt.responses[questionId] = response;
      await this.saveOfflineData(offlineData);
    }
  }

  /**
   * Complete an assessment attempt (works offline)
   */
  static async completeAssessmentAttempt(attemptId: string): Promise<any> {
    const offlineData = await this.getOfflineData();
    const attempt = offlineData.attempts.find(a => a.id === attemptId);
    
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    // Calculate basic scoring (more detailed scoring will happen on sync)
    const responses = Object.values(attempt.responses);
    const totalQuestions = responses.length;
    const completedAt = new Date().toISOString();

    attempt.status = 'completed';
    attempt.completed_at = completedAt;
    attempt.questions_answered = totalQuestions;

    // Update sync queue
    const syncItem = await this.findSyncQueueItem(attemptId, 'assessment_attempt');
    if (syncItem) {
      syncItem.data = attempt;
    }

    await this.saveOfflineData(offlineData);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineData();
    }

    return {
      attempt_id: attemptId,
      status: 'completed',
      completed_at: completedAt,
      questions_answered: totalQuestions,
      offline_completion: true
    };
  }

  /**
   * Sync offline data with server
   */
  static async syncOfflineData(): Promise<void> {
    if (!this.isOnline) {
      logger.info('Cannot sync: offline');
      return;
    }

    try {
      const syncQueue = await this.getSyncQueue();
      
      for (const item of syncQueue) {
        try {
          await this.syncSingleItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          logger.error(`Failed to sync item ${item.id}`, 'OfflineSyncService', error);
          
          // Increment retry count
          item.retryCount++;
          if (item.retryCount >= 5) {
            logger.warn(`Removing item ${item.id} after 5 failed attempts`);
            await this.removeFromSyncQueue(item.id);
          } else {
            await this.updateSyncQueueItem(item);
          }
        }
      }

      // Update last sync time
      await Storage.set({
        key: this.STORAGE_KEYS.LAST_SYNC,
        value: new Date().toISOString()
      });

      logger.info('Offline data sync completed');
    } catch (error) {
      logger.error('Failed to sync offline data', 'OfflineSyncService', error);
    }
  }

  /**
   * Sync a single item with the server
   */
  private static async syncSingleItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'assessment_attempt':
        await this.syncAssessmentAttempt(item.data);
        break;
      case 'assessment_response':
        await this.syncAssessmentResponse(item.data);
        break;
      case 'user_progress':
        await this.syncUserProgress(item.data);
        break;
      default:
        logger.warn(`Unknown sync item type: ${item.type}`);
    }
  }

  /**
   * Sync assessment attempt with server
   */
  private static async syncAssessmentAttempt(attemptData: any): Promise<void> {
    // Convert offline attempt to server format
    const serverAttempt = {
      assessment_id: attemptData.assessment_id,
      visitor_session_id: attemptData.visitor_session_id,
      device_fingerprint: await this.getDeviceFingerprint(),
      ip_address: null // Will be set by server
    };

    // Start attempt on server
    const { data: serverAttemptId } = await supabase.rpc('start_assessment_attempt', serverAttempt);
    
    // Sync all responses
    for (const response of Object.values(attemptData.responses) as any[]) {
      await supabase.rpc('submit_question_response', {
        p_attempt_id: serverAttemptId,
        p_question_id: response.question_id,
        p_response_text: response.response_text,
        p_selected_option_ids: response.selected_option_ids,
        p_response_value: response.response_value,
        p_time_taken: response.time_taken
      });
    }

    // Complete attempt if it was completed offline
    if (attemptData.status === 'completed') {
      await supabase.rpc('complete_assessment_attempt', {
        p_attempt_id: serverAttemptId
      });
    }
  }

  /**
   * Sync assessment response with server
   */
  private static async syncAssessmentResponse(responseData: any): Promise<void> {
    // This would be handled as part of attempt sync
    // Individual responses don't need separate sync in most cases
  }

  /**
   * Sync user progress with server
   */
  private static async syncUserProgress(progressData: any): Promise<void> {
    // Sync course progress, achievements, etc.
    const { error } = await supabase
      .from('course_progress')
      .upsert(progressData);
      
    if (error) throw error;
  }

  /**
   * Get offline data
   */
  private static async getOfflineData(): Promise<OfflineData> {
    try {
      const { value } = await Storage.get({ key: this.STORAGE_KEYS.OFFLINE_DATA });
      return value ? JSON.parse(value) : {
        assessments: [],
        attempts: [],
        responses: [],
        userProgress: [],
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get offline data', 'OfflineSyncService', error);
      return {
        assessments: [],
        attempts: [],
        responses: [],
        userProgress: [],
        lastSync: new Date().toISOString()
      };
    }
  }

  /**
   * Save offline data
   */
  private static async saveOfflineData(data: OfflineData): Promise<void> {
    await Storage.set({
      key: this.STORAGE_KEYS.OFFLINE_DATA,
      value: JSON.stringify(data)
    });
  }

  /**
   * Get sync queue
   */
  private static async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const { value } = await Storage.get({ key: this.STORAGE_KEYS.SYNC_QUEUE });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      logger.error('Failed to get sync queue', 'OfflineSyncService', error);
      return [];
    }
  }

  /**
   * Add item to sync queue
   */
  private static async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(item);
    await Storage.set({
      key: this.STORAGE_KEYS.SYNC_QUEUE,
      value: JSON.stringify(queue)
    });
  }

  /**
   * Remove item from sync queue
   */
  private static async removeFromSyncQueue(itemId: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    await Storage.set({
      key: this.STORAGE_KEYS.SYNC_QUEUE,
      value: JSON.stringify(filtered)
    });
  }

  /**
   * Update sync queue item
   */
  private static async updateSyncQueueItem(updatedItem: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    const index = queue.findIndex(item => item.id === updatedItem.id);
    if (index >= 0) {
      queue[index] = updatedItem;
      await Storage.set({
        key: this.STORAGE_KEYS.SYNC_QUEUE,
        value: JSON.stringify(queue)
      });
    }
  }

  /**
   * Find sync queue item
   */
  private static async findSyncQueueItem(itemId: string, type: string): Promise<SyncQueueItem | null> {
    const queue = await this.getSyncQueue();
    return queue.find(item => item.id === itemId && item.type === type) || null;
  }

  /**
   * Start periodic sync
   */
  private static startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.syncOfflineData();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  static stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Generate session ID for anonymous users
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get device fingerprint
   */
  private static async getDeviceFingerprint(): Promise<string> {
    // Create a simple device fingerprint
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    const timestamp = Date.now();
    
    return `${platform}_${isNative}_${timestamp}`;
  }

  /**
   * Save push token
   */
  private static async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user.id);
      }
    } catch (error) {
      logger.error('Failed to save push token', 'OfflineSyncService', error);
    }
  }

  /**
   * Handle push notification
   */
  private static handlePushNotification(notification: any): void {
    // Handle incoming push notification
    logger.info('Handling push notification:', notification);
    
    // You can trigger UI updates, show local notifications, etc.
  }

  /**
   * Handle notification action
   */
  private static handleNotificationAction(notification: any): void {
    // Handle user interaction with notification
    logger.info('Handling notification action:', notification);
    
    // Navigate to specific assessment, show results, etc.
  }

  /**
   * Clear all offline data (for logout or reset)
   */
  static async clearOfflineData(): Promise<void> {
    await Storage.clear();
    logger.info('All offline data cleared');
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<{
    isOnline: boolean;
    lastSync: string | null;
    pendingItems: number;
  }> {
    const queue = await this.getSyncQueue();
    const { value: lastSync } = await Storage.get({ key: this.STORAGE_KEYS.LAST_SYNC });
    
    return {
      isOnline: this.isOnline,
      lastSync,
      pendingItems: queue.length
    };
  }
}

export default OfflineSyncService;