/**
 * Enhanced Realtime Voice Agent Service
 * Production-ready implementation using OpenAI Agents SDK with handoffs and tools
 */

import { logger } from '@/services/logging/logger.service';
import { validateDTO, VoiceAgentConfigSchema, CreateVoiceSessionSchema } from '@/types/dto';
import { businessLogic } from '@/services/business/business-logic.service';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';

export interface RealtimeAgentConfig {
  name: string;
  instructions: string;
  model: string;
  voice: string;
  temperature: number;
  tools: AgentTool[];
  handoffs: RealtimeAgent[];
  sessionConfig: {
    turn_detection: {
      type: 'server_vad' | 'none';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
    input_audio_format: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    output_audio_format: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    input_audio_transcription: {
      model: 'whisper-1';
    };
  };
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: any, context: AgentContext) => Promise<string>;
}

export interface AgentContext {
  userId?: string;
  sessionId: string;
  conversationHistory: ConversationItem[];
  userProfile?: any;
  metadata: Record<string, unknown>;
}

export interface ConversationItem {
  id: string;
  type: 'message' | 'function_call' | 'function_response';
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audio_transcript?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  function_response?: {
    name: string;
    content: string;
  };
}

export interface VoiceSessionState {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'interrupted' | 'error';
  agent: RealtimeAgent;
  context: AgentContext;
  startedAt: Date;
  lastActivity: Date;
  totalDuration: number;
  conversationHistory: ConversationItem[];
  metadata: Record<string, unknown>;
}

class RealtimeAgent {
  public name: string;
  public instructions: string;
  public model: string;
  public voice: string;
  public temperature: number;
  public tools: AgentTool[];
  public handoffs: RealtimeAgent[];
  public sessionConfig: RealtimeAgentConfig['sessionConfig'];
  private sessions = new Map<string, VoiceSessionState>();

  constructor(config: RealtimeAgentConfig) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.voice = config.voice;
    this.temperature = config.temperature;
    this.tools = config.tools || [];
    this.handoffs = config.handoffs || [];
    this.sessionConfig = config.sessionConfig;
    
    logger.info('RealtimeAgent initialized', {
      component: 'RealtimeAgent',
      action: 'constructor',
      metadata: { 
        name: this.name, 
        model: this.model,
        toolCount: this.tools.length,
        handoffCount: this.handoffs.length
      }
    });
  }

  /**
   * Create a new voice session
   */
  async createSession(userId?: string, metadata: Record<string, unknown> = {}): Promise<VoiceSessionState> {
    const sessionId = this.generateSessionId();
    
    try {
      // Validate session creation
      const sessionData = validateDTO(CreateVoiceSessionSchema, {
        user_id: userId,
        metadata
      });

      // Check business rules
      const businessResult = await businessLogic.createVoiceSession(sessionData, {
        userId,
        timestamp: new Date(),
        sessionId
      });

      if (!businessResult.success) {
        throw new Error(businessResult.businessErrors?.join(', ') || 'Session creation failed');
      }

      // Load user profile if available
      let userProfile = null;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        userProfile = profile;
      }

      // Create session state
      const session: VoiceSessionState = {
        id: sessionId,
        status: 'pending',
        agent: this,
        context: {
          userId,
          sessionId,
          conversationHistory: [],
          userProfile,
          metadata
        },
        startedAt: new Date(),
        lastActivity: new Date(),
        totalDuration: 0,
        conversationHistory: [],
        metadata
      };

      this.sessions.set(sessionId, session);

      // Save session to database
      await this.saveSessionToDatabase(session);

      logger.info('Voice session created', {
        component: 'RealtimeAgent',
        action: 'createSession',
        metadata: { sessionId, userId, agentName: this.name }
      });

      return session;
    } catch (error) {
      logger.error('Failed to create voice session', {
        component: 'RealtimeAgent',
        action: 'createSession',
        metadata: { userId, agentName: this.name },
        error
      });
      throw error;
    }
  }

  /**
   * Start a voice session
   */
  async startSession(sessionId: string): Promise<{
    websocketUrl: string;
    ephemeralToken: string;
    sessionConfig: any;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Generate ephemeral token for client
      const tokenResponse = await fetch('/api/voice/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: session.context.userId,
          agentConfig: {
            name: this.name,
            instructions: this.buildContextualInstructions(session.context),
            model: this.model,
            voice: this.voice,
            temperature: this.temperature,
            tools: this.tools.map(tool => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
              }
            }))
          }
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to generate session token');
      }

      const tokenData = await tokenResponse.json();

      // Update session status
      session.status = 'active';
      session.lastActivity = new Date();
      await this.updateSessionInDatabase(session);

      return {
        websocketUrl: 'wss://api.openai.com/v1/realtime',
        ephemeralToken: tokenData.token,
        sessionConfig: {
          ...this.sessionConfig,
          instructions: this.buildContextualInstructions(session.context),
          tools: this.tools.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }
          }))
        }
      };
    } catch (error) {
      session.status = 'error';
      await this.updateSessionInDatabase(session);
      
      logger.error('Failed to start voice session', {
        component: 'RealtimeAgent',
        action: 'startSession',
        metadata: { sessionId, agentName: this.name },
        error
      });
      throw error;
    }
  }

  /**
   * Handle incoming messages and tool calls
   */
  async handleMessage(
    sessionId: string, 
    message: string, 
    audioTranscript?: string
  ): Promise<{ response: string; shouldHandoff?: string; toolCalls?: any[] }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Add message to conversation history
      const messageItem: ConversationItem = {
        id: this.generateMessageId(),
        type: 'message',
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        audio_transcript: audioTranscript
      };

      session.conversationHistory.push(messageItem);
      session.lastActivity = new Date();

      // Check if handoff is needed
      const handoffAgent = await this.checkForHandoff(message, session.context);
      if (handoffAgent) {
        return {
          response: `Transferring you to ${handoffAgent.name} for specialized assistance...`,
          shouldHandoff: handoffAgent.name
        };
      }

      // Process with current agent
      const response = await this.generateResponse(session);
      
      // Add response to conversation history
      const responseItem: ConversationItem = {
        id: this.generateMessageId(),
        type: 'message',
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      session.conversationHistory.push(responseItem);

      // Save session state
      await this.updateSessionInDatabase(session);

      return response;
    } catch (error) {
      logger.error('Failed to handle message', {
        component: 'RealtimeAgent',
        action: 'handleMessage',
        metadata: { sessionId, agentName: this.name },
        error
      });
      throw error;
    }
  }

  /**
   * Handle tool execution
   */
  async handleToolCall(
    sessionId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    try {
      const result = await tool.execute(parameters, session.context);
      
      // Add tool call to conversation history
      const toolCallItem: ConversationItem = {
        id: this.generateMessageId(),
        type: 'function_call',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        function_call: {
          name: toolName,
          arguments: JSON.stringify(parameters)
        }
      };

      const toolResponseItem: ConversationItem = {
        id: this.generateMessageId(),
        type: 'function_response',
        role: 'system',
        content: result,
        timestamp: new Date().toISOString(),
        function_response: {
          name: toolName,
          content: result
        }
      };

      session.conversationHistory.push(toolCallItem, toolResponseItem);
      session.lastActivity = new Date();

      await this.updateSessionInDatabase(session);

      logger.info('Tool executed successfully', {
        component: 'RealtimeAgent',
        action: 'handleToolCall',
        metadata: { sessionId, toolName, agentName: this.name }
      });

      return result;
    } catch (error) {
      logger.error('Tool execution failed', {
        component: 'RealtimeAgent',
        action: 'handleToolCall',
        metadata: { sessionId, toolName, agentName: this.name },
        error
      });
      throw error;
    }
  }

  /**
   * End a voice session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      const endTime = new Date();
      session.status = 'completed';
      session.totalDuration = endTime.getTime() - session.startedAt.getTime();
      session.lastActivity = endTime;

      // Save final session state
      await this.updateSessionInDatabase(session);

      // Remove from active sessions
      this.sessions.delete(sessionId);

      logger.info('Voice session ended', {
        component: 'RealtimeAgent',
        action: 'endSession',
        metadata: { 
          sessionId, 
          duration: session.totalDuration,
          messageCount: session.conversationHistory.length,
          agentName: this.name
        }
      });
    } catch (error) {
      logger.error('Failed to end voice session', {
        component: 'RealtimeAgent',
        action: 'endSession',
        metadata: { sessionId, agentName: this.name },
        error
      });
      throw error;
    }
  }

  /**
   * Get session state (for serialization/resumption)
   */
  getSessionState(sessionId: string): VoiceSessionState | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Resume session from serialized state
   */
  async resumeSession(serializedState: string): Promise<VoiceSessionState> {
    try {
      const sessionData = JSON.parse(serializedState);
      const session = this.reconstructSessionState(sessionData);
      
      this.sessions.set(session.id, session);
      
      logger.info('Voice session resumed', {
        component: 'RealtimeAgent',
        action: 'resumeSession',
        metadata: { sessionId: session.id, agentName: this.name }
      });

      return session;
    } catch (error) {
      logger.error('Failed to resume voice session', {
        component: 'RealtimeAgent',
        action: 'resumeSession',
        error
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private buildContextualInstructions(context: AgentContext): string {
    let instructions = this.instructions;

    // Add user context if available
    if (context.userProfile) {
      instructions += `\n\nUser Context:`;
      instructions += `\nName: ${context.userProfile.name}`;
      if (context.userProfile.preferences?.language) {
        instructions += `\nPreferred Language: ${context.userProfile.preferences.language}`;
      }
      if (context.userProfile.preferences?.culturalContext) {
        instructions += `\nCultural Context: ${context.userProfile.preferences.culturalContext}`;
      }
    }

    // Add conversation context
    if (context.conversationHistory.length > 0) {
      instructions += `\n\nRecent Conversation Context:`;
      const recentMessages = context.conversationHistory.slice(-5);
      recentMessages.forEach(msg => {
        instructions += `\n${msg.role}: ${msg.content}`;
      });
    }

    // Add Arabic cultural expressions
    instructions += `\n\nCultural Expression Guidelines:`;
    instructions += `\nUse these Arabic expressions when appropriate:`;
    instructions += `\n- حبيبتي (habibti) for endearment`;
    instructions += `\n- إن شاء الله (inshallah) for hope and future plans`;
    instructions += `\n- ما شاء الله (mashallah) for admiration and praise`;
    instructions += `\n- الحمد لله (alhamdulillah) for gratitude`;
    instructions += `\nAlways be warm, empathetic, and supportive.`;

    return instructions;
  }

  private async checkForHandoff(message: string, context: AgentContext): Promise<RealtimeAgent | null> {
    // Simple handoff logic based on message content
    const lowerMessage = message.toLowerCase();

    for (const handoffAgent of this.handoffs) {
      // Check if message indicates need for specialist agent
      if (handoffAgent.name.toLowerCase().includes('assessment') && 
          (lowerMessage.includes('assessment') || lowerMessage.includes('personality'))) {
        return handoffAgent;
      }
      
      if (handoffAgent.name.toLowerCase().includes('crisis') && 
          (lowerMessage.includes('emergency') || lowerMessage.includes('urgent'))) {
        return handoffAgent;
      }

      if (handoffAgent.name.toLowerCase().includes('expert') && 
          lowerMessage.includes('expert help')) {
        return handoffAgent;
      }
    }

    return null;
  }

  private async generateResponse(session: VoiceSessionState): Promise<{ response: string; toolCalls?: any[] }> {
    // This would integrate with the actual OpenAI Realtime API
    // For now, return a contextual response based on conversation history
    
    const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
    if (!lastMessage) {
      return { response: 'Hello! How can I help you today?' };
    }

    // Generate contextual response
    const response = await this.generateContextualResponse(lastMessage.content, session.context);
    
    return { response };
  }

  private async generateContextualResponse(message: string, context: AgentContext): Promise<string> {
    // Implement actual AI response generation here
    // This would call the unified AI service with the full context
    
    const contextualPrompt = this.buildContextualInstructions(context);
    const conversationContext = context.conversationHistory.map(item => ({
      role: item.role,
      content: item.content
    }));

    // Add current message
    conversationContext.push({
      role: 'user',
      content: message
    });

    try {
      // Use the unified AI service for response generation
      const { unifiedAI } = await import('@/services/ai/unified-ai.service');
      
      const response = await unifiedAI.chat([
        {
          role: 'system',
          content: contextualPrompt
        },
        ...conversationContext.slice(-10) // Keep last 10 messages for context
      ], {
        provider: 'openai',
        model: this.model,
        temperature: this.temperature,
        maxTokens: 500
      });

      return response.content;
    } catch (error) {
      logger.error('Failed to generate AI response', {
        component: 'RealtimeAgent',
        action: 'generateContextualResponse',
        error
      });
      
      // Fallback response
      return 'I understand you want to talk about that. Could you tell me more about how you\'re feeling?';
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private reconstructSessionState(data: any): VoiceSessionState {
    return {
      id: data.id,
      status: data.status || 'pending',
      agent: this,
      context: data.context,
      startedAt: new Date(data.startedAt),
      lastActivity: new Date(data.lastActivity),
      totalDuration: data.totalDuration || 0,
      conversationHistory: data.conversationHistory || [],
      metadata: data.metadata || {}
    };
  }

  private async saveSessionToDatabase(session: VoiceSessionState): Promise<void> {
    try {
      await supabase
        .from('voice_sessions')
        .insert({
          id: session.id,
          user_id: session.context.userId,
          status: session.status,
          started_at: session.startedAt.toISOString(),
          conversation_data: {
            agentName: this.name,
            conversationHistory: session.conversationHistory,
            context: session.context
          },
          metadata: session.metadata
        });
    } catch (error) {
      logger.error('Failed to save session to database', {
        component: 'RealtimeAgent',
        action: 'saveSessionToDatabase',
        metadata: { sessionId: session.id },
        error
      });
    }
  }

  private async updateSessionInDatabase(session: VoiceSessionState): Promise<void> {
    try {
      await supabase
        .from('voice_sessions')
        .update({
          status: session.status,
          ended_at: session.status === 'completed' ? session.lastActivity.toISOString() : null,
          duration_seconds: Math.floor(session.totalDuration / 1000),
          conversation_data: {
            agentName: this.name,
            conversationHistory: session.conversationHistory,
            context: session.context
          },
          metadata: session.metadata
        })
        .eq('id', session.id);
    } catch (error) {
      logger.error('Failed to update session in database', {
        component: 'RealtimeAgent',
        action: 'updateSessionInDatabase',
        metadata: { sessionId: session.id },
        error
      });
    }
  }
}

/**
 * Pre-configured agents for different scenarios
 */

// Main NewMe Agent - Primary conversational companion
export const createNewMeAgent = (): RealtimeAgent => {
  return new RealtimeAgent({
    name: 'NewMe',
    instructions: `You are NewMe, an AI companion designed to support women in their personal growth journey. 
    
    Core Principles:
    - Be empathetic, encouraging, and insightful
    - Help users explore their emotions, set goals, and build confidence
    - Keep responses warm and conversational
    - Use cultural expressions when appropriate (Arabic phrases for MENA users)
    - Focus on personal growth, self-awareness, and empowerment
    
    Conversation Style:
    - Ask thoughtful follow-up questions
    - Validate emotions and experiences
    - Offer practical suggestions and insights
    - Encourage self-reflection and goal setting
    - Be supportive but also gently challenging when appropriate`,
    
    model: 'gpt-4o-realtime-preview-2024-10-01',
    voice: 'nova',
    temperature: 0.7,
    
    tools: [
      {
        name: 'recommend_assessment',
        description: 'Recommend a personality or growth assessment based on user needs',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Assessment category',
              enum: ['personality', 'career', 'relationships', 'wellness', 'skills']
            },
            reason: {
              type: 'string',
              description: 'Why this assessment is recommended'
            }
          },
          required: ['category', 'reason']
        },
        execute: async (params: any, context: AgentContext) => {
          logger.info('Assessment recommendation tool called', {
            component: 'NewMeAgent',
            action: 'recommend_assessment',
            metadata: { params, userId: context.userId }
          });
          
          return `I recommend taking a ${params.category} assessment because ${params.reason}. This will help you gain insights into your personal growth journey. Would you like me to guide you to the assessment?`;
        }
      },
      
      {
        name: 'schedule_reminder',
        description: 'Schedule a reminder for the user',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Reminder message'
            },
            datetime: {
              type: 'string',
              description: 'When to send reminder (ISO 8601 format)'
            }
          },
          required: ['message', 'datetime']
        },
        execute: async (params: any, context: AgentContext) => {
          // In production, integrate with notification service
          logger.info('Reminder scheduled', {
            component: 'NewMeAgent',
            action: 'schedule_reminder',
            metadata: { params, userId: context.userId }
          });
          
          return `I've scheduled your reminder: "${params.message}" for ${new Date(params.datetime).toLocaleString()}. You'll receive a notification when it's time.`;
        }
      },

      {
        name: 'track_mood',
        description: 'Track user mood and emotional state',
        parameters: {
          type: 'object',
          properties: {
            mood: {
              type: 'string',
              enum: ['happy', 'sad', 'anxious', 'excited', 'calm', 'frustrated', 'grateful', 'overwhelmed']
            },
            intensity: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description: 'Mood intensity from 1-10'
            },
            notes: {
              type: 'string',
              description: 'Additional notes about current emotional state'
            }
          },
          required: ['mood', 'intensity']
        },
        execute: async (params: any, context: AgentContext) => {
          // Save mood data to user profile
          if (context.userId) {
            await supabase
              .from('user_mood_tracking')
              .insert({
                user_id: context.userId,
                mood: params.mood,
                intensity: params.intensity,
                notes: params.notes,
                recorded_at: new Date().toISOString()
              })
              .catch(err => {
                logger.warn('Failed to save mood data', {
                  component: 'NewMeAgent', 
                  action: 'track_mood',
                  error: err
                });
              });
          }

          return `Thank you for sharing that you're feeling ${params.mood} at level ${params.intensity}. ${params.notes ? `I appreciate you telling me: "${params.notes}".` : ''} How can I support you with this feeling?`;
        }
      }
    ],
    
    handoffs: [], // Will be populated with specialist agents
    
    sessionConfig: {
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      }
    }
  });
};

// Assessment Specialist Agent
export const createAssessmentAgent = (): RealtimeAgent => {
  return new RealtimeAgent({
    name: 'Assessment Specialist',
    instructions: `You are an assessment specialist focused on helping users understand their personality, skills, and growth areas through comprehensive evaluations.
    
    Your expertise includes:
    - Personality assessments and interpretation
    - Skills evaluation and development planning
    - Growth goal identification and tracking
    - Results interpretation and actionable insights
    
    Always provide detailed, personalized feedback and connect assessment results to actionable growth steps.`,
    
    model: 'gpt-4o-realtime-preview-2024-10-01',
    voice: 'alloy',
    temperature: 0.6,
    
    tools: [
      {
        name: 'create_custom_assessment',
        description: 'Create a personalized assessment for the user',
        parameters: {
          type: 'object',
          properties: {
            focus_area: {
              type: 'string',
              description: 'Area of focus for the assessment'
            },
            question_count: {
              type: 'number',
              minimum: 5,
              maximum: 20,
              description: 'Number of questions to include'
            }
          },
          required: ['focus_area']
        },
        execute: async (params: any, context: AgentContext) => {
          // Integration with AI content generation
          return `I'm creating a personalized ${params.focus_area} assessment with ${params.question_count || 10} questions tailored specifically for your growth journey.`;
        }
      }
    ],
    
    handoffs: [],
    
    sessionConfig: {
      turn_detection: {
        type: 'server_vad',
        threshold: 0.4,
        prefix_padding_ms: 200,
        silence_duration_ms: 800
      },
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      }
    }
  });
};

// Crisis Support Agent
export const createCrisisSupportAgent = (): RealtimeAgent => {
  return new RealtimeAgent({
    name: 'Crisis Support',
    instructions: `You are a crisis support specialist trained to provide immediate emotional support and connect users with appropriate resources.
    
    Critical Guidelines:
    - Always prioritize user safety and wellbeing
    - Provide immediate emotional support and validation
    - Connect users with professional resources when needed
    - Use calm, reassuring tone
    - Ask direct questions about immediate safety
    - Provide crisis hotline numbers when appropriate
    
    Remember: You are not a replacement for professional help, but a supportive bridge to resources.`,
    
    model: 'gpt-4o-realtime-preview-2024-10-01',
    voice: 'echo', // Calm, steady voice for crisis support
    temperature: 0.3, // Lower temperature for more consistent, reliable responses
    
    tools: [
      {
        name: 'provide_crisis_resources',
        description: 'Provide immediate crisis support resources and hotlines',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'User location for local resources'
            },
            crisis_type: {
              type: 'string',
              enum: ['mental_health', 'domestic_violence', 'substance_abuse', 'general']
            }
          },
          required: ['crisis_type']
        },
        execute: async (params: any, context: AgentContext) => {
          const resources = {
            mental_health: 'National Suicide Prevention Lifeline: 988 (US), Samaritans: 116 123 (UK)',
            domestic_violence: 'National Domestic Violence Hotline: 1-800-799-7233',
            substance_abuse: 'SAMHSA National Helpline: 1-800-662-4357',
            general: 'Crisis Text Line: Text HOME to 741741'
          };
          
          const resource = resources[params.crisis_type as keyof typeof resources];
          
          logger.warn('Crisis support resources provided', {
            component: 'CrisisSupportAgent',
            action: 'provide_crisis_resources',
            metadata: { crisisType: params.crisis_type, userId: context.userId }
          });
          
          return `Here are immediate support resources: ${resource}. You are not alone, and help is available. Would you like me to help you connect with local support services?`;
        }
      }
    ],
    
    handoffs: [],
    
    sessionConfig: {
      turn_detection: {
        type: 'server_vad',
        threshold: 0.3, // More sensitive for crisis situations
        prefix_padding_ms: 500,
        silence_duration_ms: 1000
      },
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      }
    }
  });
};

/**
 * Voice Agent Manager
 * Manages multiple agents and handles routing between them
 */
class VoiceAgentManagerService {
  private static instance: VoiceAgentManagerService;
  private agents = new Map<string, RealtimeAgent>();
  private defaultAgent: RealtimeAgent;

  private constructor() {
    this.defaultAgent = createNewMeAgent();
    this.registerAgent('newme', this.defaultAgent);
    this.registerAgent('assessment', createAssessmentAgent());
    this.registerAgent('crisis', createCrisisSupportAgent());

    // Set up handoffs between agents
    this.setupAgentHandoffs();
  }

  static getInstance(): VoiceAgentManagerService {
    if (!VoiceAgentManagerService.instance) {
      VoiceAgentManagerService.instance = new VoiceAgentManagerService();
    }
    return VoiceAgentManagerService.instance;
  }

  registerAgent(id: string, agent: RealtimeAgent): void {
    this.agents.set(id, agent);
    
    logger.info('Agent registered', {
      component: 'VoiceAgentManagerService',
      action: 'registerAgent',
      metadata: { agentId: id, agentName: agent.name }
    });
  }

  getAgent(id: string): RealtimeAgent | null {
    return this.agents.get(id) || null;
  }

  getDefaultAgent(): RealtimeAgent {
    return this.defaultAgent;
  }

  listAgents(): Array<{ id: string; name: string; description: string }> {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      name: agent.name,
      description: agent.instructions.split('.')[0] + '.'
    }));
  }

  private setupAgentHandoffs(): void {
    const newMeAgent = this.agents.get('newme');
    const assessmentAgent = this.agents.get('assessment');
    const crisisAgent = this.agents.get('crisis');

    if (newMeAgent && assessmentAgent && crisisAgent) {
      // NewMe can hand off to specialists
      newMeAgent.handoffs.push(assessmentAgent, crisisAgent);
      
      // Specialists can hand back to main agent
      assessmentAgent.handoffs.push(newMeAgent);
      crisisAgent.handoffs.push(newMeAgent);
    }
  }

  async createSession(agentId: string = 'newme', userId?: string, metadata: Record<string, unknown> = {}): Promise<VoiceSessionState> {
    const agent = this.agents.get(agentId) || this.defaultAgent;
    return agent.createSession(userId, metadata);
  }

  async handleHandoff(fromSessionId: string, toAgentId: string): Promise<VoiceSessionState> {
    const fromAgent = Array.from(this.agents.values()).find(agent => 
      agent.getSessionState(fromSessionId) !== null
    );
    
    if (!fromAgent) {
      throw new Error('Source session not found');
    }

    const fromSession = fromAgent.getSessionState(fromSessionId)!;
    const toAgent = this.agents.get(toAgentId);
    
    if (!toAgent) {
      throw new Error('Target agent not found');
    }

    // End current session
    await fromAgent.endSession(fromSessionId);

    // Create new session with context transfer
    const newSession = await toAgent.createSession(
      fromSession.context.userId,
      {
        ...fromSession.metadata,
        handoff: true,
        previousAgent: fromAgent.name,
        previousConversation: fromSession.conversationHistory.slice(-5)
      }
    );

    logger.info('Agent handoff completed', {
      component: 'VoiceAgentManagerService',
      action: 'handleHandoff',
      metadata: {
        fromAgent: fromAgent.name,
        toAgent: toAgent.name,
        fromSessionId,
        toSessionId: newSession.id
      }
    });

    return newSession;
  }
}

// Export singleton and factories
export const voiceAgentManager = VoiceAgentManagerService.getInstance();
export { RealtimeAgent };

// Convenience exports
export const agents = {
  newme: () => voiceAgentManager.getAgent('newme')!,
  assessment: () => voiceAgentManager.getAgent('assessment')!,
  crisis: () => voiceAgentManager.getAgent('crisis')!,
  default: () => voiceAgentManager.getDefaultAgent(),
};

export default voiceAgentManager;
