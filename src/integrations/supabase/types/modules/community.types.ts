import { Json } from '../../types'; // Adjusted path

export type CommunityTables = {
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
      status: string
      title: string | null
      views_count: number | null
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
      status?: string
      title?: string | null
      views_count?: number | null
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
      status?: string
      title?: string | null
      views_count?: number | null
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
  testimonials: {
    Row: {
      after_state: string | null
      author_image: string | null
      author_name: string
      author_role: string | null
      before_state: string | null
      content: string
      created_at: string | null
      id: string
      is_featured: boolean | null
      rating: number | null
      status: string | null
      transformation_type: string | null
      updated_at: string | null
      user_id: string | null
    }
    Insert: {
      after_state?: string | null
      author_image?: string | null
      author_name: string
      author_role?: string | null
      before_state?: string | null
      content: string
      created_at?: string | null
      id?: string
      is_featured?: boolean | null
      rating?: number | null
      status?: string | null
      transformation_type?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Update: {
      after_state?: string | null
      author_image?: string | null
      author_name?: string
      author_role?: string | null
      before_state?: string | null
      content?: string
      created_at?: string | null
      id?: string
      is_featured?: boolean | null
      rating?: number | null
      status?: string | null
      transformation_type?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Relationships: []
  }
};