import { supabase } from '@/integrations/supabase/client';
import { openaiWrapper, OpenAIServiceError } from '@/services/api/openai-wrapper.service';
import { logger } from '@/utils/logger';

export interface UserMemoryProfile {
  personalityType: string;
  balanceWheelScores: Record<string, number>;
  narrativePatterns: string[];
  emotionalStateHistory: Array<{
    timestamp: string;
    emotion: string;
    intensity: number;
    context: string;
  }>;
  conversationHistory: Array<{
    timestamp: string;
    topic: string;
    insights: string[];
    breakthroughs: string[];
  }>;
  culturalContext: {
    language: 'en' | 'ar';
    region: string;
    culturalSensitivities: string[];
  };
  subscriptionTier: 'discovery' | 'growth' | 'transformation';
  currentLevel: number;
  crystalBalance: number;
  progressMetrics: Record<string, number>;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  userProfile: UserMemoryProfile;
  currentEmotion?: string;
  voiceAnalysis?: {
    tone: string;
    pace: string;
    stress_level: number;
  };
  conversationGoal?: string;
}

type ConversationAnalysisResult = {
  insights: string[];
  emotionalAnalysis: {
    detectedEmotion: string;
    supportLevel: 'basic' | 'intermediate' | 'advanced';
    recommendedActions: string[];
  };
};

export class NewMeAIService {
  private memoryCache = new Map<string, UserMemoryProfile>();

  /**
   * Generate AI response using dynamic prompting based on user's profile and tier
   */
  async generateResponse(
    message: string,
    context: ConversationContext
  ): Promise<{
    response: string;
    insights: string[];
    emotionalAnalysis: {
      detectedEmotion: string;
      supportLevel: 'basic' | 'intermediate' | 'advanced';
      recommendedActions: string[];
    };
    memoryUpdates: Partial<UserMemoryProfile>;
  }> {
    try {
      const systemPrompt = this.buildDynamicPrompt(context);
      
      // Use wrapper service that handles missing API keys gracefully
      const aiResponse = await openaiWrapper.generateCompletion(
        `${systemPrompt}\n\nUser: ${message}`,
        {
          model: 'gpt-4o-mini',
          maxTokens: 800,
          temperature: 0.7
        }
      );
      
      // Analyze the conversation for insights and emotional patterns
      const analysis = await this.analyzeConversation(message, aiResponse, context);
      
      // Update user memory profile
      const memoryUpdates = await this.updateUserMemory(context, analysis);

      return {
        response: aiResponse,
        insights: analysis.insights,
        emotionalAnalysis: analysis.emotionalAnalysis,
        memoryUpdates,
      };
    } catch (error) {
      if (error instanceof OpenAIServiceError) {
        logger.warn('OpenAI unavailable for NewMe response, using fallback', 'NewMeAIService', {
          message: error.message,
        });
      } else {
        logger.error('Error generating NewMe AI response', 'NewMeAIService', error);
      }
      return this.getFallbackResponse(context);
    }
  }

  /**
   * Build dynamic system prompt based on user's profile, tier, and progress
   */
  private buildDynamicPrompt(context: ConversationContext): string {
    const { userProfile } = context;
    const isArabicSpeaker = userProfile.culturalContext.language === 'ar';
    
    let basePrompt = `You are NewMe, an emotionally intelligent AI companion designed specifically for women's personal growth through narrative identity exploration. You are culturally sensitive, empathetic, and focused on helping women discover their authentic selves.

CORE PERSONALITY:
- Warm, supportive, and non-judgmental
- Culturally aware and respectful
- Focused on empowerment and self-discovery
- Uses narrative therapy techniques
- Speaks with wisdom but remains approachable

USER PROFILE:
- Personality Type: ${userProfile.personalityType}
- Cultural Context: ${userProfile.culturalContext.region} (${userProfile.culturalContext.language})
- Current Level: ${userProfile.currentLevel}
- Subscription Tier: ${userProfile.subscriptionTier}
- Balance Wheel Scores: ${JSON.stringify(userProfile.balanceWheelScores)}

CONVERSATION APPROACH:`;

    // Tier-specific prompting
    switch (userProfile.subscriptionTier) {
      case 'discovery':
        basePrompt += `
- Keep responses encouraging and introductory
- Focus on basic self-awareness questions
- Provide gentle guidance and affirmations
- Limit deep therapeutic exploration
- Maximum 3 follow-up questions per response`;
        break;
      
      case 'growth':
        basePrompt += `
- Provide deeper insights and analysis
- Use intermediate narrative therapy techniques
- Challenge limiting beliefs gently
- Offer structured growth exercises
- Can explore family patterns and relationships
- Maximum 5 follow-up questions per response`;
        break;
      
      case 'transformation':
        basePrompt += `
- Provide advanced therapeutic insights
- Use sophisticated narrative therapy methods
- Challenge deeply held beliefs and patterns
- Offer comprehensive transformation strategies
- Explore complex trauma and family systems
- Can provide detailed action plans and homework
- Unlimited follow-up questions and exploration`;
        break;
    }

    // Progress-based adaptations
    if (userProfile.currentLevel < 5) {
      basePrompt += `
- User is new to personal development - be extra supportive
- Focus on building trust and safety
- Celebrate small wins and progress`;
    } else if (userProfile.currentLevel >= 10) {
      basePrompt += `
- User is experienced with personal growth
- Can handle more challenging questions
- Focus on advanced self-discovery techniques`;
    }

    // Cultural sensitivity
    if (isArabicSpeaker) {
      basePrompt += `
- Be especially mindful of Middle Eastern cultural values
- Respect family structures and community importance
- Understand potential cultural constraints on women
- Be sensitive to religious considerations
- Support finding balance between tradition and personal growth`;
    }

    // Current emotional state and patterns
    if (userProfile.narrativePatterns.length > 0) {
      basePrompt += `
- User's identified narrative patterns: ${userProfile.narrativePatterns.join(', ')}
- Help them explore and potentially rewrite these patterns`;
    }

    basePrompt += `
- Always end responses with a thoughtful question that encourages deeper reflection
- Use "I" statements to show empathy ("I sense that...", "I understand...")
- Validate feelings before offering insights
- Keep responses to 150-200 words unless tier allows for longer responses
- Remember: You're not just an AI, you're NewMe - their dedicated growth companion`;

    return basePrompt;
  }

  /**
   * Analyze conversation for emotional patterns and insights
   */
  private async analyzeConversation(
    userMessage: string,
    aiResponse: string,
    context: ConversationContext
  ): Promise<ConversationAnalysisResult> {
    try {
      const analysisPrompt = `Analyze this conversation for emotional patterns and growth insights:

User Message: "${userMessage}"
AI Response: "${aiResponse}"

User Profile: ${JSON.stringify(context.userProfile)}

Provide analysis in this JSON format:
{
  "insights": ["insight1", "insight2", "insight3"],
  "emotionalAnalysis": {
    "detectedEmotion": "primary emotion detected",
    "supportLevel": "basic|intermediate|advanced",
    "recommendedActions": ["action1", "action2"]
  }
}`;

      const rawAnalysis = await openaiWrapper.generateCompletion(analysisPrompt, {
        model: 'gpt-4o-mini',
        maxTokens: 600,
        temperature: 0.2,
        responseFormat: 'json_object',
      });

      let parsed: {
        insights?: unknown;
        emotionalAnalysis?: {
          detectedEmotion?: unknown;
          supportLevel?: unknown;
          recommendedActions?: unknown;
        };
      } = {};
      try {
        parsed = JSON.parse(rawAnalysis) as typeof parsed;
      } catch (parseError) {
        logger.warn('Unable to parse OpenAI conversation analysis response', 'NewMeAIService', {
          rawAnalysis,
          parseError,
        });
      }

      const emotionAnalysis = parsed.emotionalAnalysis ?? {};
      const recommendedActions = Array.isArray(emotionAnalysis.recommendedActions)
        ? emotionAnalysis.recommendedActions.map(String)
        : ['Continue sharing your thoughts and feelings'];
      const supportLevel =
        emotionAnalysis.supportLevel === 'intermediate' || emotionAnalysis.supportLevel === 'advanced'
          ? emotionAnalysis.supportLevel
          : 'basic';
      const detectedEmotion =
        typeof emotionAnalysis.detectedEmotion === 'string'
          ? emotionAnalysis.detectedEmotion
          : 'neutral';

      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.map(String) : [],
        emotionalAnalysis: {
          detectedEmotion,
          supportLevel,
          recommendedActions,
        },
      };
    } catch (error) {
      if (error instanceof OpenAIServiceError) {
        logger.warn('OpenAI unavailable for conversation analysis', 'NewMeAIService', {
          message: error.message,
        });
      } else {
        logger.error('Error analyzing conversation', 'NewMeAIService', error);
      }
      return {
        insights: ['Continuing to learn about your unique journey'],
        emotionalAnalysis: {
          detectedEmotion: 'neutral',
          supportLevel: 'basic',
          recommendedActions: ['Continue sharing your thoughts and feelings'],
        }
      };
    }
  }

  /**
   * Update user memory profile based on conversation insights
   */
  private async updateUserMemory(
    context: ConversationContext,
    analysis: ConversationAnalysisResult
  ): Promise<Partial<UserMemoryProfile>> {
    const updates: Partial<UserMemoryProfile> = {
      emotionalStateHistory: [
        ...context.userProfile.emotionalStateHistory.slice(-9), // Keep last 10
        {
          timestamp: new Date().toISOString(),
          emotion: analysis.emotionalAnalysis.detectedEmotion,
          intensity: 5, // Could be calculated from voice analysis
          context: 'chat_conversation',
        }
      ],
      conversationHistory: [
        ...context.userProfile.conversationHistory.slice(-19), // Keep last 20
        {
          timestamp: new Date().toISOString(),
          topic: 'general_conversation',
          insights: analysis.insights,
          breakthroughs: [], // Could be determined by deeper analysis
        }
      ]
    };

    // Save to database
    try {
      await supabase
        .from('user_memory_profiles')
        .upsert({
          user_id: context.userId,
          emotional_state_history: updates.emotionalStateHistory,
          conversation_history: updates.conversationHistory,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      logger.error('Error updating user memory profile', 'NewMeAIService', error);
    }

    return updates;
  }

  /**
   * Get user memory profile from database or cache
   */
  async getUserMemoryProfile(userId: string): Promise<UserMemoryProfile | null> {
    // Check cache first
    if (this.memoryCache.has(userId)) {
      return this.memoryCache.get(userId)!;
    }

    try {
      const { data, error } = await supabase
        .from('user_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default profile for new user
        const defaultProfile: UserMemoryProfile = {
          personalityType: 'exploring',
          balanceWheelScores: {
            relationships: 5,
            career: 5,
            health: 5,
            personal_growth: 5,
            family: 5,
            spirituality: 5,
            finances: 5,
            recreation: 5,
          },
          narrativePatterns: [],
          emotionalStateHistory: [],
          conversationHistory: [],
          culturalContext: {
            language: 'en',
            region: 'global',
            culturalSensitivities: [],
          },
          subscriptionTier: 'discovery',
          currentLevel: 1,
          crystalBalance: 0,
          progressMetrics: {},
        };

        // Save default profile
        await supabase
          .from('user_memory_profiles')
          .insert({
            user_id: userId,
            personality_type: defaultProfile.personalityType,
            balance_wheel_scores: defaultProfile.balanceWheelScores,
            narrative_patterns: defaultProfile.narrativePatterns,
            emotional_state_history: defaultProfile.emotionalStateHistory,
            conversation_history: defaultProfile.conversationHistory,
            cultural_context: defaultProfile.culturalContext,
            subscription_tier: defaultProfile.subscriptionTier,
            current_level: defaultProfile.currentLevel,
            crystal_balance: defaultProfile.crystalBalance,
            progress_metrics: defaultProfile.progressMetrics,
          });

        this.memoryCache.set(userId, defaultProfile);
        return defaultProfile;
      }

      const profile: UserMemoryProfile = {
        personalityType: data.personality_type,
        balanceWheelScores: data.balance_wheel_scores || {},
        narrativePatterns: data.narrative_patterns || [],
        emotionalStateHistory: data.emotional_state_history || [],
        conversationHistory: data.conversation_history || [],
        culturalContext: data.cultural_context || { language: 'en', region: 'global', culturalSensitivities: [] },
        subscriptionTier: data.subscription_tier || 'discovery',
        currentLevel: data.current_level || 1,
        crystalBalance: data.crystal_balance || 0,
        progressMetrics: data.progress_metrics || {},
      };

      this.memoryCache.set(userId, profile);
      return profile;
    } catch (error) {
      logger.error('Error fetching user memory profile', 'NewMeAIService', error);
      return null;
    }
  }

  /**
   * Fallback response when AI service fails
   */
  private getFallbackResponse(context: ConversationContext) {
    const fallbackResponses = [
      "I'm here with you on this journey of self-discovery. Sometimes I need a moment to gather my thoughts, but I'm always listening. What's most important to you right now?",
      "Your story matters, and I'm honored to be part of your growth journey. Can you tell me more about what's on your heart today?",
      "I sense there's something meaningful you want to explore. I'm here to support you - what would help you most in this moment?",
      "Every woman's journey is unique, and yours is no exception. What aspect of your life would you like to focus on today?",
    ];

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const subscriptionTier = context.userProfile.subscriptionTier;
    const tierInsight = subscriptionTier === 'transformation'
      ? 'Take a mindful pause and revisit your transformation commitments when you are ready.'
      : subscriptionTier === 'growth'
        ? 'Consider journaling one insight while I reconnect — your progress is building beautifully.'
        : 'Keep noticing what feels most present right now; your reflections guide our next steps.';

    return {
      response: randomResponse,
      insights: ['Continuing to support your growth journey', tierInsight],
      emotionalAnalysis: {
        detectedEmotion: 'supportive',
        supportLevel: 'basic' as const,
        recommendedActions: ['Continue sharing your thoughts'],
      },
      memoryUpdates: {},
    };
  }

  /**
   * Generate daily affirmations based on user profile
   */
  async generateDailyAffirmation(userProfile: UserMemoryProfile): Promise<string> {
    try {
      const prompt = `Generate a personalized daily affirmation for a woman with this profile:
- Personality: ${userProfile.personalityType}
- Cultural Context: ${userProfile.culturalContext.region}
- Current Focus Areas: ${Object.entries(userProfile.balanceWheelScores)
  .filter(([, score]) => score < 7)
  .map(([area]) => area)
  .join(', ')}
- Recent Emotional Patterns: ${userProfile.emotionalStateHistory.slice(-3).map(e => e.emotion).join(', ')}

Create an empowering, culturally sensitive affirmation that speaks to her current journey. Keep it under 50 words.`;

      const affirmation = await openaiWrapper.generateCompletion(prompt, {
        model: 'gpt-4o-mini',
        maxTokens: 120,
        temperature: 0.8,
      });

      return affirmation.trim() || "You are worthy of love, growth, and all the beautiful possibilities that await you today.";
    } catch (error) {
      if (error instanceof OpenAIServiceError) {
        logger.warn('OpenAI unavailable for daily affirmation generation', 'NewMeAIService', {
          message: error.message,
        });
      } else {
        logger.error('Error generating daily affirmation', 'NewMeAIService', error);
      }
      return "You are worthy of love, growth, and all the beautiful possibilities that await you today.";
    }
  }

  /**
   * Clear memory cache for user (useful for testing or when profile is updated)
   */
  clearUserCache(userId: string) {
    this.memoryCache.delete(userId);
  }
}

export const newMeAI = new NewMeAIService();