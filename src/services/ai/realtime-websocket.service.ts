import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { RealtimeConfig } from './realtime.service';

export interface WebSocketRealtimeSession {
  id: string;
  ws: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  config: RealtimeConfig;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  errorMessage?: string;
  conversationId?: string;
}

export class RealtimeWebSocketService {
  private sessions: Map<string, WebSocketRealtimeSession> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 3;

  /**
   * Create a WebSocket-based Realtime session
   */
  async createWebSocketSession(
    sessionId: string,
    config: RealtimeConfig
  ): Promise<WebSocketRealtimeSession> {
    try {
      // Get OpenAI API key
      const { data: provider, error } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .single();

      if (error || !provider?.configuration?.api_key) {
        throw new Error('OpenAI API key not configured in admin panel');
      }

      const session: WebSocketRealtimeSession = {
        id: sessionId,
        ws: null,
        status: 'connecting',
        config,
        startTime: new Date(),
        messageCount: 0,
      };

      this.sessions.set(sessionId, session);

      // Create WebSocket connection
      const url = `wss://api.openai.com/v1/realtime?model=${config.model}`;
      const ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${provider.configuration.api_key}`,
        },
      } as any);

      session.ws = ws;

      // Setup WebSocket event handlers
      this.setupWebSocketHandlers(session);

      logger.info(`Created WebSocket Realtime session: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to create WebSocket Realtime session: ${sessionId}`, 'RealtimeWebSocketService', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(session: WebSocketRealtimeSession): void {
    if (!session.ws) return;

    const ws = session.ws;

    ws.onopen = () => {
      session.status = 'connected';
      this.reconnectAttempts.delete(session.id);
      logger.info(`WebSocket session connected: ${session.id}`);

      // Send initial session configuration
      this.sendSessionUpdate(session);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleServerEvent(session, message);
      } catch (error) {
        logger.error(`Failed to parse WebSocket message: ${session.id}`, 'RealtimeWebSocketService', error);
      }
    };

    ws.onerror = (error) => {
      session.status = 'error';
      session.errorMessage = 'WebSocket error occurred';
      logger.error(`WebSocket error: ${session.id}`, 'RealtimeWebSocketService', error);
    };

    ws.onclose = (event) => {
      session.status = 'disconnected';
      session.endTime = new Date();
      logger.info(`WebSocket session closed: ${session.id}`, { code: event.code, reason: event.reason });

      // Attempt reconnection if not intentionally closed
      if (event.code !== 1000 && event.code !== 1001) {
        this.attemptReconnection(session);
      }
    };
  }

  /**
   * Send session update configuration
   */
  private sendSessionUpdate(session: WebSocketRealtimeSession): void {
    if (!session.ws || session.ws.readyState !== WebSocket.OPEN) return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        type: session.config.sessionType,
        model: session.config.model,
        instructions: session.config.instructions,
        voice: session.config.voice,
        temperature: session.config.temperature,
        max_response_output_tokens: session.config.maxTokens,
        modalities: session.config.outputModalities,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: session.config.enableTranscription ? {
          model: 'whisper-1'
        } : null,
        turn_detection: session.config.turnDetection,
        audio: {
          output: { voice: session.config.voice }
        }
      },
    };

    session.ws.send(JSON.stringify(sessionUpdate));
    logger.debug(`Sent session update: ${session.id}`);
  }

  /**
   * Handle server events from WebSocket
   */
  private handleServerEvent(session: WebSocketRealtimeSession, event: any): void {
    session.messageCount++;

    switch (event.type) {
      case 'session.created':
        logger.debug(`Session created: ${session.id}`, event);
        break;

      case 'session.updated':
        logger.debug(`Session updated: ${session.id}`, event);
        break;

      case 'conversation.item.created':
      case 'conversation.item.added':
        logger.debug(`Conversation item created: ${session.id}`, event);
        break;

      case 'response.created':
        logger.debug(`Response created: ${session.id}`, event);
        break;

      case 'response.output_item.added':
        logger.debug(`Response output item added: ${session.id}`, event);
        break;

      case 'response.output_item.done':
        logger.debug(`Response output item done: ${session.id}`, event);
        break;

      case 'response.output_text.delta':
        logger.debug(`Text delta: ${session.id}`, { delta: event.delta });
        break;

      case 'response.output_audio.delta':
        logger.debug(`Audio delta: ${session.id}`, { 
          audioLength: event.delta ? event.delta.length : 0 
        });
        break;

      case 'response.output_audio_transcript.delta':
        logger.debug(`Audio transcript delta: ${session.id}`, { delta: event.delta });
        break;

      case 'input_audio_buffer.speech_started':
        logger.debug(`Speech started: ${session.id}`);
        break;

      case 'input_audio_buffer.speech_stopped':
        logger.debug(`Speech stopped: ${session.id}`);
        break;

      case 'error':
        session.status = 'error';
        session.errorMessage = event.error?.message || 'Unknown error';
        logger.error(`Session error: ${session.id}`, 'RealtimeWebSocketService', event.error);
        break;

      default:
        logger.debug(`Unknown event type: ${event.type}`, event);
    }
  }

  /**
   * Send audio data to session
   */
  async sendAudio(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      // Convert audio data to base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));

      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };

      session.ws.send(JSON.stringify(audioEvent));
      logger.debug(`Sent audio data to session: ${sessionId}`, { 
        audioLength: audioData.byteLength 
      });
    } catch (error) {
      logger.error(`Failed to send audio to session: ${sessionId}`, 'RealtimeWebSocketService', error);
      throw error;
    }
  }

  /**
   * Send text message to session
   */
  async sendMessage(sessionId: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      const textEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: message,
            },
          ],
        },
      };

      session.ws.send(JSON.stringify(textEvent));

      // Trigger response generation
      const responseEvent = {
        type: 'response.create',
      };

      session.ws.send(JSON.stringify(responseEvent));

      logger.debug(`Sent message to session: ${sessionId}`, { 
        message: message.substring(0, 100) + '...' 
      });
    } catch (error) {
      logger.error(`Failed to send message to session: ${sessionId}`, 'RealtimeWebSocketService', error);
      throw error;
    }
  }

  /**
   * Commit audio input buffer and generate response
   */
  async commitAudioBuffer(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      const commitEvent = {
        type: 'input_audio_buffer.commit',
      };

      session.ws.send(JSON.stringify(commitEvent));

      // Generate response
      const responseEvent = {
        type: 'response.create',
      };

      session.ws.send(JSON.stringify(responseEvent));

      logger.debug(`Committed audio buffer for session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to commit audio buffer: ${sessionId}`, 'RealtimeWebSocketService', error);
      throw error;
    }
  }

  /**
   * Clear audio input buffer
   */
  async clearAudioBuffer(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      const clearEvent = {
        type: 'input_audio_buffer.clear',
      };

      session.ws.send(JSON.stringify(clearEvent));
      logger.debug(`Cleared audio buffer for session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to clear audio buffer: ${sessionId}`, 'RealtimeWebSocketService', error);
      throw error;
    }
  }

  /**
   * Disconnect session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.close(1000, 'Normal closure');
      }

      session.status = 'disconnected';
      session.endTime = new Date();
      this.reconnectAttempts.delete(sessionId);

      logger.info(`Disconnected WebSocket session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to disconnect WebSocket session: ${sessionId}`, 'RealtimeWebSocketService', error);
    }
  }

  /**
   * Attempt to reconnect a session
   */
  private async attemptReconnection(session: WebSocketRealtimeSession): Promise<void> {
    const attempts = this.reconnectAttempts.get(session.id) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      logger.warn(`Max reconnection attempts reached for session: ${session.id}`);
      session.status = 'error';
      session.errorMessage = 'Max reconnection attempts exceeded';
      return;
    }

    this.reconnectAttempts.set(session.id, attempts + 1);

    // Wait before reconnecting (exponential backoff)
    const delay = Math.pow(2, attempts) * 1000;
    setTimeout(() => {
      logger.info(`Attempting to reconnect session: ${session.id} (attempt ${attempts + 1})`);
      this.createWebSocketSession(session.id, session.config);
    }, delay);
  }

  /**
   * Get session state
   */
  getSession(sessionId: string): WebSocketRealtimeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WebSocketRealtimeSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'connected' || session.status === 'connecting'
    );
  }

  /**
   * Clean up old sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = session.endTime 
        ? now - session.endTime.getTime()
        : now - session.startTime.getTime();

      if (session.status === 'disconnected' && sessionAge > maxAge) {
        this.sessions.delete(sessionId);
        this.reconnectAttempts.delete(sessionId);
        logger.debug(`Cleaned up old WebSocket session: ${sessionId}`);
      }
    }
  }
}

// Export singleton instance
export const realtimeWebSocketService = new RealtimeWebSocketService();