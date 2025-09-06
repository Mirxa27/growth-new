-- Complete Voice Agent Fix Migration
-- This creates all necessary tables and configurations for voice functionality

BEGIN;

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_admin_backup BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_ai_providers table
CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'gemini')),
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing voice_agent_configs if it exists with wrong schema
DROP TABLE IF EXISTS public.voice_agent_configs CASCADE;

-- Create comprehensive voice_agent_configs table
CREATE TABLE public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'openai',
    voice TEXT NOT NULL DEFAULT 'nova',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    instructions TEXT DEFAULT 'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful. Help users explore their emotions, set goals, and build confidence. Keep responses warm and conversational.',
    temperature NUMERIC DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    
    -- OpenAI API Configuration
    openai_api_key TEXT,
    openai_organization TEXT,
    openai_project TEXT,
    api_base_url TEXT,
    max_tokens INTEGER DEFAULT 1000,
    top_p NUMERIC DEFAULT 1.0,
    frequency_penalty NUMERIC DEFAULT 0.0,
    presence_penalty NUMERIC DEFAULT 0.0,
    
    -- Voice specific settings
    enable_realtime BOOLEAN DEFAULT true,
    use_proxy BOOLEAN DEFAULT false,
    proxy_url TEXT,
    input_audio_transcription_model TEXT DEFAULT 'whisper-1',
    language TEXT DEFAULT 'en',
    arabic_support BOOLEAN DEFAULT false,
    emotion_detection BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES voice_agent_configs(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    conversation_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Insert default configurations
INSERT INTO public.voice_agent_configs (
    name, provider, voice, model, instructions, temperature, is_active, enable_realtime, max_tokens
) VALUES (
    'Default OpenAI Voice Agent',
    'openai',
    'nova',
    'gpt-4o-realtime-preview-2024-10-01',
    'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful. Help users explore their emotions, set goals, and build confidence. Keep responses warm and conversational.',
    0.7,
    true,
    true,
    1000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_ai_providers (provider_type, configuration, is_active)
SELECT 'openai', '{"api_key": "", "organization": "", "project": ""}', true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_providers WHERE provider_type = 'openai');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON public.profiles(is_admin, is_admin_backup);
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_active ON public.voice_agent_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_provider ON public.voice_agent_configs(provider);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_config_id ON public.voice_sessions(config_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view active voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can manage voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Users can manage their own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Admins can manage AI providers" ON public.admin_ai_providers;
DROP POLICY IF EXISTS "Users can view their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_admin_backup = true)
        )
    );

CREATE POLICY "Authenticated users can view active voice configs" ON public.voice_agent_configs
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage voice configs" ON public.voice_agent_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_admin_backup = true)
        )
    );

CREATE POLICY "Users can manage their own voice sessions" ON public.voice_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all voice sessions" ON public.voice_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_admin_backup = true)
        )
    );

CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_admin_backup = true)
        )
    );

CREATE POLICY "Users can view their own errors" ON public.error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all errors" ON public.error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_admin_backup = true)
        )
    );

-- Create trigger function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_agent_configs_updated_at ON public.voice_agent_configs;
CREATE TRIGGER update_voice_agent_configs_updated_at 
    BEFORE UPDATE ON public.voice_agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_ai_providers_updated_at ON public.admin_ai_providers;
CREATE TRIGGER update_admin_ai_providers_updated_at 
    BEFORE UPDATE ON public.admin_ai_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
