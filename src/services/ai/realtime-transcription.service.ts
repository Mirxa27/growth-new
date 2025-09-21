import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface TranscriptionConfig {
  model: string;
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  enable_word_timestamps?: boolean;
  enable_speaker_detection?: boolean;
}

export interface TranscriptionSession {
  id: string;
  ws: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  config: TranscriptionConfig;
  startTime: Date;
  endTime?: Date;
  transcriptCount: number;
  errorMessage?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  duration?: number;
  words?: {
    word: string;
    start: number;
    end: number;
    confidence: number;
  }[];
  speaker?: string;
}

export class RealtimeTranscriptionService {
  private sessions: Map<string, TranscriptionSession> = new Map();
  private defaultConfig: TranscriptionConfig = {
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    temperature: 0,
    enable_word_timestamps: true,
    enable_speaker_detection: false,
  };

  constructor() {
    this.loadConfigFromAdmin();
  }

  /**
   * Load transcription configuration from admin settings
   */
  private async loadConfigFromAdmin(): Promise<void> {
    try {
      const { data: providers, error } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai_transcription')
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('No transcription configuration found in admin panel, using defaults', error);
        return;
      }

      if (providers?.configuration) {
        this.defaultConfig = {
          ...this.defaultConfig,
          ...providers.configuration
        };
        logger.info('Loaded transcription configuration from admin panel');
      }
    } catch (error) {
      logger.error('Failed to load transcription configuration', 'RealtimeTranscriptionService', error);
    }
  }

  /**
   * Create a transcription session
   */
  async createTranscriptionSession(
    sessionId: string,
    config?: Partial<TranscriptionConfig>,
    onTranscript?: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<TranscriptionSession> {
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

      const sessionConfig = { ...this.defaultConfig, ...config };

      const session: TranscriptionSession = {
        id: sessionId,
        ws: null,
        status: 'connecting',
        config: sessionConfig,
        startTime: new Date(),
        transcriptCount: 0,
        onTranscript,
        onError,
      };

      this.sessions.set(sessionId, session);

      // Create WebSocket connection for transcription
      const url = 'wss://api.openai.com/v1/realtime?model=whisper-1';
      const ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${provider.configuration.api_key}`,
        },
      } as any);

      session.ws = ws;

      // Setup WebSocket event handlers
      this.setupTranscriptionHandlers(session);

      logger.info(`Created transcription session: ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to create transcription session: ${sessionId}`, 'RealtimeTranscriptionService', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers for transcription
   */
  private setupTranscriptionHandlers(session: TranscriptionSession): void {
    if (!session.ws) return;

    const ws = session.ws;

    ws.onopen = () => {
      session.status = 'connected';
      logger.info(`Transcription session connected: ${session.id}`);

      // Send session configuration for transcription
      this.sendTranscriptionConfig(session);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleTranscriptionEvent(session, message);
      } catch (error) {
        logger.error(`Failed to parse transcription message: ${session.id}`, 'RealtimeTranscriptionService', error);
      }
    };

    ws.onerror = (error) => {
      session.status = 'error';
      session.errorMessage = 'WebSocket error occurred';
      session.onError?.(session.errorMessage);
      logger.error(`Transcription WebSocket error: ${session.id}`, 'RealtimeTranscriptionService', error);
    };

    ws.onclose = (event) => {
      session.status = 'disconnected';
      session.endTime = new Date();
      logger.info(`Transcription session closed: ${session.id}`, { 
        code: event.code, 
        reason: event.reason 
      });
    };
  }

  /**
   * Send transcription configuration
   */
  private sendTranscriptionConfig(session: TranscriptionSession): void {
    if (!session.ws || session.ws.readyState !== WebSocket.OPEN) return;

    const config = {
      type: 'session.update',
      session: {
        type: 'transcription',
        model: session.config.model,
        input_audio_format: 'pcm16',
        input_audio_transcription: {
          model: session.config.model,
          language: session.config.language,
          prompt: session.config.prompt,
          temperature: session.config.temperature,
          response_format: session.config.response_format,
          timestamp_granularities: session.config.enable_word_timestamps ? ['word'] : ['segment'],
        },
      },
    };

    session.ws.send(JSON.stringify(config));
    logger.debug(`Sent transcription config: ${session.id}`);
  }

  /**
   * Handle transcription events
   */
  private handleTranscriptionEvent(session: TranscriptionSession, event: any): void {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        logger.debug(`Transcription session updated: ${session.id}`, event);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.handleTranscriptionResult(session, event);
        break;

      case 'conversation.item.input_audio_transcription.failed':
        const error = event.error?.message || 'Transcription failed';
        session.onError?.(error);
        logger.error(`Transcription failed: ${session.id}`, 'RealtimeTranscriptionService', event.error);
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
        session.onError?.(session.errorMessage);
        logger.error(`Transcription error: ${session.id}`, 'RealtimeTranscriptionService', event.error);
        break;

      default:
        logger.debug(`Unknown transcription event: ${event.type}`, event);
    }
  }

  /**
   * Handle transcription result
   */
  private handleTranscriptionResult(session: TranscriptionSession, event: any): void {
    try {
      const transcript = event.transcript;
      if (!transcript) return;

      session.transcriptCount++;

      // Extract transcription data
      const text = transcript.text || '';
      const isFinal = true; // Completed transcriptions are always final

      // Create transcription result
      const result: TranscriptionResult = {
        id: `${session.id}_${session.transcriptCount}`,
        text,
        confidence: transcript.confidence || 1.0,
        isFinal,
        timestamp: Date.now(),
        duration: transcript.duration,
        words: transcript.words?.map((word: any) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence || 1.0,
        })),
      };

      // Notify callback
      session.onTranscript?.(text, isFinal);

      logger.debug(`Transcription result: ${session.id}`, {
        text: text.substring(0, 100),
        confidence: result.confidence,
        wordCount: result.words?.length || 0,
      });
    } catch (error) {
      logger.error(`Failed to process transcription result: ${session.id}`, 'RealtimeTranscriptionService', error);
    }
  }

  /**
   * Send audio data for transcription
   */
  async sendAudioForTranscription(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Transcription session not connected: ${sessionId}`);
    }

    try {
      // Convert audio data to base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));

      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };

      session.ws.send(JSON.stringify(audioEvent));
      logger.debug(`Sent audio for transcription: ${sessionId}`, { 
        audioLength: audioData.byteLength 
      });
    } catch (error) {
      logger.error(`Failed to send audio for transcription: ${sessionId}`, 'RealtimeTranscriptionService', error);
      throw error;
    }
  }

  /**
   * Commit audio buffer for transcription
   */
  async commitTranscriptionBuffer(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Transcription session not connected: ${sessionId}`);
    }

    try {
      const commitEvent = {
        type: 'input_audio_buffer.commit',
      };

      session.ws.send(JSON.stringify(commitEvent));
      logger.debug(`Committed transcription buffer: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to commit transcription buffer: ${sessionId}`, 'RealtimeTranscriptionService', error);
      throw error;
    }
  }

  /**
   * Clear transcription buffer
   */
  async clearTranscriptionBuffer(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Transcription session not connected: ${sessionId}`);
    }

    try {
      const clearEvent = {
        type: 'input_audio_buffer.clear',
      };

      session.ws.send(JSON.stringify(clearEvent));
      logger.debug(`Cleared transcription buffer: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to clear transcription buffer: ${sessionId}`, 'RealtimeTranscriptionService', error);
      throw error;
    }
  }

  /**
   * Disconnect transcription session
   */
  async disconnectTranscriptionSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.close(1000, 'Normal closure');
      }

      session.status = 'disconnected';
      session.endTime = new Date();

      logger.info(`Disconnected transcription session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to disconnect transcription session: ${sessionId}`, 'RealtimeTranscriptionService', error);
    }
  }

  /**
   * Get transcription session
   */
  getTranscriptionSession(sessionId: string): TranscriptionSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active transcription sessions
   */
  getActiveTranscriptionSessions(): TranscriptionSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'connected' || session.status === 'connecting'
    );
  }

  /**
   * Clean up old transcription sessions
   */
  cleanupTranscriptionSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = session.endTime 
        ? now - session.endTime.getTime()
        : now - session.startTime.getTime();

      if (session.status === 'disconnected' && sessionAge > maxAge) {
        this.sessions.delete(sessionId);
        logger.debug(`Cleaned up old transcription session: ${sessionId}`);
      }
    }
  }

  /**
   * Update default configuration
   */
  updateDefaultConfig(config: Partial<TranscriptionConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    logger.info('Updated default transcription configuration');
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): TranscriptionConfig {
    return { ...this.defaultConfig };
  }
}

// Export singleton instance
export const realtimeTranscriptionService = new RealtimeTranscriptionService();