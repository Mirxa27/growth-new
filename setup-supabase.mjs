#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Your Supabase credentials
const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Setting up Supabase...\n');

async function executeSQLFile(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sql
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Executing ${statements.length} statements from ${filePath}`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      try {
        // Use Supabase's query method
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).catch(async () => {
          // If exec_sql doesn't exist, try a different approach
          // This is a fallback - in production, you'd use proper migrations
          return { error: 'RPC not available' };
        });
        
        if (error) {
          console.log(`❌ Error: ${error}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Failed to execute statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors\n`);
    return { successCount, errorCount };
  } catch (error) {
    console.error(`❌ Failed to read SQL file: ${error.message}`);
    return { successCount: 0, errorCount: 1 };
  }
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log(`✅ Auth working - Found ${users?.length || 0} users`);
    }

    // Test database
    const { data, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.log('❌ Database test failed:', dbError.message);
    } else {
      console.log('✅ Database connection working');
    }
    
    return !authError && !dbError;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function createRPCFunction() {
  console.log('📝 Creating exec_sql RPC function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  // This is a bootstrap problem - we need exec_sql to create exec_sql
  // In production, you'd use Supabase migrations
  console.log('⚠️  Note: exec_sql function needs to be created manually in Supabase SQL Editor');
  console.log('Copy and paste this SQL:');
  console.log(createFunctionSQL);
}

async function main() {
  console.log('🌟 Supabase Setup Script');
  console.log('========================\n');
  
  // Test connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('\n⚠️  Some connection tests failed. Continuing anyway...\n');
  }
  
  // Create RPC function info
  await createRPCFunction();
  
  console.log('\n📋 Manual Setup Required:');
  console.log('========================');
  console.log('1. Go to Supabase SQL Editor:');
  console.log(`   ${SUPABASE_URL}/project/ufgqmqoykddaotdbwteg/sql/new\n`);
  
  console.log('2. Run the SQL from:');
  console.log('   - apply-all-migrations.sql');
  console.log('   - Any other migration files in supabase/migrations/\n');
  
  console.log('3. Deploy Edge Functions:');
  console.log('   Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/functions');
  console.log('   Deploy these functions:');
  console.log('   - get-realtime-token');
  console.log('   - realtime-voice-proxy');
  console.log('   - test-ai-provider');
  console.log('   - paypal-oauth');
  console.log('   - create-paypal-subscription\n');
  
  console.log('4. Set Edge Function Secrets:');
  console.log('   Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/vault');
  console.log('   Add these secrets:');
  console.log('   - OPENAI_API_KEY');
  console.log('   - PAYPAL_CLIENT_ID');
  console.log('   - PAYPAL_CLIENT_SECRET');
  console.log('   - PAYPAL_MODE (sandbox or live)\n');
  
  console.log('5. Configure Authentication:');
  console.log('   Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/auth/url-configuration');
  console.log('   Set Site URL: https://newomen.me');
  console.log('   Add Redirect URLs:');
  console.log('   - https://newomen.me/auth/callback');
  console.log('   - https://newomen.me/auth/reset-password\n');
  
  console.log('✅ Setup guide complete!');
}

// Run the setup
main().catch(console.error);