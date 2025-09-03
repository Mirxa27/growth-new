/**
 * Services Index
 * Central export point for all application services
 */

// API Services
export { assessmentService } from './api/assessment.service';
export { voiceService } from './api/voice.service';
export { communityService } from './api/community.service';
export { adminService } from './api/admin.service';
export { paymentService } from './api/payment.service';
export { aiProviderModelsService } from './ai-provider-models.service';

// API Client
export { apiClient, api } from './api/client.service';

// AI Services
export { openaiService, openai } from './ai/openai.service';
export { anthropicService, anthropic } from './ai/anthropic.service';
export { googleAIService, googleAI } from './ai/google.service';
export { unifiedAI, ai } from './ai/unified-ai.service';

// Error Handling
export { errorHandler, handleError, getRecoveryStrategy } from './error/error-handler.service';
export { ErrorCategory, ErrorSeverity } from './error/error-handler.service';

// Cache
export { cache, cacheUtils, Cacheable } from './cache/cache.service';

// Performance Monitoring
export { performanceMonitor, measurePerformance } from './monitoring/performance.service';

// Notification Service
export { notificationService, notifications, NotificationType, NotificationChannel } from './notification/notification.service';

// Supabase Services
export { authService } from './supabase/auth.service';
export { realtimeService } from './supabase/realtime.service';
export { storageService } from './supabase/storage.service';

// Validation
export * from './validation/schemas';
export * from './validation/payment.schemas';

// Export types
export type {
  ApiResponse,
  ApiError,
  PaginationOptions,
  FilterOptions,
} from './api/base.service';

export type {
  Assessment,
  AssessmentInsert,
  AssessmentUpdate,
  AssessmentQuestion,
  AssessmentOption,
  UserAssessmentResult,
  AssessmentWithQuestions,
  AssessmentResult,
  AssessmentAnalytics,
} from './api/assessment.service';

export type {
  VoiceAgentConfig,
  VoiceAgentConfigInsert,
  VoiceAgentConfigUpdate,
  VoiceSession,
  VoiceToken,
  RealtimeConfig,
} from './api/voice.service';

export type {
  CommunityPost,
  CommunityPostInsert,
  CommunityPostUpdate,
  CommunityPostWithAuthor,
  PostComment,
  PostInteraction,
  CommunityStats,
} from './api/community.service';

export type {
  AdminUser,
  SystemSettings,
  AdminAnalytics,
  ContentModerationItem,
} from './api/admin.service';

export type {
  AIModel,
  Voice,
} from './ai-provider-models.service';

export type { 
  AIProvider 
} from './ai/unified-ai.service';

export type {
  SubscriptionPlan,
  Subscription,
  UserSubscription,
  Payment,
  PaymentConfig,
  SubscriptionWithPlan,
  PaymentIntent,
  CheckoutSession,
} from './api/payment.service';

export type {
  Notification,
} from './notification/notification.service';

// Supabase service types
export type {
  AuthProfile,
  AuthState
} from './supabase/auth.service';

export type {
  RealtimeEvent,
  RealtimeSubscription
} from './supabase/realtime.service';

export type {
  UploadOptions,
  DownloadOptions
} from './supabase/storage.service';