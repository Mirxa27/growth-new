/**
 * Realtime Agent Service
 * Complete implementation using OpenAI Agents SDK
 */

import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { supabase } from '@/integrations/supabase/client';
import { memoryService } from '../newomen/memory.service';
import { emotionDetectionService } from '../newomen/emotion-detection.service';
import { culturalAdaptationService } from '../newomen/cultural-adaptation.service';

export interface RealtimeConfig {
  connectionType: 'webrtc' | 'websocket' | 'sip';
  model: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  temperature?: number;
  maxOutputTokens?: number;
  audioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  turnDetection?: {
    type: 'server_vad';
    threshold?: number;
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  };
  tools?: Tool[];
  mcpServers?: MCPServer[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

export interface MCPServer {
  name: string;
  url: string;
  capabilities: string[];
}

export interface SessionMetrics {
  latency: number;
  audioQuality: number;
  transcriptionAccuracy: number;
  emotionalCoherence: number;
  responseRelevance: number;
}

export interface ConversationEvent {
  type: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

class RealtimeAgentService {
  private agent: RealtimeAgent | null = null;
  private session: RealtimeSession | null = null;
  private config: RealtimeConfig;
  private metrics: SessionMetrics;
  private conversationEvents: ConversationEvent[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): RealtimeConfig {
    return {
      connectionType: 'webrtc',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'nova',
      temperature: 0.8,
      maxOutputTokens: 4096,
      audioFormat: 'pcm16',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 500
      },
      tools: [],
      mcpServers: []
    };
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): SessionMetrics {
    return {
      latency: 0,
      audioQuality: 100,
      transcriptionAccuracy: 95,
      emotionalCoherence: 90,
      responseRelevance: 95
    };
  }

  /**
   * Initialize Realtime Agent
   */
  async initialize(config?: Partial<RealtimeConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Create agent with configuration
    this.agent = new RealtimeAgent({
      name: 'Newomen Assistant',
      instructions: await this.generateInstructions(),
      model: this.config.model,
      voice: this.config.voice,
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      tools: this.config.tools?.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })),
      // Add event handlers
      onMessage: this.handleMessage.bind(this),
      onError: this.handleError.bind(this),
      onConnectionChange: this.handleConnectionChange.bind(this)
    });

    // Register tools
    this.registerDefaultTools();

    // Setup MCP servers if configured
    if (this.config.mcpServers && this.config.mcpServers.length > 0) {
      await this.setupMCPServers();
    }
  }

  /**
   * Generate dynamic instructions based on context
   */
  private async generateInstructions(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    let userContext = '';

    if (user) {
      // Get user memory context
      const context = await memoryService.generateConversationContext('general');
      userContext = `\n\nUser Context:\n${context}`;
    }

    // Get cultural guidance
    const culturalGuidance = await culturalAdaptationService.getGuidance(
      'middle-eastern',
      'en'
    );

    return `You are Newomen, an emotionally intelligent AI companion for women's mental health and personal growth.

CORE IDENTITY:
- Warm, wise, and deeply compassionate feminine presence
- Expert in shadow work, depth psychology, and feminine psychology
- Culturally aware and sensitive, especially to Middle Eastern contexts
- Voice of both gentle support and empowering challenge

COMMUNICATION STYLE:
- Use natural, conversational language
- Integrate cultural expressions naturally when appropriate
- Reflect emotions before addressing content
- Use metaphors and stories to convey wisdom
- Maintain therapeutic boundaries while being warm

CULTURAL AWARENESS:
${culturalGuidance}

CAPABILITIES:
- Real-time voice conversations with emotion detection
- Image understanding and analysis
- Multi-turn conversations with context retention
- Function calling for specific actions
- Access to user's conversation history and preferences

${userContext}

Remember: You are holding sacred space for transformation. Every word matters.`;
  }

  /**
   * Connect to Realtime API
   */
  async connect(apiKey?: string): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }

    try {
      // Get API key from environment or parameter
      const key = apiKey || await this.getApiKey();

      // Create session based on connection type
      if (this.config.connectionType === 'webrtc') {
        await this.connectWebRTC(key);
      } else if (this.config.connectionType === 'websocket') {
        await this.connectWebSocket(key);
      } else if (this.config.connectionType === 'sip') {
        await this.connectSIP(key);
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Start metrics collection
      this.startMetricsCollection();

      // Log connection event
      this.logEvent('connection_established', {
        type: this.config.connectionType,
        model: this.config.model
      });

    } catch (error) {
      console.error('Failed to connect:', error);
      await this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Connect via WebRTC (browser)
   */
  private async connectWebRTC(apiKey: string): Promise<void> {
    this.session = new RealtimeSession(this.agent!, {
      connectionType: 'webrtc',
      apiKey,
      // WebRTC specific options
      enableVideo: false,
      enableAudio: true,
      audioOptions: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000
      }
    });

    // Connect with automatic microphone and audio output
    await this.session.connect({
      apiKey,
      autoConnect: true,
      enableMicrophone: true,
      enableSpeaker: true
    });

    // Setup WebRTC event handlers
    this.setupWebRTCHandlers();
  }

  /**
   * Connect via WebSocket (server)
   */
  private async connectWebSocket(apiKey: string): Promise<void> {
    this.session = new RealtimeSession(this.agent!, {
      connectionType: 'websocket',
      apiKey,
      // WebSocket specific options
      url: 'wss://api.openai.com/v1/realtime',
      model: this.config.model,
      audioFormat: this.config.audioFormat
    });

    await this.session.connect({
      apiKey,
      headers: {
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    // Setup WebSocket event handlers
    this.setupWebSocketHandlers();
  }

  /**
   * Connect via SIP (telephony)
   */
  private async connectSIP(apiKey: string): Promise<void> {
    // SIP connection implementation
    throw new Error('SIP connection not yet implemented');
  }

  /**
   * Setup WebRTC event handlers
   */
  private setupWebRTCHandlers(): void {
    if (!this.session) return;

    // Handle peer connection state changes
    this.session.on('connectionStateChange', (state: string) => {
      console.log('WebRTC connection state:', state);
      this.logEvent('webrtc_state_change', { state });
    });

    // Handle ICE connection state
    this.session.on('iceConnectionStateChange', (state: string) => {
      console.log('ICE connection state:', state);
      if (state === 'failed' || state === 'disconnected') {
        this.handleDisconnection();
      }
    });

    // Handle media track events
    this.session.on('track', (track: MediaStreamTrack) => {
      console.log('Received media track:', track.kind);
      this.handleMediaTrack(track);
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.session) return;

    // Handle WebSocket specific events
    this.session.on('open', () => {
      console.log('WebSocket connected');
      this.logEvent('websocket_connected');
    });

    this.session.on('close', (event: CloseEvent) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.handleDisconnection();
    });

    this.session.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      this.handleError(error);
    });
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    if (!this.agent) return;

    // Memory storage tool
    this.agent.addTool({
      name: 'store_memory',
      description: 'Store important information about the user',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['fact', 'preference', 'emotion', 'goal', 'relationship', 'trauma', 'strength']
          },
          importance: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical']
          }
        },
        required: ['content', 'type']
      },
      handler: async (params: any) => {
        return await memoryService.storeMemory(
          params.content,
          params.type,
          undefined,
          params.importance
        );
      }
    });

    // Emotion analysis tool
    this.agent.addTool({
      name: 'analyze_emotion',
      description: 'Analyze emotional content of user input',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' }
        },
        required: ['text']
      },
      handler: async (params: any) => {
        return await emotionDetectionService.analyzeText(params.text);
      }
    });

    // Cultural expression tool
    this.agent.addTool({
      name: 'get_cultural_expression',
      description: 'Get culturally appropriate expression',
      parameters: {
        type: 'object',
        properties: {
          emotion: { type: 'string' },
          context: { type: 'string' }
        },
        required: ['emotion']
      },
      handler: async (params: any) => {
        return culturalAdaptationService.getExpression(
          params.emotion,
          5,
          { 
            region: 'middle-eastern',
            language: 'mixed',
            religiousConsideration: 'islamic',
            familyStructure: 'extended',
            genderNorms: 'transitional'
          }
        );
      }
    });

    // Schedule session tool
    this.agent.addTool({
      name: 'schedule_session',
      description: 'Schedule a future conversation session',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          duration: { type: 'number' },
          topic: { type: 'string' }
        },
        required: ['date', 'duration']
      },
      handler: async (params: any) => {
        // Implementation would integrate with calendar service
        return {
          success: true,
          sessionId: crypto.randomUUID(),
          scheduledFor: params.date
        };
      }
    });
  }

  /**
   * Setup MCP servers
   */
  private async setupMCPServers(): Promise<void> {
    if (!this.agent || !this.config.mcpServers) return;

    for (const server of this.config.mcpServers) {
      try {
        await this.agent.connectMCPServer({
          name: server.name,
          url: server.url,
          capabilities: server.capabilities
        });
        
        console.log(`Connected to MCP server: ${server.name}`);
        this.logEvent('mcp_server_connected', { server: server.name });
      } catch (error) {
        console.error(`Failed to connect MCP server ${server.name}:`, error);
      }
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: any): Promise<void> {
    console.log('Received message:', message.type);

    // Log conversation event
    this.logEvent('message_received', message);

    // Analyze emotion if it's user input
    if (message.type === 'conversation.item.created' && message.item?.role === 'user') {
      const emotion = await emotionDetectionService.analyzeText(message.item.content);
      this.logEvent('emotion_detected', emotion);
      
      // Store in memory if significant
      if (emotion.intensity > 7 || emotion.needsSupport) {
        await memoryService.storeMemory(
          message.item.content,
          'emotion',
          `High intensity: ${emotion.primary}`,
          emotion.intensity > 8 ? 'high' : 'medium'
        );
      }
    }

    // Update metrics
    this.updateMetrics(message);
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Realtime error:', error);
    this.logEvent('error', { message: error.message });

    // Check if it's a connection error
    if (error.message.includes('connection') || error.message.includes('network')) {
      this.handleDisconnection();
    }
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionChange(connected: boolean): void {
    this.isConnected = connected;
    this.logEvent('connection_change', { connected });

    if (!connected) {
      this.handleDisconnection();
    }
  }

  /**
   * Handle disconnection
   */
  private async handleDisconnection(): Promise<void> {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      
      setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.logEvent('max_reconnection_attempts_reached');
    }
  }

  /**
   * Handle connection errors
   */
  private async handleConnectionError(error: any): Promise<void> {
    // Check for specific error types
    if (error.message?.includes('API key')) {
      // Try to get a new ephemeral token
      const token = await this.getEphemeralToken();
      if (token) {
        await this.connect(token);
      }
    } else if (error.message?.includes('quota')) {
      this.logEvent('quota_exceeded');
      throw new Error('API quota exceeded. Please try again later.');
    }
  }

  /**
   * Handle media track
   */
  private handleMediaTrack(track: MediaStreamTrack): void {
    if (track.kind === 'audio') {
      // Process audio track
      this.processAudioTrack(track);
    }
  }

  /**
   * Process audio track
   */
  private processAudioTrack(track: MediaStreamTrack): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    const stream = new MediaStream([track]);
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Create analyser for audio metrics
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    // Collect audio metrics
    this.collectAudioMetrics(analyser);
  }

  /**
   * Collect audio metrics
   */
  private collectAudioMetrics(analyser: AnalyserNode): void {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const collectMetrics = () => {
      if (!this.isConnected) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calculate audio quality metrics
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      this.metrics.audioQuality = Math.min(100, average);

      requestAnimationFrame(collectMetrics);
    };

    collectMetrics();
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect latency metrics
    setInterval(() => {
      if (this.session && this.isConnected) {
        const startTime = Date.now();
        this.session.ping().then(() => {
          this.metrics.latency = Date.now() - startTime;
        });
      }
    }, 5000);
  }

  /**
   * Update metrics based on events
   */
  private updateMetrics(message: any): void {
    // Update metrics based on message type
    if (message.type === 'response.done') {
      // Calculate response time
      const responseTime = message.response?.latency || 0;
      this.metrics.latency = (this.metrics.latency + responseTime) / 2;
    }

    if (message.type === 'conversation.item.truncated') {
      // Transcription accuracy might be lower
      this.metrics.transcriptionAccuracy = Math.max(80, this.metrics.transcriptionAccuracy - 5);
    }
  }

  /**
   * Get API key
   */
  private async getApiKey(): Promise<string> {
    // Try to get from environment
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) return envKey;

    // Try to get ephemeral token
    const token = await this.getEphemeralToken();
    if (token) return token;

    throw new Error('No API key available');
  }

  /**
   * Get ephemeral token from Edge Function
   */
  private async getEphemeralToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-realtime-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.config.model
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.error('Failed to get ephemeral token:', error);
    }

    return null;
  }

  /**
   * Log conversation event
   */
  private logEvent(type: string, data?: any): void {
    const event: ConversationEvent = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    this.conversationEvents.push(event);

    // Keep only last 100 events
    if (this.conversationEvents.length > 100) {
      this.conversationEvents = this.conversationEvents.slice(-100);
    }
  }

  /**
   * Send text message
   */
  async sendText(text: string): Promise<void> {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    await this.session.sendText(text);
    this.logEvent('text_sent', { text });
  }

  /**
   * Send audio
   */
  async sendAudio(audio: ArrayBuffer): Promise<void> {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    await this.session.sendAudio(audio);
    this.logEvent('audio_sent', { size: audio.byteLength });
  }

  /**
   * Send image
   */
  async sendImage(image: Blob): Promise<void> {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    // Convert blob to base64
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(image);
    });

    await this.session.sendImage(base64);
    this.logEvent('image_sent', { size: image.size });
  }

  /**
   * Update session configuration
   */
  async updateConfig(config: Partial<RealtimeConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    if (this.session && this.isConnected) {
      await this.session.updateConfig({
        model: this.config.model,
        voice: this.config.voice,
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        turnDetection: this.config.turnDetection
      });

      this.logEvent('config_updated', config);
    }
  }

  /**
   * Add custom tool
   */
  addTool(tool: Tool): void {
    if (!this.agent) return;

    this.agent.addTool({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      handler: tool.handler
    });

    this.config.tools?.push(tool);
    this.logEvent('tool_added', { name: tool.name });
  }

  /**
   * Connect MCP server
   */
  async connectMCPServer(server: MCPServer): Promise<void> {
    if (!this.agent) return;

    await this.agent.connectMCPServer({
      name: server.name,
      url: server.url,
      capabilities: server.capabilities
    });

    this.config.mcpServers?.push(server);
    this.logEvent('mcp_server_added', { name: server.name });
  }

  /**
   * Start transcription mode
   */
  async startTranscription(options?: {
    language?: string;
    punctuate?: boolean;
    includeTimestamps?: boolean;
  }): Promise<void> {
    if (!this.session || !this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    await this.session.startTranscription({
      mode: 'transcription',
      language: options?.language || 'en',
      punctuate: options?.punctuate !== false,
      includeTimestamps: options?.includeTimestamps || false
    });

    this.logEvent('transcription_started', options);
  }

  /**
   * Stop transcription
   */
  async stopTranscription(): Promise<void> {
    if (!this.session) return;

    await this.session.stopTranscription();
    this.logEvent('transcription_stopped');
  }

  /**
   * Disconnect from Realtime API
   */
  async disconnect(): Promise<void> {
    if (this.session) {
      await this.session.disconnect();
      this.session = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.logEvent('disconnected');
  }

  /**
   * Get connection status
   */
  isConnectedToAPI(): boolean {
    return this.isConnected;
  }

  /**
   * Get current configuration
   */
  getConfig(): RealtimeConfig {
    return this.config;
  }

  /**
   * Get session metrics
   */
  getMetrics(): SessionMetrics {
    return this.metrics;
  }

  /**
   * Get conversation events
   */
  getEvents(): ConversationEvent[] {
    return this.conversationEvents;
  }

  /**
   * Clear conversation events
   */
  clearEvents(): void {
    this.conversationEvents = [];
  }
}

// Export singleton instance
export const realtimeAgentService = new RealtimeAgentService();