/**
 * Shadow Work Engine for Newomen Platform
 * Implements structured psychological exploration with cultural sensitivity
 */

import { supabase } from '@/integrations/supabase/client';
import { adaptiveOpenAIService } from '../adaptive-openai.service';
import { chatPersistenceService } from '../chat-persistence.service';

export interface ShadowWorkQuestion {
  id: number;
  question: string;
  arabicQuestion?: string;
  category: 'identity' | 'emotion' | 'belief' | 'boundary' | 'authenticity' | 'relationship' | 'fear' | 'desire';
  depth: 'surface' | 'middle' | 'deep' | 'core';
  followUpPrompts?: string[];
}

export interface ShadowWorkSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  responses: ShadowWorkResponse[];
  analysis?: ShadowWorkAnalysis;
  integrationPlan?: IntegrationPlan;
  language: 'en' | 'ar';
  culturalContext: string;
}

export interface ShadowWorkResponse {
  questionId: number;
  question: string;
  response: string;
  emotionalTone?: string;
  keyThemes?: string[];
  timestamp: string;
}

export interface ShadowWorkAnalysis {
  coreShadowPatterns: string[];
  hiddenStrengths: string[];
  emotionalBlocks: string[];
  culturalInfluences: string[];
  transformationPotential: number;
  primaryArchetype: string;
  secondaryArchetype: string;
}

export interface IntegrationPlan {
  immediateActions: ActionStep[];
  weeklyPractices: Practice[];
  monthlyMilestones: Milestone[];
  affirmations: Affirmation[];
  journalPrompts: string[];
}

export interface ActionStep {
  title: string;
  description: string;
  arabicDescription?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  category: string;
}

export interface Practice {
  name: string;
  frequency: string;
  duration: string;
  description: string;
  culturalAdaptation?: string;
}

export interface Milestone {
  week: number;
  goal: string;
  metrics: string[];
  celebration: string;
}

export interface Affirmation {
  text: string;
  arabicText?: string;
  context: 'morning' | 'evening' | 'challenge' | 'victory';
  emotionalTarget: string;
}

class ShadowWorkService {
  private readonly SHADOW_WORK_QUESTIONS: ShadowWorkQuestion[] = [
    {
      id: 1,
      question: "What roles do you most often play in front of others?",
      arabicQuestion: "ما هي الأدوار التي تلعبينها أمام الآخرين؟",
      category: 'identity',
      depth: 'surface',
      followUpPrompts: [
        "Which role feels most exhausting?",
        "When did you first adopt this role?",
        "What would happen if you stopped?"
      ]
    },
    {
      id: 2,
      question: "Which emotions do you feel ashamed to show?",
      arabicQuestion: "ما هي المشاعر التي تخجلين من إظهارها؟",
      category: 'emotion',
      depth: 'middle',
      followUpPrompts: [
        "Who taught you these emotions were wrong?",
        "What do you fear would happen if you expressed them?",
        "When was the last time you felt safe to feel?"
      ]
    },
    {
      id: 3,
      question: "What beliefs echo in your mind during hard moments?",
      arabicQuestion: "ما هي المعتقدات التي تتردد في ذهنك في الأوقات الصعبة؟",
      category: 'belief',
      depth: 'deep',
      followUpPrompts: [
        "Whose voice do you hear saying these words?",
        "How old were you when you first believed this?",
        "What evidence contradicts this belief?"
      ]
    },
    {
      id: 4,
      question: "What do you tolerate that hurts you?",
      arabicQuestion: "ما الذي تتحملينه رغم أنه يؤذيك؟",
      category: 'boundary',
      depth: 'deep',
      followUpPrompts: [
        "What makes you believe you deserve this?",
        "Who benefits from your tolerance?",
        "What boundary would honor your worth?"
      ]
    },
    {
      id: 5,
      question: "Describe your most free, authentic self",
      arabicQuestion: "صفي نفسك الأكثر حرية وأصالة",
      category: 'authenticity',
      depth: 'core',
      followUpPrompts: [
        "What would she do differently?",
        "What would she no longer accept?",
        "How would she love and be loved?"
      ]
    },
    {
      id: 6,
      question: "What parts of yourself do you hide in relationships?",
      arabicQuestion: "ما هي أجزاء نفسك التي تخفينها في العلاقات؟",
      category: 'relationship',
      depth: 'deep',
      followUpPrompts: [
        "What are you afraid they'll discover?",
        "When did hiding become safer than showing?",
        "What would real intimacy require from you?"
      ]
    },
    {
      id: 7,
      question: "What success or joy do you fear claiming?",
      arabicQuestion: "ما هو النجاح أو الفرح الذي تخافين من المطالبة به؟",
      category: 'fear',
      depth: 'middle',
      followUpPrompts: [
        "Who might be threatened by your joy?",
        "What permission are you waiting for?",
        "How is staying small serving you?"
      ]
    },
    {
      id: 8,
      question: "What desires do you judge yourself for having?",
      arabicQuestion: "ما هي الرغبات التي تحكمين على نفسك لامتلاكها؟",
      category: 'desire',
      depth: 'deep',
      followUpPrompts: [
        "What makes these desires 'wrong'?",
        "Who would you be if you honored them?",
        "What is the desire beneath the desire?"
      ]
    },
    {
      id: 9,
      question: "What would you need to forgive to be free?",
      arabicQuestion: "ما الذي تحتاجين لمسامحته لتكوني حرة؟",
      category: 'emotion',
      depth: 'core',
      followUpPrompts: [
        "What does holding this serve?",
        "What would forgiveness mean for your story?",
        "Who would you become without this weight?"
      ]
    },
    {
      id: 10,
      question: "If you could speak to your shadow, what would she tell you?",
      arabicQuestion: "لو استطعت التحدث إلى ظلك، ماذا ستقول لك؟",
      category: 'authenticity',
      depth: 'core',
      followUpPrompts: [
        "What gifts does she hold for you?",
        "What has she been protecting you from?",
        "How can you integrate her wisdom?"
      ]
    }
  ];

  private currentSession: ShadowWorkSession | null = null;

  /**
   * Start a new shadow work session
   */
  async startSession(language: 'en' | 'ar' = 'en', culturalContext: string = 'universal'): Promise<ShadowWorkSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const session: ShadowWorkSession = {
      id: crypto.randomUUID(),
      userId: user.id,
      startedAt: new Date().toISOString(),
      responses: [],
      language,
      culturalContext
    };

    // Save to database
    const { error } = await supabase
      .from('shadow_work_sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        started_at: session.startedAt,
        language: session.language,
        cultural_context: session.culturalContext,
        status: 'in_progress'
      });

    if (error) throw error;

    this.currentSession = session;
    return session;
  }

  /**
   * Get the next question in the sequence
   */
  getNextQuestion(): ShadowWorkQuestion | null {
    if (!this.currentSession) return null;

    const answeredIds = this.currentSession.responses.map(r => r.questionId);
    const nextQuestion = this.SHADOW_WORK_QUESTIONS.find(q => !answeredIds.includes(q.id));

    return nextQuestion || null;
  }

  /**
   * Submit a response to a shadow work question
   */
  async submitResponse(
    questionId: number,
    response: string
  ): Promise<{ 
    saved: boolean; 
    isComplete: boolean; 
    followUp?: string;
    culturalInsight?: string;
  }> {
    if (!this.currentSession) throw new Error('No active session');

    const question = this.SHADOW_WORK_QUESTIONS.find(q => q.id === questionId);
    if (!question) throw new Error('Invalid question ID');

    // Analyze emotional tone and themes
    const analysis = await this.analyzeResponse(response, question);

    // Create response object
    const shadowResponse: ShadowWorkResponse = {
      questionId,
      question: this.currentSession.language === 'ar' && question.arabicQuestion 
        ? question.arabicQuestion 
        : question.question,
      response,
      emotionalTone: analysis.emotionalTone,
      keyThemes: analysis.themes,
      timestamp: new Date().toISOString()
    };

    // Add to session
    this.currentSession.responses.push(shadowResponse);

    // Save to database
    const { error } = await supabase
      .from('shadow_work_responses')
      .insert({
        session_id: this.currentSession.id,
        question_id: questionId,
        response,
        emotional_tone: analysis.emotionalTone,
        key_themes: analysis.themes,
        created_at: shadowResponse.timestamp
      });

    if (error) throw error;

    // Check if complete
    const isComplete = this.currentSession.responses.length === this.SHADOW_WORK_QUESTIONS.length;

    // Generate follow-up or cultural insight
    let followUp: string | undefined;
    let culturalInsight: string | undefined;

    if (!isComplete && question.followUpPrompts && question.followUpPrompts.length > 0) {
      followUp = await this.generateContextualFollowUp(response, question);
    }

    if (this.currentSession.culturalContext !== 'universal') {
      culturalInsight = await this.generateCulturalInsight(response, question, this.currentSession.culturalContext);
    }

    // If complete, generate analysis
    if (isComplete) {
      await this.completeSession();
    }

    return { 
      saved: true, 
      isComplete,
      followUp,
      culturalInsight
    };
  }

  /**
   * Analyze a response for emotional tone and themes
   */
  private async analyzeResponse(
    response: string, 
    question: ShadowWorkQuestion
  ): Promise<{ emotionalTone: string; themes: string[] }> {
    try {
      const analysisPrompt = `
        Analyze this shadow work response for emotional tone and key themes.
        Question category: ${question.category}
        Question depth: ${question.depth}
        Response: "${response}"
        
        Return a JSON object with:
        - emotionalTone: primary emotion (e.g., "sadness", "anger", "fear", "shame", "hope")
        - themes: array of 2-3 key psychological themes
        
        Be specific and psychologically insightful.
      `;

      const result = await adaptiveOpenAIService.createChatCompletion([
        { role: 'system', content: 'You are an expert psychological analyst specializing in shadow work and depth psychology.' },
        { role: 'user', content: analysisPrompt }
      ], {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 200
      });

      const analysis = JSON.parse(result.choices[0].message.content);
      return {
        emotionalTone: analysis.emotionalTone || 'neutral',
        themes: analysis.themes || []
      };
    } catch (error) {
      console.error('Failed to analyze response:', error);
      return { emotionalTone: 'neutral', themes: [] };
    }
  }

  /**
   * Generate contextual follow-up question
   */
  private async generateContextualFollowUp(
    response: string,
    question: ShadowWorkQuestion
  ): Promise<string> {
    try {
      const prompt = `
        Based on this shadow work response, generate a gentle, probing follow-up question.
        Original question: "${question.question}"
        Response: "${response}"
        Available follow-ups: ${question.followUpPrompts?.join(', ')}
        
        Create a follow-up that:
        1. Acknowledges what was shared
        2. Gently probes deeper
        3. Maintains psychological safety
        4. Is culturally sensitive
        
        Return only the follow-up question.
      `;

      const result = await adaptiveOpenAIService.createChatCompletion([
        { role: 'system', content: 'You are a compassionate shadow work facilitator.' },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 100
      });

      return result.choices[0].message.content.trim();
    } catch (error) {
      return question.followUpPrompts?.[0] || "Tell me more about that feeling.";
    }
  }

  /**
   * Generate cultural insight
   */
  private async generateCulturalInsight(
    response: string,
    question: ShadowWorkQuestion,
    culturalContext: string
  ): Promise<string> {
    try {
      const prompt = `
        Provide a brief cultural insight for this shadow work response.
        Cultural context: ${culturalContext}
        Question theme: ${question.category}
        
        The insight should:
        1. Acknowledge cultural influences on the pattern
        2. Validate the experience within cultural context
        3. Suggest culturally-appropriate healing
        4. Use appropriate cultural expressions if relevant
        
        Keep it to 1-2 sentences, warm and validating.
      `;

      const result = await adaptiveOpenAIService.createChatCompletion([
        { role: 'system', content: 'You are a culturally-aware psychological guide.' },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 100
      });

      return result.choices[0].message.content.trim();
    } catch (error) {
      return "";
    }
  }

  /**
   * Complete the session and generate analysis
   */
  async completeSession(): Promise<ShadowWorkAnalysis> {
    if (!this.currentSession) throw new Error('No active session');
    if (this.currentSession.responses.length < this.SHADOW_WORK_QUESTIONS.length) {
      throw new Error('Session not complete');
    }

    // Generate comprehensive analysis
    const analysis = await this.generateComprehensiveAnalysis();
    const integrationPlan = await this.generateIntegrationPlan(analysis);

    // Update session
    this.currentSession.completedAt = new Date().toISOString();
    this.currentSession.analysis = analysis;
    this.currentSession.integrationPlan = integrationPlan;

    // Save to database
    await supabase
      .from('shadow_work_sessions')
      .update({
        completed_at: this.currentSession.completedAt,
        analysis: analysis,
        integration_plan: integrationPlan,
        status: 'completed'
      })
      .eq('id', this.currentSession.id);

    // Create chat session for ongoing support
    await chatPersistenceService.createSession(`Shadow Work - ${new Date().toLocaleDateString()}`);

    return analysis;
  }

  /**
   * Generate comprehensive shadow work analysis
   */
  private async generateComprehensiveAnalysis(): Promise<ShadowWorkAnalysis> {
    if (!this.currentSession) throw new Error('No active session');

    const responsesText = this.currentSession.responses
      .map(r => `Q: ${r.question}\nA: ${r.response}\nTone: ${r.emotionalTone}`)
      .join('\n\n');

    const prompt = `
      Analyze this complete shadow work session and provide deep psychological insights.
      
      Session responses:
      ${responsesText}
      
      Cultural context: ${this.currentSession.culturalContext}
      
      Provide a comprehensive analysis with:
      1. coreShadowPatterns: 3-4 main shadow patterns identified
      2. hiddenStrengths: 3-4 strengths found within the shadow
      3. emotionalBlocks: 2-3 primary emotional blocks
      4. culturalInfluences: 2-3 cultural factors affecting patterns
      5. transformationPotential: score 1-10
      6. primaryArchetype: main Jungian archetype present
      7. secondaryArchetype: supporting archetype
      
      Be profound, compassionate, and actionable.
      Return as JSON.
    `;

    try {
      const result = await adaptiveOpenAIService.createChatCompletion([
        { 
          role: 'system', 
          content: 'You are an expert Jungian analyst specializing in shadow work, depth psychology, and feminine psychology. Provide profound insights that lead to transformation.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      // Return default analysis
      return {
        coreShadowPatterns: ['Self-suppression', 'Fear of authenticity', 'Boundary confusion'],
        hiddenStrengths: ['Deep intuition', 'Emotional intelligence', 'Resilience'],
        emotionalBlocks: ['Unexpressed anger', 'Buried grief'],
        culturalInfluences: ['Collective expectations', 'Gender roles'],
        transformationPotential: 8,
        primaryArchetype: 'The Wounded Healer',
        secondaryArchetype: 'The Wild Woman'
      };
    }
  }

  /**
   * Generate personalized integration plan
   */
  private async generateIntegrationPlan(analysis: ShadowWorkAnalysis): Promise<IntegrationPlan> {
    const prompt = `
      Create a personalized integration plan based on this shadow work analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Cultural context: ${this.currentSession?.culturalContext}
      Language preference: ${this.currentSession?.language}
      
      Generate:
      1. 3 immediate action steps (easy to start today)
      2. 3 weekly practices for ongoing integration
      3. 4 monthly milestones for transformation
      4. 5 affirmations targeting specific shadows
      5. 3 journal prompts for deeper exploration
      
      Make it practical, culturally sensitive, and transformative.
      Include Arabic translations where appropriate.
      Return as JSON matching the IntegrationPlan interface.
    `;

    try {
      const result = await adaptiveOpenAIService.createChatCompletion([
        { 
          role: 'system', 
          content: 'You are a transformation coach specializing in shadow integration and feminine empowerment.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o',
        temperature: 0.8,
        max_tokens: 1500
      });

      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      // Return default plan
      return this.getDefaultIntegrationPlan();
    }
  }

  /**
   * Get default integration plan
   */
  private getDefaultIntegrationPlan(): IntegrationPlan {
    return {
      immediateActions: [
        {
          title: "Morning Mirror Work",
          description: "Spend 5 minutes looking into your eyes with compassion",
          arabicDescription: "اقضي 5 دقائق تنظرين في عينيك بحنان",
          difficulty: 'easy',
          estimatedTime: '5 minutes',
          category: 'self-love'
        },
        {
          title: "Boundary Practice",
          description: "Say 'no' to one small request today",
          difficulty: 'medium',
          estimatedTime: '1 minute',
          category: 'boundaries'
        },
        {
          title: "Shadow Dialogue",
          description: "Write a letter to your shadow self",
          difficulty: 'easy',
          estimatedTime: '15 minutes',
          category: 'integration'
        }
      ],
      weeklyPractices: [
        {
          name: "Sacred Rage Release",
          frequency: "Twice weekly",
          duration: "20 minutes",
          description: "Safe expression of suppressed anger through movement",
          culturalAdaptation: "Private space, use music or nature sounds"
        },
        {
          name: "Authentic Expression Circle",
          frequency: "Weekly",
          duration: "30 minutes",
          description: "Practice speaking your truth with trusted friend or mirror"
        },
        {
          name: "Shadow Integration Meditation",
          frequency: "Daily",
          duration: "10 minutes",
          description: "Guided meditation to embrace all parts of yourself"
        }
      ],
      monthlyMilestones: [
        {
          week: 1,
          goal: "Identify and honor one suppressed emotion daily",
          metrics: ["Emotional awareness", "Expression comfort"],
          celebration: "Gift yourself something beautiful"
        },
        {
          week: 2,
          goal: "Set and maintain three clear boundaries",
          metrics: ["Boundaries set", "Boundaries held"],
          celebration: "Celebrate with self-care ritual"
        },
        {
          week: 3,
          goal: "Express authentic self in one relationship",
          metrics: ["Authentic moments", "Vulnerability practiced"],
          celebration: "Journal your courage"
        },
        {
          week: 4,
          goal: "Integrate one shadow aspect fully",
          metrics: ["Shadow acknowledged", "Shadow expressed", "Shadow integrated"],
          celebration: "Create art representing your wholeness"
        }
      ],
      affirmations: [
        {
          text: "I am whole and complete, shadow and light",
          arabicText: "أنا كاملة، ظل ونور",
          context: 'morning',
          emotionalTarget: 'self-acceptance'
        },
        {
          text: "My anger is sacred and valid",
          arabicText: "غضبي مقدس وصحيح",
          context: 'challenge',
          emotionalTarget: 'anger-validation'
        },
        {
          text: "I trust my intuition and inner knowing",
          arabicText: "أثق بحدسي ومعرفتي الداخلية",
          context: 'evening',
          emotionalTarget: 'intuition'
        },
        {
          text: "I deserve to take up space",
          arabicText: "أستحق أن آخذ مساحتي",
          context: 'morning',
          emotionalTarget: 'self-worth'
        },
        {
          text: "My authenticity is my power",
          arabicText: "أصالتي هي قوتي",
          context: 'victory',
          emotionalTarget: 'authenticity'
        }
      ],
      journalPrompts: [
        "What would change if I fully owned my power?",
        "Where in my body do I feel my suppressed emotions?",
        "What gifts are hidden in my shadow?"
      ]
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ShadowWorkSession | null> {
    const { data, error } = await supabase
      .from('shadow_work_sessions')
      .select(`
        *,
        shadow_work_responses(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      responses: data.shadow_work_responses || [],
      analysis: data.analysis,
      integrationPlan: data.integration_plan,
      language: data.language,
      culturalContext: data.cultural_context
    };
  }

  /**
   * Get all sessions for current user
   */
  async getUserSessions(): Promise<ShadowWorkSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('shadow_work_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error || !data) return [];

    return data;
  }

  /**
   * Resume an incomplete session
   */
  async resumeSession(sessionId: string): Promise<ShadowWorkSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.completedAt) throw new Error('Session already completed');

    this.currentSession = session;
    return session;
  }

  /**
   * Get progress for current session
   */
  getSessionProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentSession) {
      return { current: 0, total: 10, percentage: 0 };
    }

    const current = this.currentSession.responses.length;
    const total = this.SHADOW_WORK_QUESTIONS.length;
    const percentage = Math.round((current / total) * 100);

    return { current, total, percentage };
  }
}

// Export singleton instance
export const shadowWorkService = new ShadowWorkService();