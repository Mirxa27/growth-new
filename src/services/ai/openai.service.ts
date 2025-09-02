/**
 * OpenAI Service
 * Comprehensive service for all OpenAI API interactions
 */

import { env } from '@/config/environment';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';
import { z } from 'zod';

// Schemas for OpenAI requests/responses
const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function']),
    content: z.string(),
    name: z.string().optional(),
    function_call: z.any().optional(),
  })),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
  functions: z.array(z.any()).optional(),
  function_call: z.any().optional(),
});

const TranscriptionRequestSchema = z.object({
  file: z.instanceof(File),
  model: z.string().default('whisper-1'),
  language: z.string().optional(),
  prompt: z.string().optional(),
  response_format: z.enum(['json', 'text', 'srt', 'verbose_json', 'vtt']).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIService {
  private static instance: OpenAIService;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';
  private organizationId: string | null = null;

  private constructor() {
    this.apiKey = env.openai.apiKey || null;
    this.organizationId = env.openai.organizationId || null;
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Set API key dynamically (useful for user-provided keys)
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
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }

    return headers;
  }

  /**
   * Fetch available models
   */
  async getModels(): Promise<OpenAIModel[]> {
    const cacheKey = 'openai:models';
    const cached = cache.get<OpenAIModel[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data as OpenAIModel[];

      // Cache for 1 hour
      cache.set(cacheKey, models, { ttl: 3600000 });

      return models;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'fetch_openai_models',
          metadata: { apiKeyPresent: !!this.apiKey },
        },
      });
      throw error;
    }
  }

  /**
   * Filter models for specific capabilities
   */
  async getModelsForCapability(capability: 'chat' | 'audio' | 'vision' | 'realtime'): Promise<OpenAIModel[]> {
    const allModels = await this.getModels();
    
    switch (capability) {
      case 'chat':
        return allModels.filter(m => 
          m.id.includes('gpt') && 
          !m.id.includes('realtime') &&
          !m.id.includes('instruct')
        );
      
      case 'audio':
        return allModels.filter(m => 
          m.id.includes('whisper') || 
          m.id.includes('tts')
        );
      
      case 'vision':
        return allModels.filter(m => 
          m.id.includes('vision') || 
          m.id.includes('gpt-4')
        );
      
      case 'realtime':
        return allModels.filter(m => 
          m.id.includes('realtime')
        );
      
      default:
        return allModels;
    }
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(params: z.infer<typeof ChatCompletionRequestSchema>): Promise<ChatCompletionResponse> {
    try {
      // Validate request
      const validatedParams = ChatCompletionRequestSchema.parse(params);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(validatedParams),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Chat completion failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'create_chat_completion',
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
   * Create chat completion with streaming
   */
  async createChatCompletionStream(
    params: z.infer<typeof ChatCompletionRequestSchema>,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const validatedParams = ChatCompletionRequestSchema.parse({
        ...params,
        stream: true,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
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
          action: 'create_chat_completion_stream',
          metadata: { model: params.model },
        },
      });
      throw error;
    }
  }

  /**
   * Transcribe audio
   */
  async transcribeAudio(params: z.infer<typeof TranscriptionRequestSchema>): Promise<string> {
    try {
      const validatedParams = TranscriptionRequestSchema.parse(params);

      const formData = new FormData();
      formData.append('file', validatedParams.file);
      formData.append('model', validatedParams.model);
      
      if (validatedParams.language) {
        formData.append('language', validatedParams.language);
      }
      if (validatedParams.prompt) {
        formData.append('prompt', validatedParams.prompt);
      }
      if (validatedParams.response_format) {
        formData.append('response_format', validatedParams.response_format);
      }
      if (validatedParams.temperature !== undefined) {
        formData.append('temperature', validatedParams.temperature.toString());
      }

      const headers = this.getHeaders();
      delete headers['Content-Type']; // Let browser set multipart boundary

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      return result.text || result;
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'transcribe_audio',
          metadata: { 
            model: params.model,
            fileSize: params.file.size,
          },
        },
      });
      throw error;
    }
  }

  /**
   * Generate speech from text
   */
  async textToSpeech(
    text: string,
    options: {
      model?: 'tts-1' | 'tts-1-hd';
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
      speed?: number;
    } = {}
  ): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: options.model || 'tts-1',
          input: text,
          voice: options.voice || 'nova',
          response_format: options.response_format || 'mp3',
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `TTS failed: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'text_to_speech',
          metadata: { 
            textLength: text.length,
            voice: options.voice,
          },
        },
      });
      throw error;
    }
  }

  /**
   * Create embeddings
   */
  async createEmbedding(
    input: string | string[],
    model: string = 'text-embedding-ada-002'
  ): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Embedding failed: ${response.status}`);
      }

      const result = await response.json();
      return result.data.map((item: any) => item.embedding);
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.EXTERNAL_API,
        context: {
          action: 'create_embedding',
          metadata: { 
            model,
            inputCount: Array.isArray(input) ? input.length : 1,
          },
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

      const models = await this.getModels();
      return models.length > 0;
    } catch (error) {
      return false;
    } finally {
      if (apiKey) {
        this.apiKey = originalKey;
      }
    }
  }

  /**
   * Get model pricing information
   */
  getModelPricing(modelId: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
    };

    // Find the best match
    for (const [key, value] of Object.entries(pricing)) {
      if (modelId.includes(key)) {
        return value;
      }
    }

    // Default pricing
    return { input: 0.01, output: 0.03 };
  }
}

// Export singleton instance
export const openaiService = OpenAIService.getInstance();

// Export convenience functions
export const openai = {
  chat: (messages: any[], options?: any) => 
    openaiService.createChatCompletion({
      model: options?.model || env.openai.model,
      messages,
      ...options,
    }),
  
  stream: (messages: any[], onChunk: (chunk: string) => void, options?: any) =>
    openaiService.createChatCompletionStream(
      {
        model: options?.model || env.openai.model,
        messages,
        ...options,
      },
      onChunk,
      options?.onComplete
    ),
  
  transcribe: (file: File, options?: any) =>
    openaiService.transcribeAudio({ file, ...options }),
  
  speak: (text: string, options?: any) =>
    openaiService.textToSpeech(text, options),
  
  embed: (input: string | string[], model?: string) =>
    openaiService.createEmbedding(input, model),
  
  models: () => openaiService.getModels(),
  
  testKey: (key?: string) => openaiService.testApiKey(key),
};