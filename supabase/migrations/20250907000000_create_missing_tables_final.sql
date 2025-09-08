-- Create missing tables for complete functionality
-- This migration ensures all required tables exist

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'question', 'story', 'achievement')),
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'community')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create library_items table
CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video', 'article', 'meditation', 'exercise')),
  category TEXT NOT NULL,
  duration_minutes INTEGER,
  file_url TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exploration_sessions table
CREATE TABLE IF NOT EXISTS public.exploration_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'narrative' CHECK (type IN ('narrative', 'identity', 'values', 'goals', 'relationships')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  session_data JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  duration_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON public.community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility ON public.community_posts(visibility);

CREATE INDEX IF NOT EXISTS idx_library_items_type ON public.library_items(type);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON public.library_items(category);
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON public.library_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exploration_sessions_user_id ON public.exploration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exploration_sessions_status ON public.exploration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exploration_sessions_created_at ON public.exploration_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploration_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for community_posts
CREATE POLICY "Public can view published community posts"
ON public.community_posts
FOR SELECT
TO anon, authenticated
USING (is_published = true AND visibility = 'public');

CREATE POLICY "Users can view their own community posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create community posts"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community posts"
ON public.community_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for library_items
CREATE POLICY "Anyone can view public library items"
ON public.library_items
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage library items"
ON public.library_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create RLS policies for exploration_sessions
CREATE POLICY "Users can view their own exploration sessions"
ON public.exploration_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exploration sessions"
ON public.exploration_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exploration sessions"
ON public.exploration_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exploration sessions"
ON public.exploration_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at
    BEFORE UPDATE ON public.library_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exploration_sessions_updated_at
    BEFORE UPDATE ON public.exploration_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for library_items
INSERT INTO public.library_items (title, description, type, category, duration_minutes, tags, difficulty_level) VALUES
('Welcome to Your Growth Journey', 'An introductory meditation to begin your personal growth exploration with Newomen', 'meditation', 'getting_started', 10, ARRAY['beginner', 'meditation', 'welcome'], 'beginner'),
('Understanding Your Narrative Identity', 'Explore the stories that shape who you are and who you''re becoming', 'article', 'identity', 15, ARRAY['identity', 'narrative', 'self-discovery'], 'beginner'),
('Daily Affirmation Practice', 'A guided practice for creating and using personalized affirmations', 'audio', 'mindfulness', 8, ARRAY['affirmations', 'daily-practice', 'mindfulness'], 'beginner'),
('Exploring Your Values', 'A deep dive into identifying and aligning with your core values', 'exercise', 'values', 20, ARRAY['values', 'self-awareness', 'alignment'], 'intermediate'),
('Building Emotional Resilience', 'Learn techniques for developing emotional strength and adaptability', 'audio', 'emotional_intelligence', 25, ARRAY['resilience', 'emotions', 'coping'], 'intermediate')
ON CONFLICT DO NOTHING;

-- Insert sample exploration session templates
INSERT INTO public.exploration_sessions (user_id, title, description, type, status, session_data) 
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1),
  'Sample Narrative Exploration',
  'A template for exploring personal narrative and identity',
  'narrative',
  'completed',
  '{"questions": ["What story do you tell yourself about who you are?", "How has this story served you?", "What new story would you like to write?"], "insights": ["Identity is fluid and can be consciously shaped", "Our stories influence our actions and beliefs"]}'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@newomen.me')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.library_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exploration_sessions TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.community_posts IS 'Community posts and discussions';
COMMENT ON TABLE public.library_items IS 'Audio, video, and text resources for personal growth';
COMMENT ON TABLE public.exploration_sessions IS 'User exploration sessions for narrative identity work';