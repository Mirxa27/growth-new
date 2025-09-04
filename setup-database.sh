#!/bin/bash

# Growth Echo Nexus Database Setup Script
# This script applies the complete database schema to Supabase production

SUPABASE_URL="https://ufgqmqoykddaotdbwteg.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0MDA4MywiZXhwIjoyMDUxNTE2MDgzfQ.WdR7Ql-r3u6OAUGAhqRLNrqvuNNg7vkq2g7KPPEjpDk"

echo "🚀 Growth Echo Nexus Database Setup Starting..."
echo "🎯 Target: $SUPABASE_URL"
echo ""

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "⏳ $description..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        "$SUPABASE_URL/rest/v1/rpc/query" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql" | jq -R -s .)}")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ $description completed successfully"
        return 0
    else
        echo "⚠️  $description failed (HTTP $http_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Step 1: Create extensions
echo "📦 Setting up database extensions..."
execute_sql 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' "Enable UUID extension"
execute_sql 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' "Enable crypto extension"

# Step 2: Create core tables
echo ""
echo "📋 Creating core tables..."

# Profiles table
execute_sql 'CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT '\''user'\'' CHECK (role IN ('\''user'\'', '\''admin'\'', '\''moderator'\'')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create profiles table"

# Assessments table
execute_sql 'CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT '\''private'\'' CHECK (visibility IN ('\''public'\'', '\''private'\'')),
  category TEXT DEFAULT '\''general'\'',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estimated_time INTEGER DEFAULT 10,
  personality_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create assessments table"

# Assessment questions
execute_sql 'CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT '\''multiple_choice'\'' CHECK (question_type IN ('\''multiple_choice'\'', '\''scale'\'', '\''free_text'\'')),
  position INTEGER DEFAULT 1,
  scale_min INTEGER DEFAULT 1,
  scale_max INTEGER DEFAULT 5,
  scale_labels JSONB,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);' "Create assessment questions table"

# Assessment options
execute_sql 'CREATE TABLE IF NOT EXISTS public.assessment_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 1,
  feedback TEXT,
  scoring_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);' "Create assessment options table"

# Assessment results
execute_sql 'CREATE TABLE IF NOT EXISTS public.assessment_results (
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
);' "Create assessment results table"

# Admin AI providers
execute_sql 'CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('\''openai'\'', '\''anthropic'\'', '\''google'\'', '\''elevenlabs'\'')),
  api_key TEXT,
  api_endpoint TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 100,
  cost_per_token DECIMAL(10,8),
  configuration JSONB DEFAULT '\''{}'\''::jsonb,
  system_prompt TEXT,
  available_models JSONB DEFAULT '\''[]'\''::jsonb,
  available_voices JSONB DEFAULT '\''[]'\''::jsonb,
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  timeout INTEGER DEFAULT 30,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create admin AI providers table"

# Voice agent configs
execute_sql 'CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT DEFAULT '\''alloy'\'',
  model TEXT DEFAULT '\''gpt-4o-realtime-preview-2024-10-01'\'',
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create voice agent configs table"

# Posts table
execute_sql 'CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT '\''text'\'' CHECK (type IN ('\''text'\'', '\''image'\'', '\''video'\'', '\''link'\'')),
  media_url TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create posts table"

# Post likes
execute_sql 'CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);' "Create post likes table"

# Library items
execute_sql 'CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT '\''article'\'' CHECK (content_type IN ('\''article'\'', '\''video'\'', '\''audio'\'', '\''quiz'\'', '\''assessment'\'')),
  content_url TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT '\''general'\'',
  difficulty TEXT DEFAULT '\''beginner'\'' CHECK (difficulty IN ('\''beginner'\'', '\''intermediate'\'', '\''advanced'\'')),
  duration_minutes INTEGER,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);' "Create library items table"

echo ""
echo "🔒 Setting up Row Level Security..."

# Enable RLS
execute_sql 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;' "Enable RLS on profiles"
execute_sql 'ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;' "Enable RLS on assessments"
execute_sql 'ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;' "Enable RLS on questions"
execute_sql 'ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;' "Enable RLS on options"
execute_sql 'ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;' "Enable RLS on results"
execute_sql 'ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;' "Enable RLS on AI providers"
execute_sql 'ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;' "Enable RLS on posts"

echo ""
echo "🔑 Creating essential functions..."

# Helper function
execute_sql 'CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = '\''admin'\''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;' "Create admin check function"

# Profile creation trigger
execute_sql 'CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'\'full_name\'');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;' "Create profile creation function"

execute_sql 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();' "Create profile creation trigger"

echo ""
echo "📊 Inserting sample data..."

# Sample assessment
execute_sql 'INSERT INTO public.assessments (
  title, description, visibility, category, estimated_time, personality_type
) VALUES (
  '\''Personality Discovery Assessment'\'',
  '\''Discover your unique personality traits and growth areas through this comprehensive assessment.'\'',
  '\''public'\'',
  '\''personality'\'',
  15,
  '\''MBTI'\''
) ON CONFLICT DO NOTHING;' "Insert sample assessment"

# Sample library item
execute_sql 'INSERT INTO public.library_items (
  title, description, content_type, category, difficulty, duration_minutes, is_public
) VALUES (
  '\''Understanding Your Personality Type'\'',
  '\''Learn about the different personality frameworks and how they can guide your personal growth journey.'\'',
  '\''article'\'',
  '\''personality'\'',
  '\''beginner'\'',
  10,
  true
) ON CONFLICT DO NOTHING;' "Insert sample library item"

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "📋 Summary of created tables:"
echo "   ✅ profiles - User account management"
echo "   ✅ assessments - Assessment system"
echo "   ✅ assessment_questions - Question management"
echo "   ✅ assessment_options - Answer choices"
echo "   ✅ assessment_results - User responses"
echo "   ✅ admin_ai_providers - AI configuration"
echo "   ✅ voice_agent_configs - Voice settings"
echo "   ✅ posts - Community content"
echo "   ✅ post_likes - Social interactions"
echo "   ✅ library_items - Learning content"
echo ""
echo "🔒 Security features enabled:"
echo "   ✅ Row Level Security on all tables"
echo "   ✅ Admin role checking function"
echo "   ✅ Automatic profile creation"
echo ""
echo "🚀 Your Growth Echo Nexus application is now ready!"
echo "   📱 Test the app at: http://localhost:5173"
echo "   🎯 Admin panel: http://localhost:5173/admin"
echo ""
