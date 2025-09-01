/**
 * Assessment Service
 * Handles all assessment-related operations with full business logic
 */

import { BaseApiService, type ApiResponse } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Assessment = Tables<'assessments'>;
export type AssessmentInsert = TablesInsert<'assessments'>;
export type AssessmentUpdate = TablesUpdate<'assessments'>;
export type AssessmentQuestion = Tables<'assessment_questions'>;
export type AssessmentOption = Tables<'assessment_options'>;
export type UserAssessmentResult = Tables<'user_assessment_results'>;

export interface AssessmentWithQuestions extends Assessment {
  questions: (AssessmentQuestion & {
    options: AssessmentOption[];
  })[];
}

export interface AssessmentResult {
  assessmentId: string;
  userId: string;
  responses: Array<{
    questionId: string;
    optionId: string;
    score?: number;
  }>;
  totalScore: number;
  personalityType?: string;
  insights?: string;
  recommendations?: string[];
}

export interface AssessmentAnalytics {
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  popularOptions: Record<string, number>;
  timeSpentAverage: number;
}

class AssessmentService extends BaseApiService {
  constructor() {
    super('assessments');
  }
  
  /**
   * Get all assessments with their questions and options
   */
  async getAssessmentsWithQuestions(
    filters?: { is_public?: boolean; category?: string }
  ): Promise<ApiResponse<AssessmentWithQuestions[]>> {
    try {
      let query = supabase
        .from('assessments')
        .select(`
          *,
          questions:assessment_questions(
            *,
            options:assessment_options(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Sort questions and options by order
      const sortedData = (data || []).map(assessment => ({
        ...assessment,
        questions: assessment.questions
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((q: any) => ({
            ...q,
            options: q.options?.sort((a: any, b: any) => a.order - b.order) || []
          })) || []
      }));
      
      return {
        data: sortedData as AssessmentWithQuestions[],
        error: null,
      };
    } catch (error) {
      this.logError('getAssessmentsWithQuestions', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get a single assessment with all its questions and options
   */
  async getAssessmentById(id: string): Promise<ApiResponse<AssessmentWithQuestions>> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          questions:assessment_questions(
            *,
            options:assessment_options(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Sort questions and options by order
      const sortedData = {
        ...data,
        questions: data.questions
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((q: any) => ({
            ...q,
            options: q.options?.sort((a: any, b: any) => a.order - b.order) || []
          })) || []
      };
      
      return {
        data: sortedData as AssessmentWithQuestions,
        error: null,
      };
    } catch (error) {
      this.logError('getAssessmentById', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Submit assessment responses and calculate results
   */
  async submitAssessment(result: AssessmentResult): Promise<ApiResponse<UserAssessmentResult>> {
    try {
      // Start a transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Calculate personality type based on responses
      const personalityType = await this.calculatePersonalityType(result.responses);
      
      // Generate insights based on the assessment results
      const insights = await this.generateInsights(result.assessmentId, result.responses, personalityType);
      
      // Generate personalized recommendations
      const recommendations = await this.generateRecommendations(personalityType, result.totalScore);
      
      // Save the result
      const { data, error } = await supabase
        .from('user_assessment_results')
        .insert({
          user_id: user.id,
          assessment_id: result.assessmentId,
          responses: result.responses,
          total_score: result.totalScore,
          personality_type: personalityType,
          insights: insights,
          recommendations: recommendations,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user's profile with latest assessment results
      await this.updateUserProfile(user.id, personalityType, result.totalScore);
      
      return {
        data: data as UserAssessmentResult,
        error: null,
      };
    } catch (error) {
      this.logError('submitAssessment', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Calculate personality type based on responses
   */
  private async calculatePersonalityType(
    responses: AssessmentResult['responses']
  ): Promise<string> {
    // Implement sophisticated personality calculation algorithm
    const scoresByDimension: Record<string, number> = {};
    
    for (const response of responses) {
      // Get option details to determine dimension
      const { data: option } = await supabase
        .from('assessment_options')
        .select('scoring_data')
        .eq('id', response.optionId)
        .single();
      
      if (option?.scoring_data) {
        const scoringData = option.scoring_data as any;
        Object.entries(scoringData.dimensions || {}).forEach(([dimension, score]) => {
          scoresByDimension[dimension] = (scoresByDimension[dimension] || 0) + (score as number);
        });
      }
    }
    
    // Determine personality type based on highest scoring dimensions
    const sortedDimensions = Object.entries(scoresByDimension)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([dim]) => dim);
    
    return sortedDimensions.join('-') || 'Balanced';
  }
  
  /**
   * Generate insights based on assessment results
   */
  private async generateInsights(
    assessmentId: string,
    responses: AssessmentResult['responses'],
    personalityType: string
  ): Promise<string> {
    // Fetch assessment details
    const { data: assessment } = await supabase
      .from('assessments')
      .select('title, description, category')
      .eq('id', assessmentId)
      .single();
    
    if (!assessment) return 'Unable to generate insights';
    
    // Build comprehensive insights
    const insights = [
      `Based on your responses to the ${assessment.title} assessment, your personality type is ${personalityType}.`,
      '',
      'Key Strengths:',
      this.getStrengthsForPersonalityType(personalityType),
      '',
      'Areas for Growth:',
      this.getGrowthAreasForPersonalityType(personalityType),
      '',
      'Your Response Pattern:',
      this.analyzeResponsePattern(responses),
    ].join('\n');
    
    return insights;
  }
  
  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(
    personalityType: string,
    totalScore: number
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Base recommendations on personality type
    const typeRecommendations = this.getRecommendationsForType(personalityType);
    recommendations.push(...typeRecommendations);
    
    // Add score-based recommendations
    if (totalScore < 40) {
      recommendations.push(
        'Consider exploring foundational personal development resources',
        'Start with small, achievable goals to build momentum',
        'Focus on self-awareness exercises and mindfulness practices'
      );
    } else if (totalScore < 70) {
      recommendations.push(
        'You\'re on a great path - continue building on your strengths',
        'Challenge yourself with intermediate growth opportunities',
        'Consider mentoring others in areas where you excel'
      );
    } else {
      recommendations.push(
        'You demonstrate strong self-awareness and capabilities',
        'Explore advanced leadership and influence strategies',
        'Share your insights and experiences with the community'
      );
    }
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }
  
  /**
   * Update user profile with assessment results
   */
  private async updateUserProfile(
    userId: string,
    personalityType: string,
    latestScore: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          personality_type: personalityType,
          latest_assessment_score: latestScore,
          last_assessment_date: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      this.logError('updateUserProfile', error);
    }
  }
  
  /**
   * Get user's assessment history
   */
  async getUserAssessmentHistory(userId: string): Promise<ApiResponse<UserAssessmentResult[]>> {
    try {
      const { data, error } = await supabase
        .from('user_assessment_results')
        .select(`
          *,
          assessment:assessments(title, category, description)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data: data as any,
        error: null,
      };
    } catch (error) {
      this.logError('getUserAssessmentHistory', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(assessmentId: string): Promise<ApiResponse<AssessmentAnalytics>> {
    try {
      const { data: results, error } = await supabase
        .from('user_assessment_results')
        .select('*')
        .eq('assessment_id', assessmentId);
      
      if (error) throw error;
      
      if (!results || results.length === 0) {
        return {
          data: {
            totalAttempts: 0,
            averageScore: 0,
            completionRate: 0,
            popularOptions: {},
            timeSpentAverage: 0,
          },
          error: null,
        };
      }
      
      // Calculate analytics
      const totalAttempts = results.length;
      const averageScore = results.reduce((sum, r) => sum + (r.total_score || 0), 0) / totalAttempts;
      
      // Calculate popular options
      const optionCounts: Record<string, number> = {};
      results.forEach(result => {
        const responses = result.responses as any[];
        responses?.forEach(response => {
          const optionId = response.optionId;
          optionCounts[optionId] = (optionCounts[optionId] || 0) + 1;
        });
      });
      
      return {
        data: {
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          completionRate: 100, // All saved results are complete
          popularOptions: optionCounts,
          timeSpentAverage: 180, // Default 3 minutes, can be tracked more precisely
        },
        error: null,
      };
    } catch (error) {
      this.logError('getAssessmentAnalytics', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  // Helper methods for personality insights
  private getStrengthsForPersonalityType(type: string): string {
    const strengthsMap: Record<string, string> = {
      'Analytical': '• Strong problem-solving abilities\n• Attention to detail\n• Logical thinking',
      'Creative': '• Innovative thinking\n• Artistic expression\n• Outside-the-box solutions',
      'Social': '• Excellent communication\n• Team collaboration\n• Empathy and understanding',
      'Leader': '• Decision-making skills\n• Vision and strategy\n• Inspiring others',
      'Balanced': '• Versatility\n• Adaptability\n• Well-rounded perspective',
    };
    
    const key = type.split('-')[0] || 'Balanced';
    return strengthsMap[key] || strengthsMap['Balanced'];
  }
  
  private getGrowthAreasForPersonalityType(type: string): string {
    const growthMap: Record<string, string> = {
      'Analytical': '• Emotional intelligence\n• Creative expression\n• Flexibility in approach',
      'Creative': '• Structure and organization\n• Practical implementation\n• Detail orientation',
      'Social': '• Independent decision-making\n• Analytical thinking\n• Setting boundaries',
      'Leader': '• Active listening\n• Patience and empathy\n• Collaborative approach',
      'Balanced': '• Specialization in key areas\n• Deeper expertise\n• Focused development',
    };
    
    const key = type.split('-')[0] || 'Balanced';
    return growthMap[key] || growthMap['Balanced'];
  }
  
  private getRecommendationsForType(type: string): string[] {
    const recommendationsMap: Record<string, string[]> = {
      'Analytical': [
        'Explore data-driven decision making courses',
        'Practice creative brainstorming techniques',
        'Join collaborative problem-solving groups',
      ],
      'Creative': [
        'Channel creativity into structured projects',
        'Learn project management methodologies',
        'Collaborate with analytical thinkers',
      ],
      'Social': [
        'Develop leadership communication skills',
        'Practice conflict resolution techniques',
        'Build networking strategies',
      ],
      'Leader': [
        'Study servant leadership principles',
        'Develop emotional intelligence',
        'Practice delegation and trust-building',
      ],
      'Balanced': [
        'Identify your strongest dimension to develop further',
        'Explore diverse learning opportunities',
        'Maintain your versatile approach',
      ],
    };
    
    const key = type.split('-')[0] || 'Balanced';
    return recommendationsMap[key] || recommendationsMap['Balanced'];
  }
  
  private analyzeResponsePattern(responses: AssessmentResult['responses']): string {
    const totalResponses = responses.length;
    const highScoreResponses = responses.filter(r => (r.score || 0) >= 4).length;
    const consistency = (highScoreResponses / totalResponses) * 100;
    
    if (consistency > 80) {
      return 'You showed very consistent and confident responses throughout the assessment.';
    } else if (consistency > 50) {
      return 'Your responses show a balanced mix of strengths and areas for development.';
    } else {
      return 'Your responses indicate diverse perspectives and openness to growth.';
    }
  }
}

export const assessmentService = new AssessmentService();