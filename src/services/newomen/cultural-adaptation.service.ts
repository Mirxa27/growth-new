/**
 * Cultural Adaptation Service for Newomen
 * Provides culturally sensitive guidance and expressions
 */

export interface CulturalContext {
  region: 'universal' | 'middle-eastern' | 'arab' | 'gulf' | 'levantine' | 'north-african';
  language: 'en' | 'ar' | 'mixed';
  religiousConsideration: 'none' | 'islamic' | 'christian' | 'secular-spiritual';
  familyStructure: 'nuclear' | 'extended' | 'collective';
  genderNorms: 'traditional' | 'transitional' | 'progressive';
}

export interface CulturalExpression {
  phrase: string;
  transliteration?: string;
  translation: string;
  context: string;
  emotionalTone: string;
  appropriateWhen: string[];
}

export interface CulturalGuidance {
  greetings: string[];
  expressions: CulturalExpression[];
  taboos: string[];
  sensitivities: string[];
  strengthsToHighlight: string[];
  healingApproaches: string[];
  metaphors: string[];
  stories: string[];
}

class CulturalAdaptationService {
  private readonly CULTURAL_EXPRESSIONS: Map<string, CulturalExpression[]> = new Map([
    ['arabic', [
      {
        phrase: 'حبيبتي',
        transliteration: 'habibti',
        translation: 'my dear (feminine)',
        context: 'endearment',
        emotionalTone: 'warm',
        appropriateWhen: ['comfort', 'support', 'connection']
      },
      {
        phrase: 'يا قلبي',
        transliteration: 'ya albi',
        translation: 'my heart',
        context: 'deep endearment',
        emotionalTone: 'loving',
        appropriateWhen: ['empathy', 'deep_connection']
      },
      {
        phrase: 'الله يعينك',
        transliteration: 'Allah y\'eenek',
        translation: 'May God help you',
        context: 'support',
        emotionalTone: 'supportive',
        appropriateWhen: ['difficulty', 'challenge']
      },
      {
        phrase: 'إن شاء الله',
        transliteration: 'inshallah',
        translation: 'God willing',
        context: 'hope',
        emotionalTone: 'hopeful',
        appropriateWhen: ['future_planning', 'goals', 'wishes']
      },
      {
        phrase: 'ما شاء الله',
        transliteration: 'mashallah',
        translation: 'What God has willed',
        context: 'admiration',
        emotionalTone: 'admiring',
        appropriateWhen: ['achievement', 'beauty', 'success']
      },
      {
        phrase: 'الحمد لله',
        transliteration: 'alhamdulillah',
        translation: 'Praise be to God',
        context: 'gratitude',
        emotionalTone: 'grateful',
        appropriateWhen: ['gratitude', 'relief', 'acceptance']
      },
      {
        phrase: 'صبر جميل',
        transliteration: 'sabr jameel',
        translation: 'beautiful patience',
        context: 'resilience',
        emotionalTone: 'encouraging',
        appropriateWhen: ['hardship', 'waiting', 'endurance']
      },
      {
        phrase: 'قوية',
        transliteration: 'qawiyya',
        translation: 'strong (feminine)',
        context: 'empowerment',
        emotionalTone: 'empowering',
        appropriateWhen: ['strength', 'courage', 'resilience']
      }
    ]]
  ]);

  private readonly CULTURAL_METAPHORS: Map<string, string[]> = new Map([
    ['middle-eastern', [
      'Like a palm tree that bends but doesn\'t break in the desert wind',
      'Your heart is like a hidden oasis, precious and life-giving',
      'Like the moon that shows different faces but remains whole',
      'You are weaving a new pattern in an ancient tapestry',
      'Like jasmine that blooms at night, some beauty emerges in darkness',
      'Your strength is like the desert rose, beautiful and resilient'
    ]],
    ['universal', [
      'Like a river finding its way around obstacles',
      'You\'re planting seeds that will bloom in their time',
      'Like a butterfly emerging from its cocoon',
      'Your journey is uniquely yours to walk'
    ]]
  ]);

  private readonly HEALING_APPROACHES: Map<string, string[]> = new Map([
    ['islamic', [
      'Finding peace through dhikr (remembrance)',
      'Seeking healing through du\'a (prayer)',
      'Trusting in qadr (divine destiny) while taking action',
      'Practicing shukr (gratitude) as medicine for the heart',
      'Tawakkul (trust in God) combined with personal effort'
    ]],
    ['collective', [
      'Healing happens in community, not isolation',
      'Your pain affects the collective, your healing blesses everyone',
      'Seeking support is strength, not weakness',
      'Family wounds need family healing',
      'Honor the wisdom of your elders while finding your voice'
    ]]
  ]);

  /**
   * Get cultural guidance for a specific context
   */
  async getGuidance(region: string, language: string): Promise<string> {
    const guidance: string[] = [];

    // Add language-specific guidance
    if (language === 'ar' || language === 'mixed') {
      guidance.push('- Use Arabic terms of endearment naturally (حبيبتي، يا قلبي)');
      guidance.push('- Reference cultural/religious expressions when appropriate');
      guidance.push('- Be aware of honor/shame dynamics without reinforcing them');
    }

    // Add region-specific guidance
    switch (region) {
      case 'middle-eastern':
      case 'arab':
        guidance.push('- Respect family honor while encouraging individual growth');
        guidance.push('- Navigate between tradition and personal authenticity carefully');
        guidance.push('- Acknowledge the weight of cultural expectations');
        guidance.push('- Use metaphors from nature, especially desert and garden imagery');
        break;

      case 'gulf':
        guidance.push('- Be aware of rapid modernization tensions');
        guidance.push('- Respect conservative values while supporting growth');
        guidance.push('- Acknowledge unique pressures of wealth and image');
        break;

      case 'levantine':
        guidance.push('- Appreciate the blend of cultures and openness');
        guidance.push('- Use poetic language and emotional expression');
        guidance.push('- Reference resilience through historical challenges');
        break;

      case 'north-african':
        guidance.push('- Blend Arabic with Amazigh/Berber wisdom when relevant');
        guidance.push('- Acknowledge colonial trauma impacts');
        guidance.push('- Celebrate the strength of matriarchal traditions');
        break;
    }

    // Add universal women's guidance
    guidance.push('- Validate the unique challenges of being a woman in this culture');
    guidance.push('- Honor both traditional wisdom and need for evolution');
    guidance.push('- Create space for anger and "unacceptable" emotions');

    return guidance.join('\n');
  }

  /**
   * Get appropriate greeting
   */
  getGreeting(
    timeOfDay: 'morning' | 'afternoon' | 'evening',
    context: CulturalContext
  ): string {
    const greetings: Record<string, Record<string, string[]>> = {
      morning: {
        en: ['Good morning, beautiful soul', 'Morning light to you'],
        ar: ['صباح الخير حبيبتي', 'صباح النور'],
        mixed: ['Sabah el kheir, beautiful', 'Morning blessings to you']
      },
      afternoon: {
        en: ['Hello dear one', 'Peaceful afternoon to you'],
        ar: ['أهلاً حبيبتي', 'مساء الخير'],
        mixed: ['Ahlan habibti', 'Blessed afternoon']
      },
      evening: {
        en: ['Good evening, dear heart', 'Evening peace to you'],
        ar: ['مساء الخير يا قلبي', 'مساء النور'],
        mixed: ['Masa el kheir, dear one', 'Evening blessings']
      }
    };

    const options = greetings[timeOfDay][context.language] || greetings[timeOfDay]['en'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get culturally appropriate expression
   */
  getExpression(
    emotion: string,
    intensity: number,
    context: CulturalContext
  ): CulturalExpression | null {
    const expressions = this.CULTURAL_EXPRESSIONS.get('arabic') || [];
    
    // Filter by appropriate context
    const suitable = expressions.filter(expr => {
      if (emotion === 'sadness' && expr.appropriateWhen.includes('comfort')) return true;
      if (emotion === 'fear' && expr.appropriateWhen.includes('support')) return true;
      if (emotion === 'joy' && expr.appropriateWhen.includes('achievement')) return true;
      if (emotion === 'anger' && expr.appropriateWhen.includes('difficulty')) return true;
      return false;
    });

    return suitable.length > 0 ? suitable[0] : null;
  }

  /**
   * Get cultural metaphor
   */
  getMetaphor(theme: string, region: string): string {
    const metaphors = this.CULTURAL_METAPHORS.get(region) || 
                     this.CULTURAL_METAPHORS.get('universal') || [];
    
    // Select based on theme
    const relevant = metaphors.filter(m => {
      if (theme === 'strength' && m.includes('strong')) return true;
      if (theme === 'growth' && m.includes('bloom')) return true;
      if (theme === 'resilience' && (m.includes('bend') || m.includes('desert'))) return true;
      return false;
    });

    if (relevant.length > 0) {
      return relevant[Math.floor(Math.random() * relevant.length)];
    }

    return metaphors[Math.floor(Math.random() * metaphors.length)] || '';
  }

  /**
   * Get healing approach
   */
  getHealingApproach(context: CulturalContext): string[] {
    const approaches: string[] = [];

    // Add religious/spiritual approaches if relevant
    if (context.religiousConsideration === 'islamic') {
      const islamic = this.HEALING_APPROACHES.get('islamic') || [];
      approaches.push(...islamic.slice(0, 2));
    }

    // Add collective approaches for extended family structures
    if (context.familyStructure === 'extended' || context.familyStructure === 'collective') {
      const collective = this.HEALING_APPROACHES.get('collective') || [];
      approaches.push(...collective.slice(0, 2));
    }

    // Add universal approaches
    approaches.push(
      'Honoring your emotions as messengers',
      'Creating boundaries with love',
      'Integrating all parts of yourself'
    );

    return approaches;
  }

  /**
   * Check cultural sensitivity
   */
  checkSensitivity(text: string, context: CulturalContext): {
    appropriate: boolean;
    concerns: string[];
    suggestions: string[];
  } {
    const concerns: string[] = [];
    const suggestions: string[] = [];

    // Check for potentially sensitive topics
    const lowerText = text.toLowerCase();

    // Sexual content sensitivity
    if (lowerText.includes('sex') || lowerText.includes('intimate')) {
      if (context.genderNorms === 'traditional') {
        concerns.push('Direct sexual references may cause shame');
        suggestions.push('Use indirect language like "marital relations" or "private matters"');
      }
    }

    // Family criticism sensitivity
    if (lowerText.includes('parent') || lowerText.includes('family')) {
      if (context.familyStructure === 'collective') {
        if (lowerText.includes('blame') || lowerText.includes('fault')) {
          concerns.push('Direct family criticism may trigger loyalty conflicts');
          suggestions.push('Frame as "family patterns" rather than individual blame');
        }
      }
    }

    // Religious sensitivity
    if (context.religiousConsideration === 'islamic') {
      if (lowerText.includes('fate') || lowerText.includes('destiny')) {
        suggestions.push('Acknowledge qadr (divine will) while empowering choice');
      }
    }

    // Independence vs. interdependence
    if (context.familyStructure === 'collective' && lowerText.includes('independent')) {
      suggestions.push('Frame as "finding your voice within family" rather than separation');
    }

    return {
      appropriate: concerns.length === 0,
      concerns,
      suggestions
    };
  }

  /**
   * Adapt message for cultural context
   */
  adaptMessage(message: string, context: CulturalContext): string {
    let adapted = message;

    // Add cultural expressions if using mixed language
    if (context.language === 'mixed') {
      // Add endearments
      if (message.startsWith('I understand')) {
        adapted = `I understand, habibti. ${message.slice(13)}`;
      }

      // Add religious expressions where appropriate
      if (message.includes('hope')) {
        adapted = adapted.replace('hope', 'hope, inshallah,');
      }

      if (message.includes('strong')) {
        adapted = adapted.replace('strong', 'qawiyya (strong)');
      }
    }

    // Adapt for collectivist cultures
    if (context.familyStructure === 'collective') {
      adapted = adapted.replace(
        'you need to',
        'you might consider'
      );
      adapted = adapted.replace(
        'leave',
        'create space'
      );
    }

    // Soften direct statements for traditional contexts
    if (context.genderNorms === 'traditional') {
      adapted = adapted.replace(
        'You should',
        'Perhaps you could'
      );
      adapted = adapted.replace(
        'must',
        'might benefit from'
      );
    }

    return adapted;
  }

  /**
   * Get taboo topics to avoid
   */
  getTaboos(context: CulturalContext): string[] {
    const taboos: string[] = [];

    if (context.genderNorms === 'traditional') {
      taboos.push(
        'Explicit sexual content',
        'Direct criticism of male family members',
        'Encouraging family separation'
      );
    }

    if (context.religiousConsideration === 'islamic') {
      taboos.push(
        'Questioning faith directly',
        'Encouraging haram (forbidden) actions',
        'Dismissing religious practices'
      );
    }

    if (context.familyStructure === 'collective') {
      taboos.push(
        'Promoting complete independence',
        'Dismissing family obligations',
        'Encouraging secrets from family'
      );
    }

    return taboos;
  }

  /**
   * Get strength affirmations
   */
  getStrengthAffirmations(context: CulturalContext): string[] {
    const affirmations: string[] = [];

    // Universal strengths
    affirmations.push(
      'Your resilience is remarkable',
      'You carry ancient wisdom in your bones',
      'Your sensitivity is a superpower'
    );

    // Cultural-specific strengths
    if (context.region === 'middle-eastern' || context.region === 'arab') {
      affirmations.push(
        'You embody the strength of desert roses',
        'You carry the wisdom of your grandmothers',
        'Your hospitality of heart is sacred'
      );
    }

    if (context.familyStructure === 'collective') {
      affirmations.push(
        'Your ability to hold family together is powerful',
        'You balance individual and collective needs beautifully',
        'Your sacrifice has not gone unseen'
      );
    }

    if (context.religiousConsideration === 'islamic') {
      affirmations.push(
        'Your faith is a source of strength',
        'You embody sabr (patience) and shukr (gratitude)',
        'Your spiritual connection guides you'
      );
    }

    return affirmations;
  }

  /**
   * Suggest culturally appropriate coping strategies
   */
  getCopingStrategies(context: CulturalContext): string[] {
    const strategies: string[] = [];

    // Universal strategies
    strategies.push(
      'Journaling in your preferred language',
      'Movement and dance in private',
      'Creative expression through art or crafts'
    );

    // Religious/spiritual strategies
    if (context.religiousConsideration === 'islamic') {
      strategies.push(
        'Dhikr (remembrance) meditation',
        'Prayer and du\'a for guidance',
        'Reading inspirational religious texts',
        'Listening to Quran recitation for calm'
      );
    }

    // Collective culture strategies
    if (context.familyStructure === 'collective') {
      strategies.push(
        'Seeking support from trusted female relatives',
        'Creating women-only gathering spaces',
        'Sharing wisdom through storytelling',
        'Cooking traditional comfort foods'
      );
    }

    // Regional strategies
    if (context.region === 'middle-eastern' || context.region === 'arab') {
      strategies.push(
        'Burning bakhoor (incense) for cleansing',
        'Henna ceremonies for transformation',
        'Traditional music for emotional release',
        'Garden or nature connection'
      );
    }

    return strategies;
  }
}

// Export singleton instance
export const culturalAdaptationService = new CulturalAdaptationService();