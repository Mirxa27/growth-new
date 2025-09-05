import { describe, it, expect } from 'vitest';
import AssessmentScoringService, { ScoringAlgorithm } from './assessmentScoring.service';
import { Assessment, AssessmentQuestion } from '@/types/assessment';

describe('AssessmentScoringService', () => {
  const mockAssessment: Assessment = {
    id: '1',
    title: 'Test Assessment',
    description: 'A test assessment',
    type: 'quiz',
    category: 'general',
    visibility: 'public',
    questions: [
      { id: 'q1', text: 'Question 1', type: 'multiple_choice', options: [{ id: 'a1', text: 'Option 1', value: '1' }, { id: 'a2', text: 'Option 2', value: '2' }] },
      { id: 'q2', text: 'Question 2', type: 'scale', maxScore: 5 },
      { id: 'q3', text: 'Question 3', type: 'boolean' },
    ],
    scoring: { type: ScoringAlgorithm.SUMMATION },
  };

  it('should calculate the summation score correctly', () => {
    const responses = { q1: 'a2', q2: '4', q3: true };
    const result = AssessmentScoringService.calculateScore(mockAssessment, responses);
    expect(result.score).toBe(7); // 2 + 4 + 1
    expect(result.maxScore).toBe(8); // 2 + 5 + 1
    expect(result.percentage).toBeCloseTo(87.5);
  });

  it('should calculate the weighted score correctly', () => {
    const weightedAssessment = {
      ...mockAssessment,
      scoring: {
        type: ScoringAlgorithm.WEIGHTED,
        weights: { q1: 2, q2: 1.5, general: 2 },
      },
    };
    const responses = { q1: 'a1', q2: '3', q3: false };
    const result = AssessmentScoringService.calculateScore(weightedAssessment, responses);
    expect(result.score).toBe(13); // (1 * 2 * 2) + (3 * 1.5 * 2) + (0 * 1 * 2)
    expect(result.maxScore).toBe(23); // (2 * 2 * 2) + (5 * 1.5 * 2) + (1 * 1 * 2)
    expect(result.percentage).toBeCloseTo(56.52);
  });

  it('should calculate the personality score correctly', () => {
    const personalityAssessment = {
      ...mockAssessment,
      scoring: {
        type: ScoringAlgorithm.PERSONALITY,
        personalityTypes: {
          typeA: { q1: 2, q3: 1 },
          typeB: { q2: 1.5 },
        },
      },
    };
    const responses = { q1: 'a2', q2: '5', q3: true };
    const result = AssessmentScoringService.calculateScore(personalityAssessment, responses);
    expect(result.personalityType).toBe('typeB');
    expect(result.categoryScores.typeA).toBe(5); // (2 * 2) + (1 * 1)
    expect(result.categoryScores.typeB).toBe(7.5); // 5 * 1.5
  });
});