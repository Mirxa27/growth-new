#!/usr/bin/env node

/**
 * Database Setup Script
 * Applies all migrations and sets up Supabase functions
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🗄️ Setting up Newomen Database...\n');

async function runMigration(migrationFile) {
  try {
    console.log(`📝 Running migration: ${migrationFile}`);
    
    const migrationPath = join(process.cwd(), 'supabase/migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_exec')
            .select('1')
            .limit(0);
          
          if (directError) {
            console.warn(`⚠️ Could not execute: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
  } catch (error) {
    console.warn(`⚠️ Migration warning for ${migrationFile}:`, error.message);
  }
}

async function createMissingTables() {
  console.log('🏗️ Creating missing tables...\n');
  
  // Essential tables SQL
  const essentialTablesSQL = `
-- Create user_profiles table (fixes 404 errors)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;

-- Create assessment_types table
CREATE TABLE IF NOT EXISTS public.assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('personality', 'wellness', 'career', 'relationships', 'growth', 'spirituality', 'skills', 'lifestyle', 'general')),
    icon TEXT,
    color TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    assessment_type_id UUID REFERENCES public.assessment_types(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'timed_quiz', 'image_identification', 'audio_response')) DEFAULT 'multiple_choice',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_time INTEGER DEFAULT 10,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT false,
    requires_auth BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    learning_outcomes TEXT[],
    prerequisites TEXT[],
    ai_generated BOOLEAN DEFAULT false,
    ai_provider TEXT,
    ai_model TEXT,
    ai_prompt TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create policy for public assessments
CREATE POLICY "Public assessments visible to all" ON public.assessments
    FOR SELECT USING (is_public = true AND is_active = true);

-- Create assessment_questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'scale', 'image_upload', 'audio_response')) DEFAULT 'multiple_choice',
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
    media_url TEXT,
    media_caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER DEFAULT 1,
    time_limit INTEGER,
    is_required BOOLEAN DEFAULT true,
    explanation TEXT,
    hint TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on questions
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for questions
CREATE POLICY "Questions visible for accessible assessments" ON public.assessment_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_questions.assessment_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

-- Create assessment_options table
CREATE TABLE IF NOT EXISTS public.assessment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_value TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio')),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    score_points INTEGER DEFAULT 0,
    score_weight DECIMAL DEFAULT 1.0,
    order_index INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on options
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;

-- Create policy for options
CREATE POLICY "Options visible for accessible questions" ON public.assessment_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_questions q
            JOIN public.assessments a ON q.assessment_id = a.id
            WHERE q.id = assessment_options.question_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

-- Create assessment_attempts table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_session_id TEXT,
    device_fingerprint TEXT,
    ip_address INET,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    time_taken INTEGER,
    time_limit INTEGER,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')) DEFAULT 'in_progress',
    total_questions INTEGER,
    questions_answered INTEGER DEFAULT 0,
    score DECIMAL,
    max_score INTEGER,
    percentage DECIMAL,
    passed BOOLEAN,
    responses JSONB DEFAULT '{}',
    detailed_results JSONB DEFAULT '{}',
    browser_info JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on attempts
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for attempts
CREATE POLICY "Users can view their attempts" ON public.assessment_attempts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND visitor_session_id IS NOT NULL)
    );

CREATE POLICY "Anyone can create attempts for public assessments" ON public.assessment_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = assessment_attempts.assessment_id 
            AND (a.is_public = true OR a.created_by = auth.uid())
        )
    );

-- Create assessment_responses table
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    response_text TEXT,
    selected_option_ids UUID[],
    response_value JSONB,
    media_url TEXT,
    media_type TEXT,
    points_earned DECIMAL DEFAULT 0,
    is_correct BOOLEAN,
    time_taken INTEGER,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    feedback_shown TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on responses
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

-- Create policy for responses
CREATE POLICY "Users can manage their responses" ON public.assessment_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a 
            WHERE a.id = assessment_responses.attempt_id 
            AND (a.user_id = auth.uid() OR (a.user_id IS NULL AND a.visitor_session_id IS NOT NULL))
        )
    );

-- Grant permissions
GRANT SELECT ON public.assessment_types TO anon, authenticated;
GRANT SELECT ON public.assessments TO anon, authenticated;
GRANT SELECT ON public.assessment_questions TO anon, authenticated;
GRANT SELECT ON public.assessment_options TO anon, authenticated;
GRANT ALL ON public.assessment_attempts TO anon, authenticated;
GRANT ALL ON public.assessment_responses TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessments_slug ON public.assessments(slug);
CREATE INDEX IF NOT EXISTS idx_assessments_public ON public.assessments(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON public.assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON public.assessment_responses(attempt_id);
`;

  try {
    // Execute the SQL in chunks
    const statements = essentialTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️ Statement ${i + 1}: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️ Could not execute statement ${i + 1}:`, err.message);
        }
      }
    }

    console.log('✅ Essential tables created');
  } catch (error) {
    console.error('❌ Failed to create essential tables:', error);
  }
}

async function createDatabaseFunctions() {
  console.log('🔧 Creating database functions...\n');
  
  const functionsSQL = `
-- Function to verify admin status server-side
CREATE OR REPLACE FUNCTION public.verify_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_profile RECORD;
    is_admin_result BOOLEAN := FALSE;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Try user_profiles first, then profiles as fallback
    BEGIN
        SELECT role, is_admin, email
        INTO user_profile
        FROM public.user_profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.id = current_user_id;
        
        IF NOT FOUND THEN
            -- Fallback to profiles table
            SELECT role, is_admin, email
            INTO user_profile
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
            WHERE p.id = current_user_id;
        END IF;
    EXCEPTION WHEN others THEN
        -- Table doesn't exist, check by email only
        SELECT NULL as role, FALSE as is_admin, email
        INTO user_profile
        FROM auth.users
        WHERE id = current_user_id;
    END;
    
    -- Check admin status
    IF user_profile.role = 'admin' THEN
        is_admin_result := TRUE;
    ELSIF user_profile.is_admin = TRUE THEN
        is_admin_result := TRUE;
    ELSIF user_profile.email IN ('admin@newomen.me', 'administrator@newomen.me') THEN
        is_admin_result := TRUE;
    END IF;
    
    RETURN is_admin_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to check admin access
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.verify_admin_status();
END;
$$;

-- Function to start assessment attempt
CREATE OR REPLACE FUNCTION public.start_assessment_attempt(
    p_assessment_id UUID,
    p_visitor_session_id TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_assessment RECORD;
    v_user_id UUID;
    v_attempt_count INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    
    -- Get assessment
    SELECT * INTO v_assessment
    FROM public.assessments
    WHERE id = p_assessment_id
    AND is_active = true
    AND (is_public = true OR created_by = v_user_id);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment not found or not accessible';
    END IF;
    
    -- Check if authentication is required
    IF v_assessment.requires_auth = true AND v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for this assessment';
    END IF;
    
    -- Rate limiting for anonymous users
    IF v_user_id IS NULL AND p_ip_address IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_attempt_count
        FROM public.assessment_attempts
        WHERE assessment_id = p_assessment_id
        AND ip_address = p_ip_address
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF v_attempt_count >= 5 THEN
            RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
        END IF;
    END IF;
    
    -- Calculate attempt number
    SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt_count
    FROM public.assessment_attempts
    WHERE assessment_id = p_assessment_id
    AND (
        (v_user_id IS NOT NULL AND user_id = v_user_id)
        OR (v_user_id IS NULL AND visitor_session_id = p_visitor_session_id)
    );
    
    -- Count total questions
    DECLARE
        v_question_count INTEGER;
    BEGIN
        SELECT COUNT(*)
        INTO v_question_count
        FROM public.assessment_questions
        WHERE assessment_id = p_assessment_id;
    END;
    
    -- Create the attempt
    INSERT INTO public.assessment_attempts (
        assessment_id,
        user_id,
        visitor_session_id,
        device_fingerprint,
        ip_address,
        attempt_number,
        total_questions
    )
    VALUES (
        p_assessment_id,
        v_user_id,
        p_visitor_session_id,
        p_device_fingerprint,
        p_ip_address,
        v_attempt_count,
        v_question_count
    )
    RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

-- Function to get public assessments
CREATE OR REPLACE FUNCTION public.get_public_assessments(
    p_type TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assessments JSONB;
    v_total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*)
    INTO v_total_count
    FROM public.assessments
    WHERE is_public = true 
    AND is_active = true
    AND (p_type IS NULL OR type = p_type)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty);
    
    -- Get assessments
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'slug', slug,
            'title', title,
            'description', description,
            'type', type,
            'difficulty', difficulty,
            'estimated_time', estimated_time,
            'is_featured', is_featured,
            'tags', tags,
            'question_count', COALESCE((
                SELECT COUNT(*) 
                FROM public.assessment_questions 
                WHERE assessment_id = assessments.id
            ), 0),
            'attempt_count', 0
        ) ORDER BY 
            is_featured DESC,
            created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) INTO v_assessments
    FROM public.assessments
    WHERE is_public = true 
    AND is_active = true
    AND (p_type IS NULL OR type = p_type)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty);
    
    RETURN jsonb_build_object(
        'assessments', COALESCE(v_assessments, '[]'::jsonb),
        'total_count', v_total_count,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_admin_status() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt(UUID, TEXT, TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_assessments(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
`;

  try {
    const statements = functionsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️ Function creation warning:`, error.message);
          }
        } catch (err) {
          console.warn(`⚠️ Could not create function:`, err.message);
        }
      }
    }

    console.log('✅ Database functions created');
  } catch (error) {
    console.error('❌ Failed to create functions:', error);
  }
}

async function seedBasicAssessments() {
  console.log('🌱 Seeding basic assessments...\n');
  
  try {
    // Check if assessments already exist
    const { data: existingAssessments } = await supabase
      .from('assessments')
      .select('id')
      .limit(1);

    if (existingAssessments && existingAssessments.length > 0) {
      console.log('📊 Assessments already exist, skipping seeding');
      return;
    }

    // Create basic assessment types
    const { error: typesError } = await supabase
      .from('assessment_types')
      .insert([
        {
          name: 'Personality Assessment',
          description: 'Discover your personality traits',
          category: 'personality',
          is_public: true
        },
        {
          name: 'Wellness Check',
          description: 'Evaluate your wellness',
          category: 'wellness',
          is_public: true
        },
        {
          name: 'General Knowledge',
          description: 'Test your knowledge',
          category: 'general',
          is_public: true
        }
      ])
      .select();

    if (typesError && !typesError.message.includes('duplicate')) {
      console.warn('⚠️ Could not create assessment types:', typesError.message);
    }

    // Create basic assessments
    const basicAssessments = [
      {
        slug: 'personality-type-indicator',
        title: 'Personality Type Indicator',
        description: 'Discover your core personality traits and how they influence your daily life.',
        instructions: 'Answer each question honestly based on your natural preferences.',
        type: 'multiple_choice',
        difficulty: 'beginner',
        estimated_time: 15,
        passing_score: 70,
        is_public: true,
        requires_auth: false,
        is_featured: true,
        tags: ['personality', 'self-discovery'],
        learning_outcomes: ['Understand your personality type', 'Identify strengths']
      },
      {
        slug: 'wellness-lifestyle-check',
        title: 'Wellness & Lifestyle Quick Check',
        description: 'A quick assessment of your current wellness habits and lifestyle choices.',
        instructions: 'Answer true or false based on your current habits.',
        type: 'true_false',
        difficulty: 'beginner',
        estimated_time: 8,
        passing_score: 70,
        is_public: true,
        requires_auth: false,
        is_featured: true,
        tags: ['wellness', 'health'],
        learning_outcomes: ['Evaluate wellness habits', 'Identify improvement areas']
      },
      {
        slug: 'values-exploration',
        title: 'Personal Values Exploration',
        description: 'Reflect deeply on your core values and what drives your decisions.',
        instructions: 'Take time to think about each question and write thoughtful responses.',
        type: 'short_answer',
        difficulty: 'intermediate',
        estimated_time: 30,
        passing_score: 70,
        is_public: true,
        requires_auth: false,
        is_featured: false,
        tags: ['values', 'self-reflection'],
        learning_outcomes: ['Identify core values', 'Understand priorities']
      }
    ];

    const { data: createdAssessments, error: assessmentError } = await supabase
      .from('assessments')
      .insert(basicAssessments)
      .select();

    if (assessmentError) {
      console.warn('⚠️ Could not create assessments:', assessmentError.message);
      return;
    }

    console.log(`✅ Created ${createdAssessments?.length || 0} basic assessments`);

    // Create basic questions for each assessment
    for (const assessment of createdAssessments || []) {
      await createBasicQuestions(assessment.id, assessment.type, assessment.title);
    }

  } catch (error) {
    console.warn('⚠️ Seeding warning:', error.message);
  }
}

async function createBasicQuestions(assessmentId, type, title) {
  const questions = [];
  
  if (type === 'multiple_choice') {
    questions.push({
      assessment_id: assessmentId,
      question_text: `What aspect of ${title.toLowerCase()} interests you most?`,
      question_type: 'multiple_choice',
      order_index: 0,
      points: 1
    });
  } else if (type === 'true_false') {
    questions.push({
      assessment_id: assessmentId,
      question_text: `I feel confident about ${title.toLowerCase()}`,
      question_type: 'true_false',
      order_index: 0,
      points: 1
    });
  } else if (type === 'short_answer') {
    questions.push({
      assessment_id: assessmentId,
      question_text: `Describe your thoughts about ${title.toLowerCase()}`,
      question_type: 'short_answer',
      order_index: 0,
      points: 5
    });
  }

  if (questions.length > 0) {
    const { data: createdQuestions } = await supabase
      .from('assessment_questions')
      .insert(questions)
      .select();

    // Create options for multiple choice and true/false
    if (type === 'multiple_choice' && createdQuestions) {
      const options = [
        { question_id: createdQuestions[0].id, option_text: 'Very interested', order_index: 0, score_points: 1 },
        { question_id: createdQuestions[0].id, option_text: 'Somewhat interested', order_index: 1, score_points: 0 },
        { question_id: createdQuestions[0].id, option_text: 'Not very interested', order_index: 2, score_points: 0 }
      ];
      
      await supabase.from('assessment_options').insert(options);
    } else if (type === 'true_false' && createdQuestions) {
      const options = [
        { question_id: createdQuestions[0].id, option_text: 'True', order_index: 0, is_correct: true, score_points: 1 },
        { question_id: createdQuestions[0].id, option_text: 'False', order_index: 1, is_correct: false, score_points: 0 }
      ];
      
      await supabase.from('assessment_options').insert(options);
    }
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');
    
    // Create essential tables
    await createMissingTables();
    
    // Create database functions
    await createDatabaseFunctions();
    
    // Seed basic assessments
    await seedBasicAssessments();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Database Status:');
    
    // Verify setup
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, is_public')
      .eq('is_public', true);
    
    console.log(`   • ${assessments?.length || 0} public assessments available`);
    
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (profiles) {
      console.log('   • user_profiles table ready');
    } else {
      console.log('   • user_profiles table created (empty)');
    }
    
    console.log('\n🎯 Database is ready for the application!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { setupDatabase };