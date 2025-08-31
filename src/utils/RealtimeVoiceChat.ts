export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer as ArrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      throw new Error(`Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}

interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

export class RealtimeVoiceChat {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;
  private isConnected = false;
  private currentTranscript = '';

  constructor(
    private onMessage: (message: RealtimeMessage) => void,
    private onTranscript: (transcript: string, isFinal: boolean) => void,
    private onSpeakingChange: (speaking: boolean) => void
  ) {}

  async connect(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect to WebSocket proxy
      const wsUrl = `wss://ufgqmqoykddaotdbwteg.functions.supabase.co/realtime-voice-proxy`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startAudioRecording();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          throw new Error(`WebSocket message parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      this.ws.onerror = (error) => {
        throw new Error(`WebSocket error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.cleanup();
      };

    } catch (error) {
      throw new Error(`Voice service connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async startAudioRecording() {
    try {
      this.audioRecorder = new AudioRecorder((audioData) => {
        if (this.isConnected && this.ws) {
          const encodedAudio = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await this.audioRecorder.start();
    } catch (error) {
      throw new Error(`Recording start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleMessage(data: RealtimeMessage) {
    switch (data.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;

      case 'session.updated':
        console.log('Session updated:', data);
        break;

      case 'conversation.item.completed':
        console.log('Conversation item completed:', data);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        // Automatically commit the audio buffer and request response
        if (this.ws) {
          this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          this.ws.send(JSON.stringify({ type: 'response.create' }));
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.currentTranscript = data.transcript;
        this.onTranscript(data.transcript, true);
        break;

      case 'response.audio.delta':
        if (data.delta) {
          const audioData = new Uint8Array(data.delta);
          await this.audioQueue.addToQueue(audioData);
        }
        break;

      case 'response.audio.done':
        console.log('AI finished speaking');
        this.onSpeakingChange(false);
        break;

      case 'response.audio_transcript.delta':
        if (data.delta) {
          this.onTranscript(data.delta, false);
        }
        break;

      case 'response.created':
        console.log('AI response started');
        this.onSpeakingChange(true);
        break;

      case 'response.done':
        console.log('AI response completed');
        this.onSpeakingChange(false);
        break;

      case 'error':
        console.error('OpenAI error:', data);
        this.onMessage({ type: 'error', error: data.error });
        break;

      default:
        console.log('Unhandled message type:', data.type);
    }

    // Forward all messages to the parent component
    this.onMessage(data);
  }

  sendTextMessage(text: string) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to voice chat');
    }

    console.log('Sending text message:', text);
    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));

    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect() {
    console.log('Disconnecting from realtime voice chat...');
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.cleanup();
  }

  private cleanup() {
    if (this.audioRecorder) {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioQueue = null;
    this.onSpeakingChange(false);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  startRecording(): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to voice chat');
    }
    
    // Reset any existing audio buffer
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
    
    console.log('Started recording');
  }

  stopRecording(): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to voice chat');
    }
    
    // Commit the audio buffer and request response
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    this.ws.send(JSON.stringify({ type: 'response.create' }));
    
    console.log('Stopped recording');
  }
}