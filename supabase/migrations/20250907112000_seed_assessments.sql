-- Seed 20 Ready-to-Use Assessments
-- Covers all 6 assessment types with varied difficulty and topics

-- First, create assessment types
INSERT INTO public.assessment_types (name, description, category, is_public) VALUES
('Personality Assessment', 'Discover your personality traits and characteristics', 'personality', true),
('Wellness Check', 'Evaluate your overall wellness and lifestyle', 'wellness', true),
('Career Exploration', 'Explore career paths and professional interests', 'career', true),
('Relationship Skills', 'Assess your relationship and communication skills', 'relationships', true),
('Personal Growth', 'Measure your personal development journey', 'growth', true),
('General Knowledge', 'Test your knowledge across various topics', 'general', true);

-- Insert the 20 assessments
INSERT INTO public.assessments (
    slug, title, description, instructions, type, difficulty, estimated_time, 
    passing_score, is_public, requires_auth, is_featured, tags, learning_outcomes
) VALUES 
-- Multiple Choice Assessments (5)
('personality-type-indicator', 'Personality Type Indicator', 
 'Discover your core personality traits and how they influence your daily life and relationships.',
 'Answer each question honestly based on your natural preferences. There are no right or wrong answers.',
 'multiple_choice', 'beginner', 15, 70, true, false, true,
 ARRAY['personality', 'self-discovery', 'psychology'],
 ARRAY['Understand your personality type', 'Identify your strengths and preferences', 'Learn about your communication style']),

('emotional-intelligence-quiz', 'Emotional Intelligence Assessment', 
 'Evaluate your ability to understand and manage emotions in yourself and others.',
 'Consider your typical responses to emotional situations. Choose the answer that best represents your usual behavior.',
 'multiple_choice', 'intermediate', 20, 75, true, false, true,
 ARRAY['emotional-intelligence', 'self-awareness', 'relationships'],
 ARRAY['Assess your emotional awareness', 'Understand your empathy levels', 'Learn about emotional regulation']),

('career-interests-explorer', 'Career Interests Explorer', 
 'Identify career paths that align with your interests, values, and natural abilities.',
 'Think about activities you enjoy and find meaningful. Select options that resonate with you.',
 'multiple_choice', 'beginner', 25, 70, true, false, false,
 ARRAY['career', 'interests', 'professional-development'],
 ARRAY['Discover career interests', 'Explore professional paths', 'Align work with values']),

('leadership-style-assessment', 'Leadership Style Assessment', 
 'Understand your natural leadership approach and how to leverage your strengths.',
 'Consider how you typically behave in leadership situations. Choose your most natural response.',
 'multiple_choice', 'intermediate', 18, 75, true, false, false,
 ARRAY['leadership', 'management', 'professional-skills'],
 ARRAY['Identify your leadership style', 'Understand leadership strengths', 'Learn about team dynamics']),

('learning-preferences-quiz', 'Learning Preferences Quiz', 
 'Discover how you learn best and optimize your educational experiences.',
 'Reflect on your preferred ways of learning and processing information.',
 'multiple_choice', 'beginner', 12, 70, true, false, false,
 ARRAY['learning', 'education', 'self-improvement'],
 ARRAY['Identify learning preferences', 'Optimize study methods', 'Understand cognitive styles']),

-- True/False Quick Checks (3)
('wellness-lifestyle-check', 'Wellness & Lifestyle Quick Check', 
 'A quick assessment of your current wellness habits and lifestyle choices.',
 'Answer true or false based on your current habits and behaviors.',
 'true_false', 'beginner', 8, 70, true, false, true,
 ARRAY['wellness', 'health', 'lifestyle'],
 ARRAY['Evaluate wellness habits', 'Identify improvement areas', 'Understand health factors']),

('stress-management-check', 'Stress Management Quick Check', 
 'Evaluate your current stress levels and coping mechanisms.',
 'Consider your recent experiences with stress. Answer honestly about your current situation.',
 'true_false', 'beginner', 10, 70, true, false, false,
 ARRAY['stress', 'mental-health', 'coping'],
 ARRAY['Assess stress levels', 'Evaluate coping strategies', 'Identify stress triggers']),

('productivity-habits-check', 'Productivity Habits Check', 
 'Quick evaluation of your productivity patterns and time management skills.',
 'Think about your typical work and personal productivity. Answer based on your usual patterns.',
 'true_false', 'beginner', 7, 70, true, false, false,
 ARRAY['productivity', 'time-management', 'habits'],
 ARRAY['Assess productivity habits', 'Identify time wasters', 'Understand work patterns']),

-- Short Answer Reflections (4)
('values-exploration', 'Personal Values Exploration', 
 'Reflect deeply on your core values and what drives your decisions.',
 'Take time to think about each question. Write thoughtful, honest responses about your values and priorities.',
 'short_answer', 'intermediate', 30, 70, true, false, true,
 ARRAY['values', 'self-reflection', 'personal-growth'],
 ARRAY['Identify core values', 'Understand value priorities', 'Connect values to decisions']),

('goal-setting-reflection', 'Goal Setting & Vision Reflection', 
 'Explore your aspirations and create a clearer vision for your future.',
 'Reflect on your dreams and goals. Write detailed responses about your aspirations.',
 'short_answer', 'intermediate', 25, 70, true, false, false,
 ARRAY['goals', 'vision', 'planning'],
 ARRAY['Clarify life goals', 'Create personal vision', 'Develop action plans']),

('relationship-patterns-reflection', 'Relationship Patterns Reflection', 
 'Examine your relationship patterns and communication styles.',
 'Consider your relationships with family, friends, and colleagues. Reflect honestly on your patterns.',
 'short_answer', 'intermediate', 35, 70, true, false, false,
 ARRAY['relationships', 'communication', 'patterns'],
 ARRAY['Understand relationship patterns', 'Improve communication', 'Build better connections']),

('creativity-expression-reflection', 'Creativity & Expression Reflection', 
 'Explore your creative potential and forms of self-expression.',
 'Think about how you express creativity in your life. Share your thoughts openly.',
 'short_answer', 'beginner', 20, 70, true, false, false,
 ARRAY['creativity', 'expression', 'arts'],
 ARRAY['Explore creative potential', 'Identify expression forms', 'Understand artistic preferences']),

-- Timed Quizzes (4)
('general-knowledge-challenge', 'General Knowledge Challenge', 
 'Test your knowledge across various topics in this timed challenge.',
 'You have 15 minutes to answer all questions. Work quickly but carefully.',
 'timed_quiz', 'intermediate', 15, 80, true, false, true,
 ARRAY['knowledge', 'trivia', 'challenge'],
 ARRAY['Test general knowledge', 'Challenge cognitive abilities', 'Learn new facts']),

('critical-thinking-challenge', 'Critical Thinking Challenge', 
 'Solve problems and analyze scenarios in this timed critical thinking test.',
 'Use logic and reasoning to solve each problem. You have 20 minutes total.',
 'timed_quiz', 'advanced', 20, 75, true, false, false,
 ARRAY['critical-thinking', 'problem-solving', 'logic'],
 ARRAY['Develop critical thinking', 'Improve problem-solving', 'Enhance logical reasoning']),

('memory-cognitive-test', 'Memory & Cognitive Speed Test', 
 'Assess your memory and cognitive processing speed.',
 'Complete memory and pattern recognition tasks as quickly and accurately as possible.',
 'timed_quiz', 'intermediate', 12, 70, true, false, false,
 ARRAY['memory', 'cognition', 'speed'],
 ARRAY['Test memory capacity', 'Assess cognitive speed', 'Understand mental agility']),

('decision-making-scenarios', 'Decision Making Scenarios', 
 'Navigate complex scenarios and make decisions under time pressure.',
 'You will face various decision-making scenarios. Choose the best option within the time limit.',
 'timed_quiz', 'advanced', 18, 75, true, false, false,
 ARRAY['decision-making', 'scenarios', 'judgment'],
 ARRAY['Improve decision-making', 'Handle pressure situations', 'Develop judgment skills']),

-- Image Identification Tasks (2)
('visual-perception-test', 'Visual Perception & Pattern Recognition', 
 'Test your ability to identify patterns and visual relationships.',
 'Look carefully at each image and identify the correct pattern or relationship.',
 'image_identification', 'intermediate', 15, 75, true, false, false,
 ARRAY['visual-perception', 'patterns', 'cognition'],
 ARRAY['Enhance visual perception', 'Recognize patterns', 'Improve spatial awareness']),

('emotional-expression-recognition', 'Emotional Expression Recognition', 
 'Identify emotions and expressions in facial images and body language.',
 'Study each image carefully and select the emotion or expression being displayed.',
 'image_identification', 'beginner', 12, 70, true, false, false,
 ARRAY['emotions', 'recognition', 'social-skills'],
 ARRAY['Recognize emotions', 'Understand expressions', 'Improve social awareness']),

-- Audio Response Prompts (2)
('communication-skills-audio', 'Communication Skills Audio Assessment', 
 'Practice your verbal communication skills through audio responses.',
 'Listen to each prompt and respond with clear, thoughtful audio messages.',
 'audio_response', 'intermediate', 25, 70, true, false, false,
 ARRAY['communication', 'speaking', 'verbal-skills'],
 ARRAY['Improve verbal communication', 'Practice speaking skills', 'Build confidence']),

('storytelling-creativity-audio', 'Storytelling & Creativity Audio Challenge', 
 'Express your creativity through storytelling and audio responses.',
 'Use your imagination to create engaging stories based on the given prompts.',
 'audio_response', 'beginner', 20, 70, true, false, false,
 ARRAY['storytelling', 'creativity', 'imagination'],
 ARRAY['Develop storytelling skills', 'Express creativity', 'Build narrative abilities']);

-- Now add questions for each assessment
-- We'll add a representative sample of questions for each assessment type

-- Personality Type Indicator Questions
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'When meeting new people, you tend to:', 'multiple_choice', 1, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'In group settings, you usually:', 'multiple_choice', 2, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'When making decisions, you prefer to:', 'multiple_choice', 3, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'Your ideal weekend involves:', 'multiple_choice', 4, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'When facing challenges, you typically:', 'multiple_choice', 5, 1
FROM public.assessments a WHERE a.slug = 'personality-type-indicator';

-- Add options for personality questions
INSERT INTO public.assessment_options (question_id, option_text, order_index, score_points)
SELECT q.id, 'Feel energized and seek out conversations', 1, 1
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'personality-type-indicator' AND q.order_index = 1;

INSERT INTO public.assessment_options (question_id, option_text, order_index, score_points)
SELECT q.id, 'Feel a bit overwhelmed and prefer smaller groups', 2, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'personality-type-indicator' AND q.order_index = 1;

INSERT INTO public.assessment_options (question_id, option_text, order_index, score_points)
SELECT q.id, 'Take time to observe before engaging', 3, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'personality-type-indicator' AND q.order_index = 1;

-- Wellness Lifestyle Check Questions (True/False)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I exercise regularly (at least 3 times per week)', 'true_false', 1, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I get 7-8 hours of quality sleep most nights', 'true_false', 2, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I eat a balanced diet with plenty of fruits and vegetables', 'true_false', 3, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I manage stress effectively most of the time', 'true_false', 4, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'I maintain meaningful relationships and social connections', 'true_false', 5, 1
FROM public.assessments a WHERE a.slug = 'wellness-lifestyle-check';

-- Add True/False options
INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'True', true, 1, 1
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'wellness-lifestyle-check';

INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'False', false, 2, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'wellness-lifestyle-check';

-- Values Exploration Questions (Short Answer)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'What are the three most important values that guide your life decisions? Explain why each is meaningful to you.', 'short_answer', 1, 5
FROM public.assessments a WHERE a.slug = 'values-exploration';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'Describe a time when you had to choose between two important values. How did you make your decision?', 'short_answer', 2, 5
FROM public.assessments a WHERE a.slug = 'values-exploration';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'How do your values influence your relationships with others? Provide specific examples.', 'short_answer', 3, 5
FROM public.assessments a WHERE a.slug = 'values-exploration';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points) 
SELECT a.id, 'What values do you hope to pass on to future generations? Why are these important?', 'short_answer', 4, 5
FROM public.assessments a WHERE a.slug = 'values-exploration';

-- General Knowledge Challenge Questions (Timed)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, time_limit) 
SELECT a.id, 'Which planet is known as the "Red Planet"?', 'multiple_choice', 1, 2, 30
FROM public.assessments a WHERE a.slug = 'general-knowledge-challenge';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, time_limit) 
SELECT a.id, 'Who wrote the novel "To Kill a Mockingbird"?', 'multiple_choice', 2, 2, 30
FROM public.assessments a WHERE a.slug = 'general-knowledge-challenge';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, time_limit) 
SELECT a.id, 'What is the chemical symbol for gold?', 'multiple_choice', 3, 2, 30
FROM public.assessments a WHERE a.slug = 'general-knowledge-challenge';

-- Add options for general knowledge
INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'Mars', true, 1, 2
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'general-knowledge-challenge' AND q.order_index = 1;

INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'Venus', false, 2, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'general-knowledge-challenge' AND q.order_index = 1;

INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'Jupiter', false, 3, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'general-knowledge-challenge' AND q.order_index = 1;

INSERT INTO public.assessment_options (question_id, option_text, is_correct, order_index, score_points)
SELECT q.id, 'Saturn', false, 4, 0
FROM public.assessment_questions q 
JOIN public.assessments a ON q.assessment_id = a.id 
WHERE a.slug = 'general-knowledge-challenge' AND q.order_index = 1;

-- Visual Perception Test Questions (Image Identification)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, media_type, media_caption) 
SELECT a.id, 'What pattern comes next in this sequence?', 'multiple_choice', 1, 3, 'image', 'Pattern sequence showing geometric shapes'
FROM public.assessments a WHERE a.slug = 'visual-perception-test';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, media_type, media_caption) 
SELECT a.id, 'Which shape is different from the others?', 'multiple_choice', 2, 3, 'image', 'Collection of similar shapes with one different'
FROM public.assessments a WHERE a.slug = 'visual-perception-test';

-- Communication Skills Audio Questions
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, time_limit) 
SELECT a.id, 'Describe a challenging situation you faced recently and how you communicated your way through it.', 'audio_response', 1, 10, 120
FROM public.assessments a WHERE a.slug = 'communication-skills-audio';

INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, order_index, points, time_limit) 
SELECT a.id, 'Practice introducing yourself in a professional setting. Include your background and interests.', 'audio_response', 2, 10, 90
FROM public.assessments a WHERE a.slug = 'communication-skills-audio';

-- Add more questions for other assessments (abbreviated for space)
-- In a real implementation, each assessment would have 10-20 questions

-- Update assessment analytics for initial state
INSERT INTO public.assessment_analytics (assessment_id, total_attempts, completed_attempts, passed_attempts)
SELECT id, 0, 0, 0 FROM public.assessments WHERE is_public = true;