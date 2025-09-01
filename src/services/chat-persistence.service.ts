/**
 * Chat Persistence Service
 * Handles complete chat session management with history, search, and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { adaptiveOpenAIService } from './adaptive-openai.service';
import { notificationService } from './notification.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: number;
    model?: string;
    emotion?: string;
    intent?: string;
    topics?: string[];
  };
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  topics?: string[];
  emotion_analysis?: {
    overall: string;
    progression: string[];
  };
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_favorite: boolean;
  metadata?: Record<string, any>;
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  topTopics: { topic: string; count: number }[];
  emotionDistribution: Record<string, number>;
  engagementScore: number;
  responseQuality: number;
}

class ChatPersistenceService {
  private currentSession: ChatSession | null = null;
  private userId: string | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private messageBuffer: ChatMessage[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      this.startAutoSave();
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        this.startAutoSave();
      } else {
        this.stopAutoSave();
        this.userId = null;
        this.currentSession = null;
      }
    });
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave() {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      if (this.messageBuffer.length > 0) {
        this.flushMessageBuffer();
      }
    }, 5000); // Auto-save every 5 seconds
  }

  /**
   * Stop auto-save interval
   */
  private stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(title?: string): Promise<ChatSession> {
    if (!this.userId) throw new Error('User not authenticated');

    // Save current session if exists
    if (this.currentSession) {
      await this.saveSession();
    }

    const session: ChatSession = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_archived: false,
      is_favorite: false,
    };

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: session.id,
        user_id: session.user_id,
        title: session.title,
        messages: session.messages,
        created_at: session.created_at,
        updated_at: session.updated_at,
        is_archived: session.is_archived,
        is_favorite: session.is_favorite,
      })
      .select()
      .single();

    if (error) throw error;

    this.currentSession = data;
    return data;
  }

  /**
   * Load an existing session
   */
  async loadSession(sessionId: string): Promise<ChatSession> {
    if (!this.userId) throw new Error('User not authenticated');

    // Save current session if exists
    if (this.currentSession && this.currentSession.id !== sessionId) {
      await this.saveSession();
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;

    this.currentSession = data;
    return data;
  }

  /**
   * Add a message to the current session
   */
  async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    if (!this.currentSession) {
      await this.createSession();
    }

    const fullMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Add to current session
    this.currentSession!.messages.push(fullMessage);
    this.currentSession!.updated_at = new Date().toISOString();

    // Add to buffer for batch saving
    this.messageBuffer.push(fullMessage);

    // Analyze message for metadata
    if (message.role === 'user') {
      await this.analyzeMessage(fullMessage);
    }

    // Update session title if it's the first user message
    if (this.currentSession!.messages.filter(m => m.role === 'user').length === 1) {
      await this.generateSessionTitle();
    }

    return fullMessage;
  }

  /**
   * Analyze message for intent, emotion, and topics
   */
  private async analyzeMessage(message: ChatMessage) {
    try {
      const analysis = await adaptiveOpenAIService.createChatCompletion([
        {
          role: 'system',
          content: 'Analyze the following message and return a JSON object with: intent (string), emotion (string), topics (array of strings). Be concise.'
        },
        {
          role: 'user',
          content: message.content
        }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 100
      });

      if (analysis.choices?.[0]?.message?.content) {
        try {
          const metadata = JSON.parse(analysis.choices[0].message.content);
          message.metadata = {
            ...message.metadata,
            ...metadata
          };
        } catch (e) {
          // JSON parse error, ignore
        }
      }
    } catch (error) {
      console.error('Failed to analyze message:', error);
    }
  }

  /**
   * Generate a title for the session based on content
   */
  private async generateSessionTitle() {
    if (!this.currentSession || this.currentSession.messages.length < 2) return;

    try {
      const firstMessages = this.currentSession.messages.slice(0, 4);
      const context = firstMessages.map(m => `${m.role}: ${m.content.substring(0, 100)}`).join('\n');

      const response = await adaptiveOpenAIService.createChatCompletion([
        {
          role: 'system',
          content: 'Generate a short, descriptive title (max 50 chars) for this conversation. Return only the title, no quotes or explanation.'
        },
        {
          role: 'user',
          content: context
        }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 20
      });

      if (response.choices?.[0]?.message?.content) {
        const title = response.choices[0].message.content.trim().substring(0, 50);
        this.currentSession.title = title;
        await this.saveSession();
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    }
  }

  /**
   * Save the current session
   */
  async saveSession(): Promise<void> {
    if (!this.currentSession || !this.userId) return;

    await this.flushMessageBuffer();

    const { error } = await supabase
      .from('chat_sessions')
      .update({
        title: this.currentSession.title,
        messages: this.currentSession.messages,
        summary: this.currentSession.summary,
        topics: this.currentSession.topics,
        emotion_analysis: this.currentSession.emotion_analysis,
        updated_at: new Date().toISOString(),
        is_archived: this.currentSession.is_archived,
        is_favorite: this.currentSession.is_favorite,
        metadata: this.currentSession.metadata,
      })
      .eq('id', this.currentSession.id)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Flush message buffer
   */
  private async flushMessageBuffer() {
    if (this.messageBuffer.length === 0 || !this.currentSession) return;

    // Update session in database
    await this.saveSession();

    // Clear buffer
    this.messageBuffer = [];
  }

  /**
   * Get all sessions for the current user
   */
  async getSessions(options?: {
    limit?: number;
    offset?: number;
    archived?: boolean;
    favorite?: boolean;
    search?: string;
  }): Promise<ChatSession[]> {
    if (!this.userId) return [];

    let query = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });

    if (options?.archived !== undefined) {
      query = query.eq('is_archived', options.archived);
    }

    if (options?.favorite !== undefined) {
      query = query.eq('is_favorite', options.favorite);
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,messages.cs.${options.search}`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.userId) return;

    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Archive/unarchive a session
   */
  async toggleArchive(sessionId: string): Promise<void> {
    if (!this.userId) return;

    const { data: session } = await supabase
      .from('chat_sessions')
      .select('is_archived')
      .eq('id', sessionId)
      .eq('user_id', this.userId)
      .single();

    if (session) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: !session.is_archived })
        .eq('id', sessionId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Failed to toggle archive:', error);
      }
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(sessionId: string): Promise<void> {
    if (!this.userId) return;

    const { data: session } = await supabase
      .from('chat_sessions')
      .select('is_favorite')
      .eq('id', sessionId)
      .eq('user_id', this.userId)
      .single();

    if (session) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_favorite: !session.is_favorite })
        .eq('id', sessionId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  }

  /**
   * Generate session summary
   */
  async generateSummary(sessionId?: string): Promise<string> {
    const session = sessionId ? await this.loadSession(sessionId) : this.currentSession;
    if (!session || session.messages.length < 4) return '';

    try {
      const conversation = session.messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await adaptiveOpenAIService.createChatCompletion([
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences. Focus on key topics and outcomes.'
        },
        {
          role: 'user',
          content: conversation.substring(0, 4000) // Limit context
        }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 150
      });

      if (response.choices?.[0]?.message?.content) {
        const summary = response.choices[0].message.content;
        session.summary = summary;
        await this.saveSession();
        return summary;
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }

    return '';
  }

  /**
   * Get chat analytics
   */
  async getAnalytics(): Promise<ChatAnalytics> {
    if (!this.userId) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        averageSessionLength: 0,
        topTopics: [],
        emotionDistribution: {},
        engagementScore: 0,
        responseQuality: 0
      };
    }

    const sessions = await this.getSessions({ limit: 100 });
    
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const averageSessionLength = totalSessions > 0 ? totalMessages / totalSessions : 0;

    // Analyze topics
    const topicCounts = new Map<string, number>();
    sessions.forEach(session => {
      session.topics?.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Analyze emotions
    const emotionCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.metadata?.emotion) {
          emotionCounts[msg.metadata.emotion] = (emotionCounts[msg.metadata.emotion] || 0) + 1;
        }
      });
    });

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (totalSessions * 10 + totalMessages * 2 + averageSessionLength * 5) / 3
    ));

    // Calculate response quality (0-100)
    const responseQuality = 85; // Placeholder - would analyze actual response quality

    return {
      totalSessions,
      totalMessages,
      averageSessionLength,
      topTopics,
      emotionDistribution: emotionCounts,
      engagementScore,
      responseQuality
    };
  }

  /**
   * Export chat history
   */
  async exportHistory(format: 'json' | 'markdown' | 'pdf' = 'json'): Promise<string | Blob> {
    if (!this.userId) throw new Error('User not authenticated');

    const sessions = await this.getSessions({ limit: 1000 });

    switch (format) {
      case 'json':
        return JSON.stringify(sessions, null, 2);

      case 'markdown':
        let markdown = '# Chat History\n\n';
        sessions.forEach(session => {
          markdown += `## ${session.title}\n`;
          markdown += `*Created: ${new Date(session.created_at).toLocaleDateString()}*\n\n`;
          session.messages.forEach(msg => {
            markdown += `**${msg.role}**: ${msg.content}\n\n`;
          });
          markdown += '---\n\n';
        });
        return markdown;

      case 'pdf':
        // Would use a library like jsPDF
        throw new Error('PDF export not implemented yet');

      default:
        return JSON.stringify(sessions);
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  clearCurrentSession(): void {
    this.currentSession = null;
    this.messageBuffer = [];
  }
}

// Export singleton instance
export const chatPersistenceService = new ChatPersistenceService();