-- Complete Assessment System Migration
-- Based on reference.md requirements

-- Drop existing tables if they exist (cascade to handle dependencies)
DROP TABLE IF EXISTS public.assessment_results CASCADE;
DROP TABLE IF EXISTS public.assessment_options CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;

-- Create assessments table (master record)
CREATE TABLE public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'intermediate',
    category text DEFAULT 'general',
    ai_provider text,
    ai_model text,
    ai_prompt text,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_questions table
CREATE TABLE public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image')),
    position integer NOT NULL,
    points integer DEFAULT 1,
    explanation text,
    media_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_options table
CREATE TABLE public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    position integer NOT NULL,
    score_value integer DEFAULT 0,
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_results table (for signed-in users)
CREATE TABLE public.assessment_results (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    score numeric,
    total_points integer,
    percentage numeric,
    answers jsonb,
    time_taken integer, -- in seconds
    completed boolean DEFAULT false,
    submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Create admin_logs table for tracking AI generation
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_assessments_visibility ON public.assessments(visibility);
CREATE INDEX idx_assessments_type ON public.assessments(type);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);
CREATE INDEX idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX idx_questions_position ON public.assessment_questions(assessment_id, position);
CREATE INDEX idx_options_question ON public.assessment_options(question_id);
CREATE INDEX idx_options_position ON public.assessment_options(question_id, position);
CREATE INDEX idx_results_user ON public.assessment_results(user_id);
CREATE INDEX idx_results_assessment ON public.assessment_results(assessment_id);
CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id);

-- Enable RLS on all tables
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public assessments visible to all (including anonymous users)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Admin can manage all assessments
CREATE POLICY "Admin can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Users can view their own private assessments
CREATE POLICY "Users can view own assessments"
ON public.assessments
FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Assessment questions: visible based on assessment visibility
CREATE POLICY "Questions visible for accessible assessments"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments 
        WHERE assessments.id = assessment_questions.assessment_id 
        AND (
            assessments.visibility = 'public' 
            OR assessments.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        )
    )
);

-- Admin can manage all questions
CREATE POLICY "Admin can manage questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Assessment options: visible based on question/assessment visibility
CREATE POLICY "Options visible for accessible questions"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions q
        JOIN public.assessments a ON q.assessment_id = a.id
        WHERE q.id = assessment_options.question_id 
        AND (
            a.visibility = 'public' 
            OR a.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        )
    )
);

-- Admin can manage all options
CREATE POLICY "Admin can manage options"
ON public.assessment_options
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Assessment results: users can only see their own results
CREATE POLICY "Users can manage own results"
ON public.assessment_results
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all results
CREATE POLICY "Admin can view all results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Admin logs: only admins can access
CREATE POLICY "Admin logs access"
ON public.admin_logs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Grant permissions
GRANT SELECT ON public.assessments TO anon;
GRANT SELECT ON public.assessment_questions TO anon;
GRANT SELECT ON public.assessment_options TO anon;
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;
GRANT ALL ON public.admin_logs TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessments updated_at
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();