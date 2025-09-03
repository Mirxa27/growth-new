import { EventEmitter } from '@/utils/event-emitter';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  audioConstraints?: MediaStreamConstraints['audio'];
  enableVAD?: boolean;
  vadThreshold?: number;
  sampleRate?: number;
  channels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface VoiceSessionConfig {
  sessionId: string;
  userId: string;
  language?: string;
  voiceId?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface AudioChunk {
  data: Float32Array;
  timestamp: number;
  isSpeaking: boolean;
  energy: number;
}

export class WebRTCVoiceService extends EventEmitter {
  private static instance: WebRTCVoiceService;
  
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private processorNode: AudioWorkletNode | null = null;
  
  private isConnected: boolean = false;
  private isMuted: boolean = false;
  private isRecording: boolean = false;
  
  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    },
    enableVAD: true,
    vadThreshold: -50,
    sampleRate: 48000,
    channels: 1
  };

  private constructor() {
    super();
  }

  static getInstance(): WebRTCVoiceService {
    if (!WebRTCVoiceService.instance) {
      WebRTCVoiceService.instance = new WebRTCVoiceService();
    }
    return WebRTCVoiceService.instance;
  }

  /**
   * Initialize WebRTC connection
   */
  async initialize(config?: Partial<WebRTCConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      
      // Initialize audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });

      // Load audio worklet processor
      await this.loadAudioWorklet();
      
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audioConstraints,
        video: false
      });

      // Set up audio processing
      await this.setupAudioProcessing();
      
      this.emit('initialized');
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.WEBRTC,
        context: { action: 'initialize_webrtc' }
      });
      throw error;
    }
  }

  /**
   * Load audio worklet processor
   */
  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) return;

    try {
      await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
    } catch (error) {
      console.warn('Failed to load audio worklet, using fallback');
      // Fallback will be handled in setupAudioProcessing
    }
  }

  /**
   * Set up audio processing pipeline
   */
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.localStream) return;

    try {
      // Create source node from microphone
      this.sourceNode = this.audioContext.createMediaStreamSource(this.localStream);
      
      // Create analyser for VAD
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Try to create audio worklet node
      try {
        this.processorNode = new AudioWorkletNode(this.audioContext, 'voice-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: this.config.channels,
          processorOptions: {
            sampleRate: this.config.sampleRate,
            vadThreshold: this.config.vadThreshold,
            enableVAD: this.config.enableVAD
          }
        });

        // Handle messages from audio worklet
        this.processorNode.port.onmessage = (event) => {
          this.handleAudioWorkletMessage(event.data);
        };

        // Connect nodes
        this.sourceNode
          .connect(this.analyserNode)
          .connect(this.processorNode)
          .connect(this.audioContext.destination);
      } catch (error) {
        // Fallback to script processor (deprecated but works)
        console.warn('AudioWorklet not supported, using fallback');
        this.setupFallbackProcessor();
      }

      // Start VAD monitoring
      if (this.config.enableVAD) {
        this.startVADMonitoring();
      }

    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.WEBRTC,
        context: { action: 'setup_audio_processing' }
      });
      throw error;
    }
  }

  /**
   * Fallback audio processor for browsers without AudioWorklet support
   */
  private setupFallbackProcessor(): void {
    if (!this.audioContext || !this.sourceNode || !this.analyserNode) return;

    const bufferSize = 4096;
    const scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    scriptProcessor.onaudioprocess = (event) => {
      if (!this.isRecording || this.isMuted) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const audioChunk: AudioChunk = {
        data: new Float32Array(inputData),
        timestamp: Date.now(),
        isSpeaking: this.detectSpeech(inputData),
        energy: this.calculateEnergy(inputData)
      };

      this.emit('audioData', audioChunk);
      
      // Pass through audio
      const outputData = event.outputBuffer.getChannelData(0);
      outputData.set(inputData);
    };

    this.sourceNode
      .connect(this.analyserNode)
      .connect(scriptProcessor)
      .connect(this.audioContext.destination);
  }

  /**
   * Handle messages from audio worklet
   */
  private handleAudioWorkletMessage(data: any): void {
    switch (data.type) {
      case 'audioData':
        if (this.isRecording && !this.isMuted) {
          const audioChunk: AudioChunk = {
            data: data.audioData,
            timestamp: data.timestamp,
            isSpeaking: data.isSpeaking,
            energy: data.energy
          };
          this.emit('audioData', audioChunk);
        }
        break;

      case 'vadStatus':
        this.emit('vadStatus', data.isSpeaking);
        break;

      case 'error':
        console.error('Audio worklet error:', data.error);
        break;
    }
  }

  /**
   * Start Voice Activity Detection monitoring
   */
  private startVADMonitoring(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let isSpeaking = false;
    let silenceTimer: NodeJS.Timeout | null = null;

    const checkVAD = () => {
      if (!this.isRecording || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const decibels = 20 * Math.log10(average / 255);
      
      const currentlySpeaking = decibels > this.config.vadThreshold!;
      
      if (currentlySpeaking !== isSpeaking) {
        if (currentlySpeaking) {
          // Started speaking
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
          isSpeaking = true;
          this.emit('speechStart');
        } else {
          // Stopped speaking - add debounce
          silenceTimer = setTimeout(() => {
            isSpeaking = false;
            this.emit('speechEnd');
          }, 500); // 500ms debounce
        }
      }

      // Continue monitoring
      if (this.isRecording) {
        requestAnimationFrame(checkVAD);
      }
    };

    checkVAD();
  }

  /**
   * Detect speech in audio data
   */
  private detectSpeech(audioData: Float32Array): boolean {
    const energy = this.calculateEnergy(audioData);
    const threshold = Math.pow(10, this.config.vadThreshold! / 20);
    return energy > threshold;
  }

  /**
   * Calculate audio energy
   */
  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Create WebRTC peer connection
   */
  async createPeerConnection(sessionConfig: VoiceSessionConfig): Promise<RTCPeerConnection> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.emit('remoteStream', this.remoteStream);
        this.playRemoteAudio();
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('iceCandidate', event.candidate);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection!.connectionState;
        this.emit('connectionStateChange', state);
        
        if (state === 'connected') {
          this.isConnected = true;
          this.emit('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          this.isConnected = false;
          this.emit('disconnected');
        }
      };

      // Create data channel for metadata
      this.dataChannel = this.peerConnection.createDataChannel('voice-metadata', {
        ordered: true
      });

      this.dataChannel.onopen = () => {
        this.emit('dataChannelOpen');
        // Send session configuration
        this.sendDataChannelMessage({
          type: 'sessionConfig',
          config: sessionConfig
        });
      };

      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('dataChannelMessage', data);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      };

      return this.peerConnection;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.WEBRTC,
        context: { action: 'create_peer_connection' }
      });
      throw error;
    }
  }

  /**
   * Play remote audio stream
   */
  private playRemoteAudio(): void {
    if (!this.remoteStream) return;

    const audio = new Audio();
    audio.srcObject = this.remoteStream;
    audio.autoplay = true;
    
    // Handle autoplay policy
    audio.play().catch(error => {
      console.warn('Autoplay failed, user interaction required:', error);
      this.emit('autoplayBlocked');
    });
  }

  /**
   * Create offer for WebRTC connection
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create answer for WebRTC connection
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(description);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Send message through data channel
   */
  sendDataChannelMessage(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  /**
   * Start recording
   */
  startRecording(): void {
    this.isRecording = true;
    this.emit('recordingStarted');
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.isRecording = false;
    this.emit('recordingStopped');
  }

  /**
   * Mute microphone
   */
  mute(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
    this.isMuted = true;
    this.emit('muted');
  }

  /**
   * Unmute microphone
   */
  unmute(): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
    this.isMuted = false;
    this.emit('unmuted');
  }

  /**
   * Get audio statistics
   */
  async getAudioStats(): Promise<any> {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    const audioStats: any = {
      local: {},
      remote: {}
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioStats.remote = {
          packetsReceived: report.packetsReceived,
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          audioLevel: report.audioLevel
        };
      } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        audioStats.local = {
          packetsSent: report.packetsSent,
          bytesSent: report.bytesSent
        };
      }
    });

    return audioStats;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    // Stop recording
    this.stopRecording();

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Cleanup audio nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check if muted
   */
  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const webRTCVoice = WebRTCVoiceService.getInstance();