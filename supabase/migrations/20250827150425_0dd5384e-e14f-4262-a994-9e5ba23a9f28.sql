-- Create essential database functions for Newomen platform

-- 1. Function to save personality assessment
CREATE OR REPLACE FUNCTION public.save_personality_assessment(
  user_id_input uuid,
  answers_input jsonb,
  results_input jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  -- Insert assessment results
  INSERT INTO public.assessment_results (
    user_id,
    assessment_type,
    answers,
    results,
    completed_at
  ) VALUES (
    user_id_input,
    'personality',
    answers_input,
    results_input,
    now()
  ) RETURNING id INTO assessment_id;

  -- Award crystals for completing assessment
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + 50
  WHERE user_id = user_id_input;

  RETURN assessment_id;
END;
$$;

-- 2. Function to start exploration session
CREATE OR REPLACE FUNCTION public.start_exploration_session(
  exploration_id_input uuid,
  user_id_input uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Create new exploration session
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

-- 3. Function to update exploration progress
CREATE OR REPLACE FUNCTION public.update_exploration_progress(
  session_id_input uuid,
  question_index_input integer,
  answer_input text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_answers jsonb;
BEGIN
  -- Get current answers
  SELECT user_answers INTO current_answers
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Add new answer to the array
  current_answers := current_answers || jsonb_build_array(answer_input);

  -- Update session
  UPDATE public.exploration_sessions
  SET 
    user_answers = current_answers,
    current_question = question_index_input + 1,
    updated_at = now()
  WHERE id = session_id_input;
END;
$$;

-- 4. Function to complete exploration session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(
  session_id_input uuid,
  final_analysis_input jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_val uuid;
  crystal_reward_val integer;
BEGIN
  -- Get user_id and crystal reward
  SELECT es.user_id, e.crystal_reward
  INTO user_id_val, crystal_reward_val
  FROM public.exploration_sessions es
  JOIN public.explorations e ON es.exploration_id = e.id
  WHERE es.id = session_id_input;

  -- Complete the session
  UPDATE public.exploration_sessions
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    crystals_earned = crystal_reward_val,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input;

  -- Award crystals
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_reward_val
  WHERE user_id = user_id_val;
END;
$$;

-- 5. Function to award crystals
CREATE OR REPLACE FUNCTION public.award_crystals(
  user_id_input uuid,
  crystal_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_amount
  WHERE user_id = user_id_input;
END;
$$;

-- 6. Create profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    display_name,
    email,
    crystals_count,
    level_progress,
    login_streak_count,
    subscription_tier,
    role,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    0,
    1,
    'free',
    'user',
    now()
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enhanced dashboard function with real data
CREATE OR REPLACE FUNCTION public.get_enhanced_dashboard_data(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  crystals_count integer,
  level_progress integer,
  subscription_tier text,
  personality_type text,
  growth_areas text[],
  completed_explorations bigint,
  total_breathing_minutes integer,
  current_streak integer,
  recent_achievements jsonb,
  next_milestone jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    COALESCE(p.crystals_count, 0) as crystals_count,
    COALESCE(p.level_progress, 0) as level_progress,
    COALESCE(p.subscription_tier, 'free') as subscription_tier,
    p.personality_type,
    COALESCE(p.growth_areas, '{}') as growth_areas,
    
    -- Count completed explorations
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM exploration_sessions es 
      WHERE es.user_id = p_user_id AND es.status = 'completed'
    ), 0) as completed_explorations,
    
    -- Total breathing practice minutes
    COALESCE((
      SELECT SUM(ubp.total_duration)::integer
      FROM user_breathing_progress ubp
      WHERE ubp.user_id = p_user_id
    ), 0) as total_breathing_minutes,
    
    -- Current login streak
    COALESCE(p.login_streak_count, 0) as current_streak,
    
    -- Recent achievements (last 3)
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'title', a.title,
          'crystal_reward', a.crystal_reward,
          'unlocked_at', ua.unlocked_at
        )
      )
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = p_user_id
      ORDER BY ua.unlocked_at DESC
      LIMIT 3
    ), '[]'::jsonb) as recent_achievements,
    
    -- Next milestone
    jsonb_build_object(
      'title', 'Level Up',
      'progress', COALESCE(p.crystals_count, 0) % 100,
      'target', 100,
      'description', 'Earn ' || (100 - (COALESCE(p.crystals_count, 0) % 100)) || ' more crystals to level up!'
    ) as next_milestone
    
  FROM profiles p
  WHERE p.user_id = p_user_id;
END;
$$;