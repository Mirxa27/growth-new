-- Comprehensive Assessment, Quiz, and Test System
-- This migration creates a complete system for assessments, quizzes, and tests
-- Supports both visitor (public) and user assessments

-- Assessment Types Table
CREATE TABLE IF NOT EXISTS public.assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('personality', 'wellness', 'career', 'relationships', 'growth', 'spirituality', 'skills', 'lifestyle')),
    is_public BOOLEAN NOT NULL DEFAULT false, -- true for visitor assessments
    requires_signup BOOLEAN NOT NULL DEFAULT true,
    estimated_duration INTEGER NOT NULL DEFAULT 10, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Questions Table (reusable across assessments)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'scale', 'text', 'boolean', 'multi_select')),
    category TEXT,
    subcategory TEXT,
    tags TEXT[], -- for filtering and organization
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Question Options Table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    value TEXT NOT NULL, -- for scoring/analysis
    order_index INTEGER DEFAULT 0,
    score_weights JSONB DEFAULT '{}', -- weights for different personality traits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assessment_type_id UUID NOT NULL REFERENCES public.assessment_types(id) ON DELETE CASCADE,
    instructions TEXT,
    is_published BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- visitor accessible
    scoring_algorithm TEXT NOT NULL CHECK (scoring_algorithm IN ('personality_weights', 'simple_sum', 'weighted_average', 'custom')),
    scoring_config JSONB DEFAULT '{}',
    result_templates JSONB DEFAULT '{}', -- templates for different result types
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assessment Questions Junction Table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    weight DECIMAL(3,2) DEFAULT 1.0, -- question importance weight
    conditional_logic JSONB DEFAULT '{}', -- show/hide logic based on previous answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assessment_id, question_id)
);

-- Assessment Responses Table (for completed assessments)
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- NULL for visitor responses
    visitor_session_id TEXT, -- for tracking visitor responses
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    total_score DECIMAL(5,2),
    result_type TEXT,
    result_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}', -- additional tracking data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Individual Question Responses
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_response_id UUID NOT NULL REFERENCES public.assessment_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    response_text TEXT,
    response_value TEXT,
    selected_options UUID[], -- for multi-select questions
    score DECIMAL(5,2),
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assessment_response_id, question_id)
);

-- Quiz-specific tables for interactive learning
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_public BOOLEAN DEFAULT false,
    time_limit_minutes INTEGER,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    max_attempts INTEGER DEFAULT 3,
    show_correct_answers BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching')),
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Question Options
CREATE TABLE IF NOT EXISTS public.quiz_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    visitor_session_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT false,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_taken_seconds INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(quiz_attempt_id, quiz_question_id)
);

-- AI-Generated Content Templates (for admin builders)
CREATE TABLE IF NOT EXISTS public.ai_content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('assessment', 'quiz', 'exploration', 'course')),
    category TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    output_schema JSONB NOT NULL,
    default_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Generation History (track what admins have generated)
CREATE TABLE IF NOT EXISTS public.ai_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.ai_content_templates(id),
    topic TEXT NOT NULL,
    additional_context TEXT,
    generated_content JSONB NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;

-- Public read policies (for published/public content)
CREATE POLICY "Public assessments are viewable by everyone" ON public.assessments
    FOR SELECT USING (is_public = true AND is_published = true);

CREATE POLICY "Public quizzes are viewable by everyone" ON public.quizzes
    FOR SELECT USING (is_public = true);

-- User policies
CREATE POLICY "Users can view their own responses" ON public.assessment_responses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create responses" ON public.assessment_responses
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own responses" ON public.assessment_responses
    FOR UPDATE USING (user_id = auth.uid());

-- Admin policies (you'll need to adjust based on your admin role system)
CREATE POLICY "Authenticated users can view assessment types" ON public.assessment_types
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view questions" ON public.questions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view question options" ON public.question_options
    FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(assessment_type_id);
CREATE INDEX IF NOT EXISTS idx_assessments_public ON public.assessments(is_public, is_published);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON public.assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_status ON public.assessment_responses(status);
CREATE INDEX IF NOT EXISTS idx_question_responses_assessment ON public.question_responses(assessment_response_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION public.calculate_assessment_analytics(assessment_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_responses', COUNT(*),
        'completed_responses', COUNT(*) FILTER (WHERE status = 'completed'),
        'completion_rate', 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::decimal / COUNT(*)) * 100, 2)
            END,
        'average_score', ROUND(AVG(total_score), 2),
        'average_completion_time', 
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 2)
    )
    INTO result
    FROM public.assessment_responses
    WHERE assessment_id = assessment_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update response timestamps
CREATE OR REPLACE FUNCTION public.update_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_assessment_responses_timestamp
    BEFORE UPDATE ON public.assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_response_timestamp();

-- Function to generate visitor session ID
CREATE OR REPLACE FUNCTION public.generate_visitor_session()
RETURNS TEXT AS $$
BEGIN
    RETURN 'visitor_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.assessment_types IS 'Different types of assessments (personality, wellness, career, etc.)';
COMMENT ON TABLE public.assessments IS 'Individual assessment instances with questions and scoring';
COMMENT ON TABLE public.assessment_responses IS 'User responses to assessments, including visitor responses';
COMMENT ON TABLE public.quizzes IS 'Educational quizzes with scoring and time limits';
COMMENT ON TABLE public.ai_content_templates IS 'Templates for AI-generated content creation';
