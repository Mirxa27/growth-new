import { EventEmitter } from '@/utils/event-emitter';
import { openaiService } from '@/services/ai/openai.service';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';

export interface TTSConfig {
  provider: 'openai' | 'browser' | 'elevenlabs' | 'custom';
  voice?: string;
  model?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
  streamingEnabled?: boolean;
  cacheEnabled?: boolean;
}

export interface TTSResult {
  audio: ArrayBuffer | MediaStream;
  duration: number;
  text: string;
  voice: string;
  timestamp: number;
}

export class TTSPipeline extends EventEmitter {
  private config: TTSConfig;
  private synthesis: SpeechSynthesis | null = null;
  private audioContext: AudioContext | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;
  private audioQueue: Array<{ text: string; priority: number }> = [];
  private isProcessing: boolean = false;
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCache: Map<string, ArrayBuffer> = new Map();

  constructor(config: TTSConfig) {
    super();
    this.config = {
      provider: 'browser',
      voice: 'default',
      language: 'en-US',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      format: 'mp3',
      streamingEnabled: true,
      cacheEnabled: true,
      ...config
    };

    if (this.config.provider === 'browser') {
      this.initializeBrowserTTS();
    }

    // Initialize audio context for streaming
    if (this.config.streamingEnabled) {
      this.initializeAudioContext();
    }
  }

  /**
   * Initialize browser's Web Speech API for TTS
   */
  private initializeBrowserTTS(): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API TTS not supported, falling back to OpenAI');
      this.config.provider = 'openai';
      return;
    }

    this.synthesis = window.speechSynthesis;
  }

  /**
   * Initialize audio context for streaming
   */
  private initializeAudioContext(): void {
    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 48000
    });

    this.streamDestination = this.audioContext.createMediaStreamDestination();
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(text: string, options?: {
    voice?: string;
    speed?: number;
    pitch?: number;
    volume?: number;
    priority?: number;
  }): Promise<TTSResult> {
    const config = { ...this.config, ...options };
    
    // Check cache first
    if (config.cacheEnabled) {
      const cacheKey = this.getCacheKey(text, config);
      const cached = this.audioCache.get(cacheKey);
      if (cached) {
        this.emit('cacheHit', { text, cacheKey });
        return {
          audio: cached,
          duration: this.estimateDuration(text),
          text,
          voice: config.voice!,
          timestamp: Date.now()
        };
      }
    }

    // Add to queue
    this.audioQueue.push({
      text,
      priority: options?.priority || 0
    });

    // Sort by priority
    this.audioQueue.sort((a, b) => b.priority - a.priority);

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }

    // Return promise that resolves when synthesis is complete
    return new Promise((resolve, reject) => {
      const handler = (result: TTSResult) => {
        if (result.text === text) {
          this.off('synthesized', handler);
          this.off('error', errorHandler);
          resolve(result);
        }
      };

      const errorHandler = (error: any) => {
        if (error.text === text) {
          this.off('synthesized', handler);
          this.off('error', errorHandler);
          reject(error);
        }
      };

      this.on('synthesized', handler);
      this.on('error', errorHandler);
    });
  }

  /**
   * Process synthesis queue
   */
  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const item = this.audioQueue.shift()!;

    try {
      let result: TTSResult;

      switch (this.config.provider) {
        case 'browser':
          result = await this.synthesizeWithBrowser(item.text);
          break;
        case 'openai':
          result = await this.synthesizeWithOpenAI(item.text);
          break;
        case 'elevenlabs':
          result = await this.synthesizeWithElevenLabs(item.text);
          break;
        case 'custom':
          result = await this.synthesizeWithCustomProvider(item.text);
          break;
        default:
          throw new Error(`Unknown TTS provider: ${this.config.provider}`);
      }

      // Cache result
      if (this.config.cacheEnabled && result.audio instanceof ArrayBuffer) {
        const cacheKey = this.getCacheKey(item.text, this.config);
        this.audioCache.set(cacheKey, result.audio);
      }

      this.emit('synthesized', result);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SPEECH,
        context: { 
          action: 'synthesize_speech',
          provider: this.config.provider,
          text: item.text.substring(0, 50)
        }
      });
      this.emit('error', {
        type: 'synthesis_error',
        error,
        text: item.text
      });
    }

    this.isProcessing = false;

    // Continue processing queue
    if (this.audioQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Synthesize with browser TTS
   */
  private async synthesizeWithBrowser(text: string): Promise<TTSResult> {
    if (!this.synthesis) {
      throw new Error('Browser TTS not initialized');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.lang = this.config.language!;
      utterance.rate = this.config.speed!;
      utterance.pitch = this.config.pitch!;
      utterance.volume = this.config.volume!;

      // Select voice
      const voices = this.synthesis!.getVoices();
      const voice = voices.find(v => v.name === this.config.voice) || 
                   voices.find(v => v.lang.startsWith(this.config.language!.split('-')[0])) ||
                   voices[0];
      
      if (voice) {
        utterance.voice = voice;
      }

      // Handle events
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        this.emit('speakingStart', { text });
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.emit('speakingEnd', { text });

        // For browser TTS, we return a placeholder since we can't capture the audio
        resolve({
          audio: new ArrayBuffer(0),
          duration: this.estimateDuration(text),
          text,
          voice: voice?.name || 'default',
          timestamp: Date.now()
        });
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`TTS error: ${event.error}`));
      };

      // Speak
      this.synthesis!.speak(utterance);
    });
  }

  /**
   * Synthesize with OpenAI TTS
   */
  private async synthesizeWithOpenAI(text: string): Promise<TTSResult> {
    try {
      const startTime = Date.now();
      
      const audioData = await openaiService.textToSpeech({
        model: this.config.model || 'tts-1',
        voice: this.config.voice || 'alloy',
        input: text,
        speed: this.config.speed,
        response_format: this.config.format
      });

      const duration = this.estimateDuration(text);
      
      // If streaming is enabled, create a media stream
      if (this.config.streamingEnabled && this.audioContext) {
        const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.streamDestination!);
        source.start();

        this.emit('streamReady', {
          stream: this.streamDestination!.stream,
          text,
          duration
        });
      }

      return {
        audio: audioData,
        duration,
        text,
        voice: this.config.voice || 'alloy',
        timestamp: startTime
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Synthesize with ElevenLabs (placeholder)
   */
  private async synthesizeWithElevenLabs(text: string): Promise<TTSResult> {
    // Implement ElevenLabs integration
    throw new Error('ElevenLabs TTS not implemented yet');
  }

  /**
   * Synthesize with custom provider
   */
  private async synthesizeWithCustomProvider(text: string): Promise<TTSResult> {
    // Implement custom provider logic
    throw new Error('Custom TTS provider not implemented');
  }

  /**
   * Stream synthesized audio
   */
  async *streamSynthesize(text: string, chunkSize: number = 100): AsyncGenerator<TTSResult> {
    // Split text into chunks
    const chunks = this.splitTextIntoChunks(text, chunkSize);
    
    for (const chunk of chunks) {
      const result = await this.synthesize(chunk, { priority: 1 });
      yield result;
    }
  }

  /**
   * Split text into chunks for streaming
   */
  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Play audio buffer
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.config.volume!;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.emit('playbackComplete');
      };
      
      source.start();
      this.emit('playbackStart');
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUDIO,
        context: { action: 'play_audio' }
      });
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.config.provider === 'browser' && this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.audioQueue = [];
    this.isProcessing = false;
    
    this.emit('stopped');
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.config.provider === 'browser' && this.synthesis) {
      this.synthesis.pause();
    }
    this.emit('paused');
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.config.provider === 'browser' && this.synthesis) {
      this.synthesis.resume();
    }
    this.emit('resumed');
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    if (this.config.provider === 'browser' && this.synthesis) {
      const voices = this.synthesis.getVoices();
      return voices.map(voice => ({
        id: voice.voiceURI,
        name: voice.name,
        language: voice.lang
      }));
    } else if (this.config.provider === 'openai') {
      return [
        { id: 'alloy', name: 'Alloy', language: 'en' },
        { id: 'echo', name: 'Echo', language: 'en' },
        { id: 'fable', name: 'Fable', language: 'en' },
        { id: 'onyx', name: 'Onyx', language: 'en' },
        { id: 'nova', name: 'Nova', language: 'en' },
        { id: 'shimmer', name: 'Shimmer', language: 'en' }
      ];
    }
    
    return [];
  }

  /**
   * Estimate duration of text
   */
  private estimateDuration(text: string): number {
    // Average speaking rate is about 150 words per minute
    const words = text.split(/\s+/).length;
    const wordsPerSecond = 150 / 60;
    return (words / wordsPerSecond) * 1000; // Return in milliseconds
  }

  /**
   * Get cache key
   */
  private getCacheKey(text: string, config: any): string {
    return `${config.provider}_${config.voice}_${config.speed}_${config.pitch}_${text.substring(0, 50)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.audioQueue.length;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.synthesis = null;
    this.audioContext = null;
    this.streamDestination = null;
    this.audioCache.clear();
    this.removeAllListeners();
  }
}