/**
 * Services Index
 * Central export point for all application services
 */

// API Services
export { assessmentService } from './api/assessment.service';
export { voiceService } from './api/voice.service';
export { communityService } from './api/community.service';
export { adminService } from './api/admin.service';
export { aiProviderModelsService } from './ai-provider-models.service';

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