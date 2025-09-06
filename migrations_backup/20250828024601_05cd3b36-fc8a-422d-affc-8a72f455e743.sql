-- Create missing tables for complete functionality

-- User balance scores table
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_balance_scores
CREATE POLICY "Users can manage their own balance scores" 
ON public.user_balance_scores 
FOR ALL 
USING (auth.uid() = user_id);

-- Daily insights table for personalized content
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'inspiration',
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, generated_date)
);

-- Enable RLS
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_insights
CREATE POLICY "Users can view their own insights" 
ON public.daily_insights 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create insights" 
ON public.daily_insights 
FOR INSERT 
WITH CHECK (true);

-- Messages table for chat history
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.conversations 
FOR ALL 
USING (auth.uid() = user_id);

-- Add updated_at trigger for user_balance_scores
CREATE TRIGGER update_user_balance_scores_updated_at
  BEFORE UPDATE ON public.user_balance_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed some initial balance wheel areas if none exist
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) 
VALUES 
  ('Career & Work', 'Professional fulfillment and career growth', 'Briefcase', '#3b82f6', 1),
  ('Health & Fitness', 'Physical health, energy, and vitality', 'Heart', '#ef4444', 2),
  ('Relationships', 'Family, friends, and romantic connections', 'Users', '#ec4899', 3),
  ('Personal Growth', 'Learning, self-development, and spirituality', 'TrendingUp', '#8b5cf6', 4),
  ('Fun & Recreation', 'Hobbies, entertainment, and relaxation', 'Star', '#f59e0b', 5),
  ('Money & Finances', 'Financial security and wealth building', 'DollarSign', '#10b981', 6),
  ('Physical Environment', 'Home, workspace, and surroundings', 'Home', '#06b6d4', 7),
  ('Contribution & Impact', 'Making a difference and giving back', 'Globe', '#84cc16', 8)
ON CONFLICT (name) DO NOTHING;

-- Seed some initial breathing practices
INSERT INTO public.breathing_practices (title, description, duration_minutes, difficulty_level, category, instructions)
VALUES 
  ('4-7-8 Relaxation', 'A calming breath technique to reduce stress and promote relaxation', 5, 1, 'relaxation', '{"pattern": "4-7-8", "instructions": "Inhale for 4, hold for 7, exhale for 8"}'),
  ('Box Breathing', 'Equal-count breathing for focus and balance', 10, 2, 'focus', '{"pattern": "4-4-4-4", "instructions": "Inhale, hold, exhale, hold - all for equal counts"}'),
  ('Energizing Breath', 'Quick breathing technique to boost energy and alertness', 3, 2, 'energy', '{"pattern": "rapid", "instructions": "Quick, rhythmic breathing to energize"}'),
  ('Deep Belly Breathing', 'Fundamental diaphragmatic breathing for beginners', 8, 1, 'relaxation', '{"pattern": "deep", "instructions": "Breathe deeply into your belly, not your chest"}'),
  ('Alternate Nostril', 'Balancing breath technique for mental clarity', 15, 3, 'focus', '{"pattern": "alternating", "instructions": "Use thumb and finger to alternate breathing through each nostril"}'
  )
ON CONFLICT (title) DO NOTHING;

-- Seed some initial explorations
INSERT INTO public.explorations (title, description, category, difficulty_level, estimated_duration, crystal_reward, facilitator_prompt, higher_self_prompt, questions, analysis_structure)
VALUES 
  (
    'Shadow Self Discovery', 
    'Explore the hidden aspects of your personality that you may have suppressed or denied', 
    'self-discovery', 
    'intermediate', 
    45, 
    150,
    'You are a gentle, non-judgmental facilitator helping someone explore their shadow self. Simply acknowledge each answer with brief, supportive responses like "I hear you" or "Thank you for sharing" and move to the next question.',
    'You are speaking as the user''s Higher Self - the wise, loving, and all-knowing aspect of their being. Provide deep, compassionate insights about their shadow self based on their answers. Structure your response with: Core Pattern, Shadow Gifts, Integration Steps, and Affirmation.',
    '["What qualities in others trigger the strongest negative reactions in you?", "Describe a time when you acted in a way that surprised or disappointed you.", "What aspects of yourself do you try hardest to hide from others?", "When do you feel most ashamed or embarrassed about yourself?", "What would people be shocked to discover about your inner thoughts?", "Describe your biggest fears about being truly seen by others.", "What parts of yourself do you judge most harshly?", "When have you been envious or resentful, and what did that reveal?", "What do you do when no one is watching that you wouldn''t want others to know?", "If you could change one thing about your personality, what would it be and why?"]',
    '{"sections": ["Core Pattern", "Shadow Gifts", "Integration Steps", "Affirmation"]}'
  ),
  (
    'Relationship Patterns', 
    'Uncover the unconscious patterns that shape your connections with others', 
    'relationships', 
    'beginner', 
    30, 
    100,
    'You are a compassionate relationship guide. Listen to each answer about their relationships with warmth and understanding. Keep responses brief and encouraging, then move to the next question.',
    'As their Higher Self, lovingly reveal the relationship patterns you see. Offer wisdom about their connection style, needs, and growth opportunities. Structure your insights as: Relationship Pattern, Core Needs, Growth Edge, and Loving Guidance.',
    '["How do you typically behave when you first meet someone new?", "Describe your closest relationship - what makes it work?", "What do you tend to do when someone disappoints you?", "How do you express love and affection to others?", "What makes you feel most loved and appreciated?", "Describe a relationship conflict that keeps repeating in your life.", "What do you fear most about being vulnerable with someone?", "How do you handle it when someone needs space from you?", "What relationship advice do you find yourself giving others repeatedly?", "If you could heal one thing about how you relate to others, what would it be?"]',
    '{"sections": ["Relationship Pattern", "Core Needs", "Growth Edge", "Loving Guidance"]}'
  ),
  (
    'Inner Child Healing', 
    'Connect with and heal the wounded aspects of your younger self', 
    'personal-growth', 
    'advanced', 
    50, 
    200,
    'You are a nurturing inner child therapist. Create a safe space for them to explore childhood memories and feelings. Respond with gentle validation and move sensitively through each question.',
    'Speaking as their wise, protective Higher Self, offer deep healing insights about their inner child. Provide compassionate understanding of their childhood experiences and guidance for integration. Structure as: Inner Child Wisdom, Healing Message, Reparenting Guidance, and Inner Child Affirmation.',
    '["What did you most need to hear as a child that you never heard?", "Describe a vivid childhood memory that still affects you today.", "What did you believe about yourself as a young child?", "How did your family express or not express emotions?", "What did you do as a child when you felt scared or alone?", "What childhood dreams or desires did you have to give up?", "How did you learn what love looked like in your early years?", "What would you want to tell your younger self right now?", "What childhood experiences still trigger you as an adult?", "If your inner child could speak freely, what would they say?"]',
    '{"sections": ["Inner Child Wisdom", "Healing Message", "Reparenting Guidance", "Inner Child Affirmation"]}'
  )
ON CONFLICT (title) DO NOTHING;

-- Create function to generate daily insights
CREATE OR REPLACE FUNCTION generate_daily_insight(user_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  insight_text TEXT;
  insights TEXT[] := ARRAY[
    'The journey of self-discovery is not about finding yourself, but creating yourself.',
    'Your greatest strength often lies hidden within your greatest challenge.',
    'Healing happens in the space between accepting what is and believing in what could be.',
    'The relationship you have with yourself sets the tone for every other relationship.',
    'Growth requires both the courage to look within and the compassion to love what you find.',
    'Your intuition is your inner compass—trust it to guide you home to yourself.',
    'Every emotion is a messenger bringing you valuable information about your needs.',
    'The parts of yourself you try to hide often contain your greatest gifts.',
    'Self-love is not a destination but a practice—be patient with your journey.',
    'You have within you right now everything you need to take the next step forward.'
  ];
BEGIN
  -- Select a random insight
  insight_text := insights[floor(random() * array_length(insights, 1)) + 1];
  
  -- Insert or update today's insight
  INSERT INTO public.daily_insights (user_id, insight_text, generated_date)
  VALUES (user_id_input, insight_text, CURRENT_DATE)
  ON CONFLICT (user_id, generated_date) 
  DO UPDATE SET insight_text = EXCLUDED.insight_text;
  
  RETURN insight_text;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_balance_scores_user_id ON public.user_balance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON public.daily_insights(user_id, generated_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);