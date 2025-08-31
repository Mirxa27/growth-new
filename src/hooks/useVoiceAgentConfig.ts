import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Failed to load configs:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (config: VoiceAgentConfig) => {
    try {
      const { error } = await supabase
        .from('voice_agent_configs')
        .upsert(config);

      if (error) throw error;
      await loadConfigs(); // Refresh the list
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }, [loadConfigs]);

  const deleteConfig = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('voice_agent_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadConfigs(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete config:', error);
      throw error;
    }
  }, [loadConfigs]);

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