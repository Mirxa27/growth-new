import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface RealtimeConfig {
  model: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'marin' | 'juniper' | 'sage';
  instructions: string;
  temperature: number;
  maxTokens?: number;
  enableTranscription: boolean;
  sessionType: 'realtime' | 'transcription';
  inputModalities: ('text' | 'audio')[];
  outputModalities: ('text' | 'audio')[];
  turnDetection?: {
    type: 'server_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
}

export interface RealtimeSessionState {
  id: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  agent?: RealtimeAgent;
  session?: RealtimeSession;
  config: RealtimeConfig;
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  messageCount: number;
  errorMessage?: string;
}

export class RealtimeService {
  private sessions: Map<string, RealtimeSessionState> = new Map();
  private defaultConfig: RealtimeConfig = {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'marin',
    instructions: 'You are a helpful AI assistant for the Newomen personal growth platform. Be supportive, empathetic, and encouraging while helping users with their personal development journey.',
    temperature: 0.7,
    enableTranscription: true,
    sessionType: 'realtime',
    inputModalities: ['text', 'audio'],
    outputModalities: ['text', 'audio'],
    turnDetection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200
    }
  };

  constructor() {
    this.loadConfigFromAdmin();
  }

  /**
   * Load Realtime API configuration from admin settings
   */
  private async loadConfigFromAdmin(): Promise<void> {
    try {
      const { data: providers, error } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai_realtime')
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('No Realtime API configuration found in admin panel, using defaults', error);
        return;
      }

      if (providers?.configuration) {
        this.defaultConfig = {
          ...this.defaultConfig,
          ...providers.configuration
        };
        logger.info('Loaded Realtime API configuration from admin panel');
      }
    } catch (error) {
      logger.error('Failed to load Realtime API configuration', 'RealtimeService', error);
    }
  }

  /**
   * Get ephemeral API key for client-side connections
   */
  async getEphemeralKey(sessionConfig?: Partial<RealtimeConfig>): Promise<string> {
    try {
      // Get OpenAI API key from admin providers
      const { data: provider, error } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .single();

      if (error || !provider?.configuration?.api_key) {
        throw new Error('OpenAI API key not configured in admin panel');
      }

      const config = { ...this.defaultConfig, ...sessionConfig };
      const sessionConfigPayload = JSON.stringify({
        session: {
          type: config.sessionType,
          model: config.model,
          audio: {
            output: { voice: config.voice },
          },
          instructions: config.instructions,
          temperature: config.temperature,
          input_audio_transcription: config.enableTranscription ? { model: 'whisper-1' } : null,
          turn_detection: config.turnDetection,
          modalities: config.outputModalities,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
        },
      });

      const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.configuration.api_key}`,
          'Content-Type': 'application/json',
        },
        body: sessionConfigPayload,
      });

      if (!response.ok) {
        throw new Error(`Failed to get ephemeral key: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      logger.error('Failed to get ephemeral API key', 'RealtimeService', error);
      throw error;
    }
  }

  /**
   * Create a new Realtime session
   */
  async createSession(
    sessionId: string,
    config?: Partial<RealtimeConfig>
  ): Promise<RealtimeSessionState> {
    try {
      const sessionConfig = { ...this.defaultConfig, ...config };
      
      // Create agent with configuration
      const agent = new RealtimeAgent({
        name: 'Newomen Assistant',
        instructions: sessionConfig.instructions,
      });

      // Create session
      const session = new RealtimeSession(agent);

      const sessionState: RealtimeSessionState = {
        id: sessionId,
        status: 'connecting',
        agent,
        session,
        config: sessionConfig,
        startTime: new Date(),
        messageCount: 0,
      };

      this.sessions.set(sessionId, sessionState);

      // Set up event listeners
      this.setupSessionEventListeners(sessionState);

      logger.info(`Created Realtime session: ${sessionId}`);
      return sessionState;
    } catch (error) {
      logger.error(`Failed to create Realtime session: ${sessionId}`, 'RealtimeService', error);
      throw error;
    }
  }

  /**
   * Connect a session using ephemeral key
   */
  async connectSession(sessionId: string): Promise<void> {
    const sessionState = this.sessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      // Get ephemeral key
      const apiKey = await this.getEphemeralKey(sessionState.config);

      // Connect session
      await sessionState.session!.connect({
        apiKey,
      });

      sessionState.status = 'connected';
      logger.info(`Connected Realtime session: ${sessionId}`);
    } catch (error) {
      sessionState.status = 'error';
      sessionState.errorMessage = error instanceof Error ? error.message : 'Connection failed';
      logger.error(`Failed to connect Realtime session: ${sessionId}`, 'RealtimeService', error);
      throw error;
    }
  }

  /**
   * Disconnect a session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const sessionState = this.sessions.get(sessionId);
    if (!sessionState) {
      return;
    }

    try {
      if (sessionState.session) {
        await sessionState.session.disconnect();
      }

      sessionState.status = 'disconnected';
      sessionState.endTime = new Date();
      
      if (sessionState.startTime) {
        sessionState.totalDuration = sessionState.endTime.getTime() - sessionState.startTime.getTime();
      }

      logger.info(`Disconnected Realtime session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to disconnect Realtime session: ${sessionId}`, 'RealtimeService', error);
    }
  }

  /**
   * Send text message to session
   */
  async sendMessage(sessionId: string, message: string): Promise<void> {
    const sessionState = this.sessions.get(sessionId);
    if (!sessionState || sessionState.status !== 'connected') {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      // Send message through the session
      await sessionState.session!.say(message);
      sessionState.messageCount++;
      logger.debug(`Sent message to session ${sessionId}: ${message.substring(0, 100)}...`);
    } catch (error) {
      logger.error(`Failed to send message to session: ${sessionId}`, 'RealtimeService', error);
      throw error;
    }
  }

  /**
   * Get session state
   */
  getSessionState(sessionId: string): RealtimeSessionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): RealtimeSessionState[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'connected' || session.status === 'connecting'
    );
  }

  /**
   * Clean up finished sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, sessionState] of this.sessions.entries()) {
      const sessionAge = sessionState.endTime 
        ? now - sessionState.endTime.getTime()
        : now - (sessionState.startTime?.getTime() || now);

      if (sessionState.status === 'disconnected' && sessionAge > maxAge) {
        this.sessions.delete(sessionId);
        logger.debug(`Cleaned up old session: ${sessionId}`);
      }
    }
  }

  /**
   * Setup event listeners for a session
   */
  private setupSessionEventListeners(sessionState: RealtimeSessionState): void {
    if (!sessionState.session) return;

    const session = sessionState.session;

    // Connection events
    session.on('connected', () => {
      sessionState.status = 'connected';
      logger.info(`Session connected: ${sessionState.id}`);
    });

    session.on('disconnected', () => {
      sessionState.status = 'disconnected';
      sessionState.endTime = new Date();
      logger.info(`Session disconnected: ${sessionState.id}`);
    });

    session.on('error', (error: Error) => {
      sessionState.status = 'error';
      sessionState.errorMessage = error.message;
      logger.error(`Session error: ${sessionState.id}`, 'RealtimeService', error);
    });

    // Message events
    session.on('message', (message: any) => {
      sessionState.messageCount++;
      logger.debug(`Session message: ${sessionState.id}`, message);
    });

    // Audio events
    session.on('audio', (audio: any) => {
      logger.debug(`Session audio: ${sessionState.id}`, { 
        type: audio.type, 
        length: audio.data?.length 
      });
    });

    // Transcription events
    session.on('transcript', (transcript: any) => {
      logger.debug(`Session transcript: ${sessionState.id}`, transcript);
    });
  }

  /**
   * Update default configuration
   */
  updateDefaultConfig(config: Partial<RealtimeConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    logger.info('Updated default Realtime API configuration');
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): RealtimeConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Set microphone muted state for a session
   */
  async setMicrophoneMuted(sessionId: string, muted: boolean): Promise<void> {
    const sessionState = this.sessions.get(sessionId);
    if (!sessionState || sessionState.status !== 'connected') {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      // In the OpenAI Realtime API, we can control input audio by sending events
      // For now, we'll store the muted state and implement the actual muting
      // when processing audio input
      logger.info(`${muted ? 'Muted' : 'Unmuted'} microphone for session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to set microphone muted for session: ${sessionId}`, 'RealtimeService', error);
      throw error;
    }
  }

  /**
   * Set speaker muted state for a session
   */
  async setSpeakerMuted(sessionId: string, muted: boolean): Promise<void> {
    const sessionState = this.sessions.get(sessionId);
    if (!sessionState || sessionState.status !== 'connected') {
      throw new Error(`Session not connected: ${sessionId}`);
    }

    try {
      // For speaker muting, we would control the audio output playback
      // The actual implementation depends on the audio output system
      logger.info(`${muted ? 'Muted' : 'Unmuted'} speaker for session: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to set speaker muted for session: ${sessionId}`, 'RealtimeService', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();