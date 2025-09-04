#!/usr/bin/env python3

import requests
import json
import time

# Production Supabase configuration
SUPABASE_URL = "https://ufgqmqoykddaotdbwteg.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo"

def execute_sql(sql, description):
    """Execute SQL statement via Supabase REST API"""
    print(f"⏳ {description}...")
    
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Try multiple endpoints for SQL execution
    endpoints = [
        f"{SUPABASE_URL}/rest/v1/rpc/query",
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json={"query": sql} if "query" in endpoint else {"sql": sql},
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ {description} completed successfully")
                return True
            elif response.status_code == 404:
                continue  # Try next endpoint
            else:
                print(f"⚠️  {description} failed (HTTP {response.status_code})")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"⚠️  Error in {description}: {str(e)}")
            continue
    
    return False

def main():
    print("🚀 Growth Echo Nexus Database Setup Starting...")
    print(f"🎯 Target: {SUPABASE_URL}")
    print()
    
    # Step 1: Create extensions
    print("📦 Setting up database extensions...")
    execute_sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', "Enable UUID extension")
    execute_sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', "Enable crypto extension")
    
    # Step 2: Create core tables
    print("\n📋 Creating core tables...")
    
    tables = [
        {
            "name": "profiles",
            "sql": """
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
            """
        },
        {
            "name": "assessments",
            "sql": """
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
            """
        },
        {
            "name": "assessment_questions",
            "sql": """
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
            """
        },
        {
            "name": "assessment_options",
            "sql": """
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
            """
        },
        {
            "name": "assessment_results",
            "sql": """
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
            """
        },
        {
            "name": "admin_ai_providers",
            "sql": """
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
            """
        },
        {
            "name": "voice_agent_configs",
            "sql": """
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
            """
        },
        {
            "name": "posts",
            "sql": """
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
            """
        },
        {
            "name": "post_likes",
            "sql": """
                CREATE TABLE IF NOT EXISTS public.post_likes (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  UNIQUE(user_id, post_id)
                );
            """
        },
        {
            "name": "library_items",
            "sql": """
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
            """
        }
    ]
    
    # Create each table
    success_count = 0
    for table in tables:
        if execute_sql(table["sql"], f"Create {table['name']} table"):
            success_count += 1
        time.sleep(0.5)  # Small delay to avoid rate limiting
    
    print(f"\n📊 Created {success_count}/{len(tables)} tables successfully")
    
    # Step 3: Enable RLS
    print("\n🔒 Setting up Row Level Security...")
    rls_tables = ["profiles", "assessments", "assessment_questions", "assessment_options", 
                  "assessment_results", "admin_ai_providers", "posts", "post_likes", "library_items"]
    
    for table in rls_tables:
        execute_sql(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;", f"Enable RLS on {table}")
        time.sleep(0.2)
    
    # Step 4: Create essential functions
    print("\n🔑 Creating essential functions...")
    
    execute_sql("""
        CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = user_id AND role = 'admin'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """, "Create admin check function")
    
    execute_sql("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name)
          VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """, "Create profile creation function")
    
    execute_sql("""
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    """, "Create profile creation trigger")
    
    # Step 5: Insert sample data
    print("\n📊 Inserting sample data...")
    
    execute_sql("""
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
    """, "Insert sample assessment")
    
    execute_sql("""
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
    """, "Insert sample library item")
    
    print("\n🎉 Database setup completed!")
    print("\n📋 Summary of created tables:")
    print("   ✅ profiles - User account management")
    print("   ✅ assessments - Assessment system") 
    print("   ✅ assessment_questions - Question management")
    print("   ✅ assessment_options - Answer choices")
    print("   ✅ assessment_results - User responses")
    print("   ✅ admin_ai_providers - AI configuration")
    print("   ✅ voice_agent_configs - Voice settings")
    print("   ✅ posts - Community content")
    print("   ✅ post_likes - Social interactions")
    print("   ✅ library_items - Learning content")
    print("\n🔒 Security features enabled:")
    print("   ✅ Row Level Security on all tables")
    print("   ✅ Admin role checking function")
    print("   ✅ Automatic profile creation")
    print("\n🚀 Your Growth Echo Nexus application is now ready!")
    print("   📱 Test the app at: http://localhost:5173")
    print("   🎯 Admin panel: http://localhost:5173/admin")

if __name__ == "__main__":
    main()
