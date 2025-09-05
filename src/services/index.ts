// Services barrel export
export { supabase } from '@/integrations/supabase/client';

// API Services (export selectively to avoid name collisions)
export { voiceService } from './api/voice.service';
export * from './api/admin.service';
export * from './api/payment.service';
export * from './api/client.service';
export * from './api/base.service';

// Utility Services
export * from './ai/unified-ai.service';
export * from './cache/cache.service';
export * from './error/error-handler.service';
export * from './monitoring/performance.service';
export * from './notification/notification.service';
export * from './realtime/settings.service';
export * from './validation/validation.service';

// React Query Hooks
export * from '../hooks/useAssessments';
export * from '../hooks/useCommunity';
export * from '../hooks/useVoiceAgent';
