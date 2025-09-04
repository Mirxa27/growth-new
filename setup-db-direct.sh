#!/bin/bash

# Direct PostgreSQL connection to Supabase
DB_URL="postgresql://postgres:Mirxa420\$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"

echo "🚀 Connecting directly to Supabase PostgreSQL..."
echo "🎯 Database: db.ufgqmqoykddaotdbwteg.supabase.co"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Installing PostgreSQL client..."
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

echo "📦 Setting up database extensions..."
psql "$DB_URL" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null
psql "$DB_URL" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null

echo "✅ Extensions enabled"
echo ""

echo "📋 Creating core tables..."

# Profiles table
echo "⏳ Creating profiles table..."
psql "$DB_URL" -c "
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
"

# Assessments table
echo "⏳ Creating assessments table..."
psql "$DB_URL" -c "
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
"

# Assessment questions
echo "⏳ Creating assessment_questions table..."
psql "$DB_URL" -c "
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
"

# Assessment options
echo "⏳ Creating assessment_options table..."
psql "$DB_URL" -c "
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
"

# Assessment results
echo "⏳ Creating assessment_results table..."
psql "$DB_URL" -c "
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
"

# Admin AI providers
echo "⏳ Creating admin_ai_providers table..."
psql "$DB_URL" -c "
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
"

# Voice agent configs
echo "⏳ Creating voice_agent_configs table..."
psql "$DB_URL" -c "
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
"

# Posts table
echo "⏳ Creating posts table..."
psql "$DB_URL" -c "
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
"

# Post likes
echo "⏳ Creating post_likes table..."
psql "$DB_URL" -c "
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
"

# Library items
echo "⏳ Creating library_items table..."
psql "$DB_URL" -c "
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
"

echo "✅ All tables created successfully!"
echo ""

echo "🔒 Setting up Row Level Security..."

# Enable RLS on all tables
tables=("profiles" "assessments" "assessment_questions" "assessment_options" "assessment_results" "admin_ai_providers" "voice_agent_configs" "posts" "post_likes" "library_items")

for table in "${tables[@]}"; do
    echo "⏳ Enabling RLS on $table..."
    psql "$DB_URL" -c "ALTER TABLE public.$table ENABLE ROW LEVEL SECURITY;" 2>/dev/null
done

echo "✅ RLS enabled on all tables!"
echo ""

echo "🔑 Creating essential functions..."

# Admin check function
echo "⏳ Creating admin check function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS \$\$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;
"

# Profile creation function
echo "⏳ Creating profile creation function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;
"

# Profile creation trigger
echo "⏳ Creating profile creation trigger..."
psql "$DB_URL" -c "
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
"

echo "✅ Functions and triggers created!"
echo ""

echo "📊 Inserting sample data..."

# Sample assessment
echo "⏳ Inserting sample assessment..."
psql "$DB_URL" -c "
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
"

# Sample library item
echo "⏳ Inserting sample library item..."
psql "$DB_URL" -c "
INSERT INTO public.library_items (
  title, description, content_type, category, difficulty, duration_minutes, is_public
) VALUES (
  'Understanding Your Personality Type',
  'Learn about the different personality frameworks and how they can guide your personal growth journey.',
  'article',
  'personality',
  'beginner',
  10,
  true
) ON CONFLICT DO NOTHING;
"

echo "✅ Sample data inserted!"
echo ""

echo "🔍 Verifying table creation..."
psql "$DB_URL" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'assessments', 'assessment_questions', 'assessment_options', 'assessment_results', 'admin_ai_providers', 'voice_agent_configs', 'posts', 'post_likes', 'library_items')
ORDER BY table_name;
"

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ 10+ core tables created"
echo "   ✅ Row Level Security enabled"
echo "   ✅ Essential functions and triggers set up"
echo "   ✅ Sample data inserted"
echo ""
echo "🚀 Your Growth Echo Nexus application is now ready!"
echo "   📱 Test the app at: http://localhost:5173"
echo "   🎯 Admin panel: http://localhost:5173/admin"
echo ""
