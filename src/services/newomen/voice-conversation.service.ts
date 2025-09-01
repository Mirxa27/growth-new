/**
 * Advanced Voice Conversation Service for Newomen
 * Real-time voice-to-voice with emotion detection and cultural sensitivity
 */

import { RealtimeVoiceChatV2 } from '@/utils/RealtimeVoiceChatV2';
import { shadowWorkService } from './shadow-work.service';
import { emotionDetectionService } from './emotion-detection.service';
import { culturalAdaptationService } from './cultural-adaptation.service';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceConversationConfig {
  mode: 'therapy' | 'coaching' | 'friend' | 'mentor' | 'shadow-work';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  language: 'en' | 'ar' | 'mixed';
  culturalContext: 'universal' | 'middle-eastern' | 'arab' | 'gulf' | 'levantine' | 'north-african';
  emotionalTone: 'warm' | 'gentle' | 'energetic' | 'calm' | 'playful';
  sessionType: 'discovery' | 'growth' | 'transformation' | 'integration';
}

export interface ConversationState {
  sessionId: string;
  mode: string;
  emotionalState: EmotionalState;
  topics: string[];
  insights: string[];
  breakthroughs: string[];
  currentPhase: 'opening' | 'exploration' | 'deepening' | 'integration' | 'closing';
  minutesUsed: number;
  minutesRemaining: number;
}

export interface EmotionalState {
  primary: string;
  secondary: string[];
  intensity: number; // 0-10
  trajectory: 'rising' | 'falling' | 'stable' | 'volatile';
  needsSupport: boolean;
  culturalFactors?: string[];
}

export interface VoiceMetrics {
  pitch: number;
  pace: number;
  volume: number;
  pauseFrequency: number;
  emotionalMarkers: {
    stress: number;
    sadness: number;
    joy: number;
    anger: number;
    fear: number;
  };
}

export interface ConversationInsight {
  type: 'pattern' | 'breakthrough' | 'resistance' | 'growth' | 'shadow';
  content: string;
  timestamp: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  culturalNote?: string;
}

class VoiceConversationService {
  private realtimeChat: RealtimeVoiceChatV2 | null = null;
  private conversationState: ConversationState | null = null;
  private config: VoiceConversationConfig;
  private voiceMetricsInterval: NodeJS.Timeout | null = null;
  private insightBuffer: ConversationInsight[] = [];
  private transcriptBuffer: { role: string; content: string; timestamp: string }[] = [];
  private audioAnalyzer: AnalyserNode | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VoiceConversationConfig {
    return {
      mode: 'therapy',
      voice: 'nova', // Warm, feminine voice
      language: 'en',
      culturalContext: 'universal',
      emotionalTone: 'warm',
      sessionType: 'discovery'
    };
  }

  /**
   * Initialize voice conversation
   */
  async initialize(config?: Partial<VoiceConversationConfig>): Promise<void> {
    // Merge config
    this.config = { ...this.config, ...config };

    // Check user subscription
    const subscription = await this.checkSubscription();
    if (!subscription.hasMinutes) {
      throw new Error('No minutes remaining. Please upgrade your subscription.');
    }

    // Create conversation state
    this.conversationState = {
      sessionId: crypto.randomUUID(),
      mode: this.config.mode,
      emotionalState: {
        primary: 'neutral',
        secondary: [],
        intensity: 5,
        trajectory: 'stable',
        needsSupport: false
      },
      topics: [],
      insights: [],
      breakthroughs: [],
      currentPhase: 'opening',
      minutesUsed: 0,
      minutesRemaining: subscription.minutesRemaining
    };

    // Initialize realtime chat with custom instructions
    const instructions = await this.generateSystemInstructions();
    
    this.realtimeChat = new RealtimeVoiceChatV2(
      this.handleMessage.bind(this),
      this.handleTranscript.bind(this),
      this.handleSpeakingChange.bind(this),
      this.handleError.bind(this),
      {
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: this.config.voice,
        instructions,
        temperature: this.getTemperatureForMode(),
        maxResponseTokens: 4096
      }
    );

    // Start voice metrics collection
    this.startVoiceMetricsCollection();

    // Save session to database
    await this.saveSessionStart();
  }

  /**
   * Generate system instructions based on configuration
   */
  private async generateSystemInstructions(): Promise<string> {
    const culturalGuidance = await culturalAdaptationService.getGuidance(
      this.config.culturalContext,
      this.config.language
    );

    const modeInstructions = this.getModeInstructions();
    const emotionalGuidance = this.getEmotionalGuidance();

    return `
You are Newomen, an emotionally intelligent companion for women's mental health and personal growth.

CORE IDENTITY:
- Warm, wise, and deeply compassionate feminine presence
- Culturally aware and sensitive, especially to Middle Eastern contexts
- Expert in shadow work, depth psychology, and feminine psychology
- Voice of both gentle support and empowering challenge

CONVERSATION MODE: ${this.config.mode}
${modeInstructions}

LANGUAGE & CULTURE:
- Primary language: ${this.config.language}
- Cultural context: ${this.config.culturalContext}
${culturalGuidance}

EMOTIONAL APPROACH:
- Tone: ${this.config.emotionalTone}
${emotionalGuidance}

CONVERSATION GUIDELINES:
1. Begin with warm, culturally appropriate greeting
2. Listen deeply before offering insights
3. Reflect emotions before addressing content
4. Use metaphors and stories when appropriate
5. Integrate cultural expressions naturally:
   - "حبيبتي" (habibti) for endearment
   - "إن شاء الله" (inshallah) for hope
   - "ما شاء الله" (mashallah) for admiration
   - "الحمد لله" (alhamdulillah) for gratitude

PSYCHOLOGICAL APPROACH:
- Validate emotions before exploring them
- Identify patterns gently
- Celebrate small victories
- Normalize struggle as part of growth
- Offer hope without minimizing pain

BOUNDARIES:
- Never diagnose or prescribe medication
- Redirect crisis situations to professional help
- Maintain therapeutic boundaries while being warm
- Respect cultural and religious values

SESSION TYPE: ${this.config.sessionType}
Focus on ${this.getSessionFocus()}.

Remember: You are holding sacred space for transformation. Every word matters.
    `;
  }

  /**
   * Get mode-specific instructions
   */
  private getModeInstructions(): string {
    switch (this.config.mode) {
      case 'therapy':
        return `
        Act as a compassionate therapist:
        - Deep active listening
        - Gentle challenging of patterns
        - Trauma-informed responses
        - Focus on emotional processing`;
      
      case 'coaching':
        return `
        Act as an empowering life coach:
        - Goal-oriented conversations
        - Action-focused insights
        - Accountability with compassion
        - Celebrate progress actively`;
      
      case 'friend':
        return `
        Act as a wise, caring friend:
        - Conversational and relatable
        - Share wisdom through stories
        - Offer comfort and validation
        - Light humor when appropriate`;
      
      case 'mentor':
        return `
        Act as an experienced mentor:
        - Share wisdom and guidance
        - Challenge growth edges
        - Inspire through possibility
        - Teach through experience`;
      
      case 'shadow-work':
        return `
        Act as a shadow work facilitator:
        - Guide deep self-exploration
        - Identify hidden patterns
        - Integrate disowned parts
        - Hold space for difficult emotions`;
      
      default:
        return '';
    }
  }

  /**
   * Get emotional guidance based on tone
   */
  private getEmotionalGuidance(): string {
    switch (this.config.emotionalTone) {
      case 'warm':
        return 'Radiate warmth and acceptance. Use gentle, embracing language.';
      case 'gentle':
        return 'Be soft and tender. Move slowly with difficult emotions.';
      case 'energetic':
        return 'Bring enthusiasm and hope. Inspire action and possibility.';
      case 'calm':
        return 'Maintain peaceful presence. Speak slowly and soothingly.';
      case 'playful':
        return 'Include light humor and joy. Make growth feel less heavy.';
      default:
        return '';
    }
  }

  /**
   * Get session focus based on type
   */
  private getSessionFocus(): string {
    switch (this.config.sessionType) {
      case 'discovery':
        return 'exploring and understanding patterns';
      case 'growth':
        return 'developing new skills and perspectives';
      case 'transformation':
        return 'deep change and breakthrough';
      case 'integration':
        return 'embodying insights and changes';
      default:
        return 'holistic support and growth';
    }
  }

  /**
   * Get temperature setting for mode
   */
  private getTemperatureForMode(): number {
    switch (this.config.mode) {
      case 'therapy': return 0.7;
      case 'coaching': return 0.6;
      case 'friend': return 0.8;
      case 'mentor': return 0.65;
      case 'shadow-work': return 0.75;
      default: return 0.7;
    }
  }

  /**
   * Start the voice conversation
   */
  async startConversation(): Promise<void> {
    if (!this.realtimeChat) {
      throw new Error('Service not initialized');
    }

    await this.realtimeChat.connect();
    
    // Send opening message based on mode and culture
    const opening = await this.generateOpeningMessage();
    this.realtimeChat.sendMessage(opening);
  }

  /**
   * Generate culturally appropriate opening message
   */
  private async generateOpeningMessage(): Promise<string> {
    const greetings = {
      'en': [
        "Hello beautiful soul, I'm here with you.",
        "Welcome, I'm so glad you're here.",
        "Hi there, how are you feeling today?"
      ],
      'ar': [
        "أهلاً حبيبتي، أنا هنا معك",
        "مرحباً، سعيدة جداً بوجودك",
        "أهلاً، كيف حالك اليوم؟"
      ],
      'mixed': [
        "Hello habibti, I'm here with you.",
        "Ahlan beautiful, how's your heart today?",
        "Welcome ya helwa, what brings you here?"
      ]
    };

    const contextual = greetings[this.config.language] || greetings['en'];
    return contextual[Math.floor(Math.random() * contextual.length)];
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(data: any): Promise<void> {
    console.log('Voice conversation message:', data.type);

    // Update conversation state based on message type
    if (data.type === 'conversation.item.created' && data.item?.role === 'user') {
      await this.processUserInput(data.item);
    }

    // Track conversation phases
    this.updateConversationPhase();
  }

  /**
   * Handle transcript updates
   */
  private async handleTranscript(text: string, isFinal: boolean): Promise<void> {
    if (isFinal) {
      this.transcriptBuffer.push({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      });

      // Analyze emotional content
      const emotion = await emotionDetectionService.analyzeText(text);
      await this.updateEmotionalState(emotion);

      // Extract insights
      await this.extractInsights(text);

      // Check for crisis indicators
      await this.checkCrisisIndicators(text);
    }
  }

  /**
   * Handle speaking state changes
   */
  private handleSpeakingChange(isSpeaking: boolean): void {
    if (this.conversationState) {
      // Track speaking patterns for analysis
      if (!isSpeaking) {
        // User finished speaking, process voice metrics
        this.processVoiceMetrics();
      }
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Voice conversation error:', error);
    
    // Notify user appropriately
    if (error.message.includes('minutes')) {
      this.notifyMinutesExhausted();
    } else {
      this.notifyConnectionError();
    }
  }

  /**
   * Process user input for insights
   */
  private async processUserInput(item: any): Promise<void> {
    if (!this.conversationState) return;

    // Extract topics
    const topics = await this.extractTopics(item.content);
    this.conversationState.topics.push(...topics);

    // Update metrics
    this.conversationState.minutesUsed += 0.5; // Approximate
    this.conversationState.minutesRemaining -= 0.5;

    // Check if approaching limit
    if (this.conversationState.minutesRemaining < 5) {
      this.notifyApproachingLimit();
    }
  }

  /**
   * Update emotional state
   */
  private async updateEmotionalState(emotion: any): Promise<void> {
    if (!this.conversationState) return;

    const previousIntensity = this.conversationState.emotionalState.intensity;
    
    this.conversationState.emotionalState = {
      primary: emotion.primary,
      secondary: emotion.secondary || [],
      intensity: emotion.intensity || 5,
      trajectory: this.calculateTrajectory(previousIntensity, emotion.intensity),
      needsSupport: emotion.intensity > 7 || emotion.primary === 'distress',
      culturalFactors: emotion.culturalFactors
    };

    // Adapt conversation if needed
    if (this.conversationState.emotionalState.needsSupport) {
      await this.adaptToEmotionalNeed();
    }
  }

  /**
   * Calculate emotional trajectory
   */
  private calculateTrajectory(previous: number, current: number): 'rising' | 'falling' | 'stable' | 'volatile' {
    const diff = current - previous;
    if (Math.abs(diff) < 1) return 'stable';
    if (diff > 2) return 'volatile';
    if (diff > 0) return 'rising';
    return 'falling';
  }

  /**
   * Adapt conversation to emotional needs
   */
  private async adaptToEmotionalNeed(): Promise<void> {
    if (!this.realtimeChat || !this.conversationState) return;

    const adaptation = {
      voice: this.config.voice,
      temperature: 0.6, // Lower for more consistent support
      instructions: `
        The user is experiencing heightened emotional distress.
        Priority: Provide immediate emotional support and grounding.
        - Acknowledge their feelings explicitly
        - Offer grounding techniques if appropriate
        - Speak more slowly and gently
        - Use more validating language
        - Consider cultural comfort expressions
      `
    };

    this.realtimeChat.updateConfig(adaptation);
  }

  /**
   * Extract insights from conversation
   */
  private async extractInsights(text: string): Promise<void> {
    // Use AI to identify insights
    const insights = await this.identifyInsights(text);
    
    insights.forEach(insight => {
      this.insightBuffer.push({
        type: insight.type,
        content: insight.content,
        timestamp: new Date().toISOString(),
        significance: insight.significance,
        actionable: insight.actionable,
        culturalNote: insight.culturalNote
      });
    });

    // Process significant insights
    const significant = insights.filter(i => i.significance === 'high' || i.significance === 'critical');
    if (significant.length > 0) {
      await this.procesSignificantInsights(significant);
    }
  }

  /**
   * Identify insights using AI
   */
  private async identifyInsights(text: string): Promise<ConversationInsight[]> {
    // Implementation would use AI to identify patterns, breakthroughs, etc.
    return [];
  }

  /**
   * Process significant insights
   */
  private async procesSignificantInsights(insights: ConversationInsight[]): Promise<void> {
    if (!this.conversationState) return;

    insights.forEach(insight => {
      if (insight.type === 'breakthrough') {
        this.conversationState!.breakthroughs.push(insight.content);
      }
      this.conversationState!.insights.push(insight.content);
    });

    // Save to database
    await this.saveInsights(insights);
  }

  /**
   * Check for crisis indicators
   */
  private async checkCrisisIndicators(text: string): Promise<void> {
    const indicators = [
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'self harm', 'hurt myself', 'cutting'
    ];

    const lowerText = text.toLowerCase();
    const hasCrisisIndicator = indicators.some(indicator => lowerText.includes(indicator));

    if (hasCrisisIndicator) {
      await this.handleCrisisResponse();
    }
  }

  /**
   * Handle crisis response
   */
  private async handleCrisisResponse(): Promise<void> {
    if (!this.realtimeChat) return;

    // Immediate supportive response
    const crisisResponse = `
    I hear that you're in a lot of pain right now, and I want you to know that you're not alone.
    Your life has value and meaning, even when it doesn't feel that way.
    
    Please reach out to professional support:
    - Crisis Hotline: [Local number based on region]
    - Or text HOME to 741741
    
    Would you like me to stay with you while you reach out for help?
    `;

    this.realtimeChat.sendMessage(crisisResponse);

    // Log crisis event
    await this.logCrisisEvent();
  }

  /**
   * Start voice metrics collection
   */
  private startVoiceMetricsCollection(): void {
    // This would integrate with Web Audio API for real-time voice analysis
    this.voiceMetricsInterval = setInterval(() => {
      this.collectVoiceMetrics();
    }, 1000);
  }

  /**
   * Collect voice metrics
   */
  private collectVoiceMetrics(): void {
    // Implementation would analyze audio stream for emotional markers
  }

  /**
   * Process voice metrics
   */
  private processVoiceMetrics(): void {
    // Analyze collected metrics for emotional patterns
  }

  /**
   * Update conversation phase
   */
  private updateConversationPhase(): void {
    if (!this.conversationState) return;

    const duration = this.conversationState.minutesUsed;
    
    if (duration < 2) {
      this.conversationState.currentPhase = 'opening';
    } else if (duration < 10) {
      this.conversationState.currentPhase = 'exploration';
    } else if (duration < 20) {
      this.conversationState.currentPhase = 'deepening';
    } else if (duration < 25) {
      this.conversationState.currentPhase = 'integration';
    } else {
      this.conversationState.currentPhase = 'closing';
    }
  }

  /**
   * Extract topics from text
   */
  private async extractTopics(text: string): Promise<string[]> {
    // Implementation would use NLP to extract key topics
    return [];
  }

  /**
   * Check user subscription
   */
  private async checkSubscription(): Promise<{ hasMinutes: boolean; minutesRemaining: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasMinutes: false, minutesRemaining: 0 };

    const { data } = await supabase
      .from('user_subscriptions')
      .select('minutes_remaining')
      .eq('user_id', user.id)
      .single();

    return {
      hasMinutes: (data?.minutes_remaining || 0) > 0,
      minutesRemaining: data?.minutes_remaining || 0
    };
  }

  /**
   * Save session start
   */
  private async saveSessionStart(): Promise<void> {
    if (!this.conversationState) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('voice_sessions')
      .insert({
        id: this.conversationState.sessionId,
        user_id: user.id,
        mode: this.config.mode,
        language: this.config.language,
        cultural_context: this.config.culturalContext,
        started_at: new Date().toISOString(),
        status: 'active'
      });
  }

  /**
   * Save insights to database
   */
  private async saveInsights(insights: ConversationInsight[]): Promise<void> {
    if (!this.conversationState) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('conversation_insights')
      .insert(
        insights.map(insight => ({
          session_id: this.conversationState!.sessionId,
          user_id: user.id,
          type: insight.type,
          content: insight.content,
          significance: insight.significance,
          actionable: insight.actionable,
          cultural_note: insight.culturalNote,
          created_at: insight.timestamp
        }))
      );
  }

  /**
   * Log crisis event
   */
  private async logCrisisEvent(): Promise<void> {
    if (!this.conversationState) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('crisis_events')
      .insert({
        user_id: user.id,
        session_id: this.conversationState.sessionId,
        detected_at: new Date().toISOString(),
        response_provided: true
      });
  }

  /**
   * Notify user of approaching minute limit
   */
  private notifyApproachingLimit(): void {
    if (this.realtimeChat) {
      this.realtimeChat.sendMessage(
        "Just to let you know, you have about 5 minutes remaining in this session. " +
        "Would you like to start wrapping up our conversation?"
      );
    }
  }

  /**
   * Notify user of exhausted minutes
   */
  private notifyMinutesExhausted(): void {
    if (this.realtimeChat) {
      this.realtimeChat.sendMessage(
        "Your session minutes have been used. " +
        "To continue our conversation, please upgrade your subscription. " +
        "Remember, everything we discussed is saved for you."
      );
    }
  }

  /**
   * Notify connection error
   */
  private notifyConnectionError(): void {
    // Implementation would show user-friendly error message
  }

  /**
   * End conversation
   */
  async endConversation(): Promise<void> {
    if (this.voiceMetricsInterval) {
      clearInterval(this.voiceMetricsInterval);
      this.voiceMetricsInterval = null;
    }

    if (this.realtimeChat) {
      this.realtimeChat.disconnect();
      this.realtimeChat = null;
    }

    // Save session end
    await this.saveSessionEnd();

    // Generate session summary
    await this.generateSessionSummary();
  }

  /**
   * Save session end
   */
  private async saveSessionEnd(): Promise<void> {
    if (!this.conversationState) return;

    await supabase
      .from('voice_sessions')
      .update({
        ended_at: new Date().toISOString(),
        status: 'completed',
        minutes_used: this.conversationState.minutesUsed,
        emotional_journey: this.conversationState.emotionalState,
        topics: this.conversationState.topics,
        insights: this.conversationState.insights,
        breakthroughs: this.conversationState.breakthroughs
      })
      .eq('id', this.conversationState.sessionId);

    // Update user's remaining minutes
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc('deduct_minutes', {
        user_id: user.id,
        minutes: Math.ceil(this.conversationState.minutesUsed)
      });
    }
  }

  /**
   * Generate session summary
   */
  private async generateSessionSummary(): Promise<void> {
    if (!this.conversationState) return;

    // Generate AI summary of session
    const summary = await this.createSessionSummary();

    // Save summary
    await supabase
      .from('session_summaries')
      .insert({
        session_id: this.conversationState.sessionId,
        summary: summary.content,
        key_insights: summary.insights,
        action_items: summary.actions,
        emotional_arc: summary.emotionalArc,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Create session summary using AI
   */
  private async createSessionSummary(): Promise<any> {
    // Implementation would use AI to summarize session
    return {
      content: '',
      insights: [],
      actions: [],
      emotionalArc: ''
    };
  }

  /**
   * Get conversation state
   */
  getConversationState(): ConversationState | null {
    return this.conversationState;
  }

  /**
   * Update configuration mid-conversation
   */
  updateConfiguration(config: Partial<VoiceConversationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.realtimeChat) {
      // Update realtime chat configuration
      this.realtimeChat.updateConfig({
        voice: this.config.voice,
        temperature: this.getTemperatureForMode()
      });
    }
  }
}

// Export singleton instance
export const voiceConversationService = new VoiceConversationService();