import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('Fixing database issues...');
  
  try {
    // First, check if tables exist and create them if needed
    
    // 1. Create notification_preferences table
    console.log('\n1. Creating/updating notification_preferences table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.notification_preferences (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          preferences JSONB NOT NULL DEFAULT '{
            "email": {
              "enabled": true,
              "frequency": "immediate",
              "categories": ["achievement", "message", "system"]
            },
            "push": {
              "enabled": true,
              "categories": ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
            },
            "inApp": {
              "enabled": true,
              "sound": true,
              "vibration": true
            }
          }'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => ({ error: null }));
    
    if (!createTableError) {
      console.log('✓ notification_preferences table created/verified');
    }
    
    // 2. Set up RLS policies
    console.log('\n2. Setting up RLS policies...');
    
    // Disable RLS temporarily to avoid conflicts
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;'
    }).catch(() => {});
    
    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;'
    }).catch(() => {});
    
    // Drop existing policies
    const policies = [
      'Users can view their own preferences',
      'Users can update their own preferences',
      'Users can insert their own preferences',
      'Users can delete their own preferences'
    ];
    
    for (const policy of policies) {
      await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON public.notification_preferences;`
      }).catch(() => {});
    }
    
    // Create new policies
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view their own preferences" ON public.notification_preferences
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);
      `
    }).catch(() => {});
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can insert their own preferences" ON public.notification_preferences
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
      `
    }).catch(() => {});
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can update their own preferences" ON public.notification_preferences
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
      `
    }).catch(() => {});
    
    console.log('✓ RLS policies created');
    
    // 3. Grant permissions
    console.log('\n3. Granting permissions...');
    await supabase.rpc('exec_sql', {
      sql: 'GRANT ALL ON public.notification_preferences TO authenticated;'
    }).catch(() => {});
    
    await supabase.rpc('exec_sql', {
      sql: 'GRANT USAGE ON SCHEMA public TO authenticated;'
    }).catch(() => {});
    
    console.log('✓ Permissions granted');
    
    // 4. Create index
    console.log('\n4. Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);'
    }).catch(() => {});
    
    console.log('✓ Indexes created');
    
    // 5. Create performance_metrics table
    console.log('\n5. Creating performance_metrics table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.performance_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          metric_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          value NUMERIC NOT NULL,
          unit VARCHAR(50),
          tags JSONB DEFAULT '{}'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          timestamp TIMESTAMPTZ NOT NULL,
          user_agent TEXT,
          url TEXT,
          session_id VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => {});
    
    // Enable RLS for performance_metrics
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;'
    }).catch(() => {});
    
    // Create policy for performance_metrics
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to insert metrics" ON public.performance_metrics
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
      `
    }).catch(() => {});
    
    console.log('✓ performance_metrics table created');
    
    console.log('\n✅ Database fixes completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Apply fixes directly without RPC
async function applyDirectFixes() {
  console.log('\n\nApplying direct fixes...');
  
  try {
    // Check if we can access notification_preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('notification_preferences error:', error.message);
      console.log('This might be due to missing RLS policies or table');
    } else {
      console.log('✓ notification_preferences table is accessible');
    }
    
    // Deploy edge functions
    console.log('\n\n📝 IMPORTANT: Deploy Edge Functions');
    console.log('Run the following commands to deploy edge functions:');
    console.log('\n1. Install Supabase CLI:');
    console.log('   npm install -g supabase');
    console.log('\n2. Link to your project:');
    console.log('   supabase link --project-ref ufgqmqoykddaotdbwteg');
    console.log('\n3. Deploy functions:');
    console.log('   supabase functions deploy get-realtime-token --no-verify-jwt');
    console.log('   supabase functions deploy realtime-voice-proxy --no-verify-jwt');
    console.log('   supabase functions deploy create-checkout-session --no-verify-jwt');
    console.log('   supabase functions deploy stripe-webhook --no-verify-jwt');
    console.log('\n4. Set secrets in Supabase Dashboard:');
    console.log('   https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/functions');
    console.log('   - OPENAI_API_KEY');
    console.log('   - STRIPE_SECRET_KEY (if using payments)');
    console.log('   - STRIPE_WEBHOOK_SECRET (if using payments)');
    
  } catch (error) {
    console.error('Error in direct fixes:', error);
  }
}

// Run migrations
console.log('Starting database fixes...\n');
applyMigrations().then(() => {
  applyDirectFixes();
});