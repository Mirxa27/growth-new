/**
 * Unified AI Service
 * Manages all AI providers and provides a unified interface
 */

import { openaiService, openai } from './openai.service';
import { anthropicService, anthropic } from './anthropic.service';
import { googleAIService, googleAI } from './google.service';
import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';
import { z } from 'zod';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'auto';

interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface UnifiedAIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

class UnifiedAIService {
  private static instance: UnifiedAIService;
  private providerConfigs: Map<AIProvider, AIProviderConfig> = new Map();
  private defaultProvider: AIProvider = 'openai';

  private constructor() {
    this.loadProviderConfigs();
  }

  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  /**
   * Load provider configurations from database
   */
  private async loadProviderConfigs() {
    try {
      const { data: providers } = await supabase
        .from('admin_ai_providers')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (providers && providers.length > 0) {
        for (const provider of providers) {
          const config: AIProviderConfig = {
            provider: provider.provider_type as AIProvider,
            apiKey: provider.configuration?.api_key,
            model: provider.configuration?.model,
            maxTokens: provider.configuration?.max_tokens,
            temperature: provider.configuration?.temperature,
            systemPrompt: provider.system_prompt,
          };

          this.providerConfigs.set(config.provider, config);

          // Set API keys in respective services
          if (config.apiKey) {
            switch (config.provider) {
              case 'openai':
                openaiService.setApiKey(config.apiKey);
                break;
              case 'anthropic':
                anthropicService.setApiKey(config.apiKey);
                break;
              case 'google':
                googleAIService.setApiKey(config.apiKey);
                break;
            }
          }
        }

        // Set default provider to the highest priority one
        if (providers[0]) {
          this.defaultProvider = providers[0].provider_type as AIProvider;
        }
      }
    } catch (error) {
      console.error('Failed to load AI provider configs:', error);
    }
  }

  /**
   * Get the best available provider
   */
  private async getBestProvider(): Promise<AIProvider> {
    // Check cache for recent provider performance
    const performanceData = cache.get<Record<AIProvider, { successRate: number; avgLatency: number }>>('ai:provider:performance');
    
    if (performanceData) {
      // Sort by success rate and latency
      const sorted = Object.entries(performanceData)
        .filter(([provider]) => this.isProviderConfigured(provider as AIProvider))
        .sort(([, a], [, b]) => {
          const scoreA = a.successRate * (1 - a.avgLatency / 10000);
          const scoreB = b.successRate * (1 - b.avgLatency / 10000);
          return scoreB - scoreA;
        });

      if (sorted.length > 0) {
        return sorted[0][0] as AIProvider;
      }
    }

    // Fallback to default provider
    return this.defaultProvider;
  }

  /**
   * Check if a provider is configured
   */
  private isProviderConfigured(provider: AIProvider): boolean {
    switch (provider) {
      case 'openai':
        return openaiService.isConfigured();
      case 'anthropic':
        return anthropicService.isConfigured();
      case 'google':
        return googleAIService.isConfigured();
      default:
        return false;
    }
  }

  /**
   * Generate a chat completion
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: {
      provider?: AIProvider;
      model?: string;
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ): Promise<UnifiedAIResponse> {
    const provider = options?.provider === 'auto' ? await this.getBestProvider() : (options?.provider || this.defaultProvider);
    const config = this.providerConfigs.get(provider);
    
    const startTime = Date.now();
    let response: any;
    let error: Error | null = null;

    try {
      // Add system prompt if configured
      let finalMessages = messages;
      if (config?.systemPrompt && !messages.some(m => m.role === 'system')) {
        finalMessages = [
          { role: 'system', content: config.systemPrompt },
          ...messages
        ];
      }

      switch (provider) {
        case 'openai':
          if (options?.stream && options.onChunk) {
            await openai.stream(finalMessages, options.onChunk, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: '', // Content delivered via stream
              provider: 'openai',
              model: options.model || config?.model || 'gpt-4o-mini',
            };
          } else {
            response = await openai.chat(finalMessages, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: response.choices[0].message.content,
              provider: 'openai',
              model: response.model,
              usage: response.usage ? {
                inputTokens: response.usage.prompt_tokens,
                outputTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              } : undefined,
              cost: this.calculateCost('openai', response.model, response.usage),
            };
          }

        case 'anthropic':
          if (options?.stream && options.onChunk) {
            await anthropic.stream(finalMessages, options.onChunk, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: '',
              provider: 'anthropic',
              model: options.model || config?.model || 'claude-3-sonnet-20240229',
            };
          } else {
            response = await anthropic.chat(finalMessages, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: response.content[0].text,
              provider: 'anthropic',
              model: response.model,
              usage: response.usage ? {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
              } : undefined,
              cost: this.calculateCost('anthropic', response.model, response.usage),
            };
          }

        case 'google':
          if (options?.stream && options.onChunk) {
            await googleAI.stream(finalMessages, options.onChunk, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: '',
              provider: 'google',
              model: options.model || config?.model || 'gemini-pro',
            };
          } else {
            response = await googleAI.chat(finalMessages, {
              model: options.model || config?.model,
              max_tokens: options.maxTokens || config?.maxTokens,
              temperature: options.temperature ?? config?.temperature,
            });
            return {
              content: response.candidates[0].content.parts[0].text,
              provider: 'google',
              model: options.model || config?.model || 'gemini-pro',
            };
          }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (err) {
      error = err as Error;
      
      // Try fallback provider if available
      if (provider !== 'openai' && this.isProviderConfigured('openai')) {
        return this.chat(messages, { ...options, provider: 'openai' });
      } else if (provider !== 'anthropic' && this.isProviderConfigured('anthropic')) {
        return this.chat(messages, { ...options, provider: 'anthropic' });
      } else if (provider !== 'google' && this.isProviderConfigured('google')) {
        return this.chat(messages, { ...options, provider: 'google' });
      }
      
      throw error;
    } finally {
      // Track provider performance
      this.trackProviderPerformance(provider, Date.now() - startTime, !error);
    }
  }

  /**
   * Calculate cost based on usage
   */
  private calculateCost(provider: AIProvider, model: string, usage?: any): number | undefined {
    if (!usage) return undefined;

    let pricing: { input: number; output: number };

    switch (provider) {
      case 'openai':
        pricing = openaiService.getModelPricing(model);
        return (usage.prompt_tokens * pricing.input + usage.completion_tokens * pricing.output) / 1000;
      
      case 'anthropic':
        pricing = anthropicService.getModelPricing(model);
        return (usage.input_tokens * pricing.input + usage.output_tokens * pricing.output) / 1000;
      
      case 'google':
        pricing = googleAIService.getModelPricing(model);
        // Google doesn't provide token counts in the same way
        return undefined;
      
      default:
        return undefined;
    }
  }

  /**
   * Track provider performance for intelligent routing
   */
  private trackProviderPerformance(provider: AIProvider, latency: number, success: boolean) {
    const key = 'ai:provider:performance';
    let performance = cache.get<Record<AIProvider, { successRate: number; avgLatency: number; calls: number }>>(key) || {};

    if (!performance[provider]) {
      performance[provider] = { successRate: 1, avgLatency: latency, calls: 1 };
    } else {
      const stats = performance[provider];
      stats.calls++;
      stats.avgLatency = (stats.avgLatency * (stats.calls - 1) + latency) / stats.calls;
      stats.successRate = (stats.successRate * (stats.calls - 1) + (success ? 1 : 0)) / stats.calls;
    }

    cache.set(key, performance, { ttl: 3600000 }); // Cache for 1 hour
  }

  /**
   * Test all configured providers
   */
  async testProviders(): Promise<Record<AIProvider, { available: boolean; latency?: number; error?: string }>> {
    const results: Record<string, { available: boolean; latency?: number; error?: string }> = {};
    
    for (const provider of ['openai', 'anthropic', 'google'] as AIProvider[]) {
      const startTime = Date.now();
      try {
        if (this.isProviderConfigured(provider)) {
          await this.chat([{ role: 'user', content: 'Hi' }], { 
            provider, 
            maxTokens: 10 
          });
          results[provider] = { 
            available: true, 
            latency: Date.now() - startTime 
          };
        } else {
          results[provider] = { 
            available: false, 
            error: 'Not configured' 
          };
        }
      } catch (error) {
        results[provider] = { 
          available: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    return results as Record<AIProvider, { available: boolean; latency?: number; error?: string }>;
  }

  /**
   * Get available models for a provider
   */
  async getModels(provider?: AIProvider): Promise<Array<{ id: string; name: string; description: string; provider: AIProvider }>> {
    const models: Array<{ id: string; name: string; description: string; provider: AIProvider }> = [];
    
    if (!provider || provider === 'auto') {
      // Get models from all configured providers
      if (this.isProviderConfigured('openai')) {
        const openaiModels = await openai.models();
        models.push(...openaiModels.map(m => ({ ...m, provider: 'openai' as AIProvider })));
      }
      if (this.isProviderConfigured('anthropic')) {
        const anthropicModels = await anthropic.models();
        models.push(...anthropicModels.map(m => ({ ...m, provider: 'anthropic' as AIProvider })));
      }
      if (this.isProviderConfigured('google')) {
        const googleModels = await googleAI.models();
        models.push(...googleModels.map(m => ({ ...m, provider: 'google' as AIProvider })));
      }
    } else {
      // Get models from specific provider
      switch (provider) {
        case 'openai':
          const openaiModels = await openai.models();
          models.push(...openaiModels.map(m => ({ ...m, provider: 'openai' as AIProvider })));
          break;
        case 'anthropic':
          const anthropicModels = await anthropic.models();
          models.push(...anthropicModels.map(m => ({ ...m, provider: 'anthropic' as AIProvider })));
          break;
        case 'google':
          const googleModels = await googleAI.models();
          models.push(...googleModels.map(m => ({ ...m, provider: 'google' as AIProvider })));
          break;
      }
    }
    
    return models;
  }

  /**
   * Refresh provider configurations
   */
  async refreshConfigs() {
    await this.loadProviderConfigs();
  }
}

// Export singleton instance
export const unifiedAI = UnifiedAIService.getInstance();

// Export convenience function
export const ai = {
  chat: (messages: any[], options?: any) => unifiedAI.chat(messages, options),
  models: (provider?: AIProvider) => unifiedAI.getModels(provider),
  test: () => unifiedAI.testProviders(),
  refresh: () => unifiedAI.refreshConfigs(),
};