-- Complete Voice Sessions Migration Fix
-- Run this SQL in your Supabase SQL Editor to fix the voice_sessions table issue

-- Step 1: Create voice_agent_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'NewMe Voice Assistant',
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    voice TEXT NOT NULL DEFAULT 'alloy',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 2.0),
    instructions TEXT DEFAULT 'You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. Speak warmly and empathetically, understanding their unique challenges and aspirations.',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Step 2: Insert default configuration if none exists
INSERT INTO public.voice_agent_configs (
    name, 
    provider, 
    model, 
    voice, 
    temperature, 
    instructions, 
    is_active
) 
SELECT 
    'NewMe Voice Assistant',
    'openai',
    'gpt-4o-realtime-preview-2024-10-01',
    'alloy',
    0.70,
    'You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. Speak warmly and empathetically, understanding their unique challenges and aspirations. Provide thoughtful, personalized guidance that helps them navigate life''s complexities with confidence and grace.',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.voice_agent_configs WHERE is_active = true
);

-- Step 3: Create voice_sessions table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_config_id ON public.voice_sessions(config_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_active ON public.voice_agent_configs(is_active);

-- Step 5: Enable Row Level Security
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Admins can modify voice configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Users can create own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Users can update own voice sessions" ON public.voice_sessions;

-- Step 7: Create RLS policies for voice_agent_configs
CREATE POLICY "Anyone can view voice configs" 
ON public.voice_agent_configs
FOR SELECT 
USING (true);

CREATE POLICY "Admins can modify voice configs" 
ON public.voice_agent_configs
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 8: Create RLS policies for voice_sessions
CREATE POLICY "Users can view own voice sessions" 
ON public.voice_sessions
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice sessions" 
ON public.voice_sessions
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions" 
ON public.voice_sessions
FOR UPDATE 
USING (auth.uid() = user_id);

-- Step 9: Create or update the system_settings table for AI configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Step 10: Insert AI provider settings
INSERT INTO public.system_settings (key, value, description, category)
VALUES 
    ('ai_provider_openai_enabled', 'true'::jsonb, 'Enable OpenAI provider', 'ai_providers'),
    ('ai_provider_openai_model', '"gpt-4o-mini"'::jsonb, 'Default OpenAI model', 'ai_providers'),
    ('ai_provider_openai_temperature', '0.7'::jsonb, 'Default temperature for OpenAI', 'ai_providers'),
    ('ai_provider_openai_max_tokens', '2000'::jsonb, 'Maximum tokens for OpenAI responses', 'ai_providers'),
    ('voice_chat_enabled', 'true'::jsonb, 'Enable voice chat feature', 'features'),
    ('voice_realtime_model', '"gpt-4o-realtime-preview-2024-10-01"'::jsonb, 'OpenAI Realtime model', 'ai_providers'),
    ('voice_default_voice', '"alloy"'::jsonb, 'Default voice for text-to-speech', 'ai_providers')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Step 11: Create function to validate API keys (for testing)
CREATE OR REPLACE FUNCTION public.test_openai_api_key(api_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function
    -- In production, you would make an actual API call to validate the key
    IF api_key IS NULL OR api_key = '' THEN
        result = jsonb_build_object(
            'valid', false,
            'error', 'API key is empty'
        );
    ELSIF api_key LIKE 'sk-%' THEN
        result = jsonb_build_object(
            'valid', true,
            'message', 'API key format is valid'
        );
    ELSE
        result = jsonb_build_object(
            'valid', false,
            'error', 'Invalid API key format'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 13: Create a view to check system status
CREATE OR REPLACE VIEW public.system_status AS
SELECT 
    'voice_sessions' as component,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_sessions') as exists,
    (SELECT COUNT(*) FROM public.voice_sessions) as record_count
UNION ALL
SELECT 
    'voice_agent_configs' as component,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_agent_configs') as exists,
    (SELECT COUNT(*) FROM public.voice_agent_configs) as record_count
UNION ALL
SELECT 
    'system_settings' as component,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') as exists,
    (SELECT COUNT(*) FROM public.system_settings WHERE category = 'ai_providers') as record_count;

-- Step 14: Create helper function to get AI configuration
CREATE OR REPLACE FUNCTION public.get_ai_configuration()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config JSONB;
BEGIN
    SELECT jsonb_object_agg(key, value)
    INTO config
    FROM public.system_settings
    WHERE category IN ('ai_providers', 'features');
    
    RETURN COALESCE(config, '{}'::jsonb);
END;
$$;

-- Final verification query - Run this to check if everything is set up correctly
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('voice_sessions', 'voice_agent_configs', 'system_settings')) as tables_created,
    (SELECT COUNT(*) FROM public.voice_agent_configs WHERE is_active = true) as active_configs,
    (SELECT COUNT(*) FROM public.system_settings WHERE category = 'ai_providers') as ai_settings;