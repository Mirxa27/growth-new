-- CRITICAL SECURITY FIXES - Phase 2: Fix Function Search Path Security

-- Fix the remaining functions that need SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score INTEGER := 75;
  question_count INTEGER;
  similarity_bonus INTEGER := 0;
BEGIN
  question_count := jsonb_array_length(answers1);
  
  IF question_count >= 8 THEN
    score := score + 10;
  END IF;
  
  RETURN LEAST(100, GREATEST(0, score + similarity_bonus));
END;
$$;

CREATE OR REPLACE FUNCTION public.start_exploration_session(exploration_id_input uuid, user_id_input uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_exploration_progress(session_id_input uuid, question_index_input integer, answer_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.complete_exploration_session(session_id_input uuid, final_analysis_input jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.save_personality_assessment(user_id_input uuid, answers_input jsonb, results_input jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.create_admin_user_privileges(user_id_input uuid, email_input text, display_name_input text DEFAULT 'Admin User'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update existing profile to admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    subscription_tier = 'premium',
    display_name = display_name_input,
    crystals_count = COALESCE(crystals_count, 0) + 1000
  WHERE user_id = user_id_input;
  
  -- Log the admin creation
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
  ) VALUES (
    user_id_input,
    'ADMIN_PRIVILEGES_GRANTED',
    jsonb_build_object('email', email_input, 'display_name', display_name_input),
    NOW()
  );
  
  RETURN true;
END;
$$;

-- Update the handle_new_user function to set proper default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, login_streak_count, last_login_at, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    1,
    now(),
    'user'
  );
  RETURN new;
END;
$$;

-- Fix the admin authorization for all policies that require authentication

-- Fix the issues with user policies requiring authenticated access only
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create new conversations." ON public.conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create new messages." ON public.messages;

CREATE POLICY "Authenticated users can create messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Log completion of Phase 2 security fixes
INSERT INTO public.admin_logs (admin_id, action, details)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_PHASE_2_COMPLETED',
  jsonb_build_object(
    'changes', array[
      'Fixed function search_path security for all remaining functions',
      'Updated admin privilege function to use role instead of is_admin',
      'Fixed user policies to require authenticated access only',
      'Enhanced new user trigger with proper role assignment'
    ],
    'timestamp', now(),
    'severity', 'HIGH'
  )
);