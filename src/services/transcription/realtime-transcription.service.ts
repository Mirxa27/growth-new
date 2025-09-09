/**
 * Realtime Transcription Service
 * Implements OpenAI Realtime API for real-time audio transcription
 */

import { EventEmitter } from 'events';
import { env } from '@/config/environment';

export interface TranscriptionConfig {
  model?: 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe' | 'whisper-1';
  language?: string;
  prompt?: string;
  audioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  noiseReduction?: 'near_field' | 'far_field' | null;
  vadThreshold?: number;
  vadSilenceDuration?: number;
  vadPrefixPadding?: number;
  includeLogprobs?: boolean;
}

export interface TranscriptionEvent {
  type: 'delta' | 'completed' | 'error' | 'connected' | 'disconnected';
  itemId?: string;
  contentIndex?: number;
  delta?: string;
  transcript?: string;
  confidence?: number;
  error?: string;
}

export interface TranscriptionSession {
  id: string;
  status: 'connecting' | 'connected' | 'transcribing' | 'disconnected' | 'error';
  config: TranscriptionConfig;
  startTime: number;
  totalAudioDuration: number;
}

class RealtimeTranscriptionService extends EventEmitter {
  private websocket: WebSocket | null = null;
  private session: TranscriptionSession | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: AudioWorkletNode | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor() {
    super();
  }

  /**
   * Start a new transcription session
   */
  async startTranscription(config: TranscriptionConfig = {}): Promise<void> {
    try {
      // Set up default configuration
      const defaultConfig: Required<TranscriptionConfig> = {
        model: 'gpt-4o-transcribe',
        language: 'en',
        prompt: '',
        audioFormat: 'pcm16',
        noiseReduction: 'near_field',
        vadThreshold: 0.5,
        vadSilenceDuration: 500,
        vadPrefixPadding: 300,
        includeLogprobs: true
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Initialize audio context
      await this.initializeAudio();

      // Create session
      this.session = {
        id: `transcription_${Date.now()}`,
        status: 'connecting',
        config: finalConfig,
        startTime: Date.now(),
        totalAudioDuration: 0
      };

      // Connect to OpenAI Realtime API
      await this.connectWebSocket();

      this.emit('sessionStarted', this.session);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.emit('error', { type: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Stop the current transcription session
   */
  async stopTranscription(): Promise<void> {
    try {
      // Stop audio processing
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Close WebSocket
      if (this.websocket) {
        this.websocket.close(1000, 'Session ended');
        this.websocket = null;
      }

      // Update session status
      if (this.session) {
        this.session.status = 'disconnected';
        this.emit('sessionEnded', this.session);
        this.session = null;
      }

      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Error stopping transcription:', error);
      this.emit('error', { type: 'error', error: error.message });
    }
  }

  /**
   * Initialize audio context and get microphone access
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });

      // Load audio worklet for processing
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');

      // Create audio processor
      this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      // Handle processed audio data
      this.processor.port.onmessage = (event) => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.sendAudioData(event.data.audioBuffer);
        }
      };

      // Connect audio source to processor
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.processor);

    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw new Error('Microphone access required for transcription');
    }
  }

  /**
   * Connect to OpenAI Realtime API via WebSocket
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiKey = env.openai.apiKey;
        if (!apiKey || apiKey === 'your-openai-api-key-here') {
          throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your Vercel environment variables.');
        }

        // Connect to OpenAI Realtime API
        const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
        this.websocket = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${apiKey}`]);

        this.websocket.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          this.session!.status = 'connected';
          this.initializeTranscriptionSession();
          this.emit('connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(JSON.parse(event.data));
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.session!.status = 'disconnected';
          this.emit('disconnected');
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', { type: 'error', error: 'Connection failed' });
          reject(new Error('Failed to connect to transcription service'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize the transcription session with OpenAI
   */
  private initializeTranscriptionSession(): void {
    if (!this.websocket || !this.session) return;

    const sessionConfig = {
      type: 'transcription_session.update',
      input_audio_format: this.session.config.audioFormat,
      input_audio_transcription: {
        model: this.session.config.model,
        prompt: this.session.config.prompt,
        language: this.session.config.language
      },
      turn_detection: {
        type: 'server_vad',
        threshold: this.session.config.vadThreshold,
        prefix_padding_ms: this.session.config.vadPrefixPadding,
        silence_duration_ms: this.session.config.vadSilenceDuration
      },
      input_audio_noise_reduction: this.session.config.noiseReduction ? {
        type: this.session.config.noiseReduction
      } : null,
      include: this.session.config.includeLogprobs ? [
        'item.input_audio_transcription.logprobs'
      ] : []
    };

    this.websocket.send(JSON.stringify(sessionConfig));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.delta':
        this.handleTranscriptionDelta(message);
        break;
      
      case 'conversation.item.input_audio_transcription.completed':
        this.handleTranscriptionCompleted(message);
        break;
      
      case 'input_audio_buffer.committed':
        this.handleAudioBufferCommitted(message);
        break;
      
      case 'error':
        this.handleError(message);
        break;
      
      case 'session.created':
        console.log('Transcription session created:', message.session.id);
        break;
      
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  /**
   * Handle transcription delta events
   */
  private handleTranscriptionDelta(message: any): void {
    const event: TranscriptionEvent = {
      type: 'delta',
      itemId: message.item_id,
      contentIndex: message.content_index,
      delta: message.delta
    };

    this.emit('transcription', event);
  }

  /**
   * Handle transcription completed events
   */
  private handleTranscriptionCompleted(message: any): void {
    // Calculate confidence from logprobs if available
    let confidence = 0.8; // Default confidence
    if (message.logprobs && message.logprobs.length > 0) {
      const avgLogprob = message.logprobs.reduce((sum: number, token: any) => 
        sum + token.logprob, 0) / message.logprobs.length;
      confidence = Math.exp(avgLogprob);
    }

    const event: TranscriptionEvent = {
      type: 'completed',
      itemId: message.item_id,
      contentIndex: message.content_index,
      transcript: message.transcript,
      confidence
    };

    this.emit('transcription', event);
  }

  /**
   * Handle audio buffer committed events
   */
  private handleAudioBufferCommitted(message: any): void {
    if (this.session) {
      this.session.status = 'transcribing';
      this.emit('audioCommitted', {
        itemId: message.item_id,
        previousItemId: message.previous_item_id
      });
    }
  }

  /**
   * Handle error messages
   */
  private handleError(message: any): void {
    console.error('Transcription error:', message);
    const event: TranscriptionEvent = {
      type: 'error',
      error: message.error?.message || 'Unknown transcription error'
    };

    this.emit('error', event);
  }

  /**
   * Send audio data to the transcription service
   */
  private sendAudioData(audioBuffer: Float32Array): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert Float32Array to base64 PCM16
    const pcm16Buffer = this.convertToPCM16(audioBuffer);
    const base64Audio = this.arrayBufferToBase64(pcm16Buffer);

    const audioMessage = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };

    this.websocket.send(JSON.stringify(audioMessage));
  }

  /**
   * Convert Float32Array to PCM16
   */
  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return buffer;
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
   * Attempt to reconnect to the service
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('Reconnection failed:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.emit('error', { 
            type: 'error', 
            error: 'Failed to reconnect to transcription service' 
          });
        }
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Get current session information
   */
  getSession(): TranscriptionSession | null {
    return this.session;
  }

  /**
   * Check if transcription is active
   */
  isTranscribing(): boolean {
    return this.session?.status === 'transcribing' || this.session?.status === 'connected';
  }

  /**
   * Manually commit audio buffer (when VAD is disabled)
   */
  commitAudioBuffer(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
  }

  /**
   * Clear audio buffer
   */
  clearAudioBuffer(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'input_audio_buffer.clear'
      }));
    }
  }
}

// Export singleton instance
export const realtimeTranscriptionService = new RealtimeTranscriptionService();