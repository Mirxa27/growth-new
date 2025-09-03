-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  tags JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  url TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_performance_metrics_name ON public.performance_metrics(name);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_session_id ON public.performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow authenticated users to insert their own metrics
CREATE POLICY "Users can insert their own metrics" ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to view their own metrics
CREATE POLICY "Users can view their own metrics" ON public.performance_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create aggregated performance view
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  name,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as count,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) as p99_value
FROM public.performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY name, DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC, name;

-- Grant access to the view
GRANT SELECT ON performance_summary TO authenticated;

-- Create function to clean up old metrics
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.performance_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;