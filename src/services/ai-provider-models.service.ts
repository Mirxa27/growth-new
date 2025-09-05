/**
 * AI Provider Models Service
 * Fetches available models and voices from different AI providers
 */

import { logger } from '@/utils/logger';
import { getAllOpenAIModels } from '@/services/ai/openai-models-fix';

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
      // Use the fixed models list to ensure all models are available
      const fixedModels = getAllOpenAIModels();
      const models: AIModel[] = [];

      // Add all models from the fixed list
      for (const model of fixedModels) {
        const modelData = model as any;
        const maxTokens = modelData.max_tokens || this.getMaxTokens(modelData.id);
        const supportsVoice = modelData.supports_voice !== undefined ? modelData.supports_voice : false;
        const supportsVision = modelData.supports_vision !== undefined ? modelData.supports_vision : false;
        const costPer1kTokens = modelData.cost_per_1k_tokens || this.getModelCost(modelData.id);
        
        models.push({
          id: modelData.id,
          name: modelData.name || this.formatModelName(modelData.id),
          description: modelData.description || this.getModelDescription(modelData.id),
          provider_type: 'openai',
          max_tokens: maxTokens,
          supports_voice: supportsVoice,
          supports_vision: supportsVision,
          cost_per_1k_tokens: costPer1kTokens
        });
      }

      // Try to fetch from API as well (but don't fail if it doesn't work)
      try {
        // Use the provided API key for the request
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const apiModels = data.data || [];
          
          // Add any models from API that aren't in our fixed list
          for (const apiModel of apiModels) {
            if (!models.find(m => m.id === apiModel.id)) {
              models.push({
                id: apiModel.id,
                name: this.formatModelName(apiModel.id),
                description: this.getModelDescription(apiModel.id),
                provider_type: 'openai',
                max_tokens: this.getMaxTokens(apiModel.id),
                supports_voice: false,
                supports_vision: apiModel.id.includes('vision') || apiModel.id.includes('gpt-4o'),
                cost_per_1k_tokens: this.getModelCost(apiModel.id)
              });
            }
          }
        }
      } catch (apiError) {
        // Log but don't throw - we have the fixed models as fallback
        logger.warn('Failed to fetch models from OpenAI API, using fixed list');
      }

      return models.sort((a, b) => {
        // Sort by: realtime first, then gpt-4 variants, then gpt-3.5, then others
        const order = ['realtime', 'gpt-4o', 'gpt-4', 'gpt-3.5', 'whisper', 'tts', 'embedding'];
        const getOrder = (id: string) => {
          for (let i = 0; i < order.length; i++) {
            if (id.includes(order[i])) return i;
          }
          return order.length;
        };
        return getOrder(a.id) - getOrder(b.id);
      });
    } catch (error) {
      logger.error('Failed to fetch OpenAI models');
      // Return the fixed models list as fallback
      return getAllOpenAIModels().map(model => {
        const modelData = model as any;
        return {
          id: modelData.id,
          name: modelData.name || this.formatModelName(modelData.id),
          description: modelData.description || this.getModelDescription(modelData.id),
          provider_type: 'openai',
          max_tokens: modelData.max_tokens || this.getMaxTokens(modelData.id),
          supports_voice: modelData.supports_voice || false,
          supports_vision: modelData.supports_vision || false,
          cost_per_1k_tokens: modelData.cost_per_1k_tokens || this.getModelCost(modelData.id)
        };
      });
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
      // Try to fetch from Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        return models.map((model: any) => {
          return {
            id: model.id,
            name: model.display_name || model.id,
            description: model.description || 'Anthropic AI model',
            provider_type: 'anthropic',
            max_tokens: model.id.includes('claude-3-5') ? 200000 : 
                       model.id.includes('claude-3') ? 200000 : 
                       model.id.includes('claude-2') ? 100000 : 100000,
            supports_voice: false,
            supports_vision: model.id.includes('claude-3'),
            cost_per_1k_tokens: this.getAnthropicModelCost(model.id)
          };
        });
      }
    } catch (error) {
      logger.error('Failed to fetch Anthropic models');
    }
    
    // Return fallback models if API fails
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

  /**
   * Fetch available models from Google
   */
  async fetchGoogleModels(apiKey: string): Promise<AIModel[]> {
    try {
      // Google AI models are typically hardcoded since they don't have a dynamic models endpoint
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
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'Advanced model with long context',
          provider_type: 'google',
          max_tokens: 1048576,
          supports_voice: false,
          supports_vision: true,
          cost_per_1k_tokens: 0.0035
        }
      ];
    } catch (error) {
      logger.error('Failed to fetch Google models');
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
      logger.error('Failed to fetch ElevenLabs voices');
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
      logger.warn(`No API key provided for ${providerType}`);
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

  private getAnthropicModelCost(modelId: string): number {
    if (modelId.includes('claude-3-5-sonnet')) return 0.003;
    if (modelId.includes('claude-3-opus')) return 0.015;
    if (modelId.includes('claude-3-haiku')) return 0.00025;
    return 0.01;
  }
}

export const aiProviderModelsService = new AIProviderModelsService();
