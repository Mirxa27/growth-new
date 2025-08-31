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