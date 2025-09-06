-- Create user_memory_profiles table for NewMe AI companion
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON user_memory_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_subscription_tier ON user_memory_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_current_level ON user_memory_profiles(current_level);

-- Enable RLS
ALTER TABLE user_memory_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memory profile"
  ON user_memory_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory profile"
  ON user_memory_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory profile"
  ON user_memory_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_user_memory_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_memory_profiles_updated_at ON user_memory_profiles;
CREATE TRIGGER update_user_memory_profiles_updated_at
  BEFORE UPDATE ON user_memory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_profiles_updated_at();

-- Function to award crystals to users
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

-- Function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT subscription_tier INTO tier
  FROM user_memory_profiles
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(tier, 'discovery');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to level up user
CREATE OR REPLACE FUNCTION level_up_user(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  UPDATE user_memory_profiles
  SET 
    current_level = current_level + 1,
    crystal_balance = crystal_balance + (current_level * 10), -- Bonus crystals for leveling up
    updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING current_level INTO new_level;
  
  RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create voice_sessions table for speech-to-speech conversations
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

-- Create indexes for voice sessions
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created_at ON voice_sessions(created_at);

-- Enable RLS for voice sessions
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice sessions
CREATE POLICY "Users can view their own voice sessions"
  ON voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice sessions"
  ON voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
  ON voice_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update voice sessions updated_at
CREATE OR REPLACE FUNCTION update_voice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for voice sessions updated_at
DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
  BEFORE UPDATE ON voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_sessions_updated_at();

-- Create daily_affirmations table
CREATE TABLE IF NOT EXISTS daily_affirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affirmation_text TEXT NOT NULL,
  generated_date DATE DEFAULT CURRENT_DATE,
  is_viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, generated_date)
);

-- Create indexes for daily affirmations
CREATE INDEX IF NOT EXISTS idx_daily_affirmations_user_id ON daily_affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_affirmations_generated_date ON daily_affirmations(generated_date);

-- Enable RLS for daily affirmations
ALTER TABLE daily_affirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily affirmations
CREATE POLICY "Users can view their own daily affirmations"
  ON daily_affirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily affirmations"
  ON daily_affirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily affirmations"
  ON daily_affirmations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);