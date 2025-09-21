/**
 * OpenAI API wrapper that provides strongly typed helpers and
 * production-grade error handling for chat completions.
 */

import { env } from '@/config/environment';
import { logger } from '@/utils/logger';

export type OpenAIModel = {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
};

export type ChatCompletionOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json_object';
  stop?: string | string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  timeoutMs?: number;
  metadata?: Record<string, string>;
};

type ChatCompletionChoice = {
  message?: {
    role?: string;
    content?: string;
  };
  finish_reason?: string;
};

type ChatCompletionResponse = {
  id?: string;
  choices?: ChatCompletionChoice[];
  created?: number;
  model?: string;
};

export class OpenAIServiceError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export class OpenAIWrapperService {
  private static readonly OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';

  private static isConfigured(): boolean {
    const apiKey = env.openai.apiKey?.trim();
    return Boolean(apiKey && apiKey.length > 20 && apiKey !== 'your-openai-api-key-here');
  }

  private static assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new OpenAIServiceError('OpenAI API key is not configured');
    }
  }

  private static buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openai.apiKey}`,
    };

    if (env.openai.organizationId) {
      headers['OpenAI-Organization'] = env.openai.organizationId;
    }

    return headers;
  }

  static async checkModels(): Promise<OpenAIModel[]> {
    this.assertConfigured();

    const response = await fetch(this.OPENAI_MODELS_URL, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => undefined);
      logger.error('Failed to fetch OpenAI models', 'OpenAIWrapperService', {
        status: response.status,
        detail,
      });
      throw new OpenAIServiceError('Unable to retrieve OpenAI models', response.status);
    }

    const data = (await response.json()) as { data?: OpenAIModel[] };
    return data.data ?? [];
  }

  static async generateCompletion(prompt: string, options: ChatCompletionOptions = {}): Promise<string> {
    this.assertConfigured();

    const {
      model = env.openai.model ?? 'gpt-4o-mini',
      maxTokens = env.openai.maxTokens ?? 1500,
      temperature = env.openai.temperature ?? 0.7,
      systemPrompt,
      responseFormat = 'text',
      stop,
      presencePenalty,
      frequencyPenalty,
      timeoutMs = 45_000,
      metadata,
    } = options;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      };

      if (responseFormat === 'json_object') {
        body.response_format = { type: 'json_object' };
      }

      if (stop) {
        body.stop = stop;
      }

      if (typeof presencePenalty === 'number') {
        body.presence_penalty = presencePenalty;
      }

      if (typeof frequencyPenalty === 'number') {
        body.frequency_penalty = frequencyPenalty;
      }

      if (metadata) {
        body.metadata = metadata;
      }

      const response = await fetch(this.OPENAI_CHAT_URL, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => undefined);
        logger.error('OpenAI chat completion request failed', 'OpenAIWrapperService', {
          status: response.status,
          detail,
        });
        throw new OpenAIServiceError('OpenAI completion request failed', response.status);
      }

      const payload = (await response.json()) as ChatCompletionResponse;
      const content = payload.choices?.[0]?.message?.content?.trim();

      if (!content) {
        logger.error('OpenAI returned an empty response', 'OpenAIWrapperService', payload);
        throw new OpenAIServiceError('OpenAI returned an empty response');
      }

      return content;
    } catch (error) {
      if (error instanceof OpenAIServiceError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.error('OpenAI completion timed out', 'OpenAIWrapperService');
        throw new OpenAIServiceError('OpenAI request timed out');
      }

      logger.error('Unexpected OpenAI completion failure', 'OpenAIWrapperService', error);
      throw new OpenAIServiceError('Failed to generate OpenAI completion');
    } finally {
      clearTimeout(timeout);
    }
  }

  static getConfigurationStatus(): { isConfigured: boolean; message: string } {
    const configured = this.isConfigured();
    return {
      isConfigured: configured,
      message: configured
        ? 'OpenAI API is properly configured'
        : 'OpenAI API key not configured',
    };
  }
}

export const openaiWrapper = OpenAIWrapperService;