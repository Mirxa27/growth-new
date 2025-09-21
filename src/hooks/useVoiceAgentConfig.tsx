import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { errorHandler } from '@/lib/error-handler';
import { logger } from '@/utils/logger';

type VoiceAgentConfig = Tables<'voice_agent_configs'>;

interface UseVoiceAgentConfigReturn {
  configs: VoiceAgentConfig[] | null;
  activeConfig: VoiceAgentConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createConfig: (config: Partial<VoiceAgentConfig>) => Promise<VoiceAgentConfig | null>;
  updateConfig: (id: string, updates: Partial<VoiceAgentConfig>) => Promise<VoiceAgentConfig | null>;
  deleteConfig: (id: string) => Promise<boolean>;
  setActiveConfig: (id: string) => Promise<boolean>;
}

export const useVoiceAgentConfig = (): UseVoiceAgentConfigReturn => {
  const [configs, setConfigs] = useState<VoiceAgentConfig[] | null>(null);
  const [activeConfig, setActiveConfig] = useState<VoiceAgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConfigs(data || []);
      
      // Find active config
      const active = data?.find(config => config.is_active) || data?.[0] || null;
      setActiveConfig(active);
    } catch (err) {
      const appError = errorHandler.handleError(err, 'useVoiceAgentConfig');
      logger.error('Failed to fetch voice agent configs', 'useVoiceAgentConfig', appError);
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConfig = useCallback(async (configData: Partial<VoiceAgentConfig>): Promise<VoiceAgentConfig | null> => {
    try {
      const { data, error: createError } = await supabase
        .from('voice_agent_configs')
        .insert(configData)
        .select()
        .single();

      if (createError) throw createError;

      // Refresh configs
      await fetchConfigs();
      
      logger.info('Voice agent config created successfully', 'useVoiceAgentConfig', { id: data.id });
      return data;
    } catch (err) {
      const appError = errorHandler.handleError(err, 'useVoiceAgentConfig');
      logger.error('Failed to create voice agent config', 'useVoiceAgentConfig', appError);
      setError(appError.message);
      return null;
    }
  }, [fetchConfigs]);

  const updateConfig = useCallback(async (id: string, updates: Partial<VoiceAgentConfig>): Promise<VoiceAgentConfig | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('voice_agent_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh configs
      await fetchConfigs();
      
      logger.info('Voice agent config updated successfully', 'useVoiceAgentConfig', { id });
      return data;
    } catch (err) {
      const appError = errorHandler.handleError(err, 'useVoiceAgentConfig');
      logger.error('Failed to update voice agent config', 'useVoiceAgentConfig', appError);
      setError(appError.message);
      return null;
    }
  }, [fetchConfigs]);

  const deleteConfig = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('voice_agent_configs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh configs
      await fetchConfigs();
      
      logger.info('Voice agent config deleted successfully', 'useVoiceAgentConfig', { id });
      return true;
    } catch (err) {
      const appError = errorHandler.handleError(err, 'useVoiceAgentConfig');
      logger.error('Failed to delete voice agent config', 'useVoiceAgentConfig', appError);
      setError(appError.message);
      return false;
    }
  }, [fetchConfigs]);

  const setActiveConfig = useCallback(async (id: string): Promise<boolean> => {
    try {
      // First, deactivate all configs
      const { error: deactivateError } = await supabase
        .from('voice_agent_configs')
        .update({ is_active: false })
        .neq('id', id);

      if (deactivateError) throw deactivateError;

      // Then activate the selected config
      const { error: activateError } = await supabase
        .from('voice_agent_configs')
        .update({ is_active: true })
        .eq('id', id);

      if (activateError) throw activateError;

      // Refresh configs
      await fetchConfigs();
      
      logger.info('Active voice agent config changed', 'useVoiceAgentConfig', { id });
      return true;
    } catch (err) {
      const appError = errorHandler.handleError(err, 'useVoiceAgentConfig');
      logger.error('Failed to set active voice agent config', 'useVoiceAgentConfig', appError);
      setError(appError.message);
      return false;
    }
  }, [fetchConfigs]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    activeConfig,
    loading,
    error,
    refresh: fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    setActiveConfig,
  };
};

export default useVoiceAgentConfig;