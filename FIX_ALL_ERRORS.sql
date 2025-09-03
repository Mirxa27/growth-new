-- Fix 1: Ensure user_profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix 2: Fix performance_metrics table with proper timestamp handling
DROP TABLE IF EXISTS public.performance_metrics CASCADE;

CREATE TABLE public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  tags JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  url TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for performance_metrics
DROP POLICY IF EXISTS "Allow authenticated users to insert metrics" ON public.performance_metrics;
CREATE POLICY "Allow authenticated users to insert metrics" ON public.performance_metrics
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anonymous users to insert metrics too
DROP POLICY IF EXISTS "Allow anonymous users to insert metrics" ON public.performance_metrics;
CREATE POLICY "Allow anonymous users to insert metrics" ON public.performance_metrics
  FOR INSERT TO anon WITH CHECK (true);

-- Fix 3: Create missing tables that might be causing 404s
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- Fix 4: Ensure notification_preferences exists
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "email": {
      "enabled": true,
      "frequency": "immediate",
      "categories": ["achievement", "message", "system"]
    },
    "push": {
      "enabled": true,
      "categories": ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
    },
    "inApp": {
      "enabled": true,
      "sound": true,
      "vibration": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix 5: Grant all necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT ALL ON public.performance_metrics TO anon;
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO anon;
GRANT ALL ON public.notification_preferences TO authenticated;

-- Fix 6: Create profiles for existing users
INSERT INTO public.user_profiles (id, email, created_at, updated_at)
SELECT 
  id,
  COALESCE(email, 'user@example.com'),
  created_at,
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE user_profiles.id = users.id
)
ON CONFLICT (id) DO NOTHING;

-- Fix 7: Create notification preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences WHERE notification_preferences.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Fix 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);