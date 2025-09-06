-- Create content_challenges table
CREATE TABLE IF NOT EXISTS public.content_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL DEFAULT 'general',
    difficulty_level TEXT DEFAULT 'medium',
    points INTEGER DEFAULT 100,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_content_challenges_active ON public.content_challenges(is_active);
CREATE INDEX idx_content_challenges_type ON public.content_challenges(challenge_type);
CREATE INDEX idx_content_challenges_dates ON public.content_challenges(start_date, end_date);
CREATE INDEX idx_content_challenges_created_at ON public.content_challenges(created_at);

-- Enable RLS
ALTER TABLE public.content_challenges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access" ON public.content_challenges
    FOR SELECT TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Admin full access" ON public.content_challenges
    FOR ALL TO authenticated
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE role = 'admin'
    ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_challenges_updated_at
    BEFORE UPDATE ON public.content_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.content_challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_challenges TO authenticated;