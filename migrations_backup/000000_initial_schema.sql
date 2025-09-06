-- Initial comprehensive database schema
-- This creates all necessary tables for the Growth Echo Nexus platform

BEGIN;

-- Create profiles table first (depends on auth.users)
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

-- Create comprehensive voice_agent_configs table
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'openai',
    voice TEXT NOT NULL DEFAULT 'nova',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    instructions TEXT DEFAULT 'You are NewMe, an AI companion designed to support women in their personal growth journey.',
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

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'personality', 'wellness', 'custom')),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment_options table
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    scoring_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment_responses table
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    selected_option_id UUID REFERENCES assessment_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment_results table
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    personality_type TEXT,
    scores JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create explorations table
CREATE TABLE IF NOT EXISTS public.explorations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO public.voice_agent_configs (
    name, provider, voice, model, instructions, temperature, is_active, enable_realtime, max_tokens
) 
SELECT 
    'Default OpenAI Voice Agent',
    'openai',
    'nova',
    'gpt-4o-realtime-preview-2024-10-01',
    'You are NewMe, an AI companion designed to support women in their personal growth journey. Be empathetic, encouraging, and insightful.',
    0.7,
    true,
    true,
    1000
WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs);

INSERT INTO public.admin_ai_providers (provider_type, configuration, is_active)
SELECT 'openai', '{"api_key": "", "organization": "", "project": ""}', true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_ai_providers WHERE provider_type = 'openai');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON public.profiles(is_admin, is_admin_backup);
CREATE INDEX IF NOT EXISTS idx_voice_agent_configs_active ON public.voice_agent_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_assessment ON public.assessment_responses(user_id, assessment_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view active voice configs" ON public.voice_agent_configs
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage voice configs" ON public.voice_agent_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_admin_backup = true))
    );

CREATE POLICY "Users can manage their own voice sessions" ON public.voice_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_admin_backup = true))
    );

CREATE POLICY "Anyone can view public assessments" ON public.assessments
    FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can view assessment options" ON public.assessment_options
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own responses" ON public.assessment_responses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own results" ON public.assessment_results
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public explorations" ON public.explorations
    FOR SELECT USING (visibility = 'public');

COMMIT;
