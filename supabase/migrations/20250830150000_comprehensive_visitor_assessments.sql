-- Enhanced Visitor Assessment System
-- Creates 5-6 comprehensive assessments for visitors with 10-15 questions each

-- Insert comprehensive visitor assessments with questions
WITH personality_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Personality Discovery' LIMIT 1
),
wellness_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Wellness Check' LIMIT 1
),
relationship_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Relationship Style' LIMIT 1
),
career_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Career Alignment' LIMIT 1
),
stress_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Stress & Resilience' LIMIT 1
),
balance_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Life Balance' LIMIT 1
)

-- Create Personality Discovery Assessment (15 questions)
INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
SELECT 
  'Discover Your True Personality',
  'Uncover your authentic personality type and understand what makes you unique. This comprehensive assessment explores your natural tendencies, communication style, and core motivations to help you embrace your authentic self.',
  personality_type.id,
  true,
  true,
  'personality_weights',
  '{
    "personality_dimensions": {
      "extroversion": {"label": "Energy Source", "description": "How you gain and direct energy"},
      "sensing": {"label": "Information Processing", "description": "How you take in and process information"},
      "thinking": {"label": "Decision Making", "description": "How you make decisions and judgments"},
      "judging": {"label": "Lifestyle Approach", "description": "How you approach the outside world"}
    },
    "result_types": {
      "ESTJ": {"label": "The Executive", "description": "Natural leader who thrives on organization and efficiency"},
      "ENFP": {"label": "The Campaigner", "description": "Enthusiastic and creative with strong people skills"},
      "INTJ": {"label": "The Architect", "description": "Independent and strategic with original thinking"},
      "ISFP": {"label": "The Adventurer", "description": "Flexible and charming with deep personal values"}
    }
  }',
  'Answer each question honestly based on your natural preferences. There are no right or wrong answers - this is about discovering your authentic self.'
FROM personality_type;

-- Get the created assessment ID for questions
WITH new_assessment AS (
  SELECT id FROM public.assessments WHERE title = 'Discover Your True Personality' ORDER BY created_at DESC LIMIT 1
)

-- Insert personality questions
INSERT INTO public.questions (text, type, category, tags) VALUES
('At a party, you are more likely to:', 'multiple_choice', 'social_energy', ARRAY['extroversion', 'introversion']),
('When learning something new, you prefer to:', 'multiple_choice', 'learning_style', ARRAY['sensing', 'intuition']),
('When making important decisions, you typically:', 'multiple_choice', 'decision_process', ARRAY['thinking', 'feeling']),
('You feel most comfortable when your day is:', 'multiple_choice', 'structure_preference', ARRAY['judging', 'perceiving']),
('In conversations, you tend to focus on:', 'multiple_choice', 'communication_focus', ARRAY['sensing', 'intuition']),
('When giving feedback, you prioritize:', 'multiple_choice', 'feedback_style', ARRAY['thinking', 'feeling']),
('You prefer to work in environments that are:', 'multiple_choice', 'work_environment', ARRAY['extroversion', 'introversion']),
('When solving problems, you first:', 'multiple_choice', 'problem_approach', ARRAY['sensing', 'intuition']),
('You make your best decisions when you:', 'multiple_choice', 'decision_context', ARRAY['thinking', 'feeling']),
('Your ideal weekend involves:', 'multiple_choice', 'leisure_preference', ARRAY['extroversion', 'introversion']),
('You are drawn to ideas that are:', 'multiple_choice', 'idea_preference', ARRAY['sensing', 'intuition']),
('When conflicts arise, you prefer to:', 'multiple_choice', 'conflict_style', ARRAY['thinking', 'feeling']),
('You work best when you have:', 'multiple_choice', 'work_structure', ARRAY['judging', 'perceiving']),
('In group projects, you naturally:', 'multiple_choice', 'group_role', ARRAY['extroversion', 'introversion']),
('You trust information that is:', 'multiple_choice', 'information_trust', ARRAY['sensing', 'intuition']);

-- Create question options for personality assessment
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
-- Question 1: At a party
SELECT q.id, 'Spend time with many different people', 'social_butterfly', '{"extroversion": 3, "introversion": 0}', 1
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Have deep conversations with a few close friends', 'intimate_connections', '{"extroversion": 0, "introversion": 3}', 2
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Find a quiet corner to observe and recharge', 'observer_mode', '{"extroversion": 0, "introversion": 2}', 3
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Be the one organizing activities or games', 'social_organizer', '{"extroversion": 2, "introversion": 0}', 4
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:';

-- Continue with more question options...
-- Question 2: Learning style
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT q.id, 'Start with concrete examples and build understanding', 'concrete_first', '{"sensing": 3, "intuition": 0}', 1
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Explore theories and possibilities first', 'theory_first', '{"sensing": 0, "intuition": 3}', 2
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Get hands-on experience immediately', 'hands_on', '{"sensing": 2, "intuition": 1}', 3
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Understand the big picture connections', 'big_picture', '{"sensing": 0, "intuition": 2}', 4
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:';

-- Link questions to assessment
INSERT INTO public.assessment_questions (assessment_id, question_id, order_index)
SELECT a.id, q.id, 
  CASE q.text
    WHEN 'At a party, you are more likely to:' THEN 1
    WHEN 'When learning something new, you prefer to:' THEN 2
    WHEN 'When making important decisions, you typically:' THEN 3
    WHEN 'You feel most comfortable when your day is:' THEN 4
    WHEN 'In conversations, you tend to focus on:' THEN 5
    WHEN 'When giving feedback, you prioritize:' THEN 6
    WHEN 'You prefer to work in environments that are:' THEN 7
    WHEN 'When solving problems, you first:' THEN 8
    WHEN 'You make your best decisions when you:' THEN 9
    WHEN 'Your ideal weekend involves:' THEN 10
    WHEN 'You are drawn to ideas that are:' THEN 11
    WHEN 'When conflicts arise, you prefer to:' THEN 12
    WHEN 'You work best when you have:' THEN 13
    WHEN 'In group projects, you naturally:' THEN 14
    WHEN 'You trust information that is:' THEN 15
  END
FROM public.assessments a, public.questions q
WHERE a.title = 'Discover Your True Personality'
  AND q.tags && ARRAY['extroversion', 'introversion', 'sensing', 'intuition', 'thinking', 'feeling', 'judging', 'perceiving'];

-- Create Wellness Check Assessment (12 questions)
INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
SELECT 
  'Complete Wellness Assessment',
  'Get a comprehensive view of your mental, physical, and emotional well-being. This assessment helps you identify your strengths and areas for growth across all dimensions of wellness.',
  wellness_type.id,
  true,
  true,
  'weighted_average',
  '{
    "wellness_dimensions": {
      "physical": {"weight": 0.25, "label": "Physical Health", "description": "Your body health and vitality"},
      "mental": {"weight": 0.25, "label": "Mental Health", "description": "Your cognitive and psychological well-being"},
      "emotional": {"weight": 0.25, "label": "Emotional Health", "description": "Your emotional awareness and regulation"},
      "social": {"weight": 0.25, "label": "Social Health", "description": "Your relationships and social connections"}
    },
    "score_ranges": {
      "excellent": [85, 100],
      "good": [70, 84],
      "fair": [55, 69],
      "needs_attention": [0, 54]
    }
  }',
  'Rate each statement based on how true it is for you most of the time. Be honest to get the most accurate assessment of your wellness.'
FROM wellness_type;

-- Insert wellness questions
INSERT INTO public.questions (text, type, category, tags) VALUES
('I have energy for my daily activities', 'scale', 'physical_wellness', ARRAY['physical', 'energy']),
('I sleep well and feel rested', 'scale', 'physical_wellness', ARRAY['physical', 'sleep']),
('I eat nutritious foods regularly', 'scale', 'physical_wellness', ARRAY['physical', 'nutrition']),
('I can handle stress effectively', 'scale', 'mental_wellness', ARRAY['mental', 'stress']),
('I feel mentally sharp and focused', 'scale', 'mental_wellness', ARRAY['mental', 'focus']),
('I enjoy learning new things', 'scale', 'mental_wellness', ARRAY['mental', 'growth']),
('I understand and manage my emotions well', 'scale', 'emotional_wellness', ARRAY['emotional', 'awareness']),
('I feel optimistic about my future', 'scale', 'emotional_wellness', ARRAY['emotional', 'outlook']),
('I recover quickly from setbacks', 'scale', 'emotional_wellness', ARRAY['emotional', 'resilience']),
('I have supportive relationships', 'scale', 'social_wellness', ARRAY['social', 'support']),
('I communicate effectively with others', 'scale', 'social_wellness', ARRAY['social', 'communication']),
('I feel connected to my community', 'scale', 'social_wellness', ARRAY['social', 'community']);

-- Create scale options for wellness questions (1-5 scale)
WITH wellness_questions AS (
  SELECT id FROM public.questions WHERE tags && ARRAY['physical', 'mental', 'emotional', 'social']
)
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT q.id, 'Never true', 'never', '{"score": 1}', 1 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Rarely true', 'rarely', '{"score": 2}', 2 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Sometimes true', 'sometimes', '{"score": 3}', 3 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Often true', 'often', '{"score": 4}', 4 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Always true', 'always', '{"score": 5}', 5 FROM wellness_questions q;

-- Link wellness questions to assessment
INSERT INTO public.assessment_questions (assessment_id, question_id, order_index, weight)
SELECT a.id, q.id, 
  CASE 
    WHEN q.text LIKE '%energy%' THEN 1
    WHEN q.text LIKE '%sleep%' THEN 2
    WHEN q.text LIKE '%eat%' THEN 3
    WHEN q.text LIKE '%stress%' THEN 4
    WHEN q.text LIKE '%mental%' THEN 5
    WHEN q.text LIKE '%learning%' THEN 6
    WHEN q.text LIKE '%emotions%' THEN 7
    WHEN q.text LIKE '%optimistic%' THEN 8
    WHEN q.text LIKE '%setbacks%' THEN 9
    WHEN q.text LIKE '%relationships%' THEN 10
    WHEN q.text LIKE '%communicate%' THEN 11
    WHEN q.text LIKE '%community%' THEN 12
  END,
  1.0
FROM public.assessments a, public.questions q
WHERE a.title = 'Complete Wellness Assessment'
  AND q.tags && ARRAY['physical', 'mental', 'emotional', 'social'];

-- Function to ensure visitor sessions for anonymous assessments
CREATE OR REPLACE FUNCTION public.ensure_visitor_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If no user_id and no visitor_session_id, generate one
  IF NEW.user_id IS NULL AND (NEW.visitor_session_id IS NULL OR NEW.visitor_session_id = '') THEN
    NEW.visitor_session_id := 'visitor_' || gen_random_uuid()::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to assessment responses
DROP TRIGGER IF EXISTS ensure_visitor_session_assessment_trigger ON public.assessment_responses;
CREATE TRIGGER ensure_visitor_session_assessment_trigger
  BEFORE INSERT ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

-- Create more visitor assessments following the same pattern...
-- Function to create complete assessment with questions
CREATE OR REPLACE FUNCTION public.create_visitor_assessment(
  p_title TEXT,
  p_description TEXT,
  p_type_name TEXT,
  p_questions JSONB,
  p_scoring_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  assessment_id UUID;
  question_data JSONB;
  question_id UUID;
  option_data JSONB;
  question_order INTEGER := 1;
BEGIN
  -- Create the assessment
  INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
  SELECT 
    p_title,
    p_description,
    at.id,
    true,
    true,
    COALESCE(p_scoring_config->>'algorithm', 'weighted_average'),
    p_scoring_config,
    'Answer each question honestly to get the most accurate results.'
  FROM public.assessment_types at
  WHERE at.name = p_type_name
  RETURNING id INTO assessment_id;

  -- Create questions and options
  FOR question_data IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question
    INSERT INTO public.questions (text, type, category, tags)
    VALUES (
      question_data->>'text',
      question_data->>'type',
      question_data->>'category',
      ARRAY(SELECT jsonb_array_elements_text(question_data->'tags'))
    )
    RETURNING id INTO question_id;

    -- Insert question options
    FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
    LOOP
      INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
      VALUES (
        question_id,
        option_data->>'text',
        option_data->>'value',
        (option_data->'score_weights')::jsonb,
        (option_data->>'order_index')::integer
      );
    END LOOP;

    -- Link question to assessment
    INSERT INTO public.assessment_questions (assessment_id, question_id, order_index)
    VALUES (assessment_id, question_id, question_order);

    question_order := question_order + 1;
  END LOOP;

  RETURN assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_visitor_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_visitor_session TO authenticated;
