-- Core Assessment System
-- Database schema for comprehensive assessment, quiz, exploration, and course management

-- 1. Main assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    ai_provider text,
    ai_model text,
    ai_prompt text,
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
    estimated_duration integer DEFAULT 15, -- minutes
    passing_score numeric DEFAULT 70.0,
    max_attempts integer DEFAULT 3,
    is_featured boolean DEFAULT false,
    category text DEFAULT 'general',
    tags text[] DEFAULT '{}',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 2. Assessment questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image','scale','boolean')),
    position integer NOT NULL,
    media_url text,
    points integer DEFAULT 1,
    explanation text,
    is_required boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_position ON public.assessment_questions(assessment_id, position);

-- 3. Assessment options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    feedback text,
    position integer NOT NULL,
    score_value numeric DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_options_position ON public.assessment_options(question_id, position);

-- 4. Assessment results table (for signed-in users)
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    visitor_session_id text, -- for anonymous users
    score numeric,
    percentage numeric,
    passed boolean DEFAULT false,
    time_taken integer, -- seconds
    answers jsonb,
    result_data jsonb DEFAULT '{}',
    started_at timestamptz DEFAULT now(),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT assessment_results_user_check CHECK (
        (user_id IS NOT NULL AND visitor_session_id IS NULL) OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
);

-- Enable RLS and create indexes
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_results_user ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment ON public.assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_visitor ON public.assessment_results(visitor_session_id);

-- 5. Assessment attempts table (for tracking multiple attempts)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    visitor_session_id text,
    attempt_number integer NOT NULL DEFAULT 1,
    status text CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    current_question integer DEFAULT 1,
    metadata jsonb DEFAULT '{}',
    CONSTRAINT assessment_attempts_user_check CHECK (
        (user_id IS NOT NULL AND visitor_session_id IS NULL) OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
);

-- Enable RLS and create indexes
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_visitor ON public.assessment_attempts(visitor_session_id);

-- 6. Updated trigger for timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to assessments
CREATE TRIGGER assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. RLS Policies

-- Public assessments visible to all (including anonymous users)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Authenticated users can view all assessments they have access to
CREATE POLICY "Users can view accessible assessments"
ON public.assessments
FOR SELECT TO authenticated
USING (visibility = 'public' OR created_by = auth.uid());

-- Admin function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = $1 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can manage all assessments
CREATE POLICY "Admins can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment questions policies
CREATE POLICY "Public assessment questions visible to all"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = assessment_id 
        AND a.visibility = 'public'
    )
);

CREATE POLICY "Users can view accessible assessment questions"
ON public.assessment_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = assessment_id 
        AND (a.visibility = 'public' OR a.created_by = auth.uid())
    )
);

CREATE POLICY "Admins can manage assessment questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment options policies
CREATE POLICY "Public assessment options visible to all"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions aq
        JOIN public.assessments a ON a.id = aq.assessment_id
        WHERE aq.id = question_id 
        AND a.visibility = 'public'
    )
);

CREATE POLICY "Users can view accessible assessment options"
ON public.assessment_options
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions aq
        JOIN public.assessments a ON a.id = aq.assessment_id
        WHERE aq.id = question_id 
        AND (a.visibility = 'public' OR a.created_by = auth.uid())
    )
);

CREATE POLICY "Admins can manage assessment options"
ON public.assessment_options
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment results policies (users can only see their own results)
CREATE POLICY "Users can view their own results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own results"
ON public.assessment_results
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Visitors can create anonymous results"
ON public.assessment_results
FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Admins can view all results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (is_admin());

-- Assessment attempts policies
CREATE POLICY "Users can manage their own attempts"
ON public.assessment_attempts
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Visitors can create anonymous attempts"
ON public.assessment_attempts
FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Visitors can update their attempts"
ON public.assessment_attempts
FOR UPDATE TO anon
USING (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Admins can view all attempts"
ON public.assessment_attempts
FOR SELECT TO authenticated
USING (is_admin());

-- 8. Stored procedure for creating assessments with questions atomically
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
    _title text,
    _description text,
    _type text,
    _visibility text,
    _difficulty text DEFAULT 'intermediate',
    _category text DEFAULT 'general',
    _ai_provider text DEFAULT NULL,
    _ai_model text DEFAULT NULL,
    _ai_prompt text DEFAULT NULL,
    _questions jsonb DEFAULT '[]'::jsonb,
    _created_by uuid DEFAULT auth.uid()
) RETURNS bigint AS $$
DECLARE
    _assessment_id bigint;
    _question_id bigint;
    q jsonb;
    opt jsonb;
    question_position integer := 1;
    option_position integer;
BEGIN
    -- Insert the main assessment
    INSERT INTO public.assessments (
        title, description, type, visibility, difficulty, category,
        ai_provider, ai_model, ai_prompt, created_by
    )
    VALUES (
        _title, _description, _type, _visibility, _difficulty, _category,
        _ai_provider, _ai_model, _ai_prompt, _created_by
    )
    RETURNING id INTO _assessment_id;

    -- Insert questions if provided
    FOR q IN SELECT * FROM jsonb_array_elements(_questions) LOOP
        INSERT INTO public.assessment_questions (
            assessment_id, question_text, question_type, position,
            points, explanation, is_required
        )
        VALUES (
            _assessment_id,
            q->>'question_text',
            COALESCE(q->>'question_type', 'multiple_choice'),
            COALESCE((q->>'position')::integer, question_position),
            COALESCE((q->>'points')::integer, 1),
            q->>'explanation',
            COALESCE((q->>'is_required')::boolean, true)
        )
        RETURNING id INTO _question_id;

        -- Insert options for multiple choice questions
        IF q->>'question_type' = 'multiple_choice' AND q ? 'options' THEN
            option_position := 1;
            FOR opt IN SELECT * FROM jsonb_array_elements(q->'options') LOOP
                INSERT INTO public.assessment_options (
                    question_id, option_text, is_correct, position, feedback, score_value
                )
                VALUES (
                    _question_id,
                    opt->>'option_text',
                    COALESCE((opt->>'is_correct')::boolean, false),
                    COALESCE((opt->>'position')::integer, option_position),
                    opt->>'feedback',
                    COALESCE((opt->>'score_value')::numeric, 0)
                );
                option_position := option_position + 1;
            END LOOP;
        END IF;

        question_position := question_position + 1;
    END LOOP;

    RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_assessment_with_questions TO authenticated;

-- 9. Function to calculate assessment score
CREATE OR REPLACE FUNCTION public.calculate_assessment_score(
    _assessment_id bigint,
    _answers jsonb
) RETURNS jsonb AS $$
DECLARE
    total_points integer := 0;
    earned_points integer := 0;
    total_questions integer := 0;
    correct_answers integer := 0;
    question_record record;
    user_answer text;
    correct_option_id bigint;
    percentage numeric;
    passed boolean;
    passing_score numeric;
BEGIN
    -- Get assessment details
    SELECT assessments.passing_score INTO passing_score
    FROM public.assessments
    WHERE id = _assessment_id;

    -- Calculate score for each question
    FOR question_record IN 
        SELECT q.id, q.points, q.question_type
        FROM public.assessment_questions q
        WHERE q.assessment_id = _assessment_id
        ORDER BY q.position
    LOOP
        total_questions := total_questions + 1;
        total_points := total_points + question_record.points;
        
        -- Get user's answer for this question
        user_answer := _answers->>question_record.id::text;
        
        IF question_record.question_type = 'multiple_choice' THEN
            -- Find the correct option
            SELECT id INTO correct_option_id
            FROM public.assessment_options
            WHERE question_id = question_record.id AND is_correct = true
            LIMIT 1;
            
            -- Check if user's answer matches correct option
            IF user_answer = correct_option_id::text THEN
                earned_points := earned_points + question_record.points;
                correct_answers := correct_answers + 1;
            END IF;
        END IF;
    END LOOP;

    -- Calculate percentage
    IF total_points > 0 THEN
        percentage := (earned_points::numeric / total_points::numeric) * 100;
    ELSE
        percentage := 0;
    END IF;

    -- Determine if passed
    passed := percentage >= COALESCE(passing_score, 70);

    RETURN jsonb_build_object(
        'total_points', total_points,
        'earned_points', earned_points,
        'total_questions', total_questions,
        'correct_answers', correct_answers,
        'percentage', percentage,
        'passed', passed,
        'score_breakdown', _answers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_assessment_score TO authenticated, anon;

-- 10. Insert sample free assessments
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, estimated_duration) VALUES
('Personal Growth Assessment', 'Discover your current stage in personal development and identify areas for growth.', 'quiz', 'public', 'beginner', 'growth', 15),
('Wellness Check-Up', 'Evaluate your overall wellness across physical, mental, and emotional dimensions.', 'quiz', 'public', 'beginner', 'wellness', 12),
('Communication Style Quiz', 'Understand your natural communication patterns and how to improve them.', 'quiz', 'public', 'intermediate', 'relationships', 10),
('Stress Management Assessment', 'Learn about your stress patterns and discover effective coping strategies.', 'quiz', 'public', 'beginner', 'wellness', 8),
('Career Alignment Check', 'Explore how well your current path aligns with your values and interests.', 'quiz', 'public', 'intermediate', 'career', 18),
('Mindfulness Awareness Test', 'Assess your present-moment awareness and mindfulness practices.', 'quiz', 'public', 'beginner', 'spirituality', 10);

-- Add sample questions for the Personal Growth Assessment
WITH growth_assessment AS (
    SELECT id FROM public.assessments WHERE title = 'Personal Growth Assessment' LIMIT 1
)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, points)
SELECT 
    ga.id,
    unnest(ARRAY[
        'How often do you actively seek feedback on your personal development?',
        'When faced with challenges, your typical response is to:',
        'How comfortable are you with stepping outside your comfort zone?',
        'Your approach to setting personal goals is:',
        'How do you typically handle setbacks or failures?'
    ]),
    'multiple_choice',
    generate_series(1, 5),
    1
FROM growth_assessment ga;

-- Add options for the first question
WITH first_question AS (
    SELECT q.id FROM public.assessment_questions q
    JOIN public.assessments a ON a.id = q.assessment_id
    WHERE a.title = 'Personal Growth Assessment' AND q.position = 1
)
INSERT INTO public.assessment_options (question_id, option_text, is_correct, position, score_value)
SELECT 
    fq.id,
    unnest(ARRAY[
        'Rarely - I prefer to figure things out on my own',
        'Sometimes - when I remember to ask',
        'Often - I regularly seek input from trusted sources',
        'Always - I actively create opportunities for feedback'
    ]),
    unnest(ARRAY[false, false, true, true]),
    generate_series(1, 4),
    unnest(ARRAY[0, 1, 2, 3])
FROM first_question fq;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_visibility ON public.assessments(visibility);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_category ON public.assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_featured ON public.assessments(is_featured) WHERE is_featured = true;

-- Function to generate visitor session ID
CREATE OR REPLACE FUNCTION public.generate_visitor_session()
RETURNS text AS $$
BEGIN
    RETURN 'visitor_' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.generate_visitor_session TO anon, authenticated;
