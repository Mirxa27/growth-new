-- Create admin user and set up admin credentials for newomen.me
-- First, let's create a function to create admin users

CREATE OR REPLACE FUNCTION create_admin_user(
  email_input TEXT,
  display_name_input TEXT DEFAULT 'Admin User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
BEGIN
  -- Generate a UUID for the admin user
  user_id := gen_random_uuid();
  
  -- Insert into auth.users (this would normally be handled by Supabase Auth)
  -- Note: In production, admin users should sign up through the normal auth flow
  -- This is just for demo purposes
  
  -- Create profile with admin privileges
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    display_name,
    is_admin,
    subscription_tier,
    crystals_count,
    growth_areas,
    personality_type,
    preferences,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    email_input,
    display_name_input,
    true, -- Admin flag
    'premium',
    1000, -- Start with crystals
    ARRAY['Leadership', 'Platform Management', 'User Experience'],
    'ADMIN',
    '{"theme": "dark", "notifications": true, "language": "en"}',
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO profile_id;
  
  -- Log the admin creation
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
  ) VALUES (
    user_id,
    'ADMIN_CREATED',
    format('Admin user created: %s (%s)', display_name_input, email_input),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- Create admin logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

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

-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create RLS policy for admin access
CREATE POLICY "Admins can access all profiles"
  ON public.profiles
  FOR ALL
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

-- Create admin access policies for other tables
CREATE POLICY "Admins can manage explorations"
  ON public.explorations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

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

-- Create example admin users for newomen.me
-- Note: These users would need to actually sign up through Supabase Auth
-- This just prepares their profiles with admin privileges

-- You can use these emails to sign up as admin:
-- admin@newomen.me
-- founder@newomen.me

-- After migration, to create an admin user:
-- 1. Sign up normally through the app with admin@newomen.me
-- 2. Then run: SELECT create_admin_user('admin@newomen.me', 'Admin User');
-- 3. Update the user's profile to set is_admin = true

COMMENT ON FUNCTION create_admin_user IS 'Creates admin user profile after user signs up through Supabase Auth';
COMMENT ON TABLE admin_logs IS 'Logs admin actions for security and auditing';
COMMENT ON COLUMN profiles.is_admin IS 'Grants admin privileges to user';