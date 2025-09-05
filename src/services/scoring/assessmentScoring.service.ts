/**
 * Real Assessment Scoring Service
 * Implements sophisticated scoring algorithms for different assessment types
 */

import { Assessment, AssessmentQuestion } from '@/types/assessment';
import { supabase } from '@/integrations/supabase/client';

export enum ScoringAlgorithm {
  SUMMATION = 'cumulative',
  WEIGHTED = 'categorical',
  PERSONALITY = 'personality'
}

export interface ScoringResult {
  score: number;
  maxScore: number;
  percentage: number;
  normalizedScore: number;
  categoryScores: Record<string, number>;
  personalityType?: string;
  confidenceLevel: number;
  factors: Record<string, number>;
}

export interface PersonalityProfile {
  type: string;
  subtypes: string[];
  scores: Record<string, number>;
  description: string;
  strengths: string[];
  areasForImprovement: string[];
}

export class AssessmentScoringService {
  /**
   * Calculate assessment score based on responses and assessment type
   */
  static calculateScore(
    assessment: Assessment,
    responses: Record<string, string | number | boolean | string[]>
  ): ScoringResult {
    const scoringType = assessment.scoring?.type || 'cumulative';
    
    switch (scoringType) {
      case 'personality':
        return this.calculatePersonalityScore(assessment, responses);
      case 'categorical':
        return this.calculateWeightedScore(assessment, responses);
      default:
        return this.calculateSummationScore(assessment, responses);
    }
  }

  /**
   * Summation scoring - simple addition of question values
   */
  private static calculateSummationScore(
    assessment: Assessment,
    responses: Record<string, string | number | boolean | string[]>
  ): ScoringResult {
    let totalScore = 0;
    let maxScore = 0;
    const categoryScores: Record<string, number> = {};

    assessment.questions.forEach(question => {
      const answer = responses[question.id];
      const questionScore = this.getQuestionScore(question, answer);
      const questionMax = this.getQuestionMaxScore(question);

      totalScore += questionScore;
      maxScore += questionMax;

      // Categorize scores
      const category = question.category || 'general';
      categoryScores[category] = (categoryScores[category] || 0) + questionScore;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      score: totalScore,
      maxScore,
      percentage,
      normalizedScore: this.normalizeScore(totalScore, maxScore),
      categoryScores,
      confidenceLevel: this.calculateConfidenceLevel(responses),
      factors: this.extractFactors(assessment, responses)
    };
  }

  /**
   * Weighted scoring - applies weights to questions and categories
   */
  private static calculateWeightedScore(
    assessment: Assessment,
    responses: Record<string, string | number | boolean | string[]>
  ): ScoringResult {
    const weights = assessment.scoring?.weights || {};
    let weightedScore = 0;
    let weightedMax = 0;
    const categoryScores: Record<string, number> = {};

    assessment.questions.forEach(question => {
      const answer = responses[question.id];
      const questionScore = this.getQuestionScore(question, answer);
      const questionMax = this.getQuestionMaxScore(question);
      
      // Apply question weight
      const questionWeight = weights[question.id] || 1;
      // Apply category weight
      const categoryWeight = weights[question.category || 'general'] || 1;
      
      const finalWeight = questionWeight * categoryWeight;
      
      weightedScore += questionScore * finalWeight;
      weightedMax += questionMax * finalWeight;

      const category = question.category || 'general';
      categoryScores[category] = (categoryScores[category] || 0) + (questionScore * finalWeight);
    });

    const percentage = weightedMax > 0 ? (weightedScore / weightedMax) * 100 : 0;

    return {
      score: weightedScore,
      maxScore: weightedMax,
      percentage,
      normalizedScore: this.normalizeScore(weightedScore, weightedMax),
      categoryScores,
      confidenceLevel: this.calculateConfidenceLevel(responses),
      factors: this.extractFactors(assessment, responses)
    };
  }

  /**
   * Personality scoring - determines personality type based on responses
   */
  private static calculatePersonalityScore(
    assessment: Assessment,
    responses: Record<string, string | number | boolean | string[]>
  ): ScoringResult {
    const personalityTypes = assessment.scoring?.personalityTypes || {};
    const scores: Record<string, number> = {};

    // Initialize scores for each personality type
    Object.keys(personalityTypes).forEach(type => {
      scores[type] = 0;
    });

    assessment.questions.forEach(question => {
      const answer = responses[question.id];
      const questionScore = this.getQuestionScore(question, answer);

      // Apply personality type mapping
      Object.entries(personalityTypes).forEach(([type, mapping]) => {
        const mappingRecord = mapping as Record<string, number>;
        if (mappingRecord[question.id]) {
          scores[type] += questionScore * (mappingRecord[question.id] || 1);
        }
      });
    });

    // Determine dominant personality type
    let dominantType = '';
    let maxScore = 0;
    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantType = type;
      }
    });

    return {
      score: maxScore,
      maxScore: assessment.questions.length * 5, // Assuming max 5 points per question
      percentage: (maxScore / (assessment.questions.length * 5)) * 100,
      normalizedScore: this.normalizeScore(maxScore, assessment.questions.length * 5),
      categoryScores: scores,
      personalityType: dominantType,
      confidenceLevel: this.calculateConfidenceLevel(responses),
      factors: this.extractFactors(assessment, responses)
    };
  }

  /**
   * Calculate score for individual question
   */
  private static getQuestionScore(question: AssessmentQuestion, answer: string | number | boolean | string[]): number {
    if (!answer) return 0;

    switch (question.type) {
      case 'multiple':
        return this.calculateMultipleChoiceScore(question, answer);
      case 'scale':
        return this.calculateScaleScore(question, answer);
      case 'single':
        return this.calculateBooleanScore(question, answer);
      case 'text':
        return this.calculateTextScore(question, answer);
      default:
        return 0;
    }
  }

  private static calculateMultipleChoiceScore(question: AssessmentQuestion, answer: string | number | boolean | string[]): number {
    if (typeof answer !== 'string') return 0;
    const option = question.options?.find(opt => opt.id === answer);
    return option ? parseInt(option.value.toString()) || 1 : 0;
  }

  private static calculateScaleScore(question: AssessmentQuestion, answer: string | number | boolean | string[]): number {
    if (typeof answer !== 'string' && typeof answer !== 'number') return 0;
    return parseInt(answer.toString()) || 0;
  }

  private static calculateBooleanScore(question: AssessmentQuestion, answer: string | number | boolean | string[]): number {
    if (typeof answer !== 'boolean') return 0;
    return answer ? 1 : 0;
  }

  private static calculateTextScore(question: AssessmentQuestion, answer: string | number | boolean | string[]): number {
    if (Array.isArray(answer)) {
      answer = answer.join(' ');
    } else if (typeof answer !== 'string') {
      return 0;
    }
    
    // For text questions, score based on length or keyword analysis
    const keywords = question.keywords || [];
    let score = 0;
    
    keywords.forEach(keyword => {
      if (answer.toLowerCase().includes(keyword.toLowerCase())) {
        score += 1;
      }
    });

    return Math.min(score, question.maxScore || 5);
  }

  private static getQuestionMaxScore(question: AssessmentQuestion): number {
    switch (question.type) {
      case 'multiple':
        return Math.max(...(question.options?.map(opt => parseInt(opt.value.toString()) || 1) || [1]));
      case 'scale':
        return question.maxScore || 10;
      case 'boolean':
        return 1;
      case 'text':
        return question.maxScore || 5;
      default:
        return 1;
    }
  }

  private static normalizeScore(score: number, maxScore: number): number {
    return maxScore > 0 ? score / maxScore : 0;
  }

  private static calculateConfidenceLevel(responses: Record<string, string | number | boolean | string[]>): number {
    const answeredQuestions = Object.keys(responses).length;
    const requiredQuestions = Object.keys(responses).length; // This should be actual total
    
    if (requiredQuestions === 0) return 0;
    
    return Math.min((answeredQuestions / requiredQuestions) * 100, 100);
  }

  private static extractFactors(assessment: Assessment, responses: Record<string, string | number | boolean | string[]>): Record<string, number> {
    const factors: Record<string, number> = {};
    
    assessment.questions.forEach(question => {
      const answer = responses[question.id];
      if (answer !== undefined && question.factor) {
        factors[question.factor] = this.getQuestionScore(question, answer);
      }
    });

    return factors;
  }

  /**
   * Generate insights based on assessment results
   */
  static generateInsights(
    assessment: Assessment,
    result: ScoringResult
  ): string[] {
    const insights: string[] = [];
    
    // Performance insights
    if (result.percentage >= 90) {
      insights.push('Excellent performance - you demonstrate strong competency in this area');
    } else if (result.percentage >= 70) {
      insights.push('Good performance - you show solid understanding with room for improvement');
    } else if (result.percentage >= 50) {
      insights.push('Average performance - you have foundational knowledge that can be enhanced');
    } else {
      insights.push('Developing performance - consider additional training and practice');
    }

    // Category-specific insights
    Object.entries(result.categoryScores).forEach(([category, score]) => {
      const maxCategoryScore = assessment.questions
        .filter(q => q.category === category)
        .reduce((sum, q) => sum + this.getQuestionMaxScore(q), 0);
      
      const categoryPercentage = maxCategoryScore > 0 ? (Number(score) / maxCategoryScore) * 100 : 0;
      
      if (categoryPercentage < 60) {
        insights.push(`Focus on improving ${category.replace('_', ' ')} skills`);
      }
    });

    return insights;
  }

  /**
   * Generate personalized recommendations
   */
  static generateRecommendations(
    assessment: Assessment,
    result: ScoringResult
  ): string[] {
    const recommendations: string[] = [];

    if (result.percentage < 70) {
      recommendations.push('Review foundational concepts and practice regularly');
      recommendations.push('Seek feedback from mentors or peers');
      recommendations.push('Consider additional training resources');
    }

    if (result.percentage >= 70 && result.percentage < 90) {
      recommendations.push('Challenge yourself with advanced scenarios');
      recommendations.push('Mentor others to reinforce your knowledge');
      recommendations.push('Explore specialized topics in your area');
    }

    // Category-specific recommendations
    Object.entries(result.categoryScores).forEach(([category, score]) => {
      const maxCategoryScore = assessment.questions
        .filter(q => q.category === category)
        .reduce((sum, q) => sum + this.getQuestionMaxScore(q), 0);
      
      const categoryPercentage = maxCategoryScore > 0 ? (score / maxCategoryScore) * 100 : 0;
      
      if (categoryPercentage < 50) {
        recommendations.push(`Complete additional exercises in ${category}`);
      }
    });

    return recommendations;
  }

  /**
   * Calculate percentile rank
   */
  static async calculatePercentileRank(
    assessmentId: string,
    score: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('score')
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      const scores = (data || []).map(r => r.score).filter(s => s !== null).sort((a, b) => (a || 0) - (b || 0));
      if (scores.length === 0) return 50;

      const rank = scores.filter(s => s !== null && s <= score).length;
      return Math.round((rank / scores.length) * 100);
    } catch (error) {
      console.error('Error calculating percentile:', error);
      return 50;
    }
  }
}

export default AssessmentScoringService;
