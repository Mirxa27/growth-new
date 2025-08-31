// Voice Agent Configuration Types
export interface VoiceAgentConfig {
  name: string;
  instructions: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  temperature?: number;
  maxTokens?: number;
}

// Client Token Response
export interface ClientTokenResponse {
  client_secret: {
    value: string;
  };
  expires_at: number;
}

// Voice Session State
export interface VoiceSessionState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

// Voice Message
export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

// Connection Configuration
export interface ConnectionConfig {
  apiKey?: string; // For development only
  clientToken?: string; // Production
  model?: string;
}

// Voice Event Types
export type VoiceEventType = 
  | 'connected'
  | 'disconnected'
  | 'recording_started'
  | 'recording_stopped'
  | 'speaking_started'
  | 'speaking_stopped'
  | 'transcript_received'
  | 'error';

// Voice Event
export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: Date;
}

// Voice Agent Hook Return Type
export interface UseVoiceAgentReturn {
  state: VoiceSessionState;
  messages: VoiceMessage[];
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendTextMessage: (message: string) => void;
  clearMessages: () => void;
}
