-- Restore error_logs table with proper permissions and RLS policies
-- This migration fixes the database error logging permissions issue

-- First, ensure the error_logs table exists with the correct structure
DROP TABLE IF EXISTS public.error_logs CASCADE;

CREATE TABLE public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    code TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT DEFAULT 'unknown' CHECK (category IN ('authentication', 'authorization', 'validation', 'network', 'database', 'business_logic', 'external_api', 'unknown')),
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_category ON public.error_logs(category);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Users can view their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Anonymous error logging" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can manage errors" ON public.error_logs;
DROP POLICY IF EXISTS "Users can log their own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can update errors" ON public.error_logs;

-- Create RLS policies for error logging

-- Allow anyone to insert errors (including anonymous users)
CREATE POLICY "Allow anonymous error logging" ON public.error_logs
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own errors
CREATE POLICY "Users can view their own errors" ON public.error_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert their own errors with proper user_id association
CREATE POLICY "Users can insert their own errors" ON public.error_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin policies for viewing all errors
CREATE POLICY "Admins can view all errors" ON public.error_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (is_admin = true OR is_admin_backup = true)
    )
);

-- Allow admins to update errors (mark as resolved)
CREATE POLICY "Admins can manage errors" ON public.error_logs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (is_admin = true OR is_admin_backup = true)
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO anon;

-- Create or replace the error logging function with proper permissions
CREATE OR REPLACE FUNCTION public.log_application_error(
    p_message TEXT,
    p_code TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium',
    p_category TEXT DEFAULT 'unknown',
    p_context JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
    v_user UUID;
BEGIN
    -- Use provided user_id or current authenticated user
    v_user := COALESCE(p_user_id, auth.uid());

    -- Insert error log
    INSERT INTO public.error_logs (
        message,
        code,
        severity,
        category,
        context,
        user_id
    ) VALUES (
        p_message,
        p_code,
        p_severity,
        p_category,
        p_context,
        v_user
    ) RETURNING id INTO v_error_id;

    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.log_application_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_application_error TO anon;

-- Create a view for error statistics (useful for admin dashboard)
CREATE OR REPLACE VIEW public.error_stats AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    category,
    severity,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users
FROM public.error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), category, severity
ORDER BY hour DESC, error_count DESC;

-- Grant access to the view
GRANT SELECT ON public.error_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.error_logs IS 'System error logging table for tracking application errors and exceptions';
COMMENT ON FUNCTION public.log_application_error IS 'Secure function to log application errors with proper permissions';
COMMENT ON VIEW public.error_stats IS 'Aggregated error statistics for monitoring and analysis';