-- Create admin_ai_providers table for managing AI provider configurations
CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'elevenlabs')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 10,
    system_prompt TEXT,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_ai_providers_active ON public.admin_ai_providers(is_active);
CREATE INDEX idx_admin_ai_providers_provider_type ON public.admin_ai_providers(provider_type);
CREATE INDEX idx_admin_ai_providers_priority ON public.admin_ai_providers(priority);

-- Enable Row Level Security
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_ai_providers
CREATE POLICY "Public can view active providers"
ON public.admin_ai_providers
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage all providers"
ON public.admin_ai_providers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_ai_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_ai_providers_updated_at
    BEFORE UPDATE ON public.admin_ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_ai_providers_updated_at();

-- Insert default OpenAI provider
INSERT INTO public.admin_ai_providers (
    name,
    provider_type,
    description,
    is_active,
    priority,
    system_prompt,
    configuration
) VALUES (
    'OpenAI GPT-4',
    'openai',
    'OpenAI GPT-4 model for AI-powered features',
    true,
    1,
    'You are a helpful AI assistant focused on personal growth and development. Be supportive, empathetic, and provide actionable insights.',
    jsonb_build_object(
        'model', 'gpt-4o-mini',
        'max_tokens', 2000,
        'temperature', 0.7,
        'timeout', 30,
        'api_key', '',
        'base_url', 'https://api.openai.com/v1'
    )
) ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.admin_ai_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ai_providers TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.admin_ai_providers IS 'Stores AI provider configurations for the admin panel';
COMMENT ON COLUMN public.admin_ai_providers.provider_type IS 'Type of AI provider (openai, anthropic, google, elevenlabs)';
COMMENT ON COLUMN public.admin_ai_providers.priority IS 'Priority order for provider selection (lower number = higher priority)';
COMMENT ON COLUMN public.admin_ai_providers.configuration IS 'JSON configuration including API keys, endpoints, and model settings';