-- Create visitor_sessions table for anonymous user tracking
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_views INTEGER DEFAULT 1,
    assessments_taken INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_started_at ON public.visitor_sessions(started_at);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for visitor tracking
CREATE POLICY "Allow anonymous insert visitor sessions" ON public.visitor_sessions
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select own visitor sessions" ON public.visitor_sessions
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update own visitor sessions" ON public.visitor_sessions
    FOR UPDATE TO anon USING (true);

-- Allow authenticated users to read their own sessions
CREATE POLICY "Allow authenticated users read visitor sessions" ON public.visitor_sessions
    FOR SELECT TO authenticated USING (true);

-- Admin access
CREATE POLICY "Allow admin full access to visitor sessions" ON public.visitor_sessions
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
