-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(category)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin users can manage system settings"
    ON public.system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default OpenAI settings
INSERT INTO public.system_settings (category, settings)
VALUES (
    'openai',
    '{
        "apiKey": "",
        "organizationId": "",
        "chatModel": "gpt-4o-mini",
        "realtimeModel": "gpt-realtime-2025-08-28",
        "temperature": 0.7,
        "maxTokens": 2000,
        "voice": "alloy",
        "connectionType": "websocket",
        "enableTools": true,
        "enableTranscription": true,
        "audioFormat": "pcm16",
        "language": "en",
        "instructions": "You are a helpful AI assistant focused on personal growth and well-being."
    }'::jsonb
) ON CONFLICT (category) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_settings TO anon;