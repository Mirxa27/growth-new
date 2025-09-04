-- Combined Migrations for Production Deployment
-- Generated on 2025-09-04T07:40:10.588Z

-- =====================================
-- Migration: 0000_adding_scoring_data_to_assessment_options_and_visibility_to_explorations_.sql
-- =====================================

-- Add a column to store scoring data for personality assessments
ALTER TABLE public.assessment_options
ADD COLUMN scoring_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.assessment_options.scoring_data IS 'Stores scoring weights for personality assessments, e.g., {"trait": "extrovert", "value": 2}';

-- Add a column to control visibility of explorations (public for visitors, private for users)
ALTER TABLE public.explorations
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

-- =====================================
-- Migration: 0001_updating_the_assessments_table_to_allow_the_personality_type_.sql
-- =====================================

-- Drop the existing constraint
ALTER TABLE public.assessments DROP CONSTRAINT assessments_type_check;

-- Add a new constraint that includes 'personality'
ALTER TABLE public.assessments ADD CONSTRAINT assessments_type_check 
CHECK (type IN ('quiz', 'test', 'exploration', 'course', 'personality'));

-- =====================================
-- Migration: 0002_seeding_the_database_with_new_public_and_private_assessments_.sql
-- =====================================

-- Seeding a public assessment: "Communication Style"
SELECT public.create_assessment_with_questions(
    _title => 'Discover Your Communication Style',
    _description => 'Understand how you communicate and learn how to improve your interactions with others.',
    _type => 'personality',
    _visibility => 'public',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 5-question personality assessment about communication styles.',
    _questions => '[
        {
            "question_text": "When in a disagreement, you are most likely to:",
            "question_type": "multiple_choice",
            "position": 1,
            "options": [
                {"option_text": "Clearly state your perspective and logic.", "is_correct": false, "position": 1},
                {"option_text": "Listen to the other person and find common ground.", "is_correct": false, "position": 2},
                {"option_text": "Avoid conflict and hope it resolves itself.", "is_correct": false, "position": 3},
                {"option_text": "Express your feelings about the situation openly.", "is_correct": false, "position": 4}
            ]
        },
        {
            "question_text": "How do you prefer to receive feedback?",
            "question_type": "multiple_choice",
            "position": 2,
            "options": [
                {"option_text": "Direct, honest, and to the point.", "is_correct": false, "position": 1},
                {"option_text": "Gentle, encouraging, and focused on positives.", "is_correct": false, "position": 2},
                {"option_text": "In writing, so I can process it on my own time.", "is_correct": false, "position": 3},
                {"option_text": "In a collaborative conversation.", "is_correct": false, "position": 4}
            ]
        }
    ]'::jsonb
);

-- Seeding a public assessment: "Stress Profile"
SELECT public.create_assessment_with_questions(
    _title => 'What''s Your Stress Profile?',
    _description => 'Identify your primary stressors and discover your unique response patterns to pressure.',
    _type => 'personality',
    _visibility => 'public',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 5-question personality assessment about stress profiles.',
    _questions => '[
        {
            "question_text": "When you feel overwhelmed, your first instinct is to:",
            "question_type": "multiple_choice",
            "position": 1,
            "options": [
                {"option_text": "Create a to-do list and tackle tasks one by one.", "is_correct": false, "position": 1},
                {"option_text": "Talk to a friend or family member about it.", "is_correct": false, "position": 2},
                {"option_text": "Withdraw and spend time alone.", "is_correct": false, "position": 3},
                {"option_text": "Engage in a physical activity like walking or exercise.", "is_correct": false, "position": 4}
            ]
        }
    ]'::jsonb
);

-- Seeding a private assessment: "Core Values Identifier"
SELECT public.create_assessment_with_questions(
    _title => 'Core Values Identifier',
    _description => 'A deep dive to uncover the fundamental principles that guide your life and decisions.',
    _type => 'personality',
    _visibility => 'private',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 10-question assessment to identify core values.',
    _questions => '[]'::jsonb
);

-- Seeding a private assessment: "Relationship Patterns"
SELECT public.create_assessment_with_questions(
    _title => 'Relationship Patterns Analysis',
    _description => 'Explore your attachment style and recurring patterns in your relationships.',
    _type => 'personality',
    _visibility => 'private',
    _ai_provider => 'openai',
    _ai_model => 'gpt-4o-mini',
    _ai_prompt => 'Generate a 10-question assessment on relationship patterns.',
    _questions => '[]'::jsonb
);

-- =====================================
-- Migration: 0003_update_database_schema_for_admin_panel_features.sql
-- =====================================

-- Add columns to profiles table for ban status and bio
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create secure function to update user ban status
CREATE OR REPLACE FUNCTION public.update_user_ban_status_secure(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can update ban status
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update the ban status
  UPDATE public.profiles 
  SET is_banned = new_status, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

-- Add columns to community_posts table for status, title, and views
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'removed', 'archived')),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create secure function to update post status
CREATE OR REPLACE FUNCTION public.update_post_status_secure(p_post_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins or moderators can update post status
  IF NOT (is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'moderator')) THEN
    RAISE EXCEPTION 'Access denied: Admin or moderator privileges required';
  END IF;

  -- Validate status
  IF p_new_status NOT IN ('active', 'pending', 'removed', 'archived') THEN
      RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Update the post status
  UPDATE public.community_posts 
  SET status = p_new_status, updated_at = now()
  WHERE id = p_post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found: %', p_post_id;
  END IF;
END;
$$;

-- Create library_items table for the content library
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'audio', 'video', 'exercise', 'meditation', 'course')),
    difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,
    tags TEXT[],
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    author TEXT,
    content_url TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on library_items if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'library_items' AND rowsecurity = 't') THEN
    ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policies for library_items
DROP POLICY IF EXISTS "Public can view published library items" ON public.library_items;
CREATE POLICY "Public can view published library items" ON public.library_items
FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage library items" ON public.library_items;
CREATE POLICY "Admins can manage library items" ON public.library_items
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix create_assessment_with_questions function to correctly handle question IDs
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _ai_provider text,
  _ai_model text,
  _ai_prompt text,
  _questions jsonb
) RETURNS void AS $$
DECLARE
    _assessment_id bigint;
    q jsonb;
    question_id   bigint;
    opt jsonb;
BEGIN
    INSERT INTO public.assessments (
        title, description, type, visibility,
        ai_provider, ai_model, ai_prompt
    )
    VALUES (_title, _description, _type, _visibility,
            _ai_provider, _ai_model, _ai_prompt)
    RETURNING id INTO _assessment_id;

    FOR q IN SELECT * FROM jsonb_array_elements(_questions) LOOP
        INSERT INTO public.assessment_questions (
            assessment_id, question_text, question_type, position
        )
        VALUES (
            _assessment_id,
            q->>'question_text',
            q->>'question_type',
            (q->>'position')::int
        )
        RETURNING id INTO question_id;

        IF q->>'question_type' = 'multiple_choice' THEN
            FOR opt IN SELECT * FROM jsonb_array_elements(q->'options') LOOP
                INSERT INTO public.assessment_options (
                    question_id, option_text, is_correct, position
                ) VALUES (
                    question_id,
                    opt->>'option_text',
                    (opt->>'is_correct')::boolean,
                    (opt->>'position')::int
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- Migration: 20240104_create_voice_sessions_table.sql
-- =====================================

-- Create voice_sessions table for tracking voice conversations
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES voice_agent_configs(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  voice TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  audio_quality_metrics JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create voice_agent_configs table for voice agent configurations
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  input_audio_format TEXT DEFAULT 'pcm16',
  output_audio_format TEXT DEFAULT 'pcm16',
  sample_rate INTEGER DEFAULT 24000,
  channels INTEGER DEFAULT 1,
  enable_vad BOOLEAN DEFAULT true,
  vad_threshold NUMERIC DEFAULT -45,
  enable_noise_suppression BOOLEAN DEFAULT true,
  enable_echo_cancellation BOOLEAN DEFAULT true,
  max_session_duration INTEGER DEFAULT 1800,
  language TEXT DEFAULT 'en',
  enable_auto_punctuation BOOLEAN DEFAULT true,
  enable_timestamps BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_config_id ON public.voice_sessions(config_id);

-- Create RLS policies for voice_sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions" ON public.voice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions" ON public.voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice sessions" ON public.voice_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for voice_agent_configs
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all voice configs" ON public.voice_agent_configs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create voice configs" ON public.voice_agent_configs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update voice configs" ON public.voice_agent_configs
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete voice configs" ON public.voice_agent_configs
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_voice_sessions_updated_at BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_agent_configs_updated_at BEFORE UPDATE ON public.voice_agent_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice configuration
INSERT INTO public.voice_agent_configs (
  name,
  voice_id,
  model,
  system_prompt,
  temperature,
  max_tokens,
  is_active
) VALUES (
  'NewMe Default Voice',
  'alloy',
  'gpt-4o-realtime-preview-2024-10-01',
  'You are NewMe, a supportive growth guide for women''s personal growth. Be warm, encouraging, and insightful. Focus on personal development, mindfulness, and building confidence. Provide actionable advice and emotional support.',
  0.7,
  1000,
  true
) ON CONFLICT DO NOTHING;


-- =====================================
-- Migration: 20240113_add_arabic_support_column.sql
-- =====================================

-- Add missing arabic_support column to voice_agent_configs
ALTER TABLE public.voice_agent_configs 
ADD COLUMN IF NOT EXISTS arabic_support BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.voice_agent_configs.arabic_support IS 'Enable Arabic language support for voice interactions';

-- Update any existing configs to have arabic_support based on language
UPDATE public.voice_agent_configs 
SET arabic_support = true 
WHERE language = 'ar';

-- Also add any other potentially missing columns
ALTER TABLE public.voice_agent_configs
ADD COLUMN IF NOT EXISTS proxy_url TEXT,
ADD COLUMN IF NOT EXISTS emotion_detection BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.voice_agent_configs.proxy_url IS 'Custom proxy URL for voice service if needed';
COMMENT ON COLUMN public.voice_agent_configs.emotion_detection IS 'Enable emotion detection in voice responses';

-- =====================================
-- Migration: 20240113_create_error_logs.sql
-- =====================================

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

-- =====================================
-- Migration: 20240113_error_logs.sql
-- =====================================

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

-- =====================================
-- Migration: 20240113_fix_voice_tables.sql
-- =====================================

-- Create voice_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT gen_random_uuid()::text,
  session_token TEXT,
  model TEXT DEFAULT 'gpt-4o-realtime-preview',
  voice TEXT DEFAULT 'nova',
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created_at ON public.voice_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own voice sessions" ON public.voice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions" ON public.voice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add missing columns to voice_agent_configs if they don't exist
DO $$ 
BEGIN
  -- Add enable_realtime column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'enable_realtime') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN enable_realtime BOOLEAN DEFAULT true;
  END IF;

  -- Add use_proxy column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'use_proxy') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN use_proxy BOOLEAN DEFAULT true;
  END IF;

  -- Add proxy_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'proxy_url') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN proxy_url TEXT;
  END IF;

  -- Add input_audio_transcription_model column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'input_audio_transcription_model') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_transcription_model TEXT DEFAULT 'whisper-1';
  END IF;

  -- Add input_audio_format column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'input_audio_format') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_format TEXT DEFAULT 'pcm16';
  END IF;

  -- Add output_audio_format column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'output_audio_format') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN output_audio_format TEXT DEFAULT 'pcm16';
  END IF;

  -- Add turn_detection_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_type') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_type TEXT DEFAULT 'server_vad';
  END IF;

  -- Add turn_detection_threshold column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_threshold') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_threshold DECIMAL(3,2) DEFAULT 0.5;
  END IF;

  -- Add turn_detection_prefix_padding_ms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_prefix_padding_ms') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_prefix_padding_ms INTEGER DEFAULT 300;
  END IF;

  -- Add turn_detection_silence_duration_ms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'turn_detection_silence_duration_ms') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_silence_duration_ms INTEGER DEFAULT 1000;
  END IF;

  -- Add language column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'language') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN language TEXT DEFAULT 'en';
  END IF;

  -- Add arabic_support column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'arabic_support') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN arabic_support BOOLEAN DEFAULT false;
  END IF;

  -- Add emotion_detection column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'voice_agent_configs' 
                AND column_name = 'emotion_detection') THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN emotion_detection BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.voice_agent_configs.enable_realtime IS 'Enable realtime voice interaction';
COMMENT ON COLUMN public.voice_agent_configs.use_proxy IS 'Use proxy for voice API calls';
COMMENT ON COLUMN public.voice_agent_configs.proxy_url IS 'Custom proxy URL for voice service';
COMMENT ON COLUMN public.voice_agent_configs.input_audio_transcription_model IS 'Model used for audio transcription';
COMMENT ON COLUMN public.voice_agent_configs.input_audio_format IS 'Format for input audio';
COMMENT ON COLUMN public.voice_agent_configs.output_audio_format IS 'Format for output audio';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_type IS 'Type of turn detection (server_vad or none)';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_threshold IS 'Threshold for voice activity detection';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_prefix_padding_ms IS 'Padding before voice detection';
COMMENT ON COLUMN public.voice_agent_configs.turn_detection_silence_duration_ms IS 'Duration of silence before turn ends';
COMMENT ON COLUMN public.voice_agent_configs.language IS 'Language code for voice interaction';
COMMENT ON COLUMN public.voice_agent_configs.arabic_support IS 'Enable Arabic language support';
COMMENT ON COLUMN public.voice_agent_configs.emotion_detection IS 'Enable emotion detection in voice';

-- Create a default voice agent config if none exists
INSERT INTO public.voice_agent_configs (
  name,
  provider,
  model,
  voice,
  temperature,
  instructions,
  is_active,
  enable_realtime,
  use_proxy,
  language,
  arabic_support,
  emotion_detection
) 
SELECT 
  'Default Voice Agent',
  'openai',
  'gpt-4o-realtime-preview-2024-12-06',
  'nova',
  0.7,
  'You are NewMe, a supportive and empathetic AI companion focused on personal growth and mental wellness. Be warm, encouraging, and insightful in your interactions.',
  true,
  true,
  false,
  'en',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.voice_agent_configs WHERE is_active = true
);

-- =====================================
-- Migration: 20240113_notifications.sql
-- =====================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'message', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "email": {
      "enabled": true,
      "frequency": "immediate",
      "categories": ["achievement", "message", "system"]
    },
    "push": {
      "enabled": true,
      "categories": ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
    },
    "inApp": {
      "enabled": true,
      "sound": true,
      "vibration": true
    }
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for preferences
CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription->>'endpoint')
);

-- Enable RLS on push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to send notification to user
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['in_app'],
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    channels,
    action_url,
    action_label
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_channels,
    p_action_url,
    p_action_label
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send achievement notification
CREATE OR REPLACE FUNCTION send_achievement_notification(
  p_user_id UUID,
  p_achievement_name TEXT,
  p_achievement_description TEXT,
  p_crystals_earned INTEGER DEFAULT 0
) RETURNS UUID AS $$
BEGIN
  RETURN send_notification(
    p_user_id,
    'achievement',
    'Achievement Unlocked: ' || p_achievement_name,
    p_achievement_description,
    jsonb_build_object(
      'achievement_name', p_achievement_name,
      'crystals_earned', p_crystals_earned
    ),
    ARRAY['in_app', 'push'],
    '/profile#achievements',
    'View Achievement'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT cleanup_expired_notifications();');

-- =====================================
-- Migration: 20240113_performance_metrics.sql
-- =====================================

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

-- =====================================
-- Migration: 20240114_add_paypal_support.sql
-- =====================================

-- Add PayPal support to subscriptions table
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

-- Create index for PayPal subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);

-- Add PayPal fields to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

-- Create index for PayPal order ID
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments(paypal_order_id);

-- Create PayPal webhook events table
CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  summary TEXT,
  resource JSONB NOT NULL,
  links JSONB,
  event_version TEXT,
  create_time TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error TEXT
);

-- Enable RLS
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role can manage webhook events" ON public.paypal_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Create PayPal products table
CREATE TABLE IF NOT EXISTS public.paypal_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'SERVICE',
  category TEXT,
  image_url TEXT,
  home_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PayPal plans table
CREATE TABLE IF NOT EXISTS public.paypal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_plan_id TEXT UNIQUE NOT NULL,
  paypal_product_id TEXT REFERENCES public.paypal_products(paypal_product_id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  billing_cycles JSONB NOT NULL,
  payment_preferences JSONB,
  taxes JSONB,
  quantity_supported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for PayPal tables
ALTER TABLE public.paypal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products and plans
CREATE POLICY "Anyone can view active products" ON public.paypal_products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active plans" ON public.paypal_plans
  FOR SELECT USING (status = 'ACTIVE');

-- Only admins can manage products and plans
CREATE POLICY "Admins can manage products" ON public.paypal_products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage plans" ON public.paypal_plans
  FOR ALL USING (public.is_admin());

-- Insert default PayPal products and plans
INSERT INTO public.paypal_products (paypal_product_id, name, description) VALUES
  ('PROD_BASIC', 'NewoMen Basic', 'Basic subscription plan with essential features'),
  ('PROD_PREMIUM', 'NewoMen Premium', 'Premium subscription plan with all features')
ON CONFLICT (paypal_product_id) DO NOTHING;

INSERT INTO public.paypal_plans (paypal_plan_id, paypal_product_id, name, description, billing_cycles, payment_preferences) VALUES
  ('PLAN_BASIC_MONTHLY', 'PROD_BASIC', 'Basic Monthly', 'Basic plan billed monthly', 
   '[{"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "9.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb),
  
  ('PLAN_PREMIUM_MONTHLY', 'PROD_PREMIUM', 'Premium Monthly', 'Premium plan billed monthly',
   '[{"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "19.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb),
  
  ('PLAN_PREMIUM_YEARLY', 'PROD_PREMIUM', 'Premium Yearly', 'Premium plan billed yearly with discount',
   '[{"frequency": {"interval_unit": "YEAR", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "199.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb)
ON CONFLICT (paypal_plan_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.paypal_webhook_events TO service_role;
GRANT SELECT ON public.paypal_products TO authenticated;
GRANT SELECT ON public.paypal_plans TO authenticated;

-- =====================================
-- Migration: 20240114_complete_rls_policies.sql
-- =====================================

-- Complete RLS Policies for all tables

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can create own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON public.assessments;

CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- 4. Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 5. Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from own sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.chat_messages;

CREATE POLICY "Users can view messages from own sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- 6. Journal Entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own journal entries" ON public.journal_entries;

CREATE POLICY "Users can manage own journal entries" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- 7. User Progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;

CREATE POLICY "Users can manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- 8. Voice Sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own voice sessions" ON public.voice_sessions;

CREATE POLICY "Users can manage own voice sessions" ON public.voice_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 9. Voice Agent Configs (Admin only)
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage voice agent configs" ON public.voice_agent_configs;
DROP POLICY IF EXISTS "Users can view active voice agent configs" ON public.voice_agent_configs;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND metadata->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage voice agent configs" ON public.voice_agent_configs
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active voice agent configs" ON public.voice_agent_configs
  FOR SELECT USING (is_active = true);

-- 10. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;

CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 11. Admin AI Providers (Admin only)
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage AI providers" ON public.admin_ai_providers;
DROP POLICY IF EXISTS "Users can view active AI providers" ON public.admin_ai_providers;

CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view active AI providers" ON public.admin_ai_providers
  FOR SELECT USING (is_active = true);

-- 12. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage payments" ON public.payments
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================
-- Migration: 20240114_database_functions.sql
-- =====================================

-- Database Functions and Triggers

-- 1. Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER handle_updated_at 
                    BEFORE UPDATE ON %I 
                    FOR EACH ROW 
                    EXECUTE FUNCTION public.handle_updated_at()', t);
  END LOOP;
END $$;

-- 2. Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    jsonb_build_object(
      'email_verified', NEW.email_confirmed_at IS NOT NULL,
      'phone_verified', NEW.phone_confirmed_at IS NOT NULL,
      'created_via', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    )
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Calculate user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID)
RETURNS TABLE (
  total_assessments INTEGER,
  completed_goals INTEGER,
  total_goals INTEGER,
  journal_entries INTEGER,
  chat_sessions INTEGER,
  voice_sessions INTEGER,
  member_since TIMESTAMPTZ,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.assessments WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.goals WHERE user_id = p_user_id AND status = 'completed'),
    (SELECT COUNT(*)::INTEGER FROM public.goals WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.journal_entries WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.chat_sessions WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.voice_sessions WHERE user_id = p_user_id),
    (SELECT created_at FROM public.user_profiles WHERE id = p_user_id),
    GREATEST(
      (SELECT MAX(created_at) FROM public.assessments WHERE user_id = p_user_id),
      (SELECT MAX(updated_at) FROM public.goals WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.journal_entries WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.chat_sessions WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM public.voice_sessions WHERE user_id = p_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get user's recent activity
CREATE OR REPLACE FUNCTION public.get_recent_activity(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH activities AS (
    -- Assessments
    SELECT 
      a.id,
      'assessment'::TEXT as type,
      a.type::TEXT as title,
      'Completed assessment' as description,
      a.created_at,
      jsonb_build_object('score', a.score, 'type', a.type) as metadata
    FROM public.assessments a
    WHERE a.user_id = p_user_id
    
    UNION ALL
    
    -- Goals
    SELECT 
      g.id,
      'goal'::TEXT as type,
      g.title,
      g.description,
      g.created_at,
      jsonb_build_object('status', g.status, 'category', g.category) as metadata
    FROM public.goals g
    WHERE g.user_id = p_user_id
    
    UNION ALL
    
    -- Journal entries
    SELECT 
      j.id,
      'journal'::TEXT as type,
      CASE 
        WHEN j.title IS NOT NULL THEN j.title
        ELSE 'Journal Entry'
      END as title,
      LEFT(j.content, 100) || '...' as description,
      j.created_at,
      jsonb_build_object('mood', j.mood, 'tags', j.tags) as metadata
    FROM public.journal_entries j
    WHERE j.user_id = p_user_id
  )
  SELECT * FROM activities
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Search across user content
CREATE OR REPLACE FUNCTION public.search_user_content(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  relevance REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Search goals
    SELECT 
      g.id,
      'goal'::TEXT as type,
      g.title,
      g.description as content,
      ts_rank(
        to_tsvector('english', COALESCE(g.title, '') || ' ' || COALESCE(g.description, '')),
        plainto_tsquery('english', p_query)
      ) as relevance,
      g.created_at
    FROM public.goals g
    WHERE g.user_id = p_user_id
    AND to_tsvector('english', COALESCE(g.title, '') || ' ' || COALESCE(g.description, '')) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search journal entries
    SELECT 
      j.id,
      'journal'::TEXT as type,
      COALESCE(j.title, 'Journal Entry') as title,
      j.content,
      ts_rank(
        to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.content, '')),
        plainto_tsquery('english', p_query)
      ) as relevance,
      j.created_at
    FROM public.journal_entries j
    WHERE j.user_id = p_user_id
    AND to_tsvector('english', COALESCE(j.title, '') || ' ' || COALESCE(j.content, '')) @@ plainto_tsquery('english', p_query)
    
    UNION ALL
    
    -- Search chat messages
    SELECT 
      m.id,
      'message'::TEXT as type,
      'Chat Message' as title,
      m.content,
      ts_rank(
        to_tsvector('english', m.content),
        plainto_tsquery('english', p_query)
      ) as relevance,
      m.created_at
    FROM public.chat_messages m
    JOIN public.chat_sessions s ON s.id = m.session_id
    WHERE s.user_id = p_user_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
  )
  SELECT * FROM search_results
  WHERE relevance > 0
  ORDER BY relevance DESC, created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Archive old data
CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void AS $$
BEGIN
  -- Archive chat messages older than 6 months
  UPDATE public.chat_messages
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true')
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false');
  
  -- Archive voice sessions older than 3 months
  UPDATE public.voice_sessions
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true')
  WHERE created_at < NOW() - INTERVAL '3 months'
  AND (metadata->>'archived' IS NULL OR metadata->>'archived' = 'false');
  
  -- Delete old error logs
  DELETE FROM public.error_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old performance metrics
  DELETE FROM public.performance_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Calculate subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_subscription BOOLEAN,
  plan_id TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_sub AS (
    SELECT * FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    EXISTS(SELECT 1 FROM user_sub) as has_subscription,
    COALESCE(us.plan_id, 'free') as plan_id,
    COALESCE(us.status, 'free') as status,
    us.current_period_end as expires_at,
    CASE 
      WHEN us.plan_id = 'premium' THEN jsonb_build_object(
        'unlimited_chats', true,
        'voice_enabled', true,
        'advanced_ai', true,
        'priority_support', true,
        'custom_prompts', true
      )
      WHEN us.plan_id = 'basic' THEN jsonb_build_object(
        'unlimited_chats', false,
        'voice_enabled', true,
        'advanced_ai', false,
        'priority_support', false,
        'custom_prompts', false
      )
      ELSE jsonb_build_object(
        'unlimited_chats', false,
        'voice_enabled', false,
        'advanced_ai', false,
        'priority_support', false,
        'custom_prompts', false
      )
    END as features
  FROM user_sub us
  RIGHT JOIN (SELECT 1) dummy ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_user_created ON public.assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created ON public.chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON public.chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_goals_search ON public.goals USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_journal_search ON public.journal_entries USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON public.chat_messages USING gin(to_tsvector('english', content));

-- =====================================
-- Migration: 20240114_fix_notification_and_performance.sql
-- =====================================

-- Fix notification_preferences table and permissions
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "email": {
      "enabled": true,
      "frequency": "immediate",
      "categories": ["achievement", "message", "system"]
    },
    "push": {
      "enabled": true,
      "categories": ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
    },
    "inApp": {
      "enabled": true,
      "sound": true,
      "vibration": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  tags JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  url TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.notification_preferences;

-- Create policies for notification_preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for performance_metrics
DROP POLICY IF EXISTS "Allow authenticated users to insert metrics" ON public.performance_metrics;
CREATE POLICY "Allow authenticated users to insert metrics" 
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON public.performance_metrics(session_id);

-- =====================================
-- Migration: 20240114_storage_setup.sql
-- =====================================

-- Storage Setup and Policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('voice-recordings', 'voice-recordings', false, false, 52428800, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('exports', 'exports', false, false, 104857600, ARRAY['application/zip', 'application/json', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for voice-recordings bucket
CREATE POLICY "Users can upload their own recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for exports bucket
CREATE POLICY "Users can create their own exports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can download their own exports" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exports" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper function to get storage URL
CREATE OR REPLACE FUNCTION public.get_storage_url(p_bucket TEXT, p_path TEXT)
RETURNS TEXT AS $$
DECLARE
  v_project_url TEXT;
BEGIN
  -- Get the project URL from the current configuration
  SELECT current_setting('app.settings.project_url', true) INTO v_project_url;
  
  IF v_project_url IS NULL THEN
    v_project_url := 'https://ufgqmqoykddaotdbwteg.supabase.co';
  END IF;
  
  RETURN v_project_url || '/storage/v1/object/public/' || p_bucket || '/' || p_path;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up old exports
CREATE OR REPLACE FUNCTION public.cleanup_old_exports()
RETURNS void AS $$
BEGIN
  -- Delete exports older than 7 days
  DELETE FROM storage.objects
  WHERE bucket_id = 'exports'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- Migration: 20250822060122_fdeccacc-e154-43b9-8269-7f246f353b98.sql
-- =====================================

-- Fix database security issues

-- 1. Fix database functions by adding proper search path
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET crystals_count = crystals_count + crystal_amount
  WHERE user_id = user_id_input;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_ai_providers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  score INTEGER := 75; -- Base score
  question_count INTEGER;
  similarity_bonus INTEGER := 0;
BEGIN
  -- Basic calculation based on answer similarities and depth
  question_count := jsonb_array_length(answers1);
  
  -- Add bonus for comprehensive answers (length > 50 chars)
  IF question_count >= 8 THEN
    score := score + 10;
  END IF;
  
  -- Return calculated score (ensure it stays within 0-100 range)
  RETURN LEAST(100, GREATEST(0, score + similarity_bonus));
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = uid AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_safe_profiles()
RETURNS TABLE(id uuid, user_id uuid, display_name text, subscription_tier text, role text, crystals_count integer, level_progress integer, login_streak_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, masked_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.subscription_tier,
    p.role,
    p.crystals_count,
    p.level_progress,
    p.login_streak_count,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    -- Mask email to show only first 2 chars + domain
    CASE 
      WHEN LENGTH(p.email) > 0 THEN 
        SUBSTRING(p.email FROM 1 FOR 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE 
        'hidden'
    END as masked_email
  FROM public.profiles p;
$function$;

CREATE OR REPLACE FUNCTION public.get_full_profile_with_logging(target_user_id uuid, access_justification text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profile_data public.profiles;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate justification
  IF access_justification IS NULL OR LENGTH(TRIM(access_justification)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Log the access
  INSERT INTO public.admin_profile_access_logs (admin_user_id, accessed_user_id, justification)
  VALUES (auth.uid(), target_user_id, access_justification);
  
  -- Return the full profile data
  SELECT * INTO profile_data FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  RETURN profile_data;
END;
$function$;

-- 2. Make user_id columns NOT NULL for security-critical tables
-- Note: This will fail if there are existing NULL values, which is intentional
-- for security - we need to clean up the data first

ALTER TABLE public.assessments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.audio_recordings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.voice_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.exploration_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.journal_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_breathing_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_game_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_memory ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_achievements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.webrtc_connection_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.community_connections ALTER COLUMN requester_id SET NOT NULL;
ALTER TABLE public.community_connections ALTER COLUMN requested_id SET NOT NULL;
ALTER TABLE public.couple_challenge_sessions ALTER COLUMN player1_id SET NOT NULL;
ALTER TABLE public.flagged_conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.training_sessions ALTER COLUMN admin_user_id SET NOT NULL;

-- 3. Add foreign key constraints to auth.users where missing
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Restrict some overly permissive RLS policies for authenticated users only
DROP POLICY IF EXISTS "Anyone can view active AI providers" ON public.ai_providers;
CREATE POLICY "Authenticated users can view active AI providers" 
ON public.ai_providers FOR SELECT 
TO authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access to webrtc_providers" ON public.webrtc_providers;
CREATE POLICY "Authenticated users can read webrtc_providers" 
ON public.webrtc_providers FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Authenticated users can view prompt templates" ON public.prompt_templates;
CREATE POLICY "Authenticated users can view active prompt templates" 
ON public.prompt_templates FOR SELECT 
TO authenticated 
USING (is_active = true);

-- 5. Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "System can create audit logs" 
ON public.security_audit_log FOR INSERT 
WITH CHECK (true);

-- =====================================
-- Migration: 20250822060148_09a08eb1-8188-4fe3-94f2-0e19cc7f1749.sql
-- =====================================

-- Fix database security issues (avoiding duplicates)

-- 1. Fix database functions by adding proper search path (these will replace existing ones)
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET crystals_count = crystals_count + crystal_amount
  WHERE user_id = user_id_input;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  score INTEGER := 75;
  question_count INTEGER;
  similarity_bonus INTEGER := 0;
BEGIN
  question_count := jsonb_array_length(answers1);
  
  IF question_count >= 8 THEN
    score := score + 10;
  END IF;
  
  RETURN LEAST(100, GREATEST(0, score + similarity_bonus));
END;
$function$;

-- 2. Restrict overly permissive RLS policies
DROP POLICY IF EXISTS "Anyone can view active AI providers" ON public.ai_providers;
CREATE POLICY "Authenticated users can view active AI providers" 
ON public.ai_providers FOR SELECT 
TO authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access to webrtc_providers" ON public.webrtc_providers;
CREATE POLICY "Authenticated users can read webrtc_providers" 
ON public.webrtc_providers FOR SELECT 
TO authenticated 
USING (true);

-- 3. Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "System can create audit logs" 
ON public.security_audit_log FOR INSERT 
WITH CHECK (true);

-- =====================================
-- Migration: 20250822060711_da714937-0b51-4888-93c1-8a19229e8c1f.sql
-- =====================================

-- Fix remaining database functions with search path
CREATE OR REPLACE FUNCTION public.update_admin_ai_providers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, login_streak_count, last_login_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    1,
    now()
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- =====================================
-- Migration: 20250822145129_b356e929-a85f-4860-84dd-d3b1c6ad3c1b.sql
-- =====================================


-- Create missing functions for exploration session management
CREATE OR REPLACE FUNCTION public.start_exploration_session(
  exploration_id_input uuid,
  user_id_input uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_id uuid;
BEGIN
  INSERT INTO public.exploration_sessions (
    user_id,
    exploration_id,
    status,
    current_question,
    user_answers
  ) VALUES (
    user_id_input,
    exploration_id_input,
    'in-progress',
    0,
    '[]'::jsonb
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to update exploration session progress
CREATE OR REPLACE FUNCTION public.update_exploration_progress(
  session_id_input uuid,
  question_index_input integer,
  answer_input text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_answers jsonb;
BEGIN
  -- Get current answers
  SELECT user_answers INTO current_answers 
  FROM exploration_sessions 
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Add new answer
  current_answers := current_answers || jsonb_build_array(answer_input);
  
  -- Update session
  UPDATE exploration_sessions 
  SET 
    current_question = question_index_input + 1,
    user_answers = current_answers,
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
END;
$$;

-- Function to complete exploration session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(
  session_id_input uuid,
  final_analysis_input jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  exploration_reward integer;
BEGIN
  -- Get crystal reward for this exploration
  SELECT crystal_reward INTO exploration_reward
  FROM explorations e
  JOIN exploration_sessions es ON e.id = es.exploration_id
  WHERE es.id = session_id_input;
  
  -- Complete the session
  UPDATE exploration_sessions 
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Award crystals
  PERFORM award_crystals(auth.uid(), exploration_reward);
END;
$$;

-- Create personality assessment questions table
CREATE TABLE IF NOT EXISTS public.personality_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personality_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for personality questions
CREATE POLICY "Anyone can view active personality questions" 
  ON public.personality_questions 
  FOR SELECT 
  USING (is_active = true);

-- Insert sample personality questions
INSERT INTO public.personality_questions (question_text, options, category, order_index) VALUES
('How do you typically recharge after a long day?', '["Spending time alone", "Being with friends/family", "Engaging in creative activities", "Physical exercise"]', 'energy', 1),
('When facing a difficult decision, you tend to:', '["Analyze all options logically", "Trust your gut feeling", "Seek advice from others", "Sleep on it"]', 'decision_making', 2),
('Your ideal weekend would include:', '["Learning something new", "Relaxing and doing nothing", "Social activities", "Adventure/exploration"]', 'lifestyle', 3),
('In relationships, you value most:', '["Deep emotional connection", "Intellectual compatibility", "Shared adventures", "Stability and security"]', 'relationships', 4),
('Your approach to personal growth is:', '["Structured and planned", "Intuitive and organic", "Community-based", "Challenge-driven"]', 'growth', 5);

-- Create balance wheel areas table
CREATE TABLE IF NOT EXISTS public.balance_wheel_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.balance_wheel_areas ENABLE ROW LEVEL SECURITY;

-- Create policy for balance wheel areas
CREATE POLICY "Anyone can view active balance wheel areas" 
  ON public.balance_wheel_areas 
  FOR SELECT 
  USING (is_active = true);

-- Insert balance wheel areas
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) VALUES
('Career & Purpose', 'Professional growth and life purpose', 'briefcase', 'hsl(220, 85%, 57%)', 1),
('Health & Wellness', 'Physical and mental wellbeing', 'heart', 'hsl(142, 71%, 45%)', 2),
('Relationships', 'Family, friends, and romantic connections', 'users', 'hsl(346, 87%, 58%)', 3),
('Personal Growth', 'Learning, skills, and self-development', 'trending-up', 'hsl(262, 83%, 58%)', 4),
('Finance & Security', 'Money management and future planning', 'dollar-sign', 'hsl(45, 93%, 47%)', 5),
('Fun & Recreation', 'Hobbies, entertainment, and joy', 'smile', 'hsl(24, 95%, 53%)', 6),
('Spirituality', 'Inner peace and connection to something greater', 'sun', 'hsl(280, 100%, 70%)', 7),
('Environment', 'Living space and surroundings', 'home', 'hsl(173, 58%, 39%)', 8);

-- Create user balance scores table
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES balance_wheel_areas(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for user balance scores
CREATE POLICY "Users can manage their own balance scores" 
  ON public.user_balance_scores 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to save personality assessment
CREATE OR REPLACE FUNCTION public.save_personality_assessment(
  user_id_input uuid,
  answers_input jsonb,
  results_input jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  INSERT INTO public.assessments (
    user_id,
    assessment_type,
    questions,
    answers,
    results,
    crystals_earned
  ) VALUES (
    user_id_input,
    'personality',
    '[]'::jsonb,
    answers_input,
    results_input,
    50
  ) RETURNING id INTO assessment_id;
  
  -- Award crystals for completing assessment
  PERFORM award_crystals(user_id_input, 50);
  
  RETURN assessment_id;
END;
$$;


-- =====================================
-- Migration: 20250825011159_b66b369b-a4c1-4a2a-bafa-3ea4e550851f.sql
-- =====================================

-- Create admin user and set up admin credentials for newomen.me
-- First, let's create a function to create admin users

CREATE OR REPLACE FUNCTION create_admin_user(
  email_input TEXT,
  display_name_input TEXT DEFAULT 'Admin User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
BEGIN
  -- Generate a UUID for the admin user
  user_id := gen_random_uuid();
  
  -- Insert into auth.users (this would normally be handled by Supabase Auth)
  -- Note: In production, admin users should sign up through the normal auth flow
  -- This is just for demo purposes
  
  -- Create profile with admin privileges
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    display_name,
    is_admin,
    subscription_tier,
    crystals_count,
    growth_areas,
    personality_type,
    preferences,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    email_input,
    display_name_input,
    true, -- Admin flag
    'premium',
    1000, -- Start with crystals
    ARRAY['Leadership', 'Platform Management', 'User Experience'],
    'ADMIN',
    '{"theme": "dark", "notifications": true, "language": "en"}',
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO profile_id;
  
  -- Log the admin creation
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
  ) VALUES (
    user_id,
    'ADMIN_CREATED',
    format('Admin user created: %s (%s)', display_name_input, email_input),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- Create admin logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies
CREATE POLICY "Admins can view all admin logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert admin logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (true);

-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create RLS policy for admin access
CREATE POLICY "Admins can access all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create admin access policies for other tables
CREATE POLICY "Admins can manage explorations"
  ON public.explorations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view all exploration sessions"
  ON public.exploration_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create example admin users for newomen.me
-- Note: These users would need to actually sign up through Supabase Auth
-- This just prepares their profiles with admin privileges

-- You can use these emails to sign up as admin:
-- admin@newomen.me
-- founder@newomen.me

-- After migration, to create an admin user:
-- 1. Sign up normally through the app with admin@newomen.me
-- 2. Then run: SELECT create_admin_user('admin@newomen.me', 'Admin User');
-- 3. Update the user's profile to set is_admin = true

COMMENT ON FUNCTION create_admin_user IS 'Creates admin user profile after user signs up through Supabase Auth';
COMMENT ON TABLE admin_logs IS 'Logs admin actions for security and auditing';
COMMENT ON COLUMN profiles.is_admin IS 'Grants admin privileges to user';

-- =====================================
-- Migration: 20250825011241_b0c35a72-d4ff-4b08-b4f6-210f88b2e9ba.sql
-- =====================================

-- Add is_admin column to profiles table first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create function to create admin privileges
CREATE OR REPLACE FUNCTION create_admin_user_privileges(
  user_id_input UUID,
  email_input TEXT,
  display_name_input TEXT DEFAULT 'Admin User'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update existing profile to admin
  UPDATE public.profiles 
  SET 
    is_admin = true,
    subscription_tier = 'premium',
    display_name = display_name_input,
    crystals_count = COALESCE(crystals_count, 0) + 1000
  WHERE user_id = user_id_input;
  
  -- Log the admin creation
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
  ) VALUES (
    user_id_input,
    'ADMIN_PRIVILEGES_GRANTED',
    jsonb_build_object('email', email_input, 'display_name', display_name_input),
    NOW()
  );
  
  RETURN true;
END;
$$;

-- Admin logs policies
CREATE POLICY "Admins can view all admin logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert admin logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (true);

-- Update profiles policies to allow admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update own profile or admins can update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create admin access for explorations
CREATE POLICY "Admins can manage all explorations"
  ON public.explorations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create admin access for exploration sessions
CREATE POLICY "Admins can view all exploration sessions"
  ON public.exploration_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Instructions for creating admin users:
-- 1. Sign up with admin@newomen.me through the normal auth flow
-- 2. Get the user ID from the profiles table
-- 3. Run: SELECT create_admin_user_privileges('[USER_ID]', 'admin@newomen.me', 'Admin User');

-- =====================================
-- Migration: 20250825024731_8b7bc623-34bd-44c0-b842-f725afcfd832.sql
-- =====================================

-- Add sample exploration data for the Newomen platform
INSERT INTO public.explorations (
  title,
  description,
  category,
  difficulty_level,
  estimated_duration,
  crystal_reward,
  facilitator_prompt,
  higher_self_prompt,
  questions,
  analysis_structure
) VALUES 
(
  'Confronting the Shadow Self',
  'Explore the hidden aspects of your personality that you may have rejected or denied. This profound journey helps you integrate all parts of yourself with compassion and understanding.',
  'self-discovery',
  'intermediate',
  45,
  150,
  'You are NewMe, a gentle and wise facilitator. Your role is to guide the user through their shadow work exploration with empathy and non-judgment. Simply acknowledge their answers warmly and ask the next question. Do not analyze or interpret until the analysis phase.',
  'You are the user''s Higher Self - their most wise, loving, and compassionate inner voice. You have witnessed their entire journey and understand their deepest truths. Provide insights that are both profound and practical, helping them integrate their shadow aspects with love and acceptance.',
  '[
    "What qualities in others trigger the strongest negative reactions in you? Be specific about what bothers you most.",
    "Think of a time when you acted in a way that surprised or disappointed you. What was happening internally?",
    "What parts of yourself do you try to hide from others? What would happen if people saw these aspects?",
    "When you were growing up, what messages did you receive about which emotions or behaviors were ''acceptable''?",
    "Describe a pattern in your relationships where you keep attracting the same type of challenges or conflicts.",
    "What would your harshest inner critic say about you? Write it in their voice.",
    "If you could ask your 7-year-old self what they needed to feel safe and loved, what would they say?",
    "What dreams or desires have you abandoned because you thought they were ''too much'' or ''unrealistic''?",
    "How do you sabotage yourself when things are going well? What fear might be driving this?",
    "If your shadow self could speak freely for one day, what would they want the world to know about you?"
  ]',
  '{
    "structure": ["Core Shadow Pattern", "Hidden Gold", "Integration Steps", "Shadow Affirmations", "Compassionate Closing"],
    "description": "A comprehensive analysis of the user''s shadow work exploration"
  }'
),
(
  'Deconstructing Relationship Patterns',
  'Examine the recurring patterns in your relationships - romantic, family, and friendships. Discover how your past shapes your present connections and how to create healthier dynamics.',
  'relationships',
  'beginner',
  35,
  100,
  'You are NewMe, a compassionate relationship guide. Help the user explore their relationship patterns with curiosity and kindness. Acknowledge their responses with understanding and guide them to the next question without judgment.',
  'You are their Higher Self who sees all their relationships with clarity and love. Help them understand their patterns not to judge themselves, but to grow and create more authentic connections.',
  '[
    "Describe the relationship dynamic you experienced between your primary caregivers. How did they show love and handle conflict?",
    "What do you consistently seek from others in your relationships? What underlying need does this fulfill?",
    "When conflict arises in your relationships, what is your typical response? Fight, flight, freeze, or fawn?",
    "What type of person do you repeatedly attract into your life? What might they be reflecting back to you?",
    "Describe a relationship that ended. What role did you play in its conclusion?",
    "What boundaries do you struggle to maintain in relationships? Where do you give too much or too little?",
    "When do you feel most authentically yourself in relationships? What conditions allow this?",
    "What fears come up for you around intimacy and being truly seen by another person?",
    "How do you handle it when someone you care about is upset with you or withdraws their attention?",
    "If you could heal one relationship pattern, what would it be and how would your life change?"
  ]',
  '{
    "structure": ["Relationship Core Pattern", "Generational Influence", "Growth Edge", "Relationship Affirmations", "Love Forward Message"],
    "description": "Deep insights into relationship patterns and pathways to healthier connections"
  }'
),
(
  'Healing the Inner Child',
  'Connect with the younger parts of yourself that still need love, attention, and healing. This gentle exploration helps you reparent yourself and break cycles of old pain.',
  'self-discovery',
  'advanced',
  50,
  200,
  'You are NewMe, a nurturing and patient guide for inner child work. Approach this sacred exploration with the gentleness of speaking to a beloved child. Simply hold space and ask questions with infinite compassion.',
  'You are their wise, loving Higher Self who has always been the perfect parent to their inner child. Speak with the voice of unconditional love and provide the healing message their inner child has been waiting to hear.',
  '[
    "When you think of yourself as a child, what age comes to mind immediately? What was happening in your life then?",
    "What did you need as a child that you didn''t receive enough of? Love, attention, safety, understanding, or something else?",
    "What activities brought you pure joy as a child, before you learned to worry about what others thought?",
    "Describe a moment from childhood when you felt misunderstood or alone. What would you want to tell that child now?",
    "What messages about your worth or lovability did you internalize growing up? Who gave you these messages?",
    "When you feel hurt or scared now, how does it echo experiences from your childhood?",
    "What parts of your childhood self do you miss most? What qualities did you have to hide or lose?",
    "If you could go back and be the adult in your childhood home, what would you do differently?",
    "What does your inner child want you to know about your life right now? What wisdom do they have?",
    "How can you nurture and care for your inner child in your daily adult life?"
  ]',
  '{
    "structure": ["Inner Child Core Wound", "Gifts of Your Younger Self", "Reparenting Steps", "Inner Child Affirmations", "Loving Parent Message"],
    "description": "A healing journey to embrace and nurture your inner child"
  }'
),
(
  'Exploring Life Purpose and Calling',
  'Dive deep into your authentic purpose and calling. Explore what truly matters to you beyond external expectations and discover the unique gifts you came here to share.',
  'personal-growth',
  'beginner',
  40,
  125,
  'You are NewMe, an inspiring guide for life purpose exploration. Help the user connect with their authentic calling with enthusiasm and gentle encouragement. Simply witness their answers and guide them forward.',
  'You are their Higher Self who knows their true purpose and the gifts they came to share. Speak with clarity and inspiration about their unique mission and path forward.',
  '[
    "What activities make you lose track of time because you''re so engaged and energized by them?",
    "If you had unlimited resources and couldn''t fail, what would you dedicate your life to creating or changing?",
    "What injustices or problems in the world stir the deepest passion or anger in you?",
    "When you were a child, what did you dream of becoming or doing when you grew up? What called to your heart?",
    "What unique combination of skills, experiences, and perspectives do you bring that others might not have?",
    "What would you regret not trying or expressing if you looked back on your life?",
    "When do you feel most alive and in alignment with who you truly are?",
    "What legacy do you want to leave behind? How do you want to be remembered?",
    "What fear or limiting belief has kept you from pursuing what truly calls to you?",
    "If your life purpose could speak to you right now, what would it say about your next steps?"
  ]',
  '{
    "structure": ["Core Life Mission", "Unique Gifts & Talents", "Purpose-Aligned Actions", "Purpose Affirmations", "Calling Forward Message"],
    "description": "Clarity and direction for living your authentic purpose"
  }'
),
(
  'Transforming Fear into Power',
  'Face your deepest fears and transform them into sources of strength and wisdom. This exploration helps you understand what fear is trying to teach you and how to move forward courageously.',
  'personal-growth',
  'intermediate',
  30,
  100,
  'You are NewMe, a courageous and supportive guide for fear transformation. Help the user face their fears with bravery and compassion. Acknowledge their courage in looking at what scares them and gently guide them to the next question.',
  'You are their fearless Higher Self who sees through all illusions to the truth of their power. Help them transform fear into wisdom and strength.',
  '[
    "What is your greatest fear about your life, relationships, or future? Be completely honest.",
    "When did this fear first appear in your life? What was happening when you first felt this way?",
    "How has this fear protected you or served you in some way? What has it helped you avoid?",
    "What opportunities or experiences have you missed because of this fear?",
    "If this fear had a voice, what would it be trying to tell you about what you need or value?",
    "Describe a time when you acted despite fear and what happened as a result.",
    "What would be possible in your life if this fear no longer controlled your choices?",
    "What small step could you take toward what you fear that would prove you can handle it?",
    "What support or resources would you need to feel more courage in facing this fear?",
    "If fear were your teacher, what is the most important lesson it wants you to learn?"
  ]',
  '{
    "structure": ["Core Fear Pattern", "Fear as Teacher", "Courage Building Steps", "Courage Affirmations", "Fearless Self Message"],
    "description": "Transformation of fear into personal power and wisdom"
  }'
);

-- Add sample breathing practices
INSERT INTO public.breathing_practices (
  title,
  description,
  duration_minutes,
  difficulty_level,
  category,
  instructions,
  audio_url
) VALUES 
(
  'Heart Coherence Breathing',
  'A scientifically-backed breathing technique that creates coherence between your heart, mind, and emotions. Perfect for reducing stress and increasing emotional balance.',
  5,
  1,
  'relaxation',
  '{
    "steps": [
      "Sit comfortably with your back straight",
      "Place one hand on your heart",
      "Breathe in slowly for 5 counts through your nose",
      "Breathe out slowly for 5 counts through your mouth",
      "Focus on feelings of appreciation or gratitude",
      "Continue for the full duration"
    ],
    "benefits": ["Reduces stress hormones", "Improves emotional regulation", "Enhances mental clarity"]
  }',
  NULL
),
(
  'Energizing Morning Breath',
  'An invigorating breathing practice designed to awaken your body and mind. Use this to start your day with vitality and focus.',
  8,
  2,
  'energy',
  '{
    "steps": [
      "Stand with feet hip-width apart",
      "Inhale deeply raising arms overhead",
      "Hold breath for 3 counts",
      "Exhale forcefully while lowering arms",
      "Repeat with increasing intensity",
      "End with 3 deep, calming breaths"
    ],
    "benefits": ["Increases energy levels", "Improves circulation", "Enhances mental alertness"]
  }',
  NULL
),
(
  '4-7-8 Anxiety Relief',
  'Dr. Andrew Weil''s famous technique for calming the nervous system and reducing anxiety. Known as a natural tranquilizer for the mind.',
  10,
  1,
  'relaxation',
  '{
    "steps": [
      "Sit with your back straight",
      "Exhale completely through your mouth",
      "Close your mouth, inhale through nose for 4 counts",
      "Hold your breath for 7 counts",
      "Exhale through mouth for 8 counts making a whoosh sound",
      "Repeat cycle 4 times"
    ],
    "benefits": ["Reduces anxiety", "Promotes better sleep", "Calms the nervous system"]
  }',
  NULL
),
(
  'Focus Enhancement Breath',
  'A concentration-building practice that sharpens mental focus and clarity. Ideal before important tasks or meditation.',
  12,
  2,
  'focus',
  '{
    "steps": [
      "Sit in meditation posture",
      "Close your eyes and focus on your breath",
      "Count each inhale and exhale up to 10",
      "When you reach 10, start over at 1",
      "If you lose count, gently return to 1",
      "Notice increased mental clarity"
    ],
    "benefits": ["Improves concentration", "Enhances mindfulness", "Reduces mental chatter"]
  }',
  NULL
),
(
  'Deep Healing Breath',
  'A profound breathing practice for emotional healing and release. Creates space for processing and letting go of stored emotions.',
  20,
  3,
  'relaxation',
  '{
    "steps": [
      "Lie down comfortably with eyes closed",
      "Begin with natural breathing",
      "Gradually deepen each breath",
      "Breathe into your belly, then chest",
      "Pause briefly before each exhale",
      "Allow any emotions to arise and pass",
      "End with gratitude for your body"
    ],
    "benefits": ["Promotes emotional release", "Reduces stored tension", "Enhances self-compassion"]
  }',
  NULL
);

-- Add balance wheel areas
INSERT INTO public.balance_wheel_areas (
  name,
  description,
  icon,
  color,
  order_index
) VALUES 
('Health & Wellness', 'Physical health, mental wellbeing, energy levels, and self-care practices', 'Heart', '#10B981', 1),
('Career & Purpose', 'Professional growth, life purpose, meaningful work, and contribution to the world', 'Briefcase', '#3B82F6', 2),
('Relationships & Love', 'Romantic relationships, family bonds, friendships, and social connections', 'Users', '#EC4899', 3),
('Personal Growth', 'Learning, spiritual development, self-awareness, and continuous improvement', 'TrendingUp', '#8B5CF6', 4),
('Financial Security', 'Money management, financial goals, abundance mindset, and economic stability', 'DollarSign', '#F59E0B', 5),
('Fun & Recreation', 'Hobbies, entertainment, adventure, play, and activities that bring joy', 'Smile', '#06B6D4', 6),
('Home & Environment', 'Living space, organization, comfort, and environmental harmony', 'Home', '#84CC16', 7),
('Contribution & Legacy', 'Giving back, making a difference, and the mark you want to leave on the world', 'Globe', '#EF4444', 8);

-- Add personality questions for assessment
INSERT INTO public.personality_questions (
  question_text,
  question_type,
  category,
  options,
  order_index
) VALUES 
(
  'When facing a difficult decision, you typically:',
  'multiple_choice',
  'decision_making',
  '[
    {"value": "intuitive", "text": "Trust your gut feeling and inner wisdom"},
    {"value": "analytical", "text": "Gather data and analyze all possible outcomes"},
    {"value": "social", "text": "Seek advice from trusted friends or mentors"},
    {"value": "experiential", "text": "Try different approaches and learn by doing"}
  ]',
  1
),
(
  'In social situations, you feel most energized when:',
  'multiple_choice',
  'social_energy',
  '[
    {"value": "large_groups", "text": "In large groups with lots of stimulating conversation"},
    {"value": "small_groups", "text": "In intimate settings with a few close friends"},
    {"value": "one_on_one", "text": "Having deep, meaningful one-on-one conversations"},
    {"value": "alone_time", "text": "You prefer quiet time alone to recharge"}
  ]',
  2
),
(
  'Your ideal approach to personal growth involves:',
  'multiple_choice',
  'growth_style',
  '[
    {"value": "structured", "text": "Following structured programs and clear frameworks"},
    {"value": "intuitive", "text": "Following your intuition and inner guidance"},
    {"value": "collaborative", "text": "Learning through relationships and shared experiences"},
    {"value": "experimental", "text": "Trying new experiences and reflecting on them"}
  ]',
  3
),
(
  'When you encounter stress or overwhelm, you naturally:',
  'multiple_choice',
  'stress_response',
  '[
    {"value": "action", "text": "Take immediate action to solve the problem"},
    {"value": "reflection", "text": "Step back and reflect on the deeper meaning"},
    {"value": "support", "text": "Reach out to others for support and guidance"},
    {"value": "solitude", "text": "Retreat into solitude to process and recharge"}
  ]',
  4
),
(
  'Your core motivation in life is driven by:',
  'multiple_choice',
  'life_motivation',
  '[
    {"value": "achievement", "text": "Achieving goals and making tangible progress"},
    {"value": "connection", "text": "Building deep, meaningful relationships"},
    {"value": "growth", "text": "Continuous learning and self-improvement"},
    {"value": "contribution", "text": "Making a positive impact on the world"}
  ]',
  5
),
(
  'You feel most authentic and alive when:',
  'multiple_choice',
  'authenticity',
  '[
    {"value": "creating", "text": "Creating something new or expressing creativity"},
    {"value": "helping", "text": "Helping others and making a difference"},
    {"value": "exploring", "text": "Exploring new ideas, places, or experiences"},
    {"value": "connecting", "text": "Connecting deeply with yourself or others"}
  ]',
  6
);

-- Add daily affirmations
INSERT INTO public.daily_affirmations (
  text,
  category,
  personality_types,
  cultural_context
) VALUES 
('I trust my inner wisdom to guide me toward my highest good', 'self-trust', '{"intuitive", "reflective"}', NULL),
('I am worthy of love, success, and all the beautiful experiences life offers', 'self-worth', '{}', NULL),
('My authentic self is my greatest strength and gift to the world', 'authenticity', '{}', NULL),
('I embrace challenges as opportunities for growth and expansion', 'growth', '{"achiever", "explorer"}', NULL),
('I release what no longer serves me and welcome positive change', 'letting-go', '{}', NULL),
('My relationships are built on love, respect, and mutual understanding', 'relationships', '{"connector", "helper"}', NULL),
('I have the courage to pursue my dreams and live my purpose', 'courage', '{"achiever", "creator"}', NULL),
('I am grateful for my journey and trust in perfect timing', 'gratitude', '{}', NULL),
('My voice matters and my contributions make a difference', 'contribution', '{"helper", "creator"}', NULL),
('I choose peace, joy, and love in every moment', 'emotional-balance', '{}', NULL),
('أنا قوية وقادرة على تحقيق أحلامي', 'empowerment', '{}', 'arabic'),
('I honor my cultural heritage while embracing my unique path', 'cultural-identity', '{}', 'multicultural'),
('My sensitivity is a superpower that connects me to others', 'sensitivity', '{"intuitive", "connector"}', NULL),
('I create boundaries that protect my energy and well-being', 'boundaries', '{}', NULL),
('Every experience teaches me something valuable about myself', 'learning', '{"growth", "explorer"}', NULL);

-- =====================================
-- Migration: 20250825025529_b66d2e5d-71c6-4927-8220-5ff32993ae0b.sql
-- =====================================

-- Fix infinite recursion in profiles table RLS policies
-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Admins have restricted profile access" ON public.profiles;

-- Create a simple, non-recursive function to check admin status
-- This function uses a different approach to avoid recursion
CREATE OR REPLACE FUNCTION public.check_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' OR is_admin = true 
     FROM public.profiles 
     WHERE user_id = auth.uid() 
     LIMIT 1), 
    false
  );
$$;

-- Create new, simplified RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Separate admin access policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@newomen.me'
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@newomen.me'
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@newomen.me'
  )
);

-- =====================================
-- Migration: 20250825025559_05aa3e61-1b32-44fb-a408-4f8bb3671a4a.sql
-- =====================================

-- Fix infinite recursion in profiles table RLS policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Admins have restricted profile access" ON public.profiles;

-- Update the is_admin function to avoid recursion by using auth.users table
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = uid 
    AND auth.users.email = 'admin@newomen.me'
  );
$$;

-- Create clean, non-recursive RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin policies using the updated is_admin function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- =====================================
-- Migration: 20250825030534_09932c38-276d-4519-aafc-a73130e05c77.sql
-- =====================================

-- Create platform settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  category text NOT NULL DEFAULT 'general'::text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for platform_settings
CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create policy for public settings (non-sensitive)
CREATE POLICY "Public settings are viewable by authenticated users"
ON public.platform_settings
FOR SELECT
USING (is_public = true AND auth.role() = 'authenticated');

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description, category, is_public) VALUES
('platform_name', '"Newomen"', 'Platform display name', 'general', true),
('platform_description', '"AI-Powered Personal Growth Platform for Women"', 'Platform description', 'general', true),
('support_email', '"support@newomen.me"', 'Platform support email', 'general', false),
('maintenance_mode', 'false', 'Enable maintenance mode', 'general', false),
('registration_enabled', 'true', 'Allow new user registration', 'general', false),
('max_daily_messages', '100', 'Maximum daily messages per user', 'limits', false),
('default_crystal_reward', '10', 'Default crystal reward amount', 'gamification', false),
('content_moderation_enabled', 'true', 'Enable content moderation', 'moderation', false),
('auto_flag_threshold', '0.7', 'Automatic flagging threshold', 'moderation', false),
('primary_ai_provider', '"openai"', 'Primary AI provider', 'ai', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get setting value
CREATE OR REPLACE FUNCTION public.get_platform_setting(key_name text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = key_name
  LIMIT 1;
$$;

-- Create function to update setting value (admin only)
CREATE OR REPLACE FUNCTION public.update_platform_setting(key_name text, new_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update or insert setting
  INSERT INTO public.platform_settings (setting_key, setting_value, updated_at)
  VALUES (key_name, new_value, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- Create updated_at trigger for platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- Migration: 20250825035244_bf496688-e1b8-4179-83b9-f594ce96e83f.sql
-- =====================================

-- PHASE 1: CRITICAL DATA PROTECTION - Secure AI System Prompts and User Role Management

-- 1. DROP existing permissive policies on prompt_templates
DROP POLICY IF EXISTS "Users can view prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can create prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can update prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Users can delete prompt templates" ON public.prompt_templates;

-- 2. CREATE admin-only policies for prompt_templates
CREATE POLICY "Admin can view prompt templates" 
ON public.prompt_templates 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can create prompt templates" 
ON public.prompt_templates 
FOR INSERT 
TO authenticated 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update prompt templates" 
ON public.prompt_templates 
FOR UPDATE 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can delete prompt templates" 
ON public.prompt_templates 
FOR DELETE 
TO authenticated 
USING (is_admin(auth.uid()));

-- 3. CREATE secure user role update function
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'moderator', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'USER_ROLE_UPDATE',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role', new_role,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- 4. CREATE secure subscription tier update function
CREATE OR REPLACE FUNCTION public.update_user_subscription_secure(target_user_id uuid, new_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate subscription tier
  IF new_tier NOT IN ('free', 'premium', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;
  
  -- Update subscription tier
  UPDATE public.profiles 
  SET subscription_tier = new_tier, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'USER_SUBSCRIPTION_UPDATE',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_subscription_tier', new_tier,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- 5. FIX function security paths for existing functions
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin for large crystal awards
  IF crystal_amount > 1000 AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required for large crystal awards';
  END IF;
  
  UPDATE public.profiles
  SET crystals_count = crystals_count + crystal_amount, updated_at = now()
  WHERE user_id = user_id_input;
  
  -- Log crystal awards
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(), 
    'CRYSTALS_AWARDED',
    jsonb_build_object(
      'target_user_id', user_id_input,
      'crystal_amount', crystal_amount,
      'timestamp', now()
    )
  );
END;
$$;

-- 6. SECURE ai_providers table access
DROP POLICY IF EXISTS "Users can view AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can manage AI providers" ON public.ai_providers;

CREATE POLICY "Admin can view AI providers" 
ON public.ai_providers 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage AI providers" 
ON public.ai_providers 
FOR ALL 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 7. CREATE audit trigger for prompt template access
CREATE OR REPLACE FUNCTION public.log_prompt_template_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(),
    CASE TG_OP
      WHEN 'SELECT' THEN 'PROMPT_TEMPLATE_VIEWED'
      WHEN 'INSERT' THEN 'PROMPT_TEMPLATE_CREATED'
      WHEN 'UPDATE' THEN 'PROMPT_TEMPLATE_UPDATED'
      WHEN 'DELETE' THEN 'PROMPT_TEMPLATE_DELETED'
    END,
    jsonb_build_object(
      'template_id', COALESCE(NEW.id, OLD.id),
      'template_name', COALESCE(NEW.name, OLD.name),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to prompt_templates
CREATE TRIGGER prompt_template_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.log_prompt_template_access();

-- =====================================
-- Migration: 20250825035626_b54aaa0e-fb97-42e7-b367-78cfd17ea8ab.sql
-- =====================================

-- CRITICAL SECURITY FIXES - Phase 1: Admin Authorization and Access Control

-- 1. FIX the is_admin() function to use role-based authorization instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = uid 
    AND profiles.role = 'admin'
  );
$$;

-- 2. UPDATE all functions to have proper search_path security
CREATE OR REPLACE FUNCTION public.get_admin_safe_profiles()
RETURNS TABLE(id uuid, user_id uuid, display_name text, subscription_tier text, role text, crystals_count integer, level_progress integer, login_streak_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, masked_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.subscription_tier,
    p.role,
    p.crystals_count,
    p.level_progress,
    p.login_streak_count,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    -- Mask email to show only first 2 chars + domain
    CASE 
      WHEN LENGTH(p.email) > 0 THEN 
        SUBSTRING(p.email FROM 1 FOR 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE 
        'hidden'
    END as masked_email
  FROM public.profiles p;
$$;

CREATE OR REPLACE FUNCTION public.get_full_profile_with_logging(target_user_id uuid, access_justification text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_data public.profiles;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate justification
  IF access_justification IS NULL OR LENGTH(TRIM(access_justification)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Log the access
  INSERT INTO public.admin_profile_access_logs (admin_user_id, accessed_user_id, justification)
  VALUES (auth.uid(), target_user_id, access_justification);
  
  -- Return the full profile data
  SELECT * INTO profile_data FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  RETURN profile_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_setting(key_name text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = key_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_platform_setting(key_name text, new_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update or insert setting
  INSERT INTO public.platform_settings (setting_key, setting_value, updated_at)
  VALUES (key_name, new_value, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- 3. REMOVE the inconsistent is_admin boolean column from profiles
-- First, create a backup column in case we need to revert
ALTER TABLE public.profiles ADD COLUMN is_admin_backup boolean DEFAULT false;
UPDATE public.profiles SET is_admin_backup = is_admin;

-- Now drop the is_admin column to force consistent role-based authorization
ALTER TABLE public.profiles DROP COLUMN is_admin;

-- 4. SECURE admin_logs table - remove anonymous access
DROP POLICY IF EXISTS "System can insert admin logs" ON public.admin_logs;

CREATE POLICY "Admins can insert admin logs" 
ON public.admin_logs 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 5. SECURE ai_providers table - remove anonymous access
DROP POLICY IF EXISTS "Authenticated users can view active AI providers" ON public.ai_providers;

-- Only admin-controlled access now
CREATE POLICY "Admins can view all AI providers" 
ON public.ai_providers 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- 6. FIX prompt_templates policies - remove conflicting policies
DROP POLICY IF EXISTS "Authenticated users can manage prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Authenticated users can view prompt templates" ON public.prompt_templates;

-- Only admin policies remain (already created in previous migration)

-- 7. SECURE flagged_conversations - ensure proper admin access only
DROP POLICY IF EXISTS "Service role can create flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can update flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can view flagged conversations" ON public.flagged_conversations;

-- Create proper admin-only policies
CREATE POLICY "Admins can manage flagged conversations" 
ON public.flagged_conversations 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 8. SECURE admin_ai_providers table access
DROP POLICY IF EXISTS "Admin access to AI providers" ON public.admin_ai_providers;

CREATE POLICY "Admins can manage admin AI providers" 
ON public.admin_ai_providers 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 9. SECURE training_sessions table access  
DROP POLICY IF EXISTS "Admin access to training sessions" ON public.training_sessions;

CREATE POLICY "Admins can manage training sessions" 
ON public.training_sessions 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 10. LOG all admin authorization changes
INSERT INTO public.admin_logs (admin_id, action, details)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_HARDENING_APPLIED',
  jsonb_build_object(
    'changes', array[
      'Fixed is_admin() function to use role-based authorization',
      'Removed inconsistent is_admin boolean column',
      'Applied proper search_path to all functions',
      'Restricted admin table access to authenticated admins only',
      'Removed anonymous access to sensitive admin data'
    ],
    'timestamp', now(),
    'severity', 'CRITICAL'
  )
);

-- =====================================
-- Migration: 20250825040125_c66ea014-93bf-470c-87c7-e864147d63f6.sql
-- =====================================

-- CRITICAL SECURITY FIXES - Phase 1: Admin Authorization and Access Control (Fixed)

-- 1. FIX the is_admin() function to use role-based authorization instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = uid 
    AND profiles.role = 'admin'
  );
$$;

-- 2. UPDATE all policies that depend on is_admin column to use the new role-based function
-- First update admin_logs policies
DROP POLICY IF EXISTS "Admins can view all admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view all admin logs" 
ON public.admin_logs 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- Update explorations policies
DROP POLICY IF EXISTS "Admins can manage all explorations" ON public.explorations;
CREATE POLICY "Admins can manage all explorations" 
ON public.explorations 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Update exploration_sessions policies
DROP POLICY IF EXISTS "Admins can view all exploration sessions" ON public.exploration_sessions;
CREATE POLICY "Admins can view all exploration sessions" 
ON public.exploration_sessions 
FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));

-- 3. NOW we can safely remove the is_admin column
-- First, create a backup column in case we need to revert
ALTER TABLE public.profiles ADD COLUMN is_admin_backup boolean DEFAULT false;
UPDATE public.profiles SET is_admin_backup = is_admin;

-- Now drop the is_admin column
ALTER TABLE public.profiles DROP COLUMN is_admin;

-- 4. UPDATE all functions to have proper search_path security
CREATE OR REPLACE FUNCTION public.get_admin_safe_profiles()
RETURNS TABLE(id uuid, user_id uuid, display_name text, subscription_tier text, role text, crystals_count integer, level_progress integer, login_streak_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, masked_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.subscription_tier,
    p.role,
    p.crystals_count,
    p.level_progress,
    p.login_streak_count,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    CASE 
      WHEN LENGTH(p.email) > 0 THEN 
        SUBSTRING(p.email FROM 1 FOR 2) || '***@' || SPLIT_PART(p.email, '@', 2)
      ELSE 
        'hidden'
    END as masked_email
  FROM public.profiles p;
$$;

CREATE OR REPLACE FUNCTION public.get_full_profile_with_logging(target_user_id uuid, access_justification text)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_data public.profiles;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  IF access_justification IS NULL OR LENGTH(TRIM(access_justification)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Valid justification required (minimum 10 characters)';
  END IF;
  
  INSERT INTO public.admin_profile_access_logs (admin_user_id, accessed_user_id, justification)
  VALUES (auth.uid(), target_user_id, access_justification);
  
  SELECT * INTO profile_data FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  RETURN profile_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_setting(key_name text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT setting_value
  FROM public.platform_settings
  WHERE setting_key = key_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_platform_setting(key_name text, new_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  INSERT INTO public.platform_settings (setting_key, setting_value, updated_at)
  VALUES (key_name, new_value, now())
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
    
  RETURN true;
END;
$$;

-- 5. SECURE admin tables - remove anonymous access
DROP POLICY IF EXISTS "System can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs" 
ON public.admin_logs 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 6. SECURE ai_providers table - remove anonymous access
DROP POLICY IF EXISTS "Authenticated users can view active AI providers" ON public.ai_providers;
CREATE POLICY "Admins can view all AI providers" 
ON public.ai_providers 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- 7. FIX prompt_templates policies - remove conflicting policies
DROP POLICY IF EXISTS "Authenticated users can manage prompt templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Authenticated users can view prompt templates" ON public.prompt_templates;

-- 8. SECURE flagged_conversations - ensure proper admin access only
DROP POLICY IF EXISTS "Service role can create flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can update flagged conversations" ON public.flagged_conversations;
DROP POLICY IF EXISTS "Service role can view flagged conversations" ON public.flagged_conversations;

CREATE POLICY "Admins can manage flagged conversations" 
ON public.flagged_conversations 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 9. SECURE admin_ai_providers table access
DROP POLICY IF EXISTS "Admin access to AI providers" ON public.admin_ai_providers;
CREATE POLICY "Admins can manage admin AI providers" 
ON public.admin_ai_providers 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 10. SECURE training_sessions table access  
DROP POLICY IF EXISTS "Admin access to training sessions" ON public.training_sessions;
CREATE POLICY "Admins can manage training sessions" 
ON public.training_sessions 
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 11. LOG the security fixes
INSERT INTO public.admin_logs (admin_id, action, details)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_HARDENING_APPLIED',
  jsonb_build_object(
    'changes', array[
      'Fixed is_admin() function to use role-based authorization',
      'Updated all dependent policies to use new role-based function',
      'Removed inconsistent is_admin boolean column',
      'Applied proper search_path to all functions',
      'Restricted admin table access to authenticated admins only',
      'Removed anonymous access to sensitive admin data'
    ],
    'timestamp', now(),
    'severity', 'CRITICAL'
  )
);

-- =====================================
-- Migration: 20250825040217_f9413c51-42bc-40eb-b170-770ff04a282f.sql
-- =====================================

-- CRITICAL SECURITY FIXES - Phase 2: Fix Function Search Path Security

-- Fix the remaining functions that need SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(answers1 jsonb, answers2 jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score INTEGER := 75;
  question_count INTEGER;
  similarity_bonus INTEGER := 0;
BEGIN
  question_count := jsonb_array_length(answers1);
  
  IF question_count >= 8 THEN
    score := score + 10;
  END IF;
  
  RETURN LEAST(100, GREATEST(0, score + similarity_bonus));
END;
$$;

CREATE OR REPLACE FUNCTION public.start_exploration_session(exploration_id_input uuid, user_id_input uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_id uuid;
BEGIN
  INSERT INTO public.exploration_sessions (
    user_id,
    exploration_id,
    status,
    current_question,
    user_answers
  ) VALUES (
    user_id_input,
    exploration_id_input,
    'in-progress',
    0,
    '[]'::jsonb
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_exploration_progress(session_id_input uuid, question_index_input integer, answer_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_answers jsonb;
BEGIN
  -- Get current answers
  SELECT user_answers INTO current_answers 
  FROM exploration_sessions 
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Add new answer
  current_answers := current_answers || jsonb_build_array(answer_input);
  
  -- Update session
  UPDATE exploration_sessions 
  SET 
    current_question = question_index_input + 1,
    user_answers = current_answers,
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_exploration_session(session_id_input uuid, final_analysis_input jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  exploration_reward integer;
BEGIN
  -- Get crystal reward for this exploration
  SELECT crystal_reward INTO exploration_reward
  FROM explorations e
  JOIN exploration_sessions es ON e.id = es.exploration_id
  WHERE es.id = session_id_input;
  
  -- Complete the session
  UPDATE exploration_sessions 
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input AND user_id = auth.uid();
  
  -- Award crystals
  PERFORM award_crystals(auth.uid(), exploration_reward);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_personality_assessment(user_id_input uuid, answers_input jsonb, results_input jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  INSERT INTO public.assessments (
    user_id,
    assessment_type,
    questions,
    answers,
    results,
    crystals_earned
  ) VALUES (
    user_id_input,
    'personality',
    '[]'::jsonb,
    answers_input,
    results_input,
    50
  ) RETURNING id INTO assessment_id;
  
  -- Award crystals for completing assessment
  PERFORM award_crystals(user_id_input, 50);
  
  RETURN assessment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_user_privileges(user_id_input uuid, email_input text, display_name_input text DEFAULT 'Admin User'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update existing profile to admin
  UPDATE public.profiles 
  SET 
    role = 'admin',
    subscription_tier = 'premium',
    display_name = display_name_input,
    crystals_count = COALESCE(crystals_count, 0) + 1000
  WHERE user_id = user_id_input;
  
  -- Log the admin creation
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
  ) VALUES (
    user_id_input,
    'ADMIN_PRIVILEGES_GRANTED',
    jsonb_build_object('email', email_input, 'display_name', display_name_input),
    NOW()
  );
  
  RETURN true;
END;
$$;

-- Update the handle_new_user function to set proper default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, login_streak_count, last_login_at, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    1,
    now(),
    'user'
  );
  RETURN new;
END;
$$;

-- Fix the admin authorization for all policies that require authentication

-- Fix the issues with user policies requiring authenticated access only
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create new conversations." ON public.conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create new messages." ON public.messages;

CREATE POLICY "Authenticated users can create messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Log completion of Phase 2 security fixes
INSERT INTO public.admin_logs (admin_id, action, details)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_PHASE_2_COMPLETED',
  jsonb_build_object(
    'changes', array[
      'Fixed function search_path security for all remaining functions',
      'Updated admin privilege function to use role instead of is_admin',
      'Fixed user policies to require authenticated access only',
      'Enhanced new user trigger with proper role assignment'
    ],
    'timestamp', now(),
    'severity', 'HIGH'
  )
);

-- =====================================
-- Migration: 20250827140830_c5968cc3-21c3-4673-99b4-32ea725de30e.sql
-- =====================================

-- Create comprehensive schema for Newomen platform

-- 1. Explorations system
CREATE TABLE IF NOT EXISTS public.explorations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'self-discovery',
  difficulty_level text NOT NULL DEFAULT 'beginner',
  estimated_duration integer NOT NULL DEFAULT 30,
  crystal_reward integer NOT NULL DEFAULT 100,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  facilitator_prompt text NOT NULL,
  higher_self_prompt text NOT NULL,
  analysis_structure jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for explorations
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;

-- RLS policies for explorations
CREATE POLICY "Anyone can view active explorations" ON public.explorations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage explorations" ON public.explorations
  FOR ALL USING (is_admin(auth.uid()));

-- 2. Exploration sessions
CREATE TABLE IF NOT EXISTS public.exploration_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exploration_id uuid NOT NULL REFERENCES public.explorations(id),
  status text NOT NULL DEFAULT 'in-progress',
  current_question integer NOT NULL DEFAULT 0,
  user_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_analysis jsonb DEFAULT NULL,
  crystals_earned integer DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for exploration sessions
ALTER TABLE public.exploration_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for exploration sessions
CREATE POLICY "Users can manage their own sessions" ON public.exploration_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.exploration_sessions
  FOR SELECT USING (is_admin(auth.uid()));

-- 3. Personality assessment system
CREATE TABLE IF NOT EXISTS public.personality_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL,
  order_index integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for personality questions
ALTER TABLE public.personality_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for personality questions
CREATE POLICY "Anyone can view active questions" ON public.personality_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON public.personality_questions
  FOR ALL USING (is_admin(auth.uid()));

-- 4. Balance wheel system
CREATE TABLE IF NOT EXISTS public.balance_wheel_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Circle',
  color text NOT NULL DEFAULT '#3b82f6',
  order_index integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for balance wheel areas
ALTER TABLE public.balance_wheel_areas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active areas" ON public.balance_wheel_areas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage areas" ON public.balance_wheel_areas
  FOR ALL USING (is_admin(auth.uid()));

-- 5. User balance scores
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  area_id uuid NOT NULL REFERENCES public.balance_wheel_areas(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS for user balance scores
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own scores" ON public.user_balance_scores
  FOR ALL USING (auth.uid() = user_id);

-- 6. Breathing practices
CREATE TABLE IF NOT EXISTS public.breathing_practices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  duration_minutes integer NOT NULL,
  difficulty_level integer NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 4),
  category text NOT NULL DEFAULT 'relaxation',
  instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
  audio_url text,
  slug text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breathing_practices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active practices" ON public.breathing_practices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage practices" ON public.breathing_practices
  FOR ALL USING (is_admin(auth.uid()));

-- 7. User breathing progress
CREATE TABLE IF NOT EXISTS public.user_breathing_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  practice_id uuid NOT NULL REFERENCES public.breathing_practices(id),
  completed_sessions integer NOT NULL DEFAULT 0,
  total_duration integer NOT NULL DEFAULT 0,
  personal_best_duration integer NOT NULL DEFAULT 0,
  last_completed timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_id)
);

-- Enable RLS
ALTER TABLE public.user_breathing_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own progress" ON public.user_breathing_progress
  FOR ALL USING (auth.uid() = user_id);

-- 8. Community connections
CREATE TABLE IF NOT EXISTS public.community_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  requested_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, requested_id)
);

-- Enable RLS
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own connections" ON public.community_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- 9. Achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'Trophy',
  crystal_reward integer NOT NULL DEFAULT 50,
  unlock_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active achievements" ON public.achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (is_admin(auth.uid()));

-- 10. User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id),
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies  
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personality_type text,
ADD COLUMN IF NOT EXISTS personality_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS growth_areas text[] DEFAULT '{}';

-- Create triggers for updated_at timestamps
CREATE OR REPLACE TRIGGER update_explorations_updated_at
  BEFORE UPDATE ON public.explorations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_exploration_sessions_updated_at
  BEFORE UPDATE ON public.exploration_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_balance_scores_updated_at
  BEFORE UPDATE ON public.user_balance_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_breathing_practices_updated_at
  BEFORE UPDATE ON public.breathing_practices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_breathing_progress_updated_at
  BEFORE UPDATE ON public.user_breathing_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_community_connections_updated_at
  BEFORE UPDATE ON public.community_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- Migration: 20250827150425_0dd5384e-e14f-4262-a994-9e5ba23a9f28.sql
-- =====================================

-- Create essential database functions for Newomen platform

-- 1. Function to save personality assessment
CREATE OR REPLACE FUNCTION public.save_personality_assessment(
  user_id_input uuid,
  answers_input jsonb,
  results_input jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  -- Insert assessment results
  INSERT INTO public.assessment_results (
    user_id,
    assessment_type,
    answers,
    results,
    completed_at
  ) VALUES (
    user_id_input,
    'personality',
    answers_input,
    results_input,
    now()
  ) RETURNING id INTO assessment_id;

  -- Award crystals for completing assessment
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + 50
  WHERE user_id = user_id_input;

  RETURN assessment_id;
END;
$$;

-- 2. Function to start exploration session
CREATE OR REPLACE FUNCTION public.start_exploration_session(
  exploration_id_input uuid,
  user_id_input uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Create new exploration session
  INSERT INTO public.exploration_sessions (
    user_id,
    exploration_id,
    status,
    current_question,
    user_answers
  ) VALUES (
    user_id_input,
    exploration_id_input,
    'in-progress',
    0,
    '[]'::jsonb
  ) RETURNING id INTO session_id;

  RETURN session_id;
END;
$$;

-- 3. Function to update exploration progress
CREATE OR REPLACE FUNCTION public.update_exploration_progress(
  session_id_input uuid,
  question_index_input integer,
  answer_input text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_answers jsonb;
BEGIN
  -- Get current answers
  SELECT user_answers INTO current_answers
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Add new answer to the array
  current_answers := current_answers || jsonb_build_array(answer_input);

  -- Update session
  UPDATE public.exploration_sessions
  SET 
    user_answers = current_answers,
    current_question = question_index_input + 1,
    updated_at = now()
  WHERE id = session_id_input;
END;
$$;

-- 4. Function to complete exploration session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(
  session_id_input uuid,
  final_analysis_input jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_val uuid;
  crystal_reward_val integer;
BEGIN
  -- Get user_id and crystal reward
  SELECT es.user_id, e.crystal_reward
  INTO user_id_val, crystal_reward_val
  FROM public.exploration_sessions es
  JOIN public.explorations e ON es.exploration_id = e.id
  WHERE es.id = session_id_input;

  -- Complete the session
  UPDATE public.exploration_sessions
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    crystals_earned = crystal_reward_val,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input;

  -- Award crystals
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_reward_val
  WHERE user_id = user_id_val;
END;
$$;

-- 5. Function to award crystals
CREATE OR REPLACE FUNCTION public.award_crystals(
  user_id_input uuid,
  crystal_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_amount
  WHERE user_id = user_id_input;
END;
$$;

-- 6. Create profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    display_name,
    email,
    crystals_count,
    level_progress,
    login_streak_count,
    subscription_tier,
    role,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    0,
    1,
    'free',
    'user',
    now()
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enhanced dashboard function with real data
CREATE OR REPLACE FUNCTION public.get_enhanced_dashboard_data(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  crystals_count integer,
  level_progress integer,
  subscription_tier text,
  personality_type text,
  growth_areas text[],
  completed_explorations bigint,
  total_breathing_minutes integer,
  current_streak integer,
  recent_achievements jsonb,
  next_milestone jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    COALESCE(p.crystals_count, 0) as crystals_count,
    COALESCE(p.level_progress, 0) as level_progress,
    COALESCE(p.subscription_tier, 'free') as subscription_tier,
    p.personality_type,
    COALESCE(p.growth_areas, '{}') as growth_areas,
    
    -- Count completed explorations
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM exploration_sessions es 
      WHERE es.user_id = p_user_id AND es.status = 'completed'
    ), 0) as completed_explorations,
    
    -- Total breathing practice minutes
    COALESCE((
      SELECT SUM(ubp.total_duration)::integer
      FROM user_breathing_progress ubp
      WHERE ubp.user_id = p_user_id
    ), 0) as total_breathing_minutes,
    
    -- Current login streak
    COALESCE(p.login_streak_count, 0) as current_streak,
    
    -- Recent achievements (last 3)
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'title', a.title,
          'crystal_reward', a.crystal_reward,
          'unlocked_at', ua.unlocked_at
        )
      )
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = p_user_id
      ORDER BY ua.unlocked_at DESC
      LIMIT 3
    ), '[]'::jsonb) as recent_achievements,
    
    -- Next milestone
    jsonb_build_object(
      'title', 'Level Up',
      'progress', COALESCE(p.crystals_count, 0) % 100,
      'target', 100,
      'description', 'Earn ' || (100 - (COALESCE(p.crystals_count, 0) % 100)) || ' more crystals to level up!'
    ) as next_milestone
    
  FROM profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

-- =====================================
-- Migration: 20250827150729_4526b14c-1732-482c-b941-56f775ae556e.sql
-- =====================================

-- Seed database with essential sample data for Newomen platform

-- 1. Add sample personality questions
INSERT INTO public.personality_questions (question_text, options, category, order_index) VALUES
('How do you typically recharge after a long day?', '["Reading or quiet activities", "Spending time with friends", "Physical exercise", "Creative pursuits"]', 'energy', 1),
('When facing a difficult decision, you usually:', '["Analyze all options carefully", "Trust your gut feeling", "Seek advice from others", "Research extensively"]', 'decision_making', 2),
('Your ideal weekend involves:', '["Planned activities and socializing", "Spontaneous adventures", "Quiet time at home", "Learning something new"]', 'lifestyle', 3),
('In relationships, you value most:', '["Deep emotional connection", "Shared interests and activities", "Independence and space", "Loyalty and commitment"]', 'relationships', 4),
('Your approach to personal growth is:', '["Setting specific goals", "Following your intuition", "Learning from others", "Trying new experiences"]', 'growth', 5),
('When you feel stressed, you typically:', '["Talk to someone about it", "Find a quiet space to think", "Engage in physical activity", "Distract yourself with activities"]', 'energy', 6),
('Your communication style is usually:', '["Direct and to the point", "Warm and encouraging", "Thoughtful and measured", "Enthusiastic and expressive"]', 'relationships', 7),
('You prefer to learn new things by:', '["Reading and research", "Hands-on experience", "Watching and observing", "Discussing with others"]', 'decision_making', 8),
('Your living space reflects:', '["Minimalism and order", "Comfort and warmth", "Creativity and inspiration", "Functionality above all"]', 'lifestyle', 9),
('When setting goals, you focus on:', '["Long-term vision", "Immediate actionable steps", "Emotional fulfillment", "Impact on others"]', 'growth', 10)
ON CONFLICT DO NOTHING;

-- 2. Add sample balance wheel areas
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) VALUES
('Career & Purpose', 'Your professional life, work satisfaction, and sense of purpose', 'Briefcase', '#3b82f6', 1),
('Health & Wellness', 'Physical health, energy levels, and overall well-being', 'Heart', '#ef4444', 2),
('Relationships & Love', 'Romantic relationships, family bonds, and social connections', 'Users', '#ec4899', 3),
('Personal Growth', 'Learning, self-development, and expanding your horizons', 'TrendingUp', '#8b5cf6', 4),
('Fun & Recreation', 'Hobbies, entertainment, and activities that bring you joy', 'Sparkles', '#f59e0b', 5),
('Money & Finances', 'Financial security, abundance, and money management', 'DollarSign', '#10b981', 6),
('Home & Environment', 'Your living space, surroundings, and physical environment', 'Home', '#6b7280', 7),
('Contribution & Service', 'Giving back, helping others, and making a positive impact', 'Gift', '#14b8a6', 8)
ON CONFLICT DO NOTHING;

-- 3. Add sample explorations
INSERT INTO public.explorations (title, description, category, difficulty_level, estimated_duration, crystal_reward, questions, facilitator_prompt, higher_self_prompt) VALUES
(
  'Discovering Your Inner Voice',
  'A gentle exploration to reconnect with your authentic self and inner wisdom.',
  'self-discovery',
  'beginner',
  30,
  150,
  '["What does your inner voice sound like to you?", "When do you feel most authentically yourself?", "What beliefs about yourself have you inherited from others?", "What would you do if you knew you couldn''t fail?", "How do you typically silence or ignore your inner voice?", "What does your inner voice want you to know right now?", "When have you trusted your intuition and been glad you did?", "What fears come up when you think about being truly authentic?", "How has your relationship with yourself changed over the years?", "What message does your authentic self want to share with the world?"]',
  'You are a gentle, supportive facilitator helping a woman explore her inner voice. Listen deeply to each answer with compassion. Acknowledge each response with brief, encouraging phrases like "Thank you for sharing that" or "I hear you" before moving to the next question. Your role is to create a safe, non-judgmental space.',
  'Now you are speaking as this woman''s Higher Self - her wisest, most loving inner voice. You have listened to all her answers with deep compassion. Provide a loving analysis that includes: **Core Pattern**: What you notice about how she relates to her authentic self. **Hidden Potential**: Gifts and strengths she may not fully recognize. **Actionable Steps**: 3 specific ways she can strengthen her connection to her inner voice. **Affirmations**: 2 powerful affirmations based on her responses. **Encouragement**: A loving message about her journey of self-discovery.'
),
(
  'Healing Your Relationship with Fear',
  'Transform your relationship with fear from enemy to ally through deep exploration.',
  'personal-growth',
  'intermediate',
  45,
  200,
  '["How does fear typically show up in your body?", "What fears have you carried since childhood?", "When has fear protected you, and when has it limited you?", "What would you attempt if fear wasn''t a factor?", "How do you usually react when fear arises?", "What stories does your fear tell you about yourself?", "When have you acted despite being afraid?", "What is fear trying to teach or protect in you?", "How would your life change if you had a healthier relationship with fear?", "What message of love would you give to your fearful self?"]',
  'You are a compassionate facilitator guiding someone through a deep exploration of fear. Hold space with warmth and understanding. Fear is a vulnerable topic, so respond to each answer with gentle acknowledgment before moving to the next question.',
  'Speaking as her Higher Self, you understand that fear is not her enemy but a messenger. Provide insights that include: **Core Pattern**: How she currently relates to and experiences fear. **Hidden Potential**: The courage and strength that lies beneath her fears. **Actionable Steps**: 3 practical ways to transform her relationship with fear. **Affirmations**: 2 courage-building affirmations. **Encouragement**: A message about how fear can become an ally in her growth journey.'
),
(
  'Exploring Your Relationship Patterns',
  'Uncover the unconscious patterns that shape your connections with others.',
  'relationships',
  'advanced',
  40,
  180,
  '["What patterns do you notice in your closest relationships?", "How did your family dynamics shape your view of relationships?", "What do you find yourself repeatedly attracting in partners or friends?", "When do you lose yourself in relationships, and when do you maintain your identity?", "What role do you typically play in relationships (caretaker, rebel, peacemaker, etc.)?", "How do you handle conflict and disagreement in relationships?", "What do you give in relationships, and what do you struggle to receive?", "What beliefs about love and connection did you learn early in life?", "When have you felt most seen and understood by another person?", "What would change in your relationships if you loved yourself more fully?"]',
  'You are facilitating a deep exploration of relationship patterns. This requires vulnerability, so create an atmosphere of complete safety and non-judgment. Acknowledge each response with compassion before continuing.',
  'As her Higher Self, you see the beautiful patterns and growth opportunities in her relationships. Provide loving insight including: **Core Pattern**: The primary relationship dynamic she recreates. **Hidden Potential**: Her capacity for deeper, more authentic connections. **Actionable Steps**: 3 ways to create healthier relationship patterns. **Affirmations**: 2 relationship-focused affirmations. **Encouragement**: A message about her worthiness of love and authentic connection.'
)
ON CONFLICT DO NOTHING;

-- 4. Add sample breathing practices
INSERT INTO public.breathing_practices (title, description, duration_minutes, difficulty_level, category, instructions) VALUES
(
  '4-7-8 Relaxation Breath',
  'A powerful technique to calm the nervous system and reduce anxiety.',
  5,
  1,
  'relaxation',
  '{"steps": ["Exhale completely through your mouth", "Close your mouth and inhale through your nose for 4 counts", "Hold your breath for 7 counts", "Exhale through your mouth for 8 counts", "Repeat for 4 cycles"], "benefits": ["Reduces anxiety", "Improves sleep", "Calms nervous system"]}'
),
(
  'Box Breathing for Focus',
  'Used by Navy SEALs, this technique enhances concentration and mental clarity.',
  10,
  2,
  'focus',
  '{"steps": ["Inhale for 4 counts", "Hold for 4 counts", "Exhale for 4 counts", "Hold empty for 4 counts", "Repeat for the full duration"], "benefits": ["Improves focus", "Reduces stress", "Enhances performance"]}'
),
(
  'Energizing Breath of Fire',
  'A dynamic breathing practice to boost energy and mental alertness.',
  8,
  3,
  'energy',
  '{"steps": ["Sit with straight spine", "Breathe rapidly through the nose", "Focus on sharp exhales, let inhales happen naturally", "Keep the rhythm steady and powerful", "Rest and breathe normally between rounds"], "benefits": ["Increases energy", "Boosts metabolism", "Enhances mental clarity"]}'
),
(
  'Heart Coherence Breathing',
  'Synchronize your heart, mind, and emotions for optimal well-being.',
  12,
  2,
  'relaxation',
  '{"steps": ["Place hand on heart", "Breathe slowly and deeply", "Inhale for 5 counts, exhale for 5 counts", "Focus on feelings of gratitude or appreciation", "Maintain smooth, rhythmic breathing"], "benefits": ["Improves heart rate variability", "Reduces stress hormones", "Enhances emotional balance"]}'
)
ON CONFLICT DO NOTHING;

-- 5. Add sample achievements
INSERT INTO public.achievements (title, description, icon, crystal_reward, unlock_criteria) VALUES
('First Steps', 'Completed your first personality assessment', 'Award', 50, '{"type": "assessment_completed", "assessment_type": "personality"}'),
('Self Discoverer', 'Completed your first themed exploration', 'Star', 100, '{"type": "exploration_completed", "count": 1}'),
('Inner Wisdom Seeker', 'Completed 5 themed explorations', 'Crown', 250, '{"type": "exploration_completed", "count": 5}'),
('Breath Master', 'Practiced breathing exercises for 60 minutes total', 'Wind', 75, '{"type": "breathing_total_minutes", "minutes": 60}'),
('Community Builder', 'Made your first community connection', 'Users', 50, '{"type": "community_connection", "count": 1}'),
('Balance Seeker', 'Completed your life balance wheel assessment', 'Target', 75, '{"type": "balance_wheel_completed"}'),
('Consistent Practitioner', 'Used the app for 7 consecutive days', 'Calendar', 150, '{"type": "login_streak", "days": 7}'),
('Crystal Collector', 'Earned your first 500 crystals', 'Gem', 100, '{"type": "crystals_earned", "amount": 500}'),
('Voice of Wisdom', 'Had 10 voice conversations with NewMe', 'MessageSquare', 125, '{"type": "voice_conversations", "count": 10}'),
('Growth Catalyst', 'Completed explorations in 3 different categories', 'TrendingUp', 200, '{"type": "exploration_categories", "categories": 3}')
ON CONFLICT DO NOTHING;

-- 6. Enable RLS on missing tables
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for public content
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage AI providers" ON public.ai_providers
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage admin AI providers" ON public.admin_ai_providers
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage training sessions" ON public.training_sessions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (is_admin(auth.uid()));

-- Update policies to require authentication for user-specific actions
DROP POLICY IF EXISTS "Users can manage their own assessment progress" ON public.assessment_progress;
CREATE POLICY "Authenticated users can manage their own assessment progress" ON public.assessment_progress
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Authenticated users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own connections" ON public.community_connections;
CREATE POLICY "Authenticated users can manage their own connections" ON public.community_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- =====================================
-- Migration: 20250827152424_23d568b4-be26-4384-bf78-eff2a1481469.sql
-- =====================================

-- Regenerate types - no changes needed, just trigger type regeneration

-- =====================================
-- Migration: 20250827152504_1908e854-2112-4829-bbac-f7fadbb98b71.sql
-- =====================================

-- Fix critical RLS security issues
-- Enable RLS on tables that are missing it

-- ai_providers table
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for ai_providers
CREATE POLICY "Admins can manage AI providers"
ON public.ai_providers
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- training_sessions table
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for training_sessions
CREATE POLICY "Admins can manage training sessions"
ON public.training_sessions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "System can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true); -- This allows the trigger to create profiles

-- admin_ai_providers table
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_ai_providers
CREATE POLICY "Admins can manage admin AI providers"
ON public.admin_ai_providers
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update roles
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate role
  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_subscription_secure(target_user_id uuid, new_tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update subscriptions
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate tier
  IF new_tier NOT IN ('free', 'discovery', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
  END IF;

  -- Update the subscription tier
  UPDATE public.profiles 
  SET subscription_tier = new_tier, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

-- =====================================
-- Migration: 20250827153916_531e59ac-90c3-4e56-8f72-ce1d8793a8d5.sql
-- =====================================

-- Fix security_audit_log table structure
ALTER TABLE security_audit_log 
DROP COLUMN IF EXISTS resource_type,
DROP COLUMN IF EXISTS resource_id;

-- Add missing columns for proper audit logging
ALTER TABLE security_audit_log 
ADD COLUMN IF NOT EXISTS resource TEXT,
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS status_code INTEGER DEFAULT 200;

-- =====================================
-- Migration: 20250828024601_05cd3b36-fc8a-422d-affc-8a72f455e743.sql
-- =====================================

-- Create missing tables for complete functionality

-- User balance scores table
CREATE TABLE IF NOT EXISTS public.user_balance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Enable RLS
ALTER TABLE public.user_balance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_balance_scores
CREATE POLICY "Users can manage their own balance scores" 
ON public.user_balance_scores 
FOR ALL 
USING (auth.uid() = user_id);

-- Daily insights table for personalized content
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'inspiration',
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, generated_date)
);

-- Enable RLS
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_insights
CREATE POLICY "Users can view their own insights" 
ON public.daily_insights 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create insights" 
ON public.daily_insights 
FOR INSERT 
WITH CHECK (true);

-- Messages table for chat history
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.conversations 
FOR ALL 
USING (auth.uid() = user_id);

-- Add updated_at trigger for user_balance_scores
CREATE TRIGGER update_user_balance_scores_updated_at
  BEFORE UPDATE ON public.user_balance_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed some initial balance wheel areas if none exist
INSERT INTO public.balance_wheel_areas (name, description, icon, color, order_index) 
VALUES 
  ('Career & Work', 'Professional fulfillment and career growth', 'Briefcase', '#3b82f6', 1),
  ('Health & Fitness', 'Physical health, energy, and vitality', 'Heart', '#ef4444', 2),
  ('Relationships', 'Family, friends, and romantic connections', 'Users', '#ec4899', 3),
  ('Personal Growth', 'Learning, self-development, and spirituality', 'TrendingUp', '#8b5cf6', 4),
  ('Fun & Recreation', 'Hobbies, entertainment, and relaxation', 'Star', '#f59e0b', 5),
  ('Money & Finances', 'Financial security and wealth building', 'DollarSign', '#10b981', 6),
  ('Physical Environment', 'Home, workspace, and surroundings', 'Home', '#06b6d4', 7),
  ('Contribution & Impact', 'Making a difference and giving back', 'Globe', '#84cc16', 8)
ON CONFLICT (name) DO NOTHING;

-- Seed some initial breathing practices
INSERT INTO public.breathing_practices (title, description, duration_minutes, difficulty_level, category, instructions)
VALUES 
  ('4-7-8 Relaxation', 'A calming breath technique to reduce stress and promote relaxation', 5, 1, 'relaxation', '{"pattern": "4-7-8", "instructions": "Inhale for 4, hold for 7, exhale for 8"}'),
  ('Box Breathing', 'Equal-count breathing for focus and balance', 10, 2, 'focus', '{"pattern": "4-4-4-4", "instructions": "Inhale, hold, exhale, hold - all for equal counts"}'),
  ('Energizing Breath', 'Quick breathing technique to boost energy and alertness', 3, 2, 'energy', '{"pattern": "rapid", "instructions": "Quick, rhythmic breathing to energize"}'),
  ('Deep Belly Breathing', 'Fundamental diaphragmatic breathing for beginners', 8, 1, 'relaxation', '{"pattern": "deep", "instructions": "Breathe deeply into your belly, not your chest"}'),
  ('Alternate Nostril', 'Balancing breath technique for mental clarity', 15, 3, 'focus', '{"pattern": "alternating", "instructions": "Use thumb and finger to alternate breathing through each nostril"}'
  )
ON CONFLICT (title) DO NOTHING;

-- Seed some initial explorations
INSERT INTO public.explorations (title, description, category, difficulty_level, estimated_duration, crystal_reward, facilitator_prompt, higher_self_prompt, questions, analysis_structure)
VALUES 
  (
    'Shadow Self Discovery', 
    'Explore the hidden aspects of your personality that you may have suppressed or denied', 
    'self-discovery', 
    'intermediate', 
    45, 
    150,
    'You are a gentle, non-judgmental facilitator helping someone explore their shadow self. Simply acknowledge each answer with brief, supportive responses like "I hear you" or "Thank you for sharing" and move to the next question.',
    'You are speaking as the user''s Higher Self - the wise, loving, and all-knowing aspect of their being. Provide deep, compassionate insights about their shadow self based on their answers. Structure your response with: Core Pattern, Shadow Gifts, Integration Steps, and Affirmation.',
    '["What qualities in others trigger the strongest negative reactions in you?", "Describe a time when you acted in a way that surprised or disappointed you.", "What aspects of yourself do you try hardest to hide from others?", "When do you feel most ashamed or embarrassed about yourself?", "What would people be shocked to discover about your inner thoughts?", "Describe your biggest fears about being truly seen by others.", "What parts of yourself do you judge most harshly?", "When have you been envious or resentful, and what did that reveal?", "What do you do when no one is watching that you wouldn''t want others to know?", "If you could change one thing about your personality, what would it be and why?"]',
    '{"sections": ["Core Pattern", "Shadow Gifts", "Integration Steps", "Affirmation"]}'
  ),
  (
    'Relationship Patterns', 
    'Uncover the unconscious patterns that shape your connections with others', 
    'relationships', 
    'beginner', 
    30, 
    100,
    'You are a compassionate relationship guide. Listen to each answer about their relationships with warmth and understanding. Keep responses brief and encouraging, then move to the next question.',
    'As their Higher Self, lovingly reveal the relationship patterns you see. Offer wisdom about their connection style, needs, and growth opportunities. Structure your insights as: Relationship Pattern, Core Needs, Growth Edge, and Loving Guidance.',
    '["How do you typically behave when you first meet someone new?", "Describe your closest relationship - what makes it work?", "What do you tend to do when someone disappoints you?", "How do you express love and affection to others?", "What makes you feel most loved and appreciated?", "Describe a relationship conflict that keeps repeating in your life.", "What do you fear most about being vulnerable with someone?", "How do you handle it when someone needs space from you?", "What relationship advice do you find yourself giving others repeatedly?", "If you could heal one thing about how you relate to others, what would it be?"]',
    '{"sections": ["Relationship Pattern", "Core Needs", "Growth Edge", "Loving Guidance"]}'
  ),
  (
    'Inner Child Healing', 
    'Connect with and heal the wounded aspects of your younger self', 
    'personal-growth', 
    'advanced', 
    50, 
    200,
    'You are a nurturing inner child therapist. Create a safe space for them to explore childhood memories and feelings. Respond with gentle validation and move sensitively through each question.',
    'Speaking as their wise, protective Higher Self, offer deep healing insights about their inner child. Provide compassionate understanding of their childhood experiences and guidance for integration. Structure as: Inner Child Wisdom, Healing Message, Reparenting Guidance, and Inner Child Affirmation.',
    '["What did you most need to hear as a child that you never heard?", "Describe a vivid childhood memory that still affects you today.", "What did you believe about yourself as a young child?", "How did your family express or not express emotions?", "What did you do as a child when you felt scared or alone?", "What childhood dreams or desires did you have to give up?", "How did you learn what love looked like in your early years?", "What would you want to tell your younger self right now?", "What childhood experiences still trigger you as an adult?", "If your inner child could speak freely, what would they say?"]',
    '{"sections": ["Inner Child Wisdom", "Healing Message", "Reparenting Guidance", "Inner Child Affirmation"]}'
  )
ON CONFLICT (title) DO NOTHING;

-- Create function to generate daily insights
CREATE OR REPLACE FUNCTION generate_daily_insight(user_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  insight_text TEXT;
  insights TEXT[] := ARRAY[
    'The journey of self-discovery is not about finding yourself, but creating yourself.',
    'Your greatest strength often lies hidden within your greatest challenge.',
    'Healing happens in the space between accepting what is and believing in what could be.',
    'The relationship you have with yourself sets the tone for every other relationship.',
    'Growth requires both the courage to look within and the compassion to love what you find.',
    'Your intuition is your inner compass—trust it to guide you home to yourself.',
    'Every emotion is a messenger bringing you valuable information about your needs.',
    'The parts of yourself you try to hide often contain your greatest gifts.',
    'Self-love is not a destination but a practice—be patient with your journey.',
    'You have within you right now everything you need to take the next step forward.'
  ];
BEGIN
  -- Select a random insight
  insight_text := insights[floor(random() * array_length(insights, 1)) + 1];
  
  -- Insert or update today's insight
  INSERT INTO public.daily_insights (user_id, insight_text, generated_date)
  VALUES (user_id_input, insight_text, CURRENT_DATE)
  ON CONFLICT (user_id, generated_date) 
  DO UPDATE SET insight_text = EXCLUDED.insight_text;
  
  RETURN insight_text;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_balance_scores_user_id ON public.user_balance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON public.daily_insights(user_id, generated_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- =====================================
-- Migration: 20250828025919_7915ad69-219e-4f65-9556-bfde3da8e41e.sql
-- =====================================

-- Fix infinite recursion in user_conversation_participants policy
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.user_conversation_participants;

-- Create proper policies for user_conversation_participants
CREATE POLICY "Users can view their own participation" 
ON public.user_conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participation" 
ON public.user_conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.user_conversation_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation" 
ON public.user_conversation_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also fix user_conversations policies to avoid recursion
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.user_conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.user_conversations 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create conversations" 
ON public.user_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own conversations" 
ON public.user_conversations 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own conversations" 
ON public.user_conversations 
FOR DELETE 
USING (auth.uid() = created_by);

-- =====================================
-- Migration: 20250828030127_35de95b9-1f8a-4c7d-89fd-5855d61bcfa1.sql
-- =====================================

-- Fix user_conversations table structure and policies
-- First check the correct column name for the user_conversations table
-- Fix policies based on actual table structure

DROP POLICY IF EXISTS "user_conversations_select_policy" ON public.user_conversations;
DROP POLICY IF EXISTS "user_conversations_insert_policy" ON public.user_conversations;
DROP POLICY IF EXISTS "user_conversation_participants_select_policy" ON public.user_conversation_participants;
DROP POLICY IF EXISTS "user_conversation_participants_insert_policy" ON public.user_conversation_participants;

-- Create proper policies for user_conversations
CREATE POLICY "Users can view conversations they participate in" 
ON public.user_conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_conversation_participants 
  WHERE conversation_id = user_conversations.id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create conversations" 
ON public.user_conversations 
FOR INSERT 
WITH CHECK (true);

-- Create proper policies for user_conversation_participants
CREATE POLICY "Users can view participants of their conversations" 
ON public.user_conversation_participants 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_conversation_participants p2 
  WHERE p2.conversation_id = user_conversation_participants.conversation_id 
  AND p2.user_id = auth.uid()
));

CREATE POLICY "Users can join conversations" 
ON public.user_conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- =====================================
-- Migration: 20250828051944_8409ec87-92c2-4c81-a996-036b0b25255a.sql
-- =====================================

-- Create community posts table for social features
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general',
    visibility TEXT NOT NULL DEFAULT 'public',
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    is_reported BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table for gamification
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL DEFAULT 'daily',
    difficulty_level TEXT NOT NULL DEFAULT 'beginner',
    duration_days INTEGER NOT NULL DEFAULT 7,
    crystal_reward INTEGER NOT NULL DEFAULT 100,
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user levels table for progression system
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    level_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    crystal_requirement INTEGER NOT NULL DEFAULT 100,
    rewards JSONB DEFAULT '{}',
    unlocks TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(level_number)
);

-- Create user challenge progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, challenge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Community posts policies
CREATE POLICY "Users can view public posts" ON public.community_posts
FOR SELECT USING (visibility = 'public' AND is_approved = true);

CREATE POLICY "Users can create their own posts" ON public.community_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.community_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.community_posts
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts" ON public.community_posts
FOR ALL USING (is_admin(auth.uid()));

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.challenges
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
FOR ALL USING (is_admin(auth.uid()));

-- User levels policies
CREATE POLICY "Anyone can view active levels" ON public.user_levels
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage levels" ON public.user_levels
FOR ALL USING (is_admin(auth.uid()));

-- User challenge progress policies
CREATE POLICY "Users can view their own progress" ON public.user_challenge_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.user_challenge_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_challenge_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_challenge_progress
FOR SELECT USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON public.challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_levels_updated_at
    BEFORE UPDATE ON public.user_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_challenge_progress_updated_at
    BEFORE UPDATE ON public.user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================
-- Migration: 20250830113333_512dd2ed-43fa-4841-b4cb-f5ecf618a96b.sql
-- =====================================

-- Create community_posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general',
  visibility TEXT NOT NULL DEFAULT 'public',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view approved public posts" 
ON public.community_posts 
FOR SELECT 
USING (is_approved = true AND visibility = 'public');

CREATE POLICY "Users can create their own posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts" 
ON public.community_posts 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX idx_community_posts_is_approved ON public.community_posts(is_approved);
CREATE INDEX idx_community_posts_visibility ON public.community_posts(visibility);

-- =====================================
-- Migration: 20250830115447_fd39d14c-f640-42a0-98b5-ad4d6508e3e7.sql
-- =====================================

-- Remove SECURITY DEFINER from functions that don't need it and can rely on RLS

-- 1. get_dashboard_data - just queries dashboard_view, doesn't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id uuid)
 RETURNS TABLE(user_id uuid, personality_completed boolean, personality_progress integer, personality_last_activity timestamp with time zone, values_completed boolean, values_progress integer, values_last_activity timestamp with time zone, exploration_completed boolean, exploration_progress integer, exploration_last_activity timestamp with time zone, overall_progress numeric, next_step_title text, next_step_description text, next_step_cta text, next_step_link text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only allow users to query their own data
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Access denied: Can only query your own dashboard data';
    END IF;

    RETURN QUERY
    SELECT
        dv.user_id,
        dv.personality_completed,
        dv.personality_progress,
        dv.personality_last_activity,
        dv.values_completed,
        dv.values_progress,
        dv.values_last_activity,
        dv.exploration_completed,
        dv.exploration_progress,
        dv.exploration_last_activity,
        dv.overall_progress,
        dv.next_step_title,
        dv.next_step_description,
        dv.next_step_cta,
        dv.next_step_link
    FROM dashboard_view dv
    WHERE dv.user_id = p_user_id;
END;
$function$;

-- 2. get_enhanced_dashboard_data - queries user's own data, can rely on RLS
CREATE OR REPLACE FUNCTION public.get_enhanced_dashboard_data(p_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, crystals_count integer, level_progress integer, subscription_tier text, personality_type text, growth_areas text[], completed_explorations bigint, total_breathing_minutes integer, current_streak integer, recent_achievements jsonb, next_milestone jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to query their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only query your own dashboard data';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    COALESCE(p.crystals_count, 0) as crystals_count,
    COALESCE(p.level_progress, 0) as level_progress,
    COALESCE(p.subscription_tier, 'free') as subscription_tier,
    p.personality_type,
    COALESCE(p.growth_areas, '{}') as growth_areas,
    
    -- Count completed explorations
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM exploration_sessions es 
      WHERE es.user_id = p_user_id AND es.status = 'completed'
    ), 0) as completed_explorations,
    
    -- Total breathing practice minutes
    COALESCE((
      SELECT SUM(ubp.total_duration)::integer
      FROM user_breathing_progress ubp
      WHERE ubp.user_id = p_user_id
    ), 0) as total_breathing_minutes,
    
    -- Current login streak
    COALESCE(p.login_streak_count, 0) as current_streak,
    
    -- Recent achievements (last 3)
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'title', a.title,
          'crystal_reward', a.crystal_reward,
          'unlocked_at', ua.unlocked_at
        )
      )
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = p_user_id
      ORDER BY ua.unlocked_at DESC
      LIMIT 3
    ), '[]'::jsonb) as recent_achievements,
    
    -- Next milestone
    jsonb_build_object(
      'title', 'Level Up',
      'progress', COALESCE(p.crystals_count, 0) % 100,
      'target', 100,
      'description', 'Earn ' || (100 - (COALESCE(p.crystals_count, 0) % 100)) || ' more crystals to level up!'
    ) as next_milestone
    
  FROM profiles p
  WHERE p.user_id = p_user_id;
END;
$function$;

-- 3. save_personality_assessment - can rely on RLS since it's inserting user's own data
CREATE OR REPLACE FUNCTION public.save_personality_assessment(user_id_input uuid, answers_input jsonb, results_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  assessment_id uuid;
BEGIN
  -- Only allow users to save their own assessments
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only save your own assessment results';
  END IF;

  -- Insert assessment results
  INSERT INTO public.assessment_results (
    user_id,
    assessment_type,
    answers,
    results,
    completed_at
  ) VALUES (
    user_id_input,
    'personality',
    answers_input,
    results_input,
    now()
  ) RETURNING id INTO assessment_id;

  -- Award crystals for completing assessment
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + 50
  WHERE user_id = user_id_input;

  RETURN assessment_id;
END;
$function$;

-- 4. start_exploration_session - can rely on RLS since it's creating user's own session
CREATE OR REPLACE FUNCTION public.start_exploration_session(exploration_id_input uuid, user_id_input uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  session_id uuid;
BEGIN
  -- Only allow users to start their own sessions
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only start your own exploration sessions';
  END IF;

  -- Create new exploration session
  INSERT INTO public.exploration_sessions (
    user_id,
    exploration_id,
    status,
    current_question,
    user_answers
  ) VALUES (
    user_id_input,
    exploration_id_input,
    'in-progress',
    0,
    '[]'::jsonb
  ) RETURNING id INTO session_id;

  RETURN session_id;
END;
$function$;

-- 5. update_exploration_progress - can rely on RLS since it's updating user's own session
CREATE OR REPLACE FUNCTION public.update_exploration_progress(session_id_input uuid, question_index_input integer, answer_input text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  current_answers jsonb;
  session_user_id uuid;
BEGIN
  -- Get the session's user_id to verify ownership
  SELECT user_id INTO session_user_id
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Only allow users to update their own sessions
  IF auth.uid() != session_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only update your own exploration sessions';
  END IF;

  -- Get current answers
  SELECT user_answers INTO current_answers
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Add new answer to the array
  current_answers := current_answers || jsonb_build_array(answer_input);

  -- Update session
  UPDATE public.exploration_sessions
  SET 
    user_answers = current_answers,
    current_question = question_index_input + 1,
    updated_at = now()
  WHERE id = session_id_input;
END;
$function$;

-- =====================================
-- Migration: 20250830115539_c8d1ccdd-2647-49a5-8d6e-4edb95e7774f.sql
-- =====================================

-- Remove SECURITY DEFINER from remaining functions that don't need it

-- 1. award_crystals - can rely on RLS since it's updating user's own profile
CREATE OR REPLACE FUNCTION public.award_crystals(user_id_input uuid, crystal_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to award crystals to themselves (this would typically be called by the system)
  -- Or allow if called by a SECURITY DEFINER function (auth.uid() would be null in that case)
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Access denied: Can only award crystals to yourself';
  END IF;

  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_amount
  WHERE user_id = user_id_input;
END;
$function$;

-- 2. complete_exploration_session - can rely on RLS since it's updating user's own session
CREATE OR REPLACE FUNCTION public.complete_exploration_session(session_id_input uuid, final_analysis_input jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  user_id_val uuid;
  crystal_reward_val integer;
  session_user_id uuid;
BEGIN
  -- Get the session's user_id to verify ownership
  SELECT user_id INTO session_user_id
  FROM public.exploration_sessions
  WHERE id = session_id_input;

  -- Only allow users to complete their own sessions
  IF auth.uid() IS NOT NULL AND auth.uid() != session_user_id THEN
    RAISE EXCEPTION 'Access denied: Can only complete your own exploration sessions';
  END IF;

  -- Get user_id and crystal reward
  SELECT es.user_id, e.crystal_reward
  INTO user_id_val, crystal_reward_val
  FROM public.exploration_sessions es
  JOIN public.explorations e ON es.exploration_id = e.id
  WHERE es.id = session_id_input;

  -- Complete the session
  UPDATE public.exploration_sessions
  SET 
    status = 'completed',
    final_analysis = final_analysis_input,
    crystals_earned = crystal_reward_val,
    completed_at = now(),
    updated_at = now()
  WHERE id = session_id_input;

  -- Award crystals
  UPDATE public.profiles 
  SET crystals_count = COALESCE(crystals_count, 0) + crystal_reward_val
  WHERE user_id = user_id_val;
END;
$function$;

-- =====================================
-- Migration: 20250830123945_add_increment_post_likes_function.sql
-- =====================================

-- Function to increment likes count for community posts
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user has already liked this post (you might want to add a likes table later)
  -- For now, just increment the count
  UPDATE public.community_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$function$;

-- =====================================
-- Migration: 20250830133715_add_challenge_analytics_columns.sql
-- =====================================

-- Add analytics columns to challenges table for tracking engagement
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_completions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_completion_time_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- Add analytics columns to user_levels table
ALTER TABLE public.user_levels 
ADD COLUMN IF NOT EXISTS users_at_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_users_achieved INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_time_to_reach_hours DECIMAL(8,2);

-- Create function to update challenge analytics
CREATE OR REPLACE FUNCTION public.update_challenge_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update participant count
    UPDATE public.challenges 
    SET participant_count = (
        SELECT COUNT(DISTINCT user_id) 
        FROM public.user_challenge_progress 
        WHERE challenge_id = NEW.challenge_id
    )
    WHERE id = NEW.challenge_id;

    -- Update completion rate and total completions
    UPDATE public.challenges 
    SET 
        total_completions = (
            SELECT COUNT(*) 
            FROM public.user_challenge_progress 
            WHERE challenge_id = NEW.challenge_id 
            AND status = 'completed'
        ),
        completion_rate = (
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
                END
            FROM public.user_challenge_progress 
            WHERE challenge_id = NEW.challenge_id
        )
    WHERE id = NEW.challenge_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update analytics when challenge progress changes
CREATE TRIGGER update_challenge_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_analytics();

-- Create function to update level analytics
CREATE OR REPLACE FUNCTION public.update_level_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update users at current level
    UPDATE public.user_levels 
    SET users_at_level = (
        SELECT COUNT(*) 
        FROM public.user_stats 
        WHERE level = NEW.level_number
    )
    WHERE level_number = NEW.level_number;

    -- Update total users achieved
    UPDATE public.user_levels 
    SET total_users_achieved = (
        SELECT COUNT(*) 
        FROM public.user_stats 
        WHERE level >= NEW.level_number
    )
    WHERE level_number = NEW.level_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level analytics when user stats change
CREATE TRIGGER update_level_analytics_trigger
    AFTER INSERT OR UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_level_analytics();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge_id ON public.user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_status ON public.user_challenge_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level);


-- =====================================
-- Migration: 20250830140000_comprehensive_assessment_system.sql
-- =====================================

-- Comprehensive Assessment, Quiz, and Test System
-- This migration creates a complete system for assessments, quizzes, and tests
-- Supports both visitor (public) and user assessments

-- Assessment Types Table
CREATE TABLE IF NOT EXISTS public.assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('personality', 'wellness', 'career', 'relationships', 'growth', 'spirituality', 'skills', 'lifestyle')),
    is_public BOOLEAN NOT NULL DEFAULT false, -- true for visitor assessments
    requires_signup BOOLEAN NOT NULL DEFAULT true,
    estimated_duration INTEGER NOT NULL DEFAULT 10, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Questions Table (reusable across assessments)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'scale', 'text', 'boolean', 'multi_select')),
    category TEXT,
    subcategory TEXT,
    tags TEXT[], -- for filtering and organization
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Question Options Table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    value TEXT NOT NULL, -- for scoring/analysis
    order_index INTEGER DEFAULT 0,
    score_weights JSONB DEFAULT '{}', -- weights for different personality traits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assessment_type_id UUID NOT NULL REFERENCES public.assessment_types(id) ON DELETE CASCADE,
    instructions TEXT,
    is_published BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- visitor accessible
    scoring_algorithm TEXT NOT NULL CHECK (scoring_algorithm IN ('personality_weights', 'simple_sum', 'weighted_average', 'custom')),
    scoring_config JSONB DEFAULT '{}',
    result_templates JSONB DEFAULT '{}', -- templates for different result types
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assessment Questions Junction Table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    weight DECIMAL(3,2) DEFAULT 1.0, -- question importance weight
    conditional_logic JSONB DEFAULT '{}', -- show/hide logic based on previous answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assessment_id, question_id)
);

-- Assessment Responses Table (for completed assessments)
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- NULL for visitor responses
    visitor_session_id TEXT, -- for tracking visitor responses
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    total_score DECIMAL(5,2),
    result_type TEXT,
    result_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}', -- additional tracking data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Individual Question Responses
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_response_id UUID NOT NULL REFERENCES public.assessment_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    response_text TEXT,
    response_value TEXT,
    selected_options UUID[], -- for multi-select questions
    score DECIMAL(5,2),
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assessment_response_id, question_id)
);

-- Quiz-specific tables for interactive learning
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_public BOOLEAN DEFAULT false,
    time_limit_minutes INTEGER,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    max_attempts INTEGER DEFAULT 3,
    show_correct_answers BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching')),
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Question Options
CREATE TABLE IF NOT EXISTS public.quiz_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    visitor_session_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT false,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_taken_seconds INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(quiz_attempt_id, quiz_question_id)
);

-- AI-Generated Content Templates (for admin builders)
CREATE TABLE IF NOT EXISTS public.ai_content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('assessment', 'quiz', 'exploration', 'course')),
    category TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    output_schema JSONB NOT NULL,
    default_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Generation History (track what admins have generated)
CREATE TABLE IF NOT EXISTS public.ai_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.ai_content_templates(id),
    topic TEXT NOT NULL,
    additional_context TEXT,
    generated_content JSONB NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;

-- Public read policies (for published/public content)
CREATE POLICY "Public assessments are viewable by everyone" ON public.assessments
    FOR SELECT USING (is_public = true AND is_published = true);

CREATE POLICY "Public quizzes are viewable by everyone" ON public.quizzes
    FOR SELECT USING (is_public = true);

-- User policies
CREATE POLICY "Users can view their own responses" ON public.assessment_responses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create responses" ON public.assessment_responses
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own responses" ON public.assessment_responses
    FOR UPDATE USING (user_id = auth.uid());

-- Admin policies (you'll need to adjust based on your admin role system)
CREATE POLICY "Authenticated users can view assessment types" ON public.assessment_types
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view questions" ON public.questions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view question options" ON public.question_options
    FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(assessment_type_id);
CREATE INDEX IF NOT EXISTS idx_assessments_public ON public.assessments(is_public, is_published);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON public.assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_status ON public.assessment_responses(status);
CREATE INDEX IF NOT EXISTS idx_question_responses_assessment ON public.question_responses(assessment_response_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION public.calculate_assessment_analytics(assessment_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_responses', COUNT(*),
        'completed_responses', COUNT(*) FILTER (WHERE status = 'completed'),
        'completion_rate', 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::decimal / COUNT(*)) * 100, 2)
            END,
        'average_score', ROUND(AVG(total_score), 2),
        'average_completion_time', 
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 2)
    )
    INTO result
    FROM public.assessment_responses
    WHERE assessment_id = assessment_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update response timestamps
CREATE OR REPLACE FUNCTION public.update_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_assessment_responses_timestamp
    BEFORE UPDATE ON public.assessment_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_response_timestamp();

-- Function to generate visitor session ID
CREATE OR REPLACE FUNCTION public.generate_visitor_session()
RETURNS TEXT AS $$
BEGIN
    RETURN 'visitor_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.assessment_types IS 'Different types of assessments (personality, wellness, career, etc.)';
COMMENT ON TABLE public.assessments IS 'Individual assessment instances with questions and scoring';
COMMENT ON TABLE public.assessment_responses IS 'User responses to assessments, including visitor responses';
COMMENT ON TABLE public.quizzes IS 'Educational quizzes with scoring and time limits';
COMMENT ON TABLE public.ai_content_templates IS 'Templates for AI-generated content creation';


-- =====================================
-- Migration: 20250830140001_initial_assessment_data.sql
-- =====================================

-- Insert Assessment Types
INSERT INTO public.assessment_types (name, description, category, is_public, requires_signup, estimated_duration) VALUES
-- Public Assessments (no signup required)
('Personality Discovery', 'Discover your core personality type and understand your natural strengths and tendencies.', 'personality', true, false, 15),
('Wellness Check', 'Assess your current wellness levels across mental, physical, and emotional dimensions.', 'wellness', true, false, 10),
('Relationship Style', 'Understand your attachment style and relationship patterns.', 'relationships', true, false, 12),
('Career Alignment', 'Explore how well your current path aligns with your values and interests.', 'career', true, false, 18),
('Stress & Resilience', 'Evaluate your stress levels and discover your resilience strengths.', 'wellness', true, false, 8),
('Life Balance', 'Assess balance across different life areas and identify improvement opportunities.', 'lifestyle', true, false, 10),

-- User-only Assessments (require signup)
('Deep Personality Analysis', 'Comprehensive personality assessment with detailed insights and growth recommendations.', 'personality', false, true, 25),
('Spiritual Journey', 'Explore your spiritual beliefs, practices, and growth areas.', 'spirituality', false, true, 20),
('Leadership Style', 'Discover your natural leadership approach and development areas.', 'career', false, true, 15),
('Emotional Intelligence', 'Assess your emotional awareness and interpersonal skills.', 'growth', false, true, 22),
('Communication Patterns', 'Understand your communication style and effectiveness.', 'relationships', false, true, 18),
('Life Purpose Clarity', 'Deep dive into your life purpose and meaningful goals.', 'growth', false, true, 30),
('Creativity Assessment', 'Explore your creative strengths and untapped potential.', 'skills', false, true, 15),
('Values Alignment', 'Identify your core values and how they guide your decisions.', 'growth', false, true, 20),
('Conflict Resolution Style', 'Understand how you handle conflict and challenging situations.', 'relationships', false, true, 16),
('Work-Life Integration', 'Assess how well you integrate work and personal life.', 'lifestyle', false, true, 14),
('Financial Mindset', 'Explore your relationship with money and financial goals.', 'lifestyle', false, true, 12),
('Health & Vitality', 'Comprehensive assessment of your physical and mental health habits.', 'wellness', false, true, 25),
('Learning Style', 'Discover how you best absorb and process new information.', 'skills', false, true, 12),
('Social Confidence', 'Assess your comfort and skills in social situations.', 'relationships', false, true, 15),
('Goal Achievement', 'Evaluate your goal-setting and achievement patterns.', 'growth', false, true, 18),
('Intuition & Decision Making', 'Explore how you make decisions and trust your intuition.', 'growth', false, true, 16),
('Boundary Setting', 'Assess your ability to set and maintain healthy boundaries.', 'relationships', false, true, 14),
('Mindfulness Practice', 'Evaluate your present-moment awareness and mindfulness skills.', 'spirituality', false, true, 10),
('Change Adaptability', 'Understand how you handle change and uncertainty.', 'growth', false, true, 13),
('Self-Compassion', 'Assess how kindly you treat yourself during difficult times.', 'wellness', false, true, 15);

-- Insert sample questions for Personality Discovery (public assessment)
WITH personality_assessment AS (
  SELECT id FROM public.assessment_types WHERE name = 'Personality Discovery'
),
new_assessment AS (
  INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config)
  SELECT 
    'Discover Your Personality Type',
    'A comprehensive personality assessment to help you understand your natural tendencies, strengths, and growth areas.',
    id,
    true,
    true,
    'personality_weights',
    '{"personality_types": ["extrovert", "introvert", "thinking", "feeling", "judging", "perceiving", "sensing", "intuitive"], "score_ranges": {"low": [0, 33], "medium": [34, 66], "high": [67, 100]}}'
  FROM personality_assessment
  RETURNING id
)
INSERT INTO public.questions (text, type, category, tags) VALUES
('Where do you typically gain energy and feel most refreshed?', 'multiple_choice', 'energy_source', ARRAY['extroversion', 'introversion']),
('When making important decisions, what do you rely on most?', 'multiple_choice', 'decision_making', ARRAY['thinking', 'feeling']),
('How do you prefer to approach new projects or tasks?', 'multiple_choice', 'work_style', ARRAY['judging', 'perceiving']),
('What type of information do you notice first in new situations?', 'multiple_choice', 'information_processing', ARRAY['sensing', 'intuitive']),
('In social situations, you tend to:', 'multiple_choice', 'social_behavior', ARRAY['extroversion', 'introversion']),
('When faced with problems, your first instinct is to:', 'multiple_choice', 'problem_solving', ARRAY['thinking', 'feeling']),
('You work best when you have:', 'multiple_choice', 'structure_preference', ARRAY['judging', 'perceiving']),
('You are more interested in:', 'multiple_choice', 'focus_preference', ARRAY['sensing', 'intuitive']),
('After a busy day, you prefer to:', 'multiple_choice', 'recovery_style', ARRAY['extroversion', 'introversion']),
('When giving feedback to others, you tend to focus on:', 'multiple_choice', 'feedback_style', ARRAY['thinking', 'feeling']);

-- Insert options for the first question (energy source)
WITH first_question AS (
  SELECT id FROM public.questions WHERE text = 'Where do you typically gain energy and feel most refreshed?' LIMIT 1
)
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT 
  id,
  'Being around people and engaging in social activities',
  'social_energy',
  '{"extrovert": 3, "introvert": 0}',
  1
FROM first_question
UNION ALL
SELECT 
  id,
  'Having quiet time alone to think and reflect',
  'solitary_energy',
  '{"extrovert": 0, "introvert": 3}',
  2
FROM first_question
UNION ALL
SELECT 
  id,
  'A mix of both social and solo activities',
  'balanced_energy',
  '{"extrovert": 1.5, "introvert": 1.5}',
  3
FROM first_question
UNION ALL
SELECT 
  id,
  'Engaging in physical activities or hobbies',
  'activity_energy',
  '{"extrovert": 2, "introvert": 1}',
  4
FROM first_question;

-- Insert AI Content Templates for admin builders
INSERT INTO public.ai_content_templates (name, type, category, prompt_template, output_schema, default_config) VALUES
(
  'Personality Assessment Builder',
  'assessment',
  'personality',
  'Create a comprehensive personality assessment about {topic} with {question_count} questions. Target audience: {target_audience}. Assessment should explore {focus_areas} and provide insights into {personality_dimensions}. Include scoring methodology and result interpretations.',
  '{
    "required_fields": ["title", "description", "questions", "scoring_config", "result_templates"],
    "question_structure": {
      "text": "string",
      "type": "multiple_choice|scale|text",
      "options": [{"text": "string", "value": "string", "score_weights": {}}]
    },
    "result_structure": {
      "personality_type": "string",
      "strengths": ["string"],
      "growth_areas": ["string"],
      "recommendations": ["string"]
    }
  }',
  '{"question_count": 10, "difficulty": "beginner", "estimated_duration": 15}'
),
(
  'Wellness Quiz Builder',
  'quiz',
  'wellness',
  'Generate an educational quiz about {topic} for {target_audience}. Create {question_count} questions covering {key_concepts}. Include explanations for correct answers and provide learning resources.',
  '{
    "required_fields": ["title", "description", "questions", "passing_score"],
    "question_structure": {
      "question_text": "string",
      "question_type": "multiple_choice|true_false",
      "correct_answer": "string",
      "options": ["string"],
      "explanation": "string",
      "points": "number"
    }
  }',
  '{"question_count": 8, "passing_score": 70, "time_limit": 10}'
),
(
  'Growth Exploration Builder',
  'exploration',
  'growth',
  'Design a self-discovery exploration focusing on {topic}. Create {question_count} reflective questions that guide users through {exploration_areas}. Include facilitator prompts and analysis framework.',
  '{
    "required_fields": ["title", "description", "questions", "facilitator_prompt", "analysis_structure"],
    "exploration_structure": {
      "introduction": "string",
      "questions": ["string"],
      "reflection_prompts": ["string"],
      "integration_activities": ["string"]
    }
  }',
  '{"question_count": 8, "difficulty": "intermediate", "duration": 30}'
),
(
  'Skills Course Builder',
  'course',
  'skills',
  'Create a comprehensive course about {topic} for {target_audience}. Structure content into {module_count} modules covering {learning_objectives}. Include assessments, activities, and progress tracking.',
  '{
    "required_fields": ["title", "description", "modules", "learning_objectives", "assessments"],
    "course_structure": {
      "modules": [{
        "title": "string",
        "content": "string", 
        "activities": ["string"],
        "assessment": {}
      }],
      "resources": ["string"],
      "completion_criteria": {}
    }
  }',
  '{"module_count": 5, "duration_weeks": 4, "difficulty": "beginner"}'
);

-- Insert sample visitor quiz data
INSERT INTO public.quizzes (title, description, category, difficulty, is_public, time_limit_minutes, passing_score, show_correct_answers) VALUES
('Stress Management Basics', 'Test your knowledge of fundamental stress management techniques and strategies.', 'wellness', 'beginner', true, 10, 70.0, true),
('Healthy Communication Quiz', 'Assess your understanding of effective communication principles and techniques.', 'relationships', 'beginner', true, 8, 75.0, true),
('Personal Growth Fundamentals', 'Explore your knowledge of personal development concepts and practices.', 'growth', 'beginner', true, 12, 70.0, true),
('Mindfulness Basics', 'Test your understanding of mindfulness principles and applications.', 'spirituality', 'beginner', true, 6, 80.0, true),
('Self-Care Essentials', 'Evaluate your knowledge of self-care practices and their importance.', 'wellness', 'beginner', true, 8, 75.0, true);

-- Insert sample quiz questions for Stress Management Basics
WITH stress_quiz AS (
  SELECT id FROM public.quizzes WHERE title = 'Stress Management Basics' LIMIT 1
)
INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index)
SELECT 
  id,
  'What is the first step in effective stress management?',
  'multiple_choice',
  'Identifying your stress triggers',
  'Recognizing what causes your stress is essential before you can address it effectively.',
  1,
  1
FROM stress_quiz
UNION ALL
SELECT 
  id,
  'Deep breathing exercises help reduce stress by:',
  'multiple_choice',
  'Activating the parasympathetic nervous system',
  'Deep breathing triggers the relaxation response, calming your nervous system.',
  1,
  2
FROM stress_quiz
UNION ALL
SELECT 
  id,
  'True or False: All stress is harmful and should be avoided.',
  'true_false',
  'False',
  'Some stress (eustress) can be beneficial and motivating, while chronic distress is harmful.',
  1,
  3
FROM stress_quiz;

-- Create function to auto-generate visitor session IDs
CREATE OR REPLACE FUNCTION public.ensure_visitor_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.visitor_session_id IS NULL THEN
    NEW.visitor_session_id := public.generate_visitor_session();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for visitor sessions
CREATE TRIGGER ensure_visitor_session_trigger
  BEFORE INSERT ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

CREATE TRIGGER ensure_visitor_session_quiz_trigger
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

COMMENT ON FUNCTION public.ensure_visitor_session() IS 'Automatically generates visitor session IDs for non-authenticated users';


-- =====================================
-- Migration: 20250830150000_comprehensive_visitor_assessments.sql
-- =====================================

-- Enhanced Visitor Assessment System
-- Creates 5-6 comprehensive assessments for visitors with 10-15 questions each

-- Insert comprehensive visitor assessments with questions
WITH personality_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Personality Discovery' LIMIT 1
),
wellness_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Wellness Check' LIMIT 1
),
relationship_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Relationship Style' LIMIT 1
),
career_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Career Alignment' LIMIT 1
),
stress_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Stress & Resilience' LIMIT 1
),
balance_type AS (
  SELECT id FROM public.assessment_types WHERE name = 'Life Balance' LIMIT 1
)

-- Create Personality Discovery Assessment (15 questions)
INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
SELECT 
  'Discover Your True Personality',
  'Uncover your authentic personality type and understand what makes you unique. This comprehensive assessment explores your natural tendencies, communication style, and core motivations to help you embrace your authentic self.',
  personality_type.id,
  true,
  true,
  'personality_weights',
  '{
    "personality_dimensions": {
      "extroversion": {"label": "Energy Source", "description": "How you gain and direct energy"},
      "sensing": {"label": "Information Processing", "description": "How you take in and process information"},
      "thinking": {"label": "Decision Making", "description": "How you make decisions and judgments"},
      "judging": {"label": "Lifestyle Approach", "description": "How you approach the outside world"}
    },
    "result_types": {
      "ESTJ": {"label": "The Executive", "description": "Natural leader who thrives on organization and efficiency"},
      "ENFP": {"label": "The Campaigner", "description": "Enthusiastic and creative with strong people skills"},
      "INTJ": {"label": "The Architect", "description": "Independent and strategic with original thinking"},
      "ISFP": {"label": "The Adventurer", "description": "Flexible and charming with deep personal values"}
    }
  }',
  'Answer each question honestly based on your natural preferences. There are no right or wrong answers - this is about discovering your authentic self.'
FROM personality_type;

-- Get the created assessment ID for questions
WITH new_assessment AS (
  SELECT id FROM public.assessments WHERE title = 'Discover Your True Personality' ORDER BY created_at DESC LIMIT 1
)

-- Insert personality questions
INSERT INTO public.questions (text, type, category, tags) VALUES
('At a party, you are more likely to:', 'multiple_choice', 'social_energy', ARRAY['extroversion', 'introversion']),
('When learning something new, you prefer to:', 'multiple_choice', 'learning_style', ARRAY['sensing', 'intuition']),
('When making important decisions, you typically:', 'multiple_choice', 'decision_process', ARRAY['thinking', 'feeling']),
('You feel most comfortable when your day is:', 'multiple_choice', 'structure_preference', ARRAY['judging', 'perceiving']),
('In conversations, you tend to focus on:', 'multiple_choice', 'communication_focus', ARRAY['sensing', 'intuition']),
('When giving feedback, you prioritize:', 'multiple_choice', 'feedback_style', ARRAY['thinking', 'feeling']),
('You prefer to work in environments that are:', 'multiple_choice', 'work_environment', ARRAY['extroversion', 'introversion']),
('When solving problems, you first:', 'multiple_choice', 'problem_approach', ARRAY['sensing', 'intuition']),
('You make your best decisions when you:', 'multiple_choice', 'decision_context', ARRAY['thinking', 'feeling']),
('Your ideal weekend involves:', 'multiple_choice', 'leisure_preference', ARRAY['extroversion', 'introversion']),
('You are drawn to ideas that are:', 'multiple_choice', 'idea_preference', ARRAY['sensing', 'intuition']),
('When conflicts arise, you prefer to:', 'multiple_choice', 'conflict_style', ARRAY['thinking', 'feeling']),
('You work best when you have:', 'multiple_choice', 'work_structure', ARRAY['judging', 'perceiving']),
('In group projects, you naturally:', 'multiple_choice', 'group_role', ARRAY['extroversion', 'introversion']),
('You trust information that is:', 'multiple_choice', 'information_trust', ARRAY['sensing', 'intuition']);

-- Create question options for personality assessment
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
-- Question 1: At a party
SELECT q.id, 'Spend time with many different people', 'social_butterfly', '{"extroversion": 3, "introversion": 0}', 1
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Have deep conversations with a few close friends', 'intimate_connections', '{"extroversion": 0, "introversion": 3}', 2
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Find a quiet corner to observe and recharge', 'observer_mode', '{"extroversion": 0, "introversion": 2}', 3
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:'
UNION ALL
SELECT q.id, 'Be the one organizing activities or games', 'social_organizer', '{"extroversion": 2, "introversion": 0}', 4
FROM public.questions q WHERE q.text = 'At a party, you are more likely to:';

-- Continue with more question options...
-- Question 2: Learning style
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT q.id, 'Start with concrete examples and build understanding', 'concrete_first', '{"sensing": 3, "intuition": 0}', 1
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Explore theories and possibilities first', 'theory_first', '{"sensing": 0, "intuition": 3}', 2
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Get hands-on experience immediately', 'hands_on', '{"sensing": 2, "intuition": 1}', 3
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:'
UNION ALL
SELECT q.id, 'Understand the big picture connections', 'big_picture', '{"sensing": 0, "intuition": 2}', 4
FROM public.questions q WHERE q.text = 'When learning something new, you prefer to:';

-- Link questions to assessment
INSERT INTO public.assessment_questions (assessment_id, question_id, order_index)
SELECT a.id, q.id, 
  CASE q.text
    WHEN 'At a party, you are more likely to:' THEN 1
    WHEN 'When learning something new, you prefer to:' THEN 2
    WHEN 'When making important decisions, you typically:' THEN 3
    WHEN 'You feel most comfortable when your day is:' THEN 4
    WHEN 'In conversations, you tend to focus on:' THEN 5
    WHEN 'When giving feedback, you prioritize:' THEN 6
    WHEN 'You prefer to work in environments that are:' THEN 7
    WHEN 'When solving problems, you first:' THEN 8
    WHEN 'You make your best decisions when you:' THEN 9
    WHEN 'Your ideal weekend involves:' THEN 10
    WHEN 'You are drawn to ideas that are:' THEN 11
    WHEN 'When conflicts arise, you prefer to:' THEN 12
    WHEN 'You work best when you have:' THEN 13
    WHEN 'In group projects, you naturally:' THEN 14
    WHEN 'You trust information that is:' THEN 15
  END
FROM public.assessments a, public.questions q
WHERE a.title = 'Discover Your True Personality'
  AND q.tags && ARRAY['extroversion', 'introversion', 'sensing', 'intuition', 'thinking', 'feeling', 'judging', 'perceiving'];

-- Create Wellness Check Assessment (12 questions)
INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
SELECT 
  'Complete Wellness Assessment',
  'Get a comprehensive view of your mental, physical, and emotional well-being. This assessment helps you identify your strengths and areas for growth across all dimensions of wellness.',
  wellness_type.id,
  true,
  true,
  'weighted_average',
  '{
    "wellness_dimensions": {
      "physical": {"weight": 0.25, "label": "Physical Health", "description": "Your body health and vitality"},
      "mental": {"weight": 0.25, "label": "Mental Health", "description": "Your cognitive and psychological well-being"},
      "emotional": {"weight": 0.25, "label": "Emotional Health", "description": "Your emotional awareness and regulation"},
      "social": {"weight": 0.25, "label": "Social Health", "description": "Your relationships and social connections"}
    },
    "score_ranges": {
      "excellent": [85, 100],
      "good": [70, 84],
      "fair": [55, 69],
      "needs_attention": [0, 54]
    }
  }',
  'Rate each statement based on how true it is for you most of the time. Be honest to get the most accurate assessment of your wellness.'
FROM wellness_type;

-- Insert wellness questions
INSERT INTO public.questions (text, type, category, tags) VALUES
('I have energy for my daily activities', 'scale', 'physical_wellness', ARRAY['physical', 'energy']),
('I sleep well and feel rested', 'scale', 'physical_wellness', ARRAY['physical', 'sleep']),
('I eat nutritious foods regularly', 'scale', 'physical_wellness', ARRAY['physical', 'nutrition']),
('I can handle stress effectively', 'scale', 'mental_wellness', ARRAY['mental', 'stress']),
('I feel mentally sharp and focused', 'scale', 'mental_wellness', ARRAY['mental', 'focus']),
('I enjoy learning new things', 'scale', 'mental_wellness', ARRAY['mental', 'growth']),
('I understand and manage my emotions well', 'scale', 'emotional_wellness', ARRAY['emotional', 'awareness']),
('I feel optimistic about my future', 'scale', 'emotional_wellness', ARRAY['emotional', 'outlook']),
('I recover quickly from setbacks', 'scale', 'emotional_wellness', ARRAY['emotional', 'resilience']),
('I have supportive relationships', 'scale', 'social_wellness', ARRAY['social', 'support']),
('I communicate effectively with others', 'scale', 'social_wellness', ARRAY['social', 'communication']),
('I feel connected to my community', 'scale', 'social_wellness', ARRAY['social', 'community']);

-- Create scale options for wellness questions (1-5 scale)
WITH wellness_questions AS (
  SELECT id FROM public.questions WHERE tags && ARRAY['physical', 'mental', 'emotional', 'social']
)
INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
SELECT q.id, 'Never true', 'never', '{"score": 1}', 1 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Rarely true', 'rarely', '{"score": 2}', 2 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Sometimes true', 'sometimes', '{"score": 3}', 3 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Often true', 'often', '{"score": 4}', 4 FROM wellness_questions q
UNION ALL
SELECT q.id, 'Always true', 'always', '{"score": 5}', 5 FROM wellness_questions q;

-- Link wellness questions to assessment
INSERT INTO public.assessment_questions (assessment_id, question_id, order_index, weight)
SELECT a.id, q.id, 
  CASE 
    WHEN q.text LIKE '%energy%' THEN 1
    WHEN q.text LIKE '%sleep%' THEN 2
    WHEN q.text LIKE '%eat%' THEN 3
    WHEN q.text LIKE '%stress%' THEN 4
    WHEN q.text LIKE '%mental%' THEN 5
    WHEN q.text LIKE '%learning%' THEN 6
    WHEN q.text LIKE '%emotions%' THEN 7
    WHEN q.text LIKE '%optimistic%' THEN 8
    WHEN q.text LIKE '%setbacks%' THEN 9
    WHEN q.text LIKE '%relationships%' THEN 10
    WHEN q.text LIKE '%communicate%' THEN 11
    WHEN q.text LIKE '%community%' THEN 12
  END,
  1.0
FROM public.assessments a, public.questions q
WHERE a.title = 'Complete Wellness Assessment'
  AND q.tags && ARRAY['physical', 'mental', 'emotional', 'social'];

-- Function to ensure visitor sessions for anonymous assessments
CREATE OR REPLACE FUNCTION public.ensure_visitor_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If no user_id and no visitor_session_id, generate one
  IF NEW.user_id IS NULL AND (NEW.visitor_session_id IS NULL OR NEW.visitor_session_id = '') THEN
    NEW.visitor_session_id := 'visitor_' || gen_random_uuid()::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to assessment responses
DROP TRIGGER IF EXISTS ensure_visitor_session_assessment_trigger ON public.assessment_responses;
CREATE TRIGGER ensure_visitor_session_assessment_trigger
  BEFORE INSERT ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_visitor_session();

-- Create more visitor assessments following the same pattern...
-- Function to create complete assessment with questions
CREATE OR REPLACE FUNCTION public.create_visitor_assessment(
  p_title TEXT,
  p_description TEXT,
  p_type_name TEXT,
  p_questions JSONB,
  p_scoring_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  assessment_id UUID;
  question_data JSONB;
  question_id UUID;
  option_data JSONB;
  question_order INTEGER := 1;
BEGIN
  -- Create the assessment
  INSERT INTO public.assessments (title, description, assessment_type_id, is_published, is_public, scoring_algorithm, scoring_config, instructions)
  SELECT 
    p_title,
    p_description,
    at.id,
    true,
    true,
    COALESCE(p_scoring_config->>'algorithm', 'weighted_average'),
    p_scoring_config,
    'Answer each question honestly to get the most accurate results.'
  FROM public.assessment_types at
  WHERE at.name = p_type_name
  RETURNING id INTO assessment_id;

  -- Create questions and options
  FOR question_data IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question
    INSERT INTO public.questions (text, type, category, tags)
    VALUES (
      question_data->>'text',
      question_data->>'type',
      question_data->>'category',
      ARRAY(SELECT jsonb_array_elements_text(question_data->'tags'))
    )
    RETURNING id INTO question_id;

    -- Insert question options
    FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
    LOOP
      INSERT INTO public.question_options (question_id, text, value, score_weights, order_index)
      VALUES (
        question_id,
        option_data->>'text',
        option_data->>'value',
        (option_data->'score_weights')::jsonb,
        (option_data->>'order_index')::integer
      );
    END LOOP;

    -- Link question to assessment
    INSERT INTO public.assessment_questions (assessment_id, question_id, order_index)
    VALUES (assessment_id, question_id, question_order);

    question_order := question_order + 1;
  END LOOP;

  RETURN assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_visitor_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_visitor_session TO authenticated;


-- =====================================
-- Migration: 20250830150001_user_assessments_and_quizzes.sql
-- =====================================

-- User-Only Assessments (20 assessments with 10-20 questions each)
-- These require user signup and provide deeper insights

-- Insert comprehensive user assessment types
INSERT INTO public.assessment_types (name, description, category, is_public, requires_signup, estimated_duration) VALUES
('Advanced Personality Profiling', 'Deep dive into your personality with detailed analysis across 16 dimensions.', 'personality', false, true, 25),
('Career Path Optimization', 'Comprehensive career assessment including skills, interests, and values alignment.', 'career', false, true, 30),
('Relationship Dynamics Deep Dive', 'Detailed exploration of your relationship patterns, attachment style, and communication preferences.', 'relationships', false, true, 20),
('Emotional Intelligence Mastery', 'Advanced assessment of emotional awareness, regulation, and social skills.', 'wellness', false, true, 18),
('Life Purpose Discovery', 'Comprehensive exploration to uncover your core values, mission, and life direction.', 'growth', false, true, 35),
('Stress Resilience Building', 'In-depth analysis of stress patterns and resilience building strategies.', 'wellness', false, true, 22),
('Communication Style Analysis', 'Detailed assessment of your communication patterns across different contexts.', 'relationships', false, true, 16),
('Leadership Potential Assessment', 'Comprehensive evaluation of leadership skills and development areas.', 'career', false, true, 28),
('Mindfulness & Awareness', 'Deep assessment of mindfulness skills and present-moment awareness.', 'spirituality', false, true, 15),
('Financial Mindset Analysis', 'Comprehensive exploration of your money beliefs and financial behaviors.', 'lifestyle', false, true, 18),
('Creativity & Innovation', 'Assessment of creative thinking patterns and innovation potential.', 'skills', false, true, 20),
('Health & Vitality Optimization', 'Comprehensive health assessment covering physical, mental, and lifestyle factors.', 'wellness', false, true, 25),
('Social Dynamics Mastery', 'Advanced assessment of social skills and relationship building abilities.', 'relationships', false, true, 19),
('Time & Energy Management', 'Detailed analysis of how you manage time, energy, and priorities.', 'lifestyle', false, true, 17),
('Spiritual Growth Journey', 'Comprehensive exploration of spiritual beliefs, practices, and growth.', 'spirituality', false, true, 22),
('Conflict Resolution Skills', 'Advanced assessment of conflict handling and resolution capabilities.', 'relationships', false, true, 16),
('Personal Brand & Influence', 'Assessment of personal branding and influence building skills.', 'career', false, true, 20),
('Intuition & Decision Making', 'Deep dive into intuitive abilities and decision-making patterns.', 'growth', false, true, 18),
('Boundary Setting Mastery', 'Comprehensive assessment of boundary setting across all life areas.', 'relationships', false, true, 15),
('Growth Mindset Development', 'Advanced assessment of mindset patterns and growth orientation.', 'growth', false, true, 21);

-- Create comprehensive question sets for each user assessment
-- Using the helper function to create assessments efficiently

-- Advanced Personality Profiling (20 questions)
SELECT public.create_visitor_assessment(
  'Advanced Personality Profiling',
  'Discover the deeper layers of your personality with this comprehensive 20-question assessment. Explore your cognitive functions, motivational drivers, and behavioral patterns across multiple contexts.',
  'Advanced Personality Profiling',
  '[
    {
      "text": "In high-pressure situations, your natural response is to:",
      "type": "multiple_choice",
      "category": "stress_response",
      "tags": ["stress", "decision_making"],
      "options": [
        {"text": "Take charge and organize others", "value": "leadership_mode", "score_weights": {"dominant": 3, "influence": 2}, "order_index": 1},
        {"text": "Analyze all variables before acting", "value": "analytical_mode", "score_weights": {"conscientious": 3, "dominant": 1}, "order_index": 2},
        {"text": "Focus on maintaining team harmony", "value": "harmony_mode", "score_weights": {"steadiness": 3, "influence": 1}, "order_index": 3},
        {"text": "Adapt quickly to changing circumstances", "value": "adaptive_mode", "score_weights": {"influence": 2, "dominant": 1}, "order_index": 4}
      ]
    },
    {
      "text": "When processing complex information, you prefer to:",
      "type": "multiple_choice",
      "category": "cognitive_style",
      "tags": ["thinking", "processing"],
      "options": [
        {"text": "Break it down into logical steps", "value": "sequential", "score_weights": {"analytical": 3, "methodical": 2}, "order_index": 1},
        {"text": "Look for patterns and connections", "value": "holistic", "score_weights": {"intuitive": 3, "creative": 2}, "order_index": 2},
        {"text": "Discuss it with others for perspective", "value": "collaborative", "score_weights": {"social": 3, "expressive": 2}, "order_index": 3},
        {"text": "Take time to reflect privately", "value": "reflective", "score_weights": {"introspective": 3, "independent": 2}, "order_index": 4}
      ]
    },
    {
      "text": "Your ideal work environment includes:",
      "type": "multiple_choice",
      "category": "work_preferences",
      "tags": ["environment", "productivity"],
      "options": [
        {"text": "Clear deadlines and structured processes", "value": "structured", "score_weights": {"organized": 3, "disciplined": 2}, "order_index": 1},
        {"text": "Freedom to innovate and experiment", "value": "innovative", "score_weights": {"creative": 3, "flexible": 2}, "order_index": 2},
        {"text": "Collaborative team interactions", "value": "collaborative", "score_weights": {"social": 3, "supportive": 2}, "order_index": 3},
        {"text": "Autonomous decision-making authority", "value": "autonomous", "score_weights": {"independent": 3, "confident": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "personality_weights", "dimensions": {"dominant": {"label": "Dominance", "description": "Direct, decisive, results-oriented"}, "influence": {"label": "Influence", "description": "Enthusiastic, optimistic, people-oriented"}, "steadiness": {"label": "Steadiness", "description": "Patient, reliable, team-oriented"}, "conscientious": {"label": "Conscientiousness", "description": "Careful, analytical, quality-oriented"}}}'
);

-- Career Path Optimization (18 questions)
SELECT public.create_visitor_assessment(
  'Career Path Optimization',
  'Align your career with your true potential. This comprehensive assessment evaluates your skills, interests, values, and work preferences to guide your career decisions.',
  'Career Path Optimization',
  '[
    {
      "text": "What motivates you most in your work?",
      "type": "multiple_choice",
      "category": "work_motivation",
      "tags": ["motivation", "values"],
      "options": [
        {"text": "Making a meaningful impact on others", "value": "impact", "score_weights": {"purpose": 3, "social_impact": 3}, "order_index": 1},
        {"text": "Achieving financial security and advancement", "value": "advancement", "score_weights": {"security": 3, "achievement": 2}, "order_index": 2},
        {"text": "Continuous learning and skill development", "value": "growth", "score_weights": {"learning": 3, "development": 3}, "order_index": 3},
        {"text": "Creative expression and innovation", "value": "creativity", "score_weights": {"creativity": 3, "innovation": 3}, "order_index": 4}
      ]
    },
    {
      "text": "In team projects, you naturally gravitate toward:",
      "type": "multiple_choice",
      "category": "team_role",
      "tags": ["teamwork", "leadership"],
      "options": [
        {"text": "Leading and coordinating the team", "value": "leader", "score_weights": {"leadership": 3, "coordination": 2}, "order_index": 1},
        {"text": "Generating creative ideas and solutions", "value": "innovator", "score_weights": {"creativity": 3, "problem_solving": 2}, "order_index": 2},
        {"text": "Analyzing data and providing insights", "value": "analyst", "score_weights": {"analytical": 3, "detail_oriented": 2}, "order_index": 3},
        {"text": "Supporting others and maintaining harmony", "value": "supporter", "score_weights": {"supportive": 3, "collaborative": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "weighted_average", "career_dimensions": {"purpose": {"weight": 0.2}, "skills": {"weight": 0.3}, "interests": {"weight": 0.2}, "values": {"weight": 0.2}, "work_style": {"weight": 0.1}}}'
);

-- Life Purpose Discovery (16 questions)
SELECT public.create_visitor_assessment(
  'Life Purpose Discovery',
  'Uncover your deeper calling and life direction. This transformative assessment helps you identify your core values, unique gifts, and meaningful path forward.',
  'Life Purpose Discovery',
  '[
    {
      "text": "When you imagine your ideal future, you see yourself:",
      "type": "multiple_choice",
      "category": "life_vision",
      "tags": ["vision", "purpose"],
      "options": [
        {"text": "Leading positive change in your community", "value": "change_leader", "score_weights": {"leadership": 3, "social_impact": 3}, "order_index": 1},
        {"text": "Creating something beautiful or meaningful", "value": "creator", "score_weights": {"creativity": 3, "expression": 3}, "order_index": 2},
        {"text": "Helping others grow and heal", "value": "healer", "score_weights": {"caring": 3, "service": 3}, "order_index": 3},
        {"text": "Discovering and sharing knowledge", "value": "seeker", "score_weights": {"learning": 3, "wisdom": 3}, "order_index": 4}
      ]
    },
    {
      "text": "Your deepest sense of fulfillment comes from:",
      "type": "multiple_choice",
      "category": "fulfillment_source",
      "tags": ["fulfillment", "meaning"],
      "options": [
        {"text": "Seeing others succeed because of your support", "value": "enabler", "score_weights": {"service": 3, "support": 2}, "order_index": 1},
        {"text": "Solving complex problems or challenges", "value": "problem_solver", "score_weights": {"analytical": 3, "achievement": 2}, "order_index": 2},
        {"text": "Expressing your authentic self creatively", "value": "artist", "score_weights": {"creativity": 3, "authenticity": 2}, "order_index": 3},
        {"text": "Building connections and relationships", "value": "connector", "score_weights": {"social": 3, "relationship": 2}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "purpose_discovery", "purpose_archetypes": {"leader": "Natural leader focused on positive change", "creator": "Creative spirit driven to make and share", "healer": "Compassionate soul dedicated to helping others", "seeker": "Curious mind driven to learn and teach"}}'
);

-- Emotional Intelligence Mastery (15 questions)
SELECT public.create_visitor_assessment(
  'Emotional Intelligence Mastery',
  'Develop your emotional superpowers. This assessment evaluates your emotional awareness, regulation, empathy, and social skills to help you thrive in all relationships.',
  'Emotional Intelligence Mastery',
  '[
    {
      "text": "When you feel overwhelmed by emotions, you typically:",
      "type": "multiple_choice",
      "category": "emotion_regulation",
      "tags": ["regulation", "coping"],
      "options": [
        {"text": "Take time to understand what triggered the feeling", "value": "analytical_approach", "score_weights": {"self_awareness": 3, "regulation": 2}, "order_index": 1},
        {"text": "Use breathing or mindfulness techniques", "value": "mindful_approach", "score_weights": {"regulation": 3, "mindfulness": 2}, "order_index": 2},
        {"text": "Talk it through with someone you trust", "value": "social_approach", "score_weights": {"social_skills": 3, "support_seeking": 2}, "order_index": 3},
        {"text": "Engage in physical activity to release tension", "value": "physical_approach", "score_weights": {"regulation": 2, "self_care": 2}, "order_index": 4}
      ]
    },
    {
      "text": "You can usually tell when someone is feeling upset because:",
      "type": "multiple_choice",
      "category": "empathy",
      "tags": ["empathy", "social_awareness"],
      "options": [
        {"text": "You notice subtle changes in their body language", "value": "nonverbal_reader", "score_weights": {"empathy": 3, "observation": 2}, "order_index": 1},
        {"text": "Their energy feels different to you", "value": "energy_reader", "score_weights": {"empathy": 3, "intuition": 2}, "order_index": 2},
        {"text": "You hear it in their tone of voice", "value": "vocal_reader", "score_weights": {"empathy": 2, "listening": 3}, "order_index": 3},
        {"text": "You sense it based on the context", "value": "context_reader", "score_weights": {"social_awareness": 3, "analytical": 1}, "order_index": 4}
      ]
    }
  ]',
  '{"algorithm": "ei_composite", "ei_dimensions": {"self_awareness": {"weight": 0.25}, "self_regulation": {"weight": 0.25}, "empathy": {"weight": 0.25}, "social_skills": {"weight": 0.25}}}'
);

-- Create function to efficiently generate visitor quiz data
CREATE OR REPLACE FUNCTION public.create_visitor_quiz(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_difficulty TEXT,
  p_questions JSONB
)
RETURNS UUID AS $$
DECLARE
  quiz_id UUID;
  question_data JSONB;
  question_id UUID;
  option_data JSONB;
  question_order INTEGER := 1;
BEGIN
  -- Create the quiz
  INSERT INTO public.quizzes (title, description, category, difficulty, is_public, time_limit_minutes, passing_score, show_correct_answers)
  VALUES (
    p_title,
    p_description,
    p_category,
    p_difficulty,
    true,
    15,
    70.0,
    true
  )
  RETURNING id INTO quiz_id;

  -- Create questions and options
  FOR question_data IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question
    INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index)
    VALUES (
      quiz_id,
      question_data->>'question_text',
      question_data->>'question_type',
      question_data->>'correct_answer',
      question_data->>'explanation',
      COALESCE((question_data->>'points')::integer, 1),
      question_order
    )
    RETURNING id INTO question_id;

    -- Insert question options
    FOR option_data IN SELECT * FROM jsonb_array_elements(question_data->'options')
    LOOP
      INSERT INTO public.quiz_question_options (quiz_question_id, option_text, is_correct, order_index)
      VALUES (
        question_id,
        option_data->>'text',
        COALESCE((option_data->>'is_correct')::boolean, false),
        (option_data->>'order_index')::integer
      );
    END LOOP;

    question_order := question_order + 1;
  END LOOP;

  RETURN quiz_id;
END;
$$ LANGUAGE plpgsql;

-- Create 6 comprehensive visitor quizzes
SELECT public.create_visitor_quiz(
  'Personal Growth Fundamentals',
  'Test your knowledge of essential personal development concepts and discover new strategies for growth.',
  'growth',
  'beginner',
  '[
    {
      "question_text": "What is the most important factor in building lasting habits?",
      "question_type": "multiple_choice",
      "correct_answer": "Consistency over intensity",
      "explanation": "Research shows that consistency, even with small actions, is more effective than intense but sporadic efforts.",
      "points": 1,
      "options": [
        {"text": "Motivation and willpower", "is_correct": false, "order_index": 1},
        {"text": "Consistency over intensity", "is_correct": true, "order_index": 2},
        {"text": "Perfect planning", "is_correct": false, "order_index": 3},
        {"text": "External accountability", "is_correct": false, "order_index": 4}
      ]
    },
    {
      "question_text": "Which mindset is most conducive to personal growth?",
      "question_type": "multiple_choice",
      "correct_answer": "Growth mindset - believing abilities can be developed",
      "explanation": "A growth mindset, as researched by Carol Dweck, believes that abilities and intelligence can be developed through effort and learning.",
      "points": 1,
      "options": [
        {"text": "Fixed mindset - believing talents are innate", "is_correct": false, "order_index": 1},
        {"text": "Growth mindset - believing abilities can be developed", "is_correct": true, "order_index": 2},
        {"text": "Competitive mindset - always comparing to others", "is_correct": false, "order_index": 3},
        {"text": "Perfectionist mindset - never accepting mistakes", "is_correct": false, "order_index": 4}
      ]
    }
  ]'
);

SELECT public.create_visitor_quiz(
  'Stress Management Mastery',
  'Learn effective strategies for managing stress and building resilience in your daily life.',
  'wellness',
  'intermediate',
  '[
    {
      "question_text": "What is the physiological fight-or-flight response designed for?",
      "question_type": "multiple_choice",
      "correct_answer": "Short-term physical threats",
      "explanation": "The fight-or-flight response evolved to help us handle immediate physical dangers, not chronic psychological stress.",
      "points": 1,
      "options": [
        {"text": "Chronic daily stress", "is_correct": false, "order_index": 1},
        {"text": "Short-term physical threats", "is_correct": true, "order_index": 2},
        {"text": "Mental concentration", "is_correct": false, "order_index": 3},
        {"text": "Social interactions", "is_correct": false, "order_index": 4}
      ]
    },
    {
      "question_text": "Which technique is most effective for immediate stress relief?",
      "question_type": "multiple_choice",
      "correct_answer": "Deep breathing exercises",
      "explanation": "Deep breathing activates the parasympathetic nervous system, providing immediate stress relief by countering the stress response.",
      "points": 1,
      "options": [
        {"text": "Vigorous exercise", "is_correct": false, "order_index": 1},
        {"text": "Deep breathing exercises", "is_correct": true, "order_index": 2},
        {"text": "Positive thinking", "is_correct": false, "order_index": 3},
        {"text": "Problem-solving", "is_correct": false, "order_index": 4}
      ]
    }
  ]'
);

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.create_visitor_quiz TO authenticated;

-- Update RLS policies to allow visitor access to assessments and quizzes
CREATE POLICY "Visitors can view public assessments" ON public.assessments
    FOR SELECT USING (is_public = true AND is_published = true);

CREATE POLICY "Visitors can view public assessment questions" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_id 
            AND a.is_public = true 
            AND a.is_published = true
        )
    );

CREATE POLICY "Visitors can view public quizzes" ON public.quizzes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Visitors can create assessment responses" ON public.assessment_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Visitors can create quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_public_published ON public.assessments(is_public, is_published) WHERE is_public = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_quizzes_public ON public.quizzes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_assessment_responses_visitor_session ON public.assessment_responses(visitor_session_id) WHERE visitor_session_id IS NOT NULL;


-- =====================================
-- Migration: 20250831000000_create_missing_tables.sql
-- =====================================

-- Create daily_insights table for daily user insights
CREATE TABLE IF NOT EXISTS public.daily_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    insight_text TEXT NOT NULL,
    insight_type VARCHAR(50) DEFAULT 'inspiration',
    category VARCHAR(50) DEFAULT 'general',
    generated_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create library_items table for content library
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'audio', 'video', 'exercise', 'meditation', 'course')),
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    author VARCHAR(255),
    author_image TEXT,
    thumbnail_url TEXT,
    content_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    progress INTEGER DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value NUMERIC,
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table for gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 100,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create user_library_progress table for tracking user content consumption
CREATE TABLE IF NOT EXISTS public.user_library_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    library_item_id UUID NOT NULL REFERENCES library_items(id),
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in seconds
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_bookmarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, library_item_id)
);

-- Create daily_insight_likes table for tracking engagement
CREATE TABLE IF NOT EXISTS public.daily_insight_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    insight_id UUID NOT NULL REFERENCES daily_insights(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, insight_id)
);

-- Create user_content_recommendations table for personalized content
CREATE TABLE IF NOT EXISTS public.user_content_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    recommendation_score DECIMAL(3,2) DEFAULT 0.0,
    reason TEXT,
    is_shown BOOLEAN DEFAULT false,
    is_interacted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_engagement_metrics table for detailed analytics
CREATE TABLE IF NOT EXISTS public.user_engagement_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_category VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON public.daily_insights(user_id, generated_date);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date_active ON public.daily_insights(generated_date, is_active);
CREATE INDEX IF NOT EXISTS idx_library_items_type_category ON public.library_items(type, category);
CREATE INDEX IF NOT EXISTS idx_library_items_rating ON public.library_items(rating DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_progress_user ON public.user_library_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_user_time ON public.user_engagement_metrics(user_id, created_at DESC);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_insights_updated_at BEFORE UPDATE ON public.daily_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON public.library_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_library_progress_updated_at BEFORE UPDATE ON public.user_library_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_content_recommendations_updated_at BEFORE UPDATE ON public.user_content_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_insights
CREATE POLICY "Users can view daily insights" ON public.daily_insights
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own insights" ON public.daily_insights
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS policies for library_items
CREATE POLICY "Public can view library items" ON public.library_items
    FOR SELECT USING (true);

-- RLS policies for user_library_progress
CREATE POLICY "Users can manage their own progress" ON public.user_library_progress
    FOR ALL USING (user_id = auth.uid());

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (user_id = auth.uid());

-- RLS policies for analytics_events
CREATE POLICY "Users can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own analytics" ON public.analytics_events
    FOR SELECT USING (user_id = auth.uid());

-- Insert sample data for daily_insights
INSERT INTO public.daily_insights (insight_text, insight_type, category, generated_date, is_active) VALUES
('The journey of self-discovery is not about finding yourself, but creating yourself.', 'inspiration', 'growth', '2025-08-31', true),
('Your greatest strength often lies hidden within your greatest challenge.', 'inspiration', 'challenges', '2025-08-30', true),
('Healing happens in the space between accepting what is and believing in what could be.', 'inspiration', 'healing', '2025-08-29', true),
('The relationship you have with yourself sets the tone for every other relationship.', 'inspiration', 'relationships', '2025-08-28', true),
('Growth requires both the courage to look within and the compassion to love what you find.', 'inspiration', 'growth', '2025-08-27', true),
('Every challenge you face is an opportunity to discover something new about yourself.', 'inspiration', 'challenges', '2025-08-26', true),
('Your intuition is a powerful guide - learn to trust it while staying grounded.', 'inspiration', 'intuition', '2025-08-25', true),
('Self-compassion is not selfish; it''s essential for sustainable growth.', 'inspiration', 'self-compassion', '2025-08-24', true);

-- Insert sample data for library_items
INSERT INTO public.library_items (title, description, content, type, category, difficulty, duration, tags, rating) VALUES
('Understanding Your Inner Critic', 'Learn to recognize and transform your inner critic into a supportive inner voice.', 'Deep dive into understanding the inner critic and practical techniques for transforming self-talk.', 'article', 'Self-Awareness', 'beginner', '8 min read', '{"self-talk", "mindfulness", "confidence"}', 4.8),
('Guided Meditation for Self-Compassion', 'A gentle 15-minute meditation to cultivate kindness towards yourself.', 'Follow along with this guided meditation to develop self-compassion and emotional healing.', 'audio', 'Mindfulness', 'beginner', '15 min', '{"meditation", "self-compassion", "healing"}', 4.9),
('Setting Healthy Boundaries Workshop', 'Interactive workshop on establishing and maintaining healthy boundaries in relationships.', 'Learn practical strategies for setting and maintaining healthy boundaries in all areas of life.', 'video', 'Relationships', 'intermediate', '45 min', '{"boundaries", "relationships", "communication"}', 4.7),
('Daily Gratitude Practice', 'Simple exercises to incorporate gratitude into your daily routine.', 'Discover simple yet powerful gratitude practices to transform your perspective and well-being.', 'exercise', 'Wellness', 'beginner', '5 min daily', '{"gratitude", "daily-practice", "positivity"}', 4.6),
('Overcoming Imposter Syndrome', 'Strategies to recognize and overcome imposter syndrome in your career and personal life.', 'Comprehensive guide to understanding and overcoming imposter syndrome with practical exercises.', 'article', 'Career Growth', 'intermediate', '12 min read', '{"confidence", "career", "self-worth"}', 4.8),
('Creative Expression Therapy', 'Explore your emotions and thoughts through various creative mediums.', 'Discover how creative expression can be a powerful tool for emotional processing and healing.', 'video', 'Creativity', 'beginner', '30 min', '{"creativity", "therapy", "expression"}', 4.5),
('Mindful Morning Routine', 'Start your day with intention and presence through this guided morning practice.', 'Transform your mornings with this mindful routine that sets the tone for your entire day.', 'audio', 'Mindfulness', 'beginner', '10 min', '{"mindfulness", "morning", "routine"}', 4.7),
('Emotional Regulation Techniques', 'Learn practical techniques for managing difficult emotions and stress.', 'Master evidence-based techniques for emotional regulation that you can use in any situation.', 'article', 'Wellness', 'intermediate', '15 min read', '{"emotions", "regulation", "stress-management"}', 4.6);

-- Insert sample data for user_achievements (connected to existing achievements)
INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at, progress, max_progress) 
SELECT 
    p.id as user_id,
    a.id as achievement_id,
    NOW() - INTERVAL '1 day' * (random() * 30)::int,
    CASE WHEN random() > 0.5 THEN 100 ELSE floor(random() * 100) END,
    100
FROM profiles p
CROSS JOIN achievements a
WHERE p.id IN (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 10)
AND a.id IN (SELECT id FROM achievements ORDER BY created_at DESC LIMIT 5);

-- =====================================
-- Migration: 20250831000001_create_assessment_tables.sql
-- =====================================

-- Create assessment database schema for AI-generated assessments
-- This schema supports both free public assessments and user assessments

-- Main assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    ai_provider text,
    ai_model text,
    ai_prompt text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Assessment questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image')),
    position integer NOT NULL,
    media_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);

-- Assessment options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL,
    feedback text,
    position integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);

-- RLS Policies
-- Public assessments visible to all users (including anonymous)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Admin can manage all assessments
CREATE POLICY "Authenticated users can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Questions policies
CREATE POLICY "Questions visible with assessment"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments 
        WHERE id = assessment_id AND visibility = 'public'
    )
    OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can manage questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Options policies  
CREATE POLICY "Options visible with questions"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions q
        JOIN public.assessments a ON a.id = q.assessment_id
        WHERE q.id = question_id AND a.visibility = 'public'
    )
    OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can manage options"
ON public.assessment_options
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Stored procedure to create assessment with questions atomically
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _ai_provider text,
  _ai_model text,
  _ai_prompt text,
  _questions jsonb
) RETURNS bigint AS $$
DECLARE
  _assessment_id bigint;
  _question jsonb;
  _question_id bigint;
  _option jsonb;
BEGIN
  -- Insert main assessment
  INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
  VALUES (_title, _description, _type, _visibility, _ai_provider, _ai_model, _ai_prompt)
  RETURNING id INTO _assessment_id;

  -- Insert questions and options
  FOR _question IN SELECT * FROM jsonb_array_elements(_questions) LOOP
    INSERT INTO public.assessment_questions (
      assessment_id, 
      question_text, 
      question_type, 
      position
    )
    VALUES (
      _assessment_id,
      _question->>'question_text',
      _question->>'question_type',
      (_question->>'position')::int
    )
    RETURNING id INTO _question_id;

    -- Insert options for multiple choice questions
    IF _question->>'question_type' = 'multiple_choice' AND _question ? 'options' THEN
      FOR _option IN SELECT * FROM jsonb_array_elements(_question->'options') LOOP
        INSERT INTO public.assessment_options (
          question_id,
          option_text,
          is_correct,
          position
        ) VALUES (
          _question_id,
          _option->>'option_text',
          (_option->>'is_correct')::boolean,
          (_option->>'position')::int
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full assessment with questions and options
CREATE OR REPLACE FUNCTION public.get_assessment_with_questions(assessment_id_param bigint)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'title', a.title,
    'description', a.description,
    'type', a.type,
    'visibility', a.visibility,
    'created_at', a.created_at,
    'questions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_text', q.question_text,
          'question_type', q.question_type,
          'position', q.position,
          'media_url', q.media_url,
          'options', q_options.options
        ) ORDER BY q.position
      ) FILTER (WHERE q.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.assessments a
  LEFT JOIN public.assessment_questions q ON a.id = q.assessment_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'option_text', o.option_text,
          'is_correct', o.is_correct,
          'feedback', o.feedback,
          'position', o.position
        ) ORDER BY o.position
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'::jsonb
    ) as options
    FROM public.assessment_options o
    WHERE o.question_id = q.id
  ) q_options ON true
  WHERE a.id = assessment_id_param
  GROUP BY a.id, a.title, a.description, a.type, a.visibility, a.created_at;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample free assessments
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES
  ('General Knowledge Quiz', 'A short 5-question general knowledge quiz accessible to everyone', 'quiz', 'public', 'openai', 'gpt-4o-mini', 'Generate a 5-question general-knowledge quiz.'),
  ('Personality Assessment', 'Discover your personality traits through this comprehensive assessment', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a personality assessment with insightful questions.'),
  ('Mindfulness Exploration', 'Explore your mindfulness practices and awareness levels', 'exploration', 'public', 'openai', 'gpt-4o-mini', 'Design a mindfulness exploration with reflective questions.'),
  ('Career Readiness Test', 'Assess your readiness for career advancement and growth', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a career readiness assessment.'),
  ('Emotional Intelligence Quiz', 'Measure your emotional intelligence and social awareness', 'quiz', 'public', 'openai', 'gpt-4o-mini', 'Generate an emotional intelligence quiz.'),
  ('Learning Styles Assessment', 'Identify your preferred learning style and study methods', 'test', 'public', 'openai', 'gpt-4o-mini', 'Create a learning styles assessment.');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- Migration: 20250831001206_core_assessment_system.sql
-- =====================================

-- Core Assessment System
-- Database schema for comprehensive assessment, quiz, exploration, and course management

-- 1. Main assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    ai_provider text,
    ai_model text,
    ai_prompt text,
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
    estimated_duration integer DEFAULT 15, -- minutes
    passing_score numeric DEFAULT 70.0,
    max_attempts integer DEFAULT 3,
    is_featured boolean DEFAULT false,
    category text DEFAULT 'general',
    tags text[] DEFAULT '{}',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 2. Assessment questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image','scale','boolean')),
    position integer NOT NULL,
    media_url text,
    points integer DEFAULT 1,
    explanation text,
    is_required boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_position ON public.assessment_questions(assessment_id, position);

-- 3. Assessment options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    feedback text,
    position integer NOT NULL,
    score_value numeric DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create index
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_options_position ON public.assessment_options(question_id, position);

-- 4. Assessment results table (for signed-in users)
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    visitor_session_id text, -- for anonymous users
    score numeric,
    percentage numeric,
    passed boolean DEFAULT false,
    time_taken integer, -- seconds
    answers jsonb,
    result_data jsonb DEFAULT '{}',
    started_at timestamptz DEFAULT now(),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT assessment_results_user_check CHECK (
        (user_id IS NOT NULL AND visitor_session_id IS NULL) OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
);

-- Enable RLS and create indexes
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_results_user ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment ON public.assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_visitor ON public.assessment_results(visitor_session_id);

-- 5. Assessment attempts table (for tracking multiple attempts)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    visitor_session_id text,
    attempt_number integer NOT NULL DEFAULT 1,
    status text CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    current_question integer DEFAULT 1,
    metadata jsonb DEFAULT '{}',
    CONSTRAINT assessment_attempts_user_check CHECK (
        (user_id IS NOT NULL AND visitor_session_id IS NULL) OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    )
);

-- Enable RLS and create indexes
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_visitor ON public.assessment_attempts(visitor_session_id);

-- 6. Updated trigger for timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to assessments
CREATE TRIGGER assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. RLS Policies

-- Public assessments visible to all (including anonymous users)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Authenticated users can view all assessments they have access to
CREATE POLICY "Users can view accessible assessments"
ON public.assessments
FOR SELECT TO authenticated
USING (visibility = 'public' OR created_by = auth.uid());

-- Admin function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = $1 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can manage all assessments
CREATE POLICY "Admins can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment questions policies
CREATE POLICY "Public assessment questions visible to all"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = assessment_id 
        AND a.visibility = 'public'
    )
);

CREATE POLICY "Users can view accessible assessment questions"
ON public.assessment_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a 
        WHERE a.id = assessment_id 
        AND (a.visibility = 'public' OR a.created_by = auth.uid())
    )
);

CREATE POLICY "Admins can manage assessment questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment options policies
CREATE POLICY "Public assessment options visible to all"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions aq
        JOIN public.assessments a ON a.id = aq.assessment_id
        WHERE aq.id = question_id 
        AND a.visibility = 'public'
    )
);

CREATE POLICY "Users can view accessible assessment options"
ON public.assessment_options
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions aq
        JOIN public.assessments a ON a.id = aq.assessment_id
        WHERE aq.id = question_id 
        AND (a.visibility = 'public' OR a.created_by = auth.uid())
    )
);

CREATE POLICY "Admins can manage assessment options"
ON public.assessment_options
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assessment results policies (users can only see their own results)
CREATE POLICY "Users can view their own results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own results"
ON public.assessment_results
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Visitors can create anonymous results"
ON public.assessment_results
FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Admins can view all results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (is_admin());

-- Assessment attempts policies
CREATE POLICY "Users can manage their own attempts"
ON public.assessment_attempts
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Visitors can create anonymous attempts"
ON public.assessment_attempts
FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Visitors can update their attempts"
ON public.assessment_attempts
FOR UPDATE TO anon
USING (user_id IS NULL AND visitor_session_id IS NOT NULL);

CREATE POLICY "Admins can view all attempts"
ON public.assessment_attempts
FOR SELECT TO authenticated
USING (is_admin());

-- 8. Stored procedure for creating assessments with questions atomically
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
    _title text,
    _description text,
    _type text,
    _visibility text,
    _difficulty text DEFAULT 'intermediate',
    _category text DEFAULT 'general',
    _ai_provider text DEFAULT NULL,
    _ai_model text DEFAULT NULL,
    _ai_prompt text DEFAULT NULL,
    _questions jsonb DEFAULT '[]'::jsonb,
    _created_by uuid DEFAULT auth.uid()
) RETURNS bigint AS $$
DECLARE
    _assessment_id bigint;
    _question_id bigint;
    q jsonb;
    opt jsonb;
    question_position integer := 1;
    option_position integer;
BEGIN
    -- Insert the main assessment
    INSERT INTO public.assessments (
        title, description, type, visibility, difficulty, category,
        ai_provider, ai_model, ai_prompt, created_by
    )
    VALUES (
        _title, _description, _type, _visibility, _difficulty, _category,
        _ai_provider, _ai_model, _ai_prompt, _created_by
    )
    RETURNING id INTO _assessment_id;

    -- Insert questions if provided
    FOR q IN SELECT * FROM jsonb_array_elements(_questions) LOOP
        INSERT INTO public.assessment_questions (
            assessment_id, question_text, question_type, position,
            points, explanation, is_required
        )
        VALUES (
            _assessment_id,
            q->>'question_text',
            COALESCE(q->>'question_type', 'multiple_choice'),
            COALESCE((q->>'position')::integer, question_position),
            COALESCE((q->>'points')::integer, 1),
            q->>'explanation',
            COALESCE((q->>'is_required')::boolean, true)
        )
        RETURNING id INTO _question_id;

        -- Insert options for multiple choice questions
        IF q->>'question_type' = 'multiple_choice' AND q ? 'options' THEN
            option_position := 1;
            FOR opt IN SELECT * FROM jsonb_array_elements(q->'options') LOOP
                INSERT INTO public.assessment_options (
                    question_id, option_text, is_correct, position, feedback, score_value
                )
                VALUES (
                    _question_id,
                    opt->>'option_text',
                    COALESCE((opt->>'is_correct')::boolean, false),
                    COALESCE((opt->>'position')::integer, option_position),
                    opt->>'feedback',
                    COALESCE((opt->>'score_value')::numeric, 0)
                );
                option_position := option_position + 1;
            END LOOP;
        END IF;

        question_position := question_position + 1;
    END LOOP;

    RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_assessment_with_questions TO authenticated;

-- 9. Function to calculate assessment score
CREATE OR REPLACE FUNCTION public.calculate_assessment_score(
    _assessment_id bigint,
    _answers jsonb
) RETURNS jsonb AS $$
DECLARE
    total_points integer := 0;
    earned_points integer := 0;
    total_questions integer := 0;
    correct_answers integer := 0;
    question_record record;
    user_answer text;
    correct_option_id bigint;
    percentage numeric;
    passed boolean;
    passing_score numeric;
BEGIN
    -- Get assessment details
    SELECT assessments.passing_score INTO passing_score
    FROM public.assessments
    WHERE id = _assessment_id;

    -- Calculate score for each question
    FOR question_record IN 
        SELECT q.id, q.points, q.question_type
        FROM public.assessment_questions q
        WHERE q.assessment_id = _assessment_id
        ORDER BY q.position
    LOOP
        total_questions := total_questions + 1;
        total_points := total_points + question_record.points;
        
        -- Get user's answer for this question
        user_answer := _answers->>question_record.id::text;
        
        IF question_record.question_type = 'multiple_choice' THEN
            -- Find the correct option
            SELECT id INTO correct_option_id
            FROM public.assessment_options
            WHERE question_id = question_record.id AND is_correct = true
            LIMIT 1;
            
            -- Check if user's answer matches correct option
            IF user_answer = correct_option_id::text THEN
                earned_points := earned_points + question_record.points;
                correct_answers := correct_answers + 1;
            END IF;
        END IF;
    END LOOP;

    -- Calculate percentage
    IF total_points > 0 THEN
        percentage := (earned_points::numeric / total_points::numeric) * 100;
    ELSE
        percentage := 0;
    END IF;

    -- Determine if passed
    passed := percentage >= COALESCE(passing_score, 70);

    RETURN jsonb_build_object(
        'total_points', total_points,
        'earned_points', earned_points,
        'total_questions', total_questions,
        'correct_answers', correct_answers,
        'percentage', percentage,
        'passed', passed,
        'score_breakdown', _answers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_assessment_score TO authenticated, anon;

-- 10. Insert sample free assessments
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, estimated_duration) VALUES
('Personal Growth Assessment', 'Discover your current stage in personal development and identify areas for growth.', 'quiz', 'public', 'beginner', 'growth', 15),
('Wellness Check-Up', 'Evaluate your overall wellness across physical, mental, and emotional dimensions.', 'quiz', 'public', 'beginner', 'wellness', 12),
('Communication Style Quiz', 'Understand your natural communication patterns and how to improve them.', 'quiz', 'public', 'intermediate', 'relationships', 10),
('Stress Management Assessment', 'Learn about your stress patterns and discover effective coping strategies.', 'quiz', 'public', 'beginner', 'wellness', 8),
('Career Alignment Check', 'Explore how well your current path aligns with your values and interests.', 'quiz', 'public', 'intermediate', 'career', 18),
('Mindfulness Awareness Test', 'Assess your present-moment awareness and mindfulness practices.', 'quiz', 'public', 'beginner', 'spirituality', 10);

-- Add sample questions for the Personal Growth Assessment
WITH growth_assessment AS (
    SELECT id FROM public.assessments WHERE title = 'Personal Growth Assessment' LIMIT 1
)
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, points)
SELECT 
    ga.id,
    unnest(ARRAY[
        'How often do you actively seek feedback on your personal development?',
        'When faced with challenges, your typical response is to:',
        'How comfortable are you with stepping outside your comfort zone?',
        'Your approach to setting personal goals is:',
        'How do you typically handle setbacks or failures?'
    ]),
    'multiple_choice',
    generate_series(1, 5),
    1
FROM growth_assessment ga;

-- Add options for the first question
WITH first_question AS (
    SELECT q.id FROM public.assessment_questions q
    JOIN public.assessments a ON a.id = q.assessment_id
    WHERE a.title = 'Personal Growth Assessment' AND q.position = 1
)
INSERT INTO public.assessment_options (question_id, option_text, is_correct, position, score_value)
SELECT 
    fq.id,
    unnest(ARRAY[
        'Rarely - I prefer to figure things out on my own',
        'Sometimes - when I remember to ask',
        'Often - I regularly seek input from trusted sources',
        'Always - I actively create opportunities for feedback'
    ]),
    unnest(ARRAY[false, false, true, true]),
    generate_series(1, 4),
    unnest(ARRAY[0, 1, 2, 3])
FROM first_question fq;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_visibility ON public.assessments(visibility);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_category ON public.assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_featured ON public.assessments(is_featured) WHERE is_featured = true;

-- Function to generate visitor session ID
CREATE OR REPLACE FUNCTION public.generate_visitor_session()
RETURNS text AS $$
BEGIN
    RETURN 'visitor_' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.generate_visitor_session TO anon, authenticated;


-- =====================================
-- Migration: 20250831010000_comprehensive_personality_assessments.sql
-- =====================================

-- Comprehensive Personality Assessments for Free Discovery
-- 6 AI-powered personality assessments (10-15 questions each) for visitors

-- Create Core Personality Discovery Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Core Personality Discovery',
    'Uncover your authentic personality type with this comprehensive assessment. Discover your natural tendencies, communication style, and core motivations to better understand yourself and others.',
    'test',
    'public',
    'intermediate',
    'personality',
    'openai',
    'gpt-4o-mini',
    'Generate personality assessment questions that help users discover their core personality traits across multiple dimensions including extroversion/introversion, sensing/intuition, thinking/feeling, and judging/perceiving.',
    15,
    true
);

-- Get the assessment ID
WITH assessment AS (
    SELECT id FROM public.assessments WHERE title = 'Core Personality Discovery' ORDER BY created_at DESC LIMIT 1
)

-- Insert questions for Core Personality Discovery
INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position, explanation)
SELECT
    a.id,
    q.question_text,
    q.question_type,
    q.position,
    q.explanation
FROM assessment a
CROSS JOIN (
    VALUES
    ('In social situations, you typically feel most energized when:', 'multiple_choice', 1, 'This question helps identify your energy source preference.'),
    ('When processing information, you naturally focus on:', 'multiple_choice', 2, 'Reveals your information processing style.'),
    ('Your ideal work environment would be:', 'multiple_choice', 3, 'Shows your preferred work style and environment.'),
    ('When making important decisions, you primarily rely on:', 'multiple_choice', 4, 'Identifies your decision-making approach.'),
    ('In conversations, you tend to focus on:', 'multiple_choice', 5, 'Shows your communication style preferences.'),
    ('When learning something new, you prefer to:', 'multiple_choice', 6, 'Reveals your learning style preference.'),
    ('Your natural approach to planning is:', 'multiple_choice', 7, 'Shows your planning and organization style.'),
    ('When faced with conflict, your typical response is:', 'multiple_choice', 8, 'Reveals your conflict resolution style.'),
    ('You feel most productive when:', 'multiple_choice', 9, 'Shows your productivity preferences.'),
    ('Your ideal weekend involves:', 'multiple_choice', 10, 'Reveals your leisure and relaxation preferences.'),
    ('When solving problems, you typically:', 'multiple_choice', 11, 'Shows your problem-solving approach.'),
    ('You trust information that is:', 'multiple_choice', 12, 'Reveals your information trust preferences.'),
    ('In group settings, you naturally:', 'multiple_choice', 13, 'Shows your group interaction style.'),
    ('Your approach to change is typically:', 'multiple_choice', 14, 'Reveals your adaptability to change.'),
    ('You feel most authentic when:', 'multiple_choice', 15, 'Shows when you feel most true to yourself.')
) AS q(question_text, question_type, position, explanation);

-- Insert options for each question
-- Question 1 options
WITH question AS (
    SELECT id FROM public.assessment_questions
    WHERE assessment_id = (SELECT id FROM public.assessments WHERE title = 'Core Personality Discovery' ORDER BY created_at DESC LIMIT 1)
    AND position = 1
)
INSERT INTO public.assessment_options (question_id, option_text, is_correct, position, score_value, feedback)
SELECT
    q.id,
    o.option_text,
    o.is_correct,
    o.position,
    o.score_value,
    o.feedback
FROM question q
CROSS JOIN (
    VALUES
    ('Engaging with many different people', false, 1, 3, 'Suggests extroverted energy preference'),
    ('Having deep conversations with a few close friends', false, 2, 2, 'Indicates balanced social energy'),
    ('Observing quietly and recharging alone', false, 3, 1, 'Suggests introverted energy preference'),
    ('Organizing activities and bringing people together', false, 4, 2, 'Shows leadership-oriented energy')
) AS o(option_text, is_correct, position, score_value, feedback);

-- Continue with options for other questions...

-- Create Emotional Intelligence Profile Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Emotional Intelligence Profile',
    'Discover your emotional intelligence strengths and areas for growth. This assessment evaluates your self-awareness, empathy, emotional regulation, and social skills.',
    'test',
    'public',
    'intermediate',
    'emotional_intelligence',
    'openai',
    'gpt-4o-mini',
    'Generate emotional intelligence assessment questions covering self-awareness, self-regulation, empathy, motivation, and social skills.',
    12,
    true
);

-- Create Communication Style Analysis Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Communication Style Analysis',
    'Understand your natural communication patterns and learn how to adapt your style for better relationships and effectiveness.',
    'test',
    'public',
    'intermediate',
    'communication',
    'openai',
    'gpt-4o-mini',
    'Generate communication style assessment questions covering verbal and non-verbal communication, listening skills, and interpersonal effectiveness.',
    10,
    true
);

-- Create Stress Response Patterns Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Stress Response Patterns',
    'Discover how you naturally respond to stress and learn effective coping strategies tailored to your personality.',
    'test',
    'public',
    'intermediate',
    'wellness',
    'openai',
    'gpt-4o-mini',
    'Generate stress response assessment questions covering coping mechanisms, resilience, and stress management techniques.',
    12,
    true
);

-- Create Relationship Style Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Relationship Style Assessment',
    'Explore your attachment style and relationship patterns to build healthier, more fulfilling connections.',
    'test',
    'public',
    'intermediate',
    'relationships',
    'openai',
    'gpt-4o-mini',
    'Generate relationship style assessment questions covering attachment patterns, communication in relationships, and interpersonal dynamics.',
    14,
    true
);

-- Create Life Purpose Alignment Assessment
INSERT INTO public.assessments (title, description, type, visibility, difficulty, category, ai_provider, ai_model, ai_prompt, estimated_duration, is_featured)
VALUES (
    'Life Purpose Alignment',
    'Discover what truly motivates you and aligns with your core values to find greater meaning and fulfillment.',
    'test',
    'public',
    'intermediate',
    'purpose',
    'openai',
    'gpt-4o-mini',
    'Generate life purpose assessment questions covering values, motivations, strengths, and meaning-seeking behaviors.',
    15,
    true
);

-- Create function for AI-powered personality analysis
CREATE OR REPLACE FUNCTION public.analyze_personality_profile(
    assessment_id bigint,
    user_answers jsonb
) RETURNS jsonb AS $$
DECLARE
    profile_result jsonb;
BEGIN
    -- This function would use AI to analyze the personality profile
    -- For now, return a placeholder result structure
    profile_result := jsonb_build_object(
        'personality_type', 'INFP',
        'strengths', jsonb_build_array('Empathetic', 'Creative', 'Idealistic', 'Authentic'),
        'growth_areas', jsonb_build_array('Setting boundaries', 'Practical planning', 'Dealing with criticism'),
        'compatibility', jsonb_build_object(
            'best_matches', jsonb_build_array('ENFJ', 'ENTJ'),
            'challenging_matches', jsonb_build_array('ESTJ', 'ISTJ')
        ),
        'career_suggestions', jsonb_build_array('Counseling', 'Writing', 'Arts', 'Education'),
        'relationship_advice', 'Focus on finding partners who appreciate your depth and authenticity',
        'personal_growth_tips', 'Develop practical organizational skills while maintaining your creative spirit'
    );

    RETURN profile_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.analyze_personality_profile TO authenticated, anon;

-- Add RLS policy for anonymous assessment taking
CREATE POLICY "Anonymous users can take public assessments"
ON public.assessment_attempts
FOR INSERT TO anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments
        WHERE id = assessment_id
        AND visibility = 'public'
    )
    AND user_id IS NULL
    AND visitor_session_id IS NOT NULL
);

CREATE POLICY "Anonymous users can submit public assessment results"
ON public.assessment_results
FOR INSERT TO anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments
        WHERE id = assessment_id
        AND visibility = 'public'
    )
    AND user_id IS NULL
    AND visitor_session_id IS NOT NULL
);


-- =====================================
-- Migration: 20250831010001_seed_public_assessments.sql
-- =====================================

-- Seed 6 public assessments that don't require signup

-- Emotional Intelligence Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Emotional Intelligence Assessment',
  'Discover your emotional intelligence strengths and areas for growth. This assessment explores your ability to understand and manage emotions.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on emotional intelligence traits and skills'
);

-- Get the ID of the just inserted assessment
DO $$
DECLARE
  ei_assessment_id bigint;
BEGIN
  SELECT id INTO ei_assessment_id FROM public.assessments WHERE title = 'Emotional Intelligence Assessment';
  
  -- Insert questions for Emotional Intelligence Assessment
  INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, question_order) VALUES
  (ei_assessment_id, 'When someone criticizes your work, how do you typically respond?', 'multiple_choice', 1),
  (ei_assessment_id, 'You notice a colleague seems upset. What is your first instinct?', 'multiple_choice', 2),
  (ei_assessment_id, 'During a stressful situation, you tend to:', 'multiple_choice', 3),
  (ei_assessment_id, 'When making important decisions, you rely most on:', 'multiple_choice', 4),
  (ei_assessment_id, 'In social situations, you typically:', 'multiple_choice', 5),
  (ei_assessment_id, 'When someone disagrees with you, you:', 'multiple_choice', 6),
  (ei_assessment_id, 'Your approach to handling conflict is to:', 'multiple_choice', 7),
  (ei_assessment_id, 'When you make a mistake, you typically:', 'multiple_choice', 8),
  (ei_assessment_id, 'You find it easiest to motivate yourself by:', 'multiple_choice', 9),
  (ei_assessment_id, 'When others are emotional, you tend to:', 'multiple_choice', 10),
  (ei_assessment_id, 'Your leadership style is best described as:', 'multiple_choice', 11),
  (ei_assessment_id, 'When receiving feedback, you:', 'multiple_choice', 12),
  (ei_assessment_id, 'In team settings, you naturally:', 'multiple_choice', 13),
  (ei_assessment_id, 'When facing a challenge, your first thought is:', 'multiple_choice', 14),
  (ei_assessment_id, 'You handle change by:', 'multiple_choice', 15);

  -- Insert options for each question
  INSERT INTO public.assessment_options (question_id, option_text, option_order, scoring_value) VALUES
  -- Q1 options
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Take it personally and feel defensive', 1, 1),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Listen carefully and ask clarifying questions', 2, 4),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Dismiss it if it seems unfair', 3, 2),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 1), 'Thank them and consider the feedback thoughtfully', 4, 3),
  
  -- Q2 options
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Give them space unless they ask for help', 1, 2),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Approach them with empathy and offer support', 2, 4),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Try to cheer them up with humor', 3, 1),
  ((SELECT id FROM public.assessment_questions WHERE assessment_id = ei_assessment_id AND question_order = 2), 'Ask directly what''s wrong and how to help', 4, 3);

END $$;

-- Leadership Style Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Leadership Style Assessment',
  'Identify your natural leadership approach and communication style. Understand how you influence and guide others.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on leadership styles and approaches'
);

-- Stress Management Quiz
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Stress Management Knowledge Quiz',
  'Test your knowledge of effective stress management techniques and discover new strategies for maintaining wellbeing.',
  'quiz',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated quiz on stress management techniques and knowledge'
);

-- Communication Patterns Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Communication Patterns Assessment',
  'Understand how you naturally communicate and connect with others. Discover your communication strengths and blind spots.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on communication styles and patterns'
);

-- Personal Values Assessment
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Personal Values Assessment',
  'Explore your core values and what drives your decisions. Align your actions with what matters most to you.',
  'personality',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated assessment on personal values and motivations'
);

-- Mindfulness & Wellbeing Quiz
INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES (
  'Mindfulness & Wellbeing Quiz',
  'Assess your current mindfulness practices and wellbeing habits. Learn evidence-based approaches to mental wellness.',
  'quiz',
  'public',
  'openai',
  'gpt-4o-mini',
  'Generated quiz on mindfulness practices and wellbeing knowledge'
);

-- =====================================
-- Migration: 20250831010002_seed_user_assessments.sql
-- =====================================

-- Seed 20+ user assessments that require login

INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt) VALUES
-- Career & Professional Development
('Career Clarity Assessment', 'Discover your ideal career path and professional strengths. Understand what drives your career satisfaction and success.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on career clarity and professional direction'),
('Professional Development Roadmap', 'Identify your key areas for professional growth and create a personalized development plan.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on professional development needs'),
('Work-Life Balance Assessment', 'Evaluate your current work-life balance and discover strategies for better integration and wellbeing.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on work-life balance patterns'),
('Leadership Potential Assessment', 'Explore your leadership capabilities and identify areas for leadership development.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on leadership potential and skills'),

-- Relationships & Social
('Relationship Patterns Assessment', 'Understand your patterns in relationships and discover how to build healthier connections.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on relationship dynamics and patterns'),
('Social Connection Style', 'Discover how you naturally connect with others and your social communication preferences.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on social connection and interaction styles'),
('Conflict Resolution Style', 'Learn about your natural approach to handling conflicts and disagreements.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on conflict resolution approaches'),
('Communication in Relationships', 'Assess your communication patterns in close relationships and romantic partnerships.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on relationship communication styles'),

-- Personal Growth & Psychology
('Personal Growth Readiness', 'Evaluate your readiness for personal transformation and identify your growth motivations.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal growth mindset and readiness'),
('Self-Compassion Assessment', 'Discover your relationship with yourself and learn to develop greater self-kindness.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on self-compassion and self-relationship'),
('Personal Boundaries Assessment', 'Evaluate your ability to set and maintain healthy boundaries in all areas of life.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal boundaries and boundary-setting'),
('Resilience & Recovery Assessment', 'Assess your resilience patterns and discover strategies for bouncing back from challenges.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on resilience and recovery patterns'),
('Life Satisfaction Assessment', 'Evaluate your overall life satisfaction and identify areas for improvement and growth.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on life satisfaction and fulfillment'),

-- Productivity & Habits
('Productivity Style Assessment', 'Discover your natural productivity patterns and optimize your work approach.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on productivity styles and preferences'),
('Time Management Style', 'Understand how you naturally approach time and discover better time management strategies.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on time management approaches'),
('Goal Setting & Achievement', 'Assess your approach to setting and achieving goals, and develop better goal strategies.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on goal-setting and achievement patterns'),
('Habit Formation Assessment', 'Understand how you naturally build habits and break unwanted patterns.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on habit formation and change'),

-- Psychology & Mindset
('Financial Mindset Assessment', 'Explore your beliefs and behaviors around money and financial decision-making.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on financial psychology and money mindset'),
('Decision Making Process', 'Discover your natural decision-making style and learn to make better choices.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on decision-making processes and styles'),
('Adaptability & Change Assessment', 'Evaluate how you handle change and uncertainty, and develop greater adaptability.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on adaptability and change management'),
('Motivation Drivers Assessment', 'Understand what truly motivates you and how to harness your intrinsic motivations.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on personal motivation and drivers'),

-- Creativity & Learning
('Creativity & Innovation Style', 'Discover your creative strengths and learn to enhance your innovative thinking.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on creativity and innovation patterns'),
('Learning Style Assessment', 'Understand how you naturally learn and process information for better knowledge retention.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on learning preferences and styles'),

-- Wellness & Mental Health
('Mental Health & Wellbeing Check', 'Assess your current mental health status and identify areas for wellbeing improvement.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on mental health and wellbeing indicators'),
('Energy Management Assessment', 'Discover your energy patterns and learn to manage your physical and mental energy better.', 'personality', 'private', 'openai', 'gpt-4o-mini', 'Generated assessment on energy management and optimization');

-- =====================================
-- Migration: 20250831021406_voice_agent_config.sql
-- =====================================

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


-- =====================================
-- Migration: 20250901120000_fix_voice_agent_configs.sql
-- =====================================

-- Fix voice_agent_configs table
DROP TABLE IF EXISTS public.voice_agent_configs CASCADE;

CREATE TABLE public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
    voice TEXT NOT NULL DEFAULT 'alloy',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default config
INSERT INTO public.voice_agent_configs (
    name, provider, model, voice, temperature, instructions, is_active
) VALUES (
    'Default Voice Agent',
    'openai',
    'gpt-4o-realtime-preview-2024-10-01',
    'alloy',
    0.70,
    'You are a helpful AI assistant.',
    true
);

-- Enable RLS
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access" ON public.voice_agent_configs
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Allow admin write access" ON public.voice_agent_configs
    FOR ALL TO authenticated
    USING (true);

-- Grant permissions
GRANT SELECT ON public.voice_agent_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_agent_configs TO authenticated;

-- =====================================
-- Migration: 20250901130000_complete_assessment_system.sql
-- =====================================

-- Complete Assessment System Migration
-- Based on reference.md requirements

-- Drop existing tables if they exist (cascade to handle dependencies)
DROP TABLE IF EXISTS public.assessment_results CASCADE;
DROP TABLE IF EXISTS public.assessment_options CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;

-- Create assessments table (master record)
CREATE TABLE public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'intermediate',
    category text DEFAULT 'general',
    ai_provider text,
    ai_model text,
    ai_prompt text,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_questions table
CREATE TABLE public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image')),
    position integer NOT NULL,
    points integer DEFAULT 1,
    explanation text,
    media_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_options table
CREATE TABLE public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    position integer NOT NULL,
    score_value integer DEFAULT 0,
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create assessment_results table (for signed-in users)
CREATE TABLE public.assessment_results (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    score numeric,
    total_points integer,
    percentage numeric,
    answers jsonb,
    time_taken integer, -- in seconds
    completed boolean DEFAULT false,
    submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Create admin_logs table for tracking AI generation
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_assessments_visibility ON public.assessments(visibility);
CREATE INDEX idx_assessments_type ON public.assessments(type);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);
CREATE INDEX idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX idx_questions_position ON public.assessment_questions(assessment_id, position);
CREATE INDEX idx_options_question ON public.assessment_options(question_id);
CREATE INDEX idx_options_position ON public.assessment_options(question_id, position);
CREATE INDEX idx_results_user ON public.assessment_results(user_id);
CREATE INDEX idx_results_assessment ON public.assessment_results(assessment_id);
CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id);

-- Enable RLS on all tables
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public assessments visible to all (including anonymous users)
CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

-- Admin can manage all assessments
CREATE POLICY "Admin can manage assessments"
ON public.assessments
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Users can view their own private assessments
CREATE POLICY "Users can view own assessments"
ON public.assessments
FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Assessment questions: visible based on assessment visibility
CREATE POLICY "Questions visible for accessible assessments"
ON public.assessment_questions
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments 
        WHERE assessments.id = assessment_questions.assessment_id 
        AND (
            assessments.visibility = 'public' 
            OR assessments.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        )
    )
);

-- Admin can manage all questions
CREATE POLICY "Admin can manage questions"
ON public.assessment_questions
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Assessment options: visible based on question/assessment visibility
CREATE POLICY "Options visible for accessible questions"
ON public.assessment_options
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_questions q
        JOIN public.assessments a ON q.assessment_id = a.id
        WHERE q.id = assessment_options.question_id 
        AND (
            a.visibility = 'public' 
            OR a.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        )
    )
);

-- Admin can manage all options
CREATE POLICY "Admin can manage options"
ON public.assessment_options
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Assessment results: users can only see their own results
CREATE POLICY "Users can manage own results"
ON public.assessment_results
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all results
CREATE POLICY "Admin can view all results"
ON public.assessment_results
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Admin logs: only admins can access
CREATE POLICY "Admin logs access"
ON public.admin_logs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Grant permissions
GRANT SELECT ON public.assessments TO anon;
GRANT SELECT ON public.assessment_questions TO anon;
GRANT SELECT ON public.assessment_options TO anon;
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;
GRANT ALL ON public.admin_logs TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessments updated_at
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================
-- Migration: 20250901130001_assessment_stored_procedures.sql
-- =====================================

-- Stored Procedures for Assessment System

-- Function to create assessment with questions atomically
CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _difficulty text DEFAULT 'intermediate',
  _category text DEFAULT 'general',
  _ai_provider text DEFAULT NULL,
  _ai_model text DEFAULT NULL,
  _ai_prompt text DEFAULT NULL,
  _questions jsonb DEFAULT '[]'::jsonb,
  _created_by uuid DEFAULT auth.uid()
) RETURNS bigint AS $$
DECLARE
  _assessment_id bigint;
  _question jsonb;
  _question_id bigint;
  _option jsonb;
BEGIN
  -- Insert the assessment
  INSERT INTO public.assessments (
    title, 
    description, 
    type, 
    visibility, 
    difficulty, 
    category, 
    ai_provider, 
    ai_model, 
    ai_prompt, 
    created_by
  )
  VALUES (
    _title, 
    _description, 
    _type, 
    _visibility, 
    _difficulty, 
    _category, 
    _ai_provider, 
    _ai_model, 
    _ai_prompt, 
    _created_by
  )
  RETURNING id INTO _assessment_id;

  -- Process questions if provided
  IF _questions IS NOT NULL AND jsonb_array_length(_questions) > 0 THEN
    FOR _question IN SELECT * FROM jsonb_array_elements(_questions) LOOP
      -- Insert question
      INSERT INTO public.assessment_questions (
        assessment_id,
        question_text,
        question_type,
        position,
        points,
        explanation
      )
      VALUES (
        _assessment_id,
        _question->>'question_text',
        COALESCE(_question->>'question_type', 'multiple_choice'),
        COALESCE((_question->>'position')::int, 1),
        COALESCE((_question->>'points')::int, 1),
        _question->>'explanation'
      )
      RETURNING id INTO _question_id;

      -- Process options if this is a multiple choice question
      IF (_question->>'question_type' = 'multiple_choice' OR _question->>'question_type' IS NULL)
         AND _question->'options' IS NOT NULL 
         AND jsonb_array_length(_question->'options') > 0 THEN
        
        FOR _option IN SELECT * FROM jsonb_array_elements(_question->'options') LOOP
          INSERT INTO public.assessment_options (
            question_id,
            option_text,
            is_correct,
            position,
            score_value,
            feedback
          )
          VALUES (
            _question_id,
            _option->>'option_text',
            COALESCE((_option->>'is_correct')::boolean, false),
            COALESCE((_option->>'position')::int, 1),
            COALESCE((_option->>'score_value')::int, 0),
            _option->>'feedback'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN _assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate assessment results
CREATE OR REPLACE FUNCTION public.calculate_assessment_score(
  _user_id uuid,
  _assessment_id bigint,
  _answers jsonb
) RETURNS jsonb AS $$
DECLARE
  _total_points integer := 0;
  _earned_points integer := 0;
  _question_count integer := 0;
  _correct_count integer := 0;
  _question record;
  _user_answer jsonb;
  _correct_option_id bigint;
  _question_points integer;
  _result jsonb;
BEGIN
  -- Get all questions for this assessment
  FOR _question IN 
    SELECT q.id, q.question_text, q.question_type, q.points,
           array_agg(
             jsonb_build_object(
               'id', o.id,
               'text', o.option_text,
               'is_correct', o.is_correct,
               'score_value', o.score_value
             ) ORDER BY o.position
           ) as options
    FROM public.assessment_questions q
    LEFT JOIN public.assessment_options o ON q.id = o.question_id
    WHERE q.assessment_id = _assessment_id
    GROUP BY q.id, q.question_text, q.question_type, q.points
    ORDER BY q.position
  LOOP
    _question_count := _question_count + 1;
    _question_points := COALESCE(_question.points, 1);
    _total_points := _total_points + _question_points;
    
    -- Get user's answer for this question
    _user_answer := _answers->(_question.id::text);
    
    IF _user_answer IS NOT NULL THEN
      -- For multiple choice questions
      IF _question.question_type = 'multiple_choice' THEN
        -- Check if the selected option is correct
        SELECT o.id INTO _correct_option_id
        FROM jsonb_array_elements(_question.options) AS option_data
        CROSS JOIN LATERAL (
          SELECT (option_data->>'id')::bigint as id, 
                 (option_data->>'is_correct')::boolean as is_correct
        ) AS o
        WHERE o.id = (_user_answer->>'option_id')::bigint AND o.is_correct = true;
        
        IF _correct_option_id IS NOT NULL THEN
          _earned_points := _earned_points + _question_points;
          _correct_count := _correct_count + 1;
        END IF;
      END IF;
      -- Note: Free text questions would need manual scoring or AI evaluation
    END IF;
  END LOOP;
  
  -- Calculate percentage
  _result := jsonb_build_object(
    'total_questions', _question_count,
    'correct_count', _correct_count,
    'total_points', _total_points,
    'earned_points', _earned_points,
    'percentage', CASE 
      WHEN _total_points > 0 THEN ROUND((_earned_points::numeric / _total_points::numeric) * 100, 2)
      ELSE 0
    END,
    'passed', CASE 
      WHEN _total_points > 0 THEN (_earned_points::numeric / _total_points::numeric) >= 0.7
      ELSE false
    END
  );
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit assessment results
CREATE OR REPLACE FUNCTION public.submit_assessment_result(
  _user_id uuid,
  _assessment_id bigint,
  _answers jsonb,
  _time_taken integer DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  _score_data jsonb;
  _result_id bigint;
BEGIN
  -- Calculate the score
  _score_data := public.calculate_assessment_score(_user_id, _assessment_id, _answers);
  
  -- Insert the result
  INSERT INTO public.assessment_results (
    user_id,
    assessment_id,
    score,
    total_points,
    percentage,
    answers,
    time_taken,
    completed
  )
  VALUES (
    _user_id,
    _assessment_id,
    (_score_data->>'earned_points')::numeric,
    (_score_data->>'total_points')::integer,
    (_score_data->>'percentage')::numeric,
    _answers,
    _time_taken,
    true
  )
  RETURNING id INTO _result_id;
  
  -- Return the complete result
  RETURN _score_data || jsonb_build_object('result_id', _result_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assessment with questions and options
CREATE OR REPLACE FUNCTION public.get_assessment_complete(
  _assessment_id bigint
) RETURNS jsonb AS $$
DECLARE
  _assessment record;
  _questions jsonb := '[]'::jsonb;
  _result jsonb;
BEGIN
  -- Get assessment details
  SELECT * INTO _assessment
  FROM public.assessments
  WHERE id = _assessment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;
  
  -- Get questions with options
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_text', q.question_text,
      'question_type', q.question_type,
      'position', q.position,
      'points', q.points,
      'explanation', q.explanation,
      'media_url', q.media_url,
      'options', COALESCE(q.options, '[]'::jsonb)
    ) ORDER BY q.position
  ) INTO _questions
  FROM (
    SELECT q.*,
           CASE 
             WHEN q.question_type = 'multiple_choice' THEN
               (SELECT jsonb_agg(
                 jsonb_build_object(
                   'id', o.id,
                   'option_text', o.option_text,
                   'position', o.position
                   -- Note: is_correct is not included for security
                 ) ORDER BY o.position
               )
               FROM public.assessment_options o
               WHERE o.question_id = q.id)
             ELSE '[]'::jsonb
           END as options
    FROM public.assessment_questions q
    WHERE q.assessment_id = _assessment_id
  ) q;
  
  -- Build complete result
  _result := jsonb_build_object(
    'id', _assessment.id,
    'title', _assessment.title,
    'description', _assessment.description,
    'type', _assessment.type,
    'difficulty', _assessment.difficulty,
    'category', _assessment.category,
    'created_at', _assessment.created_at,
    'questions', COALESCE(_questions, '[]'::jsonb)
  );
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- Migration: 20250901130002_seed_free_assessments.sql
-- =====================================

-- Seed Free Assessments
-- Create 6 free public assessments as specified in reference.md

-- Assessment 1: Personal Growth Quiz
SELECT public.create_assessment_with_questions(
  'Personal Growth Journey Quiz',
  'Discover your current stage in personal development and get insights into areas for growth and self-improvement.',
  'quiz',
  'public',
  'beginner',
  'personal development',
  'openai',
  'gpt-4o-mini',
  'Personal growth assessment for women',
  '[
    {
      "question_text": "What motivates you most in your personal growth journey?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your motivation helps identify the most effective growth strategies for you.",
      "options": [
        {
          "option_text": "Achieving specific goals and milestones",
          "is_correct": false,
          "position": 1,
          "score_value": 1
        },
        {
          "option_text": "Building deeper self-awareness and understanding",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Overcoming past challenges and limitations",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "Creating positive impact on others",
          "is_correct": false,
          "position": 4,
          "score_value": 1
        }
      ]
    },
    {
      "question_text": "How do you typically respond to setbacks or challenges?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Your response to challenges reveals your resilience and growth mindset.",
      "options": [
        {
          "option_text": "I get discouraged and need time to recover",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "I analyze what went wrong and make adjustments",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "I seek support from others to help me through",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "I try to avoid similar situations in the future",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 2: Emotional Intelligence Quiz  
SELECT public.create_assessment_with_questions(
  'Emotional Intelligence Assessment',
  'Evaluate your ability to understand and manage emotions, both your own and others, in various life situations.',
  'quiz',
  'public',
  'intermediate',
  'emotional intelligence',
  'openai',
  'gpt-4o-mini',
  'Emotional intelligence assessment for women',
  '[
    {
      "question_text": "When you feel overwhelmed, what is your first instinct?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "How you handle overwhelm shows your emotional regulation skills.",
      "options": [
        {
          "option_text": "Push through and keep going",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "Take a step back and assess the situation",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Seek immediate help from others",
          "is_correct": false,
          "position": 3,
          "score_value": 1
        },
        {
          "option_text": "Withdraw and avoid the situation",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 3: Relationship Patterns Quiz
SELECT public.create_assessment_with_questions(
  'Relationship Patterns Quiz',
  'Understand your relationship patterns, communication style, and areas for improvement in personal connections.',
  'quiz',
  'public',
  'intermediate',
  'relationships',
  'openai',
  'gpt-4o-mini',
  'Relationship patterns assessment',
  '[
    {
      "question_text": "In conflicts, you tend to:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your conflict style affects all your relationships.",
      "options": [
        {
          "option_text": "Avoid confrontation at all costs",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "Address issues directly but respectfully",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "Wait for the other person to bring it up",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Get emotional and reactive",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 4: Self-Care Assessment
SELECT public.create_assessment_with_questions(
  'Self-Care Assessment',
  'Evaluate how well you take care of your physical, mental, and emotional needs in your daily life.',
  'quiz',
  'public',
  'beginner',
  'wellness',
  'openai',
  'gpt-4o-mini',
  'Self-care assessment for women',
  '[
    {
      "question_text": "How often do you engage in activities that truly rejuvenate you?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular self-care is essential for mental and emotional well-being.",
      "options": [
        {
          "option_text": "Daily - it is a priority for me",
          "is_correct": true,
          "position": 1,
          "score_value": 2
        },
        {
          "option_text": "Weekly - when I remember",
          "is_correct": false,
          "position": 2,
          "score_value": 1
        },
        {
          "option_text": "Monthly - when I have time",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Rarely - I feel guilty taking time for myself",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- Assessment 5: Life Purpose Explorer
SELECT public.create_assessment_with_questions(
  'Life Purpose Explorer',
  'Discover insights about your core values, passions, and what gives your life meaning and direction.',
  'exploration',
  'public',
  'intermediate',
  'purpose',
  'openai',
  'gpt-4o-mini',
  'Life purpose exploration for women',
  '[
    {
      "question_text": "When you imagine your ideal life 5 years from now, what aspect excites you most?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "This question helps identify what truly matters to you and where your passion lies."
    },
    {
      "question_text": "What activities make you lose track of time because you enjoy them so much?",
      "question_type": "free_text",
      "position": 2,
      "explanation": "Flow states often indicate areas where your natural talents and interests align."
    }
  ]'::jsonb
);

-- Assessment 6: Confidence Builder Quiz
SELECT public.create_assessment_with_questions(
  'Confidence Builder Assessment',
  'Identify your confidence strengths and areas where you can build more self-assurance and empowerment.',
  'quiz',
  'public',
  'beginner',
  'confidence',
  'openai',
  'gpt-4o-mini',
  'Confidence assessment for women',
  '[
    {
      "question_text": "When faced with a new challenge, your inner voice typically says:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your inner dialogue greatly influences your confidence and willingness to take on challenges.",
      "options": [
        {
          "option_text": "I can learn and figure this out",
          "is_correct": true,
          "position": 1,
          "score_value": 2
        },
        {
          "option_text": "This might be too difficult for me",
          "is_correct": false,
          "position": 2,
          "score_value": 0
        },
        {
          "option_text": "I should wait until I am more prepared",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "Others are better suited for this than me",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    },
    {
      "question_text": "How do you typically celebrate your achievements?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Celebrating wins, both big and small, helps build lasting confidence.",
      "options": [
        {
          "option_text": "I acknowledge them briefly then move on",
          "is_correct": false,
          "position": 1,
          "score_value": 1
        },
        {
          "option_text": "I share them with people who matter to me",
          "is_correct": true,
          "position": 2,
          "score_value": 2
        },
        {
          "option_text": "I downplay them - anyone could have done it",
          "is_correct": false,
          "position": 3,
          "score_value": 0
        },
        {
          "option_text": "I rarely take time to acknowledge achievements",
          "is_correct": false,
          "position": 4,
          "score_value": 0
        }
      ]
    }
  ]'::jsonb
);

-- =====================================
-- Migration: 20250901140000_production_ready_tables.sql
-- =====================================

-- Production Ready Tables Migration
-- Adds missing tables and functions for full functionality

-- Voice Sessions Table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Content Moderation Table
CREATE TABLE IF NOT EXISTS public.content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'assessment')),
    content_id UUID NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Analytics Table
CREATE TABLE IF NOT EXISTS public.post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
ADD COLUMN IF NOT EXISTS personality_type TEXT,
ADD COLUMN IF NOT EXISTS latest_assessment_score INTEGER,
ADD COLUMN IF NOT EXISTS last_assessment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated BOOLEAN DEFAULT FALSE;

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS moderated BOOLEAN DEFAULT FALSE;

-- Functions for post interactions
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.community_posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.community_posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.community_posts 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Voice Sessions Policies
CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- System Settings Policies (Admin only)
CREATE POLICY "Admins can view system settings" ON public.system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can modify system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin Logs Policies (Admin only)
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create admin logs" ON public.admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Content Moderation Policies
CREATE POLICY "Moderators can view moderation queue" ON public.content_moderation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Moderators can update moderation items" ON public.content_moderation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- Post Likes Policies
CREATE POLICY "Anyone can view post likes" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Post Comments Policies
CREATE POLICY "Anyone can view non-hidden comments" ON public.post_comments
    FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON public.admin_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON public.content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category)
VALUES 
    ('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode', 'system'),
    ('max_upload_size', '10485760'::jsonb, 'Maximum file upload size in bytes', 'limits'),
    ('session_timeout', '3600'::jsonb, 'Session timeout in seconds', 'security'),
    ('enable_registrations', 'true'::jsonb, 'Allow new user registrations', 'auth'),
    ('require_email_verification', 'true'::jsonb, 'Require email verification for new users', 'auth')
ON CONFLICT (key) DO NOTHING;

-- =====================================
-- Migration: 20250901150000_create_admin_ai_providers.sql
-- =====================================

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

-- =====================================
-- Migration: 20250901160000_add_avatar_url_to_profiles.sql
-- =====================================

-- Add avatar_url column to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;



-- =====================================
-- Migration: 20250901161000_update_voice_agent_default_model.sql
-- =====================================

-- Ensure default model is chat-capable in voice_agent_configs
ALTER TABLE IF EXISTS public.voice_agent_configs
  ALTER COLUMN model SET DEFAULT 'gpt-4o-mini';

-- Backfill any old realtime model names to a chat-capable default
UPDATE public.voice_agent_configs
SET model = 'gpt-4o-mini'
WHERE model IS NULL OR model = '' OR model ILIKE 'gpt-4o-realtime%';



-- =====================================
-- Migration: 20250901162000_extend_voice_agent_configs_realtime.sql
-- =====================================

-- Extend voice_agent_configs with realtime fields and provider link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN provider_id UUID REFERENCES public.admin_ai_providers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'enable_realtime'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN enable_realtime BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'use_proxy'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN use_proxy BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'proxy_url'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN proxy_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'input_audio_transcription_model'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_transcription_model TEXT NOT NULL DEFAULT 'whisper-1';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'input_audio_format'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN input_audio_format TEXT NOT NULL DEFAULT 'pcm16';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'output_audio_format'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN output_audio_format TEXT NOT NULL DEFAULT 'pcm16';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_type'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_type TEXT NOT NULL DEFAULT 'server_vad' CHECK (turn_detection_type IN ('server_vad', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_threshold'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_prefix_padding_ms'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_prefix_padding_ms INTEGER NOT NULL DEFAULT 300;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'turn_detection_silence_duration_ms'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN turn_detection_silence_duration_ms INTEGER NOT NULL DEFAULT 1000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'modalities'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN modalities JSONB NOT NULL DEFAULT '["text","audio"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN language TEXT NOT NULL DEFAULT 'en';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'arabic_support'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN arabic_support BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'voice_agent_configs' AND column_name = 'emotion_detection'
  ) THEN
    ALTER TABLE public.voice_agent_configs ADD COLUMN emotion_detection BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;



-- =====================================
-- Migration: 20250901180000_enhanced_free_assessments.sql
-- =====================================

-- Enhanced Free Assessments for Visitors (No Signup Required)
-- This migration adds more comprehensive questions to existing assessments and ensures they're properly configured

-- First, let's delete existing assessment questions to start fresh
DELETE FROM public.assessment_options WHERE question_id IN (
  SELECT id FROM public.assessment_questions WHERE assessment_id IN (
    SELECT id FROM public.assessments WHERE visibility = 'public'
  )
);
DELETE FROM public.assessment_questions WHERE assessment_id IN (
  SELECT id FROM public.assessments WHERE visibility = 'public'
);
DELETE FROM public.assessments WHERE visibility = 'public';

-- Enhanced Assessment 1: Personal Growth Journey Quiz (10 questions)
SELECT public.create_assessment_with_questions(
  'Personal Growth Journey Assessment',
  'Discover where you are on your personal development journey and receive personalized insights for your next steps towards growth and self-improvement.',
  'quiz',
  'public',
  'beginner',
  'personal development',
  'openai',
  'gpt-4o-mini',
  'Comprehensive personal growth assessment for women focusing on self-awareness, goal-setting, and personal transformation',
  '[
    {
      "question_text": "What motivates you most in your personal growth journey?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your core motivation helps identify the most effective growth strategies for you.",
      "options": [
        {
          "option_text": "Achieving specific goals and milestones",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Goal-oriented motivation drives tangible progress"
        },
        {
          "option_text": "Building deeper self-awareness and understanding",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Self-awareness is the foundation of sustainable growth"
        },
        {
          "option_text": "Overcoming past challenges and limitations",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Healing and transformation create space for new possibilities"
        },
        {
          "option_text": "Creating positive impact on others",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Purpose-driven growth creates meaningful change"
        }
      ]
    },
    {
      "question_text": "How do you typically respond to setbacks or challenges?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Your response to challenges reveals your resilience and growth mindset.",
      "options": [
        {
          "option_text": "I get discouraged and need time to recover",
          "is_correct": false,
          "position": 1,
          "score_value": 1,
          "feedback": "Taking time to process is healthy, but watch for extended periods"
        },
        {
          "option_text": "I analyze what went wrong and make adjustments",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Learning from setbacks accelerates growth"
        },
        {
          "option_text": "I seek support from others to help me through",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Seeking support shows wisdom and emotional intelligence"
        },
        {
          "option_text": "I try to avoid similar situations in the future",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Avoidance may limit growth opportunities"
        }
      ]
    },
    {
      "question_text": "Which area of personal growth do you feel needs the most attention right now?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Identifying priority areas helps focus your growth efforts effectively.",
      "options": [
        {
          "option_text": "Building confidence and self-esteem",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Inner confidence transforms how you show up in the world"
        },
        {
          "option_text": "Improving relationships and communication",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Strong relationships are essential for wellbeing"
        },
        {
          "option_text": "Finding purpose and direction",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Clarity of purpose guides meaningful decisions"
        },
        {
          "option_text": "Managing stress and emotions",
          "is_correct": true,
          "position": 4,
          "score_value": 4,
          "feedback": "Emotional regulation is foundational for all growth"
        }
      ]
    },
    {
      "question_text": "How often do you invest time in self-reflection?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Regular self-reflection accelerates personal insight and growth.",
      "options": [
        {
          "option_text": "Daily through journaling or meditation",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistent practice yields profound insights"
        },
        {
          "option_text": "Weekly when I have quiet moments",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Regular reflection supports steady progress"
        },
        {
          "option_text": "Occasionally when prompted by events",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consider creating more intentional reflection time"
        },
        {
          "option_text": "Rarely - I prefer to keep moving forward",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Reflection helps ensure you''re moving in the right direction"
        }
      ]
    },
    {
      "question_text": "What is your biggest obstacle to personal growth?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Identifying obstacles is the first step to overcoming them.",
      "options": [
        {
          "option_text": "Fear of failure or judgment",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "Fear often masks our greatest growth opportunities"
        },
        {
          "option_text": "Lack of time or energy",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Prioritization can create space for what matters"
        },
        {
          "option_text": "Not knowing where to start",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Small steps in any direction build momentum"
        },
        {
          "option_text": "Self-doubt and limiting beliefs",
          "is_correct": true,
          "position": 4,
          "score_value": 3,
          "feedback": "Challenging beliefs opens new possibilities"
        }
      ]
    },
    {
      "question_text": "How do you prefer to learn and grow?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Understanding your learning style helps optimize your growth journey.",
      "options": [
        {
          "option_text": "Through books, courses, and structured learning",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Structured learning provides solid foundations"
        },
        {
          "option_text": "Through experiences and hands-on practice",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Experiential learning creates lasting change"
        },
        {
          "option_text": "Through conversations and community",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Community accelerates growth through shared wisdom"
        },
        {
          "option_text": "Through reflection and inner work",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Inner work creates authentic transformation"
        }
      ]
    },
    {
      "question_text": "What does success in personal growth mean to you?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Defining success helps measure progress meaningfully.",
      "options": [
        {
          "option_text": "Achieving my goals and dreams",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "External achievements reflect inner growth"
        },
        {
          "option_text": "Feeling peaceful and content with myself",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Inner peace is the ultimate success"
        },
        {
          "option_text": "Having positive impact on others",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Your growth ripples out to benefit others"
        },
        {
          "option_text": "Continuous learning and evolution",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Growth as a journey, not destination"
        }
      ]
    },
    {
      "question_text": "How comfortable are you with change?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Your relationship with change affects your growth potential.",
      "options": [
        {
          "option_text": "I embrace change as opportunity",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Embracing change accelerates transformation"
        },
        {
          "option_text": "I adapt when change is necessary",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Flexibility serves you well"
        },
        {
          "option_text": "I find change challenging but manage",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Building comfort with change expands possibilities"
        },
        {
          "option_text": "I prefer stability and predictability",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small, gradual changes can feel more manageable"
        }
      ]
    },
    {
      "question_text": "What role does self-compassion play in your life?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Self-compassion is crucial for sustainable personal growth.",
      "options": [
        {
          "option_text": "I practice it regularly and forgive myself easily",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Self-compassion fuels resilience and growth"
        },
        {
          "option_text": "I''m learning to be kinder to myself",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Growing self-compassion transforms your journey"
        },
        {
          "option_text": "I struggle with self-criticism",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Gentleness with yourself opens growth"
        },
        {
          "option_text": "I push myself hard to improve",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Balance drive with self-kindness"
        }
      ]
    },
    {
      "question_text": "How do you measure your personal growth progress?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "How you measure progress affects your motivation and direction.",
      "options": [
        {
          "option_text": "By how I feel about myself",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Internal measures reflect authentic growth"
        },
        {
          "option_text": "By feedback from others",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "External validation has limitations"
        },
        {
          "option_text": "By goals achieved",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Goals are milestones, not the whole journey"
        },
        {
          "option_text": "By comparing to my past self",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Progress over perfection"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 2: Emotional Intelligence Mastery Quiz (10 questions)
SELECT public.create_assessment_with_questions(
  'Emotional Intelligence Mastery Assessment',
  'Evaluate your emotional intelligence across self-awareness, self-regulation, social awareness, and relationship management to unlock your full potential.',
  'quiz',
  'public',
  'intermediate',
  'emotional intelligence',
  'openai',
  'gpt-4o-mini',
  'Comprehensive emotional intelligence assessment covering all four domains of EQ',
  '[
    {
      "question_text": "When you feel overwhelmed, what is your first instinct?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "How you handle overwhelm shows your emotional regulation skills.",
      "options": [
        {
          "option_text": "Push through and keep going",
          "is_correct": false,
          "position": 1,
          "score_value": 1,
          "feedback": "Pushing through may lead to burnout"
        },
        {
          "option_text": "Take a step back and assess the situation",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Pausing allows for wise responses"
        },
        {
          "option_text": "Seek immediate help from others",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Seeking support shows emotional intelligence"
        },
        {
          "option_text": "Withdraw and avoid the situation",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Avoidance may increase overwhelm"
        }
      ]
    },
    {
      "question_text": "How accurately can you identify your emotions as they arise?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Emotional awareness is the foundation of emotional intelligence.",
      "options": [
        {
          "option_text": "I can name specific emotions instantly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Precise emotional vocabulary enhances EQ"
        },
        {
          "option_text": "I recognize general feelings (good/bad)",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Developing specificity improves emotional clarity"
        },
        {
          "option_text": "I notice emotions after they''ve passed",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practicing present-moment awareness helps"
        },
        {
          "option_text": "I often don''t know what I''m feeling",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Emotion journaling can build awareness"
        }
      ]
    },
    {
      "question_text": "In a heated discussion, how do you typically respond?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Your conflict response reveals emotional regulation abilities.",
      "options": [
        {
          "option_text": "Stay calm and listen actively",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Calm presence de-escalates conflicts"
        },
        {
          "option_text": "Get defensive and argue my point",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Defensiveness blocks understanding"
        },
        {
          "option_text": "Shut down and disengage",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Disengagement prevents resolution"
        },
        {
          "option_text": "Try to find middle ground quickly",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Seeking harmony shows social awareness"
        }
      ]
    },
    {
      "question_text": "How well do you pick up on others'' emotional states?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Reading others'' emotions is key to social intelligence.",
      "options": [
        {
          "option_text": "I notice subtle cues and unspoken feelings",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "High empathy enhances relationships"
        },
        {
          "option_text": "I pick up on obvious emotions",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Good foundation for deeper awareness"
        },
        {
          "option_text": "I focus more on words than feelings",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Tuning into nonverbals enriches understanding"
        },
        {
          "option_text": "I often misread others'' emotions",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Practice observing without assuming"
        }
      ]
    },
    {
      "question_text": "When someone shares difficult emotions with you, you:",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Your response to others'' emotions shows empathetic capacity.",
      "options": [
        {
          "option_text": "Listen fully and validate their feelings",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Validation creates emotional safety"
        },
        {
          "option_text": "Immediately offer solutions",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Sometimes presence matters more than solutions"
        },
        {
          "option_text": "Share your similar experiences",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Balance sharing with focused listening"
        },
        {
          "option_text": "Feel uncomfortable and change topics",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Building comfort with emotions deepens connections"
        }
      ]
    },
    {
      "question_text": "How do you handle criticism?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Response to criticism reveals emotional maturity.",
      "options": [
        {
          "option_text": "Consider it objectively for growth",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Growth mindset transforms criticism into opportunity"
        },
        {
          "option_text": "Feel hurt but try to learn",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Feeling and learning can coexist"
        },
        {
          "option_text": "Defend myself immediately",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Pause before responding"
        },
        {
          "option_text": "Take it very personally",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Separating feedback from self-worth helps"
        }
      ]
    },
    {
      "question_text": "In group settings, you tend to:",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Group behavior reveals social emotional intelligence.",
      "options": [
        {
          "option_text": "Read the room and adapt accordingly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Social flexibility enhances group dynamics"
        },
        {
          "option_text": "Focus on my own agenda",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Balancing personal and group needs matters"
        },
        {
          "option_text": "Observe more than participate",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Finding your voice enriches groups"
        },
        {
          "option_text": "Try to lead or direct",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Leadership includes knowing when to follow"
        }
      ]
    },
    {
      "question_text": "How do you manage stress in your daily life?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Stress management reflects emotional self-care.",
      "options": [
        {
          "option_text": "Regular practices like meditation or exercise",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Proactive practices build resilience"
        },
        {
          "option_text": "Deal with it as it comes",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Reactive approaches may overwhelm"
        },
        {
          "option_text": "Often feel overwhelmed",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Small daily practices can help"
        },
        {
          "option_text": "Distract myself with activities",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Healthy distractions differ from avoidance"
        }
      ]
    },
    {
      "question_text": "When making decisions, emotions play what role?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Integrating emotion and logic optimizes decisions.",
      "options": [
        {
          "option_text": "I consider them as valuable information",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Emotions provide important data"
        },
        {
          "option_text": "I try to ignore them completely",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Suppressing emotions can backfire"
        },
        {
          "option_text": "They often override my logic",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Balance emotion with reasoning"
        },
        {
          "option_text": "I''m not sure of their influence",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Awareness of emotional influence helps"
        }
      ]
    },
    {
      "question_text": "How comfortable are you expressing vulnerability?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Vulnerability is strength in emotional intelligence.",
      "options": [
        {
          "option_text": "I share authentically when appropriate",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Appropriate vulnerability deepens connections"
        },
        {
          "option_text": "Only with very close people",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Selective vulnerability shows wisdom"
        },
        {
          "option_text": "I prefer to appear strong",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Strength includes showing humanity"
        },
        {
          "option_text": "It depends on my mood",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Intentional vulnerability serves relationships"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 3: Relationship Harmony Assessment (10 questions)
SELECT public.create_assessment_with_questions(
  'Relationship Harmony Assessment',
  'Gain deep insights into your relationship patterns, attachment style, and communication effectiveness to build more fulfilling connections.',
  'quiz',
  'public',
  'intermediate',
  'relationships',
  'openai',
  'gpt-4o-mini',
  'Comprehensive relationship assessment covering attachment, communication, boundaries, and connection patterns',
  '[
    {
      "question_text": "In conflicts, you tend to:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your conflict style affects all your relationships.",
      "options": [
        {
          "option_text": "Avoid confrontation at all costs",
          "is_correct": false,
          "position": 1,
          "score_value": 1,
          "feedback": "Avoidance can lead to unresolved issues"
        },
        {
          "option_text": "Address issues directly but respectfully",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Direct communication builds trust"
        },
        {
          "option_text": "Wait for the other person to bring it up",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Taking initiative shows maturity"
        },
        {
          "option_text": "Get emotional and reactive",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Managing emotions improves outcomes"
        }
      ]
    },
    {
      "question_text": "How do you typically express love and care?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Understanding love languages improves connection.",
      "options": [
        {
          "option_text": "Through words of affirmation",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Words can powerfully affirm others"
        },
        {
          "option_text": "Through acts of service",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Actions speak volumes about care"
        },
        {
          "option_text": "Through quality time",
          "is_correct": true,
          "position": 3,
          "score_value": 4,
          "feedback": "Presence is a precious gift"
        },
        {
          "option_text": "Through physical touch or gifts",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Tangible expressions create connection"
        }
      ]
    },
    {
      "question_text": "What''s your biggest relationship challenge?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Identifying challenges helps focus improvement efforts.",
      "options": [
        {
          "option_text": "Setting healthy boundaries",
          "is_correct": true,
          "position": 1,
          "score_value": 3,
          "feedback": "Boundaries create sustainable relationships"
        },
        {
          "option_text": "Trusting others fully",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Trust builds gradually with consistency"
        },
        {
          "option_text": "Expressing my needs clearly",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Clear needs prevent misunderstandings"
        },
        {
          "option_text": "Maintaining independence",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Balance of togetherness and autonomy"
        }
      ]
    },
    {
      "question_text": "How do you handle relationship disappointments?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Processing disappointment affects relationship resilience.",
      "options": [
        {
          "option_text": "Communicate my feelings openly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Open communication heals and strengthens"
        },
        {
          "option_text": "Withdraw and process alone",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance solo processing with sharing"
        },
        {
          "option_text": "Pretend everything is fine",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Authenticity prevents resentment"
        },
        {
          "option_text": "End the relationship quickly",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Working through challenges builds depth"
        }
      ]
    },
    {
      "question_text": "In relationships, you need:",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Knowing your needs helps create fulfilling relationships.",
      "options": [
        {
          "option_text": "Deep emotional connection",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Emotional intimacy creates lasting bonds"
        },
        {
          "option_text": "Lots of personal space",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Space allows individual growth"
        },
        {
          "option_text": "Constant reassurance",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Building inner security helps relationships"
        },
        {
          "option_text": "Intellectual stimulation",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Mental connection enhances bonding"
        }
      ]
    },
    {
      "question_text": "How do you build trust in relationships?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Trust-building strategies shape relationship quality.",
      "options": [
        {
          "option_text": "Through consistent actions over time",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistency is the foundation of trust"
        },
        {
          "option_text": "By being completely open immediately",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Gradual opening can be healthier"
        },
        {
          "option_text": "By testing the other person",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Testing can damage trust"
        },
        {
          "option_text": "I struggle to trust others",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small steps can rebuild trust capacity"
        }
      ]
    },
    {
      "question_text": "What role do you typically play in relationships?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Relationship roles affect dynamics and satisfaction.",
      "options": [
        {
          "option_text": "Equal partner and collaborator",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Equality creates sustainable relationships"
        },
        {
          "option_text": "The caregiver and supporter",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance giving with receiving"
        },
        {
          "option_text": "The one who needs support",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Interdependence is healthy"
        },
        {
          "option_text": "It varies by relationship",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Flexibility shows relational intelligence"
        }
      ]
    },
    {
      "question_text": "How do you maintain long-term relationships?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Maintenance strategies determine relationship longevity.",
      "options": [
        {
          "option_text": "Regular check-ins and quality time",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Intentional connection sustains bonds"
        },
        {
          "option_text": "Assuming they''ll always be there",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Relationships need active nurturing"
        },
        {
          "option_text": "Occasional contact when convenient",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consistency deepens connections"
        },
        {
          "option_text": "Focus on shared activities",
          "is_correct": false,
          "position": 4,
          "score_value": 3,
          "feedback": "Activities plus emotional connection"
        }
      ]
    },
    {
      "question_text": "What attracts you most in relationships?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Understanding attraction patterns guides healthy choices.",
      "options": [
        {
          "option_text": "Emotional maturity and stability",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Maturity creates lasting relationships"
        },
        {
          "option_text": "Excitement and unpredictability",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Balance excitement with stability"
        },
        {
          "option_text": "Someone who needs me",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Mutual support over dependency"
        },
        {
          "option_text": "Shared values and goals",
          "is_correct": false,
          "position": 4,
          "score_value": 4,
          "feedback": "Alignment creates harmony"
        }
      ]
    },
    {
      "question_text": "How do you handle relationship transitions?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Managing transitions affects relationship evolution.",
      "options": [
        {
          "option_text": "Communicate openly about changes",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Communication eases transitions"
        },
        {
          "option_text": "Resist change to maintain comfort",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Flexibility allows growth"
        },
        {
          "option_text": "Let things evolve naturally",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Balance flow with intention"
        },
        {
          "option_text": "Feel anxious about changes",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Change is natural in relationships"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 4: Holistic Self-Care Evaluation (10 questions)
SELECT public.create_assessment_with_questions(
  'Holistic Self-Care Evaluation',
  'Assess your self-care practices across physical, mental, emotional, and spiritual dimensions to create a personalized wellness plan.',
  'quiz',
  'public',
  'beginner',
  'wellness',
  'openai',
  'gpt-4o-mini',
  'Comprehensive self-care assessment covering all dimensions of wellness',
  '[
    {
      "question_text": "How often do you engage in activities that truly rejuvenate you?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular self-care is essential for sustainable well-being.",
      "options": [
        {
          "option_text": "Daily - it''s a non-negotiable priority",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Consistent self-care creates resilience"
        },
        {
          "option_text": "Weekly - when I remember",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Regular practice supports balance"
        },
        {
          "option_text": "Monthly - when I have time",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Consider smaller daily practices"
        },
        {
          "option_text": "Rarely - I feel guilty taking time for myself",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Self-care enables you to care for others"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with your body?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Body relationship affects overall wellness.",
      "options": [
        {
          "option_text": "I listen to and honor its needs",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Body wisdom guides wellness"
        },
        {
          "option_text": "I often push through discomfort",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Honoring limits prevents burnout"
        },
        {
          "option_text": "I''m often disconnected from it",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Reconnecting enhances well-being"
        },
        {
          "option_text": "I have a love-hate relationship",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Cultivating body appreciation helps"
        }
      ]
    },
    {
      "question_text": "How do you nourish your mental health?",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "Mental health practices are crucial for overall wellness.",
      "options": [
        {
          "option_text": "Regular therapy or counseling",
          "is_correct": false,
          "position": 1,
          "score_value": 4,
          "feedback": "Professional support is valuable"
        },
        {
          "option_text": "Meditation, journaling, or mindfulness",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Mindfulness practices build resilience"
        },
        {
          "option_text": "Talking with friends when needed",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Social support is important"
        },
        {
          "option_text": "I don''t have specific practices",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small daily practices make a difference"
        }
      ]
    },
    {
      "question_text": "What''s your sleep quality like?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Sleep quality affects all aspects of wellness.",
      "options": [
        {
          "option_text": "Consistently restful and restorative",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Quality sleep supports optimal health"
        },
        {
          "option_text": "Usually good with occasional issues",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Generally healthy sleep patterns"
        },
        {
          "option_text": "Often disrupted or insufficient",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Sleep hygiene can help"
        },
        {
          "option_text": "Chronic sleep problems",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Consider professional sleep support"
        }
      ]
    },
    {
      "question_text": "How do you handle stress in your daily life?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Stress management is central to self-care.",
      "options": [
        {
          "option_text": "Proactive practices and boundaries",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Prevention is powerful self-care"
        },
        {
          "option_text": "React as stress arises",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Building proactive habits helps"
        },
        {
          "option_text": "Often feel overwhelmed",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Small stress-relief practices help"
        },
        {
          "option_text": "Push through until I crash",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Regular breaks prevent burnout"
        }
      ]
    },
    {
      "question_text": "What role does movement play in your life?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Movement is medicine for body and mind.",
      "options": [
        {
          "option_text": "Joyful daily movement I love",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Enjoyable movement is sustainable"
        },
        {
          "option_text": "Regular exercise routine",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Consistency supports health"
        },
        {
          "option_text": "Sporadic when motivated",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Finding enjoyable movement helps"
        },
        {
          "option_text": "Little to no regular movement",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Start with 5 minutes daily"
        }
      ]
    },
    {
      "question_text": "How connected do you feel to your spiritual side?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Spiritual connection enhances overall wellness.",
      "options": [
        {
          "option_text": "Deeply connected through regular practice",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Spiritual practice nourishes the soul"
        },
        {
          "option_text": "Somewhat connected",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Nurturing this connection enriches life"
        },
        {
          "option_text": "Curious but not actively engaged",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Exploration can be rewarding"
        },
        {
          "option_text": "Not important to me",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Spirituality takes many forms"
        }
      ]
    },
    {
      "question_text": "How do you practice emotional self-care?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Emotional self-care prevents burnout and builds resilience.",
      "options": [
        {
          "option_text": "Regular emotional processing and release",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Processing emotions maintains balance"
        },
        {
          "option_text": "Talk to friends when upset",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Support systems are valuable"
        },
        {
          "option_text": "Distract myself from difficult feelings",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Feeling emotions helps them pass"
        },
        {
          "option_text": "Push through emotional discomfort",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Emotions need acknowledgment"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with saying ''no''?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Boundaries are essential self-care.",
      "options": [
        {
          "option_text": "I say no easily to protect my energy",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Clear boundaries support wellness"
        },
        {
          "option_text": "Getting better at it",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Progress in boundary-setting matters"
        },
        {
          "option_text": "Struggle but trying",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practice makes it easier"
        },
        {
          "option_text": "I rarely say no",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Your needs matter too"
        }
      ]
    },
    {
      "question_text": "How do you define self-care success?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Your definition shapes your practice.",
      "options": [
        {
          "option_text": "Feeling balanced and energized",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Energy and balance indicate good self-care"
        },
        {
          "option_text": "Never getting sick or tired",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Unrealistic expectations create pressure"
        },
        {
          "option_text": "Meeting all my obligations",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Self-care isn''t just about productivity"
        },
        {
          "option_text": "Having time for everything",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Quality over quantity in self-care"
        }
      ]
    }
  ]'::jsonb
);

-- Enhanced Assessment 5: Life Purpose Discovery Journey (Free-text exploration)
SELECT public.create_assessment_with_questions(
  'Life Purpose Discovery Journey',
  'Embark on a transformative exploration of your core values, passions, gifts, and calling to uncover your unique life purpose.',
  'exploration',
  'public',
  'intermediate',
  'purpose',
  'openai',
  'gpt-4o-mini',
  'Deep life purpose exploration through reflective questions and guided discovery',
  '[
    {
      "question_text": "When you imagine your ideal life 5 years from now, what aspect excites you most? Describe the vision that makes your heart sing.",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Your vision reveals what truly matters to you and where your passion lies."
    },
    {
      "question_text": "What activities make you lose track of time because you enjoy them so much? When do you feel most alive and in flow?",
      "question_type": "free_text",
      "position": 2,
      "explanation": "Flow states often indicate areas where your natural talents and interests align."
    },
    {
      "question_text": "What injustices or problems in the world make you feel called to action? What change do you most want to see?",
      "question_type": "free_text",
      "position": 3,
      "explanation": "Your passion for change often points to your purpose."
    },
    {
      "question_text": "What unique combination of experiences, skills, and perspectives do you bring that no one else has?",
      "question_type": "free_text",
      "position": 4,
      "explanation": "Your unique gifts are clues to your purpose."
    },
    {
      "question_text": "If you knew you couldn''t fail and resources were unlimited, what would you create or contribute to the world?",
      "question_type": "free_text",
      "position": 5,
      "explanation": "Removing limitations reveals your true desires."
    },
    {
      "question_text": "What themes or patterns have appeared throughout your life? What keeps calling you back?",
      "question_type": "free_text",
      "position": 6,
      "explanation": "Life patterns often reveal deeper purpose."
    },
    {
      "question_text": "Who do you feel most called to serve or help? What group of people or cause resonates deeply with you?",
      "question_type": "free_text",
      "position": 7,
      "explanation": "Your calling often involves serving others."
    },
    {
      "question_text": "What legacy do you want to leave? How do you want to be remembered?",
      "question_type": "free_text",
      "position": 8,
      "explanation": "Legacy thinking clarifies life purpose."
    }
  ]'::jsonb
);

-- Enhanced Assessment 6: Confidence & Empowerment Blueprint (10 questions)
SELECT public.create_assessment_with_questions(
  'Confidence & Empowerment Blueprint',
  'Uncover your confidence patterns, identify limiting beliefs, and create a personalized roadmap to unshakeable self-assurance and personal power.',
  'quiz',
  'public',
  'beginner',
  'confidence',
  'openai',
  'gpt-4o-mini',
  'Comprehensive confidence assessment covering self-belief, assertiveness, and personal empowerment',
  '[
    {
      "question_text": "When faced with a new challenge, your inner voice typically says:",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your inner dialogue shapes your confidence and actions.",
      "options": [
        {
          "option_text": "I can learn and figure this out",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Growth mindset fuels confidence"
        },
        {
          "option_text": "This might be too difficult for me",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Challenge negative self-talk"
        },
        {
          "option_text": "I should wait until I''m more prepared",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Perfection can block progress"
        },
        {
          "option_text": "Others are better suited for this",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "You have unique strengths"
        }
      ]
    },
    {
      "question_text": "How do you typically celebrate your achievements?",
      "question_type": "multiple_choice",
      "position": 2,
      "points": 1,
      "explanation": "Celebrating success builds lasting confidence.",
      "options": [
        {
          "option_text": "I acknowledge them briefly then move on",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "Savor successes longer"
        },
        {
          "option_text": "I share them with people who matter",
          "is_correct": true,
          "position": 2,
          "score_value": 4,
          "feedback": "Sharing multiplies joy and confidence"
        },
        {
          "option_text": "I downplay them - anyone could have done it",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Own your accomplishments fully"
        },
        {
          "option_text": "I rarely acknowledge achievements",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Recognition builds confidence"
        }
      ]
    },
    {
      "question_text": "In social or professional settings, you tend to:",
      "question_type": "multiple_choice",
      "position": 3,
      "points": 1,
      "explanation": "How you show up reveals confidence levels.",
      "options": [
        {
          "option_text": "Speak up and share your ideas confidently",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Your voice matters"
        },
        {
          "option_text": "Wait to be asked for input",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Initiative demonstrates confidence"
        },
        {
          "option_text": "Doubt if your ideas are valuable",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Your perspective is unique and valuable"
        },
        {
          "option_text": "Let others take the lead",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Step into your leadership"
        }
      ]
    },
    {
      "question_text": "How do you handle compliments?",
      "question_type": "multiple_choice",
      "position": 4,
      "points": 1,
      "explanation": "Receiving compliments gracefully reflects self-worth.",
      "options": [
        {
          "option_text": "Accept them with genuine thanks",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Graceful acceptance shows confidence"
        },
        {
          "option_text": "Deflect or minimize them",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Allow others to appreciate you"
        },
        {
          "option_text": "Feel uncomfortable but say thanks",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Practice receiving with ease"
        },
        {
          "option_text": "Wonder if they''re being sincere",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Trust positive feedback"
        }
      ]
    },
    {
      "question_text": "What''s your biggest confidence challenge?",
      "question_type": "multiple_choice",
      "position": 5,
      "points": 1,
      "explanation": "Identifying challenges helps target growth.",
      "options": [
        {
          "option_text": "Imposter syndrome",
          "is_correct": false,
          "position": 1,
          "score_value": 2,
          "feedback": "You belong where you are"
        },
        {
          "option_text": "Fear of judgment",
          "is_correct": false,
          "position": 2,
          "score_value": 2,
          "feedback": "Others'' opinions don''t define you"
        },
        {
          "option_text": "Comparing myself to others",
          "is_correct": true,
          "position": 3,
          "score_value": 2,
          "feedback": "Your journey is unique"
        },
        {
          "option_text": "Past failures or criticism",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "The past doesn''t determine your future"
        }
      ]
    },
    {
      "question_text": "How do you assert your boundaries?",
      "question_type": "multiple_choice",
      "position": 6,
      "points": 1,
      "explanation": "Boundary setting reflects self-respect and confidence.",
      "options": [
        {
          "option_text": "Clearly and without guilt",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Strong boundaries show self-respect"
        },
        {
          "option_text": "With difficulty but I do it",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Practice makes it easier"
        },
        {
          "option_text": "I often feel guilty saying no",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Your needs are valid"
        },
        {
          "option_text": "I struggle to set boundaries",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Start with small boundaries"
        }
      ]
    },
    {
      "question_text": "What''s your relationship with risk-taking?",
      "question_type": "multiple_choice",
      "position": 7,
      "points": 1,
      "explanation": "Calculated risks build confidence through experience.",
      "options": [
        {
          "option_text": "I take calculated risks regularly",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "Smart risks accelerate growth"
        },
        {
          "option_text": "I prefer my comfort zone",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Growth happens outside comfort"
        },
        {
          "option_text": "I overthink before acting",
          "is_correct": false,
          "position": 3,
          "score_value": 2,
          "feedback": "Trust your judgment more"
        },
        {
          "option_text": "Fear usually stops me",
          "is_correct": false,
          "position": 4,
          "score_value": 1,
          "feedback": "Small steps build courage"
        }
      ]
    },
    {
      "question_text": "How do you view your mistakes?",
      "question_type": "multiple_choice",
      "position": 8,
      "points": 1,
      "explanation": "Your relationship with mistakes affects confidence resilience.",
      "options": [
        {
          "option_text": "As learning opportunities",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "This mindset builds resilience"
        },
        {
          "option_text": "As proof I''m not good enough",
          "is_correct": false,
          "position": 2,
          "score_value": 1,
          "feedback": "Mistakes are human and helpful"
        },
        {
          "option_text": "I try to hide them",
          "is_correct": false,
          "position": 3,
          "score_value": 1,
          "feedback": "Authenticity builds confidence"
        },
        {
          "option_text": "They shake my confidence",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Reframe mistakes as data"
        }
      ]
    },
    {
      "question_text": "What empowers you most?",
      "question_type": "multiple_choice",
      "position": 9,
      "points": 1,
      "explanation": "Understanding your power sources helps cultivate confidence.",
      "options": [
        {
          "option_text": "Knowledge and continuous learning",
          "is_correct": false,
          "position": 1,
          "score_value": 3,
          "feedback": "Learning expands possibilities"
        },
        {
          "option_text": "Supporting and uplifting others",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Service strengthens confidence"
        },
        {
          "option_text": "Achieving my goals",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Success builds on success"
        },
        {
          "option_text": "Being authentically myself",
          "is_correct": true,
          "position": 4,
          "score_value": 4,
          "feedback": "Authenticity is ultimate power"
        }
      ]
    },
    {
      "question_text": "How do you want to feel about yourself in one year?",
      "question_type": "multiple_choice",
      "position": 10,
      "points": 1,
      "explanation": "Vision creates direction for confidence building.",
      "options": [
        {
          "option_text": "Unshakeable and self-assured",
          "is_correct": true,
          "position": 1,
          "score_value": 4,
          "feedback": "This vision is achievable"
        },
        {
          "option_text": "More confident than now",
          "is_correct": false,
          "position": 2,
          "score_value": 3,
          "feedback": "Specific goals accelerate growth"
        },
        {
          "option_text": "Less worried about others'' opinions",
          "is_correct": false,
          "position": 3,
          "score_value": 3,
          "feedback": "Freedom from judgment is powerful"
        },
        {
          "option_text": "I hope to feel better",
          "is_correct": false,
          "position": 4,
          "score_value": 2,
          "feedback": "Claim your confidence actively"
        }
      ]
    }
  ]'::jsonb
);

-- Grant necessary permissions
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;

-- Grant permissions for anonymous users to view public assessments
GRANT SELECT ON public.assessments TO anon;
GRANT SELECT ON public.assessment_questions TO anon;
GRANT SELECT ON public.assessment_options TO anon;

-- =====================================
-- Migration: 20250901190000_user_assessments_comprehensive.sql
-- =====================================

-- 20 Comprehensive Assessments for Registered Users
-- These assessments cover various aspects of personal development, wellness, and growth

-- Assessment 1: Career Purpose & Fulfillment Assessment
SELECT public.create_assessment_with_questions(
  'Career Purpose & Fulfillment Assessment',
  'Discover alignment between your career and life purpose, identify areas for professional growth, and create a roadmap for meaningful work.',
  'quiz',
  'private',
  'intermediate',
  'career',
  'openai',
  'gpt-4o-mini',
  'Career fulfillment and purpose alignment assessment',
  '[
    {
      "question_text": "How aligned is your current work with your personal values?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Value alignment is crucial for career satisfaction.",
      "options": [
        {"option_text": "Completely aligned", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Mostly aligned", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Somewhat misaligned", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Significantly misaligned", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 2: Financial Wellness & Abundance Mindset
SELECT public.create_assessment_with_questions(
  'Financial Wellness & Abundance Mindset Assessment',
  'Evaluate your relationship with money, identify limiting beliefs, and develop strategies for financial empowerment and abundance.',
  'quiz',
  'private',
  'intermediate',
  'finance',
  'openai',
  'gpt-4o-mini',
  'Financial wellness and money mindset assessment',
  '[
    {
      "question_text": "What best describes your relationship with money?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Your money relationship affects financial outcomes.",
      "options": [
        {"option_text": "Healthy and empowered", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Working on improvement", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Anxious and uncertain", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Avoidant or fearful", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 3: Trauma Healing & Resilience Assessment
SELECT public.create_assessment_with_questions(
  'Trauma Healing & Resilience Assessment',
  'Gently explore your healing journey, identify areas needing support, and discover pathways to post-traumatic growth and resilience.',
  'exploration',
  'private',
  'advanced',
  'healing',
  'openai',
  'gpt-4o-mini',
  'Trauma-informed healing and resilience assessment',
  '[
    {
      "question_text": "Where are you in your healing journey? What support would be most helpful right now?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Understanding your current needs guides healing."
    }
  ]'::jsonb
);

-- Assessment 4: Spiritual Awakening & Connection Assessment
SELECT public.create_assessment_with_questions(
  'Spiritual Awakening & Connection Assessment',
  'Explore your spiritual journey, identify practices that resonate, and deepen your connection to the sacred in everyday life.',
  'exploration',
  'private',
  'intermediate',
  'spirituality',
  'openai',
  'gpt-4o-mini',
  'Spiritual growth and connection assessment',
  '[
    {
      "question_text": "How do you currently experience the sacred or spiritual in your life?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Spiritual connection takes many forms."
    }
  ]'::jsonb
);

-- Assessment 5: Creative Expression & Innovation Assessment
SELECT public.create_assessment_with_questions(
  'Creative Expression & Innovation Assessment',
  'Unlock your creative potential, identify blocks, and develop strategies to express your unique gifts and innovations.',
  'quiz',
  'private',
  'beginner',
  'creativity',
  'openai',
  'gpt-4o-mini',
  'Creativity and innovation potential assessment',
  '[
    {
      "question_text": "How often do you engage in creative activities?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Regular creative practice nurtures innovation.",
      "options": [
        {"option_text": "Daily creative practice", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Weekly creative time", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Occasional creativity", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Rarely express creatively", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 6: Leadership & Influence Assessment
SELECT public.create_assessment_with_questions(
  'Leadership & Influence Assessment',
  'Discover your leadership style, identify strengths and growth areas, and develop your capacity for positive influence and impact.',
  'quiz',
  'private',
  'advanced',
  'leadership',
  'openai',
  'gpt-4o-mini',
  'Leadership potential and influence assessment',
  '[
    {
      "question_text": "What type of leader do you naturally tend to be?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Understanding your style enhances leadership.",
      "options": [
        {"option_text": "Visionary and inspiring", "is_correct": false, "position": 1, "score_value": 4},
        {"option_text": "Collaborative and inclusive", "is_correct": true, "position": 2, "score_value": 4},
        {"option_text": "Strategic and analytical", "is_correct": false, "position": 3, "score_value": 4},
        {"option_text": "Supportive and nurturing", "is_correct": false, "position": 4, "score_value": 4}
      ]
    }
  ]'::jsonb
);

-- Assessment 7: Parenting & Family Dynamics Assessment
SELECT public.create_assessment_with_questions(
  'Parenting & Family Dynamics Assessment',
  'Explore your parenting style, family patterns, and create strategies for nurturing healthy, connected family relationships.',
  'exploration',
  'private',
  'intermediate',
  'family',
  'openai',
  'gpt-4o-mini',
  'Parenting and family dynamics assessment',
  '[
    {
      "question_text": "What values are most important for you to pass on to your children or future generations?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Clarifying values guides parenting decisions."
    }
  ]'::jsonb
);

-- Assessment 8: Health & Vitality Optimization Assessment
SELECT public.create_assessment_with_questions(
  'Health & Vitality Optimization Assessment',
  'Comprehensively evaluate your physical health, energy levels, and create a personalized plan for optimal vitality and longevity.',
  'quiz',
  'private',
  'intermediate',
  'health',
  'openai',
  'gpt-4o-mini',
  'Physical health and vitality assessment',
  '[
    {
      "question_text": "How would you rate your overall energy levels?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Energy levels indicate overall health status.",
      "options": [
        {"option_text": "Abundant and consistent", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Generally good", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often low or fluctuating", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Chronically depleted", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 9: Time Management & Productivity Assessment
SELECT public.create_assessment_with_questions(
  'Time Management & Productivity Assessment',
  'Analyze how you use your time, identify productivity blocks, and create systems for achieving more while maintaining balance.',
  'quiz',
  'private',
  'beginner',
  'productivity',
  'openai',
  'gpt-4o-mini',
  'Time management and productivity assessment',
  '[
    {
      "question_text": "How well do you manage competing priorities?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Priority management is key to productivity.",
      "options": [
        {"option_text": "Excellently with clear systems", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Well most of the time", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often feel overwhelmed", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Constantly struggling", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 10: Communication Mastery Assessment
SELECT public.create_assessment_with_questions(
  'Communication Mastery Assessment',
  'Evaluate your communication skills across different contexts and develop strategies for clear, compassionate, and effective expression.',
  'quiz',
  'private',
  'intermediate',
  'communication',
  'openai',
  'gpt-4o-mini',
  'Communication skills and effectiveness assessment',
  '[
    {
      "question_text": "How effectively do you communicate your needs?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Clear communication prevents misunderstandings.",
      "options": [
        {"option_text": "Very clearly and directly", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Usually well", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Sometimes struggle", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Often go unheard", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 11: Anxiety & Stress Resilience Assessment
SELECT public.create_assessment_with_questions(
  'Anxiety & Stress Resilience Assessment',
  'Understand your stress patterns, anxiety triggers, and build a personalized toolkit for calm, resilience, and emotional regulation.',
  'quiz',
  'private',
  'intermediate',
  'mental health',
  'openai',
  'gpt-4o-mini',
  'Anxiety management and stress resilience assessment',
  '[
    {
      "question_text": "How well do you manage anxiety when it arises?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Anxiety management skills can be developed.",
      "options": [
        {"option_text": "Very effectively with tools", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Moderately well", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "With difficulty", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Feel overwhelmed by it", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 12: Body Image & Self-Love Assessment
SELECT public.create_assessment_with_questions(
  'Body Image & Self-Love Assessment',
  'Explore your relationship with your body, heal negative patterns, and cultivate radical self-love and body acceptance.',
  'exploration',
  'private',
  'intermediate',
  'self-love',
  'openai',
  'gpt-4o-mini',
  'Body image and self-love assessment',
  '[
    {
      "question_text": "Describe your current relationship with your body. What would you like to heal or transform?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Body relationships can be transformed with compassion."
    }
  ]'::jsonb
);

-- Assessment 13: Boundaries & Assertiveness Assessment
SELECT public.create_assessment_with_questions(
  'Boundaries & Assertiveness Assessment',
  'Identify boundary patterns, develop assertiveness skills, and create strategies for maintaining healthy limits in all relationships.',
  'quiz',
  'private',
  'intermediate',
  'boundaries',
  'openai',
  'gpt-4o-mini',
  'Boundaries and assertiveness assessment',
  '[
    {
      "question_text": "How comfortable are you setting boundaries?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Healthy boundaries protect your energy.",
      "options": [
        {"option_text": "Very comfortable and clear", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Getting better at it", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Often struggle", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Find it very difficult", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 14: Life Transitions & Change Navigation
SELECT public.create_assessment_with_questions(
  'Life Transitions & Change Navigation Assessment',
  'Assess your readiness for change, develop transition skills, and create strategies for navigating life changes with grace.',
  'exploration',
  'private',
  'advanced',
  'transitions',
  'openai',
  'gpt-4o-mini',
  'Life transitions and change management assessment',
  '[
    {
      "question_text": "What major transition are you currently facing or anticipating? How prepared do you feel?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Awareness helps navigate transitions smoothly."
    }
  ]'::jsonb
);

-- Assessment 15: Intuition & Inner Wisdom Assessment
SELECT public.create_assessment_with_questions(
  'Intuition & Inner Wisdom Assessment',
  'Strengthen your connection to intuition, learn to trust inner guidance, and develop practices for accessing your inner wisdom.',
  'quiz',
  'private',
  'intermediate',
  'intuition',
  'openai',
  'gpt-4o-mini',
  'Intuition and inner wisdom development assessment',
  '[
    {
      "question_text": "How connected are you to your intuition?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Intuition is a powerful guide when trusted.",
      "options": [
        {"option_text": "Deeply connected and trusting", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "Growing connection", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Sometimes hear it", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Rarely trust it", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 16: Sexual Wellness & Intimacy Assessment
SELECT public.create_assessment_with_questions(
  'Sexual Wellness & Intimacy Assessment',
  'Explore your relationship with sexuality, identify areas for healing or growth, and create a path to fulfilling intimate connections.',
  'exploration',
  'private',
  'advanced',
  'intimacy',
  'openai',
  'gpt-4o-mini',
  'Sexual wellness and intimacy assessment',
  '[
    {
      "question_text": "What aspects of intimacy and sexuality would you like to explore or heal?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Sexual wellness is part of overall health."
    }
  ]'::jsonb
);

-- Assessment 17: Aging & Wisdom Integration Assessment
SELECT public.create_assessment_with_questions(
  'Aging & Wisdom Integration Assessment',
  'Embrace the aging process, integrate accumulated wisdom, and create a vision for thriving through all life stages.',
  'exploration',
  'private',
  'advanced',
  'aging',
  'openai',
  'gpt-4o-mini',
  'Aging gracefully and wisdom integration assessment',
  '[
    {
      "question_text": "How do you view aging and what wisdom have you gained from your life experiences?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Each life stage offers unique gifts."
    }
  ]'::jsonb
);

-- Assessment 18: Social Impact & Contribution Assessment
SELECT public.create_assessment_with_questions(
  'Social Impact & Contribution Assessment',
  'Identify your unique contribution to the world, explore ways to create positive impact, and align your actions with your values.',
  'quiz',
  'private',
  'intermediate',
  'impact',
  'openai',
  'gpt-4o-mini',
  'Social impact and contribution assessment',
  '[
    {
      "question_text": "How do you currently contribute to positive change?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Everyone can create meaningful impact.",
      "options": [
        {"option_text": "Through active service/activism", "is_correct": true, "position": 1, "score_value": 4},
        {"option_text": "In my daily interactions", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Want to do more", "is_correct": false, "position": 3, "score_value": 2},
        {"option_text": "Not sure how to help", "is_correct": false, "position": 4, "score_value": 1}
      ]
    }
  ]'::jsonb
);

-- Assessment 19: Dreams & Manifestation Assessment
SELECT public.create_assessment_with_questions(
  'Dreams & Manifestation Assessment',
  'Clarify your dreams, identify blocks to manifestation, and create an action plan for bringing your vision into reality.',
  'exploration',
  'private',
  'intermediate',
  'manifestation',
  'openai',
  'gpt-4o-mini',
  'Dreams and manifestation potential assessment',
  '[
    {
      "question_text": "What is your biggest dream that you haven''t yet manifested? What do you believe is holding you back?",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Identifying blocks helps clear the path."
    }
  ]'::jsonb
);

-- Assessment 20: Holistic Life Balance Assessment
SELECT public.create_assessment_with_questions(
  'Holistic Life Balance Assessment',
  'Evaluate balance across all life areas, identify priorities, and create a comprehensive plan for whole-life harmony and fulfillment.',
  'quiz',
  'private',
  'intermediate',
  'balance',
  'openai',
  'gpt-4o-mini',
  'Comprehensive life balance assessment',
  '[
    {
      "question_text": "Which life area needs the most attention right now?",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Identifying priorities guides focus.",
      "options": [
        {"option_text": "Career/Purpose", "is_correct": false, "position": 1, "score_value": 3},
        {"option_text": "Relationships/Love", "is_correct": false, "position": 2, "score_value": 3},
        {"option_text": "Health/Vitality", "is_correct": true, "position": 3, "score_value": 3},
        {"option_text": "Personal Growth", "is_correct": false, "position": 4, "score_value": 3}
      ]
    }
  ]'::jsonb
);

-- Update permissions
GRANT ALL ON public.assessments TO authenticated;
GRANT ALL ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_options TO authenticated;
GRANT ALL ON public.assessment_results TO authenticated;

-- =====================================
-- Migration: 20250901_create_content_challenges.sql
-- =====================================

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

-- =====================================
-- Migration: 20250904040000_fix_schema_issues.sql
-- =====================================

-- Add avatar_url to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Add foreign key to community_posts table
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- =====================================
-- Migration: 20250904041001_rollback_voice_agent_config_columns.sql
-- =====================================

-- Rollback migration: remove columns added for voice_agent_configs
-- Run this only if you are certain you want to revert the schema change.
BEGIN;

ALTER TABLE public.voice_agent_configs
  DROP COLUMN IF EXISTS api_base_url,
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS openai_organization,
  DROP COLUMN IF EXISTS openai_project,
  DROP COLUMN IF EXISTS max_tokens,
  DROP COLUMN IF EXISTS top_p,
  DROP COLUMN IF EXISTS frequency_penalty,
  DROP COLUMN IF EXISTS presence_penalty,
  DROP COLUMN IF EXISTS enable_realtime,
  DROP COLUMN IF EXISTS use_proxy,
  DROP COLUMN IF EXISTS proxy_url,
  DROP COLUMN IF EXISTS input_audio_transcription_model,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS arabic_support,
  DROP COLUMN IF EXISTS emotion_detection;

COMMIT;

-- =====================================
-- Migration: 20250904050000_create_voice_agent_tables.sql
-- =====================================

-- Migration for Voice Agent Features

-- 1. voice_agent_configs table
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    openai_model TEXT DEFAULT 'gpt-4o',
    openai_voice TEXT DEFAULT 'alloy',
    system_prompt TEXT,
    initial_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for voice_agent_configs
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage voice agent configs" ON public.voice_agent_configs
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can read voice agent configs" ON public.voice_agent_configs
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- 2. voice_sessions table
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    session_ended_at TIMESTAMPTZ,
    call_sid TEXT,
    status TEXT,
    transcript JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for voice_sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own voice sessions" ON public.voice_sessions
    FOR ALL
    USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all voice sessions" ON public.voice_sessions
    FOR SELECT
    USING (is_admin(auth.uid()));


-- 3. audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource_id TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (is_admin(auth.uid()));


-- 4. admin_ai_providers table
CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    api_key_encrypted TEXT, -- Should be encrypted at application level
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for admin_ai_providers
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Function to check for admin role (if not exists)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================
-- Migration: 20250904073000_fix_community_posts_view.sql
-- =====================================

-- Drop constraint if it exists (to avoid errors)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_community_posts_user'
    ) THEN
        ALTER TABLE public.community_posts DROP CONSTRAINT fk_community_posts_user;
    END IF;
END $$;

-- Add foreign key relationship between community_posts and profiles
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_community_posts_user
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create a view that joins community posts with profiles
CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
SELECT 
  cp.*,
  p.display_name,
  p.avatar_url
FROM public.community_posts cp
LEFT JOIN public.profiles p ON cp.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.community_posts_with_profiles TO authenticated;
GRANT SELECT ON public.community_posts_with_profiles TO anon;

-- Update RLS policy for the view
DROP POLICY IF EXISTS "Anyone can view approved public posts with profiles" ON public.community_posts_with_profiles;
CREATE POLICY "Anyone can view approved public posts with profiles"
ON public.community_posts_with_profiles
FOR SELECT
USING (is_approved = true AND visibility = 'public');


-- =====================================
-- Migration: 20250904075500_fix_community_posts_relationships.sql
-- =====================================

-- Add foreign key relationship between community_posts and profiles
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_community_posts_user
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create a view that joins community posts with profiles
CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
SELECT 
  cp.*,
  p.display_name,
  p.avatar_url
FROM public.community_posts cp
LEFT JOIN public.profiles p ON cp.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.community_posts_with_profiles TO authenticated;
GRANT SELECT ON public.community_posts_with_profiles TO anon;

-- Update RLS policy for the view
CREATE POLICY "Anyone can view approved public posts with profiles"
ON public.community_posts_with_profiles
FOR SELECT
USING (is_approved = true AND visibility = 'public');

COMMENT ON VIEW public.community_posts_with_profiles IS 'View that joins community posts with profile information for display';


