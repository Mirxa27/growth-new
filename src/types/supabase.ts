/**
 * Enhanced Supabase Types
 * Type-safe database types with proper error handling
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          type: string;
          category: string;
          visibility: 'public' | 'private' | 'premium';
          difficulty: 'easy' | 'medium' | 'hard' | null;
          estimated_time: number | null;
          scoring: Json | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          metadata: Json | null;
        };
        Insert: {
          title: string;
          description?: string | null;
          type?: string;
          category?: string;
          visibility?: 'public' | 'private' | 'premium';
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          estimated_time?: number | null;
          scoring?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          metadata?: Json | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          type?: string;
          category?: string;
          visibility?: 'public' | 'private' | 'premium';
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          estimated_time?: number | null;
          scoring?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          metadata?: Json | null;
        };
      };
      assessment_questions: {
        Row: {
          id: number;
          assessment_id: number;
          question_text: string;
          question_type: string;
          category: string | null;
          scale: Json | null;
          position: number;
          required: boolean;
          validation_rules: Json | null;
        };
        Insert: {
          assessment_id: number;
          question_text: string;
          question_type: string;
          category?: string | null;
          scale?: Json | null;
          position?: number;
          required?: boolean;
          validation_rules?: Json | null;
        };
        Update: {
          assessment_id?: number;
          question_text?: string;
          question_type?: string;
          category?: string | null;
          scale?: Json | null;
          position?: number;
          required?: boolean;
          validation_rules?: Json | null;
        };
      };
      assessment_options: {
        Row: {
          id: number;
          question_id: number;
          option_text: string;
          value: string;
          position: number;
        };
        Insert: {
          question_id: number;
          option_text: string;
          value: string;
          position?: number;
        };
        Update: {
          question_id?: number;
          option_text?: string;
          value?: string;
          position?: number;
        };
      };
      assessment_results: {
        Row: {
          id: number;
          assessment_id: number;
          user_id: string | null;
          visitor_session_id: string | null;
          score: number;
          total_score: number;
          percentage: number;
          percentile_rank: number | null;
          personality_type: string | null;
          responses: Json;
          insights: string[] | null;
          recommendations: string[] | null;
          category_scores: Json | null;
          confidence_level: number;
          factors: Json | null;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          assessment_id: number;
          user_id?: string | null;
          visitor_session_id?: string | null;
          score: number;
          total_score: number;
          percentage: number;
          percentile_rank?: number | null;
          personality_type?: string | null;
          responses: Json;
          insights?: string[] | null;
          recommendations?: string[] | null;
          category_scores?: Json | null;
          confidence_level?: number;
          factors?: Json | null;
          completed_at?: string;
        };
        Update: {
          assessment_id?: number;
          user_id?: string | null;
          visitor_session_id?: string | null;
          score?: number;
          total_score?: number;
          percentage?: number;
          percentile_rank?: number | null;
          personality_type?: string | null;
          responses?: Json;
          insights?: string[] | null;
          recommendations?: string[] | null;
          category_scores?: Json | null;
          confidence_level?: number;
          factors?: Json | null;
          completed_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'admin' | 'premium';
          subscription_status: 'active' | 'inactive' | 'cancelled' | null;
          profile_complete: boolean;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'user' | 'admin' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled' | null;
          profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'admin' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled' | null;
          profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
    };
  };
};