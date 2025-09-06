-- Add is_admin column to profiles table first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create function to create admin privileges
CREATE OR REPLACE FUNCTION create_admin_user_privileges(
  user_id_input UUID,
  email_input TEXT,
  display_name_input TEXT DEFAULT 'Admin User'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update existing profile to admin
  UPDATE public.profiles 
  SET 
    is_admin = true,
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

-- Admin logs policies
CREATE POLICY "Admins can view all admin logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert admin logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (true);

-- Update profiles policies to allow admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update own profile or admins can update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create admin access for explorations
CREATE POLICY "Admins can manage all explorations"
  ON public.explorations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create admin access for exploration sessions
CREATE POLICY "Admins can view all exploration sessions"
  ON public.exploration_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Instructions for creating admin users:
-- 1. Sign up with admin@newomen.me through the normal auth flow
-- 2. Get the user ID from the profiles table
-- 3. Run: SELECT create_admin_user_privileges('[USER_ID]', 'admin@newomen.me', 'Admin User');