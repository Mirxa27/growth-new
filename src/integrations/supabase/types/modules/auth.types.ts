import { Json } from '../../types';

export type AuthTables = {
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
      is_banned: boolean | null
      bio: string | null
      avatar_url: string | null // Added avatar_url
      phone: string | null // Added phone
      location: string | null // Added location
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
      is_banned?: boolean | null
      bio?: string | null
      avatar_url?: string | null // Added avatar_url
      phone?: string | null // Added phone
      location?: string | null // Added location
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
      is_banned?: boolean | null
      bio?: string | null
      avatar_url?: string | null // Added avatar_url
      phone?: string | null // Added phone
      location?: string | null // Added location
    }
    Relationships: []
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
  user_preferences: {
    Row: {
      auto_save_journal: boolean | null
      created_at: string | null
      id: string
      language: string | null
      notifications_email: boolean | null
      notifications_marketing: boolean | null
      notifications_push: boolean | null
      privacy_analytics: boolean | null
      privacy_personalization: boolean | null
      theme: string | null
      timezone: string | null
      updated_at: string | null
      user_id: string
      voice_speed: number | null
      voice_type: string | null
    }
    Insert: {
      auto_save_journal?: boolean | null
      created_at?: string | null
      id?: string
      language?: string | null
      notifications_email?: boolean | null
      notifications_marketing?: boolean | null
      notifications_push?: boolean | null
      privacy_analytics?: boolean | null
      privacy_personalization?: boolean | null
      theme?: string | null
      timezone?: string | null
      updated_at?: string | null
      user_id: string
      voice_speed?: number | null
      voice_type?: string | null
    }
    Update: {
      auto_save_journal?: boolean | null
      created_at?: string | null
      id?: string
      language?: string | null
      notifications_email?: boolean | null
      notifications_marketing?: boolean | null
      notifications_push?: boolean | null
      privacy_analytics?: boolean | null
      privacy_personalization?: boolean | null
      theme?: string | null
      timezone?: string | null
      updated_at?: string | null
      user_id?: string
      voice_speed?: number | null
      voice_type?: string | null
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
};