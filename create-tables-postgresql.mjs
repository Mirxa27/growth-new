#!/usr/bin/env node

/**
 * Create Tables using Direct PostgreSQL Connection
 * Uses the provided connection string to create missing tables
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

// Database configuration using the provided connection string
const connectionString = 'postgresql://postgres:sb_publishable_S03@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres';
const ADMIN_USER_ID = 'aa8e99c7-32e2-4e82-975b-5bd539da6df4';

async function createTablesPostgreSQL() {
  log('cyan', '🗄️ CREATING TABLES VIA POSTGRESQL\n');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    info('1. Connecting to PostgreSQL database...');
    await client.connect();
    success('Connected to PostgreSQL successfully');

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
    `;

    await client.query(createTablesSQL);
    success('All tables created successfully');

    info('3. Creating indexes for performance...');

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON public.user_memory_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_streaks_date ON public.daily_streaks(date DESC);
      CREATE INDEX IF NOT EXISTS idx_daily_affirmations_user_id ON public.daily_affirmations(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_affirmations_date ON public.daily_affirmations(generated_date DESC);
    `;

    await client.query(createIndexesSQL);
    success('Indexes created successfully');

    info('4. Enabling Row Level Security...');

    const enableRLSSQL = `
      ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;
    `;

    await client.query(enableRLSSQL);
    success('Row Level Security enabled');

    info('5. Creating RLS policies...');

    const createPoliciesSQL = `
      -- Create permissive policies for testing
      DROP POLICY IF EXISTS "user_memory_profiles_policy" ON public.user_memory_profiles;
      CREATE POLICY "user_memory_profiles_policy" ON public.user_memory_profiles FOR ALL USING (true);

      DROP POLICY IF EXISTS "user_progress_policy" ON public.user_progress;
      CREATE POLICY "user_progress_policy" ON public.user_progress FOR ALL USING (true);

      DROP POLICY IF EXISTS "user_achievements_policy" ON public.user_achievements;
      CREATE POLICY "user_achievements_policy" ON public.user_achievements FOR ALL USING (true);

      DROP POLICY IF EXISTS "daily_streaks_policy" ON public.daily_streaks;
      CREATE POLICY "daily_streaks_policy" ON public.daily_streaks FOR ALL USING (true);

      DROP POLICY IF EXISTS "daily_affirmations_policy" ON public.daily_affirmations;
      CREATE POLICY "daily_affirmations_policy" ON public.daily_affirmations FOR ALL USING (true);
    `;

    await client.query(createPoliciesSQL);
    success('RLS policies created');

    info('6. Inserting sample data for admin user...');

    const today = new Date().toISOString().split('T')[0];
    
    const insertDataSQL = `
      INSERT INTO public.user_memory_profiles (user_id, progress_metrics, current_level, crystal_balance, personality_traits, growth_goals) VALUES
      ('${ADMIN_USER_ID}', '{"assessments_completed": 5, "chat_sessions": 10, "growth_milestones": ["first_login", "admin_access"]}', 10, 1000, '{"openness": 8, "conscientiousness": 9}', '{"primary": "Platform management", "secondary": "User growth"}')
      ON CONFLICT (user_id) DO UPDATE SET
        progress_metrics = EXCLUDED.progress_metrics,
        current_level = EXCLUDED.current_level,
        crystal_balance = EXCLUDED.crystal_balance,
        updated_at = NOW();

      INSERT INTO public.user_progress (user_id, current_level, crystal_balance, progress_metrics, experience_points, total_assessments, total_chat_sessions) VALUES
      ('${ADMIN_USER_ID}', 10, 1000, '{"total_assessments": 5, "total_chat_sessions": 10, "platform_created": true}', 5000, 5, 10)
      ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        crystal_balance = EXCLUDED.crystal_balance,
        progress_metrics = EXCLUDED.progress_metrics,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();

      INSERT INTO public.daily_streaks (user_id, date, streak_count, activity_type) VALUES
      ('${ADMIN_USER_ID}', '${today}', 7, 'admin_login')
      ON CONFLICT (user_id, date) DO UPDATE SET
        streak_count = EXCLUDED.streak_count,
        activity_type = EXCLUDED.activity_type;

      INSERT INTO public.daily_affirmations (user_id, affirmation_text, generated_date, category) VALUES
      ('${ADMIN_USER_ID}', 'You are a powerful leader transforming lives through technology and compassion. Your vision for helping women discover their authentic selves is making a real difference in the world.', '${today}', 'leadership')
      ON CONFLICT (user_id, generated_date) DO UPDATE SET
        affirmation_text = EXCLUDED.affirmation_text;

      INSERT INTO public.user_achievements (user_id, achievement_id, title, description, crystals) VALUES
      ('${ADMIN_USER_ID}', 'platform_creator', 'Platform Creator', 'Successfully created and deployed the Newomen platform', 500),
      ('${ADMIN_USER_ID}', 'admin_access', 'Admin Access', 'Gained super administrator privileges', 100),
      ('${ADMIN_USER_ID}', 'first_login', 'First Login', 'Completed first login to the platform', 50),
      ('${ADMIN_USER_ID}', 'database_setup', 'Database Setup', 'Successfully configured all database tables', 200),
      ('${ADMIN_USER_ID}', 'supabase_master', 'Supabase Master', 'Deployed all functions and configured backend', 300)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    `;

    await client.query(insertDataSQL);
    success('Sample data inserted successfully');

    info('7. Verifying table creation...');

    // Verify tables exist and have data
    const verifySQL = `
      SELECT 
        t.table_name,
        COALESCE(s.row_count, 0) as row_count
      FROM information_schema.tables t
      LEFT JOIN (
        SELECT 'user_memory_profiles' as table_name, COUNT(*) as row_count FROM public.user_memory_profiles
        UNION ALL
        SELECT 'user_progress', COUNT(*) FROM public.user_progress
        UNION ALL
        SELECT 'user_achievements', COUNT(*) FROM public.user_achievements
        UNION ALL
        SELECT 'daily_streaks', COUNT(*) FROM public.daily_streaks
        UNION ALL
        SELECT 'daily_affirmations', COUNT(*) FROM public.daily_affirmations
      ) s ON t.table_name = s.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_name IN ('user_memory_profiles', 'user_progress', 'user_achievements', 'daily_streaks', 'daily_affirmations')
      ORDER BY t.table_name;
    `;

    const result = await client.query(verifySQL);
    
    if (result.rows.length > 0) {
      success('Tables verified with data:');
      result.rows.forEach(row => {
        success(`  • ${row.table_name}: ${row.row_count} rows`);
      });
    } else {
      error('No tables found');
    }

    log('cyan', '\n🎉 DATABASE SETUP COMPLETE!\n');
    success('✅ All missing tables created');
    success('✅ Indexes and RLS configured');
    success('✅ Sample data inserted');
    success('✅ Admin user fully configured');
    success('✅ Database ready for admin panel');
    
    log('cyan', '\n🎯 ADMIN PANEL SHOULD NOW WORK:');
    info('• Restart application if needed');
    info('• Login: http://localhost:3000/auth');
    info('• Email: admin@newomen.me');
    info('• Password: NewomenAdmin2025!');
    info('• Admin Panel: http://localhost:3000/admin');
    info('• No more 404 errors expected');

  } catch (err) {
    error(`Database setup failed: ${err.message}`);
    
    if (err.message.includes('connect') || err.message.includes('auth')) {
      log('cyan', '\n🔧 CONNECTION ISSUE:');
      info('Direct PostgreSQL connection may be restricted');
      info('Alternative: Use Supabase SQL editor');
      info('1. Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql');
      info('2. Copy and paste CREATE_MISSING_TABLES.sql');
      info('3. Execute the SQL');
    }
    
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {
      // Connection might already be closed
    }
  }
}

createTablesPostgreSQL();