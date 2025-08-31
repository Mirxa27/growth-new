-- Create assessment database schema for AI-generated assessments
-- This schema supports both free public assessments and user assessments

-- Main assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    ai_provider text,
    ai_model text,
    ai_prompt text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Assessment questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image')),
    position integer NOT NULL,
    media_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);

-- Assessment options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL,
    feedback text,
    position integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);

-- RLS Policies
-- Public assessments visible to all users (including anonymous)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Admin can manage all assessments
CREATE POLICY "Authenticated users can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Questions policies
CREATE POLICY "Questions visible with assessment"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments 
        WHERE id = assessment_id AND visibility = 'public'
    )
    OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can manage questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Options policies  
CREATE POLICY "Options visible with questions"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions q
        JOIN public.assessments a ON a.id = q.assessment_id
        WHERE q.id = question_id AND a.visibility = 'public'
    )
    OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can manage options"
ON public.assessment_options
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Stored procedure to create assessment with questions atomically
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _ai_provider text,
  _ai_model text,
  _ai_prompt text,
  _questions jsonb
) RETURNS bigint AS $$
DECLARE
  _assessment_id bigint;
  _question jsonb;
  _question_id bigint;
  _option jsonb;
BEGIN
  -- Insert main assessment
  INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
  VALUES (_title, _description, _type, _visibility, _ai_provider, _ai_model, _ai_prompt)
  RETURNING id INTO _assessment_id;

  -- Insert questions and options
  FOR _question IN SELECT * FROM jsonb_array_elements(_questions) LOOP
    INSERT INTO public.assessment_questions (
      assessment_id, 
      question_text, 
      question_type, 
      position
    )
    VALUES (
      _assessment_id,
      _question->>'question_text',
      _question->>'question_type',
      (_question->>'position')::int
    )
    RETURNING id INTO _question_id;

    -- Insert options for multiple choice questions
    IF _question->>'question_type' = 'multiple_choice' AND _question ? 'options' THEN
      FOR _option IN SELECT * FROM jsonb_array_elements(_question->'options') LOOP
        INSERT INTO public.assessment_options (
          question_id,
          option_text,
          is_correct,
          position
        ) VALUES (
          _question_id,
          _option->>'option_text',
          (_option->>'is_correct')::boolean,
          (_option->>'position')::int
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full assessment with questions and options
CREATE OR REPLACE FUNCTION public.get_assessment_with_questions(assessment_id_param bigint)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'title', a.title,
    'description', a.description,
    'type', a.type,
    'visibility', a.visibility,
    'created_at', a.created_at,
    'questions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_text', q.question_text,
          'question_type', q.question_type,
          'position', q.position,
          'media_url', q.media_url,
          'options', q_options.options
        ) ORDER BY q.position
      ) FILTER (WHERE q.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.assessments a
  LEFT JOIN public.assessment_questions q ON a.id = q.assessment_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'option_text', o.option_text,
          'is_correct', o.is_correct,
          'feedback', o.feedback,
          'position', o.position
        ) ORDER BY o.position
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'::jsonb
    ) as options
    FROM public.assessment_options o
    WHERE o.question_id = q.id
  ) q_options ON true
  WHERE a.id = assessment_id_param
  GROUP BY a.id, a.title, a.description, a.type, a.visibility, a.created_at;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample free assessments
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES
  ('General Knowledge Quiz', 'A short 5-question general knowledge quiz accessible to everyone', 'quiz', 'public', 'openai', 'gpt-4o-mini', 'Generate a 5-question general-knowledge quiz.'),
  ('Personality Assessment', 'Discover your personality traits through this comprehensive assessment', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a personality assessment with insightful questions.'),
  ('Mindfulness Exploration', 'Explore your mindfulness practices and awareness levels', 'exploration', 'public', 'openai', 'gpt-4o-mini', 'Design a mindfulness exploration with reflective questions.'),
  ('Career Readiness Test', 'Assess your readiness for career advancement and growth', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a career readiness assessment.'),
  ('Emotional Intelligence Quiz', 'Measure your emotional intelligence and social awareness', 'quiz', 'public', 'openai', 'gpt-4o-mini', 'Generate an emotional intelligence quiz.'),
  ('Learning Styles Assessment', 'Identify your preferred learning style and study methods', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a learning styles assessment.');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();