-- Fix error_logs table permissions and structure
-- This resolves the 400 Bad Request error when trying to log errors

-- Ensure error_logs table exists with correct structure
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    code TEXT,
    severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warn', 'info', 'debug')),
    category TEXT DEFAULT 'unknown',
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Users can insert their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Anonymous error logging" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;

-- Create RLS policies for error logging
CREATE POLICY "Allow anonymous error logging" ON public.error_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own errors" ON public.error_logs
FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IS NULL
);

CREATE POLICY "Users can insert their own errors" ON public.error_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    auth.uid() IS NULL
);

-- Admin policies
CREATE POLICY "Admins can view all errors" ON public.error_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_admin_backup = true)
    )
);

CREATE POLICY "Admins can manage errors" ON public.error_logs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR is_admin_backup = true)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON public.error_logs(category);

-- Grant necessary permissions
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
