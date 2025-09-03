-- Create error_logs table for system error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  code TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('database', 'api', 'auth', 'business_logic', 'validation', 'external_api', 'network', 'unknown')),
  context JSONB,
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

-- RLS policies
-- Allow authenticated users to insert their own errors
CREATE POLICY "Users can log their own errors" ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all errors
CREATE POLICY "Admins can view all errors" ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow users to view their own errors
CREATE POLICY "Users can view their own errors" ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to update errors (mark as resolved)
CREATE POLICY "Admins can update errors" ON public.error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to log errors with rate limiting
CREATE OR REPLACE FUNCTION log_error(
  p_message TEXT,
  p_code TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT 'unknown',
  p_context JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
  v_recent_count INTEGER;
BEGIN
  -- Check rate limit (max 100 errors per user per hour)
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.error_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_recent_count >= 100 THEN
      RAISE EXCEPTION 'Error logging rate limit exceeded';
    END IF;
  END IF;

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
    COALESCE(p_user_id, auth.uid())
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create aggregated error stats view
CREATE OR REPLACE VIEW error_stats AS
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
GRANT SELECT ON error_stats TO authenticated;