-- Fix voice_agent_configs table
DROP TABLE IF EXISTS public.voice_agent_configs CASCADE;

CREATE TABLE public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    voice TEXT NOT NULL DEFAULT 'alloy',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default config
INSERT INTO public.voice_agent_configs (
    name, provider, model, voice, temperature, instructions, is_active
) VALUES (
    'Default Voice Agent',
    'openai',
    'gpt-4o-realtime-preview-2024-10-01',
    'alloy',
    0.70,
    'You are a helpful AI assistant.',
    true
);

-- Enable RLS
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access" ON public.voice_agent_configs
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Allow admin write access" ON public.voice_agent_configs
    FOR ALL TO authenticated
    USING (true);

-- Grant permissions
GRANT SELECT ON public.voice_agent_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_agent_configs TO authenticated;