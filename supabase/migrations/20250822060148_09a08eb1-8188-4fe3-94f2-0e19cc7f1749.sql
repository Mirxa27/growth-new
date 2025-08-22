-- Fix database security issues (avoiding duplicates)

-- 1. Fix database functions by adding proper search path (these will replace existing ones)
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

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- 2. Restrict overly permissive RLS policies
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

-- 3. Add audit logging table for sensitive operations
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