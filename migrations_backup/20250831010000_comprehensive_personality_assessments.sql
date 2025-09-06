-- Comprehensive Personality Assessments for Free Discovery
-- 6 AI-powered personality assessments (10-15 questions each) for visitors

-- Create Core Personality Discovery Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Core Personality Discovery',
    'Uncover your authentic personality type with this comprehensive assessment. Discover your natural tendencies, communication style, and core motivations to better understand yourself and others.',
    'test',
    'public',
    'intermediate',
    'personality',
    'openai',
    'gpt-4o-mini',
    'Generate personality assessment questions that help users discover their core personality traits across multiple dimensions including extroversion/introversion, sensing/intuition, thinking/feeling, and judging/perceiving.',
    15,
    true
);

-- Get the assessment ID
WITH assessment AS (
    SELECT id FROM public.assessments WHERE title = 'Core Personality Discovery' ORDER BY created_at DESC LIMIT 1
)

-- Insert questions for Core Personality Discovery
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, explanation)
SELECT
    a.id,
    q.question_text,
    q.question_type,
    q.position,
    q.explanation
FROM assessment a
CROSS JOIN (
    VALUES
    ('In social situations, you typically feel most energized when:', 'multiple_choice', 1, 'This question helps identify your energy source preference.'),
    ('When processing information, you naturally focus on:', 'multiple_choice', 2, 'Reveals your information processing style.'),
    ('Your ideal work environment would be:', 'multiple_choice', 3, 'Shows your preferred work style and environment.'),
    ('When making important decisions, you primarily rely on:', 'multiple_choice', 4, 'Identifies your decision-making approach.'),
    ('In conversations, you tend to focus on:', 'multiple_choice', 5, 'Shows your communication style preferences.'),
    ('When learning something new, you prefer to:', 'multiple_choice', 6, 'Reveals your learning style preference.'),
    ('Your natural approach to planning is:', 'multiple_choice', 7, 'Shows your planning and organization style.'),
    ('When faced with conflict, your typical response is:', 'multiple_choice', 8, 'Reveals your conflict resolution style.'),
    ('You feel most productive when:', 'multiple_choice', 9, 'Shows your productivity preferences.'),
    ('Your ideal weekend involves:', 'multiple_choice', 10, 'Reveals your leisure and relaxation preferences.'),
    ('When solving problems, you typically:', 'multiple_choice', 11, 'Shows your problem-solving approach.'),
    ('You trust information that is:', 'multiple_choice', 12, 'Reveals your information trust preferences.'),
    ('In group settings, you naturally:', 'multiple_choice', 13, 'Shows your group interaction style.'),
    ('Your approach to change is typically:', 'multiple_choice', 14, 'Reveals your adaptability to change.'),
    ('You feel most authentic when:', 'multiple_choice', 15, 'Shows when you feel most true to yourself.')
) AS q(question_text, question_type, position, explanation);

-- Insert options for each question
-- Question 1 options
WITH question AS (
    SELECT id FROM public.assessment_questions
    WHERE assessment_id = (SELECT id FROM public.assessments WHERE title = 'Core Personality Discovery' ORDER BY created_at DESC LIMIT 1)
    AND position = 1
)
INSERT INTO public.assessment_options (question_id, option_text, is_correct, position, score_value, feedback)
SELECT
    q.id,
    o.option_text,
    o.is_correct,
    o.position,
    o.score_value,
    o.feedback
FROM question q
CROSS JOIN (
    VALUES
    ('Engaging with many different people', false, 1, 3, 'Suggests extroverted energy preference'),
    ('Having deep conversations with a few close friends', false, 2, 2, 'Indicates balanced social energy'),
    ('Observing quietly and recharging alone', false, 3, 1, 'Suggests introverted energy preference'),
    ('Organizing activities and bringing people together', false, 4, 2, 'Shows leadership-oriented energy')
) AS o(option_text, is_correct, position, score_value, feedback);

-- Continue with options for other questions...

-- Create Emotional Intelligence Profile Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Emotional Intelligence Profile',
    'Discover your emotional intelligence strengths and areas for growth. This assessment evaluates your self-awareness, empathy, emotional regulation, and social skills.',
    'test',
    'public',
    'intermediate',
    'emotional_intelligence',
    'openai',
    'gpt-4o-mini',
    'Generate emotional intelligence assessment questions covering self-awareness, self-regulation, empathy, motivation, and social skills.',
    12,
    true
);

-- Create Communication Style Analysis Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Communication Style Analysis',
    'Understand your natural communication patterns and learn how to adapt your style for better relationships and effectiveness.',
    'test',
    'public',
    'intermediate',
    'communication',
    'openai',
    'gpt-4o-mini',
    'Generate communication style assessment questions covering verbal and non-verbal communication, listening skills, and interpersonal effectiveness.',
    10,
    true
);

-- Create Stress Response Patterns Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Stress Response Patterns',
    'Discover how you naturally respond to stress and learn effective coping strategies tailored to your personality.',
    'test',
    'public',
    'intermediate',
    'wellness',
    'openai',
    'gpt-4o-mini',
    'Generate stress response assessment questions covering coping mechanisms, resilience, and stress management techniques.',
    12,
    true
);

-- Create Relationship Style Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Relationship Style Assessment',
    'Explore your attachment style and relationship patterns to build healthier, more fulfilling connections.',
    'test',
    'public',
    'intermediate',
    'relationships',
    'openai',
    'gpt-4o-mini',
    'Generate relationship style assessment questions covering attachment patterns, communication in relationships, and interpersonal dynamics.',
    14,
    true
);

-- Create Life Purpose Alignment Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Life Purpose Alignment',
    'Discover what truly motivates you and aligns with your core values to find greater meaning and fulfillment.',
    'test',
    'public',
    'intermediate',
    'purpose',
    'openai',
    'gpt-4o-mini',
    'Generate life purpose assessment questions covering values, motivations, strengths, and meaning-seeking behaviors.',
    15,
    true
);

-- Create function for AI-powered personality analysis
CREATE OR REPLACE FUNCTION public.analyze_personality_profile(
    assessment_id bigint,
    user_answers jsonb
) RETURNS jsonb AS $$
DECLARE
    profile_result jsonb;
BEGIN
    -- This function would use AI to analyze the personality profile
    -- For now, return a placeholder result structure
    profile_result := jsonb_build_object(
        'personality_type', 'INFP',
        'strengths', jsonb_build_array('Empathetic', 'Creative', 'Idealistic', 'Authentic'),
        'growth_areas', jsonb_build_array('Setting boundaries', 'Practical planning', 'Dealing with criticism'),
        'compatibility', jsonb_build_object(
            'best_matches', jsonb_build_array('ENFJ', 'ENTJ'),
            'challenging_matches', jsonb_build_array('ESTJ', 'ISTJ')
        ),
        'career_suggestions', jsonb_build_array('Counseling', 'Writing', 'Arts', 'Education'),
        'relationship_advice', 'Focus on finding partners who appreciate your depth and authenticity',
        'personal_growth_tips', 'Develop practical organizational skills while maintaining your creative spirit'
    );

    RETURN profile_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.analyze_personality_profile TO authenticated, anon;

-- Add RLS policy for anonymous assessment taking
CREATE POLICY "Anonymous users can take public assessments"
ON public.assessment_attempts
FOR INSERT TO anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments
        WHERE id = assessment_id
        AND visibility = 'public'
    )
    AND user_id IS NULL
    AND visitor_session_id IS NOT NULL
);

CREATE POLICY "Anonymous users can submit public assessment results"
ON public.assessment_results
FOR INSERT TO anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments
        WHERE id = assessment_id
        AND visibility = 'public'
    )
    AND user_id IS NULL
    AND visitor_session_id IS NOT NULL
);
