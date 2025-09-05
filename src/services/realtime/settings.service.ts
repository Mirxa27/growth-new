import { supabase } from '@/integrations/supabase/client';
import { adminAPIConfigService } from '@/services/admin/adminAPIConfigService';

export type RealtimeSettings = {
  connectionMethod: 'webrtc' | 'websocket';
  model: string;
  voice: string;
  language: 'en' | 'ar' | string;
  api_key: string;
  base_url: string;
  organization?: string;
  project?: string;
  vad: {
    type: 'server_vad' | 'none';
    threshold: number;
    prefixPaddingMs: number;
    silenceDurationMs: number;
  };
  sttModel: string; // e.g., whisper-1
  inputFormat: string; // e.g., pcm16
  outputFormat: string; // e.g., pcm16
  useProxy: boolean;
  proxyUrl?: string;
  enableEmotionDetection: boolean;
  instructions: string;
  temperature: number;
  max_tokens: number;
};

const DEFAULT_SETTINGS: RealtimeSettings = {
  connectionMethod: 'webrtc',
  model: 'gpt-realtime-2025-08-28', // Standardized model
  voice: 'alloy',
  language: 'en',
  api_key: '',
  base_url: 'https://api.openai.com/v1',
  vad: {
    type: 'server_vad',
    threshold: 0.5,
    prefixPaddingMs: 300,
    silenceDurationMs: 1000,
  },
  sttModel: 'whisper-1',
  inputFormat: 'pcm16',
  outputFormat: 'pcm16',
  useProxy: true,
  proxyUrl: '',
  enableEmotionDetection: true,
  instructions: 'You are NewMe, an empowering AI companion designed specifically for women\'s personal growth.',
  temperature: 0.7,
  max_tokens: 4096,
};

export async function loadRealtimeSettings(): Promise<RealtimeSettings> {
  try {
    // Get configuration from admin panel
    const adminConfig = await adminAPIConfigService.getRealtimeVoiceConfig();
    
    // Merge admin config with defaults, ensuring standardized model
    return {
      ...DEFAULT_SETTINGS,
      api_key: adminConfig.api_key,
      base_url: adminConfig.base_url,
      organization: adminConfig.organization,
      project: adminConfig.project,
      instructions: adminConfig.instructions,
      temperature: adminConfig.temperature,
      max_tokens: adminConfig.max_tokens,
      voice: adminConfig.voice,
      vad: {
        ...DEFAULT_SETTINGS.vad,
        threshold: adminConfig.turn_detection.threshold,
        prefixPaddingMs: adminConfig.turn_detection.prefix_padding_ms,
        silenceDurationMs: adminConfig.turn_detection.silence_duration_ms,
      },
    };
  } catch (error) {
    console.error('Failed to load realtime settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveRealtimeSettings(settings: Partial<RealtimeSettings>): Promise<void> {
  try {
    // Ensure standardized model is used
    const settingsToSave = {
      ...settings,
      model: 'gpt-realtime-2025-08-28'
    };

    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'realtime_settings',
        value: JSON.stringify(settingsToSave),
      }, { onConflict: 'key' });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to save realtime settings:', error);
    throw error;
  }
}

