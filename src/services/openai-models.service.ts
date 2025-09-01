/**
 * OpenAI Models Service
 * Manages model fetching, caching, and validation
 */

import { adaptiveOpenAIService } from './adaptive-openai.service';

export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  category: 'chat' | 'realtime' | 'embedding' | 'tts' | 'stt' | 'image';
  context_window: number;
  max_output_tokens?: number;
  supports_functions?: boolean;
  supports_vision?: boolean;
  supports_voice?: boolean;
  pricing?: {
    input: number;  // per 1k tokens
    output: number; // per 1k tokens
  };
  deprecated?: boolean;
  replacement?: string;
}

class OpenAIModelsService {
  private models: Map<string, OpenAIModel> = new Map();
  private lastFetch: number = 0;
  private fetchInterval = 3600000; // 1 hour cache
  private isInitialized = false;

  /**
   * Predefined models with metadata
   * This ensures we always have accurate model information
   */
  private readonly PREDEFINED_MODELS: OpenAIModel[] = [
    // Chat Models
    {
      id: 'gpt-4o',
      name: 'GPT-4 Optimized',
      description: 'Most capable model, optimized for speed and cost',
      category: 'chat',
      context_window: 128000,
      max_output_tokens: 4096,
      supports_functions: true,
      supports_vision: true,
      pricing: { input: 5, output: 15 }
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4 Optimized Mini',
      description: 'Affordable small model for simple tasks',
      category: 'chat',
      context_window: 128000,
      max_output_tokens: 16384,
      supports_functions: true,
      supports_vision: true,
      pricing: { input: 0.15, output: 0.6 }
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Latest GPT-4 Turbo model with vision',
      category: 'chat',
      context_window: 128000,
      max_output_tokens: 4096,
      supports_functions: true,
      supports_vision: true,
      pricing: { input: 10, output: 30 }
    },
    {
      id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo Preview',
      description: 'Preview version of GPT-4 Turbo',
      category: 'chat',
      context_window: 128000,
      max_output_tokens: 4096,
      supports_functions: true,
      pricing: { input: 10, output: 30 }
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Original GPT-4 model',
      category: 'chat',
      context_window: 8192,
      max_output_tokens: 4096,
      supports_functions: true,
      pricing: { input: 30, output: 60 }
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and inexpensive model for simple tasks',
      category: 'chat',
      context_window: 16385,
      max_output_tokens: 4096,
      supports_functions: true,
      pricing: { input: 0.5, output: 1.5 }
    },
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5 Turbo 16K',
      description: 'Extended context window version',
      category: 'chat',
      context_window: 16385,
      max_output_tokens: 4096,
      supports_functions: true,
      pricing: { input: 3, output: 4 },
      deprecated: true,
      replacement: 'gpt-3.5-turbo'
    },

    // Realtime Models
    {
      id: 'gpt-4o-realtime-preview',
      name: 'GPT-4 Optimized Realtime Preview',
      description: 'Real-time voice conversation model',
      category: 'realtime',
      context_window: 128000,
      supports_voice: true,
      pricing: { input: 5, output: 20 }
    },
    {
      id: 'gpt-4o-realtime-preview-2024-10-01',
      name: 'GPT-4 Optimized Realtime (Oct 2024)',
      description: 'Real-time voice conversation model with improvements',
      category: 'realtime',
      context_window: 128000,
      supports_voice: true,
      pricing: { input: 5, output: 20 }
    },

    // Embedding Models
    {
      id: 'text-embedding-3-large',
      name: 'Text Embedding 3 Large',
      description: 'Most capable embedding model',
      category: 'embedding',
      context_window: 8191,
      pricing: { input: 0.13, output: 0 }
    },
    {
      id: 'text-embedding-3-small',
      name: 'Text Embedding 3 Small',
      description: 'Highly efficient embedding model',
      category: 'embedding',
      context_window: 8191,
      pricing: { input: 0.02, output: 0 }
    },
    {
      id: 'text-embedding-ada-002',
      name: 'Text Embedding Ada v2',
      description: 'Previous generation embedding model',
      category: 'embedding',
      context_window: 8191,
      pricing: { input: 0.1, output: 0 }
    },

    // Audio Models
    {
      id: 'whisper-1',
      name: 'Whisper',
      description: 'Speech to text model',
      category: 'stt',
      context_window: 0,
      pricing: { input: 0.006, output: 0 } // per minute
    },
    {
      id: 'tts-1',
      name: 'TTS 1',
      description: 'Text to speech model',
      category: 'tts',
      context_window: 4096,
      pricing: { input: 15, output: 0 } // per 1M characters
    },
    {
      id: 'tts-1-hd',
      name: 'TTS 1 HD',
      description: 'High quality text to speech',
      category: 'tts',
      context_window: 4096,
      pricing: { input: 30, output: 0 } // per 1M characters
    },

    // Image Models
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      description: 'Latest image generation model',
      category: 'image',
      context_window: 4000,
      pricing: { input: 40, output: 0 } // per image
    },
    {
      id: 'dall-e-2',
      name: 'DALL-E 2',
      description: 'Previous generation image model',
      category: 'image',
      context_window: 1000,
      pricing: { input: 20, output: 0 } // per image
    }
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load predefined models immediately
    this.PREDEFINED_MODELS.forEach(model => {
      this.models.set(model.id, model);
    });
    this.isInitialized = true;

    // Try to fetch live models in background
    this.fetchModelsFromAPI().catch(console.error);
  }

  /**
   * Fetch models from OpenAI API
   */
  private async fetchModelsFromAPI(): Promise<void> {
    try {
      // Only fetch if we have a valid API configuration
      if (!adaptiveOpenAIService.isConfigured()) {
        console.log('OpenAI not configured, using predefined models');
        return;
      }

      const now = Date.now();
      if (now - this.lastFetch < this.fetchInterval) {
        return; // Use cache
      }

      // Try to fetch models from API
      const response = await adaptiveOpenAIService.listModels();
      
      if (response?.data) {
        // Merge API models with predefined metadata
        response.data.forEach((apiModel: any) => {
          const existing = this.models.get(apiModel.id);
          if (existing) {
            // Update with live data but keep our metadata
            this.models.set(apiModel.id, {
              ...existing,
              // API might have updated info
            });
          } else if (!apiModel.id.includes('instruct') && !apiModel.id.includes('davinci')) {
            // Add new models not in our predefined list (skip legacy models)
            this.models.set(apiModel.id, {
              id: apiModel.id,
              name: this.formatModelName(apiModel.id),
              description: 'OpenAI model',
              category: this.detectCategory(apiModel.id),
              context_window: 4096, // Default
              pricing: { input: 0, output: 0 }
            });
          }
        });

        this.lastFetch = now;
      }
    } catch (error) {
      console.warn('Failed to fetch models from API, using predefined list:', error);
    }
  }

  /**
   * Format model ID to readable name
   */
  private formatModelName(modelId: string): string {
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Detect category from model ID
   */
  private detectCategory(modelId: string): OpenAIModel['category'] {
    if (modelId.includes('realtime')) return 'realtime';
    if (modelId.includes('embedding')) return 'embedding';
    if (modelId.includes('whisper')) return 'stt';
    if (modelId.includes('tts')) return 'tts';
    if (modelId.includes('dall-e')) return 'image';
    return 'chat';
  }

  /**
   * Get all models
   */
  async getAllModels(): Promise<OpenAIModel[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Try to refresh from API if stale
    await this.fetchModelsFromAPI();
    
    return Array.from(this.models.values())
      .filter(m => !m.deprecated)
      .sort((a, b) => {
        // Sort by category then name
        if (a.category !== b.category) {
          const categoryOrder = ['chat', 'realtime', 'embedding', 'tts', 'stt', 'image'];
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Get models by category
   */
  async getModelsByCategory(category: OpenAIModel['category']): Promise<OpenAIModel[]> {
    const models = await this.getAllModels();
    return models.filter(m => m.category === category);
  }

  /**
   * Get chat models
   */
  async getChatModels(): Promise<OpenAIModel[]> {
    return this.getModelsByCategory('chat');
  }

  /**
   * Get realtime models
   */
  async getRealtimeModels(): Promise<OpenAIModel[]> {
    return this.getModelsByCategory('realtime');
  }

  /**
   * Get a specific model
   */
  async getModel(modelId: string): Promise<OpenAIModel | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.models.get(modelId) || null;
  }

  /**
   * Check if a model exists
   */
  async modelExists(modelId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.models.has(modelId);
  }

  /**
   * Get recommended model for a use case
   */
  getRecommendedModel(useCase: 'chat' | 'voice' | 'embedding' | 'transcription'): string {
    switch (useCase) {
      case 'chat':
        return 'gpt-4o-mini'; // Best balance of cost and performance
      case 'voice':
        return 'gpt-4o-realtime-preview-2024-10-01'; // Latest realtime model
      case 'embedding':
        return 'text-embedding-3-small'; // Efficient and capable
      case 'transcription':
        return 'whisper-1'; // Only STT model
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Validate if a model supports a feature
   */
  async validateModelFeature(modelId: string, feature: 'functions' | 'vision' | 'voice'): Promise<boolean> {
    const model = await this.getModel(modelId);
    if (!model) return false;

    switch (feature) {
      case 'functions':
        return model.supports_functions || false;
      case 'vision':
        return model.supports_vision || false;
      case 'voice':
        return model.supports_voice || false;
      default:
        return false;
    }
  }

  /**
   * Get model pricing info
   */
  async getModelPricing(modelId: string): Promise<{ input: number; output: number } | null> {
    const model = await this.getModel(modelId);
    return model?.pricing || null;
  }

  /**
   * Estimate cost for tokens
   */
  async estimateCost(modelId: string, inputTokens: number, outputTokens: number): Promise<number> {
    const pricing = await this.getModelPricing(modelId);
    if (!pricing) return 0;

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }
}

// Export singleton instance
export const openAIModelsService = new OpenAIModelsService();