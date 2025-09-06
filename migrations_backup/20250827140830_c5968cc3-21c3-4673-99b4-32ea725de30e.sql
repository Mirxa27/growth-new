-- Create comprehensive schema for Newomen platform

-- 1. Explorations system
CREATE TABLE IF NOT EXISTS public.explorations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'self-discovery',
  difficulty_level text NOT NULL DEFAULT 'beginner',
  estimated_duration integer NOT NULL DEFAULT 30,
  crystal_reward integer NOT NULL DEFAULT 100,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  facilitator_prompt text NOT NULL,
  higher_self_prompt text NOT NULL,
  analysis_structure jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for explorations
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;

-- RLS policies for explorations
CREATE POLICY "Anyone can view active explorations" ON public.explorations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage explorations" ON public.explorations
  FOR ALL USING (is_admin(auth.uid()));

-- 2. Exploration sessions
CREATE TABLE IF NOT EXISTS public.exploration_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exploration_id uuid NOT NULL REFERENCES public.explorations(id),
  status text NOT NULL DEFAULT 'in-progress',
  current_question integer NOT NULL DEFAULT 0,
  user_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_analysis jsonb DEFAULT NULL,
  crystals_earned integer DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for exploration sessions
ALTER TABLE public.exploration_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for exploration sessions
CREATE POLICY "Users can manage their own sessions" ON public.exploration_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.exploration_sessions
  FOR SELECT USING (is_admin(auth.uid()));

-- 3. Personality assessment system
CREATE TABLE IF NOT EXISTS public.personality_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL,
  order_index integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for personality questions
ALTER TABLE public.personality_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for personality questions
CREATE POLICY "Anyone can view active questions" ON public.personality_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON public.personality_questions
  FOR ALL USING (is_admin(auth.uid()));

-- 4. Balance wheel system
CREATE TABLE IF NOT EXISTS public.balance_wheel_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Circle',
  color text NOT NULL DEFAULT '#3b82f6',
  order_index integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for balance wheel areas
ALTER TABLE public.balance_wheel_areas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active areas" ON public.balance_wheel_areas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage areas" ON public.balance_wheel_areas
  FOR ALL USING (is_admin(auth.uid()));

-- 5. User balance scores
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  area_id uuid NOT NULL REFERENCES public.balance_wheel_areas(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS for user balance scores
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own scores" ON public.user_balance_scores
  FOR ALL USING (auth.uid() = user_id);

-- 6. Breathing practices
CREATE TABLE IF NOT EXISTS public.breathing_practices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  duration_minutes integer NOT NULL,
  difficulty_level integer NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 4),
  category text NOT NULL DEFAULT 'relaxation',
  instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
  audio_url text,
  slug text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breathing_practices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active practices" ON public.breathing_practices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage practices" ON public.breathing_practices
  FOR ALL USING (is_admin(auth.uid()));

-- 7. User breathing progress
CREATE TABLE IF NOT EXISTS public.user_breathing_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  practice_id uuid NOT NULL REFERENCES public.breathing_practices(id),
  completed_sessions integer NOT NULL DEFAULT 0,
  total_duration integer NOT NULL DEFAULT 0,
  personal_best_duration integer NOT NULL DEFAULT 0,
  last_completed timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_id)
);

-- Enable RLS
ALTER TABLE public.user_breathing_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own progress" ON public.user_breathing_progress
  FOR ALL USING (auth.uid() = user_id);

-- 8. Community connections
CREATE TABLE IF NOT EXISTS public.community_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  requested_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, requested_id)
);

-- Enable RLS
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own connections" ON public.community_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- 9. Achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'Trophy',
  crystal_reward integer NOT NULL DEFAULT 50,
  unlock_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active achievements" ON public.achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (is_admin(auth.uid()));

-- 10. User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id),
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies  
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personality_type text,
ADD COLUMN IF NOT EXISTS personality_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS growth_areas text[] DEFAULT '{}';

-- Create triggers for updated_at timestamps
CREATE OR REPLACE TRIGGER update_explorations_updated_at
  BEFORE UPDATE ON public.explorations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_exploration_sessions_updated_at
  BEFORE UPDATE ON public.exploration_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_balance_scores_updated_at
  BEFORE UPDATE ON public.user_balance_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_breathing_practices_updated_at
  BEFORE UPDATE ON public.breathing_practices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_breathing_progress_updated_at
  BEFORE UPDATE ON public.user_breathing_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_community_connections_updated_at
  BEFORE UPDATE ON public.community_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();