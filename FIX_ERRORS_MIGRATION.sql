-- Fix 406 Not Acceptable Error for notification_preferences
-- This error occurs when RLS policies are too restrictive or the query doesn't match the expected format

-- First, ensure the table exists
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.notification_preferences;

-- Disable RLS temporarily
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;

-- Create more permissive policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see their own preferences
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own preferences
CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to update their own preferences
CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to delete their own preferences
CREATE POLICY "Users can delete their own preferences" ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create or replace function to get user preferences with proper error handling
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT preferences INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  IF v_preferences IS NULL THEN
    -- Return default preferences if none exist
    RETURN '{
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
    }'::jsonb;
  END IF;
  
  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO authenticated;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Insert default preferences for existing users who don't have any
INSERT INTO public.notification_preferences (user_id, preferences)
SELECT 
  u.id,
  '{
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
  }'::jsonb
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences np WHERE np.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;