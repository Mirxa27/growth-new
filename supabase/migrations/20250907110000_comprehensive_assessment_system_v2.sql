-- Comprehensive Assessment System v2
-- Supports anonymous assessments, authenticated assessments, courses, and AI generation
-- Consolidates all assessment-related functionality

-- Drop existing tables to avoid conflicts (be careful in production)
DROP TABLE IF EXISTS public.assessment_attempts CASCADE;
DROP TABLE IF EXISTS public.assessment_results CASCADE;
DROP TABLE IF EXISTS public.assessment_responses CASCADE;
DROP TABLE IF EXISTS public.assessment_options CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.assessment_types CASCADE;
DROP TABLE IF EXISTS public.assessment_analytics CASCADE;
DROP TABLE IF EXISTS public.ai_build_jobs CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.explorations CASCADE;

-- Assessment Types (categories for organization)
CREATE TABLE public.assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('personality', 'wellness', 'career', 'relationships', 'growth', 'spirituality', 'skills', 'lifestyle', 'general')),
    icon TEXT,
    color TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false, -- true for visitor assessments
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main Assessments Table
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- for URLs like /assessment/personality-type-indicator
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    assessment_type_id UUID REFERENCES public.assessment_types(id) ON DELETE SET NULL,
    
    -- Assessment Configuration
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'timed_quiz', 'image_identification', 'audio_response')) DEFAULT 'multiple_choice',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_time INTEGER DEFAULT 10, -- minutes
    passing_score INTEGER DEFAULT 70, -- percentage
    max_attempts INTEGER DEFAULT 0, -- 0 = unlimited
    
    -- Visibility and Access Control
    is_public BOOLEAN NOT NULL DEFAULT false, -- true for anonymous access
    requires_auth BOOLEAN NOT NULL DEFAULT true, -- false for anonymous assessments
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    learning_outcomes TEXT[],
    prerequisites TEXT[],
    
    -- AI Generation Info
    ai_generated BOOLEAN DEFAULT false,
    ai_provider TEXT,
    ai_model TEXT,
    ai_prompt TEXT,
    
    -- Tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions for Assessments
CREATE TABLE public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    
    -- Question Content
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'scale', 'image_upload', 'audio_response')) DEFAULT 'multiple_choice',
    
    -- Media Support
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
    media_url TEXT,
    media_caption TEXT,
    
    -- Question Configuration
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER DEFAULT 1,
    time_limit INTEGER, -- seconds, for timed questions
    is_required BOOLEAN DEFAULT true,
    
    -- Feedback and Explanation
    explanation TEXT,
    hint TEXT,
    
    -- Metadata
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer Options (for multiple choice, true/false, etc.)
CREATE TABLE public.assessment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    
    -- Option Content
    option_text TEXT NOT NULL,
    option_value TEXT, -- for scoring/categorization
    
    -- Media Support
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio')),
    
    -- Scoring
    is_correct BOOLEAN NOT NULL DEFAULT false,
    score_points INTEGER DEFAULT 0,
    score_weight DECIMAL DEFAULT 1.0,
    
    -- Organization
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- Feedback
    feedback TEXT, -- shown when this option is selected
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Attempts (for tracking individual sessions)
CREATE TABLE public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    
    -- User Identification
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for anonymous
    visitor_session_id TEXT, -- for anonymous tracking
    device_fingerprint TEXT, -- for rate limiting
    ip_address INET,
    
    -- Attempt Tracking
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    
    -- Timing
    time_taken INTEGER, -- seconds
    time_limit INTEGER, -- seconds, if applicable
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')) DEFAULT 'in_progress',
    
    -- Results
    total_questions INTEGER,
    questions_answered INTEGER DEFAULT 0,
    score DECIMAL,
    max_score INTEGER,
    percentage DECIMAL,
    passed BOOLEAN,
    
    -- Data Storage
    responses JSONB DEFAULT '{}', -- question_id -> answer mapping
    detailed_results JSONB DEFAULT '{}', -- detailed scoring breakdown
    
    -- Metadata
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
    
    -- Response Content
    response_text TEXT,
    selected_option_ids UUID[], -- for multiple choice
    response_value JSONB, -- flexible storage for any response type
    
    -- Media Responses
    media_url TEXT, -- for uploaded images/audio
    media_type TEXT,
    
    -- Scoring
    points_earned DECIMAL DEFAULT 0,
    is_correct BOOLEAN,
    
    -- Timing
    time_taken INTEGER, -- seconds spent on this question
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Feedback Given
    feedback_shown TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Analytics
CREATE TABLE public.assessment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    
    -- Attempt Statistics
    total_attempts INTEGER DEFAULT 0,
    completed_attempts INTEGER DEFAULT 0,
    passed_attempts INTEGER DEFAULT 0,
    
    -- Scoring Statistics
    average_score DECIMAL,
    median_score DECIMAL,
    highest_score DECIMAL,
    lowest_score DECIMAL,
    
    -- Timing Statistics
    average_time_seconds INTEGER,
    median_time_seconds INTEGER,
    
    -- Question-Level Analytics
    question_analytics JSONB DEFAULT '{}', -- question_id -> stats
    popular_wrong_answers JSONB DEFAULT '{}',
    difficulty_analysis JSONB DEFAULT '{}',
    
    -- Demographic Insights (if available)
    demographic_breakdown JSONB DEFAULT '{}',
    
    -- Last Updated
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Build Jobs (for tracking AI-generated content)
CREATE TABLE public.ai_build_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Job Configuration
    job_type TEXT NOT NULL CHECK (job_type IN ('assessment', 'course', 'exploration', 'questions')),
    target_type TEXT, -- specific type being generated
    
    -- AI Parameters
    ai_provider TEXT NOT NULL,
    ai_model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    parameters JSONB DEFAULT '{}', -- temperature, max_tokens, etc.
    
    -- Content Specifications
    content_specs JSONB NOT NULL, -- target audience, difficulty, length, etc.
    
    -- Job Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    progress INTEGER DEFAULT 0, -- percentage
    
    -- Results
    generated_content JSONB,
    error_message TEXT,
    
    -- Processing Info
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    
    -- Output References
    created_assessment_id UUID REFERENCES public.assessments(id),
    created_course_id UUID,
    created_exploration_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses (collections of assessments and explorations)
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Course Structure
    learning_objectives TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    estimated_duration_hours INTEGER,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    
    -- Visibility
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    requires_enrollment BOOLEAN DEFAULT false,
    
    -- Pricing (if applicable)
    price_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    -- Media
    thumbnail_url TEXT,
    banner_url TEXT,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Modules (chapters/sections within courses)
CREATE TABLE public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- Module Content
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('assessment', 'exploration', 'lesson', 'quiz')),
    
    -- References
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    exploration_id UUID,
    
    -- Organization
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    
    -- Completion Criteria
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Progress Tracking
CREATE TABLE public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress Tracking
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    
    -- Module Progress
    completed_modules UUID[] DEFAULT '{}',
    current_module_id UUID,
    
    -- Overall Progress
    progress_percentage DECIMAL DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    
    -- Completion Status
    is_completed BOOLEAN DEFAULT false,
    certificate_issued_at TIMESTAMPTZ,
    certificate_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(course_id, user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explorations (guided learning experiences)
CREATE TABLE public.explorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL, -- structured content data
    
    -- Configuration
    type TEXT DEFAULT 'guided_reflection',
    estimated_time INTEGER DEFAULT 15, -- minutes
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    
    -- Visibility
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_assessments_slug ON public.assessments(slug);
CREATE INDEX idx_assessments_type ON public.assessments(type);
CREATE INDEX idx_assessments_public ON public.assessments(is_public) WHERE is_public = true;
CREATE INDEX idx_assessments_featured ON public.assessments(is_featured) WHERE is_featured = true;
CREATE INDEX idx_assessments_difficulty ON public.assessments(difficulty);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);

CREATE INDEX idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX idx_questions_order ON public.assessment_questions(assessment_id, order_index);
CREATE INDEX idx_questions_type ON public.assessment_questions(question_type);

CREATE INDEX idx_options_question ON public.assessment_options(question_id);
CREATE INDEX idx_options_order ON public.assessment_options(question_id, order_index);
CREATE INDEX idx_options_correct ON public.assessment_options(is_correct);

CREATE INDEX idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_user ON public.assessment_attempts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_attempts_visitor ON public.assessment_attempts(visitor_session_id) WHERE visitor_session_id IS NOT NULL;
CREATE INDEX idx_attempts_status ON public.assessment_attempts(status);
CREATE INDEX idx_attempts_ip ON public.assessment_attempts(ip_address, created_at);

CREATE INDEX idx_responses_attempt ON public.assessment_responses(attempt_id);
CREATE INDEX idx_responses_question ON public.assessment_responses(question_id);

CREATE INDEX idx_analytics_assessment ON public.assessment_analytics(assessment_id);

CREATE INDEX idx_ai_jobs_admin ON public.ai_build_jobs(admin_id);
CREATE INDEX idx_ai_jobs_status ON public.ai_build_jobs(status);
CREATE INDEX idx_ai_jobs_type ON public.ai_build_jobs(job_type);

CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_published ON public.courses(is_published) WHERE is_published = true;

CREATE INDEX idx_course_modules_course ON public.course_modules(course_id);
CREATE INDEX idx_course_modules_order ON public.course_modules(course_id, order_index);

CREATE INDEX idx_course_progress_user ON public.course_progress(user_id);
CREATE INDEX idx_course_progress_course ON public.course_progress(course_id);

CREATE INDEX idx_explorations_slug ON public.explorations(slug);
CREATE INDEX idx_explorations_public ON public.explorations(is_public) WHERE is_public = true;

-- Enable Row Level Security
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

-- RLS Policies for Assessment Types
CREATE POLICY "Assessment types visible to all" ON public.assessment_types
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage assessment types" ON public.assessment_types
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Assessments
CREATE POLICY "Public assessments visible to all" ON public.assessments
    FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Users can view their assessments" ON public.assessments
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all assessments" ON public.assessments
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Questions
CREATE POLICY "Questions visible for accessible assessments" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_questions.assessment_id 
            AND (a.is_public = true OR a.created_by = auth.uid() OR public.check_admin_access())
        )
    );

CREATE POLICY "Admins can manage questions" ON public.assessment_questions
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Options
CREATE POLICY "Options visible for accessible questions" ON public.assessment_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_questions q
            JOIN public.assessments a ON q.assessment_id = a.id
            WHERE q.id = assessment_options.question_id 
            AND (a.is_public = true OR a.created_by = auth.uid() OR public.check_admin_access())
        )
    );

CREATE POLICY "Admins can manage options" ON public.assessment_options
    FOR ALL USING (public.check_admin_access());

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

CREATE POLICY "Admins can view all attempts" ON public.assessment_attempts
    FOR SELECT USING (public.check_admin_access());

-- RLS Policies for Responses
CREATE POLICY "Users can manage their responses" ON public.assessment_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a 
            WHERE a.id = assessment_responses.attempt_id 
            AND (a.user_id = auth.uid() OR (a.user_id IS NULL AND a.visitor_session_id IS NOT NULL))
        )
    );

CREATE POLICY "Admins can view all responses" ON public.assessment_responses
    FOR SELECT USING (public.check_admin_access());

-- RLS Policies for Analytics (Admin only)
CREATE POLICY "Admins can manage analytics" ON public.assessment_analytics
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for AI Build Jobs (Admin only)
CREATE POLICY "Admins can manage AI jobs" ON public.ai_build_jobs
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Courses
CREATE POLICY "Published courses visible to all" ON public.courses
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view their courses" ON public.courses
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Course Modules
CREATE POLICY "Modules visible for accessible courses" ON public.course_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = course_modules.course_id 
            AND (c.is_published = true OR c.created_by = auth.uid() OR public.check_admin_access())
        )
    );

CREATE POLICY "Admins can manage course modules" ON public.course_modules
    FOR ALL USING (public.check_admin_access());

-- RLS Policies for Course Progress
CREATE POLICY "Users can view their progress" ON public.course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their progress" ON public.course_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their progress" ON public.course_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.course_progress
    FOR SELECT USING (public.check_admin_access());

-- RLS Policies for Explorations
CREATE POLICY "Public explorations visible to all" ON public.explorations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their explorations" ON public.explorations
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage explorations" ON public.explorations
    FOR ALL USING (public.check_admin_access());

-- Grant permissions
GRANT SELECT ON public.assessment_types TO anon, authenticated;
GRANT SELECT ON public.assessments TO anon, authenticated;
GRANT SELECT ON public.assessment_questions TO anon, authenticated;
GRANT SELECT ON public.assessment_options TO anon, authenticated;
GRANT ALL ON public.assessment_attempts TO anon, authenticated;
GRANT ALL ON public.assessment_responses TO anon, authenticated;
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT SELECT ON public.course_modules TO anon, authenticated;
GRANT SELECT ON public.explorations TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create triggers for updated_at columns
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at
    BEFORE UPDATE ON public.assessment_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_attempts_updated_at
    BEFORE UPDATE ON public.assessment_attempts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_build_jobs_updated_at
    BEFORE UPDATE ON public.ai_build_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
    BEFORE UPDATE ON public.course_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_explorations_updated_at
    BEFORE UPDATE ON public.explorations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();