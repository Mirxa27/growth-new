/**
 * OpenAI Proxy Service
 * Uses Supabase Edge Function to securely proxy OpenAI API calls
 */

import { supabase } from '@/integrations/supabase/client';

export interface OpenAIProxyRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

class OpenAIProxyService {
  private isAuthenticated: boolean = false;

  constructor() {
    this.checkAuthentication();
  }

  private async checkAuthentication() {
    const { data: { session } } = await supabase.auth.getSession();
    this.isAuthenticated = !!session;
  }

  /**
   * Make a proxied call to OpenAI API
   */
  private async callOpenAI(request: OpenAIProxyRequest): Promise<any> {
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required for OpenAI API calls');
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: request,
      });

      if (error) {
        console.error('OpenAI proxy error:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('OpenAI API call failed:', error);
      throw new Error(error.message || 'Failed to call OpenAI API');
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<any> {
    return this.callOpenAI({
      endpoint: '/v1/models',
      method: 'GET',
    });
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<any> {
    return this.callOpenAI({
      endpoint: '/v1/chat/completions',
      method: 'POST',
      body: {
        model: request.model || 'gpt-4o-mini',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2000,
        stream: request.stream ?? false,
      },
    });
  }

  /**
   * Create an embedding
   */
  async createEmbedding(input: string | string[], model: string = 'text-embedding-3-small'): Promise<any> {
    return this.callOpenAI({
      endpoint: '/v1/embeddings',
      method: 'POST',
      body: {
        model,
        input,
      },
    });
  }

  /**
   * Moderate content
   */
  async moderateContent(input: string | string[]): Promise<any> {
    return this.callOpenAI({
      endpoint: '/v1/moderations',
      method: 'POST',
      body: {
        input,
      },
    });
  }

  /**
   * Transcribe audio
   */
  async transcribeAudio(audioFile: File, language?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    if (language) {
      formData.append('language', language);
    }

    // For file uploads, we need to handle this differently
    // The proxy function would need to be updated to handle multipart/form-data
    throw new Error('Audio transcription via proxy not yet implemented');
  }

  /**
   * Generate an image
   */
  async generateImage(prompt: string, options?: {
    model?: string;
    n?: number;
    size?: string;
    quality?: string;
    style?: string;
  }): Promise<any> {
    return this.callOpenAI({
      endpoint: '/v1/images/generations',
      method: 'POST',
      body: {
        model: options?.model || 'dall-e-3',
        prompt,
        n: options?.n ?? 1,
        size: options?.size ?? '1024x1024',
        quality: options?.quality ?? 'standard',
        style: options?.style ?? 'vivid',
      },
    });
  }

  /**
   * Test the connection to OpenAI
   */
  async testConnection(): Promise<{ success: boolean; message: string; models?: number }> {
    try {
      const result = await this.listModels();
      if (result?.data) {
        return {
          success: true,
          message: 'Successfully connected to OpenAI',
          models: result.data.length,
        };
      }
      return {
        success: false,
        message: 'Unexpected response format',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }
}

// Export singleton instance
export const openAIProxyService = new OpenAIProxyService();