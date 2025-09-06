-- Fix notification_preferences table and permissions
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

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
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
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.notification_preferences;

-- Create policies for notification_preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for performance_metrics
DROP POLICY IF EXISTS "Allow authenticated users to insert metrics" ON public.performance_metrics;
CREATE POLICY "Allow authenticated users to insert metrics" 
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON public.performance_metrics(session_id);