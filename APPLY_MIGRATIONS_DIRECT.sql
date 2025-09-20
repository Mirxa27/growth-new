-- APPLY MIGRATIONS DIRECT - Run this in Supabase SQL Editor
-- This script creates all necessary tables and functions for the Newomen platform

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.assessment_responses CASCADE;
DROP TABLE IF EXISTS public.assessment_attempts CASCADE;
DROP TABLE IF EXISTS public.assessment_options CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.assessment_types CASCADE;
DROP TABLE IF EXISTS public.ai_build_jobs CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.explorations CASCADE;
DROP TABLE IF EXISTS public.assessment_analytics CASCADE;

-- Create user_profiles table (fixes 404 errors)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Types
CREATE TABLE public.assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('personality', 'wellness', 'career', 'relationships', 'growth', 'spirituality', 'skills', 'lifestyle', 'general')),
    icon TEXT,
    color TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main Assessments Table
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    assessment_type_id UUID REFERENCES public.assessment_types(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'timed_quiz', 'image_identification', 'audio_response')) DEFAULT 'multiple_choice',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_time INTEGER DEFAULT 10,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT false,
    requires_auth BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    learning_outcomes TEXT[],
    prerequisites TEXT[],
    ai_generated BOOLEAN DEFAULT false,
    ai_provider TEXT,
    ai_model TEXT,
    ai_prompt TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions for Assessments
CREATE TABLE public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'scale', 'image_upload', 'audio_response')) DEFAULT 'multiple_choice',
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
    media_url TEXT,
    media_caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER DEFAULT 1,
    time_limit INTEGER,
    is_required BOOLEAN DEFAULT true,
    explanation TEXT,
    hint TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer Options
CREATE TABLE public.assessment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_value TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio')),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    score_points INTEGER DEFAULT 0,
    score_weight DECIMAL DEFAULT 1.0,
    order_index INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Attempts
CREATE TABLE public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_session_id TEXT,
    device_fingerprint TEXT,
    ip_address INET,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    time_taken INTEGER,
    time_limit INTEGER,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')) DEFAULT 'in_progress',
    total_questions INTEGER,
    questions_answered INTEGER DEFAULT 0,
    score DECIMAL,
    max_score INTEGER,
    percentage DECIMAL,
    passed BOOLEAN,
    responses JSONB DEFAULT '{}',
    detailed_results JSONB DEFAULT '{}',
    browser_info JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Question Responses
CREATE TABLE public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    response_text TEXT,
    selected_option_ids UUID[],
    response_value JSONB,
    media_url TEXT,
    media_type TEXT,
    points_earned DECIMAL DEFAULT 0,
    is_correct BOOLEAN,
    time_taken INTEGER,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    feedback_shown TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Analytics
CREATE TABLE public.assessment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    completed_attempts INTEGER DEFAULT 0,
    passed_attempts INTEGER DEFAULT 0,
    average_score DECIMAL,
    median_score DECIMAL,
    highest_score DECIMAL,
    lowest_score DECIMAL,
    average_time_seconds INTEGER,
    median_time_seconds INTEGER,
    question_analytics JSONB DEFAULT '{}',
    popular_wrong_answers JSONB DEFAULT '{}',
    difficulty_analysis JSONB DEFAULT '{}',
    demographic_breakdown JSONB DEFAULT '{}',
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Build Jobs
CREATE TABLE public.ai_build_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('assessment', 'course', 'exploration', 'questions')),
    target_type TEXT,
    ai_provider TEXT NOT NULL,
    ai_model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    content_specs JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    generated_content JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    created_assessment_id UUID REFERENCES public.assessments(id),
    created_course_id UUID,
    created_exploration_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    learning_objectives TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    estimated_duration_hours INTEGER,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    requires_enrollment BOOLEAN DEFAULT false,
    price_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    thumbnail_url TEXT,
    banner_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Modules
CREATE TABLE public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('assessment', 'exploration', 'lesson', 'quiz')),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    exploration_id UUID,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Progress
CREATE TABLE public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    completed_modules UUID[] DEFAULT '{}',
    current_module_id UUID,
    progress_percentage DECIMAL DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    certificate_issued_at TIMESTAMPTZ,
    certificate_url TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(course_id, user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explorations
CREATE TABLE public.explorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL,
    type TEXT DEFAULT 'guided_reflection',
    estimated_time INTEGER DEFAULT 15,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_slug ON public.assessments(slug);
CREATE INDEX IF NOT EXISTS idx_assessments_public ON public.assessments(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON public.assessment_responses(attempt_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_build_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Assessment Types
CREATE POLICY "Assessment types visible to all" ON public.assessment_types
    FOR SELECT USING (true);

-- RLS Policies for Assessments
CREATE POLICY "Public assessments visible to all" ON public.assessments
    FOR SELECT USING (is_public = true AND is_active = true);

-- RLS Policies for Questions
CREATE POLICY "Questions visible for accessible assessments" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_questions.assessment_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

-- RLS Policies for Options
CREATE POLICY "Options visible for accessible questions" ON public.assessment_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_questions q
            JOIN public.assessments a ON q.assessment_id = a.id
            WHERE q.id = assessment_options.question_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

-- RLS Policies for Attempts
CREATE POLICY "Users can view their attempts" ON public.assessment_attempts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    );

CREATE POLICY "Anyone can create attempts for public assessments" ON public.assessment_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_attempts.assessment_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update their own attempts" ON public.assessment_attempts
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    );

-- RLS Policies for Responses
CREATE POLICY "Users can manage their responses" ON public.assessment_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a 
            WHERE a.id = assessment_responses.attempt_id 
            AND (a.user_id = auth.uid() OR (a.user_id IS NULL AND a.visitor_session_id IS NOT NULL))
        )
    );

-- Grant permissions
GRANT SELECT ON public.assessment_types TO anon, authenticated;
GRANT SELECT ON public.assessments TO anon, authenticated;
GRANT SELECT ON public.assessment_questions TO anon, authenticated;
GRANT SELECT ON public.assessment_options TO anon, authenticated;
GRANT ALL ON public.assessment_attempts TO anon, authenticated;
GRANT ALL ON public.assessment_responses TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Database Functions
CREATE OR REPLACE FUNCTION public.verify_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_profile RECORD;
    is_admin_result BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Try user_profiles first, then profiles as fallback
    BEGIN
        SELECT role, is_admin, email
        INTO user_profile
        FROM public.user_profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.id = current_user_id;
        
        IF NOT FOUND THEN
            -- Fallback to profiles table if it exists
            SELECT role, is_admin, email
            INTO user_profile
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
            WHERE p.id = current_user_id;
        END IF;
    EXCEPTION WHEN others THEN
        -- Tables don't exist, check by email only
        SELECT NULL as role, FALSE as is_admin, email
        INTO user_profile
        FROM auth.users
        WHERE id = current_user_id;
    END;
    
    -- Check admin status
    IF user_profile.role = 'admin' THEN
        is_admin_result := TRUE;
    ELSIF user_profile.is_admin = TRUE THEN
        is_admin_result := TRUE;
    ELSIF user_profile.email IN ('admin@newomen.me', 'administrator@newomen.me') THEN
        is_admin_result := TRUE;
    END IF;
    
    RETURN is_admin_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to check admin access
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.verify_admin_status();
END;
$$;

-- Function to start assessment attempt
CREATE OR REPLACE FUNCTION public.start_assessment_attempt(
    p_assessment_id UUID,
    p_visitor_session_id TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_assessment RECORD;
    v_user_id UUID;
    v_attempt_count INTEGER := 0;
    v_question_count INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    
    -- Get assessment
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE id = p_assessment_id
    AND is_active = true
    AND (is_public = true OR created_by = v_user_id);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment not found or not accessible';
    END IF;
    
    -- Check if authentication is required
    IF v_assessment.requires_auth = true AND v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for this assessment';
    END IF;
    
    -- Rate limiting for anonymous users
    IF v_user_id IS NULL AND p_ip_address IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_attempt_count
        FROM public.assessment_attempts
        WHERE assessment_id = p_assessment_id
        AND ip_address = p_ip_address
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF v_attempt_count >= 5 THEN
            RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
        END IF;
    END IF;
    
    -- Calculate attempt number
    SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt_count
    FROM public.assessment_attempts
    WHERE assessment_id = p_assessment_id
    AND (
        (v_user_id IS NOT NULL AND user_id = v_user_id)
        OR (v_user_id IS NULL AND visitor_session_id = p_visitor_session_id)
    );
    
    -- Count total questions
    SELECT COUNT(*)
    INTO v_question_count
    FROM public.assessment_questions
    WHERE assessment_id = p_assessment_id;
    
    -- Create the attempt
    INSERT INTO public.assessment_attempts (
        assessment_id,
        user_id,
        visitor_session_id,
        device_fingerprint,
        ip_address,
        attempt_number,
        total_questions
    )
    VALUES (
        p_assessment_id,
        v_user_id,
        p_visitor_session_id,
        p_device_fingerprint,
        p_ip_address,
        v_attempt_count,
        v_question_count
    )
    RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

-- Function to get public assessments
CREATE OR REPLACE FUNCTION public.get_public_assessments(
    p_type TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assessments JSONB;
    v_total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*)
    INTO v_total_count
    FROM public.assessments
    WHERE is_public = true 
    AND is_active = true
    AND (p_type IS NULL OR type = p_type)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty);
    
    -- Get assessments
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'slug', slug,
            'title', title,
            'description', description,
            'type', type,
            'difficulty', difficulty,
            'estimated_time', estimated_time,
            'is_featured', is_featured,
            'tags', tags,
            'question_count', COALESCE((
                SELECT COUNT(*) 
                FROM public.assessment_questions 
                WHERE assessment_id = assessments.id
            ), 0),
            'attempt_count', 0
        ) ORDER BY 
            is_featured DESC,
            created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) INTO v_assessments
    FROM public.assessments
    WHERE is_public = true 
    AND is_active = true
    AND (p_type IS NULL OR type = p_type)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty);
    
    RETURN jsonb_build_object(
        'assessments', COALESCE(v_assessments, '[]'::jsonb),
        'total_count', v_total_count,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;

-- Function to get assessment with questions
CREATE OR REPLACE FUNCTION public.get_assessment_with_questions(
    p_assessment_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assessment RECORD;
    v_questions JSONB;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Get assessment by slug
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE slug = p_assessment_slug
    AND is_active = true
    AND (
        is_public = true 
        OR created_by = v_user_id 
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment not found or not accessible';
    END IF;
    
    -- Get questions with options
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'question_text', q.question_text,
            'question_type', q.question_type,
            'order_index', q.order_index,
            'points', q.points,
            'time_limit', q.time_limit,
            'is_required', q.is_required,
            'hint', q.hint,
            'media_type', q.media_type,
            'media_url', q.media_url,
            'media_caption', q.media_caption,
            'options', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', o.id,
                        'option_text', o.option_text,
                        'order_index', o.order_index,
                        'media_url', o.media_url,
                        'media_type', o.media_type
                    ) ORDER BY o.order_index
                )
                FROM public.assessment_options o
                WHERE o.question_id = q.id
            )
        ) ORDER BY q.order_index
    ) INTO v_questions
    FROM public.assessment_questions q
    WHERE q.assessment_id = v_assessment.id;
    
    -- Return assessment with questions
    RETURN jsonb_build_object(
        'id', v_assessment.id,
        'slug', v_assessment.slug,
        'title', v_assessment.title,
        'description', v_assessment.description,
        'instructions', v_assessment.instructions,
        'type', v_assessment.type,
        'difficulty', v_assessment.difficulty,
        'estimated_time', v_assessment.estimated_time,
        'passing_score', v_assessment.passing_score,
        'max_attempts', v_assessment.max_attempts,
        'is_public', v_assessment.is_public,
        'requires_auth', v_assessment.requires_auth,
        'tags', v_assessment.tags,
        'learning_outcomes', v_assessment.learning_outcomes,
        'questions', COALESCE(v_questions, '[]'::jsonb)
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_admin_status() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt(UUID, TEXT, TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_assessments(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_with_questions(TEXT) TO anon, authenticated;

-- Insert assessment types
INSERT INTO public.assessment_types (name, description, category, is_public) VALUES
('Personality Assessment', 'Discover your personality traits and characteristics', 'personality', true),
('Wellness Check', 'Evaluate your overall wellness and lifestyle', 'wellness', true),
('Career Exploration', 'Explore career paths and professional interests', 'career', true),
('Relationship Skills', 'Assess your relationship and communication skills', 'relationships', true),
('Personal Growth', 'Measure your personal development journey', 'growth', true),
('General Knowledge', 'Test your knowledge across various topics', 'general', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample assessments
INSERT INTO public.assessments (
    slug, title, description, instructions, type, difficulty, estimated_time, 
    passing_score, is_public, requires_auth, is_featured, tags, learning_outcomes
) VALUES 
-- Multiple Choice Assessment
('personality-type-indicator', 'Personality Type Indicator', 
 'Discover your core personality traits and how they influence your daily life and relationships.',
 'Answer each question honestly based on your natural preferences. There are no right or wrong answers.',
 'multiple_choice', 'beginner', 15, 70, true, false, true,
 ARRAY['personality', 'self-discovery', 'psychology'],
 ARRAY['Understand your personality type', 'Identify your strengths and preferences']),

-- True/False Assessment
('wellness-lifestyle-check', 'Wellness & Lifestyle Quick Check', 
 'A quick assessment of your current wellness habits and lifestyle choices.',
 'Answer true or false based on your current habits and behaviors.',
 'true_false', 'beginner', 8, 70, true, false, true,
 ARRAY['wellness', 'health', 'lifestyle'],
 ARRAY['Evaluate wellness habits', 'Identify improvement areas']),

-- Short Answer Assessment
('values-exploration', 'Personal Values Exploration', 
 'Reflect deeply on your core values and what drives your decisions.',
 'Take time to think about each question. Write thoughtful, honest responses about your values and priorities.',
 'short_answer', 'intermediate', 30, 70, true, false, false,
 ARRAY['values', 'self-reflection', 'personal-growth'],
 ARRAY['Identify core values', 'Understand value priorities']),

-- Timed Quiz
('general-knowledge-challenge', 'General Knowledge Challenge', 
 'Test your knowledge across various topics in this timed challenge.',
 'You have 15 minutes to answer all questions. Work quickly but carefully.',
 'timed_quiz', 'intermediate', 15, 80, true, false, true,
 ARRAY['knowledge', 'trivia', 'challenge'],
 ARRAY['Test general knowledge', 'Challenge cognitive abilities']),

-- Image Identification
('visual-perception-test', 'Visual Perception & Pattern Recognition', 
 'Test your ability to identify patterns and visual relationships.',
 'Look carefully at each image and identify the correct pattern or relationship.',
 'image_identification', 'intermediate', 15, 75, true, false, false,
 ARRAY['visual-perception', 'patterns', 'cognition'],
 ARRAY['Enhance visual perception', 'Recognize patterns']),

-- Audio Response
('communication-skills-audio', 'Communication Skills Audio Assessment', 
 'Practice your verbal communication skills through audio responses.',
 'Listen to each prompt and respond with clear, thoughtful audio messages.',
 'audio_response', 'intermediate', 25, 70, true, false, false,
 ARRAY['communication', 'speaking', 'verbal-skills'],
 ARRAY['Improve verbal communication', 'Practice speaking skills'])
ON CONFLICT (slug) DO NOTHING;

-- Create sample questions for personality assessment
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'When meeting new people, you tend to:', 'multiple_choice', 0, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator'
ON CONFLICT DO NOTHING;

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'In group settings, you usually:', 'multiple_choice', 1, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator'
ON CONFLICT DO NOTHING;

-- Create options for personality questions
INSERT INTO public.assessment_options (question_id, option_text, order_index, score_points)
SELECT q.id, 'Feel energized and seek out conversations', 0, 1
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'personality-type-indicator' AND q.order_index = 0
ON CONFLICT DO NOTHING;

INSERT INTO public.assessment_options (question_id, option_text, order_index, score_points)
SELECT q.id, 'Feel a bit overwhelmed and prefer smaller groups', 1, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'personality-type-indicator' AND q.order_index = 0
ON CONFLICT DO NOTHING;

-- Create questions for wellness check
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I exercise regularly (at least 3 times per week)', 'true_false', 0, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check'
ON CONFLICT DO NOTHING;

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I get 7-8 hours of quality sleep most nights', 'true_false', 1, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check'
ON CONFLICT DO NOTHING;

-- Create True/False options
INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'True', true, 0, 1
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'wellness-lifestyle-check'
ON CONFLICT DO NOTHING;

INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'False', false, 1, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'wellness-lifestyle-check'
ON CONFLICT DO NOTHING;

-- Create questions for values exploration
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'What are the three most important values that guide your life decisions? Explain why each is meaningful to you.', 'short_answer', 0, 5
FROM public.assessments a WHERE a.slug = 'values-exploration'
ON CONFLICT DO NOTHING;

-- Initialize analytics for all assessments
INSERT INTO public.assessment_analytics (assessment_id, total_attempts, completed_attempts, passed_attempts)
SELECT id, 0, 0, 0 FROM public.assessments WHERE is_public = true
ON CONFLICT DO NOTHING;