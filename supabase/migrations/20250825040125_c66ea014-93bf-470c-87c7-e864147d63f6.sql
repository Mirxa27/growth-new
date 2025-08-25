-- CRITICAL SECURITY FIXES - Phase 1: Admin Authorization and Access Control (Fixed)

-- 1. FIX the is_admin() function to use role-based authorization instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = uid 
    AND profiles.role = 'admin'
  );
$$;

-- 2. UPDATE all policies that depend on is_admin column to use the new role-based function
-- First update admin_logs policies
DROP POLICY IF EXISTS "Admins can view all admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view all admin logs" 
ON public.admin_logs 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- Update explorations policies
DROP POLICY IF EXISTS "Admins can manage all explorations" ON public.explorations;
CREATE POLICY "Admins can manage all explorations" 
ON public.explorations 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Update exploration_sessions policies
DROP POLICY IF EXISTS "Admins can view all exploration sessions" ON public.exploration_sessions;
CREATE POLICY "Admins can view all exploration sessions" 
ON public.exploration_sessions 
FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));

-- 3. NOW we can safely remove the is_admin column
-- First, create a backup column in case we need to revert
ALTER TABLE public.profiles ADD COLUMN is_admin_backup boolean DEFAULT false;
UPDATE public.profiles SET is_admin_backup = is_admin;

-- Now drop the is_admin column
ALTER TABLE public.profiles DROP COLUMN is_admin;

-- 4. UPDATE all functions to have proper search_path security
CREATE OR REPLACE FUNCTION public.get_admin_safe_profiles()
RETURNS TABLE(id uuid, user_id uuid, display_name text, subscription_tier text, role text, crystals_count integer, level_progress integer, login_streak_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, masked_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    CASE 
      WHEN LENGTH(p.email) > 0 THEN 
        SUBSTRING(p.email FROM 1 FOR 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE 
        'hidden'
    END as masked_email
  FROM public.profiles p;
$$;

CREATE OR REPLACE FUNCTION public.get_full_profile_with_logging(target_user_id uuid, access_justification text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_data public.profiles;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  IF access_justification IS NULL OR LENGTH(TRIM(access_justification)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Valid justification required (minimum 10 characters)';
  END IF;
  
  INSERT INTO public.admin_profile_access_logs (admin_user_id, accessed_user_id, justification)
  VALUES (auth.uid(), target_user_id, access_justification);
  
  SELECT * INTO profile_data FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  RETURN profile_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_setting(key_name text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = key_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_platform_setting(key_name text, new_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  INSERT INTO public.platform_settings (setting_key, setting_value, updated_at)
  VALUES (key_name, new_value, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- 5. SECURE admin tables - remove anonymous access
DROP POLICY IF EXISTS "System can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs" 
ON public.admin_logs 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 6. SECURE ai_providers table - remove anonymous access
DROP POLICY IF EXISTS "Authenticated users can view active AI providers" ON public.ai_providers;
CREATE POLICY "Admins can view all AI providers" 
ON public.ai_providers 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- 7. FIX prompt_templates policies - remove conflicting policies
DROP POLICY IF EXISTS "Authenticated users can manage prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Authenticated users can view prompt templates" ON public.prompt_templates;

-- 8. SECURE flagged_conversations - ensure proper admin access only
DROP POLICY IF EXISTS "Service role can create flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can update flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can view flagged conversations" ON public.flagged_conversations;

CREATE POLICY "Admins can manage flagged conversations" 
ON public.flagged_conversations 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 9. SECURE admin_ai_providers table access
DROP POLICY IF EXISTS "Admin access to AI providers" ON public.admin_ai_providers;
CREATE POLICY "Admins can manage admin AI providers" 
ON public.admin_ai_providers 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 10. SECURE training_sessions table access  
DROP POLICY IF EXISTS "Admin access to training sessions" ON public.training_sessions;
CREATE POLICY "Admins can manage training sessions" 
ON public.training_sessions 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 11. LOG the security fixes
INSERT INTO public.admin_logs (admin_id, action, details)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_HARDENING_APPLIED',
  jsonb_build_object(
    'changes', array[
      'Fixed is_admin() function to use role-based authorization',
      'Updated all dependent policies to use new role-based function',
      'Removed inconsistent is_admin boolean column',
      'Applied proper search_path to all functions',
      'Restricted admin table access to authenticated admins only',
      'Removed anonymous access to sensitive admin data'
    ],
    'timestamp', now(),
    'severity', 'CRITICAL'
  )
);