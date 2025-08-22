-- Fix database security issues

-- 1. Fix database functions by adding proper search path
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET crystals_count = crystals_count + crystal_amount
  WHERE user_id = user_id_input;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_ai_providers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  score INTEGER := 75; -- Base score
  question_count INTEGER;
  similarity_bonus INTEGER := 0;
BEGIN
  -- Basic calculation based on answer similarities and depth
  question_count := jsonb_array_length(answers1);
  
  -- Add bonus for comprehensive answers (length > 50 chars)
  IF question_count >= 8 THEN
    score := score + 10;
  END IF;
  
  -- Return calculated score (ensure it stays within 0-100 range)
  RETURN LEAST(100, GREATEST(0, score + similarity_bonus));
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = uid AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_safe_profiles()
RETURNS TABLE(id uuid, user_id uuid, display_name text, subscription_tier text, role text, crystals_count integer, level_progress integer, login_streak_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, masked_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.subscription_tier,
    p.role,
    p.crystals_count,
    p.level_progress,
    p.login_streak_count,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    -- Mask email to show only first 2 chars + domain
    CASE 
      WHEN LENGTH(p.email) > 0 THEN 
        SUBSTRING(p.email FROM 1 FOR 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE 
        'hidden'
    END as masked_email
  FROM public.profiles p;
$function$;

CREATE OR REPLACE FUNCTION public.get_full_profile_with_logging(target_user_id uuid, access_justification text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profile_data public.profiles;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate justification
  IF access_justification IS NULL OR LENGTH(TRIM(access_justification)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Log the access
  INSERT INTO public.admin_profile_access_logs (admin_user_id, accessed_user_id, justification)
  VALUES (auth.uid(), target_user_id, access_justification);
  
  -- Return the full profile data
  SELECT * INTO profile_data FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  RETURN profile_data;
END;
$function$;

-- 2. Make user_id columns NOT NULL for security-critical tables
-- Note: This will fail if there are existing NULL values, which is intentional
-- for security - we need to clean up the data first

ALTER TABLE public.assessments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.audio_recordings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.voice_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.exploration_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.journal_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_breathing_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_game_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_memory ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_achievements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.webrtc_connection_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.community_connections ALTER COLUMN requester_id SET NOT NULL;
ALTER TABLE public.community_connections ALTER COLUMN requested_id SET NOT NULL;
ALTER TABLE public.couple_challenge_sessions ALTER COLUMN player1_id SET NOT NULL;
ALTER TABLE public.flagged_conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.training_sessions ALTER COLUMN admin_user_id SET NOT NULL;

-- 3. Add foreign key constraints to auth.users where missing
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Restrict some overly permissive RLS policies for authenticated users only
DROP POLICY IF EXISTS "Anyone can view active AI providers" ON public.ai_providers;
CREATE POLICY "Authenticated users can view active AI providers" 
ON public.ai_providers FOR SELECT 
TO authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access to webrtc_providers" ON public.webrtc_providers;
CREATE POLICY "Authenticated users can read webrtc_providers" 
ON public.webrtc_providers FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Authenticated users can view prompt templates" ON public.prompt_templates;
CREATE POLICY "Authenticated users can view active prompt templates" 
ON public.prompt_templates FOR SELECT 
TO authenticated 
USING (is_active = true);

-- 5. Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "System can create audit logs" 
ON public.security_audit_log FOR INSERT 
WITH CHECK (true);