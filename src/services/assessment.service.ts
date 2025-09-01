/**
 * Assessment Service
 * Handles assessment results persistence and retrieval
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AssessmentResult = Database['public']['Tables']['assessment_results']['Insert'];
type AssessmentResultRow = Database['public']['Tables']['assessment_results']['Row'];

export interface AssessmentData {
  assessmentId: string;
  answers: Record<string, any>;
  score?: number;
  personalityType?: string;
  insights?: string[];
  recommendations?: string[];
  metadata?: Record<string, any>;
}

class AssessmentService {
  /**
   * Save assessment results to database
   */
  async saveAssessmentResult(data: AssessmentData): Promise<{ data: AssessmentResultRow | null; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error('Authentication required to save assessment results');
      }
      
      if (!user) {
        // For anonymous users, save to localStorage
        this.saveToLocalStorage(data);
        return {
          data: null,
          error: new Error('Results saved locally. Sign in to save permanently.')
        };
      }

      // Prepare data for insertion
      const assessmentResult: AssessmentResult = {
        user_id: user.id,
        assessment_id: data.assessmentId,
        answers: data.answers,
        score: data.score || 0,
        personality_type: data.personalityType,
        insights: data.insights,
        recommendations: data.recommendations,
        metadata: data.metadata,
        completed_at: new Date().toISOString()
      };

      // Save to database
      const { data: result, error } = await supabase
        .from('assessment_results')
        .insert(assessmentResult)
        .select()
        .single();

      if (error) throw error;

      return { data: result, error: null };
    } catch (error) {
      console.error('Error saving assessment result:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to save assessment result')
      };
    }
  }

  /**
   * Get user's assessment results
   */
  async getUserAssessmentResults(userId?: string): Promise<{ data: AssessmentResultRow[] | null; error: Error | null }> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          // Return local results for anonymous users
          const localResults = this.getFromLocalStorage();
          return { data: localResults, error: null };
        }
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch assessment results')
      };
    }
  }

  /**
   * Get specific assessment result by ID
   */
  async getAssessmentResult(resultId: string): Promise<{ data: AssessmentResultRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('id', resultId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching assessment result:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch assessment result')
      };
    }
  }

  /**
   * Get latest assessment result for a user
   */
  async getLatestAssessmentResult(assessmentId?: string): Promise<{ data: AssessmentResultRow | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Get from localStorage for anonymous users
        const localResults = this.getFromLocalStorage();
        const latest = localResults.find(r => !assessmentId || r.assessment_id === assessmentId);
        return { data: latest || null, error: null };
      }

      let query = supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (assessmentId) {
        query = query.eq('assessment_id', assessmentId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error fetching latest assessment result:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch latest assessment result')
      };
    }
  }

  /**
   * Update assessment result
   */
  async updateAssessmentResult(
    resultId: string, 
    updates: Partial<AssessmentData>
  ): Promise<{ data: AssessmentResultRow | null; error: Error | null }> {
    try {
      const updateData: any = {};
      
      if (updates.answers !== undefined) updateData.answers = updates.answers;
      if (updates.score !== undefined) updateData.score = updates.score;
      if (updates.personalityType !== undefined) updateData.personality_type = updates.personalityType;
      if (updates.insights !== undefined) updateData.insights = updates.insights;
      if (updates.recommendations !== undefined) updateData.recommendations = updates.recommendations;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('assessment_results')
        .update(updateData)
        .eq('id', resultId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating assessment result:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to update assessment result')
      };
    }
  }

  /**
   * Delete assessment result
   */
  async deleteAssessmentResult(resultId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('assessment_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting assessment result:', error);
      return { 
        error: error instanceof Error ? error : new Error('Failed to delete assessment result')
      };
    }
  }

  /**
   * Get assessment statistics for a user
   */
  async getUserAssessmentStats(userId?: string): Promise<{ data: any | null; error: Error | null }> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { data: null, error: new Error('Authentication required') };
        }
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('assessment_results')
        .select('assessment_id, score, personality_type, completed_at')
        .eq('user_id', userId);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalAssessments: data?.length || 0,
        averageScore: data?.length ? 
          data.reduce((sum, r) => sum + (r.score || 0), 0) / data.length : 0,
        personalityTypes: [...new Set(data?.map(r => r.personality_type).filter(Boolean))],
        lastAssessment: data?.[0]?.completed_at || null,
        assessmentsByType: data?.reduce((acc: any, r) => {
          acc[r.assessment_id] = (acc[r.assessment_id] || 0) + 1;
          return acc;
        }, {})
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching assessment statistics:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch assessment statistics')
      };
    }
  }

  /**
   * Save assessment result to localStorage for anonymous users
   */
  private saveToLocalStorage(data: AssessmentData): void {
    try {
      const existingResults = this.getFromLocalStorage();
      const newResult: any = {
        id: `local_${Date.now()}`,
        user_id: 'anonymous',
        assessment_id: data.assessmentId,
        answers: data.answers,
        score: data.score || 0,
        personality_type: data.personalityType,
        insights: data.insights,
        recommendations: data.recommendations,
        metadata: data.metadata,
        completed_at: new Date().toISOString()
      };
      
      existingResults.push(newResult);
      
      // Keep only last 10 results in localStorage
      if (existingResults.length > 10) {
        existingResults.shift();
      }
      
      localStorage.setItem('assessment_results', JSON.stringify(existingResults));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Get assessment results from localStorage
   */
  private getFromLocalStorage(): any[] {
    try {
      const stored = localStorage.getItem('assessment_results');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  /**
   * Sync local assessment results to database after sign in
   */
  async syncLocalResults(): Promise<{ synced: number; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { synced: 0, error: new Error('Authentication required') };
      }

      const localResults = this.getFromLocalStorage();
      let synced = 0;

      for (const result of localResults) {
        if (result.user_id === 'anonymous') {
          const { error } = await supabase
            .from('assessment_results')
            .insert({
              user_id: user.id,
              assessment_id: result.assessment_id,
              answers: result.answers,
              score: result.score,
              personality_type: result.personality_type,
              insights: result.insights,
              recommendations: result.recommendations,
              metadata: result.metadata,
              completed_at: result.completed_at
            });

          if (!error) {
            synced++;
          }
        }
      }

      // Clear localStorage after successful sync
      if (synced > 0) {
        localStorage.removeItem('assessment_results');
      }

      return { synced, error: null };
    } catch (error) {
      console.error('Error syncing local results:', error);
      return { 
        synced: 0, 
        error: error instanceof Error ? error : new Error('Failed to sync local results')
      };
    }
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService();