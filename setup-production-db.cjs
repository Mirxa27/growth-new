#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const DATABASE_URL = 'postgresql://postgres:Mirxa420$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigrations() {
  try {
    console.log('🚀 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // First, let's create the essential tables that are definitely needed
    console.log('🔧 Creating essential tables...');
    
    const essentialTables = `
      -- Enable required extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Profiles table (core user data)
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

      -- Assessments table (core assessment data)
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

      -- Quizzes table
      CREATE TABLE IF NOT EXISTS public.quizzes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
        time_limit_minutes INTEGER,
        passing_score INTEGER DEFAULT 70,
        is_public BOOLEAN DEFAULT false,
        created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Quiz questions
      CREATE TABLE IF NOT EXISTS public.quiz_questions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        points INTEGER DEFAULT 1,
        position INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Quiz question options
      CREATE TABLE IF NOT EXISTS public.quiz_question_options (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false,
        explanation TEXT,
        position INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Quiz attempts
      CREATE TABLE IF NOT EXISTS public.quiz_attempts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        total_possible INTEGER DEFAULT 0,
        percentage DECIMAL(5,2),
        status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Explorations table
      CREATE TABLE IF NOT EXISTS public.explorations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'guided' CHECK (type IN ('guided', 'free', 'structured')),
        visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
        duration_minutes INTEGER DEFAULT 15,
        difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        tags TEXT[],
        content JSONB,
        created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Exploration sessions
      CREATE TABLE IF NOT EXISTS public.exploration_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        exploration_id UUID REFERENCES public.explorations(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
        progress JSONB,
        insights JSONB,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
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

      -- Admin AI providers
      CREATE TABLE IF NOT EXISTS public.admin_ai_providers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google')),
        api_key TEXT,
        api_endpoint TEXT,
        model_name TEXT,
        is_active BOOLEAN DEFAULT true,
        rate_limit INTEGER DEFAULT 100,
        cost_per_token DECIMAL(10,8),
        created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
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

      -- Library items for content
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
    `;

    await client.query(essentialTables);
    console.log('✅ Essential tables created');

    // Now set up RLS policies
    console.log('🔒 Setting up Row Level Security...');
    
    const rlsPolicies = `
      -- Enable RLS on all tables
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.exploration_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.admin_ai_providers ENABLE ROW LEVEL SECURITY;
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

      -- Profiles policies
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
      CREATE POLICY "Users can view their own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
      CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (public.is_admin(auth.uid()));

      -- Assessments policies
      DROP POLICY IF EXISTS "Anyone can view public assessments" ON public.assessments;
      CREATE POLICY "Anyone can view public assessments" ON public.assessments
        FOR SELECT USING (visibility = 'public');

      DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
      CREATE POLICY "Users can view their own assessments" ON public.assessments
        FOR SELECT USING (auth.uid() = created_by);

      DROP POLICY IF EXISTS "Users can create assessments" ON public.assessments;
      CREATE POLICY "Users can create assessments" ON public.assessments
        FOR INSERT WITH CHECK (auth.uid() = created_by);

      DROP POLICY IF EXISTS "Users can update their own assessments" ON public.assessments;
      CREATE POLICY "Users can update their own assessments" ON public.assessments
        FOR UPDATE USING (auth.uid() = created_by);

      -- Assessment questions policies
      DROP POLICY IF EXISTS "Anyone can view questions for public assessments" ON public.assessment_questions;
      CREATE POLICY "Anyone can view questions for public assessments" ON public.assessment_questions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.assessments 
            WHERE id = assessment_id AND visibility = 'public'
          )
        );

      DROP POLICY IF EXISTS "Users can view questions for their assessments" ON public.assessment_questions;
      CREATE POLICY "Users can view questions for their assessments" ON public.assessment_questions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.assessments 
            WHERE id = assessment_id AND created_by = auth.uid()
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
      DROP POLICY IF EXISTS "Users can view their own results" ON public.assessment_results;
      CREATE POLICY "Users can view their own results" ON public.assessment_results
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can create their own results" ON public.assessment_results;
      CREATE POLICY "Users can create their own results" ON public.assessment_results
        FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

      -- Posts policies
      DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
      CREATE POLICY "Anyone can view posts" ON public.posts
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
      CREATE POLICY "Authenticated users can create posts" ON public.posts
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Enable realtime
      ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
    `;

    await client.query(rlsPolicies);
    console.log('✅ RLS policies configured');

    // Create some essential functions
    console.log('🔧 Creating essential functions...');
    
    const functions = `
      -- Function to create assessment with questions
      CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
        assessment_data JSONB,
        questions_data JSONB[]
      )
      RETURNS JSONB AS $$
      DECLARE
        _assessment_id BIGINT;
        _question_data JSONB;
        _question_id BIGINT;
        _option_data JSONB;
        _result JSONB;
      BEGIN
        -- Insert assessment
        INSERT INTO public.assessments (
          title, description, visibility, category, created_by, estimated_time, personality_type
        )
        SELECT 
          assessment_data->>'title',
          assessment_data->>'description',
          COALESCE(assessment_data->>'visibility', 'private'),
          COALESCE(assessment_data->>'category', 'general'),
          auth.uid(),
          COALESCE((assessment_data->>'estimated_time')::INTEGER, 10),
          assessment_data->>'personality_type'
        RETURNING id INTO _assessment_id;

        -- Insert questions
        FOR i IN 1..array_length(questions_data, 1) LOOP
          _question_data := questions_data[i];
          
          INSERT INTO public.assessment_questions (
            assessment_id, question_text, question_type, position, 
            scale_min, scale_max, scale_labels, is_required
          )
          VALUES (
            _assessment_id,
            _question_data->>'question_text',
            COALESCE(_question_data->>'question_type', 'multiple_choice'),
            COALESCE((_question_data->>'position')::INTEGER, i),
            COALESCE((_question_data->>'scale_min')::INTEGER, 1),
            COALESCE((_question_data->>'scale_max')::INTEGER, 5),
            _question_data->'scale_labels',
            COALESCE((_question_data->>'is_required')::BOOLEAN, true)
          )
          RETURNING id INTO _question_id;

          -- Insert options if they exist
          IF _question_data ? 'options' THEN
            FOR j IN 0..jsonb_array_length(_question_data->'options')-1 LOOP
              _option_data := _question_data->'options'->j;
              
              INSERT INTO public.assessment_options (
                question_id, option_text, position, feedback, scoring_data
              )
              VALUES (
                _question_id,
                _option_data->>'option_text',
                COALESCE((_option_data->>'position')::INTEGER, j+1),
                _option_data->>'feedback',
                _option_data->'scoring_data'
              );
            END LOOP;
          END IF;
        END LOOP;

        -- Return the created assessment
        SELECT to_jsonb(a.*) INTO _result
        FROM public.assessments a
        WHERE a.id = _assessment_id;

        RETURN _result;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Function to increment post likes
      CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id UUID)
      RETURNS INTEGER AS $$
      DECLARE
        new_count INTEGER;
      BEGIN
        -- Insert or ignore the like
        INSERT INTO public.post_likes (user_id, post_id)
        VALUES (auth.uid(), post_id)
        ON CONFLICT (user_id, post_id) DO NOTHING;

        -- Update the count
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
        _personality_type TEXT;
      BEGIN
        -- Get assessment details
        SELECT * INTO _assessment
        FROM public.assessments
        WHERE id = _assessment_id;

        IF NOT FOUND THEN
          RETURN jsonb_build_object('error', 'Assessment not found');
        END IF;

        -- Calculate score based on responses
        SELECT COUNT(*) INTO _total_possible
        FROM public.assessment_questions
        WHERE assessment_id = _assessment_id;

        -- Simple scoring - count correct answers
        SELECT COUNT(*) INTO _score
        FROM public.assessment_questions q
        JOIN public.assessment_options o ON o.question_id = q.id
        WHERE q.assessment_id = _assessment_id
        AND o.is_correct = true
        AND (_responses->q.id::text)::text = o.id::text;

        _percentage := CASE 
          WHEN _total_possible > 0 THEN (_score::DECIMAL / _total_possible) * 100
          ELSE 0
        END;

        -- Determine personality type based on assessment type
        _personality_type := _assessment.personality_type;

        -- Insert result
        INSERT INTO public.assessment_results (
          assessment_id, user_id, visitor_session_id, score, total_possible, 
          percentage, personality_type, responses
        )
        VALUES (
          _assessment_id, auth.uid(), _visitor_session_id, _score, _total_possible,
          _percentage, _personality_type, _responses
        )
        RETURNING id INTO _result_id;

        RETURN jsonb_build_object(
          'result_id', _result_id,
          'score', _score,
          'total_possible', _total_possible,
          'percentage', _percentage,
          'personality_type', _personality_type
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await client.query(functions);
    console.log('✅ Essential functions created');

    // Seed some sample data
    console.log('🌱 Seeding sample data...');
    
    const sampleData = `
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

      -- Get the assessment ID
      DO $$
      DECLARE
        assessment_id BIGINT;
        question_id BIGINT;
      BEGIN
        SELECT id INTO assessment_id FROM public.assessments WHERE title = 'Personality Discovery Assessment' LIMIT 1;
        
        IF assessment_id IS NOT NULL THEN
          -- Insert sample questions
          INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position)
          VALUES 
            (assessment_id, 'How do you prefer to spend your free time?', 'multiple_choice', 1),
            (assessment_id, 'When making decisions, you rely more on:', 'multiple_choice', 2),
            (assessment_id, 'In social situations, you typically:', 'multiple_choice', 3)
          ON CONFLICT DO NOTHING;

          -- Insert options for first question
          SELECT id INTO question_id FROM public.assessment_questions 
          WHERE assessment_id = assessment_id AND position = 1 LIMIT 1;
          
          IF question_id IS NOT NULL THEN
            INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
            VALUES 
              (question_id, 'Reading a book or watching movies alone', 1, '{"trait": "introversion"}'),
              (question_id, 'Going out with friends to social events', 2, '{"trait": "extraversion"}'),
              (question_id, 'A mix of both, depending on my mood', 3, '{"trait": "ambiversion"}'),
              (question_id, 'Engaging in creative or artistic activities', 4, '{"trait": "openness"}')
            ON CONFLICT DO NOTHING;
          END IF;

          -- Insert options for second question
          SELECT id INTO question_id FROM public.assessment_questions 
          WHERE assessment_id = assessment_id AND position = 2 LIMIT 1;
          
          IF question_id IS NOT NULL THEN
            INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
            VALUES 
              (question_id, 'Logic and objective analysis', 1, '{"trait": "thinking"}'),
              (question_id, 'Your emotions and personal values', 2, '{"trait": "feeling"}'),
              (question_id, 'Past experiences and proven methods', 3, '{"trait": "sensing"}'),
              (question_id, 'Intuition and future possibilities', 4, '{"trait": "intuition"}')
            ON CONFLICT DO NOTHING;
          END IF;

          -- Insert options for third question
          SELECT id INTO question_id FROM public.assessment_questions 
          WHERE assessment_id = assessment_id AND position = 3 LIMIT 1;
          
          IF question_id IS NOT NULL THEN
            INSERT INTO public.assessment_options (question_id, option_text, position, scoring_data)
            VALUES 
              (question_id, 'Take charge and lead conversations', 1, '{"trait": "extraversion"}'),
              (question_id, 'Listen more than you speak', 2, '{"trait": "introversion"}'),
              (question_id, 'Adapt to the energy of the group', 3, '{"trait": "flexibility"}'),
              (question_id, 'Seek one-on-one deep conversations', 4, '{"trait": "depth"}')
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END $$;

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
        ),
        (
          'Goal Setting for Personal Growth',
          'Master the art of setting and achieving meaningful goals that align with your values and aspirations.',
          'article',
          'goals',
          'beginner',
          12,
          ARRAY['goals', 'planning', 'success'],
          true
        )
      ON CONFLICT DO NOTHING;

      -- Insert sample explorations
      INSERT INTO public.explorations (
        title, description, type, visibility, duration_minutes, difficulty_level, tags, content
      ) VALUES 
        (
          'Values Discovery Journey',
          'Explore your core values and understand how they shape your decisions and life direction.',
          'guided',
          'public',
          20,
          'beginner',
          ARRAY['values', 'self-discovery', 'purpose'],
          '{"steps": [{"title": "Identify Core Values", "description": "Reflect on what matters most to you"}, {"title": "Rank Your Values", "description": "Prioritize your top 5 values"}, {"title": "Align Actions", "description": "Consider how to better align your actions with your values"}]}'
        ),
        (
          'Stress Management Techniques',
          'Learn practical strategies for managing stress and building resilience in daily life.',
          'structured',
          'public',
          25,
          'intermediate',
          ARRAY['stress', 'wellness', 'mindfulness'],
          '{"techniques": [{"name": "Deep Breathing", "description": "Practice 4-7-8 breathing technique"}, {"name": "Progressive Muscle Relaxation", "description": "Systematic tension and release of muscle groups"}, {"name": "Mindful Observation", "description": "Focus attention on present moment sensations"}]}'
        )
      ON CONFLICT DO NOTHING;
    `;

    await client.query(sampleData);
    console.log('✅ Sample data seeded');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Database Summary:');
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check for sample data
    const assessmentCount = await client.query('SELECT COUNT(*) FROM public.assessments');
    const libraryCount = await client.query('SELECT COUNT(*) FROM public.library_items');
    const explorationCount = await client.query('SELECT COUNT(*) FROM public.explorations');

    console.log('\n📊 Sample Data:');
    console.log(`   - ${assessmentCount.rows[0].count} assessments`);
    console.log(`   - ${libraryCount.rows[0].count} library items`);
    console.log(`   - ${explorationCount.rows[0].count} explorations`);

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the setup
applyMigrations().catch(console.error);
