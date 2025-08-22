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
          crystal_reward: number
          description: string
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          crystal_reward?: number
          description: string
          icon?: string | null
          id: string
          title: string
        }
        Update: {
          crystal_reward?: number
          description?: string
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      admin_ai_providers: {
        Row: {
          api_key_encrypted: string | null
          available_models: Json | null
          available_voices: Json | null
          configuration: Json | null
          created_at: string | null
          endpoint_url: string | null
          id: string
          is_active: boolean | null
          last_tested_at: string | null
          name: string
          priority: number | null
          provider_type: string
          system_prompt: string | null
          test_results: Json | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          available_models?: Json | null
          available_voices?: Json | null
          configuration?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_tested_at?: string | null
          name: string
          priority?: number | null
          provider_type: string
          system_prompt?: string | null
          test_results?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          available_models?: Json | null
          available_voices?: Json | null
          configuration?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_tested_at?: string | null
          name?: string
          priority?: number | null
          provider_type?: string
          system_prompt?: string | null
          test_results?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_profile_access_logs: {
        Row: {
          accessed_at: string | null
          accessed_user_id: string
          admin_user_id: string
          id: string
          justification: string
        }
        Insert: {
          accessed_at?: string | null
          accessed_user_id: string
          admin_user_id: string
          id?: string
          justification: string
        }
        Update: {
          accessed_at?: string | null
          accessed_user_id?: string
          admin_user_id?: string
          id?: string
          justification?: string
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          configuration: Json | null
          cost_per_token: number | null
          created_at: string
          endpoint_url: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_name: string | null
          name: string
          priority: number | null
          provider_type: string
          updated_at: string
        }
        Insert: {
          configuration?: Json | null
          cost_per_token?: number | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name?: string | null
          name: string
          priority?: number | null
          provider_type: string
          updated_at?: string
        }
        Update: {
          configuration?: Json | null
          cost_per_token?: number | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_name?: string | null
          name?: string
          priority?: number | null
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          answers: Json
          assessment_type: string
          completed_at: string
          crystals_earned: number | null
          id: string
          insights: Json | null
          questions: Json
          results: Json
          user_id: string | null
        }
        Insert: {
          answers: Json
          assessment_type: string
          completed_at?: string
          crystals_earned?: number | null
          id?: string
          insights?: Json | null
          questions: Json
          results: Json
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_type?: string
          completed_at?: string
          crystals_earned?: number | null
          id?: string
          insights?: Json | null
          questions?: Json
          results?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      audio_recordings: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          language: string | null
          metadata: Json | null
          original_filename: string | null
          processing_status: string | null
          transcript: string | null
          transcription_provider: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          original_filename?: string | null
          processing_status?: string | null
          transcript?: string | null
          transcription_provider?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          original_filename?: string | null
          processing_status?: string | null
          transcript?: string | null
          transcription_provider?: string | null
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
      breathing_practices: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string | null
          description: string
          difficulty_level: number | null
          duration_minutes: number
          id: string
          instructions: Json
          is_active: boolean | null
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          difficulty_level?: number | null
          duration_minutes: number
          id?: string
          instructions: Json
          is_active?: boolean | null
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          difficulty_level?: number | null
          duration_minutes?: number
          id?: string
          instructions?: Json
          is_active?: boolean | null
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_connections: {
        Row: {
          created_at: string | null
          id: string
          requested_id: string | null
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          requested_id?: string | null
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          requested_id?: string | null
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_provider: string | null
          created_at: string
          emotional_context: Json | null
          id: string
          last_activity: string | null
          model_used: string | null
          summary: string | null
          title: string | null
          total_messages: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_provider?: string | null
          created_at?: string
          emotional_context?: Json | null
          id?: string
          last_activity?: string | null
          model_used?: string | null
          summary?: string | null
          title?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_provider?: string | null
          created_at?: string
          emotional_context?: Json | null
          id?: string
          last_activity?: string | null
          model_used?: string | null
          summary?: string | null
          title?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      couple_challenge_answers: {
        Row: {
          answer: string
          id: string
          question_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          answer: string
          id?: string
          question_id: string
          session_id: string
          user_id: string
        }
        Update: {
          answer?: string
          id?: string
          question_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_challenge_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "couple_challenge_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_challenge_sessions: {
        Row: {
          compatibility_results: Json | null
          created_at: string
          id: string
          player1_id: string | null
          player2_id: string | null
          status: string
        }
        Insert: {
          compatibility_results?: Json | null
          created_at?: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          status?: string
        }
        Update: {
          compatibility_results?: Json | null
          created_at?: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          status?: string
        }
        Relationships: []
      }
      daily_affirmations: {
        Row: {
          category: string | null
          created_at: string | null
          cultural_context: string | null
          id: string
          is_active: boolean | null
          personality_types: string[] | null
          text: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          cultural_context?: string | null
          id?: string
          is_active?: boolean | null
          personality_types?: string[] | null
          text: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          cultural_context?: string | null
          id?: string
          is_active?: boolean | null
          personality_types?: string[] | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exploration_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
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
          analysis_structure: Json
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
          analysis_structure?: Json
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
          analysis_structure?: Json
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
      flagged_conversations: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          original_response: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          original_response: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          original_response?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      games_challenges: {
        Row: {
          category: string
          completion_criteria: Json
          created_at: string | null
          crystal_reward: number | null
          description: string
          difficulty_level: number | null
          duration_minutes: number | null
          id: string
          instructions: Json
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completion_criteria: Json
          created_at?: string | null
          crystal_reward?: number | null
          description: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          instructions: Json
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completion_criteria?: Json
          created_at?: string | null
          crystal_reward?: number | null
          description?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          instructions?: Json
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          journey_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          journey_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          journey_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string | null
          created_at: string
          emotional_tone: Json | null
          id: string
          metadata: Json | null
          role: string
          usage: Json | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string
          emotional_tone?: Json | null
          id?: string
          metadata?: Json | null
          role: string
          usage?: Json | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          emotional_tone?: Json | null
          id?: string
          metadata?: Json | null
          role?: string
          usage?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          crystals_count: number | null
          cultural_preferences: Json | null
          display_name: string | null
          email: string
          emotional_state: Json | null
          growth_areas: string[] | null
          id: string
          last_login_at: string | null
          level_progress: number | null
          login_streak_count: number | null
          personality_data: Json | null
          personality_type: string | null
          preferred_language: string | null
          role: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          crystals_count?: number | null
          cultural_preferences?: Json | null
          display_name?: string | null
          email: string
          emotional_state?: Json | null
          growth_areas?: string[] | null
          id?: string
          last_login_at?: string | null
          level_progress?: number | null
          login_streak_count?: number | null
          personality_data?: Json | null
          personality_type?: string | null
          preferred_language?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          crystals_count?: number | null
          cultural_preferences?: Json | null
          display_name?: string | null
          email?: string
          emotional_state?: Json | null
          growth_areas?: string[] | null
          id?: string
          last_login_at?: string | null
          level_progress?: number | null
          login_streak_count?: number | null
          personality_data?: Json | null
          personality_type?: string | null
          preferred_language?: string | null
          role?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parameters: Json | null
          system_prompt: string
          updated_at: string
          version: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json | null
          system_prompt: string
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json | null
          system_prompt?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          admin_user_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          improvements_noted: string | null
          provider_id: string | null
          session_status: string | null
          session_transcript: Json | null
          updated_prompt: string | null
        }
        Insert: {
          admin_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          improvements_noted?: string | null
          provider_id?: string | null
          session_status?: string | null
          session_transcript?: Json | null
          updated_prompt?: string | null
        }
        Update: {
          admin_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          improvements_noted?: string | null
          provider_id?: string | null
          session_status?: string | null
          session_transcript?: Json | null
          updated_prompt?: string | null
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
      user_breathing_progress: {
        Row: {
          completed_sessions: number | null
          created_at: string
          id: string
          last_completed: string | null
          personal_best_duration: number | null
          practice_id: string
          total_duration: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_sessions?: number | null
          created_at?: string
          id?: string
          last_completed?: string | null
          personal_best_duration?: number | null
          practice_id: string
          total_duration?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_sessions?: number | null
          created_at?: string
          id?: string
          last_completed?: string | null
          personal_best_duration?: number | null
          practice_id?: string
          total_duration?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_game_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          crystals_earned: number | null
          game_id: string | null
          id: string
          progress_data: Json | null
          score: number | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          crystals_earned?: number | null
          game_id?: string | null
          id?: string
          progress_data?: Json | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          crystals_earned?: number | null
          game_id?: string | null
          id?: string
          progress_data?: Json | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          progress: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          progress?: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          progress?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          key: string
          last_reinforced: string | null
          memory_type: string
          updated_at: string
          user_id: string | null
          value: Json
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          key: string
          last_reinforced?: string | null
          memory_type: string
          updated_at?: string
          user_id?: string | null
          value: Json
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          key?: string
          last_reinforced?: string | null
          memory_type?: string
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      voice_agents: {
        Row: {
          created_at: string | null
          cultural_adaptation: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          personality: string
          response_style: Json | null
          system_prompt: string
          updated_at: string | null
          voice_id: string
          voice_provider: string
        }
        Insert: {
          created_at?: string | null
          cultural_adaptation?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personality?: string
          response_style?: Json | null
          system_prompt: string
          updated_at?: string | null
          voice_id?: string
          voice_provider?: string
        }
        Update: {
          created_at?: string | null
          cultural_adaptation?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personality?: string
          response_style?: Json | null
          system_prompt?: string
          updated_at?: string | null
          voice_id?: string
          voice_provider?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          audio_format: string | null
          audio_quality_score: number | null
          bit_rate: number | null
          client_info: Json | null
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          error_count: number | null
          id: string
          interruptions_count: number | null
          last_error: string | null
          latency_ms: number | null
          packet_loss_rate: number | null
          provider_name: string
          sample_rate: number | null
          session_metadata: Json | null
          start_time: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audio_format?: string | null
          audio_quality_score?: number | null
          bit_rate?: number | null
          client_info?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          error_count?: number | null
          id?: string
          interruptions_count?: number | null
          last_error?: string | null
          latency_ms?: number | null
          packet_loss_rate?: number | null
          provider_name: string
          sample_rate?: number | null
          session_metadata?: Json | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audio_format?: string | null
          audio_quality_score?: number | null
          bit_rate?: number | null
          client_info?: Json | null
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          error_count?: number | null
          id?: string
          interruptions_count?: number | null
          last_error?: string | null
          latency_ms?: number | null
          packet_loss_rate?: number | null
          provider_name?: string
          sample_rate?: number | null
          session_metadata?: Json | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      webrtc_connection_logs: {
        Row: {
          client_ip: string | null
          connection_type: string | null
          error_message: string | null
          event_data: Json | null
          event_timestamp: string
          event_type: string | null
          id: string
          provider_name: string | null
          user_agent: string | null
          user_id: string | null
          voice_session_id: string | null
        }
        Insert: {
          client_ip?: string | null
          connection_type?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_timestamp?: string
          event_type?: string | null
          id?: string
          provider_name?: string | null
          user_agent?: string | null
          user_id?: string | null
          voice_session_id?: string | null
        }
        Update: {
          client_ip?: string | null
          connection_type?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_timestamp?: string
          event_type?: string | null
          id?: string
          provider_name?: string | null
          user_agent?: string | null
          user_id?: string | null
          voice_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webrtc_connection_logs_voice_session_id_fkey"
            columns: ["voice_session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      webrtc_providers: {
        Row: {
          api_url: string
          configuration: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          api_url: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          api_url?: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_crystals: {
        Args: { crystal_amount: number; user_id_input: string }
        Returns: undefined
      }
      calculate_compatibility_score: {
        Args: { answers1: Json; answers2: Json }
        Returns: number
      }
      complete_exploration_session: {
        Args: { final_analysis_input: Json; session_id_input: string }
        Returns: undefined
      }
      get_admin_safe_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          crystals_count: number
          display_name: string
          id: string
          last_login_at: string
          level_progress: number
          login_streak_count: number
          masked_email: string
          role: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }[]
      }
      get_full_profile_with_logging: {
        Args: { access_justification: string; target_user_id: string }
        Returns: {
          avatar_url: string | null
          created_at: string
          crystals_count: number | null
          cultural_preferences: Json | null
          display_name: string | null
          email: string
          emotional_state: Json | null
          growth_areas: string[] | null
          id: string
          last_login_at: string | null
          level_progress: number | null
          login_streak_count: number | null
          personality_data: Json | null
          personality_type: string | null
          preferred_language: string | null
          role: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
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
