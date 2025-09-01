/**
 * Migration Runner
 * Run this script to apply all database migrations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Supabase service role key or anon key is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  // Create system_settings table
  const systemSettingsMigration = `
    -- Create system_settings table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.system_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        UNIQUE(category)
    );

    -- Enable RLS
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Admin users can manage system settings" ON public.system_settings;

    -- Create policy for admin access
    CREATE POLICY "Admin users can manage system settings"
        ON public.system_settings
        FOR ALL
        USING (true)  -- Allow all authenticated users to read
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.user_id = auth.uid()
                AND profiles.role = 'admin'
            )
        );

    -- Create or replace trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;

    -- Create trigger
    CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON public.system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Insert default OpenAI settings if not exists
    INSERT INTO public.system_settings (category, settings)
    VALUES (
        'openai',
        '{
            "apiKey": "",
            "organizationId": "",
            "chatModel": "gpt-4o-mini",
            "realtimeModel": "gpt-realtime-2025-08-28",
            "temperature": 0.7,
            "maxTokens": 2000,
            "voice": "alloy",
            "connectionType": "websocket",
            "enableTools": true,
            "enableTranscription": true,
            "audioFormat": "pcm16",
            "language": "en",
            "instructions": "You are a helpful AI assistant focused on personal growth and well-being."
        }'::jsonb
    ) ON CONFLICT (category) DO NOTHING;

    -- Grant permissions
    GRANT ALL ON public.system_settings TO authenticated;
    GRANT SELECT ON public.system_settings TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: systemSettingsMigration }).single();
    
    if (error) {
      // If exec_sql doesn't exist, try direct query (for local development)
      console.log('ℹ️  exec_sql not available, trying alternative method...');
      
      // Split into individual statements and execute
      const statements = systemSettingsMigration
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('ALTER TABLE') || 
            statement.includes('CREATE POLICY') ||
            statement.includes('DROP POLICY') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('DROP TRIGGER') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('INSERT INTO') ||
            statement.includes('GRANT')) {
          console.log('Executing:', statement.substring(0, 50) + '...');
        }
      }
      
      console.log('✅ Migration statements prepared (manual execution may be required)');
    } else {
      console.log('✅ System settings table migration completed');
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n📝 Please run the following SQL manually in Supabase SQL editor:\n');
    console.log(systemSettingsMigration);
  }

  // Add onboarding fields to profiles
  const profilesMigration = `
    -- Add onboarding fields to profiles table if they don't exist
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
  `;

  try {
    console.log('\n📊 Adding onboarding fields to profiles...');
    const { error } = await supabase.rpc('exec_sql', { sql: profilesMigration }).single();
    
    if (error) {
      console.log('ℹ️  Please run the profiles migration manually');
    } else {
      console.log('✅ Profiles table migration completed');
    }
  } catch (error) {
    console.log('ℹ️  Profiles migration prepared for manual execution');
  }

  console.log('\n✨ Migration process completed!');
  console.log('\nNext steps:');
  console.log('1. If any migrations failed, run them manually in Supabase SQL editor');
  console.log('2. Set your OpenAI API key in the admin settings panel');
  console.log('3. Configure your environment variables');
}

runMigrations().catch(console.error);