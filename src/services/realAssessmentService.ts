/**
 * Real Assessment Service Implementation
 * Replaces mock data with actual database integration
 * Implements proper scoring algorithms and result storage
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  Assessment, 
  AssessmentResult, 
  AssessmentSubmissionParams,
  AssessmentQuestion,
  AssessmentScoringResult
} from '@/types/assessment';

// Assessment Service Error Class
export class AssessmentServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AssessmentServiceError';
  }
}

// Database types for transformations
interface DatabaseAssessment {
  id: number;
  title: string;
  description: string | null;
  visibility: string;
  type: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  questions?: DatabaseQuestion[];
}

interface DatabaseQuestion {
  id: number;
  question_text: string;
  question_type: string;
  points: number | null;
  options?: DatabaseOption[];
}

interface DatabaseOption {
  id: number;
  option_text: string;
  score_value: number | null;
}

interface DatabaseResult {
  id: number;
  user_id: string;
  assessment_id: number;
  score: number | null;
  total_points: number | null;
  percentage: number | null;
  answers: unknown;
  submitted_at: string;
  assessment?: DatabaseAssessment;
}

/**
 * Real Assessment Service - Database Integration
 */
export class RealAssessmentService {
  /**
   * Get all public assessments from database
   */
  static async getPublicAssessments(): Promise<Assessment[]> {
    try {
      const { data: assessments, error } = await supabase
        .from('assessments')
        .select(`
          *,
          questions:assessment_questions(
            *,
            options:assessment_options(*)
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching assessments:', error);
        throw new AssessmentServiceError(
          'Failed to fetch assessments',
          'DB_ERROR',
          500
        );
      }

      return (assessments || []).map((a) => this.transformDatabaseAssessment(a));
    } catch (error) {
      console.error('Error in getPublicAssessments:', error);
      throw error instanceof AssessmentServiceError 
        ? error 
        : new AssessmentServiceError('Unknown error occurred', 'UNKNOWN', 500);
    }
  }

  /**
   * Get assessment by ID from database
   */
  static async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        throw new AssessmentServiceError('Invalid assessment ID', 'INVALID_ID', 400);
      }

      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          *,
          questions:assessment_questions(
            *,
            options:assessment_options(*)
          )
        `)
        .eq('id', numericId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Assessment not found
        }
        throw new AssessmentServiceError(
          'Database error fetching assessment',
          'DB_ERROR',
          500
        );
      }

      return assessment ? this.transformDatabaseAssessment(assessment) : null;
    } catch (error) {
      console.error('Error in getAssessmentById:', error);
      if (error instanceof AssessmentServiceError) {
        throw error;
      }
      throw new AssessmentServiceError('Failed to fetch assessment', 'FETCH_ERROR', 500);
    }
  }

  /**
   * Submit assessment response and calculate real score
   */
  static async submitAssessment(params: AssessmentSubmissionParams): Promise<AssessmentResult> {
    try {
      // Get the assessment to calculate scoring
      const assessment = await this.getAssessmentById(params.assessmentId);
      if (!assessment) {
        throw new AssessmentServiceError('Assessment not found', 'NOT_FOUND', 404);
      }

      // Calculate real score
      const scoring = this.calculateAssessmentScore(assessment, params.responses);

      // Store result in database
      const { data: result, error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: params.userId || 'anonymous',
          assessment_id: parseInt(params.assessmentId),
          score: scoring.score,
          total_points: scoring.maxScore,
          percentage: scoring.percentage,
          answers: params.responses,
          completed: true,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing assessment result:', error);
        throw new AssessmentServiceError(
          'Failed to save assessment result',
          'SAVE_ERROR',
          500
        );
      }

      return this.transformDatabaseResult(result, assessment, scoring);
    } catch (error) {
      console.error('Error in submitAssessment:', error);
      throw error instanceof AssessmentServiceError 
        ? error 
        : new AssessmentServiceError('Submission failed', 'SUBMIT_ERROR', 500);
    }
  }

  /**
   * Get user's assessment results
   */
  static async getUserResults(userId: string): Promise<AssessmentResult[]> {
    try {
      const { data: results, error } = await supabase
        .from('assessment_results')
        .select(`
          *,
          assessment:assessments(*)
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new AssessmentServiceError(
          'Failed to fetch user results',
          'FETCH_ERROR',
          500
        );
      }

      return (results || []).map(result => this.transformDatabaseResult(result));
    } catch (error) {
      console.error('Error in getUserResults:', error);
      throw error instanceof AssessmentServiceError 
        ? error 
        : new AssessmentServiceError('Failed to get results', 'FETCH_ERROR', 500);
    }
  }

  /**
   * Calculate real assessment score based on responses
   */
  private static calculateAssessmentScore(
    assessment: Assessment, 
    responses: Record<string, unknown>
  ): AssessmentScoringResult {
    let totalScore = 0;
    let maxScore = 0;
    const categoryScores: Record<string, number> = {};

    // Process each question
    assessment.questions.forEach(question => {
      const userResponse = responses[question.id];
      const questionScore = this.calculateQuestionScore(question, userResponse);
      const questionMaxScore = question.maxScore || 1;

      totalScore += questionScore;
      maxScore += questionMaxScore;

      // Track category scores
      const category = question.category || 'general';
      if (!categoryScores[category]) {
        categoryScores[category] = 0;
      }
      categoryScores[category] += questionScore;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Determine personality type if applicable
    let personalityType: string | undefined;
    if (assessment.scoring.type === 'personality') {
      personalityType = this.determinePersonalityType(assessment, responses);
    }

    return {
      score: totalScore,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      normalizedScore: maxScore > 0 ? totalScore / maxScore : 0,
      categoryScores,
      personalityType,
      confidenceLevel: this.calculateConfidence(responses),
      factors: this.extractFactors(assessment, responses)
    };
  }

  /**
   * Calculate score for individual question
   */
  private static calculateQuestionScore(question: AssessmentQuestion, response: unknown): number {
    if (!response) return 0;

    switch (question.type) {
      case 'single':
        return this.scoreSingleChoice(question, response as string);
      case 'multiple':
        return this.scoreMultipleChoice(question, response as string[]);
      case 'scale':
        return this.scoreScale(question, response as number);
      case 'text':
        return this.scoreText(question, response as string);
      default:
        return 0;
    }
  }

  /**
   * Score single choice questions
   */
  private static scoreSingleChoice(question: AssessmentQuestion, response: string): number {
    if (!question.options) return 0;
    
    const optionIndex = question.options.findIndex(opt => 
      typeof opt === 'string' ? opt === response : opt.text === response
    );
    
    if (optionIndex === -1) return 0;

    // For personality assessments, use position-based scoring
    if (question.category?.includes('personality')) {
      return optionIndex + 1; // 1-4 scoring based on position
    }

    // For other assessments, return the option's value or 1 point
    const option = question.options[optionIndex];
    return typeof option === 'object' && 'value' in option ? option.value : 1;
  }

  /**
   * Score multiple choice questions
   */
  private static scoreMultipleChoice(question: AssessmentQuestion, responses: string[]): number {
    if (!question.options || !Array.isArray(responses)) return 0;
    
    let score = 0;
    responses.forEach(response => {
      const optionIndex = question.options!.findIndex(opt => 
        typeof opt === 'string' ? opt === response : opt.text === response
      );
      if (optionIndex !== -1) {
        const option = question.options![optionIndex];
        score += typeof option === 'object' && 'value' in option ? option.value : 1;
      }
    });
    
    return score;
  }

  /**
   * Score scale questions
   */
  private static scoreScale(question: AssessmentQuestion, response: number): number {
    if (!question.scale || typeof response !== 'number') return 0;
    
    const { min, max } = question.scale;
    if (response < min || response > max) return 0;
    
    // Normalize scale score (0-1) and multiply by max score
    const normalizedScore = (response - min) / (max - min);
    return normalizedScore * (question.maxScore || max);
  }

  /**
   * Score text questions (basic keyword matching)
   */
  private static scoreText(question: AssessmentQuestion, response: string): number {
    if (!response || typeof response !== 'string') return 0;
    
    // Simple keyword matching if keywords are provided
    if (question.keywords) {
      const lowerResponse = response.toLowerCase();
      const matchedKeywords = question.keywords.filter(keyword => 
        lowerResponse.includes(keyword.toLowerCase())
      );
      return Math.min(matchedKeywords.length, question.maxScore || 1);
    }
    
    // Basic scoring for text responses (length-based)
    return response.trim().length > 10 ? (question.maxScore || 1) : 0;
  }

  /**
   * Determine personality type based on responses
   */
  private static determinePersonalityType(
    assessment: Assessment, 
    responses: Record<string, unknown>
  ): string {
    const typeScores: Record<string, number> = {};
    
    // Initialize type scores
    if (assessment.scoring.personalityTypes) {
      Object.keys(assessment.scoring.personalityTypes).forEach(type => {
        typeScores[type] = 0;
      });
    }

    // Calculate scores for each personality type
    assessment.questions.forEach(question => {
      const response = responses[question.id];
      if (!response) return;

      // Map response to personality scores
      const responseValue = this.calculateQuestionScore(question, response);
      
      // Apply personality type mappings if defined
      if (assessment.scoring.personalityTypes) {
        Object.entries(assessment.scoring.personalityTypes).forEach(([type, mapping]) => {
          if (mapping[question.id]) {
            typeScores[type] += responseValue * mapping[question.id];
          }
        });
      }
    });

    // Return dominant type
    const dominantType = Object.entries(typeScores).reduce((a, b) => 
      typeScores[a[0]] > typeScores[b[0]] ? a : b
    );

    return dominantType[0];
  }

  /**
   * Calculate confidence level based on response pattern
   */
  private static calculateConfidence(responses: Record<string, unknown>): number {
    const totalQuestions = Object.keys(responses).length;
    const answeredQuestions = Object.values(responses).filter(r => r !== null && r !== undefined && r !== '').length;
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }

  /**
   * Extract assessment factors
   */
  private static extractFactors(
    assessment: Assessment, 
    responses: Record<string, unknown>
  ): Record<string, number> {
    const factors: Record<string, number> = {};
    
    // Group responses by category
    assessment.questions.forEach(question => {
      const category = question.category || 'general';
      const response = responses[question.id];
      const score = this.calculateQuestionScore(question, response);
      
      if (!factors[category]) {
        factors[category] = 0;
      }
      factors[category] += score;
    });

    return factors;
  }

  /**
   * Transform database assessment to application format
   */
  private static transformDatabaseAssessment(dbAssessment: DatabaseAssessment): Assessment {
    const questions: AssessmentQuestion[] = (dbAssessment.questions || []).map((q: DatabaseQuestion) => ({
      id: q.id.toString(),
      text: q.question_text,
      type: this.mapQuestionType(q.question_type),
      options: (q.options || []).map((opt: DatabaseOption) => ({
        id: opt.id.toString(),
        text: opt.option_text,
        value: opt.score_value || 1
      })),
      category: dbAssessment.category || 'general',
      maxScore: q.points || 1
    }));

    return {
      id: dbAssessment.id.toString(),
      title: dbAssessment.title,
      description: dbAssessment.description || '',
      type: dbAssessment.type,
      category: dbAssessment.category || 'general',
      visibility: dbAssessment.visibility as 'public' | 'users' | 'premium',
      estimatedTime: 5, // Default estimation
      questions,
      scoring: {
        type: 'cumulative' as const,
        categories: ['general'],
        interpretation: {}
      },
      results: {
        summary: 'Assessment completed',
        insights: ['Assessment completed successfully'],
        recommendations: ['Review your results to learn more about yourself']
      },
      createdAt: dbAssessment.created_at,
      updatedAt: dbAssessment.updated_at
    };
  }

  /**
   * Transform database result to application format
   */
  private static transformDatabaseResult(
    dbResult: DatabaseResult, 
    assessment?: Assessment, 
    scoring?: AssessmentScoringResult
  ): AssessmentResult {
    return {
      id: dbResult.id.toString(),
      assessmentId: dbResult.assessment_id.toString(),
      userId: dbResult.user_id,
      score: scoring?.score || dbResult.score || 0,
      totalScore: scoring?.maxScore || dbResult.total_points || 100,
      percentage: scoring?.percentage || dbResult.percentage || 0,
      personalityType: scoring?.personalityType,
      responses: (dbResult.answers as Record<string, string | number | boolean | string[]>) || {},
      insights: this.generateInsights(scoring),
      recommendations: this.generateRecommendations(scoring),
      completedAt: dbResult.submitted_at,
      createdAt: dbResult.submitted_at,
      assessment
    };
  }

  /**
   * Map database question types to application types
   */
  private static mapQuestionType(dbType: string): 'single' | 'multiple' | 'scale' | 'text' {
    switch (dbType) {
      case 'multiple_choice': return 'single';
      case 'free_text': return 'text';
      case 'image': return 'single';
      default: return 'single';
    }
  }

  /**
   * Generate insights based on scoring results
   */
  private static generateInsights(
    scoring?: AssessmentScoringResult
  ): string[] {
    if (!scoring) return ['Assessment completed successfully'];

    const insights: string[] = [];
    
    if (scoring.percentage >= 80) {
      insights.push('Excellent performance! You demonstrated strong understanding.');
    } else if (scoring.percentage >= 60) {
      insights.push('Good performance with room for improvement in some areas.');
    } else {
      insights.push('Consider reviewing the topics covered in this assessment.');
    }

    if (scoring.personalityType) {
      insights.push(`Your personality type appears to be: ${scoring.personalityType}`);
    }

    // Add category-specific insights
    Object.entries(scoring.categoryScores).forEach(([category, score]) => {
      if (typeof score === 'number' && score > 0) {
        insights.push(`Strong performance in ${category} category`);
      }
    });

    return insights;
  }

  /**
   * Generate recommendations based on scoring results
   */
  private static generateRecommendations(
    scoring?: AssessmentScoringResult
  ): string[] {
    if (!scoring) return ['Continue learning and taking assessments'];

    const recommendations: string[] = [];

    if (scoring.percentage < 60) {
      recommendations.push('Consider taking additional learning courses in this area');
      recommendations.push('Review the topics where you scored lower');
    }

    if (scoring.personalityType) {
      recommendations.push(`Explore career paths that align with ${scoring.personalityType} personality types`);
    }

    recommendations.push('Take more assessments to get a complete picture of your abilities');

    return recommendations;
  }
}

// Export the service as default
export default RealAssessmentService;
