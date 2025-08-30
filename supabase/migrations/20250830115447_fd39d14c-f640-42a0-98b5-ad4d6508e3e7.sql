-- Remove SECURITY DEFINER from functions that don't need it and can rely on RLS

-- 1. get_dashboard_data - just queries dashboard_view, doesn't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id uuid)
 RETURNS TABLE(user_id uuid, personality_completed boolean, personality_progress integer, personality_last_activity timestamp with time zone, values_completed boolean, values_progress integer, values_last_activity timestamp with time zone, exploration_completed boolean, exploration_progress integer, exploration_last_activity timestamp with time zone, overall_progress numeric, next_step_title text, next_step_description text, next_step_cta text, next_step_link text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only allow users to query their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied: Can only query your own dashboard data';
    END IF;

    RETURN QUERY
    SELECT
        dv.user_id,
        dv.personality_completed,
        dv.personality_progress,
        dv.personality_last_activity,
        dv.values_completed,
        dv.values_progress,
        dv.values_last_activity,
        dv.exploration_completed,
        dv.exploration_progress,
        dv.exploration_last_activity,
        dv.overall_progress,
        dv.next_step_title,
        dv.next_step_description,
        dv.next_step_cta,
        dv.next_step_link
    FROM dashboard_view dv
    WHERE dv.user_id = p_user_id;
END;
$function$;

-- 2. get_enhanced_dashboard_data - queries user's own data, can rely on RLS
CREATE OR REPLACE FUNCTION public.get_enhanced_dashboard_data(p_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, crystals_count integer, level_progress integer, subscription_tier text, personality_type text, growth_areas text[], completed_explorations bigint, total_breathing_minutes integer, current_streak integer, recent_achievements jsonb, next_milestone jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to query their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only query your own dashboard data';
  END IF;

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
$function$;

-- 3. save_personality_assessment - can rely on RLS since it's inserting user's own data
CREATE OR REPLACE FUNCTION public.save_personality_assessment(user_id_input uuid, answers_input jsonb, results_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  assessment_id uuid;
BEGIN
  -- Only allow users to save their own assessments
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only save your own assessment results';
  END IF;

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
$function$;

-- 4. start_exploration_session - can rely on RLS since it's creating user's own session
CREATE OR REPLACE FUNCTION public.start_exploration_session(exploration_id_input uuid, user_id_input uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  session_id uuid;
BEGIN
  -- Only allow users to start their own sessions
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only start your own exploration sessions';
  END IF;

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
$function$;

-- 5. update_exploration_progress - can rely on RLS since it's updating user's own session
CREATE OR REPLACE FUNCTION public.update_exploration_progress(session_id_input uuid, question_index_input integer, answer_input text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  current_answers jsonb;
  session_user_id uuid;
BEGIN
  -- Get the session's user_id to verify ownership
  SELECT user_id INTO session_user_id
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Only allow users to update their own sessions
  IF auth.uid() != session_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only update your own exploration sessions';
  END IF;

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
$function$;