import { Json } from '../../types';

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
  quizzes: {
    Row: {
      id: string;
      title: string;
      description: string | null;
      category: string | null;
      difficulty: string | null;
      is_public: boolean;
      time_limit_minutes: number | null;
      passing_score: number | null;
      show_correct_answers: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      title: string;
      description?: string | null;
      category?: string | null;
      difficulty?: string | null;
      is_public?: boolean;
      time_limit_minutes?: number | null;
      passing_score?: number | null;
      show_correct_answers?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      title?: string;
      description?: string | null;
      category?: string | null;
      difficulty?: string | null;
      is_public?: boolean;
      time_limit_minutes?: number | null;
      passing_score?: number | null;
      show_correct_answers?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  quiz_attempts: {
    Row: {
      id: string;
      user_id: string;
      quiz_id: string;
      status: string;
      score: number | null;
      completed_at: string | null;
      time_taken_seconds: number | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      quiz_id: string;
      status?: string;
      score?: number | null;
      completed_at?: string | null;
      time_taken_seconds?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      quiz_id?: string;
      status?: string;
      score?: number | null;
      completed_at?: string | null
      time_taken_seconds?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "quiz_attempts_quiz_id_fkey";
        columns: ["quiz_id"];
        isOneToOne: false;
        referencedRelation: "quizzes";
        referencedColumns: ["id"];
      },
    ];
  };
  quiz_answers: {
    Row: {
      id: string;
      quiz_attempt_id: string;
      quiz_question_id: string;
      user_answer: string | null;
      is_correct: boolean | null;
      points_earned: number | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      quiz_attempt_id: string;
      quiz_question_id: string;
      user_answer?: string | null;
      is_correct?: boolean | null;
      points_earned?: number | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      quiz_attempt_id?: string;
      quiz_question_id?: string;
      user_answer?: string | null;
      is_correct?: boolean | null;
      points_earned?: number | null;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "quiz_answers_quiz_attempt_id_fkey";
        columns: ["quiz_attempt_id"];
        isOneToOne: false;
        referencedRelation: "quiz_attempts";
        referencedColumns: ["id"];
      },
    ];
  };
};