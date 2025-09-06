-- Stored Procedures for Assessment System

-- Function to create assessment with questions atomically
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
  _question jsonb;
  _question_id bigint;
  _option jsonb;
BEGIN
  -- Insert the assessment
  INSERT INTO public.assessments (
    title, 
    description, 
    type, 
    visibility, 
    difficulty, 
    category, 
    ai_provider, 
    ai_model, 
    ai_prompt, 
    created_by
  )
  VALUES (
    _title, 
    _description, 
    _type, 
    _visibility, 
    _difficulty, 
    _category, 
    _ai_provider, 
    _ai_model, 
    _ai_prompt, 
    _created_by
  )
  RETURNING id INTO _assessment_id;

  -- Process questions if provided
  IF _questions IS NOT NULL AND jsonb_array_length(_questions) > 0 THEN
    FOR _question IN SELECT * FROM jsonb_array_elements(_questions) LOOP
      -- Insert question
      INSERT INTO public.assessment_questions (
        assessment_id,
        question_text,
        question_type,
        position,
        points,
        explanation
      )
      VALUES (
        _assessment_id,
        _question->>'question_text',
        COALESCE(_question->>'question_type', 'multiple_choice'),
        COALESCE((_question->>'position')::int, 1),
        COALESCE((_question->>'points')::int, 1),
        _question->>'explanation'
      )
      RETURNING id INTO _question_id;

      -- Process options if this is a multiple choice question
      IF (_question->>'question_type' = 'multiple_choice' OR _question->>'question_type' IS NULL)
         AND _question->'options' IS NOT NULL 
         AND jsonb_array_length(_question->'options') > 0 THEN
        
        FOR _option IN SELECT * FROM jsonb_array_elements(_question->'options') LOOP
          INSERT INTO public.assessment_options (
            question_id,
            option_text,
            is_correct,
            position,
            score_value,
            feedback
          )
          VALUES (
            _question_id,
            _option->>'option_text',
            COALESCE((_option->>'is_correct')::boolean, false),
            COALESCE((_option->>'position')::int, 1),
            COALESCE((_option->>'score_value')::int, 0),
            _option->>'feedback'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate assessment results
CREATE OR REPLACE FUNCTION public.calculate_assessment_score(
  _user_id uuid,
  _assessment_id bigint,
  _answers jsonb
) RETURNS jsonb AS $$
DECLARE
  _total_points integer := 0;
  _earned_points integer := 0;
  _question_count integer := 0;
  _correct_count integer := 0;
  _question record;
  _user_answer jsonb;
  _correct_option_id bigint;
  _question_points integer;
  _result jsonb;
BEGIN
  -- Get all questions for this assessment
  FOR _question IN 
    SELECT q.id, q.question_text, q.question_type, q.points,
           array_agg(
             jsonb_build_object(
               'id', o.id,
               'text', o.option_text,
               'is_correct', o.is_correct,
               'score_value', o.score_value
             ) ORDER BY o.position
           ) as options
    FROM public.assessment_questions q
    LEFT JOIN public.assessment_options o ON q.id = o.question_id
    WHERE q.assessment_id = _assessment_id
    GROUP BY q.id, q.question_text, q.question_type, q.points
    ORDER BY q.position
  LOOP
    _question_count := _question_count + 1;
    _question_points := COALESCE(_question.points, 1);
    _total_points := _total_points + _question_points;
    
    -- Get user's answer for this question
    _user_answer := _answers->(_question.id::text);
    
    IF _user_answer IS NOT NULL THEN
      -- For multiple choice questions
      IF _question.question_type = 'multiple_choice' THEN
        -- Check if the selected option is correct
        SELECT o.id INTO _correct_option_id
        FROM jsonb_array_elements(_question.options) AS option_data
        CROSS JOIN LATERAL (
          SELECT (option_data->>'id')::bigint as id, 
                 (option_data->>'is_correct')::boolean as is_correct
        ) AS o
        WHERE o.id = (_user_answer->>'option_id')::bigint AND o.is_correct = true;
        
        IF _correct_option_id IS NOT NULL THEN
          _earned_points := _earned_points + _question_points;
          _correct_count := _correct_count + 1;
        END IF;
      END IF;
      -- Note: Free text questions would need manual scoring or AI evaluation
    END IF;
  END LOOP;
  
  -- Calculate percentage
  _result := jsonb_build_object(
    'total_questions', _question_count,
    'correct_count', _correct_count,
    'total_points', _total_points,
    'earned_points', _earned_points,
    'percentage', CASE 
      WHEN _total_points > 0 THEN ROUND((_earned_points::numeric / _total_points::numeric) * 100, 2)
      ELSE 0
    END,
    'passed', CASE 
      WHEN _total_points > 0 THEN (_earned_points::numeric / _total_points::numeric) >= 0.7
      ELSE false
    END
  );
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit assessment results
CREATE OR REPLACE FUNCTION public.submit_assessment_result(
  _user_id uuid,
  _assessment_id bigint,
  _answers jsonb,
  _time_taken integer DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  _score_data jsonb;
  _result_id bigint;
BEGIN
  -- Calculate the score
  _score_data := public.calculate_assessment_score(_user_id, _assessment_id, _answers);
  
  -- Insert the result
  INSERT INTO public.assessment_results (
    user_id,
    assessment_id,
    score,
    total_points,
    percentage,
    answers,
    time_taken,
    completed
  )
  VALUES (
    _user_id,
    _assessment_id,
    (_score_data->>'earned_points')::numeric,
    (_score_data->>'total_points')::integer,
    (_score_data->>'percentage')::numeric,
    _answers,
    _time_taken,
    true
  )
  RETURNING id INTO _result_id;
  
  -- Return the complete result
  RETURN _score_data || jsonb_build_object('result_id', _result_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assessment with questions and options
CREATE OR REPLACE FUNCTION public.get_assessment_complete(
  _assessment_id bigint
) RETURNS jsonb AS $$
DECLARE
  _assessment record;
  _questions jsonb := '[]'::jsonb;
  _result jsonb;
BEGIN
  -- Get assessment details
  SELECT * INTO _assessment
  FROM public.assessments
  WHERE id = _assessment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;
  
  -- Get questions with options
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_text', q.question_text,
      'question_type', q.question_type,
      'position', q.position,
      'points', q.points,
      'explanation', q.explanation,
      'media_url', q.media_url,
      'options', COALESCE(q.options, '[]'::jsonb)
    ) ORDER BY q.position
  ) INTO _questions
  FROM (
    SELECT q.*,
           CASE 
             WHEN q.question_type = 'multiple_choice' THEN
               (SELECT jsonb_agg(
                 jsonb_build_object(
                   'id', o.id,
                   'option_text', o.option_text,
                   'position', o.position
                   -- Note: is_correct is not included for security
                 ) ORDER BY o.position
               )
               FROM public.assessment_options o
               WHERE o.question_id = q.id)
             ELSE '[]'::jsonb
           END as options
    FROM public.assessment_questions q
    WHERE q.assessment_id = _assessment_id
  ) q;
  
  -- Build complete result
  _result := jsonb_build_object(
    'id', _assessment.id,
    'title', _assessment.title,
    'description', _assessment.description,
    'type', _assessment.type,
    'difficulty', _assessment.difficulty,
    'category', _assessment.category,
    'created_at', _assessment.created_at,
    'questions', COALESCE(_questions, '[]'::jsonb)
  );
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;