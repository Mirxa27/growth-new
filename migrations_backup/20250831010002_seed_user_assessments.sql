-- Seed 20+ user assessments that require login

INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt) VALUES
-- Career & Professional Development
('Career Clarity Assessment', 'Discover your ideal career path and professional strengths. Understand what drives your career satisfaction and success.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on career clarity and professional direction'),
('Professional Development Roadmap', 'Identify your key areas for professional growth and create a personalized development plan.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on professional development needs'),
('Work-Life Balance Assessment', 'Evaluate your current work-life balance and discover strategies for better integration and wellbeing.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on work-life balance patterns'),
('Leadership Potential Assessment', 'Explore your leadership capabilities and identify areas for leadership development.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on leadership potential and skills'),

-- Relationships & Social
('Relationship Patterns Assessment', 'Understand your patterns in relationships and discover how to build healthier connections.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on relationship dynamics and patterns'),
('Social Connection Style', 'Discover how you naturally connect with others and your social communication preferences.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on social connection and interaction styles'),
('Conflict Resolution Style', 'Learn about your natural approach to handling conflicts and disagreements.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on conflict resolution approaches'),
('Communication in Relationships', 'Assess your communication patterns in close relationships and romantic partnerships.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on relationship communication styles'),

-- Personal Growth & Psychology
('Personal Growth Readiness', 'Evaluate your readiness for personal transformation and identify your growth motivations.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal growth mindset and readiness'),
('Self-Compassion Assessment', 'Discover your relationship with yourself and learn to develop greater self-kindness.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on self-compassion and self-relationship'),
('Personal Boundaries Assessment', 'Evaluate your ability to set and maintain healthy boundaries in all areas of life.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal boundaries and boundary-setting'),
('Resilience & Recovery Assessment', 'Assess your resilience patterns and discover strategies for bouncing back from challenges.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on resilience and recovery patterns'),
('Life Satisfaction Assessment', 'Evaluate your overall life satisfaction and identify areas for improvement and growth.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on life satisfaction and fulfillment'),

-- Productivity & Habits
('Productivity Style Assessment', 'Discover your natural productivity patterns and optimize your work approach.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on productivity styles and preferences'),
('Time Management Style', 'Understand how you naturally approach time and discover better time management strategies.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on time management approaches'),
('Goal Setting & Achievement', 'Assess your approach to setting and achieving goals, and develop better goal strategies.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on goal-setting and achievement patterns'),
('Habit Formation Assessment', 'Understand how you naturally build habits and break unwanted patterns.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on habit formation and change'),

-- Psychology & Mindset
('Financial Mindset Assessment', 'Explore your beliefs and behaviors around money and financial decision-making.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on financial psychology and money mindset'),
('Decision Making Process', 'Discover your natural decision-making style and learn to make better choices.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on decision-making processes and styles'),
('Adaptability & Change Assessment', 'Evaluate how you handle change and uncertainty, and develop greater adaptability.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on adaptability and change management'),
('Motivation Drivers Assessment', 'Understand what truly motivates you and how to harness your intrinsic motivations.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal motivation and drivers'),

-- Creativity & Learning
('Creativity & Innovation Style', 'Discover your creative strengths and learn to enhance your innovative thinking.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on creativity and innovation patterns'),
('Learning Style Assessment', 'Understand how you naturally learn and process information for better knowledge retention.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on learning preferences and styles'),

-- Wellness & Mental Health
('Mental Health & Wellbeing Check', 'Assess your current mental health status and identify areas for wellbeing improvement.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on mental health and wellbeing indicators'),
('Energy Management Assessment', 'Discover your energy patterns and learn to manage your physical and mental energy better.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on energy management and optimization');