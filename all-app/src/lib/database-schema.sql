-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Assessment categories
CREATE TABLE IF NOT EXISTS public.assessment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_free BOOLEAN DEFAULT false,
  requires_auth BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.assessment_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  thumbnail_url TEXT,
  time_limit INTEGER, -- in minutes
  passing_score INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  requires_auth BOOLEAN DEFAULT false,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'rating')),
  options JSONB, -- For multiple choice options
  correct_answer JSONB, -- Can store single answer or array of answers
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User assessment attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  time_spent INTEGER, -- in seconds
  ip_address INET,
  user_agent TEXT
);

-- User answers
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer JSONB,
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_hours INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Course modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Course content
CREATE TABLE IF NOT EXISTS public.course_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('video', 'text', 'quiz', 'assignment', 'resource')),
  title TEXT NOT NULL,
  content JSONB, -- Flexible content storage
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI Generated content tracking
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT CHECK (content_type IN ('assessment', 'course', 'test', 'exploration')),
  prompt TEXT NOT NULL,
  ai_provider TEXT,
  ai_model TEXT,
  generated_content JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Free assessment types (insert initial data)
INSERT INTO public.assessment_categories (name, description, slug, is_free, requires_auth, order_index) VALUES
('Personality Assessment', 'Discover your personality type and traits', 'personality', true, false, 1),
('Career Aptitude', 'Find careers that match your skills and interests', 'career', true, false, 2),
('Learning Style', 'Identify your preferred learning methods', 'learning-style', true, false, 3),
('Emotional Intelligence', 'Assess your EQ and emotional awareness', 'eq', true, false, 4),
('Stress Management', 'Evaluate your stress levels and coping strategies', 'stress', true, false, 5),
('Communication Style', 'Understand your communication preferences', 'communication', true, false, 6);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Assessment policies
CREATE POLICY "Public assessments are viewable by everyone" ON public.assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assessments" ON public.assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Assessment attempts policies
CREATE POLICY "Users can view own attempts" ON public.assessment_attempts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create attempts" ON public.assessment_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own attempts" ON public.assessment_attempts
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX idx_assessments_category ON public.assessments(category_id);
CREATE INDEX idx_questions_assessment ON public.questions(assessment_id);
CREATE INDEX idx_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX idx_answers_attempt ON public.user_answers(attempt_id);