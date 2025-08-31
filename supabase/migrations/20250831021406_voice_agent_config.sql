-- Voice Agent Configuration Table
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'NewMe Voice Agent',
    instructions TEXT NOT NULL DEFAULT 'You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. Speak warmly and empathetically, understanding their unique challenges and aspirations. Provide thoughtful, personalized guidance that helps them navigate life''s complexities with confidence and grace.',
    voice VARCHAR(50) NOT NULL DEFAULT 'alloy' CHECK (voice IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')),
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 2.0),
    max_tokens INTEGER NOT NULL DEFAULT 1000 CHECK (max_tokens >= 1 AND max_tokens <= 4096),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default configuration
INSERT INTO public.voice_agent_configs (
    name,
    instructions,
    voice,
    model,
    temperature,
    max_tokens,
    is_active
) VALUES (
    'NewMe Voice Agent',
    'You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth. Speak warmly and empathetically, understanding their unique challenges and aspirations. Provide thoughtful, personalized guidance that helps them navigate life''s complexities with confidence and grace.',
    'alloy',
    'gpt-4o-realtime-preview-2024-10-01',
    0.70,
    1000,
    true
) ON CONFLICT DO NOTHING;

-- Create RLS policies
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active configurations
CREATE POLICY "Allow read access to active configs" ON public.voice_agent_configs
    FOR SELECT USING (is_active = true);

-- Allow admins to manage configurations
CREATE POLICY "Allow admin full access" ON public.voice_agent_configs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND
            raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voice_agent_configs_updated_at
    BEFORE UPDATE ON public.voice_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
