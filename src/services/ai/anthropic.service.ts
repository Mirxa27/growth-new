/**
 * Anthropic Claude Service
 * Service for all Anthropic Claude API interactions
 */

import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';
import { z } from 'zod';

// Schemas for Anthropic requests
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const AnthropicRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  max_tokens: z.number().positive(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().positive().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  metadata: z.object({
    user_id: z.string().optional(),
  }).optional(),
});

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

class AnthropicService {
  private static instance: AnthropicService;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.anthropic.com/v1';
  private anthropicVersion = '2023-06-01';

  private constructor() {}

  static getInstance(): AnthropicService {
    if (!AnthropicService.instance) {
      AnthropicService.instance = new AnthropicService();
    }
    return AnthropicService.instance;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Check if configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    return {
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get available models
   */
  async getModels(): Promise<Array<{ id: string; name: string; description: string }>> {
    // Anthropic doesn't have a models endpoint, so we return known models
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most capable model for complex tasks',
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest model for simple tasks',
      },
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        description: 'Previous generation model',
      },
      {
        id: 'claude-2.0',
        name: 'Claude 2.0',
        description: 'Previous generation model',
      },
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        description: 'Fast and cost-effective',
      },
    ];
  }

  /**
   * Create message completion
   */
  async createMessage(params: z.infer<typeof AnthropicRequestSchema>): Promise<AnthropicResponse> {
    try {
      const validatedParams = AnthropicRequestSchema.parse(params);

      // Add system message if needed
      let messages = validatedParams.messages;
      const systemMessage = messages.find(m => m.role === 'user' && m.content.startsWith('System:'));
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...validatedParams,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'create_anthropic_message',
          metadata: { 
            model: params.model,
            messageCount: params.messages.length,
          },
        },
      });
      throw error;
    }
  }

  /**
   * Create streaming message completion
   */
  async createMessageStream(
    params: z.infer<typeof AnthropicRequestSchema>,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const validatedParams = AnthropicRequestSchema.parse({
        ...params,
        stream: true,
      });

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(validatedParams),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Stream failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text);
              } else if (parsed.type === 'message_stop') {
                onComplete?.();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'create_anthropic_stream',
          metadata: { model: params.model },
        },
      });
      throw error;
    }
  }

  /**
   * Test API key validity
   */
  async testApiKey(apiKey?: string): Promise<boolean> {
    const originalKey = this.apiKey;
    
    try {
      if (apiKey) {
        this.apiKey = apiKey;
      }

      const response = await this.createMessage({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      return !!response.id;
    } catch (error) {
      return false;
    } finally {
      if (apiKey) {
        this.apiKey = originalKey;
      }
    }
  }

  /**
   * Get model pricing
   */
  getModelPricing(modelId: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-2.1': { input: 0.008, output: 0.024 },
      'claude-2.0': { input: 0.008, output: 0.024 },
      'claude-instant-1.2': { input: 0.0008, output: 0.0024 },
    };

    return pricing[modelId] || { input: 0.01, output: 0.03 };
  }

  /**
   * Convert OpenAI-style messages to Anthropic format
   */
  convertMessages(openAIMessages: Array<{ role: string; content: string }>): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let systemPrompt = '';

    for (const msg of openAIMessages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.role === 'user' && systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content,
        });
        systemPrompt = ''; // Only prepend system message once
      }
    }

    return messages;
  }
}

// Export singleton instance
export const anthropicService = AnthropicService.getInstance();

// Export convenience functions
export const anthropic = {
  chat: (messages: any[], options?: any) => {
    const anthropicMessages = anthropicService.convertMessages(messages);
    return anthropicService.createMessage({
      model: options?.model || 'claude-3-sonnet-20240229',
      messages: anthropicMessages,
      max_tokens: options?.max_tokens || 2000,
      ...options,
    });
  },
  
  stream: (messages: any[], onChunk: (chunk: string) => void, options?: any) => {
    const anthropicMessages = anthropicService.convertMessages(messages);
    return anthropicService.createMessageStream(
      {
        model: options?.model || 'claude-3-sonnet-20240229',
        messages: anthropicMessages,
        max_tokens: options?.max_tokens || 2000,
        ...options,
      },
      onChunk,
      options?.onComplete
    );
  },
  
  models: () => anthropicService.getModels(),
  
  testKey: (key?: string) => anthropicService.testApiKey(key),
};