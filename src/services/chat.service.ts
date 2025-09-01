/**
 * Chat Service
 * Handles AI chat functionality with OpenAI integration
 */

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';
import { openAIConfig } from '@/utils/openai-config';
import { adaptiveOpenAIService } from './adaptive-openai.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

class ChatService {
  private apiKey: string | undefined;
  private defaultModel: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor() {
    // Initialize from OpenAI config manager
    const config = openAIConfig.getConfig();
    this.apiKey = config.apiKey;
    this.defaultModel = config.chatModel;
    this.defaultTemperature = config.temperature;
    this.defaultMaxTokens = config.maxTokens;
    
    // Log diagnostic info
    if (!this.apiKey) {
      console.warn('ChatService: No OpenAI API key configured');
      const diagnostics = openAIConfig.getDiagnostics();
      console.log('OpenAI Diagnostics:', diagnostics);
    }
  }

  /**
   * Check if chat features are available
   */
  isChatEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(
    message: string,
    sessionMessages: ChatMessage[] = [],
    options: ChatCompletionOptions = {}
  ): Promise<{ response: string; error: Error | null }> {
    try {
      if (!this.isChatEnabled()) {
        throw new Error('Chat features are not enabled. Please configure OpenAI API key.');
      }

      const model = options.model || this.defaultModel;
      const temperature = options.temperature ?? this.defaultTemperature;
      const maxTokens = options.maxTokens || this.defaultMaxTokens;

      // Build messages array for OpenAI
      const messages = this.buildOpenAIMessages(message, sessionMessages, options.systemPrompt);

      // Use adaptive service that automatically chooses direct or proxy mode
      const data = await adaptiveOpenAIService.createChatCompletion(messages, {
        model,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      const aiResponse = data.choices?.[0]?.message?.content || '';

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return { response: aiResponse, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        response: '',
        error: error instanceof Error ? error : new Error('Failed to send message'),
      };
    }
  }

  /**
   * Stream a message response from the AI
   */
  async streamMessage(
    message: string,
    sessionMessages: ChatMessage[] = [],
    options: ChatCompletionOptions = {},
    onChunk: (chunk: string) => void
  ): Promise<{ error: Error | null }> {
    try {
      if (!this.isChatEnabled()) {
        throw new Error('Chat features are not enabled. Please configure OpenAI API key.');
      }

      const model = options.model || this.defaultModel;
      const temperature = options.temperature ?? this.defaultTemperature;
      const maxTokens = options.maxTokens || this.defaultMaxTokens;

      // Build messages array for OpenAI
      const messages = this.buildOpenAIMessages(message, sessionMessages, options.systemPrompt);

      // Call OpenAI API with streaming
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get AI response');
      }

      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error streaming message:', error);
      return {
        error: error instanceof Error ? error : new Error('Failed to stream message'),
      };
    }
  }

  /**
   * Build OpenAI messages array from session messages
   */
  private buildOpenAIMessages(
    currentMessage: string,
    sessionMessages: ChatMessage[],
    systemPrompt?: string
  ): any[] {
    const messages: any[] = [];

    // Add system prompt
    const defaultSystemPrompt = `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. 

Your personality:
- Warm, empathetic, and understanding
- Encouraging and supportive without being overly cheerful
- Professional yet approachable
- Insightful and thoughtful in your responses

Your approach:
- Listen actively and validate feelings
- Ask thoughtful questions to encourage self-reflection
- Provide practical, actionable advice when appropriate
- Share relevant insights about personal growth and well-being
- Respect boundaries and privacy
- Celebrate progress, no matter how small

Remember to:
- Use inclusive and empowering language
- Be culturally sensitive and aware
- Avoid making assumptions about the user's situation
- Focus on strengths while acknowledging challenges
- Provide hope and encouragement while being realistic`;

    messages.push({
      role: 'system',
      content: systemPrompt || defaultSystemPrompt,
    });

    // Add session messages (limit to last 20 to manage context)
    const recentMessages = sessionMessages.slice(-20);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  /**
   * Save chat session to database
   */
  async saveChatSession(session: ChatSession): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Save to localStorage for anonymous users
        this.saveSessionToLocalStorage(session);
        return { error: null };
      }

      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: user.id,
          messages: session.messages,
          metadata: session.metadata,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error saving chat session:', error);
      return {
        error: error instanceof Error ? error : new Error('Failed to save chat session'),
      };
    }
  }

  /**
   * Load chat sessions for a user
   */
  async loadUserSessions(): Promise<{ sessions: ChatSession[]; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Load from localStorage for anonymous users
        const sessions = this.loadSessionsFromLocalStorage();
        return { sessions, error: null };
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const sessions: ChatSession[] = (data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        messages: s.messages || [],
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        metadata: s.metadata,
      }));

      return { sessions, error: null };
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return {
        sessions: [],
        error: error instanceof Error ? error : new Error('Failed to load chat sessions'),
      };
    }
  }

  /**
   * Generate suggested prompts based on context
   */
  getSuggestedPrompts(context?: string): string[] {
    const generalPrompts = [
      "How can I improve my self-confidence?",
      "What are some strategies for managing stress?",
      "How do I set healthy boundaries in relationships?",
      "Can you help me understand my personality type better?",
      "What are some daily habits for personal growth?",
    ];

    const contextualPrompts: Record<string, string[]> = {
      assessment: [
        "What does my personality type mean for my relationships?",
        "How can I leverage my strengths in my career?",
        "What growth areas should I focus on based on my assessment?",
        "Can you explain my personality traits in more detail?",
        "What careers align well with my personality type?",
      ],
      growth: [
        "What are some exercises for building emotional intelligence?",
        "How can I develop better communication skills?",
        "What books would you recommend for personal development?",
        "How do I create an effective morning routine?",
        "What are some ways to practice mindfulness daily?",
      ],
      wellness: [
        "How can I improve my work-life balance?",
        "What are some self-care practices I should try?",
        "How do I deal with anxiety and overwhelm?",
        "What are healthy ways to process difficult emotions?",
        "Can you suggest a wellness routine for busy professionals?",
      ],
    };

    return contextualPrompts[context || ''] || generalPrompts;
  }

  /**
   * Save session to localStorage for anonymous users
   */
  private saveSessionToLocalStorage(session: ChatSession): void {
    try {
      const sessions = this.loadSessionsFromLocalStorage();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }

      // Keep only last 5 sessions in localStorage
      if (sessions.length > 5) {
        sessions.pop();
      }

      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  private loadSessionsFromLocalStorage(): ChatSession[] {
    try {
      const stored = localStorage.getItem('chat_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear all chat sessions for current user
   */
  async clearSessions(): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        localStorage.removeItem('chat_sessions');
        return { error: null };
      }

      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error clearing chat sessions:', error);
      return {
        error: error instanceof Error ? error : new Error('Failed to clear chat sessions'),
      };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();