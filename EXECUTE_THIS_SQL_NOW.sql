-- IMMEDIATE FIX FOR voice_sessions TABLE ERROR
-- Execute this SQL directly in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql/new

-- Step 1: Create voice_agent_configs table first (if not exists)
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Default Voice Agent',
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    voice TEXT NOT NULL DEFAULT 'alloy',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    instructions TEXT DEFAULT 'You are a helpful AI assistant.',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create voice_sessions table
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

-- Step 3: Add default voice configuration if none exists
INSERT INTO public.voice_agent_configs (name, provider, model, voice, temperature, instructions, is_active)
SELECT 'Default Voice Agent', 'openai', 'gpt-4o-realtime-preview-2024-10-01', 'alloy', 0.70, 
       'You are a helpful AI assistant focused on personal growth and well-being.', true
WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs LIMIT 1);

-- Step 4: Enable Row Level Security
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Anyone can view voice configs" ON public.voice_agent_configs;
CREATE POLICY "Anyone can view voice configs" ON public.voice_agent_configs
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions
FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);

-- Step 7: Verify tables were created
SELECT 
    'SUCCESS: Tables created!' as status,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_sessions') as voice_sessions_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_agent_configs') as voice_configs_exists;