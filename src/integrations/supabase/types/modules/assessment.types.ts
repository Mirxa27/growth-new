import { Json } from '../../types'; // Adjusted path

export type AssessmentTables = {
  assessment_options: {
    Row: {
      created_at: string
      feedback: string | null
      id: number
      is_correct: boolean
      option_text: string
      position: number
      question_id: number
      scoring_data: Json | null
    }
    Insert: {
      created_at?: string
      feedback?: string | null
      id?: never
      is_correct: boolean
      option_text: string
      position: number
      question_id: number
      scoring_data?: Json | null
    }
    Update: {
      created_at?: string
      feedback?: string | null
      id?: never
      is_correct?: boolean
      option_text?: string
      position?: number
      question_id?: number
      scoring_data?: Json | null
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
  assessment_questions: {
    Row: {
      assessment_id: number
      created_at: string
      id: number
      media_url: string | null
      position: number
      question_text: string
      question_type: string
    }
    Insert: {
      assessment_id: number
      created_at?: string
      id?: never
      media_url?: string | null
      position: number
      question_text: string
      question_type: string
    }
    Update: {
      assessment_id?: number
      created_at?: string
      id?: never
      media_url?: string | null
      position?: number
      question_text?: string
      question_type?: string
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
  assessments: {
    Row: {
      ai_model: string | null
      ai_provider: string | null
      ai_prompt: string | null
      created_at: string
      description: string | null
      id: number
      title: string
      type: string
      updated_at: string
      visibility: string
    }
    Insert: {
      ai_model?: string | null
      ai_provider?: string | null
      ai_prompt?: string | null
      created_at?: string
      description?: string | null
      id?: never
      title: string
      type: string
      updated_at?: string
      visibility: string
    }
    Update: {
      ai_model?: string | null
      ai_provider?: string | null
      ai_prompt?: string | null
      created_at?: string
      description?: string | null
      id?: never
      title?: string
      type?: string
      updated_at?: string
      visibility?: string
    }
    Relationships: []
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
};