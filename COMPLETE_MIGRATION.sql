-- Complete Migration Script for NewMe Application
-- Run this in Supabase SQL Editor to create all missing tables and fix issues

-- 1. Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  code TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('database', 'api', 'auth', 'business_logic', 'validation', 'external_api', 'network', 'unknown')),
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON public.error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own errors" ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all errors" ON public.error_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own errors" ON public.error_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update errors" ON public.error_logs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 2. Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  tags JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  url TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON public.performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own metrics" ON public.performance_metrics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Create notification tables
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'message', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create notification preferences table
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

CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription->>'endpoint')
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- 4. Fix voice tables
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT gen_random_uuid()::text,
  session_token TEXT,
  model TEXT DEFAULT 'gpt-4o-realtime-preview',
  voice TEXT DEFAULT 'nova',
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created_at ON public.voice_sessions(created_at DESC);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions" ON public.voice_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions" ON public.voice_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Add missing columns to voice_agent_configs
DO $$ 
BEGIN
  -- Check if voice_agent_configs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_agent_configs') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'enable_realtime') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN enable_realtime BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'use_proxy') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN use_proxy BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'proxy_url') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN proxy_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'input_audio_transcription_model') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_transcription_model TEXT DEFAULT 'whisper-1';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'input_audio_format') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_format TEXT DEFAULT 'pcm16';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'output_audio_format') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN output_audio_format TEXT DEFAULT 'pcm16';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'turn_detection_type') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_type TEXT DEFAULT 'server_vad';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'turn_detection_threshold') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_threshold DECIMAL(3,2) DEFAULT 0.5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'turn_detection_prefix_padding_ms') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_prefix_padding_ms INTEGER DEFAULT 300;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'turn_detection_silence_duration_ms') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_silence_duration_ms INTEGER DEFAULT 1000;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'language') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN language TEXT DEFAULT 'en';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'arabic_support') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN arabic_support BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_agent_configs' AND column_name = 'emotion_detection') THEN
      ALTER TABLE public.voice_agent_configs ADD COLUMN emotion_detection BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Create default voice agent config if none exists
INSERT INTO public.voice_agent_configs (
  name,
  provider,
  model,
  voice,
  temperature,
  instructions,
  is_active,
  enable_realtime,
  use_proxy,
  language,
  arabic_support,
  emotion_detection
) 
SELECT 
  'Default Voice Agent',
  'openai',
  'gpt-4o-realtime-preview',
  'nova',
  0.7,
  'You are NewMe, a supportive and empathetic AI companion focused on personal growth and mental wellness. Be warm, encouraging, and insightful in your interactions.',
  true,
  true,
  false,
  'en',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.voice_agent_configs WHERE is_active = true
)
ON CONFLICT DO NOTHING;

-- 5. Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_preferences_updated_at') THEN
    CREATE TRIGGER update_notification_preferences_updated_at
      BEFORE UPDATE ON public.notification_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_push_subscriptions_updated_at') THEN
    CREATE TRIGGER update_push_subscriptions_updated_at
      BEFORE UPDATE ON public.push_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.voice_sessions TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created ON public.error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON public.performance_metrics(name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read = false;