-- Sample data for Growth Echo Nexus

-- Insert sample public assessment
INSERT INTO public.assessments (
  title, description, visibility, category, estimated_time, personality_type
) VALUES (
  'Personality Discovery Assessment',
  'Discover your unique personality traits and growth areas through this comprehensive assessment.',
  'public',
  'personality',
  15,
  'MBTI'
) ON CONFLICT DO NOTHING;

-- Get the assessment ID
DO $$
DECLARE
  assessment_id BIGINT;
  question_id BIGINT;
BEGIN
  SELECT id INTO assessment_id FROM public.assessments WHERE title = 'Personality Discovery Assessment' LIMIT 1;
  
  IF assessment_id IS NOT NULL THEN
    -- Insert sample questions
    INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position)
    VALUES 
      (assessment_id, 'How do you prefer to spend your free time?', 'multiple_choice', 1),
      (assessment_id, 'When making decisions, you rely more on:', 'multiple_choice', 2),
      (assessment_id, 'In social situations, you typically:', 'multiple_choice', 3),
      (assessment_id, 'What energizes you most?', 'multiple_choice', 4),
      (assessment_id, 'How do you approach new challenges?', 'multiple_choice', 5)
    ON CONFLICT DO NOTHING;

    -- Insert options for first question
    SELECT id INTO question_id FROM public.assessment_questions 
    WHERE assessment_id = assessment_id AND position = 1 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
      VALUES 
        (question_id, 'Reading a book or watching movies alone', 1, '{"trait": "introversion"}'),
        (question_id, 'Going out with friends to social events', 2, '{"trait": "extraversion"}'),
        (question_id, 'A mix of both, depending on my mood', 3, '{"trait": "ambiversion"}'),
        (question_id, 'Engaging in creative or artistic activities', 4, '{"trait": "openness"}')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for second question
    SELECT id INTO question_id FROM public.assessment_questions 
    WHERE assessment_id = assessment_id AND position = 2 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
      VALUES 
        (question_id, 'Logic and objective analysis', 1, '{"trait": "thinking"}'),
        (question_id, 'Your emotions and personal values', 2, '{"trait": "feeling"}'),
        (question_id, 'Past experiences and proven methods', 3, '{"trait": "sensing"}'),
        (question_id, 'Intuition and future possibilities', 4, '{"trait": "intuition"}')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for third question
    SELECT id INTO question_id FROM public.assessment_questions 
    WHERE assessment_id = assessment_id AND position = 3 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
      VALUES 
        (question_id, 'Take charge and lead conversations', 1, '{"trait": "extraversion"}'),
        (question_id, 'Listen more than you speak', 2, '{"trait": "introversion"}'),
        (question_id, 'Adapt to the energy of the group', 3, '{"trait": "flexibility"}'),
        (question_id, 'Seek one-on-one deep conversations', 4, '{"trait": "depth"}')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for fourth question
    SELECT id INTO question_id FROM public.assessment_questions 
    WHERE assessment_id = assessment_id AND position = 4 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
      VALUES 
        (question_id, 'Meeting new people and networking', 1, '{"trait": "extraversion"}'),
        (question_id, 'Deep reflection and personal time', 2, '{"trait": "introversion"}'),
        (question_id, 'Solving complex problems', 3, '{"trait": "thinking"}'),
        (question_id, 'Helping others and meaningful connections', 4, '{"trait": "feeling"}')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for fifth question
    SELECT id INTO question_id FROM public.assessment_questions 
    WHERE assessment_id = assessment_id AND position = 5 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
      VALUES 
        (question_id, 'With a detailed plan and structured approach', 1, '{"trait": "judging"}'),
        (question_id, 'By staying flexible and adapting as you go', 2, '{"trait": "perceiving"}'),
        (question_id, 'Using proven methods that have worked before', 3, '{"trait": "sensing"}'),
        (question_id, 'Exploring innovative and creative solutions', 4, '{"trait": "intuition"}')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Insert sample library items
INSERT INTO public.library_items (
  title, description, content_type, category, difficulty, duration_minutes, tags, is_public
) VALUES 
  (
    'Understanding Your Personality Type',
    'Learn about the different personality frameworks and how they can guide your personal growth journey.',
    'article',
    'personality',
    'beginner',
    10,
    ARRAY['personality', 'self-discovery', 'psychology'],
    true
  ),
  (
    'Building Emotional Intelligence',
    'Develop your emotional awareness and interpersonal skills for better relationships and personal success.',
    'article',
    'emotional-intelligence',
    'intermediate',
    15,
    ARRAY['emotions', 'relationships', 'communication'],
    true
  ),
  (
    'Goal Setting for Personal Growth',
    'Master the art of setting and achieving meaningful goals that align with your values and aspirations.',
    'article',
    'goals',
    'beginner',
    12,
    ARRAY['goals', 'planning', 'success'],
    true
  ),
  (
    'Mindfulness and Present Moment Awareness',
    'Discover the power of mindfulness to reduce stress and increase life satisfaction.',
    'article',
    'mindfulness',
    'beginner',
    8,
    ARRAY['mindfulness', 'meditation', 'wellness'],
    true
  ),
  (
    'Communication Skills Masterclass',
    'Learn effective communication techniques for personal and professional relationships.',
    'video',
    'communication',
    'intermediate',
    25,
    ARRAY['communication', 'relationships', 'skills'],
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample explorations
INSERT INTO public.explorations (
  title, description, type, visibility, duration_minutes, difficulty_level, tags, content
) VALUES 
  (
    'Values Discovery Journey',
    'Explore your core values and understand how they shape your decisions and life direction.',
    'guided',
    'public',
    20,
    'beginner',
    ARRAY['values', 'self-discovery', 'purpose'],
    '{"steps": [{"title": "Identify Core Values", "description": "Reflect on what matters most to you", "prompts": ["What activities make you feel most fulfilled?", "When do you feel most authentic?"]}, {"title": "Rank Your Values", "description": "Prioritize your top 5 values", "prompts": ["Which values are non-negotiable for you?", "How do these values influence your decisions?"]}, {"title": "Align Actions", "description": "Consider how to better align your actions with your values", "prompts": ["Where in your life do you feel misaligned?", "What small changes could you make today?"]}]}'
  ),
  (
    'Stress Management Techniques',
    'Learn practical strategies for managing stress and building resilience in daily life.',
    'structured',
    'public',
    25,
    'intermediate',
    ARRAY['stress', 'wellness', 'mindfulness'],
    '{"techniques": [{"name": "Deep Breathing", "description": "Practice 4-7-8 breathing technique", "instructions": "Inhale for 4, hold for 7, exhale for 8"}, {"name": "Progressive Muscle Relaxation", "description": "Systematic tension and release of muscle groups", "instructions": "Start with your toes and work up to your head"}, {"name": "Mindful Observation", "description": "Focus attention on present moment sensations", "instructions": "Choose one sense and focus completely on it for 5 minutes"}]}'
  ),
  (
    'Confidence Building Exercises',
    'Develop self-confidence through practical exercises and mindset shifts.',
    'guided',
    'public',
    30,
    'intermediate',
    ARRAY['confidence', 'self-esteem', 'personal-growth'],
    '{"exercises": [{"name": "Success Inventory", "description": "List all your past achievements", "time": "10 minutes"}, {"name": "Power Posing", "description": "Practice confident body language", "time": "5 minutes"}, {"name": "Positive Self-Talk", "description": "Reframe negative thoughts", "time": "15 minutes"}]}'
  ),
  (
    'Life Purpose Exploration',
    'Discover your unique purpose and create a meaningful life path.',
    'free',
    'public',
    35,
    'advanced',
    ARRAY['purpose', 'meaning', 'life-direction'],
    '{"phases": [{"name": "Passion Discovery", "questions": ["What topics could you talk about for hours?", "What activities make you lose track of time?"]}, {"name": "Impact Assessment", "questions": ["How do you want to contribute to the world?", "What problems do you feel called to solve?"]}, {"name": "Integration", "questions": ["How can you combine your passions with meaningful impact?", "What would your ideal day look like?"]}]}'
  )
ON CONFLICT DO NOTHING;

-- Insert sample community posts
INSERT INTO public.posts (
  title, content, type, tags, user_id
) VALUES 
  (
    'Welcome to Growth Echo Nexus!',
    'Hi everyone! I''m excited to be part of this amazing community focused on personal growth and self-discovery. Looking forward to sharing insights and learning from all of you!',
    'text',
    ARRAY['welcome', 'community', 'introduction'],
    NULL -- Will be set by actual users
  ),
  (
    'My Journey with Personality Assessments',
    'I recently completed the personality assessment and it was eye-opening! The insights about my introversion tendencies really helped me understand why I recharge better with alone time. Has anyone else had similar revelations?',
    'text',
    ARRAY['personality', 'assessment', 'insights'],
    NULL
  ),
  (
    'Mindfulness Practice Tips',
    'After weeks of trying different mindfulness techniques, I''ve found that the 4-7-8 breathing exercise works best for me. Here are some tips that helped me get started: 1) Start with just 2-3 cycles 2) Focus on the counting 3) Don''t worry about perfection. What techniques work for you?',
    'text',
    ARRAY['mindfulness', 'tips', 'breathing'],
    NULL
  )
ON CONFLICT DO NOTHING;

-- Insert sample quiz
INSERT INTO public.quizzes (
  title, description, category, difficulty, time_limit_minutes, passing_score, is_public
) VALUES (
  'Emotional Intelligence Quick Check',
  'Test your understanding of emotional intelligence concepts and practices.',
  'emotional-intelligence',
  'beginner',
  10,
  70,
  true
) ON CONFLICT DO NOTHING;

-- Insert quiz questions
DO $$
DECLARE
  quiz_id UUID;
  question_id UUID;
BEGIN
  SELECT id INTO quiz_id FROM public.quizzes WHERE title = 'Emotional Intelligence Quick Check' LIMIT 1;
  
  IF quiz_id IS NOT NULL THEN
    -- Insert quiz questions
    INSERT INTO public.quiz_questions (quiz_id, question_text, points, position)
    VALUES 
      (quiz_id, 'What is the primary component of emotional intelligence?', 2, 1),
      (quiz_id, 'Which skill helps you understand others'' emotions?', 2, 2),
      (quiz_id, 'What is emotional regulation?', 3, 3)
    ON CONFLICT DO NOTHING;

    -- Insert options for first question
    SELECT id INTO question_id FROM public.quiz_questions 
    WHERE quiz_id = quiz_id AND position = 1 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, position, explanation)
      VALUES 
        (question_id, 'Self-awareness', true, 1, 'Self-awareness is the foundation of emotional intelligence'),
        (question_id, 'Academic intelligence', false, 2, 'Academic intelligence is different from emotional intelligence'),
        (question_id, 'Physical fitness', false, 3, 'Physical fitness is not related to emotional intelligence'),
        (question_id, 'Memory skills', false, 4, 'Memory skills are cognitive, not emotional abilities')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for second question
    SELECT id INTO question_id FROM public.quiz_questions 
    WHERE quiz_id = quiz_id AND position = 2 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, position, explanation)
      VALUES 
        (question_id, 'Empathy', true, 1, 'Empathy allows you to understand and share others'' emotions'),
        (question_id, 'Criticism', false, 2, 'Criticism typically creates distance, not understanding'),
        (question_id, 'Ignoring emotions', false, 3, 'Ignoring emotions prevents understanding'),
        (question_id, 'Judging behavior', false, 4, 'Judging creates barriers to emotional understanding')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Insert options for third question
    SELECT id INTO question_id FROM public.quiz_questions 
    WHERE quiz_id = quiz_id AND position = 3 LIMIT 1;
    
    IF question_id IS NOT NULL THEN
      INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, position, explanation)
      VALUES 
        (question_id, 'Managing and controlling your emotional responses', true, 1, 'Emotional regulation involves managing your emotions effectively'),
        (question_id, 'Suppressing all emotions', false, 2, 'Suppression is unhealthy; regulation is about healthy management'),
        (question_id, 'Expressing emotions without filter', false, 3, 'Unfiltered expression lacks regulation'),
        (question_id, 'Avoiding emotional situations', false, 4, 'Avoidance is not regulation')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
