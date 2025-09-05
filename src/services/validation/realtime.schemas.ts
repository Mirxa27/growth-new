import { z } from 'zod';

/**
 * WebRTC and Real-time Communication Schemas
 */
export const WebRTCOfferSchema = z.object({
  sdp: z.string().min(1, 'SDP is required'),
  type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
  iceUfrag: z.string().optional(),
  icePwd: z.string().optional(),
});

export const WebRTCIceCandidateSchema = z.object({
  candidate: z.string(),
  sdpMLineIndex: z.number().int().min(0),
  sdpMid: z.string(),
  usernameFragment: z.string().optional(),
});

export const WebRTCSessionSchema = z.object({
  sessionId: z.string().min(1),
  peerId: z.string().optional(),
  offer: WebRTCOfferSchema.optional(),
  answer: WebRTCOfferSchema.optional(),
  iceCandidates: z.array(WebRTCIceCandidateSchema).optional(),
});

/**
 * Voice and Audio Communication Schemas
 */
export const VoiceMessageSchema = z.object({
  audioData: z.string(), // Base64 encoded audio
  duration: z.number().positive(),
  format: z.enum(['wav', 'mp3', 'ogg', 'webm']),
  sampleRate: z.number().int().positive().optional(),
  channels: z.number().int().positive().optional(),
});

export const VoiceChatSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  mode: z.enum(['voice-to-voice', 'voice-to-text', 'text-to-voice']),
  language: z.string().min(2).max(5).default('en'),
  provider: z.enum(['openai', 'google', 'azure']).default('openai'),
  model: z.string().optional(),
});

/**
 * Real-time Collaboration Schemas
 */
export const RealtimeEventSchema = z.object({
  type: z.enum(['join', 'leave', 'typing', 'message', 'reaction', 'status_change']),
  userId: z.string().uuid(),
  timestamp: z.date().default(() => new Date()),
  data: z.record(z.string(), z.any()).optional(),
  roomId: z.string().optional(),
});

export const CollaborationRoomSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['assessment', 'discussion', 'workshop', 'support_group']),
  maxParticipants: z.number().int().positive().max(100).default(10),
  isPrivate: z.boolean().default(false),
  settings: z.object({
    allowVoice: z.boolean().default(true),
    allowVideo: z.boolean().default(false),
    allowChat: z.boolean().default(true),
    allowScreenShare: z.boolean().default(false),
    recordSession: z.boolean().default(false),
  }).optional(),
});

/**
 * Progressive Web App Schemas
 */
export const PWAInstallSchema = z.object({
  platform: z.enum(['android', 'ios', 'desktop', 'unknown']),
  userAgent: z.string(),
  timestamp: z.date().default(() => new Date()),
  source: z.enum(['banner', 'menu', 'programmatic']),
});

export const PushNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  icon: z.string().url().optional(),
  image: z.string().url().optional(),
  badge: z.string().url().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().default(false),
  silent: z.boolean().default(false),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string().max(50),
    icon: z.string().url().optional(),
  })).max(2).optional(),
  data: z.record(z.string(), z.any()).optional(),
});

/**
 * Mobile-specific Schemas
 */
export const MobileGestureSchema = z.object({
  type: z.enum(['swipe', 'pinch', 'tap', 'long_press', 'double_tap']),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  startX: z.number(),
  startY: z.number(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  velocity: z.number().optional(),
  scale: z.number().optional(),
  timestamp: z.date().default(() => new Date()),
});

export const MobileDeviceInfoSchema = z.object({
  userAgent: z.string(),
  screenWidth: z.number().int().positive(),
  screenHeight: z.number().int().positive(),
  devicePixelRatio: z.number().positive(),
  orientation: z.enum(['portrait', 'landscape']),
  connectionType: z.enum(['wifi', 'cellular', 'ethernet', 'unknown']).optional(),
  batteryLevel: z.number().min(0).max(1).optional(),
  isCharging: z.boolean().optional(),
});

/**
 * Analytics and Tracking Schemas
 */
export const UserInteractionSchema = z.object({
  event: z.string().min(1),
  element: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const PerformanceMetricSchema = z.object({
  metric: z.enum(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'TTI']),
  value: z.number().positive(),
  timestamp: z.date().default(() => new Date()),
  url: z.string().url(),
  userAgent: z.string(),
  connectionType: z.string().optional(),
});

/**
 * Content Management Schemas
 */
export const ContentBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'image', 'video', 'audio', 'embed', 'quote', 'list']),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  order: z.number().int().min(0),
  settings: z.object({
    alignment: z.enum(['left', 'center', 'right']).optional(),
    size: z.enum(['small', 'medium', 'large']).optional(),
    style: z.string().optional(),
  }).optional(),
});

export const DynamicContentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  content: z.array(ContentBlockSchema),
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    publishedAt: z.date().optional(),
    updatedAt: z.date().optional(),
    version: z.number().int().positive().default(1),
  }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
});

// Export all schemas for easy importing
export const RealtimeSchemas = {
  WebRTCOfferSchema,
  WebRTCIceCandidateSchema,
  WebRTCSessionSchema,
  VoiceMessageSchema,
  VoiceChatSessionSchema,
  RealtimeEventSchema,
  CollaborationRoomSchema,
  PWAInstallSchema,
  PushNotificationSchema,
  MobileGestureSchema,
  MobileDeviceInfoSchema,
  UserInteractionSchema,
  PerformanceMetricSchema,
  ContentBlockSchema,
  DynamicContentSchema,
} as const;
