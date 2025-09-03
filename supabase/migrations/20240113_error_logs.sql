-- Create error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  code TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('authentication', 'authorization', 'validation', 'network', 'database', 'business_logic', 'external_api', 'unknown')),
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_category ON public.error_logs(category);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON public.error_logs(created_at DESC) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin users can view all error logs
CREATE POLICY "Admin users can view all error logs" ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can update error logs (mark as resolved)
CREATE POLICY "Admin users can update error logs" ON public.error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert error logs (using service role)
CREATE POLICY "System can insert error logs" ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to get table sizes for system stats
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  total_size BIGINT,
  table_size BIGINT,
  indexes_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename AS table_name,
    pg_total_relation_size(schemaname||'.'||tablename) AS total_size,
    pg_relation_size(schemaname||'.'||tablename) AS table_size,
    pg_indexes_size(schemaname||'.'||tablename) AS indexes_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;

-- Create aggregate function to sum all table sizes
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS JSONB AS $$
DECLARE
  total_size BIGINT;
  result JSONB;
BEGIN
  SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename))
  INTO total_size
  FROM pg_tables
  WHERE schemaname = 'public';
  
  result = jsonb_build_object(
    'total_size', total_size,
    'formatted_size', pg_size_pretty(total_size),
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;

-- Create table for tracking API metrics
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for API metrics
CREATE INDEX idx_api_metrics_created_at ON public.api_metrics(created_at DESC);
CREATE INDEX idx_api_metrics_endpoint ON public.api_metrics(endpoint);
CREATE INDEX idx_api_metrics_user_id ON public.api_metrics(user_id);

-- Enable RLS on API metrics
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view API metrics
CREATE POLICY "Admin users can view API metrics" ON public.api_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert API metrics
CREATE POLICY "System can insert API metrics" ON public.api_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to get API metrics summary
CREATE OR REPLACE FUNCTION get_api_metrics_summary(time_window INTERVAL DEFAULT '24 hours')
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH metrics AS (
    SELECT
      COUNT(*) AS total_calls,
      AVG(response_time_ms) AS avg_response_time,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_response_time,
      COUNT(DISTINCT user_id) AS unique_users,
      COUNT(CASE WHEN status_code >= 400 THEN 1 END) AS error_count
    FROM public.api_metrics
    WHERE created_at > NOW() - time_window
  )
  SELECT jsonb_build_object(
    'total_calls', total_calls,
    'avg_response_time_ms', ROUND(avg_response_time::numeric, 2),
    'p95_response_time_ms', ROUND(p95_response_time::numeric, 2),
    'unique_users', unique_users,
    'error_count', error_count,
    'error_rate', CASE 
      WHEN total_calls > 0 THEN ROUND((error_count::numeric / total_calls * 100), 2)
      ELSE 0
    END,
    'time_window', time_window::text,
    'timestamp', NOW()
  )
  INTO result
  FROM metrics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_api_metrics_summary(INTERVAL) TO authenticated;