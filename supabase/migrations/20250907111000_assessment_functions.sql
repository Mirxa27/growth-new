-- Assessment Management Functions
-- Provides secure functions for assessment operations

-- Function to create a new assessment attempt (anonymous or authenticated)
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
BEGIN
    -- Get current user (may be null for anonymous)
    v_user_id := auth.uid();
    
    -- Verify assessment exists and is accessible
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE id = p_assessment_id
    AND is_active = true
    AND (
        is_public = true 
        OR created_by = v_user_id 
        OR public.check_admin_access()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment not found or not accessible';
    END IF;
    
    -- Check if authentication is required
    IF v_assessment.requires_auth = true AND v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for this assessment';
    END IF;
    
    -- Check attempt limits for authenticated users
    IF v_user_id IS NOT NULL AND v_assessment.max_attempts > 0 THEN
        SELECT COUNT(*)
        INTO v_attempt_count
        FROM public.assessment_attempts
        WHERE assessment_id = p_assessment_id
        AND user_id = v_user_id
        AND status IN ('completed', 'in_progress');
        
        IF v_attempt_count >= v_assessment.max_attempts THEN
            RAISE EXCEPTION 'Maximum attempts exceeded for this assessment';
        END IF;
    END IF;
    
    -- Rate limiting for anonymous users (max 5 attempts per hour per IP)
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
    DECLARE
        v_question_count INTEGER;
    BEGIN
        SELECT COUNT(*)
        INTO v_question_count
        FROM public.assessment_questions
        WHERE assessment_id = p_assessment_id;
    END;
    
    -- Create the attempt
    INSERT INTO public.assessment_attempts (
        assessment_id,
        user_id,
        visitor_session_id,
        device_fingerprint,
        ip_address,
        attempt_number,
        total_questions,
        time_limit
    )
    VALUES (
        p_assessment_id,
        v_user_id,
        p_visitor_session_id,
        p_device_fingerprint,
        p_ip_address,
        v_attempt_count,
        v_question_count,
        CASE WHEN v_assessment.type = 'timed_quiz' THEN v_assessment.estimated_time * 60 ELSE NULL END
    )
    RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

-- Function to submit a question response
CREATE OR REPLACE FUNCTION public.submit_question_response(
    p_attempt_id UUID,
    p_question_id UUID,
    p_response_text TEXT DEFAULT NULL,
    p_selected_option_ids UUID[] DEFAULT NULL,
    p_response_value JSONB DEFAULT NULL,
    p_time_taken INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt RECORD;
    v_question RECORD;
    v_response_id UUID;
    v_points_earned DECIMAL := 0;
    v_is_correct BOOLEAN := false;
    v_feedback TEXT := '';
    v_correct_options UUID[];
BEGIN
    -- Verify attempt ownership
    SELECT * INTO v_attempt
    FROM public.assessment_attempts
    WHERE id = p_attempt_id
    AND (
        user_id = auth.uid() 
        OR (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
    AND status = 'in_progress';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment attempt not found or not accessible';
    END IF;
    
    -- Get question details
    SELECT * INTO v_question
    FROM public.assessment_questions
    WHERE id = p_question_id
    AND assessment_id = v_attempt.assessment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question not found for this assessment';
    END IF;
    
    -- Check if response already exists (update if so)
    IF EXISTS (
        SELECT 1 FROM public.assessment_responses 
        WHERE attempt_id = p_attempt_id AND question_id = p_question_id
    ) THEN
        -- Update existing response
        UPDATE public.assessment_responses
        SET 
            response_text = p_response_text,
            selected_option_ids = p_selected_option_ids,
            response_value = p_response_value,
            time_taken = p_time_taken,
            responded_at = NOW()
        WHERE attempt_id = p_attempt_id AND question_id = p_question_id
        RETURNING id INTO v_response_id;
    ELSE
        -- Create new response
        INSERT INTO public.assessment_responses (
            attempt_id,
            question_id,
            response_text,
            selected_option_ids,
            response_value,
            time_taken
        )
        VALUES (
            p_attempt_id,
            p_question_id,
            p_response_text,
            p_selected_option_ids,
            p_response_value,
            p_time_taken
        )
        RETURNING id INTO v_response_id;
    END IF;
    
    -- Calculate scoring for multiple choice questions
    IF v_question.question_type IN ('multiple_choice', 'true_false') AND p_selected_option_ids IS NOT NULL THEN
        -- Get correct options
        SELECT ARRAY_AGG(id)
        INTO v_correct_options
        FROM public.assessment_options
        WHERE question_id = p_question_id AND is_correct = true;
        
        -- Check if response is correct
        IF v_correct_options IS NOT NULL AND p_selected_option_ids <@ v_correct_options AND v_correct_options <@ p_selected_option_ids THEN
            v_is_correct := true;
            v_points_earned := v_question.points;
        END IF;
        
        -- Get feedback from selected options
        SELECT STRING_AGG(feedback, '; ')
        INTO v_feedback
        FROM public.assessment_options
        WHERE id = ANY(p_selected_option_ids) AND feedback IS NOT NULL;
    END IF;
    
    -- Update response with scoring
    UPDATE public.assessment_responses
    SET 
        points_earned = v_points_earned,
        is_correct = v_is_correct,
        feedback_shown = COALESCE(v_feedback, v_question.explanation)
    WHERE id = v_response_id;
    
    -- Update attempt progress
    UPDATE public.assessment_attempts
    SET 
        questions_answered = (
            SELECT COUNT(*) 
            FROM public.assessment_responses 
            WHERE attempt_id = p_attempt_id
        ),
        updated_at = NOW()
    WHERE id = p_attempt_id;
    
    -- Return response result
    RETURN jsonb_build_object(
        'response_id', v_response_id,
        'is_correct', v_is_correct,
        'points_earned', v_points_earned,
        'feedback', COALESCE(v_feedback, v_question.explanation),
        'question_explanation', v_question.explanation
    );
END;
$$;

-- Function to complete an assessment attempt
CREATE OR REPLACE FUNCTION public.complete_assessment_attempt(
    p_attempt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt RECORD;
    v_assessment RECORD;
    v_total_score DECIMAL := 0;
    v_max_score INTEGER := 0;
    v_percentage DECIMAL := 0;
    v_passed BOOLEAN := false;
    v_result JSONB;
BEGIN
    -- Verify attempt ownership
    SELECT * INTO v_attempt
    FROM public.assessment_attempts
    WHERE id = p_attempt_id
    AND (
        user_id = auth.uid() 
        OR (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
    AND status = 'in_progress';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment attempt not found or not accessible';
    END IF;
    
    -- Get assessment details
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE id = v_attempt.assessment_id;
    
    -- Calculate total score
    SELECT 
        COALESCE(SUM(points_earned), 0),
        COALESCE(SUM(q.points), 0)
    INTO v_total_score, v_max_score
    FROM public.assessment_responses r
    JOIN public.assessment_questions q ON r.question_id = q.id
    WHERE r.attempt_id = p_attempt_id;
    
    -- Calculate percentage
    IF v_max_score > 0 THEN
        v_percentage := (v_total_score / v_max_score) * 100;
    END IF;
    
    -- Determine if passed
    v_passed := v_percentage >= v_assessment.passing_score;
    
    -- Update attempt with final results
    UPDATE public.assessment_attempts
    SET 
        status = 'completed',
        completed_at = NOW(),
        submitted_at = NOW(),
        score = v_total_score,
        max_score = v_max_score,
        percentage = v_percentage,
        passed = v_passed,
        time_taken = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        updated_at = NOW()
    WHERE id = p_attempt_id;
    
    -- Update assessment analytics
    INSERT INTO public.assessment_analytics (assessment_id)
    VALUES (v_assessment.id)
    ON CONFLICT (assessment_id) DO NOTHING;
    
    -- Recalculate analytics (simplified version)
    UPDATE public.assessment_analytics
    SET 
        total_attempts = (
            SELECT COUNT(*) 
            FROM public.assessment_attempts 
            WHERE assessment_id = v_assessment.id
        ),
        completed_attempts = (
            SELECT COUNT(*) 
            FROM public.assessment_attempts 
            WHERE assessment_id = v_assessment.id AND status = 'completed'
        ),
        passed_attempts = (
            SELECT COUNT(*) 
            FROM public.assessment_attempts 
            WHERE assessment_id = v_assessment.id AND passed = true
        ),
        average_score = (
            SELECT AVG(percentage) 
            FROM public.assessment_attempts 
            WHERE assessment_id = v_assessment.id AND status = 'completed'
        ),
        last_calculated_at = NOW()
    WHERE assessment_id = v_assessment.id;
    
    -- Build result object
    v_result := jsonb_build_object(
        'attempt_id', p_attempt_id,
        'assessment_id', v_assessment.id,
        'assessment_title', v_assessment.title,
        'score', v_total_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'passed', v_passed,
        'passing_score', v_assessment.passing_score,
        'time_taken_seconds', EXTRACT(EPOCH FROM (NOW() - v_attempt.started_at))::INTEGER,
        'completed_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- Function to get assessment with questions (public access for public assessments)
CREATE OR REPLACE FUNCTION public.get_assessment_with_questions(
    p_assessment_id UUID
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
    
    -- Get assessment
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE id = p_assessment_id
    AND is_active = true
    AND (
        is_public = true 
        OR created_by = v_user_id 
        OR public.check_admin_access()
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
    WHERE q.assessment_id = p_assessment_id;
    
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

-- Function to get public assessments list
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
            'question_count', (
                SELECT COUNT(*) 
                FROM public.assessment_questions 
                WHERE assessment_id = assessments.id
            ),
            'attempt_count', COALESCE((
                SELECT total_attempts 
                FROM public.assessment_analytics 
                WHERE assessment_id = assessments.id
            ), 0)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt(UUID, TEXT, TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_question_response(UUID, UUID, TEXT, UUID[], JSONB, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_assessment_attempt(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_with_questions(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_assessments(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;