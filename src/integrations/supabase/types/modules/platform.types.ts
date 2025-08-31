// No Json import needed here, it's defined in the root types.ts
export type PlatformTables = {
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
  app_events: {
    Row: {
      created_at: string
      event_type: string
      id: string
      payload: Json
      session_id: string | null
      user_id: string | null
    }
    Insert: {
      created_at?: string
      event_type: string
      id?: string
      payload?: Json
      session_id?: string | null
      user_id?: string | null
    }
    Update: {
      created_at?: string
      event_type?: string
      id?: string
      payload?: Json
      session_id?: string | null
      user_id?: string | null
    }
    Relationships: []
  }
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
};