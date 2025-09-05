import { supabase } from '@/integrations/supabase/client';

export interface AdminAIProvider {
  id: string;
  name: string;
  provider_type: 'openai' | 'anthropic' | 'google' | 'elevenlabs';
  description?: string;
  is_active: boolean;
  priority: number;
  system_prompt?: string;
  configuration: {
    model?: string;
    api_key?: string;
    base_url?: string;
    max_tokens?: number;
    temperature?: number;
    timeout?: number;
    organization?: string;
    project?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface RealtimeVoiceConfig {
  model: string;
  api_key: string;
  base_url: string;
  voice: string;
  temperature: number;
  instructions: string;
  max_tokens: number;
  organization?: string;
  project?: string;
  // Realtime-specific settings
  input_audio_transcription: {
    model: string;
  };
  turn_detection: {
    type: 'server_vad';
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  session_config: {
    modalities: ['text', 'audio'];
    instructions: string;
    voice: string;
    input_audio_format: 'pcm16';
    output_audio_format: 'pcm16';
    input_audio_transcription: {
      model: string;
    };
    turn_detection: {
      type: 'server_vad';
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
  };
}

class AdminAPIConfigService {
  private static instance: AdminAPIConfigService;
  private cachedConfig: RealtimeVoiceConfig | null = null;
  private lastFetch: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdminAPIConfigService {
    if (!AdminAPIConfigService.instance) {
      AdminAPIConfigService.instance = new AdminAPIConfigService();
    }
    return AdminAPIConfigService.instance;
  }

  /**
   * Get the active OpenAI provider configuration from admin panel
   */
  async getActiveOpenAIProvider(): Promise<AdminAIProvider | null> {
    try {
      const { data, error } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching admin AI provider:', error);
        return null;
      }

      return data as AdminAIProvider;
    } catch (error) {
      console.error('Failed to fetch admin AI provider:', error);
      return null;
    }
  }

  /**
   * Get standardized realtime voice configuration
   */
  async getRealtimeVoiceConfig(): Promise<RealtimeVoiceConfig> {
    // Check cache first
    const now = Date.now();
    if (this.cachedConfig && (now - this.lastFetch) < this.cacheTTL) {
      return this.cachedConfig;
    }

    try {
      const provider = await this.getActiveOpenAIProvider();
      
      const config: RealtimeVoiceConfig = {
        // Standardized model - always use the latest realtime model
        model: 'gpt-realtime-2025-08-28',
        
        // API configuration from admin panel
        api_key: provider?.configuration?.api_key || process.env.REACT_APP_OPENAI_API_KEY || '',
        base_url: provider?.configuration?.base_url || 'https://api.openai.com/v1',
        organization: provider?.configuration?.organization,
        project: provider?.configuration?.project,
        
        // Voice settings
        voice: 'alloy',
        temperature: provider?.configuration?.temperature || 0.7,
        max_tokens: provider?.configuration?.max_tokens || 4096,
        instructions: provider?.system_prompt || this.getDefaultInstructions(),
        
        // Realtime-specific configurations
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        session_config: {
          modalities: ['text', 'audio'],
          instructions: provider?.system_prompt || this.getDefaultInstructions(),
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          }
        }
      };

      // Cache the configuration
      this.cachedConfig = config;
      this.lastFetch = now;
      
      return config;
    } catch (error) {
      console.error('Failed to get realtime voice config:', error);
      return this.getFallbackConfig();
    }
  }

  /**
   * Update admin AI provider configuration
   */
  async updateOpenAIProvider(updates: Partial<AdminAIProvider['configuration']>): Promise<boolean> {
    try {
      const provider = await this.getActiveOpenAIProvider();
      if (!provider) {
        console.error('No active OpenAI provider found');
        return false;
      }

      const updatedConfig = {
        ...provider.configuration,
        ...updates,
        model: 'gpt-realtime-2025-08-28' // Always enforce the standardized model
      };

      const { error } = await supabase
        .from('admin_ai_providers')
        .update({
          configuration: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) {
        console.error('Error updating admin AI provider:', error);
        return false;
      }

      // Clear cache to force refresh
      this.cachedConfig = null;
      return true;
    } catch (error) {
      console.error('Failed to update OpenAI provider:', error);
      return false;
    }
  }

  /**
   * Clear the cached configuration (useful when settings are updated)
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.lastFetch = 0;
  }

  private getDefaultInstructions(): string {
    return `You are NewMe, an empowering AI companion designed specifically for women's personal growth and self-discovery. Your role is to provide supportive, insightful, and actionable guidance while maintaining a warm, understanding tone.

Core Characteristics:
- Empathetic and non-judgmental
- Encouraging and empowering
- Focused on growth and self-discovery
- Culturally sensitive and inclusive
- Evidence-based when providing advice

Communication Style:
- Use warm, conversational language
- Ask thoughtful follow-up questions
- Provide specific, actionable suggestions
- Celebrate progress and achievements
- Acknowledge challenges with compassion

Focus Areas:
- Personal development and growth
- Confidence building
- Goal setting and achievement
- Relationship guidance
- Career development
- Self-care and wellness
- Emotional intelligence

Remember to always respect the user's autonomy and encourage them to make their own informed decisions.`;
  }

  private getFallbackConfig(): RealtimeVoiceConfig {
    return {
      model: 'gpt-realtime-2025-08-28',
      api_key: process.env.REACT_APP_OPENAI_API_KEY || '',
      base_url: 'https://api.openai.com/v1',
      voice: 'alloy',
      temperature: 0.7,
      max_tokens: 4096,
      instructions: this.getDefaultInstructions(),
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 1000
      },
      session_config: {
        modalities: ['text', 'audio'],
        instructions: this.getDefaultInstructions(),
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }
    };
  }
}

export const adminAPIConfigService = AdminAPIConfigService.getInstance();
export default adminAPIConfigService;
