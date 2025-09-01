import { supabase } from '@/integrations/supabase/client';

export type RealtimeSettings = {
  connectionMethod: 'webrtc' | 'websocket';
  model: string;
  voice: string;
  language: 'en' | 'ar' | string;
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
};

const DEFAULT_SETTINGS: RealtimeSettings = {
  connectionMethod: 'webrtc',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy',
  language: 'en',
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
};

export async function loadRealtimeSettings(): Promise<RealtimeSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'realtime_settings')
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return { ...DEFAULT_SETTINGS, ...(data.setting_value as RealtimeSettings) };
}

export async function saveRealtimeSettings(settings: RealtimeSettings): Promise<void> {
  const payload = {
    setting_key: 'realtime_settings',
    setting_value: settings as unknown as Record<string, unknown>,
    category: 'voice',
    is_public: false,
  } as const;

  const { error } = await supabase
    .from('platform_settings')
    .upsert(payload, { onConflict: 'setting_key' });

  if (error) throw error;
}

