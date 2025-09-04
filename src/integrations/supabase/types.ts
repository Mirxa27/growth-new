export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          difficulty: string
          duration_minutes: number
          questions: Json
          created_at: string
          updated_at: string
          is_active: boolean
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          difficulty: string
          duration_minutes: number
          questions: Json
          is_active?: boolean
          metadata?: Json | null
        }
        Update: {
          title?: string
          description?: string
          category?: string
          difficulty?: string
          duration_minutes?: number
          questions?: Json
          is_active?: boolean
          metadata?: Json | null
        }
      }
      assessment_results: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          score: number
          max_score: number
          answers: Json
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          score: number
          max_score: number
          answers: Json
        }
        Update: {
          score?: number
          max_score?: number
          answers?: Json
          updated_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string
          tags: string[]
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category: string
          tags?: string[]
          is_published?: boolean
        }
        Update: {
          title?: string
          content?: string
          category?: string
          tags?: string[]
          is_published?: boolean
        }
      }
      community_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: string
        }
        Update: {
          reaction_type?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: string
          metadata?: Json | null
        }
        Update: {
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]