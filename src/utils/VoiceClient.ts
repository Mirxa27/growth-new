/**
 * Browser Voice Client Example
 * Demonstrates getUserMedia, WebRTC PeerConnection, Opus WebSocket fallback,
 * partial transcript handling, and streamed audio playback
 */

export interface VoiceClientConfig {
  serverUrl: string;
  userId: string;
  agentConfigId: string;
  fallbackToWebSocket?: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
}

export interface VoiceSession {
  id: string;
  token: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export class VoiceClient {
  private config: VoiceClientConfig;
  private session: VoiceSession | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private websocket: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private isWebRTCSupported: boolean;
  
  // Event handlers
  public onTranscript?: (transcript: string, isFinal: boolean) => void;
  public onAudioStart?: () => void;
  public onAudioEnd?: () => void;
  public onError?: (error: Error) => void;
  public onStatusChange?: (status: VoiceSession['status']) => void;

  constructor(config: VoiceClientConfig) {
    this.config = config;
    this.isWebRTCSupported = this.checkWebRTCSupport();
  }

  /**
   * Initialize voice session
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      await this.setupAudioCapture();
      
      // Get ephemeral token
      const tokenResponse = await fetch(`${this.config.serverUrl}/api/voice/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.config.userId,
          agentConfigId: this.config.agentConfigId
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get voice token');
      }
      
      const { token, expiresAt } = await tokenResponse.json();
      
      // Create voice session
      const sessionResponse = await fetch(`${this.config.serverUrl}/api/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          agentConfigId: this.config.agentConfigId
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to create voice session');
      }
      
      const sessionData = await sessionResponse.json();
      
      this.session = {
        id: sessionData.id,
        token,
        status: 'connecting'
      };
      
      this.onStatusChange?.(this.session.status);
      
      // Try WebRTC first, fallback to WebSocket
      if (this.isWebRTCSupported && !this.config.fallbackToWebSocket) {
        await this.setupWebRTCConnection();
      } else {
        await this.setupWebSocketConnection();
      }
      
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Setup audio capture from microphone
   */
  private async setupAudioCapture(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: this.config.audioConstraints || {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000,
        channelCount: 1
      },
      video: false
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Setup audio context for processing
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load audio worklet for Opus encoding (if needed)
    if (this.audioContext.audioWorklet) {
      try {
        await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
        this.audioWorklet = new AudioWorkletNode(this.audioContext, 'opus-encoder');
      } catch (error) {
        console.warn('Audio worklet not available, using fallback encoding');
      }
    }
  }

  /**
   * Setup WebRTC peer connection
   */
  private async setupWebRTCConnection(): Promise<void> {
    if (!this.session) throw new Error('No active session');

    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming streams
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.playAudioStream(remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Create and send offer
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    
    await this.peerConnection.setLocalDescription(offer);
    
    const response = await this.sendSignalingMessage({
      type: 'offer',
      sdp: offer.sdp
    });

    // Handle answer
    if (response.type === 'answer') {
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: response.sdp
      });
      
      this.session.status = 'connected';
      this.onStatusChange?.(this.session.status);
    }
  }

  /**
   * Setup WebSocket connection (fallback)
   */
  private async setupWebSocketConnection(): Promise<void> {
    if (!this.session) throw new Error('No active session');

    const wsUrl = `${this.config.serverUrl.replace('http', 'ws')}/api/voice/websocket?sessionId=${this.session.id}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      if (this.session) {
        this.session.status = 'connected';
        this.onStatusChange?.(this.session.status);
      }
      this.startAudioStreaming();
    };

    this.websocket.onmessage = (event) => {
      this.handleWebSocketMessage(event.data);
    };

    this.websocket.onclose = () => {
      if (this.session) {
        this.session.status = 'disconnected';
        this.onStatusChange?.(this.session.status);
      }
    };

    this.websocket.onerror = (error) => {
      this.handleError(new Error('WebSocket error'));
    };
  }

  /**
   * Start streaming audio data
   */
  private startAudioStreaming(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.localStream || !this.audioContext) {
        reject(new Error('Audio not initialized'));
        return;
      }

      const source = this.audioContext.createMediaStreamSource(this.localStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Convert to appropriate format for transmission
        const audioData = this.encodeAudioData(inputBuffer);
        
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: audioData
          }));
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      this.onAudioStart?.();
      resolve();
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: string | ArrayBuffer): void {
    try {
      let message;
      
      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else {
        // Handle binary audio data
        this.playBinaryAudio(data);
        return;
      }

      switch (message.type) {
        case 'conversation.item.input_audio_transcription.completed':
          this.onTranscript?.(message.transcript, true);
          break;
          
        case 'conversation.item.input_audio_transcription.partial':
          this.onTranscript?.(message.transcript, false);
          break;
          
        case 'response.audio.delta':
          this.playAudioDelta(message.delta);
          break;
          
        case 'response.audio.done':
          this.onAudioEnd?.();
          break;
          
        case 'error':
          this.handleError(new Error(message.error.message || 'Unknown error'));
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Play audio stream
   */
  private playAudioStream(stream: MediaStream): void {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true;
  }

  /**
   * Play binary audio data
   */
  private async playBinaryAudio(data: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(data);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing binary audio:', error);
    }
  }

  /**
   * Play audio delta (base64 encoded)
   */
  private async playAudioDelta(delta: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Decode base64 audio
      const binaryString = atob(delta);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode and play
      const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio delta:', error);
    }
  }

  /**
   * Encode audio data for transmission
   */
  private encodeAudioData(inputBuffer: Float32Array): string {
    // Convert Float32Array to 16-bit PCM
    const pcmData = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      pcmData[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 0x7FFF;
    }
    
    // Convert to base64
    const bytes = new Uint8Array(pcmData.buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Send signaling message
   */
  private async sendSignalingMessage(signalData: any): Promise<any> {
    if (!this.session) throw new Error('No active session');

    const response = await fetch(`${this.config.serverUrl}/api/voice/signaling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.session.id,
        signalData
      })
    });

    if (!response.ok) {
      throw new Error('Signaling failed');
    }

    return await response.json();
  }

  /**
   * Check WebRTC support
   */
  private checkWebRTCSupport(): boolean {
    return !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('VoiceClient error:', error);
    if (this.session) {
      this.session.status = 'error';
      this.onStatusChange?.(this.session.status);
    }
    this.onError?.(error);
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    // Close WebRTC connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.session) {
      this.session.status = 'disconnected';
      this.onStatusChange?.(this.session.status);
      this.session = null;
    }
  }

  /**
   * Get current session status
   */
  getStatus(): VoiceSession['status'] | null {
    return this.session?.status || null;
  }

  /**
   * Send text message (if supported)
   */
  async sendText(text: string): Promise<void> {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }]
        }
      }));
    }
  }
}

// Usage example
export function createVoiceClient(config: VoiceClientConfig): VoiceClient {
  return new VoiceClient(config);
}

// Audio worklet processor (save as separate file: /public/audio-worklet-processor.js)
export const AUDIO_WORKLET_PROCESSOR = `
class OpusEncoder extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      
      // Simple passthrough - in production, use real Opus encoding
      this.port.postMessage({
        type: 'audio',
        data: channelData
      });
    }
    
    return true;
  }
}

registerProcessor('opus-encoder', OpusEncoder);
`;
