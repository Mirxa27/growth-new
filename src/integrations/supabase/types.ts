export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_ai_providers: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_analytics: {
        Row: {
          assessment_id: string
          average_duration_seconds: number | null
          average_score: number | null
          completion_rate: number | null
          difficulty_analysis: Json | null
          id: string
          last_updated: string | null
          popular_answers: Json | null
          total_attempts: number | null
          total_completions: number | null
        }
        Insert: {
          assessment_id: string
          average_duration_seconds?: number | null
          average_score?: number | null
          completion_rate?: number | null
          difficulty_analysis?: Json | null
          id?: string
          last_updated?: string | null
          popular_answers?: Json | null
          total_attempts?: number | null
          total_completions?: number | null
        }
        Update: {
          assessment_id?: string
          average_duration_seconds?: number | null
          average_score?: number | null
          completion_rate?: number | null
          difficulty_analysis?: Json | null
          id?: string
          last_updated?: string | null
          popular_answers?: Json | null
          total_attempts?: number | null
          total_completions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_analytics_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_options: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          is_correct: boolean | null
          metadata: Json | null
          option_text: string
          position: number
          question_id: string
          score_value: number | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          metadata?: Json | null
          option_text: string
          position: number
          question_id: string
          score_value?: number | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          metadata?: Json | null
          option_text?: string
          position?: number
          question_id?: string
          score_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string | null
          explanation: string | null
          id: string
          metadata: Json | null
          points: number | null
          position: number
          question_text: string
          question_type: string
          required: boolean | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          position: number
          question_text: string
          question_type: string
          required?: boolean | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          position?: number
          question_text?: string
          question_type?: string
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          ai_feedback: string | null
          assessment_id: string
          attempt_id: string
          category_scores: Json | null
          completion_certificate_url: string | null
          created_at: string | null
          dominant_traits: string[] | null
          grade: string | null
          growth_recommendations: string[] | null
          id: string
          is_public: boolean | null
          max_score: number
          next_steps: string[] | null
          percentage: number
          personality_type: string | null
          personalized_insights: string | null
          score: number
          user_id: string | null
        }
        Insert: {
          ai_feedback?: string | null
          assessment_id: string
          attempt_id: string
          category_scores?: Json | null
          completion_certificate_url?: string | null
          created_at?: string | null
          dominant_traits?: string[] | null
          grade?: string | null
          growth_recommendations?: string[] | null
          id?: string
          is_public?: boolean | null
          max_score: number
          next_steps?: string[] | null
          percentage: number
          personality_type?: string | null
          personalized_insights?: string | null
          score: number
          user_id?: string | null
        }
        Update: {
          ai_feedback?: string | null
          assessment_id?: string
          attempt_id?: string
          category_scores?: Json | null
          completion_certificate_url?: string | null
          created_at?: string | null
          dominant_traits?: string[] | null
          grade?: string | null
          growth_recommendations?: string[] | null
          id?: string
          is_public?: boolean | null
          max_score?: number
          next_steps?: string[] | null
          percentage?: number
          personality_type?: string | null
          personalized_insights?: string | null
          score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "user_assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          ai_model: string | null
          ai_prompt: string | null
          ai_provider: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_duration: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_featured: boolean | null
          max_attempts: number | null
          metadata: Json | null
          pass_score: number | null
          title: string
          type: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_prompt?: string | null
          ai_provider?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_attempts?: number | null
          metadata?: Json | null
          pass_score?: number | null
          title: string
          type: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_prompt?: string | null
          ai_provider?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_attempts?: number | null
          metadata?: Json | null
          pass_score?: number | null
          title?: string
          type?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "assessment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          error_message: string
          error_type: string
          id: string
          metadata: Json | null
          stack_trace: string | null
          timestamp: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          error_message: string
          error_type: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferences: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_admin_backup: boolean | null
          last_login_at: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          is_admin_backup?: boolean | null
          last_login_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_admin_backup?: boolean | null
          last_login_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_assessment_attempts: {
        Row: {
          ai_analysis: Json | null
          areas_for_improvement: string[] | null
          assessment_id: string
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          insights: string[] | null
          max_score: number | null
          metadata: Json | null
          passed: boolean | null
          percentage_score: number | null
          personality_type: string | null
          raw_score: number | null
          recommendations: string[] | null
          responses: Json | null
          started_at: string | null
          status: string | null
          strengths: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          areas_for_improvement?: string[] | null
          assessment_id: string
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          insights?: string[] | null
          max_score?: number | null
          metadata?: Json | null
          passed?: boolean | null
          percentage_score?: number | null
          personality_type?: string | null
          raw_score?: number | null
          recommendations?: string[] | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          strengths?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          areas_for_improvement?: string[] | null
          assessment_id?: string
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          insights?: string[] | null
          max_score?: number | null
          metadata?: Json | null
          passed?: boolean | null
          percentage_score?: number | null
          personality_type?: string | null
          raw_score?: number | null
          recommendations?: string[] | null
          responses?: Json | null
          started_at?: string | null
          status?: string | null
          strengths?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memory_highlights: {
        Row: {
          created_at: string
          highlights: Json
          id: string
          last_updated_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlights?: Json
          id?: string
          last_updated_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlights?: Json
          id?: string
          last_updated_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_agent_configs: {
        Row: {
          api_base_url: string | null
          arabic_support: boolean | null
          created_at: string | null
          emotion_detection: boolean | null
          enable_realtime: boolean | null
          frequency_penalty: number | null
          id: string
          input_audio_transcription_model: string | null
          instructions: string | null
          is_active: boolean | null
          language: string | null
          max_tokens: number | null
          model: string
          name: string
          openai_api_key: string | null
          openai_organization: string | null
          openai_project: string | null
          presence_penalty: number | null
          provider: string | null
          proxy_url: string | null
          temperature: number | null
          top_p: number | null
          updated_at: string | null
          use_proxy: boolean | null
          voice: string
        }
        Insert: {
          api_base_url?: string | null
          arabic_support?: boolean | null
          created_at?: string | null
          emotion_detection?: boolean | null
          enable_realtime?: boolean | null
          frequency_penalty?: number | null
          id?: string
          input_audio_transcription_model?: string | null
          instructions?: string | null
          is_active?: boolean | null
          language?: string | null
          max_tokens?: number | null
          model?: string
          name: string
          openai_api_key?: string | null
          openai_organization?: string | null
          openai_project?: string | null
          presence_penalty?: number | null
          provider?: string | null
          proxy_url?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
          use_proxy?: boolean | null
          voice?: string
        }
        Update: {
          api_base_url?: string | null
          arabic_support?: boolean | null
          created_at?: string | null
          emotion_detection?: boolean | null
          enable_realtime?: boolean | null
          frequency_penalty?: number | null
          id?: string
          input_audio_transcription_model?: string | null
          instructions?: string | null
          is_active?: boolean | null
          language?: string | null
          max_tokens?: number | null
          model?: string
          name?: string
          openai_api_key?: string | null
          openai_organization?: string | null
          openai_project?: string | null
          presence_penalty?: number | null
          provider?: string | null
          proxy_url?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
          use_proxy?: boolean | null
          voice?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          config_id: string | null
          conversation_data: Json | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          config_id?: string | null
          conversation_data?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          config_id?: string | null
          conversation_data?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "voice_agent_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
