export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      assessment_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          is_free: boolean
          requires_auth: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          is_free?: boolean
          requires_auth?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          is_free?: boolean
          requires_auth?: boolean
          order_index?: number
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          category_id: string | null
          title: string
          description: string | null
          instructions: string | null
          thumbnail_url: string | null
          time_limit: number | null
          passing_score: number
          is_active: boolean
          is_free: boolean
          requires_auth: boolean
          difficulty: 'easy' | 'medium' | 'hard' | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          title: string
          description?: string | null
          instructions?: string | null
          thumbnail_url?: string | null
          time_limit?: number | null
          passing_score?: number
          is_active?: boolean
          is_free?: boolean
          requires_auth?: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          title?: string
          description?: string | null
          instructions?: string | null
          thumbnail_url?: string | null
          time_limit?: number | null
          passing_score?: number
          is_active?: boolean
          is_free?: boolean
          requires_auth?: boolean
          difficulty?: 'easy' | 'medium' | 'hard' | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          assessment_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'rating'
          options: Json | null
          correct_answer: Json | null
          points: number
          order_index: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'rating'
          options?: Json | null
          correct_answer?: Json | null
          points?: number
          order_index?: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'rating'
          options?: Json | null
          correct_answer?: Json | null
          points?: number
          order_index?: number
          explanation?: string | null
          created_at?: string
        }
      }
      assessment_attempts: {
        Row: {
          id: string
          user_id: string | null
          assessment_id: string
          started_at: string
          completed_at: string | null
          score: number | null
          status: 'in_progress' | 'completed' | 'abandoned'
          time_spent: number | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          assessment_id: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          time_spent?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          assessment_id?: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          time_spent?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      user_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          answer: Json | null
          is_correct: boolean | null
          points_earned: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          answer?: Json | null
          is_correct?: boolean | null
          points_earned?: number | null
          answered_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          answer?: Json | null
          is_correct?: boolean | null
          points_earned?: number | null
          answered_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          price: number
          is_free: boolean
          is_published: boolean
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number
          is_free?: boolean
          is_published?: boolean
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number
          is_free?: boolean
          is_published?: boolean
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
        }
      }
      course_content: {
        Row: {
          id: string
          module_id: string
          content_type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource'
          title: string
          content: Json | null
          order_index: number
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          content_type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource'
          title: string
          content?: Json | null
          order_index?: number
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          content_type?: 'video' | 'text' | 'quiz' | 'assignment' | 'resource'
          title?: string
          content?: Json | null
          order_index?: number
          duration_minutes?: number | null
          created_at?: string
        }
      }
      ai_generated_content: {
        Row: {
          id: string
          content_type: 'assessment' | 'course' | 'test' | 'exploration'
          prompt: string
          ai_provider: string | null
          ai_model: string | null
          generated_content: Json | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_type: 'assessment' | 'course' | 'test' | 'exploration'
          prompt: string
          ai_provider?: string | null
          ai_model?: string | null
          generated_content?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: 'assessment' | 'course' | 'test' | 'exploration'
          prompt?: string
          ai_provider?: string | null
          ai_model?: string | null
          generated_content?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}