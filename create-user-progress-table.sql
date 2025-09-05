-- Create user_progress table for tracking user journey and achievements
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Assessment Progress
    assessments_completed INTEGER DEFAULT 0,
    total_assessment_score INTEGER DEFAULT 0,
    favorite_assessment_category TEXT,
    last_assessment_date TIMESTAMP WITH TIME ZONE,
    
    -- Learning Progress
    lessons_completed INTEGER DEFAULT 0,
    courses_enrolled INTEGER DEFAULT 0,
    learning_streak_days INTEGER DEFAULT 0,
    last_learning_activity TIMESTAMP WITH TIME ZONE,
    
    -- Engagement Metrics
    login_streak_days INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in minutes
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Achievement System
    achievements JSONB DEFAULT '[]'::jsonb,
    badges_earned JSONB DEFAULT '[]'::jsonb,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    
    -- Personalization
    preferred_difficulty TEXT DEFAULT 'beginner',
    interests JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON public.user_progress(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_login ON public.user_progress(last_login);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own progress
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress" ON public.user_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admin access
CREATE POLICY "Admin can view all progress" ON public.user_progress
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Function to automatically create user progress when profile is created
CREATE OR REPLACE FUNCTION public.create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user progress automatically
DROP TRIGGER IF EXISTS on_profile_created_create_progress ON public.profiles;
CREATE TRIGGER on_profile_created_create_progress
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_user_progress();
