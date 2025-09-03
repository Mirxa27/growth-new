/**
 * Google AI (Gemini) Service
 * Service for all Google Gemini API interactions
 */

import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';
import { z } from 'zod';

// Schemas for Google AI requests
const ContentSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({
    text: z.string(),
  })),
});

const GenerationConfigSchema = z.object({
  temperature: z.number().min(0).max(1).optional(),
  topK: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  candidateCount: z.number().positive().max(8).optional(),
  maxOutputTokens: z.number().positive().optional(),
  stopSequences: z.array(z.string()).optional(),
});

const GoogleAIRequestSchema = z.object({
  contents: z.array(ContentSchema),
  generationConfig: GenerationConfigSchema.optional(),
  safetySettings: z.array(z.object({
    category: z.string(),
    threshold: z.string(),
  })).optional(),
});

interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

class GoogleAIService {
  private static instance: GoogleAIService;
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  private constructor() {}

  static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
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
   * Get available models
   */
  async getModels(): Promise<Array<{ id: string; name: string; description: string }>> {
    // Return known Gemini models
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Best for text-only prompts',
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Best for text and image prompts',
      },
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        description: 'Latest model with improved capabilities',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient for simple tasks',
      },
    ];
  }

  /**
   * Generate content
   */
  async generateContent(
    model: string,
    params: z.infer<typeof GoogleAIRequestSchema>
  ): Promise<GoogleAIResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const validatedParams = GoogleAIRequestSchema.parse(params);
      
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedParams),
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
          action: 'generate_google_content',
          metadata: { 
            model,
            contentCount: params.contents.length,
          },
        },
      });
      throw error;
    }
  }

  /**
   * Stream generate content
   */
  async streamGenerateContent(
    model: string,
    params: z.infer<typeof GoogleAIRequestSchema>,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const validatedParams = GoogleAIRequestSchema.parse(params);
      
      const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                onChunk(parsed.candidates[0].content.parts[0].text);
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
          action: 'stream_google_content',
          metadata: { model },
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

      const response = await this.generateContent('gemini-pro', {
        contents: [{
          role: 'user',
          parts: [{ text: 'Hi' }],
        }],
        generationConfig: {
          maxOutputTokens: 10,
        },
      });

      return response.candidates.length > 0;
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
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
      'gemini-1.5-pro-latest': { input: 0.0035, output: 0.0105 },
      'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },
    };

    return pricing[modelId] || { input: 0.001, output: 0.003 };
  }

  /**
   * Convert OpenAI-style messages to Google format
   */
  convertMessages(openAIMessages: Array<{ role: string; content: string }>): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let systemPrompt = '';

    for (const msg of openAIMessages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
      } else if (msg.role === 'user') {
        messages.push({
          role: 'user',
          parts: [{ 
            text: systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content 
          }],
        });
        systemPrompt = ''; // Only prepend system message once
      } else if (msg.role === 'assistant') {
        messages.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    return messages;
  }

  /**
   * Count tokens (approximate)
   */
  async countTokens(model: string, text: string): Promise<number> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const url = `${this.baseUrl}/models/${model}:countTokens?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }],
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Token count failed: ${response.status}`);
      }

      const result = await response.json();
      return result.totalTokens || 0;
    } catch (error) {
      // Fallback to rough estimation
      return Math.ceil(text.length / 4);
    }
  }
}

// Export singleton instance
export const googleAIService = GoogleAIService.getInstance();

// Export convenience functions
export const googleAI = {
  chat: (messages: any[], options?: any) => {
    const googleMessages = googleAIService.convertMessages(messages);
    return googleAIService.generateContent(
      options?.model || 'gemini-pro',
      {
        contents: googleMessages,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.max_tokens,
          topP: options?.top_p,
          topK: options?.top_k,
        },
      }
    );
  },
  
  stream: (messages: any[], onChunk: (chunk: string) => void, options?: any) => {
    const googleMessages = googleAIService.convertMessages(messages);
    return googleAIService.streamGenerateContent(
      options?.model || 'gemini-pro',
      {
        contents: googleMessages,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.max_tokens,
          topP: options?.top_p,
          topK: options?.top_k,
        },
      },
      onChunk,
      options?.onComplete
    );
  },
  
  models: () => googleAIService.getModels(),
  
  testKey: (key?: string) => googleAIService.testApiKey(key),
  
  countTokens: (model: string, text: string) => googleAIService.countTokens(model, text),
};