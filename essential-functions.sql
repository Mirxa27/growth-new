-- Essential functions for Growth Echo Nexus

-- Function to create assessment with questions
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  assessment_data JSONB,
  questions_data JSONB[]
)
RETURNS JSONB AS $$
DECLARE
  _assessment_id BIGINT;
  _question_data JSONB;
  _question_id BIGINT;
  _option_data JSONB;
  _result JSONB;
BEGIN
  -- Insert assessment
  INSERT INTO public.assessments (
    title, description, visibility, category, created_by, estimated_time, personality_type
  )
  SELECT 
    assessment_data->>'title',
    assessment_data->>'description',
    COALESCE(assessment_data->>'visibility', 'private'),
    COALESCE(assessment_data->>'category', 'general'),
    auth.uid(),
    COALESCE((assessment_data->>'estimated_time')::INTEGER, 10),
    assessment_data->>'personality_type'
  RETURNING id INTO _assessment_id;

  -- Insert questions
  FOR i IN 1..array_length(questions_data, 1) LOOP
    _question_data := questions_data[i];
    
    INSERT INTO public.assessment_questions (
      assessment_id, question_text, question_type, position, 
      scale_min, scale_max, scale_labels, is_required
    )
    VALUES (
      _assessment_id,
      _question_data->>'question_text',
      COALESCE(_question_data->>'question_type', 'multiple_choice'),
      COALESCE((_question_data->>'position')::INTEGER, i),
      COALESCE((_question_data->>'scale_min')::INTEGER, 1),
      COALESCE((_question_data->>'scale_max')::INTEGER, 5),
      _question_data->'scale_labels',
      COALESCE((_question_data->>'is_required')::BOOLEAN, true)
    )
    RETURNING id INTO _question_id;

    -- Insert options if they exist
    IF _question_data ? 'options' THEN
      FOR j IN 0..jsonb_array_length(_question_data->'options')-1 LOOP
        _option_data := _question_data->'options'->j;
        
        INSERT INTO public.assessment_options (
          question_id, option_text, position, feedback, scoring_data
        )
        VALUES (
          _question_id,
          _option_data->>'option_text',
          COALESCE((_option_data->>'position')::INTEGER, j+1),
          _option_data->>'feedback',
          _option_data->'scoring_data'
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Return the created assessment
  SELECT to_jsonb(a.*) INTO _result
  FROM public.assessments a
  WHERE a.id = _assessment_id;

  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment post likes
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Insert or ignore the like
  INSERT INTO public.post_likes (user_id, post_id)
  VALUES (auth.uid(), post_id)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  -- Update the count
  UPDATE public.posts 
  SET likes_count = (
    SELECT COUNT(*) FROM public.post_likes WHERE public.post_likes.post_id = posts.id
  )
  WHERE id = post_id
  RETURNING likes_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit assessment
CREATE OR REPLACE FUNCTION public.submit_assessment(
  _assessment_id BIGINT,
  _responses JSONB,
  _visitor_session_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  _score INTEGER := 0;
  _total_possible INTEGER := 0;
  _percentage DECIMAL(5,2);
  _result_id BIGINT;
  _assessment RECORD;
  _personality_type TEXT;
BEGIN
  -- Get assessment details
  SELECT * INTO _assessment
  FROM public.assessments
  WHERE id = _assessment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;

  -- Calculate score based on responses
  SELECT COUNT(*) INTO _total_possible
  FROM public.assessment_questions
  WHERE assessment_id = _assessment_id;

  -- Simple scoring - count correct answers
  SELECT COUNT(*) INTO _score
  FROM public.assessment_questions q
  JOIN public.assessment_options o ON o.question_id = q.id
  WHERE q.assessment_id = _assessment_id
  AND o.is_correct = true
  AND (_responses->q.id::text)::text = o.id::text;

  _percentage := CASE 
    WHEN _total_possible > 0 THEN (_score::DECIMAL / _total_possible) * 100
    ELSE 0
  END;

  -- Determine personality type based on assessment type
  _personality_type := _assessment.personality_type;

  -- Insert result
  INSERT INTO public.assessment_results (
    assessment_id, user_id, visitor_session_id, score, total_possible, 
    percentage, personality_type, responses
  )
  VALUES (
    _assessment_id, auth.uid(), _visitor_session_id, _score, _total_possible,
    _percentage, _personality_type, _responses
  )
  RETURNING id INTO _result_id;

  RETURN jsonb_build_object(
    'result_id', _result_id,
    'score', _score,
    'total_possible', _total_possible,
    'percentage', _percentage,
    'personality_type', _personality_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assessment with questions and options
CREATE OR REPLACE FUNCTION public.get_assessment_complete(_assessment_id BIGINT)
RETURNS JSONB AS $$
DECLARE
  _assessment JSONB;
  _questions JSONB := '[]'::jsonb;
  _result JSONB;
BEGIN
  -- Get assessment details
  SELECT to_jsonb(a.*) INTO _assessment
  FROM public.assessments a
  WHERE a.id = _assessment_id;

  IF _assessment IS NULL THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;

  -- Get questions with options
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_text', q.question_text,
      'question_type', q.question_type,
      'position', q.position,
      'scale_min', q.scale_min,
      'scale_max', q.scale_max,
      'scale_labels', q.scale_labels,
      'is_required', q.is_required,
      'options', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', o.id,
              'option_text', o.option_text,
              'position', o.position,
              'feedback', o.feedback,
              'scoring_data', o.scoring_data
            )
            ORDER BY o.position
          )
          FROM public.assessment_options o
          WHERE o.question_id = q.id
        ),
        '[]'::jsonb
      )
    )
    ORDER BY q.position
  ) INTO _questions
  FROM public.assessment_questions q
  WHERE q.assessment_id = _assessment_id;

  -- Combine assessment and questions
  _result := _assessment || jsonb_build_object('questions', COALESCE(_questions, '[]'::jsonb));

  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to calculate personality type based on responses
CREATE OR REPLACE FUNCTION public.calculate_personality_type(_responses JSONB)
RETURNS TEXT AS $$
DECLARE
  _traits JSONB := '{}'::jsonb;
  _key TEXT;
  _response JSONB;
  _scoring JSONB;
  _trait TEXT;
  _result TEXT := '';
BEGIN
  -- Initialize trait counters
  _traits := jsonb_build_object(
    'E', 0, 'I', 0,
    'S', 0, 'N', 0,
    'T', 0, 'F', 0,
    'J', 0, 'P', 0
  );

  -- Process each response
  FOR _key IN SELECT jsonb_object_keys(_responses) LOOP
    _response := _responses->_key;
    
    -- Get scoring data for the selected option
    SELECT o.scoring_data INTO _scoring
    FROM public.assessment_options o
    WHERE o.id = (_response->>'selected_option')::BIGINT;

    IF _scoring IS NOT NULL AND _scoring ? 'trait' THEN
      _trait := upper(_scoring->>'trait');
      
      -- Map traits to MBTI dimensions
      CASE _trait
        WHEN 'EXTRAVERSION' THEN _traits := jsonb_set(_traits, '{E}', to_jsonb((_traits->>'E')::int + 1));
        WHEN 'INTROVERSION' THEN _traits := jsonb_set(_traits, '{I}', to_jsonb((_traits->>'I')::int + 1));
        WHEN 'SENSING' THEN _traits := jsonb_set(_traits, '{S}', to_jsonb((_traits->>'S')::int + 1));
        WHEN 'INTUITION' THEN _traits := jsonb_set(_traits, '{N}', to_jsonb((_traits->>'N')::int + 1));
        WHEN 'THINKING' THEN _traits := jsonb_set(_traits, '{T}', to_jsonb((_traits->>'T')::int + 1));
        WHEN 'FEELING' THEN _traits := jsonb_set(_traits, '{F}', to_jsonb((_traits->>'F')::int + 1));
        WHEN 'JUDGING' THEN _traits := jsonb_set(_traits, '{J}', to_jsonb((_traits->>'J')::int + 1));
        WHEN 'PERCEIVING' THEN _traits := jsonb_set(_traits, '{P}', to_jsonb((_traits->>'P')::int + 1));
      END CASE;
    END IF;
  END LOOP;

  -- Determine personality type
  _result := CASE WHEN (_traits->>'E')::int > (_traits->>'I')::int THEN 'E' ELSE 'I' END;
  _result := _result || CASE WHEN (_traits->>'S')::int > (_traits->>'N')::int THEN 'S' ELSE 'N' END;
  _result := _result || CASE WHEN (_traits->>'T')::int > (_traits->>'F')::int THEN 'T' ELSE 'F' END;
  _result := _result || CASE WHEN (_traits->>'J')::int > (_traits->>'P')::int THEN 'J' ELSE 'P' END;

  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
