-- Fix infinite recursion in profiles table RLS policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Admins have restricted profile access" ON public.profiles;

-- Update the is_admin function to avoid recursion by using auth.users table
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = uid 
    AND auth.users.email = 'admin@newomen.me'
  );
$$;

-- Create clean, non-recursive RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin policies using the updated is_admin function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));