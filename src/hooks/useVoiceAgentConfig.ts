import { useState, useCallback } from 'react';

export interface VoiceAgentConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  voice_settings: {
    voice_id: string;
    stability: number;
    similarity_boost: number;
  };
  conversation_settings: {
    temperature: number;
    max_tokens: number;
    system_prompt: string;
  };
  enabled: boolean;
}

export const useVoiceAgentConfig = () => {
  const [configs, setConfigs] = useState<VoiceAgentConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      // Mock implementation
      setConfigs([]);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (config: VoiceAgentConfig) => {
    // Mock implementation
    console.log('Saving config:', config);
  }, []);

  const deleteConfig = useCallback(async (id: string) => {
    // Mock implementation
    console.log('Deleting config:', id);
  }, []);

  return {
    configs,
    loading,
    loadConfigs,
    saveConfig,
    deleteConfig,
  };
};

export type { VoiceAgentConfig as VoiceAgentConfigType };
export type VoiceAgentConfigWithId = VoiceAgentConfig;