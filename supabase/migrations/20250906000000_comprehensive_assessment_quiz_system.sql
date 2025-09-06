-- Comprehensive Assessment and Quiz System with AI-Driven Results
-- Creates a robust system for 10-15 question assessments with personalized feedback

BEGIN;

-- Assessment Categories Table
CREATE TABLE public.assessment_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main Assessments Table
CREATE TABLE public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES assessment_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('personality', 'skills', 'knowledge', 'wellness', 'career', 'relationships')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_duration INTEGER DEFAULT 10, -- minutes
    max_attempts INTEGER DEFAULT 0, -- 0 means unlimited
    pass_score INTEGER DEFAULT 70, -- percentage
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'premium')),
    ai_provider TEXT DEFAULT 'openai',
    ai_model TEXT DEFAULT 'gpt-4',
    ai_prompt TEXT DEFAULT 'Analyze these assessment responses and provide personalized insights.',
    instructions TEXT DEFAULT 'Answer each question honestly. There are no right or wrong answers.',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Questions Table
CREATE TABLE public.assessment_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'single_choice', 'true_false', 'scale', 'ranking')),
    position INTEGER NOT NULL,
    required BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 1,
    explanation TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assessment_id, position)
);

-- Assessment Question Options Table  
CREATE TABLE public.assessment_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    position INTEGER NOT NULL,
    score_value INTEGER DEFAULT 1,
    feedback TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(question_id, position)
);

-- User Assessment Attempts Table
CREATE TABLE public.user_assessment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    raw_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage_score DECIMAL(5,2),
    passed BOOLEAN DEFAULT false,
    responses JSONB DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    personality_type TEXT,
    insights TEXT[],
    recommendations TEXT[],
    strengths TEXT[],
    areas_for_improvement TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, assessment_id, attempt_number)
);

-- Assessment Results Summary Table
CREATE TABLE public.assessment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    attempt_id UUID REFERENCES user_assessment_attempts(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade TEXT,
    personality_type TEXT,
    dominant_traits TEXT[],
    category_scores JSONB DEFAULT '{}',
    ai_feedback TEXT,
    personalized_insights TEXT,
    growth_recommendations TEXT[],
    next_steps TEXT[],
    completion_certificate_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, assessment_id, attempt_id)
);

-- Assessment Analytics Table
CREATE TABLE public.assessment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    average_duration_seconds INTEGER,
    completion_rate DECIMAL(5,2),
    popular_answers JSONB DEFAULT '{}',
    difficulty_analysis JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assessment_id)
);

-- Create indexes for performance
CREATE INDEX idx_assessments_category ON assessments(category_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_active ON assessments(is_active);
CREATE INDEX idx_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX idx_options_question ON assessment_options(question_id);
CREATE INDEX idx_attempts_user ON user_assessment_attempts(user_id);
CREATE INDEX idx_attempts_assessment ON user_assessment_attempts(assessment_id);
CREATE INDEX idx_results_user ON assessment_results(user_id);
CREATE INDEX idx_results_assessment ON assessment_results(assessment_id);

-- Enable Row Level Security
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Assessment categories - public read
CREATE POLICY "Assessment categories are viewable by everyone" 
ON assessment_categories FOR SELECT
USING (true);

-- Assessments - public read for active assessments
CREATE POLICY "Public assessments are viewable by everyone" 
ON assessments FOR SELECT
USING (is_active = true AND visibility = 'public');

-- Assessment questions - readable with assessment
CREATE POLICY "Assessment questions are viewable with assessment" 
ON assessment_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assessments 
        WHERE assessments.id = assessment_questions.assessment_id 
        AND assessments.is_active = true 
        AND assessments.visibility = 'public'
    )
);

-- Assessment options - readable with questions
CREATE POLICY "Assessment options are viewable with questions" 
ON assessment_options FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assessment_questions 
        JOIN assessments ON assessments.id = assessment_questions.assessment_id
        WHERE assessment_questions.id = assessment_options.question_id 
        AND assessments.is_active = true 
        AND assessments.visibility = 'public'
    )
);

-- User attempts - users can view their own
CREATE POLICY "Users can view their own assessment attempts" 
ON user_assessment_attempts FOR SELECT
USING (auth.uid() = user_id);

-- User attempts - users can insert their own
CREATE POLICY "Users can create their own assessment attempts" 
ON user_assessment_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User attempts - users can update their own
CREATE POLICY "Users can update their own assessment attempts" 
ON user_assessment_attempts FOR UPDATE
USING (auth.uid() = user_id);

-- Assessment results - users can view their own
CREATE POLICY "Users can view their own assessment results" 
ON assessment_results FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Assessment results - users can insert their own
CREATE POLICY "Users can create their own assessment results" 
ON assessment_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Assessment analytics - public read
CREATE POLICY "Assessment analytics are public" 
ON assessment_analytics FOR SELECT
USING (true);

-- Admin policies
CREATE POLICY "Admins can manage assessment categories" 
ON assessment_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

CREATE POLICY "Admins can manage assessments" 
ON assessments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

CREATE POLICY "Admins can manage assessment questions" 
ON assessment_questions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

CREATE POLICY "Admins can manage assessment options" 
ON assessment_options FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

CREATE POLICY "Admins can view all attempts" 
ON user_assessment_attempts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

CREATE POLICY "Admins can view all results" 
ON assessment_results FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

-- Insert default assessment categories
INSERT INTO assessment_categories (name, description, icon, color, sort_order) VALUES
('Personality', 'Discover your personality traits and characteristics', '🧠', '#8B5CF6', 1),
('Emotional Intelligence', 'Assess your emotional awareness and social skills', '💝', '#EC4899', 2),
('Career Development', 'Explore your career interests and professional strengths', '💼', '#10B981', 3),
('Relationships', 'Understand your relationship patterns and communication style', '💕', '#F59E0B', 4),
('Personal Growth', 'Evaluate your growth mindset and development areas', '🌱', '#06B6D4', 5),
('Wellness & Lifestyle', 'Assess your well-being and life balance', '🌸', '#F97316', 6),
('Communication Skills', 'Evaluate your communication effectiveness', '🗣️', '#6366F1', 7),
('Leadership Potential', 'Discover your leadership style and capabilities', '👑', '#DC2626', 8);

COMMIT;
