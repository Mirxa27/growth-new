#!/usr/bin/env node

/**
 * Direct PostgreSQL Table Creation
 * Connects directly to PostgreSQL and creates missing tables
 */

import pkg from 'pg';
const { Client } = pkg;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const error = (message) => log('red', `❌ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

// Database configuration
const DB_CONFIG = {
  connectionString: 'postgresql://postgres:Mirxa420$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

const ADMIN_USER_ID = 'aa8e99c7-32e2-4e82-975b-5bd539da6df4';

async function createTablesDirectly() {
  log('cyan', '🗄️ CREATING TABLES DIRECTLY IN POSTGRESQL\n');

  const client = new Client(DB_CONFIG);

  try {
    info('1. Connecting to PostgreSQL...');
    await client.connect();
    success('Connected to PostgreSQL database');

    info('2. Creating missing tables...');

    // Create all missing tables
    const createTablesSQL = `
      -- Create user_memory_profiles table
      CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
        user_id UUID PRIMARY KEY,
        progress_metrics JSONB DEFAULT '{}',
        current_level INTEGER DEFAULT 1,
        crystal_balance INTEGER DEFAULT 0,
        personality_traits JSONB DEFAULT '{}',
        growth_goals JSONB DEFAULT '{}',
        conversation_history JSONB DEFAULT '{}',
        narrative_themes JSONB DEFAULT '{}',
        emotional_patterns JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create user_progress table
      CREATE TABLE IF NOT EXISTS public.user_progress (
        user_id UUID PRIMARY KEY,
        current_level INTEGER DEFAULT 1,
        crystal_balance INTEGER DEFAULT 0,
        progress_metrics JSONB DEFAULT '{}',
        experience_points INTEGER DEFAULT 0,
        total_assessments INTEGER DEFAULT 0,
        total_chat_sessions INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create user_achievements table
      CREATE TABLE IF NOT EXISTS public.user_achievements (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        achievement_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        crystals INTEGER DEFAULT 0,
        unlocked BOOLEAN DEFAULT true,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );

      -- Create daily_streaks table
      CREATE TABLE IF NOT EXISTS public.daily_streaks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        date DATE NOT NULL,
        streak_count INTEGER DEFAULT 1,
        activity_type TEXT DEFAULT 'login',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      );

      -- Create daily_affirmations table
      CREATE TABLE IF NOT EXISTS public.daily_affirmations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        affirmation_text TEXT NOT NULL,
        generated_date DATE NOT NULL,
        category TEXT DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, generated_date)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON public.user_memory_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_affirmations_user_id ON public.daily_affirmations(user_id);

      -- Enable RLS
      ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "user_memory_profiles_policy" ON public.user_memory_profiles;
      CREATE POLICY "user_memory_profiles_policy" ON public.user_memory_profiles
      FOR ALL USING (true);

      DROP POLICY IF EXISTS "user_progress_policy" ON public.user_progress;
      CREATE POLICY "user_progress_policy" ON public.user_progress
      FOR ALL USING (true);

      DROP POLICY IF EXISTS "user_achievements_policy" ON public.user_achievements;
      CREATE POLICY "user_achievements_policy" ON public.user_achievements
      FOR ALL USING (true);

      DROP POLICY IF EXISTS "daily_streaks_policy" ON public.daily_streaks;
      CREATE POLICY "daily_streaks_policy" ON public.daily_streaks
      FOR ALL USING (true);

      DROP POLICY IF EXISTS "daily_affirmations_policy" ON public.daily_affirmations;
      CREATE POLICY "daily_affirmations_policy" ON public.daily_affirmations
      FOR ALL USING (true);
    `;

    await client.query(createTablesSQL);
    success('All tables created successfully');

    info('3. Inserting sample data for admin user...');

    // Insert sample data for admin user
    const insertDataSQL = `
      INSERT INTO public.user_memory_profiles (user_id, progress_metrics, current_level, crystal_balance) VALUES
      ('${ADMIN_USER_ID}', '{"assessments_completed": 5, "chat_sessions": 10}', 10, 1000)
      ON CONFLICT (user_id) DO UPDATE SET
        progress_metrics = EXCLUDED.progress_metrics,
        current_level = EXCLUDED.current_level,
        crystal_balance = EXCLUDED.crystal_balance,
        updated_at = NOW();

      INSERT INTO public.user_progress (user_id, current_level, crystal_balance, progress_metrics) VALUES
      ('${ADMIN_USER_ID}', 10, 1000, '{"total_assessments": 5, "total_chat_sessions": 10}')
      ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        crystal_balance = EXCLUDED.crystal_balance,
        progress_metrics = EXCLUDED.progress_metrics,
        updated_at = NOW();

      INSERT INTO public.daily_streaks (user_id, date, streak_count) VALUES
      ('${ADMIN_USER_ID}', CURRENT_DATE, 7)
      ON CONFLICT (user_id, date) DO UPDATE SET
        streak_count = EXCLUDED.streak_count;

      INSERT INTO public.daily_affirmations (user_id, affirmation_text, generated_date) VALUES
      ('${ADMIN_USER_ID}', 'You are a powerful leader transforming lives through technology and compassion.', CURRENT_DATE)
      ON CONFLICT (user_id, generated_date) DO UPDATE SET
        affirmation_text = EXCLUDED.affirmation_text;

      INSERT INTO public.user_achievements (user_id, achievement_id, title, description, crystals) VALUES
      ('${ADMIN_USER_ID}', 'platform_creator', 'Platform Creator', 'Created the Newomen platform', 500),
      ('${ADMIN_USER_ID}', 'admin_access', 'Admin Access', 'Gained admin privileges', 100),
      ('${ADMIN_USER_ID}', 'first_login', 'First Login', 'Completed first login', 50)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    `;

    await client.query(insertDataSQL);
    success('Sample data inserted successfully');

    info('4. Verifying table creation...');
    
    // Verify tables exist
    const verifySQL = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_memory_profiles', 'user_progress', 'user_achievements', 'daily_streaks', 'daily_affirmations')
      ORDER BY table_name;
    `;

    const result = await client.query(verifySQL);
    
    if (result.rows.length > 0) {
      success('Tables verified:');
      result.rows.forEach(row => {
        success(`  • ${row.table_name}`);
      });
    } else {
      error('No tables found');
    }

    log('cyan', '\n🎉 DATABASE SETUP COMPLETE!\n');
    success('✅ All missing tables created');
    success('✅ Sample data inserted');
    success('✅ Admin user data configured');
    success('✅ Database ready for admin panel');
    
    log('cyan', '\n🎯 ADMIN PANEL SHOULD NOW WORK:');
    info('• Login: http://localhost:3000/auth');
    info('• Email: admin@newomen.me');
    info('• Password: NewomenAdmin2025!');
    info('• Admin Panel: http://localhost:3000/admin');

  } catch (err) {
    error(`Database setup failed: ${err.message}`);
    
    if (err.message.includes('connect')) {
      log('cyan', '\n🔧 CONNECTION ISSUE:');
      info('The direct database connection may be restricted');
      info('Please run the SQL manually in Supabase dashboard');
      info('File: CREATE_MISSING_TABLES.sql');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTablesDirectly();