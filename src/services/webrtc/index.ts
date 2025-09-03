/**
 * WebRTC Services Export
 * Real-time voice communication services
 */

// Core WebRTC service
export { webRTCVoice, WebRTCVoiceService } from './webrtc-voice.service';
export type { 
  WebRTCConfig, 
  VoiceSessionConfig, 
  AudioChunk 
} from './webrtc-voice.service';

// Speech-to-Text pipeline
export { STTPipeline } from './stt-pipeline.service';
export type { 
  STTConfig, 
  TranscriptionResult 
} from './stt-pipeline.service';

// Text-to-Speech pipeline
export { TTSPipeline } from './tts-pipeline.service';
export type { 
  TTSConfig, 
  TTSResult 
} from './tts-pipeline.service';