// Unified configuration for GPT-Realtime Voice Agent
export interface GPTRealtimeVoiceAgentConfig {
  provider: {
    id: string | null;
    type: string;
    model: string;
    endpoint: string;
    apiKey?: string; // server-side only
  };
  voice: {
    id: string;
    language: string;
    genderPreset: string;
    sampleRate: number;
  };
  transport: {
    type: 'webrtc' | 'websocket' | 'sse';
    iceServers: string;
    tokenLifetimeSec: number;
  };
  persona: {
    name: string;
    displayName: string;
    systemPrompt: string;
    speechStyle: string;
  };
}

export const defaultGPTRealtimeVoiceAgentConfig: GPTRealtimeVoiceAgentConfig = {
  provider: {
    id: null,
    type: 'openai',
    model: 'gpt-4o-realtime-preview-2024-10-01',
    endpoint: '',
  },
  voice: {
    id: 'alloy',
    language: 'en',
    genderPreset: 'neutral',
    sampleRate: 24000,
  },
  transport: {
    type: 'webrtc',
    iceServers: '',
    tokenLifetimeSec: 3600,
  },
  persona: {
    name: 'newme',
    displayName: 'NewMe',
    systemPrompt: "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful.",
    speechStyle: 'warm',
  },
};
