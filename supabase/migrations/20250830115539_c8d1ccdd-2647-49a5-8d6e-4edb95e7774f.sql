-- Remove SECURITY DEFINER from remaining functions that don't need it

-- 1. award_crystals - can rely on RLS since it's updating user's own profile
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to award crystals to themselves (this would typically be called by the system)
  -- Or allow if called by a SECURITY DEFINER function (auth.uid() would be null in that case)
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only award crystals to yourself';
  END IF;

  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_amount
  WHERE user_id = user_id_input;
END;
$function$;

-- 2. complete_exploration_session - can rely on RLS since it's updating user's own session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(session_id_input uuid, final_analysis_input jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  user_id_val uuid;
  crystal_reward_val integer;
  session_user_id uuid;
BEGIN
  -- Get the session's user_id to verify ownership
  SELECT user_id INTO session_user_id
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Only allow users to complete their own sessions
  IF auth.uid() IS NOT NULL AND auth.uid() != session_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only complete your own exploration sessions';
  END IF;

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
$function$;