#!/usr/bin/env node

/**
 * Create Tables via Supabase API
 * Uses Supabase REST API to execute SQL commands
 */

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

const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';
const ADMIN_USER_ID = 'aa8e99c7-32e2-4e82-975b-5bd539da6df4';

async function createTablesViaAPI() {
  log('cyan', '🗄️ CREATING TABLES VIA SUPABASE API\n');

  try {
    info('1. Testing Supabase API connection...');
    
    // Test API connection
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      throw new Error(`API connection failed: ${testResponse.status}`);
    }
    success('Connected to Supabase API successfully');

    info('2. Creating tables using edge function...');
    
    // Use the create-assessment function as a proxy to execute SQL
    const createTableSQL = `
      -- Create user_memory_profiles table
      CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
        user_id UUID PRIMARY KEY,
        progress_metrics JSONB DEFAULT '{}',
        current_level INTEGER DEFAULT 1,
        crystal_balance INTEGER DEFAULT 0,
        personality_traits JSONB DEFAULT '{}',
        growth_goals JSONB DEFAULT '{}',
        conversation_history JSONB DEFAULT '{}',
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

      -- Enable RLS
      ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;

      -- Create permissive policies for now
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

    // Since we can't execute arbitrary SQL via the API, let me create a custom edge function
    const sqlExecutorFunction = `
      import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      };

      Deno.serve(async (req) => {
        if (req.method === 'OPTIONS') {
          return new Response('ok', { headers: corsHeaders });
        }

        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          const supabase = createClient(supabaseUrl, supabaseKey);

          const { sql } = await req.json();
          
          // Execute SQL using the database connection
          const { data, error } = await supabase.rpc('exec_sql', { sql });
          
          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      });
    `;

    // Let me try a different approach - direct table creation via INSERT attempts
    info('3. Creating tables by attempting data insertion...');
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Try to create user_memory_profiles data
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_memory_profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: ADMIN_USER_ID,
          progress_metrics: { assessments_completed: 5, chat_sessions: 10 },
          current_level: 10,
          crystal_balance: 1000,
          personality_traits: {},
          growth_goals: {},
          conversation_history: {}
        })
      });

      if (response.ok || response.status === 409) {
        success('user_memory_profiles data created/updated');
      } else {
        info(`user_memory_profiles response: ${response.status}`);
      }
    } catch (memoryError) {
      info('user_memory_profiles creation skipped');
    }

    // Try to create user_progress data
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_progress`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: ADMIN_USER_ID,
          current_level: 10,
          crystal_balance: 1000,
          progress_metrics: { total_assessments: 5 },
          experience_points: 5000
        })
      });

      if (response.ok || response.status === 409) {
        success('user_progress data created/updated');
      } else {
        info(`user_progress response: ${response.status}`);
      }
    } catch (progressError) {
      info('user_progress creation skipped');
    }

    log('cyan', '\n🎉 API-BASED SETUP COMPLETE!\n');
    success('✅ Supabase API connection verified');
    success('✅ Table creation attempts made');
    success('✅ Admin user data setup attempted');
    
    log('cyan', '\n🎯 MANUAL SQL EXECUTION STILL REQUIRED:');
    info('Due to API limitations, please run the SQL manually:');
    info('1. Go to: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql');
    info('2. Copy contents of CREATE_MISSING_TABLES.sql');
    info('3. Paste and execute in SQL editor');
    info('4. This will create all missing tables properly');

  } catch (err) {
    error(`API setup failed: ${err.message}`);
    process.exit(1);
  }
}

createTablesViaAPI();