-- Insert Assessment Types
INSERT INTO public.assessment_types (name, description, category, is_public, requires_signup, estimated_duration) VALUES
-- Public Assessments (no signup required)
('Personality Discovery', 'Discover your core personality type and understand your natural strengths and tendencies.', 'personality', true, false, 15),
('Wellness Check', 'Assess your current wellness levels across mental, physical, and emotional dimensions.', 'wellness', true, false, 10),
('Relationship Style', 'Understand your attachment style and relationship patterns.', 'relationships', true, false, 12),
('Career Alignment', 'Explore how well your current path aligns with your values and interests.', 'career', true, false, 18),
('Stress & Resilience', 'Evaluate your stress levels and discover your resilience strengths.', 'wellness', true, false, 8),
('Life Balance', 'Assess balance across different life areas and identify improvement opportunities.', 'lifestyle', true, false, 10),

-- User-only Assessments (require signup)
('Deep Personality Analysis', 'Comprehensive personality assessment with detailed insights and growth recommendations.', 'personality', false, true, 25),
('Spiritual Journey', 'Explore your spiritual beliefs, practices, and growth areas.', 'spirituality', false, true, 20),
('Leadership Style', 'Discover your natural leadership approach and development areas.', 'career', false, true, 15),
('Emotional Intelligence', 'Assess your emotional awareness and interpersonal skills.', 'growth', false, true, 22),
('Communication Patterns', 'Understand your communication style and effectiveness.', 'relationships', false, true, 18),
('Life Purpose Clarity', 'Deep dive into your life purpose and meaningful goals.', 'growth', false, true, 30),
('Creativity Assessment', 'Explore your creative strengths and untapped potential.', 'skills', false, true, 15),
('Values Alignment', 'Identify your core values and how they guide your decisions.', 'growth', false, true, 20),
('Conflict Resolution Style', 'Understand how you handle conflict and challenging situations.', 'relationships', false, true, 16),
('Work-Life Integration', 'Assess how well you integrate work and personal life.', 'lifestyle', false, true, 14),
('Financial Mindset', 'Explore your relationship with money and financial goals.', 'lifestyle', false, true, 12),
('Health & Vitality', 'Comprehensive assessment of your physical and mental health habits.', 'wellness', false, true, 25),
('Learning Style', 'Discover how you best absorb and process new information.', 'skills', false, true, 12),
('Social Confidence', 'Assess your comfort and skills in social situations.', 'relationships', false, true, 15),
('Goal Achievement', 'Evaluate your goal-setting and achievement patterns.', 'growth', false, true, 18),
('Intuition & Decision Making', 'Explore how you make decisions and trust your intuition.', 'growth', false, true, 16),
('Boundary Setting', 'Assess your ability to set and maintain healthy boundaries.', 'relationships', false, true, 14),
('Mindfulness Practice', 'Evaluate your present-moment awareness and mindfulness skills.', 'spirituality', false, true, 10),
('Change Adaptability', 'Understand how you handle change and uncertainty.', 'growth', false, true, 13),
('Self-Compassion', 'Assess how kindly you treat yourself during difficult times.', 'wellness', false, true, 15);

-- Insert sample questions for Personality Discovery (public assessment)
WITH personality_assessment AS (
  SELECT id FROM public.assessment_types WHERE name = 'Personality Discovery'
),
new_assessment AS (
  INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config)
  SELECT 
    'Discover Your Personality Type',
    'A comprehensive personality assessment to help you understand your natural tendencies, strengths, and growth areas.',
    id,
    true,
    true,
    'personality_weights',
    '{"personality_types": ["extrovert", "introvert", "thinking", "feeling", "judging", "perceiving", "sensing", "intuitive"], "score_ranges": {"low": [0, 33], "medium": [34, 66], "high": [67, 100]}}'
  FROM personality_assessment
  RETURNING id
)
INSERT INTO public.questions (text, type, category, tags) VALUES
('Where do you typically gain energy and feel most refreshed?', 'multiple_choice', 'energy_source', ARRAY['extroversion', 'introversion']),
('When making important decisions, what do you rely on most?', 'multiple_choice', 'decision_making', ARRAY['thinking', 'feeling']),
('How do you prefer to approach new projects or tasks?', 'multiple_choice', 'work_style', ARRAY['judging', 'perceiving']),
('What type of information do you notice first in new situations?', 'multiple_choice', 'information_processing', ARRAY['sensing', 'intuitive']),
('In social situations, you tend to:', 'multiple_choice', 'social_behavior', ARRAY['extroversion', 'introversion']),
('When faced with problems, your first instinct is to:', 'multiple_choice', 'problem_solving', ARRAY['thinking', 'feeling']),
('You work best when you have:', 'multiple_choice', 'structure_preference', ARRAY['judging', 'perceiving']),
('You are more interested in:', 'multiple_choice', 'focus_preference', ARRAY['sensing', 'intuitive']),
('After a busy day, you prefer to:', 'multiple_choice', 'recovery_style', ARRAY['extroversion', 'introversion']),
('When giving feedback to others, you tend to focus on:', 'multiple_choice', 'feedback_style', ARRAY['thinking', 'feeling']);

-- Insert options for the first question (energy source)
WITH first_question AS (
  SELECT id FROM public.questions WHERE text = 'Where do you typically gain energy and feel most refreshed?' LIMIT 1
)
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT 
  id,
  'Being around people and engaging in social activities',
  'social_energy',
  '{"extrovert": 3, "introvert": 0}',
  1
FROM first_question
UNION ALL
SELECT 
  id,
  'Having quiet time alone to think and reflect',
  'solitary_energy',
  '{"extrovert": 0, "introvert": 3}',
  2
FROM first_question
UNION ALL
SELECT 
  id,
  'A mix of both social and solo activities',
  'balanced_energy',
  '{"extrovert": 1.5, "introvert": 1.5}',
  3
FROM first_question
UNION ALL
SELECT 
  id,
  'Engaging in physical activities or hobbies',
  'activity_energy',
  '{"extrovert": 2, "introvert": 1}',
  4
FROM first_question;

-- Insert AI Content Templates for admin builders
INSERT INTO public.ai_content_templates (name, type, category, prompt_template, output_schema, default_config) VALUES
(
  'Personality Assessment Builder',
  'assessment',
  'personality',
  'Create a comprehensive personality assessment about {topic} with {question_count} questions. Target audience: {target_audience}. Assessment should explore {focus_areas} and provide insights into {personality_dimensions}. Include scoring methodology and result interpretations.',
  '{
    "required_fields": ["title", "description", "questions", "scoring_config", "result_templates"],
    "question_structure": {
      "text": "string",
      "type": "multiple_choice|scale|text",
      "options": [{"text": "string", "value": "string", "score_weights": {}}]
    },
    "result_structure": {
      "personality_type": "string",
      "strengths": ["string"],
      "growth_areas": ["string"],
      "recommendations": ["string"]
    }
  }',
  '{"question_count": 10, "difficulty": "beginner", "estimated_duration": 15}'
),
(
  'Wellness Quiz Builder',
  'quiz',
  'wellness',
  'Generate an educational quiz about {topic} for {target_audience}. Create {question_count} questions covering {key_concepts}. Include explanations for correct answers and provide learning resources.',
  '{
    "required_fields": ["title", "description", "questions", "passing_score"],
    "question_structure": {
      "question_text": "string",
      "question_type": "multiple_choice|true_false",
      "correct_answer": "string",
      "options": ["string"],
      "explanation": "string",
      "points": "number"
    }
  }',
  '{"question_count": 8, "passing_score": 70, "time_limit": 10}'
),
(
  'Growth Exploration Builder',
  'exploration',
  'growth',
  'Design a self-discovery exploration focusing on {topic}. Create {question_count} reflective questions that guide users through {exploration_areas}. Include facilitator prompts and analysis framework.',
  '{
    "required_fields": ["title", "description", "questions", "facilitator_prompt", "analysis_structure"],
    "exploration_structure": {
      "introduction": "string",
      "questions": ["string"],
      "reflection_prompts": ["string"],
      "integration_activities": ["string"]
    }
  }',
  '{"question_count": 8, "difficulty": "intermediate", "duration": 30}'
),
(
  'Skills Course Builder',
  'course',
  'skills',
  'Create a comprehensive course about {topic} for {target_audience}. Structure content into {module_count} modules covering {learning_objectives}. Include assessments, activities, and progress tracking.',
  '{
    "required_fields": ["title", "description", "modules", "learning_objectives", "assessments"],
    "course_structure": {
      "modules": [{
        "title": "string",
        "content": "string", 
        "activities": ["string"],
        "assessment": {}
      }],
      "resources": ["string"],
      "completion_criteria": {}
    }
  }',
  '{"module_count": 5, "duration_weeks": 4, "difficulty": "beginner"}'
);

-- Insert sample visitor quiz data
INSERT INTO public.quizzes (title, description, category, difficulty, is_public, time_limit_minutes, passing_score, show_correct_answers) VALUES
('Stress Management Basics', 'Test your knowledge of fundamental stress management techniques and strategies.', 'wellness', 'beginner', true, 10, 70.0, true),
('Healthy Communication Quiz', 'Assess your understanding of effective communication principles and techniques.', 'relationships', 'beginner', true, 8, 75.0, true),
('Personal Growth Fundamentals', 'Explore your knowledge of personal development concepts and practices.', 'growth', 'beginner', true, 12, 70.0, true),
('Mindfulness Basics', 'Test your understanding of mindfulness principles and applications.', 'spirituality', 'beginner', true, 6, 80.0, true),
('Self-Care Essentials', 'Evaluate your knowledge of self-care practices and their importance.', 'wellness', 'beginner', true, 8, 75.0, true);

-- Insert sample quiz questions for Stress Management Basics
WITH stress_quiz AS (
  SELECT id FROM public.quizzes WHERE title = 'Stress Management Basics' LIMIT 1
)
INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index)
SELECT 
  id,
  'What is the first step in effective stress management?',
  'multiple_choice',
  'Identifying your stress triggers',
  'Recognizing what causes your stress is essential before you can address it effectively.',
  1,
  1
FROM stress_quiz
UNION ALL
SELECT 
  id,
  'Deep breathing exercises help reduce stress by:',
  'multiple_choice',
  'Activating the parasympathetic nervous system',
  'Deep breathing triggers the relaxation response, calming your nervous system.',
  1,
  2
FROM stress_quiz
UNION ALL
SELECT 
  id,
  'True or False: All stress is harmful and should be avoided.',
  'true_false',
  'False',
  'Some stress (eustress) can be beneficial and motivating, while chronic distress is harmful.',
  1,
  3
FROM stress_quiz;

-- Create function to auto-generate visitor session IDs
CREATE OR REPLACE FUNCTION public.ensure_visitor_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.visitor_session_id IS NULL THEN
    NEW.visitor_session_id := public.generate_visitor_session();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for visitor sessions
CREATE TRIGGER ensure_visitor_session_trigger
  BEFORE INSERT ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

CREATE TRIGGER ensure_visitor_session_quiz_trigger
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

COMMENT ON FUNCTION public.ensure_visitor_session() IS 'Automatically generates visitor session IDs for non-authenticated users';
