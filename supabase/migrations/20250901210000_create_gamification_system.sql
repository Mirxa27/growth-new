-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for user achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);

-- Enable RLS for user achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create crystal_activity_log table for tracking crystal transactions
CREATE TABLE IF NOT EXISTS crystal_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for crystal activity log
CREATE INDEX IF NOT EXISTS idx_crystal_activity_log_user_id ON crystal_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_crystal_activity_log_timestamp ON crystal_activity_log(timestamp);

-- Enable RLS for crystal activity log
ALTER TABLE crystal_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crystal activity log
CREATE POLICY "Users can view their own crystal activity"
  ON crystal_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crystal activity"
  ON crystal_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create daily_insights table for personalized daily content
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('affirmation', 'tip', 'challenge', 'reflection')),
  content TEXT NOT NULL,
  generated_date DATE DEFAULT CURRENT_DATE,
  is_viewed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, insight_type, generated_date)
);

-- Create indexes for daily insights
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON daily_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_generated_date ON daily_insights(generated_date);
CREATE INDEX IF NOT EXISTS idx_daily_insights_type ON daily_insights(insight_type);

-- Enable RLS for daily insights
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily insights
CREATE POLICY "Users can view their own daily insights"
  ON daily_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily insights"
  ON daily_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily insights"
  ON daily_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get user's current level based on crystals
CREATE OR REPLACE FUNCTION get_user_level(crystal_balance INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level_requirements INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300, 19200, 21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800, 43700];
  user_level INTEGER := 0;
BEGIN
  FOR i IN REVERSE array_length(level_requirements, 1)..1 LOOP
    IF crystal_balance >= level_requirements[i] THEN
      user_level := i - 1;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN user_level;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level progress percentage
CREATE OR REPLACE FUNCTION get_level_progress(crystal_balance INTEGER, current_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  level_requirements INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300, 19200, 21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800, 43700];
  current_requirement INTEGER;
  next_requirement INTEGER;
  progress_crystals INTEGER;
  required_for_next INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Get current and next level requirements
  current_requirement := level_requirements[current_level + 1];
  
  IF current_level + 1 < array_length(level_requirements, 1) THEN
    next_requirement := level_requirements[current_level + 2];
  ELSE
    next_requirement := current_requirement + 1000; -- Default increment for max level
  END IF;
  
  -- Calculate progress
  progress_crystals := crystal_balance - current_requirement;
  required_for_next := next_requirement - current_requirement;
  
  IF required_for_next > 0 THEN
    progress_percentage := GREATEST(0, LEAST(100, (progress_crystals * 100) / required_for_next));
  ELSE
    progress_percentage := 100;
  END IF;
  
  RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to award achievement to user
CREATE OR REPLACE FUNCTION award_achievement(
  user_id_param UUID,
  achievement_id_param TEXT,
  crystal_reward INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
  achievement_exists BOOLEAN;
BEGIN
  -- Check if user already has this achievement
  SELECT EXISTS(
    SELECT 1 FROM user_achievements 
    WHERE user_id = user_id_param AND achievement_id = achievement_id_param
  ) INTO achievement_exists;
  
  -- If achievement doesn't exist, award it
  IF NOT achievement_exists THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (user_id_param, achievement_id_param);
    
    -- Award crystals if specified
    IF crystal_reward > 0 THEN
      PERFORM award_crystals_to_user(user_id_param, crystal_reward);
      
      -- Log crystal activity
      INSERT INTO crystal_activity_log (user_id, amount, reason)
      VALUES (user_id_param, crystal_reward, 'achievement_' || achievement_id_param);
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's daily streak
CREATE OR REPLACE FUNCTION get_daily_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_metrics JSONB;
  daily_streak INTEGER := 0;
BEGIN
  SELECT progress_metrics INTO user_metrics
  FROM user_memory_profiles
  WHERE user_id = user_id_param;
  
  IF user_metrics IS NOT NULL AND user_metrics ? 'daily_streak' THEN
    daily_streak := (user_metrics->>'daily_streak')::INTEGER;
  END IF;
  
  RETURN COALESCE(daily_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_metrics JSONB;
  last_login_date TEXT;
  current_streak INTEGER := 0;
  new_streak INTEGER := 1;
  today_date TEXT := CURRENT_DATE::TEXT;
  days_diff INTEGER;
  streak_broken BOOLEAN := FALSE;
  bonus_crystals INTEGER := 0;
  result JSONB;
BEGIN
  -- Get current user metrics
  SELECT progress_metrics INTO user_metrics
  FROM user_memory_profiles
  WHERE user_id = user_id_param;
  
  IF user_metrics IS NULL THEN
    user_metrics := '{}'::JSONB;
  END IF;
  
  -- Get last login date and current streak
  last_login_date := user_metrics->>'last_login_date';
  current_streak := COALESCE((user_metrics->>'daily_streak')::INTEGER, 0);
  
  -- Calculate streak
  IF last_login_date IS NOT NULL THEN
    days_diff := CURRENT_DATE - last_login_date::DATE;
    
    IF days_diff = 1 THEN
      -- Consecutive day
      new_streak := current_streak + 1;
    ELSIF days_diff = 0 THEN
      -- Same day, keep current streak
      new_streak := current_streak;
    ELSE
      -- Streak broken or first time
      new_streak := 1;
      streak_broken := days_diff > 1;
    END IF;
  END IF;
  
  -- Calculate bonus crystals (max 50 per day)
  IF new_streak > 1 THEN
    bonus_crystals := LEAST(new_streak * 5, 50);
  END IF;
  
  -- Update user metrics
  user_metrics := user_metrics || jsonb_build_object(
    'daily_streak', new_streak,
    'last_login_date', today_date,
    'total_login_days', COALESCE((user_metrics->>'total_login_days')::INTEGER, 0) + 1
  );
  
  UPDATE user_memory_profiles
  SET progress_metrics = user_metrics
  WHERE user_id = user_id_param;
  
  -- Award bonus crystals
  IF bonus_crystals > 0 THEN
    PERFORM award_crystals_to_user(user_id_param, bonus_crystals);
    
    INSERT INTO crystal_activity_log (user_id, amount, reason)
    VALUES (user_id_param, bonus_crystals, 'daily_streak_' || new_streak);
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'streak_count', new_streak,
    'streak_broken', streak_broken,
    'bonus_crystals', bonus_crystals
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily insight for user
CREATE OR REPLACE FUNCTION generate_daily_insight(
  user_id_param UUID,
  insight_type_param TEXT,
  content_param TEXT,
  metadata_param JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
  insight_exists BOOLEAN;
BEGIN
  -- Check if insight already exists for today
  SELECT EXISTS(
    SELECT 1 FROM daily_insights 
    WHERE user_id = user_id_param 
    AND insight_type = insight_type_param 
    AND generated_date = CURRENT_DATE
  ) INTO insight_exists;
  
  -- If insight doesn't exist, create it
  IF NOT insight_exists THEN
    INSERT INTO daily_insights (user_id, insight_type, content, metadata)
    VALUES (user_id_param, insight_type_param, content_param, metadata_param);
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for user dashboard data
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  ump.user_id,
  ump.current_level,
  ump.crystal_balance,
  get_level_progress(ump.crystal_balance, ump.current_level) as level_progress,
  get_daily_streak(ump.user_id) as daily_streak,
  COALESCE(achievement_counts.total_achievements, 0) as total_achievements,
  COALESCE(recent_activity.recent_actions, 0) as recent_actions
FROM user_memory_profiles ump
LEFT JOIN (
  SELECT 
    user_id, 
    COUNT(*) as total_achievements
  FROM user_achievements 
  GROUP BY user_id
) achievement_counts ON ump.user_id = achievement_counts.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as recent_actions
  FROM crystal_activity_log 
  WHERE timestamp >= NOW() - INTERVAL '7 days'
  GROUP BY user_id
) recent_activity ON ump.user_id = recent_activity.user_id;