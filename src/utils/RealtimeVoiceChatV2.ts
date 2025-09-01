/**
 * Enhanced Realtime Voice Chat with proper error handling and session management
 */

import { supabase } from '@/integrations/supabase/client';
import { AudioQueue } from './AudioQueue';
import { openAIModelsService } from '@/services/openai-models.service';

export interface RealtimeConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  temperature?: number;
  maxResponseTokens?: number;
  turnDetection?: {
    type: 'server_vad';
    threshold?: number;
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  };
}

export class RealtimeVoiceChatV2 {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private audioQueue: AudioQueue | null = null;
  private sessionCreated: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private config: RealtimeConfig;

  private onMessageCallback: (data: unknown) => void;
  private onTranscriptCallback: (text: string, isFinal: boolean) => void;
  private onSpeakingChangeCallback: (isSpeaking: boolean) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(
    onMessage: (data: unknown) => void,
    onTranscript: (text: string, isFinal: boolean) => void,
    onSpeakingChange: (isSpeaking: boolean) => void,
    onError?: (error: Error) => void,
    config?: RealtimeConfig
  ) {
    this.onMessageCallback = onMessage;
    this.onTranscriptCallback = onTranscript;
    this.onSpeakingChangeCallback = onSpeakingChange;
    this.onErrorCallback = onError;
    
    // Default configuration
    this.config = {
      model: openAIModelsService.getRecommendedModel('voice'),
      voice: 'alloy',
      instructions: "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful. Help users with meditation, goal setting, and personal development.",
      temperature: 0.8,
      maxResponseTokens: 4096,
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 500
      },
      ...config
    };
  }

  /**
   * Connect to the Realtime API
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      // Get authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required for voice chat');
      }

      // Get ephemeral token from Edge Function
      const tokenResponse = await this.getEphemeralToken(session.access_token);
      
      if (!tokenResponse.client_secret) {
        throw new Error('Failed to obtain voice session token');
      }

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect to WebSocket with proper model
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
      this.ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${tokenResponse.client_secret}`
      ]);

      this.setupWebSocketHandlers();

    } catch (error) {
      this.isConnecting = false;
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('Failed to connect:', errorMessage);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(errorMessage));
      }
      
      this.onMessageCallback({ 
        type: 'error', 
        error: { message: errorMessage } 
      });
      
      throw error;
    }
  }

  /**
   * Get ephemeral token from Edge Function
   */
  private async getEphemeralToken(accessToken: string): Promise<any> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-realtime-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-application-name': 'newme-app',
          'x-application-version': '1.0.0'
        },
        body: JSON.stringify({
          model: this.config.model,
          voice: this.config.voice
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to create voice session' };
      }
      
      const errorMessage = errorData.error || 'Failed to create voice session';
      
      if (response.status === 400 && errorMessage.includes('OpenAI API')) {
        throw new Error('Voice chat unavailable: Please configure OpenAI API key in settings');
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected, waiting for session.created');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.sessionCreated = false;
      this.onMessageCallback({ type: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onMessageCallback({ 
        type: 'error', 
        error: { message: 'WebSocket connection error' } 
      });
      
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('WebSocket connection error'));
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.sessionCreated = false;
      this.onMessageCallback({ type: 'disconnected' });
      
      // Attempt reconnection if not intentional close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else {
        this.cleanup();
      }
    };
  }

  /**
   * Handle Realtime API messages
   */
  private handleRealtimeMessage(data: any): void {
    // Always forward to callback
    this.onMessageCallback(data);

    switch (data.type) {
      case 'session.created':
        console.log('Session created, configuring...');
        this.sessionCreated = true;
        this.configureSession();
        break;

      case 'session.updated':
        console.log('Session configuration updated');
        break;

      case 'error':
        console.error('Realtime API error:', data.error);
        if (this.onErrorCallback && data.error) {
          this.onErrorCallback(new Error(data.error.message || 'Realtime API error'));
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (data.transcript) {
          this.onTranscriptCallback(data.transcript, true);
        }
        break;

      case 'response.audio_transcript.delta':
        if (data.delta?.text) {
          this.onTranscriptCallback(data.delta.text, false);
        }
        break;

      case 'response.audio.start':
        this.onSpeakingChangeCallback(true);
        break;

      case 'response.audio.done':
        this.onSpeakingChangeCallback(false);
        break;

      case 'response.audio.delta':
        if (data.delta?.audio) {
          this.playAudio(data.delta.audio);
        }
        break;

      case 'response.done':
        console.log('Response completed');
        break;

      case 'conversation.item.created':
        console.log('Conversation item created:', data.item?.role);
        break;

      default:
        // Log unknown message types for debugging
        if (data.type && !data.type.startsWith('response.') && !data.type.startsWith('conversation.')) {
          console.log('Unknown message type:', data.type);
        }
    }
  }

  /**
   * Configure the session after creation
   */
  private configureSession(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionCreated) {
      console.warn('Cannot configure session: WebSocket not ready or session not created');
      return;
    }

    const sessionConfig = {
      type: 'session.update',
      session: {
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: this.config.turnDetection,
        temperature: this.config.temperature,
        max_response_output_tokens: this.config.maxResponseTokens
      }
    };

    console.log('Sending session configuration:', sessionConfig);
    this.ws.send(JSON.stringify(sessionConfig));
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    // Wait before reconnecting (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  /**
   * Start recording audio
   */
  public async startRecording(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.sessionCreated) {
      throw new Error('Session not created yet');
    }

    try {
      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      });

      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 24000 });
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Load audio worklet
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      // Handle audio data from worklet
      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && this.ws?.readyState === WebSocket.OPEN) {
          const base64Audio = this.arrayBufferToBase64(event.data.audio);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };

      // Connect audio pipeline
      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): void {
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Send input audio buffer commit
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }

    console.log('Recording stopped');
  }

  /**
   * Send a text message
   */
  public sendMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.sessionCreated) {
      throw new Error('Session not created yet');
    }

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    }));

    // Trigger response generation
    this.ws.send(JSON.stringify({
      type: 'response.create'
    }));
  }

  /**
   * Play audio from base64
   */
  private playAudio(base64Audio: string): void {
    if (!this.audioQueue) return;

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const float32Array = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32Array.length; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      }

      this.audioQueue.enqueue(float32Array);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect(): void {
    this.stopRecording();
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'User disconnected');
      }
      this.ws = null;
    }

    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.sessionCreated = false;
    this.isConnecting = false;

    if (this.audioQueue) {
      this.audioQueue.clear();
      this.audioQueue = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.sessionCreated;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If connected, update session
    if (this.isConnected()) {
      this.configureSession();
    }
  }
}