// No Json import needed here, it's defined in the root types.ts
export type ContentTables = {
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
      visibility: string
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
      visibility?: string
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
      visibility?: string
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
  library_items: {
    Row: {
      id: string
      title: string
      description: string | null
      content_type: string
      difficulty_level: string
      category: string | null
      tags: string[] | null
      is_premium: boolean
      is_featured: boolean
      is_published: boolean
      author: string | null
      content_url: string | null
      thumbnail_url: string | null
      duration_minutes: number | null
      created_at: string | null
      updated_at: string | null
    }
    Insert: {
      id?: string
      title: string
      description?: string | null
      content_type: string
      difficulty_level?: string
      category?: string | null
      tags?: string[] | null
      is_premium?: boolean
      is_featured?: boolean
      is_published?: boolean
      author?: string | null
      content_url?: string | null
      thumbnail_url?: string | null
      duration_minutes?: number | null
      created_at?: string | null
      updated_at?: string | null
    }
    Update: {
      id?: string
      title?: string
      description?: string | null
      content_type?: string
      difficulty_level?: string
      category?: string | null
      tags?: string[] | null
      is_premium?: boolean
      is_featured?: boolean
      is_published?: boolean
      author?: string | null
      content_url?: string | null
      thumbnail_url?: string | null
      duration_minutes?: number | null
      created_at?: string | null
      updated_at?: string | null
    }
    Relationships: []
  }
  content_challenges: {
    Row: {
      id: string
      title: string
      description: string
      challenge_type: string
      difficulty: string
      reward: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      title: string
      description: string
      challenge_type: string
      difficulty: string
      reward: number
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      title?: string
      description?: string
      challenge_type?: string
      difficulty?: string
      reward?: number
      is_active?: boolean
      created_at?: string
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
  journal_entries: {
    Row: {
      content: string
      created_at: string | null
      id: string
      is_favorite: boolean | null
      mood: string
      tags: string[] | null
      title: string
      updated_at: string | null
      user_id: string
    }
    Insert: {
      content: string
      created_at?: string | null
      id?: string
      is_favorite?: boolean | null
      mood?: string
      tags?: string[] | null
      title: string
      updated_at?: string | null
      user_id: string
    }
    Update: {
      content?: string
      created_at?: string | null
      id?: string
      is_favorite?: boolean | null
      mood?: string
      tags?: string[] | null
      title?: string
      updated_at?: string | null
      user_id?: string
    }
    Relationships: []
  }
  user_journal_stats: {
    Row: {
      all_tags: string[] | null
      entries_last_30_days: number | null
      entries_last_7_days: number | null
      favorite_entries: number | null
      first_entry_date: string | null
      last_entry_date: string | null
      total_entries: number | null
      user_id: string | null
    }
    Relationships: []
  }
};