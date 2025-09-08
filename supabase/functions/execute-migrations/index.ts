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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration not found');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { action } = await req.json();

    if (action === 'create_missing_tables') {
      // Create all missing tables using individual queries
      const queries = [
        // Create user_memory_profiles
        `CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
          user_id UUID PRIMARY KEY,
          progress_metrics JSONB DEFAULT '{}',
          current_level INTEGER DEFAULT 1,
          crystal_balance INTEGER DEFAULT 0,
          personality_traits JSONB DEFAULT '{}',
          growth_goals JSONB DEFAULT '{}',
          conversation_history JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create user_progress
        `CREATE TABLE IF NOT EXISTS public.user_progress (
          user_id UUID PRIMARY KEY,
          current_level INTEGER DEFAULT 1,
          crystal_balance INTEGER DEFAULT 0,
          progress_metrics JSONB DEFAULT '{}',
          experience_points INTEGER DEFAULT 0,
          total_assessments INTEGER DEFAULT 0,
          total_chat_sessions INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create user_achievements
        `CREATE TABLE IF NOT EXISTS public.user_achievements (
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
        )`,
        
        // Create daily_streaks
        `CREATE TABLE IF NOT EXISTS public.daily_streaks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          date DATE NOT NULL,
          streak_count INTEGER DEFAULT 1,
          activity_type TEXT DEFAULT 'login',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, date)
        )`,
        
        // Create daily_affirmations
        `CREATE TABLE IF NOT EXISTS public.daily_affirmations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          affirmation_text TEXT NOT NULL,
          generated_date DATE NOT NULL,
          category TEXT DEFAULT 'general',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, generated_date)
        )`,
        
        // Enable RLS
        `ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY`,
        
        // Create policies
        `DROP POLICY IF EXISTS "user_memory_profiles_policy" ON public.user_memory_profiles`,
        `CREATE POLICY "user_memory_profiles_policy" ON public.user_memory_profiles FOR ALL USING (true)`,
        
        `DROP POLICY IF EXISTS "user_progress_policy" ON public.user_progress`,
        `CREATE POLICY "user_progress_policy" ON public.user_progress FOR ALL USING (true)`,
        
        `DROP POLICY IF EXISTS "user_achievements_policy" ON public.user_achievements`,
        `CREATE POLICY "user_achievements_policy" ON public.user_achievements FOR ALL USING (true)`,
        
        `DROP POLICY IF EXISTS "daily_streaks_policy" ON public.daily_streaks`,
        `CREATE POLICY "daily_streaks_policy" ON public.daily_streaks FOR ALL USING (true)`,
        
        `DROP POLICY IF EXISTS "daily_affirmations_policy" ON public.daily_affirmations`,
        `CREATE POLICY "daily_affirmations_policy" ON public.daily_affirmations FOR ALL USING (true)`
      ];

      const results = [];
      
      for (const query of queries) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: query });
          if (error) {
            results.push({ query: query.substring(0, 50) + '...', error: error.message });
          } else {
            results.push({ query: query.substring(0, 50) + '...', success: true });
          }
        } catch (err) {
          results.push({ query: query.substring(0, 50) + '...', error: err.message });
        }
      }

      // Insert sample data
      const adminUserId = 'aa8e99c7-32e2-4e82-975b-5bd539da6df4';
      const today = new Date().toISOString().split('T')[0];

      const insertQueries = [
        `INSERT INTO public.user_memory_profiles (user_id, progress_metrics, current_level, crystal_balance) VALUES ('${adminUserId}', '{"assessments_completed": 5}', 10, 1000) ON CONFLICT (user_id) DO NOTHING`,
        `INSERT INTO public.user_progress (user_id, current_level, crystal_balance) VALUES ('${adminUserId}', 10, 1000) ON CONFLICT (user_id) DO NOTHING`,
        `INSERT INTO public.daily_streaks (user_id, date, streak_count) VALUES ('${adminUserId}', '${today}', 7) ON CONFLICT (user_id, date) DO NOTHING`,
        `INSERT INTO public.daily_affirmations (user_id, affirmation_text, generated_date) VALUES ('${adminUserId}', 'You are transforming lives through technology and compassion.', '${today}') ON CONFLICT (user_id, generated_date) DO NOTHING`
      ];

      for (const query of insertQueries) {
        try {
          await supabase.rpc('exec_sql', { sql: query });
        } catch (err) {
          // Ignore insert errors
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Tables created successfully',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});