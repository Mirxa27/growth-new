/**
 * WebRTC Signaling Server
 * Handles WebRTC offer/answer exchange for real-time communication
 */

import { z } from 'zod';

// Validation schema for WebRTC offer
const WebRTCOfferSchema = z.object({
  sdp: z.string().min(1, 'SDP is required'),
  type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
  iceUfrag: z.string().optional(),
  icePwd: z.string().optional(),
});

interface WebRTCSession {
  id: string;
  offer: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceServers: RTCIceServer[];
  createdAt: Date;
  expiresAt: Date;
}

// In-memory session storage (in production, use Redis or database)
const activeSessions = new Map<string, WebRTCSession>();

// STUN/TURN servers configuration
const getIceServers = (): RTCIceServer[] => [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Add TURN servers for production
  ...(import.meta.env.VITE_TURN_SERVER_URL ? [{
    urls: import.meta.env.VITE_TURN_SERVER_URL,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  }] : [])
];

// Clean expired sessions
const cleanExpiredSessions = () => {
  const now = new Date();
  for (const [id, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(id);
    }
  }
};

/**
 * WebRTC Signaling Service
 * Manages peer-to-peer connection establishment
 */
export class WebRTCSignalingService {
  /**
   * Process WebRTC offer and create session
   */
  static async processOffer(offerData: unknown): Promise<{
    sessionId: string;
    iceServers: RTCIceServer[];
    created: Date;
    expires: Date;
    message: string;
  }> {
    // Clean expired sessions
    cleanExpiredSessions();

    // Validate request data
    const validationResult = WebRTCOfferSchema.safeParse(offerData);
    if (!validationResult.success) {
      throw new Error(`Invalid offer data: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
    }

    const { sdp, type } = validationResult.data;

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create WebRTC session
    const session: WebRTCSession = {
      id: sessionId,
      offer: { sdp, type },
      iceServers: getIceServers(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    // Store session
    activeSessions.set(sessionId, session);

    // Log for debugging (remove sensitive data)
    console.log('WebRTC session created:', {
      sessionId,
      type,
      sdpLength: sdp.length,
      iceServers: session.iceServers.length
    });

    return {
      sessionId,
      iceServers: session.iceServers,
      created: session.createdAt,
      expires: session.expiresAt,
      message: 'WebRTC offer processed successfully'
    };
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): WebRTCSession | null {
    cleanExpiredSessions();
    return activeSessions.get(sessionId) || null;
  }

  /**
   * Update session with answer
   */
  static updateSessionAnswer(sessionId: string, answer: RTCSessionDescriptionInit): boolean {
    const session = activeSessions.get(sessionId);
    if (!session) return false;

    session.answer = answer;
    activeSessions.set(sessionId, session);
    return true;
  }

  /**
   * Delete session
   */
  static deleteSession(sessionId: string): boolean {
    return activeSessions.delete(sessionId);
  }

  /**
   * Get active sessions count
   */
  static getActiveSessionsCount(): number {
    cleanExpiredSessions();
    return activeSessions.size;
  }
}

// For backwards compatibility, export a handler function
export const handleWebRTCOffer = async (offerData: unknown) => {
  try {
    return await WebRTCSignalingService.processOffer(offerData);
  } catch (error) {
    console.error('WebRTC offer processing error:', error);
    throw error;
  }
};