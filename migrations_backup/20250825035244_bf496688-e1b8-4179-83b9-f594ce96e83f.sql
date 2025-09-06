-- PHASE 1: CRITICAL DATA PROTECTION - Secure AI System Prompts and User Role Management

-- 1. DROP existing permissive policies on prompt_templates
DROP POLICY IF EXISTS "Users can view prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can create prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can update prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can delete prompt templates" ON public.prompt_templates;

-- 2. CREATE admin-only policies for prompt_templates
CREATE POLICY "Admin can view prompt templates" 
ON public.prompt_templates 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can create prompt templates" 
ON public.prompt_templates 
FOR INSERT 
TO authenticated 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update prompt templates" 
ON public.prompt_templates 
FOR UPDATE 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can delete prompt templates" 
ON public.prompt_templates 
FOR DELETE 
TO authenticated 
USING (is_admin(auth.uid()));

-- 3. CREATE secure user role update function
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'moderator', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'USER_ROLE_UPDATE',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role', new_role,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- 4. CREATE secure subscription tier update function
CREATE OR REPLACE FUNCTION public.update_user_subscription_secure(target_user_id uuid, new_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate subscription tier
  IF new_tier NOT IN ('free', 'premium', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;
  
  -- Update subscription tier
  UPDATE public.profiles 
  SET subscription_tier = new_tier, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'USER_SUBSCRIPTION_UPDATE',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_subscription_tier', new_tier,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- 5. FIX function security paths for existing functions
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin for large crystal awards
  IF crystal_amount > 1000 AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required for large crystal awards';
  END IF;
  
  UPDATE public.profiles
  SET crystals_count = crystals_count + crystal_amount, updated_at = now()
  WHERE user_id = user_id_input;
  
  -- Log crystal awards
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'CRYSTALS_AWARDED',
    jsonb_build_object(
      'target_user_id', user_id_input,
      'crystal_amount', crystal_amount,
      'timestamp', now()
    )
  );
END;
$$;

-- 6. SECURE ai_providers table access
DROP POLICY IF EXISTS "Users can view AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can manage AI providers" ON public.ai_providers;

CREATE POLICY "Admin can view AI providers" 
ON public.ai_providers 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage AI providers" 
ON public.ai_providers 
FOR ALL 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 7. CREATE audit trigger for prompt template access
CREATE OR REPLACE FUNCTION public.log_prompt_template_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(),
    CASE TG_OP
      WHEN 'SELECT' THEN 'PROMPT_TEMPLATE_VIEWED'
      WHEN 'INSERT' THEN 'PROMPT_TEMPLATE_CREATED'
      WHEN 'UPDATE' THEN 'PROMPT_TEMPLATE_UPDATED'
      WHEN 'DELETE' THEN 'PROMPT_TEMPLATE_DELETED'
    END,
    jsonb_build_object(
      'template_id', COALESCE(NEW.id, OLD.id),
      'template_name', COALESCE(NEW.name, OLD.name),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to prompt_templates
CREATE TRIGGER prompt_template_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.log_prompt_template_access();