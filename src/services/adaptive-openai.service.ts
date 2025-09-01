/**
 * Adaptive OpenAI Service
 * Automatically switches between direct API calls and proxy based on configuration
 */

import { getApiMode } from '@/config/api-mode';
import { openAIProxyService } from './openai-proxy.service';
import { env } from '@/config/environment';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

class AdaptiveOpenAIService {
  private apiMode = getApiMode();
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = env.openai.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    
    // Log initialization details for debugging
    if (this.apiMode.mode === 'proxy') {
      console.log('OpenAI Service: Using secure proxy mode (no client API key needed)');
    } else if (this.apiKey) {
      console.log('OpenAI Service: Using direct mode with API key');
    } else {
      console.warn('OpenAI Service: No API key found, some features may be limited');
    }
  }

  /**
   * Create a chat completion using the appropriate method
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<any> {
    if (this.apiMode.useProxy) {
      // Use secure proxy
      return openAIProxyService.createChatCompletion({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        stream: options.stream,
      });
    }

    // Direct API call (development only)
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'Failed to create chat completion');
    }

    return response.json();
  }

  /**
   * List available models
   */
  async listModels(): Promise<any> {
    if (this.apiMode.useProxy) {
      return openAIProxyService.listModels();
    }

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'Failed to list models');
    }

    return response.json();
  }

  /**
   * Create embeddings
   */
  async createEmbedding(input: string | string[], model: string = 'text-embedding-3-small'): Promise<any> {
    if (this.apiMode.useProxy) {
      return openAIProxyService.createEmbedding(input, model);
    }

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'Failed to create embedding');
    }

    return response.json();
  }

  /**
   * Moderate content
   */
  async moderateContent(input: string | string[]): Promise<any> {
    if (this.apiMode.useProxy) {
      return openAIProxyService.moderateContent(input);
    }

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || 'Failed to moderate content');
    }

    return response.json();
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; mode: string }> {
    try {
      const result = await this.listModels();
      return {
        success: true,
        message: `Connected successfully in ${this.apiMode.mode} mode`,
        mode: this.apiMode.mode,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
        mode: this.apiMode.mode,
      };
    }
  }

  /**
   * Get current API mode
   */
  getMode(): string {
    return this.apiMode.mode;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    if (this.apiMode.useProxy) {
      return true; // Will check auth at runtime
    }
    return !!this.apiKey;
  }

  /**
   * List available models
   */
  async listModels(): Promise<any> {
    if (this.apiMode.useProxy) {
      // Use proxy to list models
      return openAIProxyService.request('/v1/models', 'GET');
    }

    // Direct API call
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || 'Failed to list models');
    }

    return response.json();
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.apiMode.useProxy || !!this.apiKey;
  }
}

// Export singleton instance
export const adaptiveOpenAIService = new AdaptiveOpenAIService();