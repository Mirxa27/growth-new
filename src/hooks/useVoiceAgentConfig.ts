import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type VoiceAgentConfig = Tables<'voice_agent_configs'>;
type VoiceAgentConfigInsert = TablesInsert<'voice_agent_configs'>;
type VoiceAgentConfigUpdate = TablesUpdate<'voice_agent_configs'>;

export const useVoiceAgentConfig = () => {
  const [configs, setConfigs] = useState<VoiceAgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchErr) throw fetchErr;
      setConfigs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const addConfig = async (config: Omit<TablesInsert<'voice_agent_configs'>, 'id' | 'created_at'>) => {
    const { data, error: addErr } = await supabase
      .from('voice_agent_configs')
      .insert(config)
      .select();
    if (addErr) throw addErr;
    if (data) setConfigs(prev => [data[0], ...prev]);
  };

  const updateConfig = async (id: string, updates: TablesUpdate<'voice_agent_configs'>) => {
    const { data, error: updateErr } = await supabase
      .from('voice_agent_configs')
      .update(updates)
      .eq('id', id)
      .select();
    if (updateErr) throw updateErr;
    if (data) {
      setConfigs(prev => prev.map(c => c.id === id ? data[0] : c));
    }
  };

  const deleteConfig = async (id: string) => {
    const { error: deleteErr } = await supabase
      .from('voice_agent_configs')
      .delete()
      .eq('id', id);
    if (deleteErr) throw deleteErr;
    setConfigs(prev => prev.filter(c => c.id !== id));
  };

  return { configs, loading, error, fetchConfigs, addConfig, updateConfig, deleteConfig };
};