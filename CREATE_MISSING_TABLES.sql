-- NEWOMEN PLATFORM - CREATE ALL MISSING TABLES
-- Run this SQL directly in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql

-- 1. Create user_memory_profiles table
CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_metrics JSONB DEFAULT '{}',
  current_level INTEGER DEFAULT 1,
  crystal_balance INTEGER DEFAULT 0,
  personality_traits JSONB DEFAULT '{}',
  growth_goals JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '{}',
  narrative_themes JSONB DEFAULT '{}',
  emotional_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  crystal_balance INTEGER DEFAULT 0,
  progress_metrics JSONB DEFAULT '{}',
  experience_points INTEGER DEFAULT 0,
  total_assessments INTEGER DEFAULT 0,
  total_chat_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  crystals INTEGER DEFAULT 0,
  unlocked BOOLEAN DEFAULT true,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 4. Create daily_streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1,
  activity_type TEXT DEFAULT 'login',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 5. Create daily_affirmations table
CREATE TABLE IF NOT EXISTS public.daily_affirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affirmation_text TEXT NOT NULL,
  generated_date DATE NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, generated_date)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON public.user_memory_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_date ON public.daily_streaks(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_affirmations_user_id ON public.daily_affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_affirmations_date ON public.daily_affirmations(generated_date DESC);

-- 7. Enable Row Level Security
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for user_memory_profiles
CREATE POLICY "Users can manage their memory profiles" ON public.user_memory_profiles
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 9. Create RLS policies for user_progress
CREATE POLICY "Users can manage their progress" ON public.user_progress
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 10. Create RLS policies for user_achievements
CREATE POLICY "Users can view their achievements" ON public.user_achievements
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 11. Create RLS policies for daily_streaks
CREATE POLICY "Users can manage their streaks" ON public.daily_streaks
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 12. Create RLS policies for daily_affirmations
CREATE POLICY "Users can view their affirmations" ON public.daily_affirmations
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 13. Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_memory_profiles_updated_at
    BEFORE UPDATE ON public.user_memory_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Insert sample data for admin user
INSERT INTO public.user_memory_profiles (user_id, progress_metrics, current_level, crystal_balance) VALUES
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', '{"assessments_completed": 5, "chat_sessions": 10}', 10, 1000)
ON CONFLICT (user_id) DO UPDATE SET
  progress_metrics = EXCLUDED.progress_metrics,
  current_level = EXCLUDED.current_level,
  crystal_balance = EXCLUDED.crystal_balance,
  updated_at = NOW();

INSERT INTO public.user_progress (user_id, current_level, crystal_balance, progress_metrics) VALUES
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', 10, 1000, '{"total_assessments": 5, "total_chat_sessions": 10}')
ON CONFLICT (user_id) DO UPDATE SET
  current_level = EXCLUDED.current_level,
  crystal_balance = EXCLUDED.crystal_balance,
  progress_metrics = EXCLUDED.progress_metrics,
  updated_at = NOW();

INSERT INTO public.daily_streaks (user_id, date, streak_count) VALUES
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', CURRENT_DATE, 7)
ON CONFLICT (user_id, date) DO UPDATE SET
  streak_count = EXCLUDED.streak_count;

INSERT INTO public.daily_affirmations (user_id, affirmation_text, generated_date) VALUES
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', 'You are a powerful leader transforming lives through technology and compassion.', CURRENT_DATE)
ON CONFLICT (user_id, generated_date) DO UPDATE SET
  affirmation_text = EXCLUDED.affirmation_text;

INSERT INTO public.user_achievements (user_id, achievement_id, title, description, crystals) VALUES
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', 'platform_creator', 'Platform Creator', 'Created the Newomen platform', 500),
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', 'admin_access', 'Admin Access', 'Gained admin privileges', 100),
('aa8e99c7-32e2-4e82-975b-5bd539da6df4', 'first_login', 'First Login', 'Completed first login', 50)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- 15. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_affirmations TO authenticated;

-- 16. Add comments for documentation
COMMENT ON TABLE public.user_memory_profiles IS 'User memory profiles for AI personalization';
COMMENT ON TABLE public.user_progress IS 'User progress tracking and gamification';
COMMENT ON TABLE public.user_achievements IS 'User achievements and milestones';
COMMENT ON TABLE public.daily_streaks IS 'Daily activity streaks';
COMMENT ON TABLE public.daily_affirmations IS 'Daily personalized affirmations';

-- SUCCESS MESSAGE
SELECT 'All missing tables created successfully! Admin panel should now work properly.' as result;