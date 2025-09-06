-- Fix Missing Tables and Columns Migration
-- This fixes the missing notification_preferences table and last_login_at column

BEGIN;

-- Add missing last_login_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "assessment_reminders": true,
        "progress_updates": true,
        "voice_chat_notifications": true,
        "community_updates": false,
        "marketing_emails": false
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add priority column to admin_ai_providers if it doesn't exist
ALTER TABLE public.admin_ai_providers 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for tables that need them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_admin_ai_providers_updated_at ON public.admin_ai_providers;
CREATE TRIGGER update_admin_ai_providers_updated_at
    BEFORE UPDATE ON public.admin_ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_voice_agent_configs_updated_at ON public.voice_agent_configs;
CREATE TRIGGER update_voice_agent_configs_updated_at
    BEFORE UPDATE ON public.voice_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create admin helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = user_uuid 
        AND (is_admin = true OR is_admin_backup = true OR role = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create RLS policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert their own preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for admin_ai_providers
DROP POLICY IF EXISTS "Authenticated users can view active providers" ON public.admin_ai_providers;
CREATE POLICY "Authenticated users can view active providers" 
ON public.admin_ai_providers 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage AI providers" ON public.admin_ai_providers;
CREATE POLICY "Admins can manage AI providers" 
ON public.admin_ai_providers 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create RLS policies for voice_agent_configs
DROP POLICY IF EXISTS "Authenticated users can view active voice configs" ON public.voice_agent_configs;
CREATE POLICY "Authenticated users can view active voice configs" 
ON public.voice_agent_configs 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage voice configs" ON public.voice_agent_configs;
CREATE POLICY "Admins can manage voice configs" 
ON public.voice_agent_configs 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create RLS policies for voice_sessions
DROP POLICY IF EXISTS "Users can manage their own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can manage their own voice sessions" 
ON public.voice_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for error_logs
DROP POLICY IF EXISTS "Users can view their own errors" ON public.error_logs;
CREATE POLICY "Users can view their own errors" 
ON public.error_logs 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own errors" ON public.error_logs;
CREATE POLICY "Users can insert their own errors" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;
CREATE POLICY "Admins can view all errors" 
ON public.error_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_ai_providers_active ON public.admin_ai_providers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_ai_providers_priority ON public.admin_ai_providers(priority DESC);

-- Insert default admin AI provider if it doesn't exist
INSERT INTO public.admin_ai_providers (provider_type, configuration, is_active, priority)
SELECT 'openai', '{"api_key": "", "organization": "", "project": ""}', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_providers WHERE provider_type = 'openai');

COMMIT;
