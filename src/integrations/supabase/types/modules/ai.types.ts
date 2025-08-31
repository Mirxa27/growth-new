import { Json } from '../../types';

export type AiTables = {
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
      model: string | null
      max_tokens: number | null
      temperature: number | null
      timeout: number | null
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
      model?: string | null
      max_tokens?: number | null
      temperature?: number | null
      timeout?: number | null
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
      model?: string | null
      max_tokens?: number | null
      temperature?: number | null
      timeout?: number | null
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
  realtime_agent_configs: {
    Row: {
      created_at: string | null
      id: string
      instructions: string
      is_active: boolean | null
      metadata: Json | null
      model: string
      name: string
      tools: Json | null
      type: string
      updated_at: string | null
      user_id: string | null
      voice: string
    }
    Insert: {
      created_at?: string | null
      id?: string
      instructions: string
      is_active?: boolean | null
      metadata?: Json | null
      model: string
      name: string
      tools?: Json | null
      type: string
      updated_at?: string | null
      user_id?: string | null
      voice: string
    }
    Update: {
      created_at?: string | null
      id?: string
      instructions?: string
      is_active?: boolean | null
      metadata?: Json | null
      model?: string
      name?: string
      tools?: Json | null
      type?: string
      updated_at?: string | null
      user_id?: string | null
      voice?: string
    }
    Relationships: []
  }
  realtime_agent_configurations: {
    Row: {
      agent_pattern: string
      agent_roles: Json | null
      created_at: string | null
      created_by: string | null
      description: string | null
      id: string
      is_active: boolean | null
      name: string
      sequential_agents: Json | null
      system_prompt: string
      updated_at: string | null
      updated_by: string | null
    }
    Insert: {
      agent_pattern: string
      agent_roles?: Json | null
      created_at?: string | null
      created_by?: string | null
      description?: string | null
      id?: string
      is_active?: boolean | null
      name: string
      sequential_agents?: Json | null
      system_prompt: string
      updated_at?: string | null
      updated_by?: string | null
    }
    Update: {
      agent_pattern?: string
      agent_roles?: Json | null
      created_at?: string | null
      created_by?: string | null
      description?: string | null
      id?: string
      is_active?: boolean | null
      name?: string
      sequential_agents?: Json | null
      system_prompt?: string
      updated_at?: string | null
      updated_by?: string | null
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
  voice_agent_configs: {
    Row: {
      id: string
      name: string
      provider: string
      model: string
      voice: string
      temperature: number
      instructions: string | null
      is_active: boolean
      created_at: string
    }
    Insert: {
      id?: string
      name: string
      provider: string
      model: string
      voice: string
      temperature?: number
      instructions?: string | null
      is_active?: boolean
      created_at?: string
    }
    Update: {
      id?: string
      name?: string
      provider?: string
      model?: string
      voice?: string
      temperature?: number
      instructions?: string | null
      is_active?: boolean
      created_at?: string
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
  voice_sessions: {
    Row: {
      id: string;
      user_id: string;
      session_id: string;
      model: string;
      voice: string;
      status: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      session_id: string;
      model: string;
      voice: string;
      status?: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      session_id?: string;
      model?: string;
      voice?: string;
      status?: string;
      created_at?: string;
    };
    Relationships: [];
  };
};