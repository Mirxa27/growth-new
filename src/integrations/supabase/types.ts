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
      ab_assignments: {
        Row: {
          ab_test_id: number
          assigned_at: string | null
          id: number
          metadata: Json | null
          user_id: string | null
          variant_id: number
        }
        Insert: {
          ab_test_id: number
          assigned_at?: string | null
          id?: never
          metadata?: Json | null
          user_id?: string | null
          variant_id: number
        }
        Update: {
          ab_test_id?: number
          assigned_at?: string | null
          id?: never
          metadata?: Json | null
          user_id?: string | null
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ab_assignments_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          slug: string
          status: string | null
          target_json: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          slug: string
          status?: string | null
          target_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          slug?: string
          status?: string | null
          target_json?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ab_variants: {
        Row: {
          ab_test_id: number
          config_id: number | null
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          ab_test_id: number
          config_id?: number | null
          created_at?: string | null
          id?: never
          name: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          ab_test_id?: number
          config_id?: number | null
          created_at?: string | null
          id?: never
          name?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_variants_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_variants_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ai_providers: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          last_tested_at: string | null
          priority: number | null
          provider_type: string
          test_results: Json | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          last_tested_at?: string | null
          priority?: number | null
          provider_type: string
          test_results?: Json | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          last_tested_at?: string | null
          priority?: number | null
          provider_type?: string
          test_results?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affirmations: {
        Row: {
          content: string
          created_at: string | null
          id: number
          language: string | null
          schedule: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          language?: string | null
          schedule?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          language?: string | null
          schedule?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_config_versions: {
        Row: {
          change_log: string | null
          config: Json
          created_at: string | null
          created_by: string | null
          id: number
          provider_config_id: number
          version: number
        }
        Insert: {
          change_log?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: never
          provider_config_id: number
          version?: number
        }
        Update: {
          change_log?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: never
          provider_config_id?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_versions_provider_config_id_fkey"
            columns: ["provider_config_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_configs: {
        Row: {
          config: Json
          created_at: string | null
          id: number
          is_default: boolean | null
          name: string
          provider_id: number
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: never
          is_default?: boolean | null
          name: string
          provider_id: number
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: never
          is_default?: boolean | null
          name?: string
          provider_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_configs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          created_at: string | null
          homepage: string | null
          id: number
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homepage?: string | null
          id?: never
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homepage?: string | null
          id?: never
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_metrics: {
        Row: {
          cost: number | null
          id: number
          metadata: Json | null
          model: string | null
          occurred_at: string | null
          provider_id: number | null
          usage_amount: number | null
          usage_type: string | null
        }
        Insert: {
          cost?: number | null
          id?: never
          metadata?: Json | null
          model?: string | null
          occurred_at?: string | null
          provider_id?: number | null
          usage_amount?: number | null
          usage_type?: string | null
        }
        Update: {
          cost?: number | null
          id?: never
          metadata?: Json | null
          model?: string | null
          occurred_at?: string | null
          provider_id?: number | null
          usage_amount?: number | null
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_metrics_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
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
      asset_versions: {
        Row: {
          asset_id: number
          created_at: string | null
          id: number
          metadata: Json | null
          storage_path: string | null
          version_number: number | null
        }
        Insert: {
          asset_id: number
          created_at?: string | null
          id?: never
          metadata?: Json | null
          storage_path?: string | null
          version_number?: number | null
        }
        Update: {
          asset_id?: number
          created_at?: string | null
          id?: never
          metadata?: Json | null
          storage_path?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          bucket: string | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          filename: string | null
          id: number
          metadata: Json | null
          path: string | null
          size: number | null
        }
        Insert: {
          bucket?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          filename?: string | null
          id?: never
          metadata?: Json | null
          path?: string | null
          size?: number | null
        }
        Update: {
          bucket?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          filename?: string | null
          id?: never
          metadata?: Json | null
          path?: string | null
          size?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      balance_wheel_areas: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      cms_collections: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          name: string
          schema: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: never
          name: string
          schema?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: never
          name?: string
          schema?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_questions: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          id: number
          metadata: Json | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: never
          metadata?: Json | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: never
          metadata?: Json | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_pinned: boolean | null
          is_published: boolean | null
          is_reported: boolean | null
          likes_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          post_type: string | null
          reports_count: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          is_reported?: boolean | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          post_type?: string | null
          reports_count?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          is_reported?: boolean | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          post_type?: string | null
          reports_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
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
      exploration_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          crystals_earned: number | null
          current_question: number
          exploration_id: string
          final_analysis: Json | null
          id: string
          started_at: string
          status: string
          updated_at: string
          user_answers: Json
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          crystals_earned?: number | null
          current_question?: number
          exploration_id: string
          final_analysis?: Json | null
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_answers?: Json
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          crystals_earned?: number | null
          current_question?: number
          exploration_id?: string
          final_analysis?: Json | null
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exploration_sessions_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      explorations: {
        Row: {
          analysis_structure: Json | null
          category: string
          created_at: string
          crystal_reward: number
          description: string
          difficulty_level: string
          estimated_duration: number
          facilitator_prompt: string
          higher_self_prompt: string
          id: string
          is_active: boolean
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          analysis_structure?: Json | null
          category?: string
          created_at?: string
          crystal_reward?: number
          description: string
          difficulty_level?: string
          estimated_duration?: number
          facilitator_prompt: string
          higher_self_prompt: string
          id?: string
          is_active?: boolean
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          analysis_structure?: Json | null
          category?: string
          created_at?: string
          crystal_reward?: number
          description?: string
          difficulty_level?: string
          estimated_duration?: number
          facilitator_prompt?: string
          higher_self_prompt?: string
          id?: string
          is_active?: boolean
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          crystal_reward_scale: number | null
          id: number
          level_thresholds: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          crystal_reward_scale?: number | null
          id?: never
          level_thresholds?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          crystal_reward_scale?: number | null
          id?: never
          level_thresholds?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      kv_store_3d1d11ba: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          id: number
          performed_at: string | null
          performed_by: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          id?: never
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          id?: never
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string | null
          notes: string | null
          post_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          notes?: string | null
          post_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          notes?: string | null
          post_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
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
      personality_questions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          order_index: number
          question_text: string
          question_type?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          order_index?: number
          question_text?: string
          question_type?: string
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
      provider_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          created_by: string | null
          id: number
          masked: boolean | null
          name: string | null
          provider_config_id: number
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          created_by?: string | null
          id?: never
          masked?: boolean | null
          name?: string | null
          provider_config_id: number
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          created_by?: string | null
          id?: never
          masked?: boolean | null
          name?: string | null
          provider_config_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_api_keys_provider_config_id_fkey"
            columns: ["provider_config_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_agent_configs: {
        Row: {
          created_at: string
          id: string
          instructions: string
          is_active: boolean
          metadata: Json | null
          model: string
          name: string
          type: string
          updated_at: string
          user_id: string | null
          voice: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions: string
          is_active?: boolean
          metadata?: Json | null
          model?: string
          name: string
          type?: string
          updated_at?: string
          user_id?: string | null
          voice?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          metadata?: Json | null
          model?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string | null
          voice?: string
        }
        Relationships: []
      }
      realtime_interaction_logs: {
        Row: {
          data: Json | null
          error_message: string | null
          id: string
          interaction_type: string
          latency_ms: number | null
          session_id: string
          timestamp: string
        }
        Insert: {
          data?: Json | null
          error_message?: string | null
          id?: string
          interaction_type: string
          latency_ms?: number | null
          session_id: string
          timestamp?: string
        }
        Update: {
          data?: Json | null
          error_message?: string | null
          id?: string
          interaction_type?: string
          latency_ms?: number | null
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_interaction_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "realtime_voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_voice_sessions: {
        Row: {
          agent_type: string
          config: Json | null
          ended_at: string | null
          error_message: string | null
          id: string
          interaction_count: number | null
          session_metrics: Json | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          config?: Json | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          interaction_count?: number | null
          session_metrics?: Json | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          config?: Json | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          interaction_count?: number | null
          session_metrics?: Json | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_aggregates_daily: {
        Row: {
          date: string | null
          id: number
          metadata: Json | null
          model: string | null
          provider_id: number | null
          total_cost: number | null
          total_usage: number | null
          usage_type: string | null
        }
        Insert: {
          date?: string | null
          id?: never
          metadata?: Json | null
          model?: string | null
          provider_id?: number | null
          total_cost?: number | null
          total_usage?: number | null
          usage_type?: string | null
        }
        Update: {
          date?: string | null
          id?: never
          metadata?: Json | null
          model?: string | null
          provider_id?: number | null
          total_cost?: number | null
          total_usage?: number | null
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_aggregates_daily_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics_views: {
        Row: {
          id: number
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          recorded_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: never
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          recorded_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: never
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          recorded_at?: string | null
          user_id?: string | null
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
      user_balance_scores: {
        Row: {
          area_id: string
          created_at: string | null
          id: string
          notes: string | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_balance_scores_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "balance_wheel_areas"
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
      voice_analytics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_configuration_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_system_template: boolean | null
          name: string
          template_data: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_system_template?: boolean | null
          name: string
          template_data?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          template_data?: Json | null
          updated_at?: string | null
          usage_count?: number | null
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
      wellness_resources: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          metadata: Json | null
          resource_type: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          metadata?: Json | null
          resource_type?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          metadata?: Json | null
          resource_type?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_exploration_session: {
        Args: { final_analysis_input: Json; session_id_input: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      save_personality_assessment: {
        Args: {
          answers_input: Json
          results_input: Json
          user_id_input: string
        }
        Returns: string
      }
      start_exploration_session: {
        Args: { exploration_id_input: string; user_id_input: string }
        Returns: string
      }
      update_exploration_progress: {
        Args: {
          answer_input: string
          question_index_input: number
          session_id_input: string
        }
        Returns: undefined
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
