import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test admin_ai_providers table
    const { data: providers, error: providersError } = await supabase
      .from('admin_ai_providers')
      .select('*')
      .limit(1);
    
    if (providersError) {
      console.error('Error with admin_ai_providers:', providersError.message);
    } else {
      console.log('✅ admin_ai_providers table accessible');
    }

    // Test profiles table structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at, last_login_at')
      .limit(1);
    
    if (profilesError) {
      console.error('Error with profiles:', profilesError.message);
    } else {
      console.log('✅ profiles table with last_login_at accessible');
    }

    // Test notification_preferences table
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1);
    
    if (prefsError) {
      console.error('Error with notification_preferences:', prefsError.message);
    } else {
      console.log('✅ notification_preferences table accessible');
    }

    // Test error_logs table
    const { data: logs, error: logsError } = await supabase
      .from('error_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.error('Error with error_logs:', logsError.message);
    } else {
      console.log('✅ error_logs table accessible');
    }

    console.log('Database connection test completed!');
    
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

testDatabaseConnection();
