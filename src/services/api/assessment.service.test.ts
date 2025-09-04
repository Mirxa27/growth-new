import { describe, it, expect, vi } from 'vitest';
import { getPublicAssessments, getAssessmentById, getFullAssessment } from './assessment.service';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: (query = '*') => ({
        eq: (_field: string, _value: string) => {
          // Public assessments query
          if (_field === 'visibility' && _value === 'public') {
            return Promise.resolve({
              data: [{ 
                id: '1', 
                title: 'Public Assessment', 
                visibility: 'public',
                questions: []
              }],
              error: null
            });
          }

          // Single assessment query
          if (_field === 'id') {
            if (query.includes('questions')) {
              return Promise.resolve({
                data: {
                  id: '1',
                  title: 'Full Assessment',
                  questions: [
                    { id: 'q1', question: 'Test Question 1' },
                    { id: 'q2', question: 'Test Question 2' }
                  ]
                },
                error: null
              });
            }
            return Promise.resolve({
              data: { id: '1', title: 'Single Assessment' },
              error: null
            });
          }

          return Promise.resolve({ data: null, error: null });
        },
        single: () => Promise.resolve({
          data: { id: '1', title: 'Single Assessment' },
          error: null
        })
      })
    })
  })
}));

describe('Assessment Service', () => {
  it('should fetch public assessments', async () => {
    const assessments = await getPublicAssessments();
    expect(assessments).toHaveLength(1);
    expect(assessments[0].title).toBe('Public Assessment');
  });

  it('should fetch an assessment by id', async () => {
    const assessment = await getAssessmentById('1');
    expect(assessment).toBeDefined();
    expect(assessment?.title).toBe('Single Assessment');
  });

  it('should fetch a full assessment with questions', async () => {
    const assessment = await getFullAssessment('1');
    expect(assessment).toBeDefined();
    expect(assessment?.title).toBe('Full Assessment');
    expect(assessment?.questions).toBeDefined();
  });
});