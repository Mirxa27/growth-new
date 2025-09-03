/**
 * AI Provider Models Service
 * Fetches available models and voices from different AI providers
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { openaiService } from '@/services/ai/openai.service';
import { anthropicService } from '@/services/ai/anthropic.service';
import { googleAIService } from '@/services/ai/google.service';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider_type: string;
  max_tokens: number;
  supports_voice: boolean;
  supports_vision: boolean;
  cost_per_1k_tokens?: number;
}

export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  gender?: string;
  accent?: string;
}

class AIProviderModelsService {
  /**
   * Fetch available models from OpenAI
   */
  async fetchOpenAIModels(apiKey: string): Promise<AIModel[]> {
    try {
      // Set the API key temporarily for this request
      const originalKey = openaiService.getApiKey();
      openaiService.setApiKey(apiKey);
      
      try {
        const openAIModels = await openaiService.getModels();
        const models: AIModel[] = [];

        // Add realtime models that might not be in the list
        const realtimeModels = [
          {
            id: 'gpt-4o-realtime-preview-2024-10-01',
            name: 'GPT-4o Realtime Preview (October 2024)',
            description: 'Realtime voice conversations with GPT-4'
          },
          {
            id: 'gpt-4o-realtime-preview-2024-12-17',
            name: 'GPT-4o Realtime Preview (December 2024)',
            description: 'Latest realtime model with improved capabilities'
          },
          {
            id: 'gpt-4o-realtime-preview',
            name: 'GPT-4o Realtime Preview',
            description: 'Current realtime model for voice interactions'
          }
        ];

        // Add realtime models
        for (const rtModel of realtimeModels) {
          models.push({
            id: rtModel.id,
            name: rtModel.name,
            description: rtModel.description,
            provider_type: 'openai',
            max_tokens: 4096,
            supports_voice: true,
            supports_vision: true,
            cost_per_1k_tokens: 0.015
          });
        }

        // Filter and map relevant models
        const relevantModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'];
        
        for (const model of openAIModels) {
          if (relevantModels.some(m => model.id.includes(m)) && !model.id.includes('instruct')) {
            models.push({
              id: model.id,
              name: this.formatModelName(model.id),
              description: this.getModelDescription(model.id),
              provider_type: 'openai',
              max_tokens: this.getMaxTokens(model.id),
              supports_voice: model.id.includes('realtime'),
              supports_vision: model.id.includes('vision') || model.id.includes('gpt-4'),
              cost_per_1k_tokens: this.getModelCost(model.id)
            });
          }
        }

        return models;
      } finally {
        // Restore original key
        if (originalKey) {
          openaiService.setApiKey(originalKey);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch OpenAI models', 'AIProviderModelsService', error);
      throw error;
    }
  }

  /**
   * Fetch available voices from OpenAI
   */
  async fetchOpenAIVoices(): Promise<Voice[]> {
    // OpenAI TTS voices
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', gender: 'neutral' },
      { id: 'echo', name: 'Echo', description: 'Warm and engaging', gender: 'male' },
      { id: 'fable', name: 'Fable', description: 'Expressive and dynamic', gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', gender: 'male' },
      { id: 'nova', name: 'Nova', description: 'Friendly and conversational', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft and pleasant', gender: 'female' }
    ];
  }

  /**
   * Fetch available models from Anthropic
   */
  async fetchAnthropicModels(apiKey: string): Promise<AIModel[]> {
    try {
      // Set the API key temporarily
      const originalKey = anthropicService.getApiKey();
      anthropicService.setApiKey(apiKey);
      
      try {
        const models = await anthropicService.getModels();
        
        return models.map(model => {
          const price = anthropicService.getModelPricing(model.id);
          return {
            id: model.id,
            name: model.name,
            description: model.description,
            provider_type: 'anthropic',
            max_tokens: model.id.includes('claude-3-5') ? 200000 : 
                       model.id.includes('claude-3') ? 200000 : 
                       model.id.includes('claude-2') ? 100000 : 100000,
            supports_voice: false,
            supports_vision: model.id.includes('claude-3'),
            cost_per_1k_tokens: price.output
          };
        });
      } finally {
        if (originalKey) {
          anthropicService.setApiKey(originalKey);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch Anthropic models', 'AIProviderModelsService', error);
      // Return fallback models
      return [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Most capable model for complex tasks',
          provider_type: 'anthropic',
          max_tokens: 200000,
          supports_voice: false,
          supports_vision: true,
          cost_per_1k_tokens: 0.003
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          description: 'Powerful model for complex analysis',
          provider_type: 'anthropic',
          max_tokens: 200000,
          supports_voice: false,
          supports_vision: true,
          cost_per_1k_tokens: 0.015
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          description: 'Fast and cost-effective',
          provider_type: 'anthropic',
          max_tokens: 200000,
          supports_voice: false,
          supports_vision: false,
          cost_per_1k_tokens: 0.00025
        }
      ];
    }
  }

  /**
   * Fetch available models from Google
   */
  async fetchGoogleModels(apiKey: string): Promise<AIModel[]> {
    try {
      // Set the API key temporarily
      const originalKey = googleAIService.getApiKey();
      googleAIService.setApiKey(apiKey);
      
      try {
        const models = await googleAIService.getModels();
        
        return models.map(model => {
          const price = googleAIService.getModelPricing(model.id);
          return {
            id: model.id,
            name: model.name,
            description: model.description,
            provider_type: 'google',
            max_tokens: model.id.includes('1.5') ? 1048576 : 30720,
            supports_voice: false,
            supports_vision: model.id.includes('vision'),
            cost_per_1k_tokens: price.output
          };
        });
      } finally {
        if (originalKey) {
          googleAIService.setApiKey(originalKey);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch Google models', 'AIProviderModelsService', error);
      // Return fallback models
      return [
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          description: 'Best for text-only prompts',
          provider_type: 'google',
          max_tokens: 30720,
          supports_voice: false,
          supports_vision: false,
          cost_per_1k_tokens: 0.0015
        },
        {
          id: 'gemini-pro-vision',
          name: 'Gemini Pro Vision',
          description: 'Best for text and image prompts',
          provider_type: 'google',
          max_tokens: 30720,
          supports_voice: false,
          supports_vision: true,
          cost_per_1k_tokens: 0.0025
        }
      ];
    }
  }

  /**
   * Fetch available voices from ElevenLabs
   */
  async fetchElevenLabsVoices(apiKey: string): Promise<Voice[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      const voices: Voice[] = [];

      for (const voice of data.voices) {
        voices.push({
          id: voice.voice_id,
          name: voice.name,
          description: voice.description,
          preview_url: voice.preview_url,
          gender: voice.labels?.gender,
          accent: voice.labels?.accent
        });
      }

      return voices;
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voices', 'AIProviderModelsService', error);
      // Return some default voices if API fails
      return [
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Soft and warm', gender: 'female' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Well-rounded and engaging', gender: 'male' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Young and energetic', gender: 'female' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Deep and confident', gender: 'male' },
        { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Crisp and authoritative', gender: 'male' }
      ];
    }
  }

  /**
   * Fetch models based on provider type
   */
  async fetchModelsForProvider(providerType: string, apiKey?: string): Promise<AIModel[]> {
    if (!apiKey) {
      logger.warn(`No API key provided for ${providerType}`, 'AIProviderModelsService');
      return this.getDefaultModels(providerType);
    }

    switch (providerType) {
      case 'openai':
        return this.fetchOpenAIModels(apiKey);
      case 'anthropic':
        return this.fetchAnthropicModels(apiKey);
      case 'google':
        return this.fetchGoogleModels(apiKey);
      default:
        return this.getDefaultModels(providerType);
    }
  }

  /**
   * Fetch voices based on provider type
   */
  async fetchVoicesForProvider(providerType: string, apiKey?: string): Promise<Voice[]> {
    switch (providerType) {
      case 'openai':
        return this.fetchOpenAIVoices();
      case 'elevenlabs':
        if (apiKey) {
          return this.fetchElevenLabsVoices(apiKey);
        }
        return [];
      default:
        return [];
    }
  }

  /**
   * Get default models for a provider
   */
  private getDefaultModels(providerType: string): AIModel[] {
    switch (providerType) {
      case 'openai':
        return [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'Most capable OpenAI model',
            provider_type: 'openai',
            max_tokens: 8192,
            supports_voice: false,
            supports_vision: true,
            cost_per_1k_tokens: 0.06
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Fast and cost-effective',
            provider_type: 'openai',
            max_tokens: 4096,
            supports_voice: false,
            supports_vision: false,
            cost_per_1k_tokens: 0.0015
          }
        ];
      case 'anthropic':
        return this.fetchAnthropicModels('');
      case 'google':
        return [
          {
            id: 'gemini-pro',
            name: 'Gemini Pro',
            description: 'Google\'s advanced AI model',
            provider_type: 'google',
            max_tokens: 30720,
            supports_voice: false,
            supports_vision: true,
            cost_per_1k_tokens: 0.0005
          }
        ];
      case 'elevenlabs':
        return [
          {
            id: 'eleven_monolingual_v1',
            name: 'Eleven Monolingual v1',
            description: 'High-quality voice synthesis',
            provider_type: 'elevenlabs',
            max_tokens: 2500,
            supports_voice: true,
            supports_vision: false,
            cost_per_1k_tokens: 0.055
          }
        ];
      default:
        return [];
    }
  }

  /**
   * Helper methods
   */
  private formatModelName(modelId: string): string {
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('Gpt', 'GPT')
      .replace('Turbo', 'Turbo')
      .replace('4o', '4 Omni');
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4': 'Most capable GPT-4 model',
      'gpt-4-turbo': 'Fast and efficient GPT-4',
      'gpt-4o': 'Optimized GPT-4 with vision',
      'gpt-3.5-turbo': 'Fast and cost-effective',
      'gpt-4-vision': 'GPT-4 with vision capabilities'
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      if (modelId.includes(key)) return desc;
    }
    return 'AI language model';
  }

  private getMaxTokens(modelId: string): number {
    if (modelId.includes('gpt-4-turbo') || modelId.includes('gpt-4o')) return 128000;
    if (modelId.includes('gpt-4')) return 8192;
    if (modelId.includes('gpt-3.5-turbo-16k')) return 16384;
    if (modelId.includes('gpt-3.5-turbo')) return 4096;
    return 4096;
  }

  private getModelCost(modelId: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.06,
      'gpt-4-turbo': 0.01,
      'gpt-4o': 0.005,
      'gpt-3.5-turbo': 0.0015,
      'gpt-3.5-turbo-16k': 0.003
    };

    for (const [key, cost] of Object.entries(costs)) {
      if (modelId.includes(key)) return cost;
    }
    return 0.01;
  }

  private getGoogleModelCost(modelName: string): number {
    if (modelName.includes('gemini-pro-vision')) return 0.0025;
    if (modelName.includes('gemini-pro')) return 0.0005;
    if (modelName.includes('gemini-1.5')) return 0.002;
    return 0.001;
  }
}

export const aiProviderModelsService = new AIProviderModelsService();