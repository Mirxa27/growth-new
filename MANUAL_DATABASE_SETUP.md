# 🚀 MANUAL DATABASE SETUP GUIDE
## Complete Growth Echo Nexus Database Implementation

**⚠️ IMPORTANT**: Copy and run these SQL commands in your Supabase dashboard's SQL Editor.

### 📋 **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg
2. Click "SQL Editor" in the left sidebar
3. Create a "New query"

### 🎯 **Step 2: Copy & Run This Complete Script**

```sql
-- ========================================
-- GROWTH ECHO NEXUS - COMPLETE DATABASE SETUP
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CORE TABLES
-- ========================================

-- Profiles table (user accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estimated_time INTEGER DEFAULT 10,
  personality_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'scale', 'free_text')),
  position INTEGER DEFAULT 1,
  scale_min INTEGER DEFAULT 1,
  scale_max INTEGER DEFAULT 5,
  scale_labels JSONB,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment options
CREATE TABLE IF NOT EXISTS public.assessment_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 1,
  feedback TEXT,
  scoring_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment results
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_session_id TEXT,
  score INTEGER DEFAULT 0,
  total_possible INTEGER DEFAULT 0,
  percentage DECIMAL(5,2),
  personality_type TEXT,
  responses JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin AI providers
CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'elevenlabs')),
  api_key TEXT,
  api_endpoint TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 100,
  cost_per_token DECIMAL(10,8),
  configuration JSONB DEFAULT '{}'::jsonb,
  system_prompt TEXT,
  available_models JSONB DEFAULT '[]'::jsonb,
  available_voices JSONB DEFAULT '[]'::jsonb,
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  timeout INTEGER DEFAULT 30,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice agent configurations
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT DEFAULT 'alloy',
  model TEXT DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice sessions
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
  session_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error')),
  duration_seconds INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'link')),
  media_url TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library items
CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'video', 'audio', 'quiz', 'assessment')),
  content_url TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User library progress
CREATE TABLE IF NOT EXISTS public.user_library_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES public.library_items(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT false,
  is_bookmarked BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, library_item_id)
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessment policies
DROP POLICY IF EXISTS "Anyone can view public assessments" ON public.assessments;
CREATE POLICY "Anyone can view public assessments" ON public.assessments
  FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
CREATE POLICY "Users can view their own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create assessments" ON public.assessments;
CREATE POLICY "Users can create assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Assessment questions policies
DROP POLICY IF EXISTS "Anyone can view questions for public assessments" ON public.assessment_questions;
CREATE POLICY "Anyone can view questions for public assessments" ON public.assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE id = assessment_id AND visibility = 'public'
    )
  );

-- Assessment options policies
DROP POLICY IF EXISTS "Anyone can view options for public assessments" ON public.assessment_options;
CREATE POLICY "Anyone can view options for public assessments" ON public.assessment_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessment_questions aq
      JOIN public.assessments a ON a.id = aq.assessment_id
      WHERE aq.id = question_id AND a.visibility = 'public'
    )
  );

-- Assessment results policies
DROP POLICY IF EXISTS "Users can create their own results" ON public.assessment_results;
CREATE POLICY "Users can create their own results" ON public.assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin AI providers policies
DROP POLICY IF EXISTS "Admins can manage AI providers" ON public.admin_ai_providers;
CREATE POLICY "Admins can manage AI providers" ON public.admin_ai_providers
  FOR ALL USING (public.is_admin(auth.uid()));

-- Voice configs policies
DROP POLICY IF EXISTS "Users can manage their own voice configs" ON public.voice_agent_configs;
CREATE POLICY "Users can manage their own voice configs" ON public.voice_agent_configs
  FOR ALL USING (auth.uid() = user_id);

-- Posts policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Library items policies
DROP POLICY IF EXISTS "Anyone can view public library items" ON public.library_items;
CREATE POLICY "Anyone can view public library items" ON public.library_items
  FOR SELECT USING (is_public = true);

-- User library progress policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_library_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_library_progress
  FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- ESSENTIAL FUNCTIONS
-- ========================================

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment post likes
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.post_likes (user_id, post_id)
  VALUES (auth.uid(), post_id)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  UPDATE public.posts 
  SET likes_count = (
    SELECT COUNT(*) FROM public.post_likes WHERE public.post_likes.post_id = posts.id
  )
  WHERE id = post_id
  RETURNING likes_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit assessment
CREATE OR REPLACE FUNCTION public.submit_assessment(
  _assessment_id BIGINT,
  _responses JSONB,
  _visitor_session_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  _score INTEGER := 0;
  _total_possible INTEGER := 0;
  _percentage DECIMAL(5,2);
  _result_id BIGINT;
  _assessment RECORD;
BEGIN
  SELECT * INTO _assessment
  FROM public.assessments
  WHERE id = _assessment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found');
  END IF;

  SELECT COUNT(*) INTO _total_possible
  FROM public.assessment_questions
  WHERE assessment_id = _assessment_id;

  _percentage := CASE 
    WHEN _total_possible > 0 THEN (_score::DECIMAL / _total_possible) * 100
    ELSE 100
  END;

  INSERT INTO public.assessment_results (
    assessment_id, user_id, visitor_session_id, score, total_possible, 
    percentage, personality_type, responses
  )
  VALUES (
    _assessment_id, auth.uid(), _visitor_session_id, _score, _total_possible,
    _percentage, _assessment.personality_type, _responses
  )
  RETURNING id INTO _result_id;

  RETURN jsonb_build_object(
    'result_id', _result_id,
    'score', _score,
    'total_possible', _total_possible,
    'percentage', _percentage,
    'personality_type', _assessment.personality_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample public assessment
INSERT INTO public.assessments (
  title, description, visibility, category, estimated_time, personality_type
) VALUES (
  'Personality Discovery Assessment',
  'Discover your unique personality traits and growth areas through this comprehensive assessment.',
  'public',
  'personality',
  15,
  'MBTI'
) ON CONFLICT DO NOTHING;

-- Insert sample library items
INSERT INTO public.library_items (
  title, description, content_type, category, difficulty, duration_minutes, tags, is_public
) VALUES 
  (
    'Understanding Your Personality Type',
    'Learn about the different personality frameworks and how they can guide your personal growth journey.',
    'article',
    'personality',
    'beginner',
    10,
    ARRAY['personality', 'self-discovery', 'psychology'],
    true
  ),
  (
    'Building Emotional Intelligence',
    'Develop your emotional awareness and interpersonal skills for better relationships and personal success.',
    'article',
    'emotional-intelligence',
    'intermediate',
    15,
    ARRAY['emotions', 'relationships', 'communication'],
    true
  )
ON CONFLICT DO NOTHING;

-- Insert default AI provider configuration
INSERT INTO public.admin_ai_providers (
  name,
  provider_type,
  is_active,
  priority,
  configuration,
  system_prompt,
  model_name,
  max_tokens,
  temperature
) VALUES (
  'Default OpenAI',
  'openai',
  true,
  1,
  '{"model": "gpt-4o-mini", "api_key": ""}',
  'You are NewMe, an AI companion focused on personal growth, self-discovery, and empowerment for women. Provide thoughtful, supportive responses.',
  'gpt-4o-mini',
  1000,
  0.7
) ON CONFLICT DO NOTHING;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_results;

-- Success message
SELECT 'Growth Echo Nexus database setup completed successfully!' as message;
```

### 🎯 **Step 3: Verify Installation**

After running the script above, verify it worked by running:

```sql
-- Check created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'assessments', 'assessment_questions', 'assessment_options', 
  'assessment_results', 'admin_ai_providers', 'voice_agent_configs', 
  'posts', 'post_likes', 'library_items'
)
ORDER BY table_name;
```

### ✅ **Expected Results**
You should see 10+ tables created including:
- ✅ profiles
- ✅ assessments  
- ✅ assessment_questions
- ✅ assessment_options
- ✅ assessment_results
- ✅ admin_ai_providers
- ✅ voice_agent_configs
- ✅ posts
- ✅ post_likes
- ✅ library_items

### 🚀 **After Success**
Your Growth Echo Nexus application will have:
- ✅ Complete database schema
- ✅ Row Level Security enabled
- ✅ Automatic profile creation
- ✅ Sample assessment data
- ✅ Admin panel functionality
- ✅ Community features
- ✅ Learning library

**🎯 Ready to test at: http://localhost:5173**
