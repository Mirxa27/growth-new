import { supabase } from '@/integrations/supabase/client';
import { newMeAI, ConversationContext } from '../ai/newme-ai-service';

export interface VoiceSessionConfig {
  userId: string;
  language: 'en' | 'ar';
  voiceId?: string;
  enableEmotionDetection?: boolean;
  enableRealtimeProcessing?: boolean;
}

export interface VoiceAnalysis {
  emotion: string;
  tone: string;
  pace: 'slow' | 'normal' | 'fast';
  stress_level: number; // 0-10
  confidence: number; // 0-1
}

export class NewMeVoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private sessionId: string | null = null;
  private websocket: WebSocket | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  /**
   * Initialize audio context for voice processing
   */
  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if it's suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Start a voice conversation session
   */
  async startVoiceSession(config: VoiceSessionConfig): Promise<{
    sessionId: string;
    success: boolean;
    error?: string;
  }> {
    try {
      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });

      // Create new session in database
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: config.userId,
          session_token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'active',
          conversation_context: {
            language: config.language,
            voiceId: config.voiceId,
            enableEmotionDetection: config.enableEmotionDetection,
            startTime: new Date().toISOString(),
          }
        })
        .select()
        .single();

      if (error) throw error;

      this.sessionId = session.id;

      // Initialize WebRTC connection for real-time processing if enabled
      if (config.enableRealtimeProcessing) {
        await this.initializeRealtimeConnection(session.session_token);
      }

      return {
        sessionId: session.id,
        success: true,
      };
    } catch (error) {
      console.error('Failed to start voice session:', error);
      return {
        sessionId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start voice session',
      };
    }
  }

  /**
   * Initialize WebSocket connection for real-time voice processing
   */
  private async initializeRealtimeConnection(sessionToken: string) {
    try {
      // Get realtime token from edge function
      const { data, error } = await supabase.functions.invoke('get-realtime-token', {
        body: { sessionToken }
      });

      if (error) throw error;

      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      this.websocket = new WebSocket(wsUrl, ['realtime', `Bearer ${data.token}`]);

      this.websocket.onopen = () => {
        console.log('Realtime connection established');
        this.configureRealtimeSession();
      };

      this.websocket.onmessage = (event) => {
        this.handleRealtimeMessage(JSON.parse(event.data));
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.websocket.onclose = () => {
        console.log('Realtime connection closed');
      };
    } catch (error) {
      console.error('Failed to initialize realtime connection:', error);
    }
  }

  /**
   * Configure the realtime session with NewMe personality
   */
  private configureRealtimeSession() {
    if (!this.websocket) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: `You are NewMe, an emotionally intelligent AI companion for women's personal growth. 
        You speak with warmth, empathy, and cultural sensitivity. Your voice should be:
        - Warm and supportive
        - Culturally aware
        - Encouraging but not patronizing
        - Focused on empowerment and self-discovery
        
        Keep responses conversational and under 200 words. Always end with a thoughtful question.`,
        voice: 'alloy', // OpenAI's most natural female voice
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        tools: [],
        tool_choice: 'none',
        temperature: 0.7,
        max_response_output_tokens: 400
      }
    };

    this.websocket.send(JSON.stringify(sessionConfig));
  }

  /**
   * Handle incoming realtime messages
   */
  private handleRealtimeMessage(message: any) {
    switch (message.type) {
      case 'session.created':
        console.log('Realtime session created');
        break;
      
      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        break;
      
      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        break;
      
      case 'conversation.item.input_audio_transcription.completed':
        console.log('User transcript:', message.transcript);
        this.handleUserTranscript(message.transcript);
        break;
      
      case 'response.audio.delta':
        // Play audio chunk
        this.playAudioChunk(message.delta);
        break;
      
      case 'response.text.done':
        console.log('AI response text:', message.text);
        this.handleAIResponse(message.text);
        break;
      
      case 'error':
        console.error('Realtime API error:', message.error);
        break;
    }
  }

  /**
   * Record and process audio using traditional approach (fallback)
   */
  async startRecording(): Promise<void> {
    if (!this.audioStream || this.isRecording) return;

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await this.processAudioBlob(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and process the audio
   */
  async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || !this.isRecording) return;

    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  /**
   * Process recorded audio blob
   */
  private async processAudioBlob(audioBlob: Blob): Promise<void> {
    try {
      // Convert to base64 for API transmission
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      // Send to voice processing edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: audioBase64,
          sessionId: this.sessionId,
          language: 'en', // Could be determined from user profile
        }
      });

      if (error) throw error;

      const { transcript, emotion_analysis } = data;
      
      // Get user context and generate AI response
      await this.generateVoiceResponse(transcript, emotion_analysis);
      
    } catch (error) {
      console.error('Failed to process audio:', error);
    }
  }

  /**
   * Generate AI response and convert to speech
   */
  private async generateVoiceResponse(transcript: string, emotionAnalysis?: VoiceAnalysis): Promise<void> {
    try {
      if (!this.sessionId) return;

      // Get user profile and create conversation context
      const { data: session } = await supabase
        .from('voice_sessions')
        .select('user_id, conversation_context')
        .eq('id', this.sessionId)
        .single();

      if (!session) return;

      const userProfile = await newMeAI.getUserMemoryProfile(session.user_id);
      if (!userProfile) return;

      const context: ConversationContext = {
        userId: session.user_id,
        sessionId: this.sessionId,
        userProfile,
        currentEmotion: emotionAnalysis?.emotion,
        voiceAnalysis: emotionAnalysis ? {
          tone: emotionAnalysis.tone,
          pace: emotionAnalysis.pace,
          stress_level: emotionAnalysis.stress_level,
        } : undefined,
      };

      // Generate AI response
      const aiResult = await newMeAI.generateResponse(transcript, context);

      // Convert response to speech
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: aiResult.response,
          voice: userProfile.culturalContext.language === 'ar' ? 'ar-voice' : 'en-voice',
          sessionId: this.sessionId,
        }
      });

      if (ttsError) throw ttsError;

      // Play the audio response
      await this.playAudioResponse(ttsData.audioUrl);

      // Update session with conversation data
      await supabase
        .from('voice_sessions')
        .update({
          transcript_input: transcript,
          transcript_output: aiResult.response,
          emotion_analysis: emotionAnalysis,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.sessionId);

    } catch (error) {
      console.error('Failed to generate voice response:', error);
    }
  }

  /**
   * Play audio response
   */
  private async playAudioResponse(audioUrl: string): Promise<void> {
    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio response:', error);
    }
  }

  /**
   * Play real-time audio chunk
   */
  private async playAudioChunk(audioData: string): Promise<void> {
    try {
      if (!this.audioContext) return;

      // Decode base64 audio data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to AudioBuffer and play
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
    }
  }

  /**
   * Handle user transcript from real-time API
   */
  private handleUserTranscript(transcript: string) {
    // Could trigger UI updates or additional processing
    console.log('Processing user input:', transcript);
  }

  /**
   * Handle AI response from real-time API
   */
  private handleAIResponse(response: string) {
    // Could trigger UI updates or save to conversation history
    console.log('AI response received:', response);
  }

  /**
   * Send audio to real-time API
   */
  sendAudioToRealtime(audioData: ArrayBuffer) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
    
    const message = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };

    this.websocket.send(JSON.stringify(message));
  }

  /**
   * End voice session
   */
  async endSession(): Promise<void> {
    try {
      // Stop recording if active
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Close WebSocket connection
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Stop audio stream
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      // Update session status in database
      if (this.sessionId) {
        await supabase
          .from('voice_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.sessionId);
      }

      this.sessionId = null;
      this.isRecording = false;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Utility function to convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if voice features are supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      (window.AudioContext || (window as any).webkitAudioContext)
    );
  }

  /**
   * Get current session status
   */
  getSessionStatus(): {
    isActive: boolean;
    isRecording: boolean;
    sessionId: string | null;
  } {
    return {
      isActive: !!this.sessionId,
      isRecording: this.isRecording,
      sessionId: this.sessionId,
    };
  }
}

export const newMeVoice = new NewMeVoiceService();