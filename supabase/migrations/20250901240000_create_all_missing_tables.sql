-- Create all missing tables for Newomen platform

-- 1. Community Posts table
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

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_count ON community_posts(likes_count);

-- Enable RLS for community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all community posts"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own community posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Exploration Sessions table
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

CREATE INDEX IF NOT EXISTS idx_exploration_sessions_user_id ON exploration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exploration_sessions_status ON exploration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exploration_sessions_created_at ON exploration_sessions(created_at);

-- Enable RLS for exploration_sessions
ALTER TABLE exploration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exploration sessions"
  ON exploration_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exploration sessions"
  ON exploration_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exploration sessions"
  ON exploration_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. User Profiles table (extending the basic profiles)
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

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active_at ON user_profiles(last_active_at);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Library Items table
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

CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);
CREATE INDEX IF NOT EXISTS idx_library_items_type ON library_items(type);
CREATE INDEX IF NOT EXISTS idx_library_items_is_featured ON library_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON library_items(created_at);

-- Enable RLS for library_items
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view library items"
  ON library_items FOR SELECT
  USING (true);

-- 5. Performance Metrics table
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

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Enable RLS for performance_metrics (admin only)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics"
  ON performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- 6. Ensure profiles table exists with is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Insert some sample library items
INSERT INTO library_items (title, description, type, category, duration_minutes, audio_url, tags, difficulty_level) VALUES
('Morning Mindfulness', 'Start your day with a gentle 5-minute mindfulness practice', 'audio', 'meditation', 5, '/audio/morning-mindfulness.mp3', ARRAY['morning', 'mindfulness', 'meditation'], 'beginner'),
('Confidence Building', 'A powerful 10-minute guided session to build inner confidence', 'audio', 'personal_growth', 10, '/audio/confidence-building.mp3', ARRAY['confidence', 'self-esteem', 'empowerment'], 'intermediate'),
('Deep Breathing for Anxiety', 'Calm your mind with this 7-minute breathing exercise', 'audio', 'wellness', 7, '/audio/breathing-anxiety.mp3', ARRAY['anxiety', 'breathing', 'calm'], 'beginner'),
('Relationship Reflection', 'Explore your relationship patterns with this 15-minute guided reflection', 'audio', 'relationships', 15, '/audio/relationship-reflection.mp3', ARRAY['relationships', 'reflection', 'patterns'], 'intermediate'),
('Values Clarification', 'Discover your core values through this 20-minute exploration', 'audio', 'personal_growth', 20, '/audio/values-clarification.mp3', ARRAY['values', 'purpose', 'clarity'], 'advanced')
ON CONFLICT DO NOTHING;

-- Insert some sample community posts
INSERT INTO community_posts (user_id, title, content, category, tags) VALUES
((SELECT id FROM auth.users LIMIT 1), 'Welcome to Newomen!', 'So excited to be part of this amazing community of women supporting each other on our growth journeys! 💕', 'welcome', ARRAY['welcome', 'community', 'growth']),
((SELECT id FROM auth.users LIMIT 1), 'Morning Affirmation Practice', 'I''ve been doing the morning affirmations for a week now and I feel so much more positive! Anyone else trying this?', 'wellness', ARRAY['affirmations', 'morning', 'positivity']),
((SELECT id FROM auth.users LIMIT 1), 'Narrative Identity Insights', 'Just completed my narrative identity exploration and WOW - the insights were so eye-opening! NewMe really helped me see patterns I never noticed.', 'exploration', ARRAY['narrative', 'identity', 'insights', 'patterns'])
ON CONFLICT DO NOTHING;

-- Functions for safe data access
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
BEGIN
  SELECT row_to_json(user_profiles)::jsonb INTO profile_data
  FROM user_profiles
  WHERE user_id = user_id_param;
  
  -- If no profile exists, create a basic one
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

CREATE OR REPLACE FUNCTION get_community_posts_safe(limit_param INTEGER DEFAULT 20)
RETURNS JSONB AS $$
DECLARE
  posts_data JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(community_posts)) INTO posts_data
  FROM (
    SELECT * FROM community_posts 
    ORDER BY created_at DESC 
    LIMIT limit_param
  ) community_posts;
  
  RETURN COALESCE(posts_data, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_exploration_sessions_safe(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  sessions_data JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(exploration_sessions)) INTO sessions_data
  FROM exploration_sessions
  WHERE user_id = user_id_param
  ORDER BY created_at DESC;
  
  RETURN COALESCE(sessions_data, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_library_items_safe(limit_param INTEGER DEFAULT 50)
RETURNS JSONB AS $$
DECLARE
  items_data JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(library_items)) INTO items_data
  FROM (
    SELECT * FROM library_items 
    ORDER BY is_featured DESC, created_at DESC 
    LIMIT limit_param
  ) library_items;
  
  RETURN COALESCE(items_data, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle performance metrics safely
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
    -- Silently fail to prevent performance monitoring from breaking the app
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update functions for existing tables
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_exploration_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_posts_updated_at();

DROP TRIGGER IF EXISTS update_exploration_sessions_updated_at ON exploration_sessions;
CREATE TRIGGER update_exploration_sessions_updated_at
  BEFORE UPDATE ON exploration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_sessions_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  new_likes_count INTEGER;
BEGIN
  UPDATE community_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id_param
  RETURNING likes_count INTO new_likes_count;
  
  RETURN COALESCE(new_likes_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create exploration session
CREATE OR REPLACE FUNCTION create_exploration_session(
  user_id_param UUID,
  exploration_type_param TEXT
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO exploration_sessions (user_id, exploration_type, status)
  VALUES (user_id_param, exploration_type_param, 'active')
  RETURNING id INTO session_id;
  
  RETURN session_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete exploration session
CREATE OR REPLACE FUNCTION complete_exploration_session_safe(
  session_id_param UUID,
  final_insights_param JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE exploration_sessions
  SET 
    status = 'completed',
    completed_at = NOW(),
    insights = final_insights_param,
    progress_percentage = 100
  WHERE id = session_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;