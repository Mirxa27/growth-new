import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * OpenAI Realtime API Service
 * Implements voice-to-voice conversation using OpenAI's official Realtime API
 * Based on: https://platform.openai.com/docs/guides/realtime
 */

export interface RealtimeConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  modalities?: ('text' | 'audio')[];
  instructions?: string;
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  input_audio_transcription?: {
    model?: 'whisper-1';
  };
  turn_detection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  tools?: Array<{
    type: 'function';
    name: string;
    description: string;
    parameters: object;
  }>;
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
}

export interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export interface AudioData {
  audio: string; // base64 encoded audio
  transcript?: string;
}

export interface ConversationItem {
  id: string;
  type: 'message' | 'function_call' | 'function_call_output';
  status: 'completed' | 'in_progress' | 'incomplete';
  role: 'user' | 'assistant' | 'system';
  content?: Array<{
    type: 'input_text' | 'input_audio' | 'text' | 'audio';
    text?: string;
    audio?: string;
    transcript?: string;
  }>;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private clientSecret: string | null = null;
  private config: RealtimeConfig = {};
  private isConnected = false;
  private eventHandlers: Map<string, Function[]> = new Map();
  private conversationItems: ConversationItem[] = [];
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      voice: 'alloy',
      modalities: ['text', 'audio'],
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 200
      },
      temperature: 0.8,
      max_response_output_tokens: 4096,
      ...config
    };
  }

  /**
   * Initialize the realtime connection
   */
  async initialize(): Promise<void> {
    try {
      // Get client secret from server
      await this.getClientSecret();
      
      // Initialize audio context
      await this.initializeAudio();
      
      // Connect to WebSocket
      await this.connect();
      
      logger.info('OpenAI Realtime service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI Realtime service', 'OpenAIRealtimeService', error);
      throw error;
    }
  }

  /**
   * Get client secret from server
   */
  private async getClientSecret(): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('get-realtime-token');
      
      if (error) throw error;
      
      this.clientSecret = data.client_secret;
      this.config.model = data.model;
      
      logger.info('Retrieved client secret for realtime API');
    } catch (error) {
      logger.error('Failed to get client secret', 'OpenAIRealtimeService', error);
      throw new Error('Failed to authenticate with realtime API');
    }
  }

  /**
   * Initialize audio context and media devices
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create media recorder for audio input
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.handleAudioInput(event.data);
        }
      };

      logger.info('Audio context initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audio', 'OpenAIRealtimeService', error);
      throw new Error('Microphone access required for voice conversation');
    }
  }

  /**
   * Connect to OpenAI Realtime WebSocket
   */
  private async connect(): Promise<void> {
    if (!this.clientSecret) {
      throw new Error('Client secret not available');
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
      
      this.ws = new WebSocket(wsUrl, [], {
        headers: {
          'Authorization': `Bearer ${this.clientSecret}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      } as any);

      this.ws.onopen = () => {
        this.isConnected = true;
        logger.info('Connected to OpenAI Realtime API');
        
        // Send session configuration
        this.sendEvent({
          type: 'session.update',
          session: {
            modalities: this.config.modalities,
            instructions: this.config.instructions || this.getDefaultInstructions(),
            voice: this.config.voice,
            input_audio_format: this.config.input_audio_format,
            output_audio_format: this.config.output_audio_format,
            input_audio_transcription: this.config.input_audio_transcription,
            turn_detection: this.config.turn_detection,
            tools: this.config.tools,
            tool_choice: this.config.tool_choice,
            temperature: this.config.temperature,
            max_response_output_tokens: this.config.max_response_output_tokens
          }
        });

        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleServerEvent(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', 'OpenAIRealtimeService', error);
        reject(new Error('Failed to connect to realtime API'));
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        logger.info('Disconnected from OpenAI Realtime API', { code: event.code, reason: event.reason });
        this.emit('disconnected', { code: event.code, reason: event.reason });
      };
    });
  }

  /**
   * Start voice conversation
   */
  async startConversation(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to realtime API');
    }

    // Start recording audio
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start(100); // Send chunks every 100ms
      logger.info('Started voice conversation');
      this.emit('conversation_started');
    }
  }

  /**
   * Stop voice conversation
   */
  stopConversation(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      logger.info('Stopped voice conversation');
      this.emit('conversation_stopped');
    }
  }

  /**
   * Send text message to the conversation
   */
  sendMessage(text: string): void {
    if (!this.isConnected) {
      throw new Error('Not connected to realtime API');
    }

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    });

    this.sendEvent({
      type: 'response.create'
    });

    logger.info('Sent text message', { text });
  }

  /**
   * Handle audio input from microphone
   */
  private async handleAudioInput(audioBlob: Blob): Promise<void> {
    try {
      // Convert blob to base64 PCM16 format
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = await this.convertToPCM16(arrayBuffer);
      
      if (this.isConnected && audioData) {
        this.sendEvent({
          type: 'input_audio_buffer.append',
          audio: audioData
        });
      }
    } catch (error) {
      logger.error('Failed to process audio input', 'OpenAIRealtimeService', error);
    }
  }

  /**
   * Convert audio to PCM16 format required by OpenAI
   */
  private async convertToPCM16(arrayBuffer: ArrayBuffer): Promise<string | null> {
    if (!this.audioContext) return null;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // Get mono channel
      
      // Resample to 24kHz if needed
      const targetSampleRate = 24000;
      const resampledData = this.resampleAudio(channelData, audioBuffer.sampleRate, targetSampleRate);
      
      // Convert to 16-bit PCM
      const pcm16Data = new Int16Array(resampledData.length);
      for (let i = 0; i < resampledData.length; i++) {
        pcm16Data[i] = Math.max(-32768, Math.min(32767, resampledData[i] * 32767));
      }
      
      // Convert to base64
      const uint8Array = new Uint8Array(pcm16Data.buffer);
      return btoa(String.fromCharCode(...uint8Array));
    } catch (error) {
      logger.error('Failed to convert audio to PCM16', 'OpenAIRealtimeService', error);
      return null;
    }
  }

  /**
   * Resample audio to target sample rate
   */
  private resampleAudio(inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.ceil(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;

      if (index + 1 < inputData.length) {
        outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
      } else {
        outputData[i] = inputData[index];
      }
    }

    return outputData;
  }

  /**
   * Handle server events
   */
  private handleServerEvent(event: RealtimeEvent): void {
    logger.debug('Received server event', { type: event.type });

    switch (event.type) {
      case 'session.created':
        this.emit('session_created', event);
        break;

      case 'session.updated':
        this.emit('session_updated', event);
        break;

      case 'conversation.item.created':
        this.conversationItems.push(event.item);
        this.emit('item_created', event.item);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.emit('transcription_completed', {
          item_id: event.item_id,
          transcript: event.transcript
        });
        break;

      case 'response.created':
        this.emit('response_created', event);
        break;

      case 'response.output_item.added':
        this.conversationItems.push(event.item);
        this.emit('response_item_added', event.item);
        break;

      case 'response.content_part.added':
        this.emit('content_part_added', event);
        break;

      case 'response.audio.delta':
        this.handleAudioOutput(event.delta);
        break;

      case 'response.audio.done':
        this.emit('audio_response_complete', event);
        break;

      case 'response.text.delta':
        this.emit('text_delta', {
          delta: event.delta,
          response_id: event.response_id,
          item_id: event.item_id,
          output_index: event.output_index,
          content_index: event.content_index
        });
        break;

      case 'response.text.done':
        this.emit('text_complete', {
          text: event.text,
          response_id: event.response_id,
          item_id: event.item_id
        });
        break;

      case 'response.function_call_arguments.delta':
        this.emit('function_call_delta', event);
        break;

      case 'response.function_call_arguments.done':
        this.emit('function_call_complete', event);
        break;

      case 'response.done':
        this.emit('response_complete', event);
        break;

      case 'error':
        logger.error('Server error', 'OpenAIRealtimeService', event);
        this.emit('error', event);
        break;

      default:
        logger.debug('Unhandled server event', { type: event.type, event });
    }
  }

  /**
   * Handle audio output from server
   */
  private async handleAudioOutput(audioData: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Decode base64 audio data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Add to audio queue for playback
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playAudioQueue();
      }
    } catch (error) {
      logger.error('Failed to process audio output', 'OpenAIRealtimeService', error);
    }
  }

  /**
   * Play audio queue
   */
  private async playAudioQueue(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    
    while (this.audioQueue.length > 0) {
      const audioBuffer = this.audioQueue.shift()!;
      await this.playAudioBuffer(audioBuffer);
    }
    
    this.isPlaying = false;
  }

  /**
   * Play single audio buffer
   */
  private playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => resolve();
      source.start();
    });
  }

  /**
   * Send event to server
   */
  private sendEvent(event: RealtimeEvent): void {
    if (!this.ws || !this.isConnected) {
      logger.warn('Cannot send event: not connected', { event });
      return;
    }

    // Add event ID if not present
    if (!event.event_id) {
      event.event_id = this.generateEventId();
    }

    this.ws.send(JSON.stringify(event));
    logger.debug('Sent event to server', { type: event.type, event_id: event.event_id });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get default system instructions
   */
  private getDefaultInstructions(): string {
    return `You are a helpful AI assistant for the Newomen personal growth platform. 
    
    Your role is to:
    - Provide thoughtful guidance on personal development topics
    - Help users reflect on their growth journey
    - Offer insights based on assessment results when relevant
    - Maintain a supportive, encouraging tone
    - Be conversational and engaging in voice interactions
    
    Keep responses concise but meaningful. Ask follow-up questions to encourage deeper reflection.`;
  }

  /**
   * Add event listener
   */
  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, data?: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error('Event handler error', 'OpenAIRealtimeService', error);
        }
      });
    }
  }

  /**
   * Get conversation history
   */
  getConversationItems(): ConversationItem[] {
    return [...this.conversationItems];
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.conversationItems = [];
    if (this.isConnected) {
      this.sendEvent({
        type: 'conversation.item.truncate',
        item_id: 'all'
      });
    }
  }

  /**
   * Update session configuration
   */
  updateSession(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isConnected) {
      this.sendEvent({
        type: 'session.update',
        session: config
      });
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.conversationItems = [];
    this.audioQueue = [];
    this.eventHandlers.clear();

    logger.info('OpenAI Realtime service disconnected and cleaned up');
  }

  /**
   * Check if service is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

export default OpenAIRealtimeService;