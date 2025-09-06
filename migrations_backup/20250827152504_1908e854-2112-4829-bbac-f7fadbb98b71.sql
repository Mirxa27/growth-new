-- Fix critical RLS security issues
-- Enable RLS on tables that are missing it

-- ai_providers table
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for ai_providers
CREATE POLICY "Admins can manage AI providers"
ON public.ai_providers
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- training_sessions table
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for training_sessions
CREATE POLICY "Admins can manage training sessions"
ON public.training_sessions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "System can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true); -- This allows the trigger to create profiles

-- admin_ai_providers table
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_ai_providers
CREATE POLICY "Admins can manage admin AI providers"
ON public.admin_ai_providers
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate role
  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_subscription_secure(target_user_id uuid, new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update subscriptions
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate tier
  IF new_tier NOT IN ('free', 'discovery', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;

  -- Update the subscription tier
  UPDATE public.profiles 
  SET subscription_tier = new_tier, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;