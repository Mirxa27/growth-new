-- Apply all critical database migrations for Newomen platform
-- Run this script in your Supabase SQL editor to fix all 404 errors

-- 1. Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  code TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info', 'critical')),
  category TEXT DEFAULT 'general',
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create security_audit_log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create exploration_sessions table
CREATE TABLE IF NOT EXISTS exploration_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exploration_type TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  current_question_index INTEGER DEFAULT 0,
  responses JSONB DEFAULT '[]',
  insights JSONB DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create library_items table
CREATE TABLE IF NOT EXISTS library_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'audio' CHECK (type IN ('audio', 'video', 'article', 'exercise', 'meditation')),
  category TEXT DEFAULT 'general',
  duration_minutes INTEGER,
  audio_url TEXT,
  transcript TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_premium BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT DEFAULT 'ms',
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  url TEXT,
  session_id TEXT
);

-- 8. Create user_memory_profiles table for NewMe AI
CREATE TABLE IF NOT EXISTS user_memory_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_type TEXT DEFAULT 'exploring',
  balance_wheel_scores JSONB DEFAULT '{}',
  narrative_patterns TEXT[] DEFAULT '{}',
  emotional_state_history JSONB DEFAULT '[]',
  conversation_history JSONB DEFAULT '[]',
  cultural_context JSONB DEFAULT '{"language": "en", "region": "global", "culturalSensitivities": []}',
  subscription_tier TEXT DEFAULT 'discovery' CHECK (subscription_tier IN ('discovery', 'growth', 'transformation')),
  current_level INTEGER DEFAULT 1,
  crystal_balance INTEGER DEFAULT 0,
  progress_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 9. Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 10. Create daily_affirmations table
CREATE TABLE IF NOT EXISTS daily_affirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affirmation_text TEXT NOT NULL,
  generated_date DATE DEFAULT CURRENT_DATE,
  is_viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, generated_date)
);

-- 11. Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  audio_input_url TEXT,
  audio_output_url TEXT,
  transcript_input TEXT,
  transcript_output TEXT,
  emotion_analysis JSONB,
  conversation_context JSONB,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Ensure profiles table has is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Enable RLS for all tables
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exploration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Error logs (admin only)
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;
CREATE POLICY "System can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- Community posts (public read, user write)
DROP POLICY IF EXISTS "Users can view all community posts" ON community_posts;
CREATE POLICY "Users can view all community posts"
  ON community_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own community posts" ON community_posts;
CREATE POLICY "Users can insert their own community posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own community posts" ON community_posts;
CREATE POLICY "Users can update their own community posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User profiles (own data only)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Library items (public read)
DROP POLICY IF EXISTS "Anyone can view library items" ON library_items;
CREATE POLICY "Anyone can view library items"
  ON library_items FOR SELECT
  USING (true);

-- Exploration sessions (own data only)
DROP POLICY IF EXISTS "Users can view their own exploration sessions" ON exploration_sessions;
CREATE POLICY "Users can view their own exploration sessions"
  ON exploration_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exploration sessions" ON exploration_sessions;
CREATE POLICY "Users can insert their own exploration sessions"
  ON exploration_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own exploration sessions" ON exploration_sessions;
CREATE POLICY "Users can update their own exploration sessions"
  ON exploration_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User memory profiles (own data only)
DROP POLICY IF EXISTS "Users can view their own memory profile" ON user_memory_profiles;
CREATE POLICY "Users can view their own memory profile"
  ON user_memory_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own memory profile" ON user_memory_profiles;
CREATE POLICY "Users can insert their own memory profile"
  ON user_memory_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memory profile" ON user_memory_profiles;
CREATE POLICY "Users can update their own memory profile"
  ON user_memory_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create all necessary database functions
CREATE OR REPLACE FUNCTION log_error(
  message_param TEXT,
  code_param TEXT DEFAULT NULL,
  severity_param TEXT DEFAULT 'error',
  category_param TEXT DEFAULT 'general',
  context_param JSONB DEFAULT '{}',
  user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO error_logs (message, code, severity, category, context, user_id)
  VALUES (message_param, code_param, severity_param, category_param, context_param, user_id_param);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_performance_metric(
  metric_type_param TEXT,
  name_param TEXT,
  value_param DECIMAL,
  unit_param TEXT DEFAULT 'ms',
  tags_param JSONB DEFAULT '{}',
  metadata_param JSONB DEFAULT '{}',
  user_agent_param TEXT DEFAULT NULL,
  url_param TEXT DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO performance_metrics (
    metric_type, name, value, unit, tags, metadata, 
    user_agent, url, session_id
  )
  VALUES (
    metric_type_param, name_param, value_param, unit_param, 
    tags_param, metadata_param, user_agent_param, url_param, session_id_param
  );
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_profile_safe(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
BEGIN
  SELECT row_to_json(user_profiles)::jsonb INTO profile_data
  FROM user_profiles
  WHERE user_id = user_id_param;
  
  IF profile_data IS NULL THEN
    INSERT INTO user_profiles (user_id, full_name, onboarding_completed)
    VALUES (user_id_param, '', FALSE)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING row_to_json(user_profiles)::jsonb INTO profile_data;
  END IF;
  
  RETURN COALESCE(profile_data, '{}'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_crystals_to_user(
  user_id_param UUID,
  crystal_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_memory_profiles (user_id, crystal_balance)
  VALUES (user_id_param, crystal_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    crystal_balance = user_memory_profiles.crystal_balance + crystal_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO library_items (title, description, type, category, duration_minutes, audio_url, tags, difficulty_level) VALUES
('Morning Mindfulness', 'Start your day with a gentle 5-minute mindfulness practice', 'audio', 'meditation', 5, '/audio/morning-mindfulness.mp3', ARRAY['morning', 'mindfulness', 'meditation'], 'beginner'),
('Confidence Building', 'A powerful 10-minute guided session to build inner confidence', 'audio', 'personal_growth', 10, '/audio/confidence-building.mp3', ARRAY['confidence', 'self-esteem', 'empowerment'], 'intermediate'),
('Deep Breathing for Anxiety', 'Calm your mind with this 7-minute breathing exercise', 'audio', 'wellness', 7, '/audio/breathing-anxiety.mp3', ARRAY['anxiety', 'breathing', 'calm'], 'beginner'),
('Relationship Reflection', 'Explore your relationship patterns with this 15-minute guided reflection', 'audio', 'relationships', 15, '/audio/relationship-reflection.mp3', ARRAY['relationships', 'reflection', 'patterns'], 'intermediate'),
('Values Clarification', 'Discover your core values through this 20-minute exploration', 'audio', 'personal_growth', 20, '/audio/values-clarification.mp3', ARRAY['values', 'purpose', 'clarity'], 'advanced')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_exploration_sessions_user_id ON exploration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON user_memory_profiles(user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'All critical database tables and functions created successfully!';
  RAISE NOTICE 'Newomen platform database is now ready.';
END $$;