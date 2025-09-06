
-- Create missing functions for exploration session management
CREATE OR REPLACE FUNCTION public.start_exploration_session(
  exploration_id_input uuid,
  user_id_input uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_id uuid;
BEGIN
  INSERT INTO public.exploration_sessions (
    user_id,
    exploration_id,
    status,
    current_question,
    user_answers
  ) VALUES (
    user_id_input,
    exploration_id_input,
    'in-progress',
    0,
    '[]'::jsonb
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to update exploration session progress
CREATE OR REPLACE FUNCTION public.update_exploration_progress(
  session_id_input uuid,
  question_index_input integer,
  answer_input text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_answers jsonb;
BEGIN
  -- Get current answers
  SELECT user_answers INTO current_answers 
  FROM exploration_sessions 
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Add new answer
  current_answers := current_answers || jsonb_build_array(answer_input);
  
  -- Update session
  UPDATE exploration_sessions 
  SET 
    current_question = question_index_input + 1,
    user_answers = current_answers,
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
END;
$$;

-- Function to complete exploration session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(
  session_id_input uuid,
  final_analysis_input jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  exploration_reward integer;
BEGIN
  -- Get crystal reward for this exploration
  SELECT crystal_reward INTO exploration_reward
  FROM explorations e
  JOIN exploration_sessions es ON e.id = es.exploration_id
  WHERE es.id = session_id_input;
  
  -- Complete the session
  UPDATE exploration_sessions 
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Award crystals
  PERFORM award_crystals(auth.uid(), exploration_reward);
END;
$$;

-- Create personality assessment questions table
CREATE TABLE IF NOT EXISTS public.personality_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personality_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for personality questions
CREATE POLICY "Anyone can view active personality questions" 
  ON public.personality_questions 
  FOR SELECT 
  USING (is_active = true);

-- Insert sample personality questions
INSERT INTO public.personality_questions (question_text, options, category, order_index) VALUES
('How do you typically recharge after a long day?', '["Spending time alone", "Being with friends/family", "Engaging in creative activities", "Physical exercise"]', 'energy', 1),
('When facing a difficult decision, you tend to:', '["Analyze all options logically", "Trust your gut feeling", "Seek advice from others", "Sleep on it"]', 'decision_making', 2),
('Your ideal weekend would include:', '["Learning something new", "Relaxing and doing nothing", "Social activities", "Adventure/exploration"]', 'lifestyle', 3),
('In relationships, you value most:', '["Deep emotional connection", "Intellectual compatibility", "Shared adventures", "Stability and security"]', 'relationships', 4),
('Your approach to personal growth is:', '["Structured and planned", "Intuitive and organic", "Community-based", "Challenge-driven"]', 'growth', 5);

-- Create balance wheel areas table
CREATE TABLE IF NOT EXISTS public.balance_wheel_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.balance_wheel_areas ENABLE ROW LEVEL SECURITY;

-- Create policy for balance wheel areas
CREATE POLICY "Anyone can view active balance wheel areas" 
  ON public.balance_wheel_areas 
  FOR SELECT 
  USING (is_active = true);

-- Insert balance wheel areas
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) VALUES
('Career & Purpose', 'Professional growth and life purpose', 'briefcase', 'hsl(220, 85%, 57%)', 1),
('Health & Wellness', 'Physical and mental wellbeing', 'heart', 'hsl(142, 71%, 45%)', 2),
('Relationships', 'Family, friends, and romantic connections', 'users', 'hsl(346, 87%, 58%)', 3),
('Personal Growth', 'Learning, skills, and self-development', 'trending-up', 'hsl(262, 83%, 58%)', 4),
('Finance & Security', 'Money management and future planning', 'dollar-sign', 'hsl(45, 93%, 47%)', 5),
('Fun & Recreation', 'Hobbies, entertainment, and joy', 'smile', 'hsl(24, 95%, 53%)', 6),
('Spirituality', 'Inner peace and connection to something greater', 'sun', 'hsl(280, 100%, 70%)', 7),
('Environment', 'Living space and surroundings', 'home', 'hsl(173, 58%, 39%)', 8);

-- Create user balance scores table
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES balance_wheel_areas(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for user balance scores
CREATE POLICY "Users can manage their own balance scores" 
  ON public.user_balance_scores 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to save personality assessment
CREATE OR REPLACE FUNCTION public.save_personality_assessment(
  user_id_input uuid,
  answers_input jsonb,
  results_input jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  INSERT INTO public.assessments (
    user_id,
    assessment_type,
    questions,
    answers,
    results,
    crystals_earned
  ) VALUES (
    user_id_input,
    'personality',
    '[]'::jsonb,
    answers_input,
    results_input,
    50
  ) RETURNING id INTO assessment_id;
  
  -- Award crystals for completing assessment
  PERFORM award_crystals(user_id_input, 50);
  
  RETURN assessment_id;
END;
$$;
