-- Migration for Voice Agent Features

-- 1. voice_agent_configs table
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    openai_model TEXT DEFAULT 'gpt-4o',
    openai_voice TEXT DEFAULT 'alloy',
    system_prompt TEXT,
    initial_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for voice_agent_configs
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage voice agent configs" ON public.voice_agent_configs
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can read voice agent configs" ON public.voice_agent_configs
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- 2. voice_sessions table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    session_ended_at TIMESTAMPTZ,
    call_sid TEXT,
    status TEXT,
    transcript JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for voice_sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own voice sessions" ON public.voice_sessions
    FOR ALL
    USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all voice sessions" ON public.voice_sessions
    FOR SELECT
    USING (is_admin(auth.uid()));


-- 3. audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource_id TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (is_admin(auth.uid()));


-- 4. admin_ai_providers table
CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    api_key_encrypted TEXT, -- Should be encrypted at application level
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for admin_ai_providers
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Function to check for admin role (if not exists)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
