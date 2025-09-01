/**
 * Voice Service
 * Handles all voice-related operations including OpenAI integration
 */

import { BaseApiService, type ApiResponse } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type VoiceAgentConfig = Tables<'voice_agent_configs'>;
export type VoiceAgentConfigInsert = TablesInsert<'voice_agent_configs'>;
export type VoiceAgentConfigUpdate = TablesUpdate<'voice_agent_configs'>;

export interface VoiceSession {
  id: string;
  userId: string;
  configId: string;
  startedAt: Date;
  endedAt?: Date;
  transcript: string[];
  metadata?: Record<string, any>;
}

export interface VoiceToken {
  token: string;
  expiresAt: Date;
  sessionId: string;
}

export interface RealtimeConfig {
  apiKey: string;
  model: string;
  voice: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
  tools?: any[];
}

class VoiceService extends BaseApiService {
  private openAIApiKey: string | undefined;
  
  constructor() {
    super('voice_agent_configs');
    this.openAIApiKey = env.openai.apiKey;
  }
  
  /**
   * Check if voice features are available
   */
  isVoiceEnabled(): boolean {
    return env.features.voiceChat && !!this.openAIApiKey;
  }
  
  /**
   * Get the active voice configuration
   */
  async getActiveConfig(): Promise<ApiResponse<VoiceAgentConfig>> {
    try {
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (!data) {
        // Create default configuration if none exists
        return this.createDefaultConfig();
      }
      
      return {
        data: data as VoiceAgentConfig,
        error: null,
      };
    } catch (error) {
      this.logError('getActiveConfig', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Create a default voice configuration
   */
  private async createDefaultConfig(): Promise<ApiResponse<VoiceAgentConfig>> {
    const defaultConfig: VoiceAgentConfigInsert = {
      name: 'Default Assistant',
      provider: 'openai',
      voice: 'alloy',
      model: env.openai.realtimeModel || 'gpt-realtime-2025-08-28',
      temperature: env.openai.temperature,
      instructions: `You are a helpful life navigation assistant. Your role is to:
1. Provide thoughtful, empathetic guidance
2. Help users explore their thoughts and feelings
3. Offer practical advice and actionable insights
4. Maintain a warm, professional tone
5. Respect privacy and boundaries

Always be supportive, non-judgmental, and focused on the user's growth and well-being.`,
      is_active: true,
    };
    
    try {
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .insert(defaultConfig)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: data as VoiceAgentConfig,
        error: null,
      };
    } catch (error) {
      this.logError('createDefaultConfig', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Update voice configuration
   */
  async updateConfig(
    id: string,
    updates: VoiceAgentConfigUpdate
  ): Promise<ApiResponse<VoiceAgentConfig>> {
    try {
      // If setting as active, deactivate others first
      if (updates.is_active) {
        await supabase
          .from('voice_agent_configs')
          .update({ is_active: false })
          .neq('id', id);
      }
      
      const { data, error } = await supabase
        .from('voice_agent_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: data as VoiceAgentConfig,
        error: null,
      };
    } catch (error) {
      this.logError('updateConfig', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Generate a voice session token for OpenAI Realtime API
   */
  async generateVoiceToken(userId: string): Promise<ApiResponse<VoiceToken>> {
    try {
      if (!this.isVoiceEnabled()) {
        throw new Error('Voice features are not enabled. Please configure OpenAI API key.');
      }
      
      // Get active configuration
      const { data: config, error: configError } = await this.getActiveConfig();
      if (configError || !config) {
        throw new Error('No active voice configuration found');
      }
      
      // Generate session ID
      const sessionId = `voice_${userId}_${Date.now()}`;
      
      // For production, you would call a secure backend endpoint
      // that generates ephemeral tokens. For now, we'll use the API key directly
      // with a warning that this should be replaced in production
      
      if (env.isProduction()) {
        // In production, call your backend service
        const response = await fetch(`${env.supabase.url}/functions/v1/generate-voice-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            userId,
            configId: config.id,
            sessionId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate voice token');
        }
        
        const { token, expiresAt } = await response.json();
        
        return {
          data: {
            token,
            expiresAt: new Date(expiresAt),
            sessionId,
          },
          error: null,
        };
      } else {
        // Development mode - use API key directly (not secure for production!)
        console.warn('Using API key directly in development mode. This is not secure for production!');
        
        return {
          data: {
            token: this.openAIApiKey!,
            expiresAt: new Date(Date.now() + 3600000), // 1 hour
            sessionId,
          },
          error: null,
        };
      }
    } catch (error) {
      this.logError('generateVoiceToken', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get realtime configuration for voice chat
   */
  async getRealtimeConfig(): Promise<ApiResponse<RealtimeConfig>> {
    try {
      if (!this.isVoiceEnabled()) {
        throw new Error('Voice features are not enabled');
      }
      
      const { data: config, error } = await this.getActiveConfig();
      if (error || !config) {
        throw new Error('No active voice configuration');
      }
      
      // Build tools configuration for the AI
      const tools = this.buildVoiceTools();
      
      return {
        data: {
          apiKey: this.openAIApiKey!,
          model: config.model || env.openai.realtimeModel || 'gpt-realtime-2025-08-28',
          voice: config.voice || 'alloy',
          instructions: config.instructions || '',
          temperature: config.temperature || env.openai.temperature,
          maxTokens: env.openai.maxTokens,
          tools,
        },
        error: null,
      };
    } catch (error) {
      this.logError('getRealtimeConfig', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Build tools/functions available to the voice AI
   */
  private buildVoiceTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_user_profile',
          description: 'Get information about the user\'s profile and preferences',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'recommend_assessment',
          description: 'Recommend an assessment based on user needs',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The category of assessment to recommend',
                enum: ['personality', 'career', 'relationships', 'wellness', 'skills'],
              },
            },
            required: ['category'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'schedule_reminder',
          description: 'Schedule a reminder for the user',
          parameters: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'The reminder message',
              },
              datetime: {
                type: 'string',
                description: 'When to send the reminder (ISO 8601 format)',
              },
            },
            required: ['message', 'datetime'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_library',
          description: 'Search the library for relevant content',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              category: {
                type: 'string',
                description: 'Optional category filter',
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }
  
  /**
   * Save voice session transcript
   */
  async saveSessionTranscript(
    sessionId: string,
    transcript: string[],
    metadata?: Record<string, any>
  ): Promise<ApiResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('voice_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          transcript,
          metadata,
          ended_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      return {
        data: null,
        error: null,
      };
    } catch (error) {
      this.logError('saveSessionTranscript', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get user's voice session history
   */
  async getUserSessions(userId: string): Promise<ApiResponse<VoiceSession[]>> {
    try {
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return {
        data: (data || []) as any,
        error: null,
      };
    } catch (error) {
      this.logError('getUserSessions', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Test voice configuration
   */
  async testConfiguration(configId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      if (!this.isVoiceEnabled()) {
        return {
          data: {
            success: false,
            message: 'Voice features are not enabled. Please configure OpenAI API key in Settings.',
          },
          error: null,
        };
      }
      
      // Check if API key is valid format
      if (this.openAIApiKey && !this.openAIApiKey.startsWith('sk-')) {
        return {
          data: {
            success: false,
            message: 'Invalid OpenAI API key format. Keys should start with "sk-"',
          },
          error: null,
        };
      }
      
      // Get the configuration to test
      const { data: config } = await this.findById<VoiceAgentConfig>(configId);
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      // Test OpenAI connection with a simple completion
      // Use a chat model for testing, not the realtime model
      const testModel = config.model?.includes('realtime') ? 'gpt-4o-mini' : (config.model || 'gpt-4o-mini');
      
      const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            {
              role: 'system',
              content: config.instructions || 'You are a helpful assistant.',
            },
            {
              role: 'user',
              content: 'Say "Configuration test successful" if you can hear me.',
            },
          ],
          max_tokens: 50,
          temperature: config.temperature || 0.7,
        }),
      });
      
      if (!testResponse.ok) {
        const error = await testResponse.json();
        throw new Error(error.error?.message || 'Failed to connect to OpenAI');
      }
      
      const result = await testResponse.json();
      const responseText = result.choices?.[0]?.message?.content || '';
      
      return {
        data: {
          success: true,
          message: `Configuration test successful. Model: ${config.model}, Voice: ${config.voice}`,
        },
        error: null,
      };
    } catch (error) {
      this.logError('testConfiguration', error);
      return {
        data: {
          success: false,
          message: error instanceof Error ? error.message : 'Configuration test failed',
        },
        error: null,
      };
    }
  }
}

export const voiceService = new VoiceService();