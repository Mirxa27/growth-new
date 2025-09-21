import { openaiService } from './openai.service';
import { anthropicService } from './anthropic.service';
import { googleAIService } from './google.service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface GenerationRequest {
  topic: string;
  contentType: 'assessment' | 'quiz' | 'exploration' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  category: string;
  audience: 'visitors' | 'users' | 'premium';
  language: 'en' | 'ar' | 'both';
  culturalContext?: string;
  additionalInstructions?: string;
  aiProvider?: 'openai' | 'anthropic' | 'google';
  model?: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  resultCategories?: GeneratedResultCategory[];
  metadata: {
    category: string;
    tags: string[];
    learningObjectives: string[];
    prerequisites?: string[];
    estimatedTime: number;
    difficulty: string;
    culturalNotes?: string[];
  };
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'true_false' | 'open_ended' | 'scenario' | 'ranking';
  options?: GeneratedOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  category?: string;
  explanation?: string;
  difficulty: number;
  culturalConsiderations?: string;
  arabicTranslation?: string;
  weight?: number;
}

export interface GeneratedOption {
  id: string;
  text: string;
  value: number;
  explanation?: string;
  category?: string;
  arabicTranslation?: string;
}

export interface GeneratedResultCategory {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  minScore: number;
  maxScore: number;
  recommendations: string[];
  actionPlan: string[];
  resources: { title: string; type: string; url?: string }[];
  color: string;
  arabicTranslation?: {
    name: string;
    description: string;
    recommendations: string[];
  };
}

export class AssessmentGeneratorService {
  
  /**
   * Generate content using specified AI provider
   */
  async generateContent(request: GenerationRequest): Promise<GeneratedContent> {
    try {
      logger.info('Starting content generation', 'AssessmentGeneratorService', { 
        topic: request.topic, 
        type: request.contentType,
        provider: request.aiProvider 
      });

      // Get AI provider configuration
      const providerConfig = await this.getProviderConfig(request.aiProvider || 'openai');
      
      // Create comprehensive prompt
      const prompt = this.createGenerationPrompt(request);
      
      // Generate content using selected provider
      let response: string;
      
      switch (request.aiProvider || 'openai') {
        case 'anthropic':
          response = await this.generateWithAnthropic(prompt, providerConfig);
          break;
        case 'google':
          response = await this.generateWithGoogle(prompt, providerConfig);
          break;
        default:
          response = await this.generateWithOpenAI(prompt, providerConfig);
      }

      // Parse and validate the response
      const generatedContent = this.parseAndValidateResponse(response, request);
      
      // Enhance with cultural considerations if needed
      if (request.language === 'ar' || request.language === 'both') {
        await this.addCulturalEnhancements(generatedContent, request);
      }

      logger.info('Content generation completed successfully', 'AssessmentGeneratorService', {
        questionsGenerated: generatedContent.questions.length,
        categoriesGenerated: generatedContent.resultCategories?.length || 0
      });

      return generatedContent;
    } catch (error) {
      logger.error('Content generation failed', 'AssessmentGeneratorService', error);
      throw error;
    }
  }

  /**
   * Get AI provider configuration
   */
  private async getProviderConfig(provider: string) {
    const { data, error } = await supabase
      .from('admin_ai_providers')
      .select('configuration')
      .eq('provider_type', provider)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`AI provider ${provider} not configured`);
    }

    return data.configuration;
  }

  /**
   * Create comprehensive generation prompt
   */
  private createGenerationPrompt(request: GenerationRequest): string {
    const basePrompt = `Create a comprehensive ${request.contentType} about "${request.topic}" with the following specifications:

CONTENT SPECIFICATIONS:
- Content Type: ${request.contentType}
- Difficulty Level: ${request.difficulty}
- Number of Questions: ${request.questionCount}
- Category: ${request.category}
- Target Audience: ${request.audience}
- Language: ${request.language}
${request.culturalContext ? `- Cultural Context: ${request.culturalContext}` : ''}
${request.additionalInstructions ? `- Additional Instructions: ${request.additionalInstructions}` : ''}

CONTENT REQUIREMENTS:
1. Create psychologically sound and engaging questions
2. Ensure questions are appropriate for ${request.difficulty} level
3. Include diverse question types for engagement
4. Use clear, non-biased, inclusive language
5. Consider cultural sensitivity and global perspectives
6. Provide meaningful, actionable insights
7. Focus on personal growth and development

QUESTION TYPES TO USE:
- multiple_choice: For preference and behavior assessment
- scale: For intensity and frequency measurements
- true_false: For clear dichotomous choices
- scenario: For situational judgment
- open_ended: For reflection and self-expression
- ranking: For priority assessment

RESPONSE FORMAT:
Provide a JSON response with this exact structure:
{
  "title": "Engaging and descriptive title",
  "description": "Compelling description explaining value and outcomes",
  "questions": [
    {
      "id": "q1",
      "question": "Clear, engaging question text",
      "type": "multiple_choice|scale|true_false|scenario|open_ended|ranking",
      "options": [
        {
          "id": "a",
          "text": "Option text",
          "value": 1-5,
          "explanation": "Why this option represents this value",
          "category": "trait_being_measured"
        }
      ],
      "scaleMin": 1,
      "scaleMax": 10,
      "scaleLabels": {"min": "Low end description", "max": "High end description"},
      "category": "primary_trait_measured",
      "explanation": "What this question measures and its importance",
      "difficulty": 1-5,
      "weight": 1-3
    }
  ],
  "resultCategories": [
    {
      "id": "category_id",
      "name": "Result Category Name",
      "description": "Brief category description",
      "detailedDescription": "Comprehensive explanation of this result",
      "minScore": 0,
      "maxScore": 25,
      "recommendations": ["Specific actionable recommendation"],
      "actionPlan": ["Concrete step to take"],
      "resources": [{"title": "Resource name", "type": "book|article|course|video"}],
      "color": "bg-color-class",
      "strengths": ["Key strength area"],
      "growthAreas": ["Area for development"]
    }
  ],
  "metadata": {
    "category": "${request.category}",
    "tags": ["relevant", "searchable", "tags"],
    "learningObjectives": ["What users will learn or discover"],
    "prerequisites": ["Optional prerequisites"],
    "estimatedTime": calculated_time_in_minutes,
    "difficulty": "${request.difficulty}",
    "culturalNotes": ["Cultural considerations if applicable"]
  }
}`;

    // Add cultural sensitivity instructions for Arabic content
    if (request.language === 'ar' || request.language === 'both') {
      return basePrompt + `

CULTURAL SENSITIVITY REQUIREMENTS:
- Respect Islamic values and cultural norms
- Use inclusive language that resonates with Arab/Middle Eastern perspectives
- Consider family-oriented and community-focused values
- Avoid assumptions about individual vs. collective orientations
- Include culturally appropriate examples and scenarios
- Ensure content is relevant to diverse Arab cultural backgrounds
- Consider gender-specific cultural considerations where appropriate

If language is "both", provide Arabic translations in additional fields:
- arabicTranslation: for questions and options
- arabicTranslation: for result categories (name, description, recommendations)`;
    }

    return basePrompt;
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(prompt: string, config: any): Promise<string> {
    const response = await openaiService.generateCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in psychology, education, and assessment design. You create scientifically-informed, culturally sensitive, and engaging content that promotes personal growth and self-discovery.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      maxTokens: 4000,
      model: config.model || 'gpt-4-turbo-preview'
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Generate with Anthropic
   */
  private async generateWithAnthropic(prompt: string, config: any): Promise<string> {
    const response = await anthropicService.generateCompletion({
      messages: [
        {
          role: 'user',
          content: `You are an expert in psychology, education, and assessment design. You create scientifically-informed, culturally sensitive, and engaging content that promotes personal growth and self-discovery.\n\n${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 4000,
      model: config.model || 'claude-3-sonnet-20240229'
    });

    return response.content[0].text || '';
  }

  /**
   * Generate with Google AI
   */
  private async generateWithGoogle(prompt: string, config: any): Promise<string> {
    const response = await googleAIService.generateCompletion({
      messages: [
        {
          role: 'user',
          content: `You are an expert in psychology, education, and assessment design. You create scientifically-informed, culturally sensitive, and engaging content that promotes personal growth and self-discovery.\n\n${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 4000,
      model: config.model || 'gemini-pro'
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Parse and validate AI response
   */
  private parseAndValidateResponse(response: string, request: GenerationRequest): GeneratedContent {
    try {
      // Extract JSON from response
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }

      const jsonStr = response.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure from AI');
      }

      // Add IDs and validate questions
      parsed.questions = parsed.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        difficulty: q.difficulty || 3,
        weight: q.weight || 1,
        options: q.options?.map((opt: any, optIndex: number) => ({
          ...opt,
          id: opt.id || `q${index + 1}_${String.fromCharCode(97 + optIndex)}`,
        })) || undefined,
      }));

      // Add IDs to result categories
      if (parsed.resultCategories) {
        parsed.resultCategories = parsed.resultCategories.map((cat: any, index: number) => ({
          ...cat,
          id: cat.id || `result_${index + 1}`,
          color: cat.color || `bg-blue-${(index + 1) * 100}`,
          strengths: cat.strengths || [],
          growthAreas: cat.growthAreas || [],
          actionPlan: cat.actionPlan || [],
          resources: cat.resources || [],
        }));
      }

      // Ensure metadata exists
      parsed.metadata = {
        ...parsed.metadata,
        category: request.category,
        difficulty: request.difficulty,
        estimatedTime: parsed.metadata?.estimatedTime || this.calculateEstimatedTime(parsed.questions.length, request.contentType),
      };

      return parsed as GeneratedContent;
    } catch (error) {
      logger.error('Failed to parse AI response', 'AssessmentGeneratorService', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Add cultural enhancements for Arabic content
   */
  private async addCulturalEnhancements(content: GeneratedContent, request: GenerationRequest): Promise<void> {
    if (request.language === 'ar' || request.language === 'both') {
      try {
        // Generate Arabic translations if needed
        const translationPrompt = `Translate the following assessment content to Arabic while maintaining cultural sensitivity and psychological accuracy:

Title: ${content.title}
Description: ${content.description}

Questions: ${JSON.stringify(content.questions.map(q => ({ question: q.question, options: q.options?.map(o => o.text) })))}

Please provide Arabic translations that are:
1. Culturally appropriate for Arab/Middle Eastern audiences
2. Psychologically accurate and meaningful
3. Natural and fluent in Arabic
4. Respectful of Islamic values and cultural norms

Return as JSON with the same structure but with Arabic translations.`;

        // Generate translations (using the same provider)
        const translationResponse = await this.generateWithOpenAI(translationPrompt, {});
        
        // Parse and integrate translations
        try {
          const translations = JSON.parse(translationResponse);
          
          // Add Arabic translations to questions
          content.questions.forEach((question, index) => {
            if (translations.questions?.[index]) {
              question.arabicTranslation = translations.questions[index].question;
              question.options?.forEach((option, optIndex) => {
                if (translations.questions[index].options?.[optIndex]) {
                  option.arabicTranslation = translations.questions[index].options[optIndex];
                }
              });
            }
          });

          // Add Arabic translations to result categories
          content.resultCategories?.forEach((category, index) => {
            if (translations.resultCategories?.[index]) {
              category.arabicTranslation = {
                name: translations.resultCategories[index].name,
                description: translations.resultCategories[index].description,
                recommendations: translations.resultCategories[index].recommendations || [],
              };
            }
          });

        } catch (translationError) {
          logger.warn('Failed to parse Arabic translations', translationError);
        }
      } catch (error) {
        logger.warn('Failed to generate Arabic translations', error);
      }
    }
  }

  /**
   * Calculate estimated time based on content type and question count
   */
  private calculateEstimatedTime(questionCount: number, contentType: string): number {
    const timePerQuestion = {
      assessment: 1.5, // minutes per question
      quiz: 0.8,
      exploration: 2.5,
      course: 3,
    };

    const baseTime = timePerQuestion[contentType as keyof typeof timePerQuestion] || 1.5;
    return Math.round(questionCount * baseTime);
  }

  /**
   * Save generated content to database
   */
  async saveGeneratedContent(
    content: GeneratedContent, 
    request: GenerationRequest,
    status: 'draft' | 'review' | 'published' = 'draft'
  ): Promise<string> {
    try {
      const contentData = {
        title: content.title,
        description: content.description,
        category: request.category,
        content_type: request.contentType,
        difficulty: request.difficulty,
        target_audience: request.audience,
        language: request.language,
        estimated_time: content.metadata.estimatedTime,
        questions: content.questions,
        result_categories: content.resultCategories,
        metadata: content.metadata,
        status,
        is_active: status === 'published',
        created_by: 'ai_generator', // This would be the admin user ID in real implementation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to assessments table (or appropriate table based on content type)
      const tableName = this.getTableName(request.contentType);
      const { data, error } = await supabase
        .from(tableName)
        .insert(contentData)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      logger.info(`Generated content saved to ${tableName}`, 'AssessmentGeneratorService', { 
        id: data.id,
        title: content.title 
      });

      return data.id;
    } catch (error) {
      logger.error('Failed to save generated content', 'AssessmentGeneratorService', error);
      throw error;
    }
  }

  /**
   * Get appropriate table name for content type
   */
  private getTableName(contentType: string): string {
    switch (contentType) {
      case 'assessment': return 'assessments';
      case 'quiz': return 'quizzes';
      case 'exploration': return 'explorations';
      case 'course': return 'courses';
      default: return 'assessments';
    }
  }

  /**
   * Generate multiple variations of content
   */
  async generateVariations(
    request: GenerationRequest, 
    variationCount: number = 3
  ): Promise<GeneratedContent[]> {
    const variations: GeneratedContent[] = [];
    
    for (let i = 0; i < variationCount; i++) {
      try {
        // Add variation instructions to the request
        const variationRequest = {
          ...request,
          additionalInstructions: `${request.additionalInstructions || ''} 
          
          This is variation ${i + 1} of ${variationCount}. Create a unique approach while maintaining the same topic and learning objectives. Use different question styles and perspectives.`
        };

        const content = await this.generateContent(variationRequest);
        variations.push(content);
        
        // Small delay between generations to avoid rate limits
        if (i < variationCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.warn(`Failed to generate variation ${i + 1}`, error);
      }
    }

    return variations;
  }

  /**
   * Enhance existing content with AI
   */
  async enhanceContent(
    existingContent: GeneratedContent,
    enhancementType: 'improve_questions' | 'add_scenarios' | 'cultural_adaptation' | 'difficulty_adjustment'
  ): Promise<GeneratedContent> {
    try {
      const enhancementPrompt = this.createEnhancementPrompt(existingContent, enhancementType);
      
      // Use OpenAI for enhancements (could be configurable)
      const response = await this.generateWithOpenAI(enhancementPrompt, {});
      
      return this.parseAndValidateResponse(response, {
        topic: 'enhancement',
        contentType: 'assessment',
        difficulty: 'intermediate',
        questionCount: existingContent.questions.length,
        category: existingContent.metadata.category,
        audience: 'users',
        language: 'en'
      });
    } catch (error) {
      logger.error('Failed to enhance content', 'AssessmentGeneratorService', error);
      throw error;
    }
  }

  /**
   * Create enhancement prompt
   */
  private createEnhancementPrompt(content: GeneratedContent, enhancementType: string): string {
    const basePrompt = `Enhance the following assessment content:

Title: ${content.title}
Description: ${content.description}
Current Questions: ${JSON.stringify(content.questions, null, 2)}

Enhancement Type: ${enhancementType}

`;

    switch (enhancementType) {
      case 'improve_questions':
        return basePrompt + `
Please improve the questions by:
1. Making them more engaging and thought-provoking
2. Adding better examples and scenarios
3. Improving the clarity and precision of language
4. Enhancing the psychological validity
5. Adding more nuanced response options

Return the enhanced content in the same JSON format.`;

      case 'add_scenarios':
        return basePrompt + `
Please enhance the assessment by adding scenario-based questions that:
1. Present realistic situations related to the topic
2. Allow for complex decision-making assessment
3. Provide deeper insights into behavior patterns
4. Include diverse cultural and situational contexts
5. Maintain psychological validity

Add 3-5 scenario questions and return the enhanced content.`;

      case 'cultural_adaptation':
        return basePrompt + `
Please adapt this content for better cultural sensitivity and global relevance:
1. Remove cultural biases and Western-centric assumptions
2. Add examples that resonate with diverse cultural backgrounds
3. Consider collectivist vs. individualist cultural orientations
4. Include culturally appropriate scenarios and contexts
5. Ensure language is inclusive and globally relevant

Return the culturally adapted content.`;

      case 'difficulty_adjustment':
        return basePrompt + `
Please adjust the difficulty level of this content:
1. Make questions more sophisticated and nuanced
2. Add complexity to scenarios and decision-making
3. Include advanced psychological concepts where appropriate
4. Enhance the depth of insights and recommendations
5. Maintain accessibility while increasing sophistication

Return the difficulty-adjusted content.`;

      default:
        return basePrompt + 'Please enhance this content for better engagement and effectiveness.';
    }
  }

  /**
   * Validate generated content quality
   */
  validateContentQuality(content: GeneratedContent): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check basic structure
    if (!content.title || content.title.length < 10) {
      issues.push('Title is too short or missing');
    }

    if (!content.description || content.description.length < 50) {
      issues.push('Description is too short or missing');
    }

    if (!content.questions || content.questions.length === 0) {
      issues.push('No questions generated');
    }

    // Check question quality
    content.questions.forEach((question, index) => {
      if (!question.question || question.question.length < 20) {
        issues.push(`Question ${index + 1} is too short`);
      }

      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        issues.push(`Question ${index + 1} needs more options`);
      }

      if (question.type === 'scale' && (!question.scaleMin || !question.scaleMax)) {
        issues.push(`Question ${index + 1} missing scale parameters`);
      }
    });

    // Check result categories
    if (!content.resultCategories || content.resultCategories.length === 0) {
      suggestions.push('Consider adding result categories for better user insights');
    }

    // Quality suggestions
    if (content.questions.length < 10) {
      suggestions.push('Consider adding more questions for better reliability');
    }

    const questionTypes = new Set(content.questions.map(q => q.type));
    if (questionTypes.size < 2) {
      suggestions.push('Consider adding more diverse question types');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Export singleton instance
export const assessmentGeneratorService = new AssessmentGeneratorService();