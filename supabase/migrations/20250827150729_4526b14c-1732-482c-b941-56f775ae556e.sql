-- Seed database with essential sample data for Newomen platform

-- 1. Add sample personality questions
INSERT INTO public.personality_questions (question_text, options, category, order_index) VALUES
('How do you typically recharge after a long day?', '["Reading or quiet activities", "Spending time with friends", "Physical exercise", "Creative pursuits"]', 'energy', 1),
('When facing a difficult decision, you usually:', '["Analyze all options carefully", "Trust your gut feeling", "Seek advice from others", "Research extensively"]', 'decision_making', 2),
('Your ideal weekend involves:', '["Planned activities and socializing", "Spontaneous adventures", "Quiet time at home", "Learning something new"]', 'lifestyle', 3),
('In relationships, you value most:', '["Deep emotional connection", "Shared interests and activities", "Independence and space", "Loyalty and commitment"]', 'relationships', 4),
('Your approach to personal growth is:', '["Setting specific goals", "Following your intuition", "Learning from others", "Trying new experiences"]', 'growth', 5),
('When you feel stressed, you typically:', '["Talk to someone about it", "Find a quiet space to think", "Engage in physical activity", "Distract yourself with activities"]', 'energy', 6),
('Your communication style is usually:', '["Direct and to the point", "Warm and encouraging", "Thoughtful and measured", "Enthusiastic and expressive"]', 'relationships', 7),
('You prefer to learn new things by:', '["Reading and research", "Hands-on experience", "Watching and observing", "Discussing with others"]', 'decision_making', 8),
('Your living space reflects:', '["Minimalism and order", "Comfort and warmth", "Creativity and inspiration", "Functionality above all"]', 'lifestyle', 9),
('When setting goals, you focus on:', '["Long-term vision", "Immediate actionable steps", "Emotional fulfillment", "Impact on others"]', 'growth', 10)
ON CONFLICT DO NOTHING;

-- 2. Add sample balance wheel areas
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) VALUES
('Career & Purpose', 'Your professional life, work satisfaction, and sense of purpose', 'Briefcase', '#3b82f6', 1),
('Health & Wellness', 'Physical health, energy levels, and overall well-being', 'Heart', '#ef4444', 2),
('Relationships & Love', 'Romantic relationships, family bonds, and social connections', 'Users', '#ec4899', 3),
('Personal Growth', 'Learning, self-development, and expanding your horizons', 'TrendingUp', '#8b5cf6', 4),
('Fun & Recreation', 'Hobbies, entertainment, and activities that bring you joy', 'Sparkles', '#f59e0b', 5),
('Money & Finances', 'Financial security, abundance, and money management', 'DollarSign', '#10b981', 6),
('Home & Environment', 'Your living space, surroundings, and physical environment', 'Home', '#6b7280', 7),
('Contribution & Service', 'Giving back, helping others, and making a positive impact', 'Gift', '#14b8a6', 8)
ON CONFLICT DO NOTHING;

-- 3. Add sample explorations
INSERT INTO public.explorations (title, description, category, difficulty_level, estimated_duration, crystal_reward, questions, facilitator_prompt, higher_self_prompt) VALUES
(
  'Discovering Your Inner Voice',
  'A gentle exploration to reconnect with your authentic self and inner wisdom.',
  'self-discovery',
  'beginner',
  30,
  150,
  '["What does your inner voice sound like to you?", "When do you feel most authentically yourself?", "What beliefs about yourself have you inherited from others?", "What would you do if you knew you couldn''t fail?", "How do you typically silence or ignore your inner voice?", "What does your inner voice want you to know right now?", "When have you trusted your intuition and been glad you did?", "What fears come up when you think about being truly authentic?", "How has your relationship with yourself changed over the years?", "What message does your authentic self want to share with the world?"]',
  'You are a gentle, supportive facilitator helping a woman explore her inner voice. Listen deeply to each answer with compassion. Acknowledge each response with brief, encouraging phrases like "Thank you for sharing that" or "I hear you" before moving to the next question. Your role is to create a safe, non-judgmental space.',
  'Now you are speaking as this woman''s Higher Self - her wisest, most loving inner voice. You have listened to all her answers with deep compassion. Provide a loving analysis that includes: **Core Pattern**: What you notice about how she relates to her authentic self. **Hidden Potential**: Gifts and strengths she may not fully recognize. **Actionable Steps**: 3 specific ways she can strengthen her connection to her inner voice. **Affirmations**: 2 powerful affirmations based on her responses. **Encouragement**: A loving message about her journey of self-discovery.'
),
(
  'Healing Your Relationship with Fear',
  'Transform your relationship with fear from enemy to ally through deep exploration.',
  'personal-growth',
  'intermediate',
  45,
  200,
  '["How does fear typically show up in your body?", "What fears have you carried since childhood?", "When has fear protected you, and when has it limited you?", "What would you attempt if fear wasn''t a factor?", "How do you usually react when fear arises?", "What stories does your fear tell you about yourself?", "When have you acted despite being afraid?", "What is fear trying to teach or protect in you?", "How would your life change if you had a healthier relationship with fear?", "What message of love would you give to your fearful self?"]',
  'You are a compassionate facilitator guiding someone through a deep exploration of fear. Hold space with warmth and understanding. Fear is a vulnerable topic, so respond to each answer with gentle acknowledgment before moving to the next question.',
  'Speaking as her Higher Self, you understand that fear is not her enemy but a messenger. Provide insights that include: **Core Pattern**: How she currently relates to and experiences fear. **Hidden Potential**: The courage and strength that lies beneath her fears. **Actionable Steps**: 3 practical ways to transform her relationship with fear. **Affirmations**: 2 courage-building affirmations. **Encouragement**: A message about how fear can become an ally in her growth journey.'
),
(
  'Exploring Your Relationship Patterns',
  'Uncover the unconscious patterns that shape your connections with others.',
  'relationships',
  'advanced',
  40,
  180,
  '["What patterns do you notice in your closest relationships?", "How did your family dynamics shape your view of relationships?", "What do you find yourself repeatedly attracting in partners or friends?", "When do you lose yourself in relationships, and when do you maintain your identity?", "What role do you typically play in relationships (caretaker, rebel, peacemaker, etc.)?", "How do you handle conflict and disagreement in relationships?", "What do you give in relationships, and what do you struggle to receive?", "What beliefs about love and connection did you learn early in life?", "When have you felt most seen and understood by another person?", "What would change in your relationships if you loved yourself more fully?"]',
  'You are facilitating a deep exploration of relationship patterns. This requires vulnerability, so create an atmosphere of complete safety and non-judgment. Acknowledge each response with compassion before continuing.',
  'As her Higher Self, you see the beautiful patterns and growth opportunities in her relationships. Provide loving insight including: **Core Pattern**: The primary relationship dynamic she recreates. **Hidden Potential**: Her capacity for deeper, more authentic connections. **Actionable Steps**: 3 ways to create healthier relationship patterns. **Affirmations**: 2 relationship-focused affirmations. **Encouragement**: A message about her worthiness of love and authentic connection.'
)
ON CONFLICT DO NOTHING;

-- 4. Add sample breathing practices
INSERT INTO public.breathing_practices (title, description, duration_minutes, difficulty_level, category, instructions) VALUES
(
  '4-7-8 Relaxation Breath',
  'A powerful technique to calm the nervous system and reduce anxiety.',
  5,
  1,
  'relaxation',
  '{"steps": ["Exhale completely through your mouth", "Close your mouth and inhale through your nose for 4 counts", "Hold your breath for 7 counts", "Exhale through your mouth for 8 counts", "Repeat for 4 cycles"], "benefits": ["Reduces anxiety", "Improves sleep", "Calms nervous system"]}'
),
(
  'Box Breathing for Focus',
  'Used by Navy SEALs, this technique enhances concentration and mental clarity.',
  10,
  2,
  'focus',
  '{"steps": ["Inhale for 4 counts", "Hold for 4 counts", "Exhale for 4 counts", "Hold empty for 4 counts", "Repeat for the full duration"], "benefits": ["Improves focus", "Reduces stress", "Enhances performance"]}'
),
(
  'Energizing Breath of Fire',
  'A dynamic breathing practice to boost energy and mental alertness.',
  8,
  3,
  'energy',
  '{"steps": ["Sit with straight spine", "Breathe rapidly through the nose", "Focus on sharp exhales, let inhales happen naturally", "Keep the rhythm steady and powerful", "Rest and breathe normally between rounds"], "benefits": ["Increases energy", "Boosts metabolism", "Enhances mental clarity"]}'
),
(
  'Heart Coherence Breathing',
  'Synchronize your heart, mind, and emotions for optimal well-being.',
  12,
  2,
  'relaxation',
  '{"steps": ["Place hand on heart", "Breathe slowly and deeply", "Inhale for 5 counts, exhale for 5 counts", "Focus on feelings of gratitude or appreciation", "Maintain smooth, rhythmic breathing"], "benefits": ["Improves heart rate variability", "Reduces stress hormones", "Enhances emotional balance"]}'
)
ON CONFLICT DO NOTHING;

-- 5. Add sample achievements
INSERT INTO public.achievements (title, description, icon, crystal_reward, unlock_criteria) VALUES
('First Steps', 'Completed your first personality assessment', 'Award', 50, '{"type": "assessment_completed", "assessment_type": "personality"}'),
('Self Discoverer', 'Completed your first themed exploration', 'Star', 100, '{"type": "exploration_completed", "count": 1}'),
('Inner Wisdom Seeker', 'Completed 5 themed explorations', 'Crown', 250, '{"type": "exploration_completed", "count": 5}'),
('Breath Master', 'Practiced breathing exercises for 60 minutes total', 'Wind', 75, '{"type": "breathing_total_minutes", "minutes": 60}'),
('Community Builder', 'Made your first community connection', 'Users', 50, '{"type": "community_connection", "count": 1}'),
('Balance Seeker', 'Completed your life balance wheel assessment', 'Target', 75, '{"type": "balance_wheel_completed"}'),
('Consistent Practitioner', 'Used the app for 7 consecutive days', 'Calendar', 150, '{"type": "login_streak", "days": 7}'),
('Crystal Collector', 'Earned your first 500 crystals', 'Gem', 100, '{"type": "crystals_earned", "amount": 500}'),
('Voice of Wisdom', 'Had 10 voice conversations with NewMe', 'MessageSquare', 125, '{"type": "voice_conversations", "count": 10}'),
('Growth Catalyst', 'Completed explorations in 3 different categories', 'TrendingUp', 200, '{"type": "exploration_categories", "categories": 3}')
ON CONFLICT DO NOTHING;

-- 6. Enable RLS on missing tables
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for public content
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage AI providers" ON public.ai_providers
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage admin AI providers" ON public.admin_ai_providers
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage training sessions" ON public.training_sessions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (is_admin(auth.uid()));

-- Update policies to require authentication for user-specific actions
DROP POLICY IF EXISTS "Users can manage their own assessment progress" ON public.assessment_progress;
CREATE POLICY "Authenticated users can manage their own assessment progress" ON public.assessment_progress
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Authenticated users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own connections" ON public.community_connections;
CREATE POLICY "Authenticated users can manage their own connections" ON public.community_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = requested_id);