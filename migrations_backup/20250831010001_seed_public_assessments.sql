-- Seed 6 public assessments that don't require signup

-- Emotional Intelligence Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Emotional Intelligence Assessment',
  'Discover your emotional intelligence strengths and areas for growth. This assessment explores your ability to understand and manage emotions.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on emotional intelligence traits and skills'
);

-- Get the ID of the just inserted assessment
DO $$
DECLARE
  ei_assessment_id bigint;
BEGIN
  SELECT id INTO ei_assessment_id FROM public.assessments WHERE title = 'Emotional Intelligence Assessment';
  
  -- Insert questions for Emotional Intelligence Assessment
  INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, question_order) VALUES
  (ei_assessment_id, 'When someone criticizes your work, how do you typically respond?', 'multiple_choice', 1),
  (ei_assessment_id, 'You notice a colleague seems upset. What is your first instinct?', 'multiple_choice', 2),
  (ei_assessment_id, 'During a stressful situation, you tend to:', 'multiple_choice', 3),
  (ei_assessment_id, 'When making important decisions, you rely most on:', 'multiple_choice', 4),
  (ei_assessment_id, 'In social situations, you typically:', 'multiple_choice', 5),
  (ei_assessment_id, 'When someone disagrees with you, you:', 'multiple_choice', 6),
  (ei_assessment_id, 'Your approach to handling conflict is to:', 'multiple_choice', 7),
  (ei_assessment_id, 'When you make a mistake, you typically:', 'multiple_choice', 8),
  (ei_assessment_id, 'You find it easiest to motivate yourself by:', 'multiple_choice', 9),
  (ei_assessment_id, 'When others are emotional, you tend to:', 'multiple_choice', 10),
  (ei_assessment_id, 'Your leadership style is best described as:', 'multiple_choice', 11),
  (ei_assessment_id, 'When receiving feedback, you:', 'multiple_choice', 12),
  (ei_assessment_id, 'In team settings, you naturally:', 'multiple_choice', 13),
  (ei_assessment_id, 'When facing a challenge, your first thought is:', 'multiple_choice', 14),
  (ei_assessment_id, 'You handle change by:', 'multiple_choice', 15);

  -- Insert options for each question
  INSERT INTO public.assessment_options (question_id, option_text, option_order, scoring_value) VALUES
  -- Q1 options
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Take it personally and feel defensive', 1, 1),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Listen carefully and ask clarifying questions', 2, 4),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Dismiss it if it seems unfair', 3, 2),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Thank them and consider the feedback thoughtfully', 4, 3),
  
  -- Q2 options
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Give them space unless they ask for help', 1, 2),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Approach them with empathy and offer support', 2, 4),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Try to cheer them up with humor', 3, 1),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Ask directly what''s wrong and how to help', 4, 3);

END $$;

-- Leadership Style Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Leadership Style Assessment',
  'Identify your natural leadership approach and communication style. Understand how you influence and guide others.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on leadership styles and approaches'
);

-- Stress Management Quiz
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Stress Management Knowledge Quiz',
  'Test your knowledge of effective stress management techniques and discover new strategies for maintaining wellbeing.',
  'quiz',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated quiz on stress management techniques and knowledge'
);

-- Communication Patterns Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Communication Patterns Assessment',
  'Understand how you naturally communicate and connect with others. Discover your communication strengths and blind spots.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on communication styles and patterns'
);

-- Personal Values Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Personal Values Assessment',
  'Explore your core values and what drives your decisions. Align your actions with what matters most to you.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on personal values and motivations'
);

-- Mindfulness & Wellbeing Quiz
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Mindfulness & Wellbeing Quiz',
  'Assess your current mindfulness practices and wellbeing habits. Learn evidence-based approaches to mental wellness.',
  'quiz',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated quiz on mindfulness practices and wellbeing knowledge'
);