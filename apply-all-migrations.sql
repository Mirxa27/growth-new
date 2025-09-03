-- Comprehensive Database Setup for NewoMen Life Navigation System
-- This script ensures all tables, functions, and policies are properly configured

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Profiles (with proper structure)
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

-- Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Performance Metrics (with proper timestamp handling)
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

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow both authenticated and anonymous users to insert metrics
CREATE POLICY "Anyone can insert metrics" ON public.performance_metrics
  FOR INSERT WITH CHECK (true);

-- 3. Error Logs
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

CREATE POLICY "Anyone can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- 4. Notification Preferences (fixed structure)
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

-- Policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Voice Sessions (ensure all columns exist)
ALTER TABLE public.voice_sessions 
  ADD COLUMN IF NOT EXISTS session_token TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. Voice Agent Configs (ensure all columns exist)
ALTER TABLE public.voice_agent_configs
  ADD COLUMN IF NOT EXISTS enable_realtime BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS use_proxy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proxy_url TEXT,
  ADD COLUMN IF NOT EXISTS input_audio_transcription_model TEXT DEFAULT 'whisper-1',
  ADD COLUMN IF NOT EXISTS input_audio_format TEXT DEFAULT 'pcm16',
  ADD COLUMN IF NOT EXISTS output_audio_format TEXT DEFAULT 'pcm16',
  ADD COLUMN IF NOT EXISTS turn_detection_type TEXT DEFAULT 'server_vad',
  ADD COLUMN IF NOT EXISTS turn_detection_threshold NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS turn_detection_prefix_padding_ms INTEGER DEFAULT 300,
  ADD COLUMN IF NOT EXISTS turn_detection_silence_duration_ms INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS arabic_support BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emotion_detection BOOLEAN DEFAULT false;

-- 7. PayPal Support Tables
CREATE TABLE IF NOT EXISTS public.paypal_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'SERVICE',
  category TEXT,
  image_url TEXT,
  home_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.paypal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_plan_id TEXT UNIQUE NOT NULL,
  paypal_product_id TEXT REFERENCES public.paypal_products(paypal_product_id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  billing_cycles JSONB NOT NULL,
  payment_preferences JSONB,
  taxes JSONB,
  quantity_supported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  summary TEXT,
  resource JSONB NOT NULL,
  links JSONB,
  event_version TEXT,
  create_time TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error TEXT
);

-- Enable RLS for PayPal tables
ALTER TABLE public.paypal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- PayPal policies
CREATE POLICY "Anyone can view products" ON public.paypal_products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active plans" ON public.paypal_plans
  FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Service role can manage webhooks" ON public.paypal_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Add payment provider support to existing tables
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

-- 9. Storage Buckets (ensure they exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'text/plain']),
  ('voice-recordings', 'voice-recordings', false, 52428800, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('exports', 'exports', false, 104857600, ARRAY['application/zip', 'application/json', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 10. Helper Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER handle_updated_at 
                    BEFORE UPDATE ON %I 
                    FOR EACH ROW 
                    EXECUTE FUNCTION public.handle_updated_at()', t);
  END LOOP;
END $$;

-- 11. Create profiles for existing users
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

-- 12. Create notification preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences WHERE notification_preferences.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 13. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments(paypal_order_id);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'All migrations completed successfully!';
END $$;