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
      achievements: {
        Row: {
          created_at: string
          crystal_reward: number
          description: string
          icon: string | null
          id: string
          is_active: boolean
          title: string
          unlock_criteria: Json
        }
        Insert: {
          created_at?: string
          crystal_reward?: number
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title: string
          unlock_criteria?: Json
        }
        Update: {
          created_at?: string
          crystal_reward?: number
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title?: string
          unlock_criteria?: Json
        }
        Relationships: []
      }
      admin_ab_tests: {
        Row: {
          created_at: string | null
          id: string
          prompt_a: string
          prompt_b: string
          results: Json | null
          status: string
          traffic_split: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_a: string
          prompt_b: string
          results?: Json | null
          status?: string
          traffic_split?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_a?: string
          prompt_b?: string
          results?: Json | null
          status?: string
          traffic_split?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_ab_tests_prompt_a_fkey"
            columns: ["prompt_a"]
            isOneToOne: false
            referencedRelation: "admin_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ab_tests_prompt_b_fkey"
            columns: ["prompt_b"]
            isOneToOne: false
            referencedRelation: "admin_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ai_providers: {
        Row: {
          api_key: string | null
          available_models: Json | null
          available_voices: Json | null
          configuration: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          provider_type: string | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          available_models?: Json | null
          available_voices?: Json | null
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          provider_type?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          available_models?: Json | null
          available_voices?: Json | null
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          provider_type?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_prompts: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parameters: Json | null
          success_rate: number
          system_prompt: string
          test_results: Json | null
          updated_at: string | null
          usage_count: number
          version: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json | null
          success_rate?: number
          system_prompt: string
          test_results?: Json | null
          updated_at?: string | null
          usage_count?: number
          version?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json | null
          success_rate?: number
          system_prompt?: string
          test_results?: Json | null
          updated_at?: string | null
          usage_count?: number
          version?: number
        }
        Relationships: []
      }
      ai_assessment_responses: {
        Row: {
          ai_insights: string
          assessment_results: Json
          assessment_type: string
          created_at: string
          has_audio: boolean | null
          id: string
          provider_used: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_insights: string
          assessment_results: Json
          assessment_type: string
          created_at?: string
          has_audio?: boolean | null
          id?: string
          provider_used: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_insights?: string
          assessment_results?: Json
          assessment_type?: string
          created_at?: string
          has_audio?: boolean | null
          id?: string
          provider_used?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key: string | null
          configuration: Json | null
          created_at: string | null
          endpoint_url: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          provider_type: string
          rate_limits: Json | null
          retries: number | null
          timeout: number | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          configuration?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          provider_type: string
          rate_limits?: Json | null
          retries?: number | null
          timeout?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          configuration?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          provider_type?: string
          rate_limits?: Json | null
          retries?: number | null
          timeout?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_progress: {
        Row: {
          assessment_type: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_activity_at: string | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_activity_at?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_activity_at?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          answers: Json
          assessment_type: string
          completed_at: string
          created_at: string
          id: string
          results: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          assessment_type: string
          completed_at?: string
          created_at?: string
          id?: string
          results: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_type?: string
          completed_at?: string
          created_at?: string
          id?: string
          results?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      balance_wheel_areas: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          order_index: number
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          order_index: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      behavioral_insights: {
        Row: {
          confidence_level: number | null
          generated_at: string
          id: string
          insight_data: Json
          insight_type: string
          is_active: boolean | null
          user_id: string | null
          validated_at: string | null
        }
        Insert: {
          confidence_level?: number | null
          generated_at?: string
          id?: string
          insight_data: Json
          insight_type: string
          is_active?: boolean | null
          user_id?: string | null
          validated_at?: string | null
        }
        Update: {
          confidence_level?: number | null
          generated_at?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          is_active?: boolean | null
          user_id?: string | null
          validated_at?: string | null
        }
        Relationships: []
      }
      breathing_practices: {
        Row: {
          audio_url: string | null
          category: string
          created_at: string
          description: string
          difficulty_level: number
          duration_minutes: number
          id: string
          instructions: Json
          is_active: boolean
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category?: string
          created_at?: string
          description: string
          difficulty_level?: number
          duration_minutes: number
          id?: string
          instructions?: Json
          is_active?: boolean
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          created_at?: string
          description?: string
          difficulty_level?: number
          duration_minutes?: number
          id?: string
          instructions?: Json
          is_active?: boolean
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          crystal_reward: number
          description: string
          difficulty_level: string
          duration_days: number
          end_date: string | null
          id: string
          is_active: boolean
          requirements: Json | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          crystal_reward?: number
          description: string
          difficulty_level?: string
          duration_days?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          crystal_reward?: number
          description?: string
          difficulty_level?: string
          duration_days?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_connections: {
        Row: {
          created_at: string
          id: string
          requested_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          images: string[] | null
          is_approved: boolean
          is_pinned: boolean
          is_reported: boolean
          likes_count: number
          post_type: string
          tags: string[] | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_pinned?: boolean
          is_reported?: boolean
          likes_count?: number
          post_type?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_pinned?: boolean
          is_reported?: boolean
          likes_count?: number
          post_type?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      conversation_context: {
        Row: {
          context_data: Json
          context_type: string
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          importance_score: number | null
          user_id: string | null
        }
        Insert: {
          context_data: Json
          context_type?: string
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          user_id?: string | null
        }
        Update: {
          context_data?: Json
          context_type?: string
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
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
      moderation_rules: {
        Row: {
          auto_action: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          keywords: Json | null
          name: string
          severity: string
          updated_at: string | null
        }
        Insert: {
          auto_action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json | null
          name: string
          severity?: string
          updated_at?: string | null
        }
        Update: {
          auto_action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json | null
          name?: string
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_configs: {
        Row: {
          config: Json
          created_at: string | null
          gateway: string
          id: string
          is_default: boolean | null
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          gateway: string
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          gateway?: string
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          failure_reason: string | null
          gateway: string
          gateway_payment_id: string
          id: string
          metadata: Json | null
          payment_date: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          failure_reason?: string | null
          gateway: string
          gateway_payment_id: string
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          failure_reason?: string | null
          gateway?: string
          gateway_payment_id?: string
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          options: Json
          order_index: number
          question_text: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          order_index: number
          question_text: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          order_index?: number
          question_text?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          crystals_count: number | null
          display_name: string | null
          email: string | null
          growth_areas: string[] | null
          id: string
          is_admin_backup: boolean | null
          last_login_at: string | null
          level_progress: number | null
          login_streak_count: number | null
          personality_data: Json | null
          personality_type: string | null
          role: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crystals_count?: number | null
          display_name?: string | null
          email?: string | null
          growth_areas?: string[] | null
          id?: string
          is_admin_backup?: boolean | null
          last_login_at?: string | null
          level_progress?: number | null
          login_streak_count?: number | null
          personality_data?: Json | null
          personality_type?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crystals_count?: number | null
          display_name?: string | null
          email?: string | null
          growth_areas?: string[] | null
          id?: string
          is_admin_backup?: boolean | null
          last_login_at?: string | null
          level_progress?: number | null
          login_streak_count?: number | null
          personality_data?: Json | null
          personality_type?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      realtime_conversation_logs: {
        Row: {
          content: Json | null
          id: string
          message_type: string
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          id?: string
          message_type: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          id?: string
          message_type?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_conversation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "realtime_voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_voice_configs: {
        Row: {
          created_at: string | null
          id: string
          input_audio_format: string | null
          input_audio_transcription: Json | null
          instructions: string
          is_active: boolean | null
          max_response_output_tokens: number | null
          model: string
          name: string
          output_audio_format: string | null
          temperature: number | null
          tools: Json | null
          turn_detection: Json | null
          updated_at: string | null
          user_id: string | null
          voice: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_audio_format?: string | null
          input_audio_transcription?: Json | null
          instructions: string
          is_active?: boolean | null
          max_response_output_tokens?: number | null
          model?: string
          name: string
          output_audio_format?: string | null
          temperature?: number | null
          tools?: Json | null
          turn_detection?: Json | null
          updated_at?: string | null
          user_id?: string | null
          voice?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_audio_format?: string | null
          input_audio_transcription?: Json | null
          instructions?: string
          is_active?: boolean | null
          max_response_output_tokens?: number | null
          model?: string
          name?: string
          output_audio_format?: string | null
          temperature?: number | null
          tools?: Json | null
          turn_detection?: Json | null
          updated_at?: string | null
          user_id?: string | null
          voice?: string
        }
        Relationships: []
      }
      realtime_voice_metrics: {
        Row: {
          id: string
          metric_type: string
          session_id: string | null
          timestamp: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          id?: string
          metric_type: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          id?: string
          metric_type?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "realtime_voice_metrics_session_id_fkey"
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
          config: Json
          created_at: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_type: string
          config: Json
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_type?: string
          config?: Json
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          method: string | null
          resource: string | null
          status_code: number | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string | null
          resource?: string | null
          status_code?: number | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string | null
          resource?: string | null
          status_code?: number | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_packages: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          id: string
          interval_count: number
          interval_unit: string
          is_active: boolean
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          description?: string | null
          id?: string
          interval_count: number
          interval_unit: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          interval_count?: number
          interval_unit?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          gateway: string | null
          gateway_plan_id: string | null
          id: string
          interval: string
          interval_count: number
          is_popular: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency: string
          description?: string | null
          features?: Json | null
          gateway?: string | null
          gateway_plan_id?: string | null
          id: string
          interval: string
          interval_count: number
          is_popular?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          gateway?: string | null
          gateway_plan_id?: string | null
          id?: string
          interval?: string
          interval_count?: number
          is_popular?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string | null
          created_time: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          end_time: string | null
          gateway: string
          gateway_subscription_id: string
          id: string
          interval_count: number | null
          interval_unit: string | null
          invoice_status: string | null
          invoice_url: string | null
          metadata: Json | null
          paypal_status: string | null
          plan_id: string | null
          plan_name: string | null
          start_time: string | null
          status: string
          trial_end: string | null
          updated_at: string | null
          user_id: string | null
          webhook_received_at: string | null
        }
        Insert: {
          amount?: number | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_time?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_time?: string | null
          gateway: string
          gateway_subscription_id: string
          id?: string
          interval_count?: number | null
          interval_unit?: string | null
          invoice_status?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          paypal_status?: string | null
          plan_id?: string | null
          plan_name?: string | null
          start_time?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          amount?: number | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_time?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_time?: string | null
          gateway?: string
          gateway_subscription_id?: string
          id?: string
          interval_count?: number | null
          interval_unit?: string | null
          invoice_status?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          paypal_status?: string | null
          plan_id?: string | null
          plan_name?: string | null
          start_time?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_received_at?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          name: string
          provider_id: string | null
          provider_voice_id: string | null
          session_transcript: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          provider_id?: string | null
          provider_voice_id?: string | null
          session_transcript?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          provider_id?: string | null
          provider_voice_id?: string | null
          session_transcript?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "admin_ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          limit_value: number
          package_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          limit_value: number
          package_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          limit_value?: number
          package_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "subscription_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balance_scores: {
        Row: {
          area_id: string
          created_at: string
          id: string
          notes: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          notes?: string | null
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          score?: number
          updated_at?: string
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
      user_breathing_progress: {
        Row: {
          completed_sessions: number
          created_at: string
          id: string
          last_completed: string | null
          personal_best_duration: number
          practice_id: string
          total_duration: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_sessions?: number
          created_at?: string
          id?: string
          last_completed?: string | null
          personal_best_duration?: number
          practice_id: string
          total_duration?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_sessions?: number
          created_at?: string
          id?: string
          last_completed?: string | null
          personal_best_duration?: number
          practice_id?: string
          total_duration?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_breathing_progress_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "breathing_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          progress_percentage: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          created_at: string
          crystal_requirement: number
          description: string
          id: string
          is_active: boolean
          level_number: number
          rewards: Json | null
          title: string
          unlocks: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crystal_requirement?: number
          description: string
          id?: string
          is_active?: boolean
          level_number: number
          rewards?: Json | null
          title: string
          unlocks?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crystal_requirement?: number
          description?: string
          id?: string
          is_active?: boolean
          level_number?: number
          rewards?: Json | null
          title?: string
          unlocks?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_memory_profiles: {
        Row: {
          communication_preferences: Json | null
          confidence_score: number | null
          created_at: string
          growth_tracking: Json | null
          id: string
          interaction_history: Json | null
          last_updated: string
          memory_profile: Json
          personality_summary: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          communication_preferences?: Json | null
          confidence_score?: number | null
          created_at?: string
          growth_tracking?: Json | null
          id?: string
          interaction_history?: Json | null
          last_updated?: string
          memory_profile: Json
          personality_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          communication_preferences?: Json | null
          confidence_score?: number | null
          created_at?: string
          growth_tracking?: Json | null
          id?: string
          interaction_history?: Json | null
          last_updated?: string
          memory_profile?: Json
          personality_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          anthropic_api_key: string | null
          created_at: string | null
          elevenlabs_api_key: string | null
          google_api_key: string | null
          id: string
          openai_api_key: string | null
          settings: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anthropic_api_key?: string | null
          created_at?: string | null
          elevenlabs_api_key?: string | null
          google_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anthropic_api_key?: string | null
          created_at?: string | null
          elevenlabs_api_key?: string | null
          google_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voice_chat_signals: {
        Row: {
          created_at: string | null
          id: number
          receiver_id: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          receiver_id: string
          sender_id: string
          session_id: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          created_at?: string | null
          id?: never
          receiver_id?: string
          sender_id?: string
          session_id?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          gateway: string
          id: string
          payload: Json
          processed_at: string | null
          retry_count: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          gateway: string
          id?: string
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          gateway?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_view: {
        Row: {
          exploration_completed: boolean | null
          exploration_last_activity: string | null
          exploration_progress: number | null
          next_step_cta: string | null
          next_step_description: string | null
          next_step_link: string | null
          next_step_title: string | null
          overall_progress: number | null
          personality_completed: boolean | null
          personality_last_activity: string | null
          personality_progress: number | null
          user_id: string | null
          values_completed: boolean | null
          values_last_activity: string | null
          values_progress: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_crystals: {
        Args: { crystal_amount: number; user_id_input: string }
        Returns: undefined
      }
      complete_exploration_session: {
        Args: { final_analysis_input: Json; session_id_input: string }
        Returns: undefined
      }
      get_admin_safe_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          is_admin_backup: boolean
          last_sign_in_at: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_dashboard_data: {
        Args: { p_user_id: string }
        Returns: {
          exploration_completed: boolean
          exploration_last_activity: string
          exploration_progress: number
          next_step_cta: string
          next_step_description: string
          next_step_link: string
          next_step_title: string
          overall_progress: number
          personality_completed: boolean
          personality_last_activity: string
          personality_progress: number
          user_id: string
          values_completed: boolean
          values_last_activity: string
          values_progress: number
        }[]
      }
      get_enhanced_dashboard_data: {
        Args: { p_user_id: string }
        Returns: {
          completed_explorations: number
          crystals_count: number
          current_streak: number
          display_name: string
          growth_areas: string[]
          level_progress: number
          next_milestone: Json
          personality_type: string
          recent_achievements: Json
          subscription_tier: string
          total_breathing_minutes: number
          user_id: string
        }[]
      }
      is_admin: {
        Args: { uid: string }
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
      update_platform_setting: {
        Args: { setting_key: string; setting_value: string }
        Returns: boolean
      }
      update_user_role_secure: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      update_user_subscription_secure: {
        Args: { new_tier: string; target_user_id: string }
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
