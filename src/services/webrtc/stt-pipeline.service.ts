import { EventEmitter } from '@/utils/event-emitter';
import { openaiService } from '@/services/ai/openai.service';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';

export interface STTConfig {
  provider: 'openai' | 'browser' | 'custom';
  language?: string;
  model?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  punctuation?: boolean;
  profanityFilter?: boolean;
  wordTimestamps?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
}

export class STTPipeline extends EventEmitter {
  private config: STTConfig;
  private recognition: SpeechRecognition | null = null;
  private audioBuffer: Float32Array[] = [];
  private isProcessing: boolean = false;
  private processingQueue: Array<{ audio: Float32Array; timestamp: number }> = [];
  private lastTranscriptionTime: number = 0;
  private interimTranscript: string = '';
  private finalTranscript: string = '';

  constructor(config: STTConfig) {
    super();
    this.config = {
      provider: 'browser',
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      punctuation: true,
      profanityFilter: false,
      wordTimestamps: false,
      ...config
    };

    if (this.config.provider === 'browser') {
      this.initializeBrowserSTT();
    }
  }

  /**
   * Initialize browser's Web Speech API
   */
  private initializeBrowserSTT(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported, falling back to OpenAI');
      this.config.provider = 'openai';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous!;
    this.recognition.interimResults = this.config.interimResults!;
    this.recognition.maxAlternatives = this.config.maxAlternatives!;
    this.recognition.lang = this.config.language!;

    // Handle results
    this.recognition.onresult = (event) => {
      this.handleBrowserSTTResult(event);
    };

    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', {
        type: 'recognition_error',
        error: event.error,
        message: this.getErrorMessage(event.error)
      });

      // Restart if it's a recoverable error
      if (['network', 'no-speech', 'aborted'].includes(event.error)) {
        setTimeout(() => this.start(), 1000);
      }
    };

    // Handle end
    this.recognition.onend = () => {
      if (this.isProcessing) {
        // Restart if we're still supposed to be processing
        this.start();
      }
    };

    // Handle start
    this.recognition.onstart = () => {
      this.emit('started');
    };

    // Handle speech start/end
    this.recognition.onspeechstart = () => {
      this.emit('speechStart');
    };

    this.recognition.onspeechend = () => {
      this.emit('speechEnd');
    };
  }

  /**
   * Handle browser STT results
   */
  private handleBrowserSTTResult(event: SpeechRecognitionEvent): void {
    const results = event.results;
    
    for (let i = event.resultIndex; i < results.length; i++) {
      const result = results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 1.0;
      
      const alternatives = [];
      for (let j = 1; j < Math.min(result.length, this.config.maxAlternatives!); j++) {
        alternatives.push({
          text: result[j].transcript,
          confidence: result[j].confidence || 0
        });
      }

      const transcriptionResult: TranscriptionResult = {
        text: transcript,
        confidence,
        isFinal: result.isFinal,
        timestamp: Date.now(),
        alternatives: alternatives.length > 0 ? alternatives : undefined
      };

      if (result.isFinal) {
        this.finalTranscript += transcript + ' ';
        this.interimTranscript = '';
      } else {
        this.interimTranscript = transcript;
      }

      this.emit('transcription', transcriptionResult);
    }
  }

  /**
   * Process audio data for STT
   */
  async processAudio(audioData: Float32Array, timestamp: number): Promise<void> {
    if (this.config.provider === 'browser') {
      // Browser STT handles audio automatically
      return;
    }

    // Add to processing queue
    this.processingQueue.push({ audio: audioData, timestamp });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processAudioQueue();
    }
  }

  /**
   * Process queued audio data
   */
  private async processAudioQueue(): Promise<void> {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Batch process audio chunks
    const batchSize = 10; // Process 10 chunks at a time
    const batch = this.processingQueue.splice(0, batchSize);
    
    // Combine audio chunks
    const combinedAudio = this.combineAudioChunks(batch.map(b => b.audio));
    const avgTimestamp = batch.reduce((sum, b) => sum + b.timestamp, 0) / batch.length;

    try {
      if (this.config.provider === 'openai') {
        await this.processWithOpenAI(combinedAudio, avgTimestamp);
      } else if (this.config.provider === 'custom') {
        await this.processWithCustomProvider(combinedAudio, avgTimestamp);
      }
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SPEECH,
        context: { 
          action: 'process_audio',
          provider: this.config.provider 
        }
      });
      this.emit('error', {
        type: 'processing_error',
        error
      });
    }

    // Continue processing queue
    setTimeout(() => this.processAudioQueue(), 100);
  }

  /**
   * Combine multiple audio chunks
   */
  private combineAudioChunks(chunks: Float32Array[]): Float32Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return combined;
  }

  /**
   * Process audio with OpenAI Whisper
   */
  private async processWithOpenAI(audioData: Float32Array, timestamp: number): Promise<void> {
    // Convert Float32Array to WAV format
    const wavBlob = this.float32ArrayToWAV(audioData);
    
    try {
      const result = await openaiService.transcribeAudio(wavBlob, {
        model: this.config.model || 'whisper-1',
        language: this.config.language?.split('-')[0] || 'en',
        prompt: this.finalTranscript.slice(-500), // Use last 500 chars as context
        response_format: this.config.wordTimestamps ? 'verbose_json' : 'json',
        temperature: 0.2
      });

      const transcriptionResult: TranscriptionResult = {
        text: result.text,
        confidence: 1.0, // OpenAI doesn't provide confidence
        isFinal: true,
        timestamp,
        words: result.words
      };

      this.finalTranscript += result.text + ' ';
      this.emit('transcription', transcriptionResult);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Process with custom STT provider
   */
  private async processWithCustomProvider(audioData: Float32Array, timestamp: number): Promise<void> {
    // Implement custom provider logic here
    // This is a placeholder for future integrations
    throw new Error('Custom STT provider not implemented');
  }

  /**
   * Convert Float32Array to WAV blob
   */
  private float32ArrayToWAV(audioData: Float32Array, sampleRate: number = 48000): Blob {
    const length = audioData.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert float32 to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Get error message for speech recognition errors
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please speak clearly.',
      'audio-capture': 'Microphone access error. Please check your microphone.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your internet connection.',
      'aborted': 'Speech recognition aborted.',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.'
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  /**
   * Start STT processing
   */
  start(): void {
    this.isProcessing = true;
    
    if (this.config.provider === 'browser' && this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        // Already started, ignore
      }
    }
  }

  /**
   * Stop STT processing
   */
  stop(): void {
    this.isProcessing = false;
    
    if (this.config.provider === 'browser' && this.recognition) {
      this.recognition.stop();
    }
    
    // Clear processing queue
    this.processingQueue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<STTConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.provider === 'browser' && this.recognition) {
      this.recognition.lang = this.config.language!;
      this.recognition.continuous = this.config.continuous!;
      this.recognition.interimResults = this.config.interimResults!;
      this.recognition.maxAlternatives = this.config.maxAlternatives!;
    }
  }

  /**
   * Get current transcript
   */
  getTranscript(): { final: string; interim: string } {
    return {
      final: this.finalTranscript.trim(),
      interim: this.interimTranscript.trim()
    };
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stop();
    this.recognition = null;
    this.audioBuffer = [];
    this.processingQueue = [];
    this.removeAllListeners();
  }
}

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}