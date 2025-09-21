// Voice Components
export { default as VoiceAgent } from './VoiceAgent';
export { default as VoiceChat } from './VoiceChat';
export { default as TranscriptionPanel } from './TranscriptionPanel';
export { default as SessionManager } from './SessionManager';

// Voice Services
export { realtimeService } from '@/services/ai/realtime.service';
export { realtimeWebSocketService } from '@/services/ai/realtime-websocket.service';
export { realtimeTranscriptionService } from '@/services/ai/realtime-transcription.service';

// Types
export type { RealtimeConfig, RealtimeSessionState } from '@/services/ai/realtime.service';
export type { WebSocketRealtimeSession } from '@/services/ai/realtime-websocket.service';
export type { TranscriptionConfig, TranscriptionSession, TranscriptionResult } from '@/services/ai/realtime-transcription.service';

// Assessment Integration
export { default as VoiceEnabledAssessment } from '@/components/assessments/VoiceEnabledAssessment';

// Admin Components
export { default as RealtimeAPIConfig } from '@/components/admin/RealtimeAPIConfig';
export { default as VoiceTestingInterface } from '@/components/admin/VoiceTestingInterface';