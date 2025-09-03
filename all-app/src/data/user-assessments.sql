-- Insert 20 premium assessments for registered users
INSERT INTO public.assessments (title, description, instructions, category_id, time_limit, passing_score, is_active, is_free, requires_auth, difficulty) VALUES
-- Professional Development
('Leadership Style Assessment', 'Identify your leadership strengths and areas for growth', 'Answer questions about your approach to leadership and team management', NULL, 25, 0, true, false, true, 'medium'),
('Time Management Skills', 'Evaluate your ability to manage time effectively and prioritize tasks', 'Rate how well each statement describes your time management habits', NULL, 20, 0, true, false, true, 'easy'),
('Conflict Resolution Style', 'Discover your preferred approach to handling conflicts', 'Choose the response that best matches your typical behavior', NULL, 15, 0, true, false, true, 'medium'),
('Decision Making Profile', 'Understand your decision-making process and cognitive biases', 'Select options that reflect your decision-making approach', NULL, 30, 0, true, false, true, 'hard'),

-- Technical Skills
('Programming Aptitude Test', 'Assess your logical thinking and problem-solving skills for programming', 'Solve logical puzzles and coding scenarios', NULL, 45, 70, true, false, true, 'hard'),
('Digital Literacy Assessment', 'Evaluate your comfort and skills with modern technology', 'Answer questions about various digital tools and concepts', NULL, 20, 60, true, false, true, 'easy'),
('Data Analysis Readiness', 'Test your analytical thinking and data interpretation skills', 'Analyze data scenarios and draw conclusions', NULL, 35, 65, true, false, true, 'medium'),

-- Soft Skills
('Teamwork Effectiveness', 'Measure your ability to work effectively in team settings', 'Rate your behaviors and preferences in team situations', NULL, 20, 0, true, false, true, 'easy'),
('Creative Thinking Assessment', 'Evaluate your creative problem-solving abilities', 'Complete creative challenges and scenarios', NULL, 30, 0, true, false, true, 'medium'),
('Adaptability Quotient', 'Assess how well you handle change and uncertainty', 'Respond to scenarios involving change and adaptation', NULL, 25, 0, true, false, true, 'medium'),

-- Personal Growth
('Mindfulness & Self-Awareness', 'Measure your level of mindfulness and self-awareness', 'Reflect on your thoughts, emotions, and behaviors', NULL, 20, 0, true, false, true, 'easy'),
('Goal Setting Proficiency', 'Evaluate your ability to set and achieve meaningful goals', 'Answer questions about your goal-setting practices', NULL, 15, 0, true, false, true, 'easy'),
('Resilience Assessment', 'Measure your ability to bounce back from challenges', 'Rate how you typically respond to setbacks', NULL, 20, 0, true, false, true, 'medium'),

-- Career Specific
('Sales Personality Profile', 'Discover if you have the traits of a successful salesperson', 'Answer questions about your communication and persuasion style', NULL, 25, 0, true, false, true, 'medium'),
('Teaching Aptitude Test', 'Assess your potential as an educator', 'Respond to teaching scenarios and pedagogical questions', NULL, 30, 65, true, false, true, 'medium'),
('Entrepreneurial Mindset', 'Evaluate your entrepreneurial traits and readiness', 'Answer questions about risk-taking, innovation, and business thinking', NULL, 25, 0, true, false, true, 'hard'),

-- Specialized Assessments
('Cultural Intelligence Scale', 'Measure your ability to work across cultures', 'Rate your comfort and skills in multicultural situations', NULL, 20, 0, true, false, true, 'medium'),
('Financial Literacy Test', 'Assess your understanding of personal finance concepts', 'Answer questions about budgeting, investing, and financial planning', NULL, 30, 70, true, false, true, 'medium'),
('Environmental Awareness Quiz', 'Test your knowledge of environmental issues and sustainability', 'Answer questions about climate, conservation, and eco-friendly practices', NULL, 25, 60, true, false, true, 'easy'),
('Work-Life Balance Evaluator', 'Assess how well you balance professional and personal life', 'Reflect on your current work-life integration', NULL, 15, 0, true, false, true, 'easy');

-- Insert sample questions for the Leadership Style Assessment
INSERT INTO public.questions (assessment_id, question_text, question_type, options, points, order_index) 
SELECT 
  id,
  unnest(ARRAY[
    'I prefer to make decisions collaboratively with my team',
    'I set clear expectations and hold people accountable',
    'I adapt my leadership style based on the situation',
    'I focus on developing my team members'' strengths',
    'I lead by example and model the behavior I expect'
  ]),
  'rating',
  NULL,
  1,
  generate_series(1, 5)
FROM public.assessments 
WHERE title = 'Leadership Style Assessment'
LIMIT 1;

-- Insert sample questions for Programming Aptitude Test
INSERT INTO public.questions (assessment_id, question_text, question_type, options, points, order_index) 
SELECT 
  id,
  'If all roses are flowers and some flowers fade quickly, which statement must be true?',
  'multiple_choice',
  '["All roses fade quickly", "Some roses fade quickly", "No roses fade quickly", "Cannot be determined"]'::jsonb,
  1,
  1
FROM public.assessments 
WHERE title = 'Programming Aptitude Test'
LIMIT 1;