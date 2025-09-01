import { supabase } from '@/integrations/supabase/client';
import { AudioQueue } from './AudioQueue';

export class RealtimeVoiceChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private audioQueue: AudioQueue | null = null;

  private onMessageCallback: (data: unknown) => void;
  private onTranscriptCallback: (text: string, isFinal: boolean) => void;
  private onSpeakingChangeCallback: (isSpeaking: boolean) => void;

  constructor(
    onMessage: (data: unknown) => void,
    onTranscript: (text: string, isFinal: boolean) => void,
    onSpeakingChange: (isSpeaking: boolean) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onTranscriptCallback = onTranscript;
    this.onSpeakingChangeCallback = onSpeakingChange;
  }

  public async connect(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-realtime-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to create voice session' };
        }
        const errorMessage = errorData.error || 'Failed to create voice session';
        if (response.status === 400 && errorMessage.includes('OpenAI API error')) {
          throw new Error('Voice chat unavailable: OpenAI API key not configured');
        }
        throw new Error(errorMessage);
      }

      const sessionData = await response.json();
      
      if (!sessionData.client_secret) {
        throw new Error('No client secret received from server');
      }
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      this.ws = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${sessionData.client_secret}`]);

      this.ws.onopen = () => {
        this.onMessageCallback({ type: 'connected' });
        // Don't send session.update immediately - wait for session.created event
      };

      this.ws.onmessage = (event) => {
        this.handleRealtimeMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onMessageCallback({ type: 'error', error: { message: 'WebSocket connection error' } });
        this.disconnect();
      };

      this.ws.onclose = () => {
        this.onMessageCallback({ type: 'disconnected' });
        this.cleanup();
      };

    } catch (error) {
      console.error('Connection failed:', error);
      this.onMessageCallback({ type: 'error', error } as unknown);
      throw error;
    }
  }

  public disconnect(): void {
    this.cleanup();
  }

  public startRecording(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000,
        channelCount: 1
      }
    }).then(stream => {
      this.mediaStream = stream;
      const source = this.audioContext!.createMediaStreamSource(stream);
      
      this.audioContext!.audioWorklet.addModule('/audio-processor.js').then(() => {
        if (!this.audioContext) return;
        
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
        
        this.audioWorkletNode.port.onmessage = (event) => {
          if (event.data.type === 'audio-data' && this.ws?.readyState === WebSocket.OPEN) {
            // Send audio data to the Realtime API
            this.ws.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: event.data.audio
            }));
          }
        };

        source.connect(this.audioWorkletNode);
      }).catch(error => {
        console.error('Failed to load audio worklet:', error);
      });
    }).catch(error => {
      console.error('Microphone access denied:', error);
      this.onMessageCallback({ type: 'error', error: { message: 'Microphone access denied' } });
    });
  }

  public stopRecording(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      this.ws.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.audioQueue) {
      this.audioQueue.clearQueue();
      this.audioQueue = null;
    }
  }

  // Use a minimally-typed event shape to avoid any
  private handleRealtimeMessage(data: {
    type: string;
    transcript?: string;
    delta?: { text?: string; audio?: string };
    error?: unknown;
    session?: any;
  }): void {
    this.onMessageCallback(data);

    switch (data.type) {
      case 'session.created':
        // Session created successfully - now send configuration update
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful. Help users with meditation, goal setting, and personal development.",
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              },
              temperature: 0.8,
              max_response_output_tokens: 4096
            }
          }));
        }
        break;
        
      case 'session.updated':
        // Session configuration updated successfully
        console.log('Session updated successfully');
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
        
      case 'error':
        console.error('Realtime API error:', data.error);
        break;
    }
  }

  private async playAudio(audioData: string): Promise<void> {
    try {
      const data = atob(audioData);
      const buffer = new ArrayBuffer(data.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < data.length; i++) {
        view[i] = data.charCodeAt(i);
      }
      
      if (this.audioQueue) {
        await this.audioQueue.addToQueue(view.buffer);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
}
