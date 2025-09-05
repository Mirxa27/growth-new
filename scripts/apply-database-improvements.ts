import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM2NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sql: string, description: string) {
  console.log(`\n🔧 ${description}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Success: ${description}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    return false;
  }
}

async function applyDatabaseImprovements() {
  console.log('🚀 Applying Database Improvements for User Flow Verification');
  console.log('===========================================================');
  
  let successCount = 0;
  let totalOperations = 0;
  
  // Create exec_sql function if it doesn't exist
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'SQL executed successfully';
    EXCEPTION WHEN OTHERS THEN
      RETURN 'Error: ' || SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  totalOperations++;
  if (await runSQL(execSqlFunction, 'Creating exec_sql helper function')) {
    successCount++;
  }
  
  // Apply visitor sessions table
  const visitorSessionsSQL = fs.readFileSync('create-visitor-sessions-table.sql', 'utf8');
  totalOperations++;
  if (await runSQL(visitorSessionsSQL, 'Creating visitor_sessions table')) {
    successCount++;
  }
  
  // Apply user progress table
  const userProgressSQL = fs.readFileSync('create-user-progress-table.sql', 'utf8');
  totalOperations++;
  if (await runSQL(userProgressSQL, 'Creating user_progress table and triggers')) {
    successCount++;
  }
  
  // Apply admin analytics
  const adminAnalyticsSQL = fs.readFileSync('create-admin-analytics.sql', 'utf8');
  totalOperations++;
  if (await runSQL(adminAnalyticsSQL, 'Creating admin analytics views and functions')) {
    successCount++;
  }
  
  // Add missing assessment options
  const lifePurposeOptionsSQL = fs.readFileSync('fix-life-purpose-options.sql', 'utf8');
  totalOperations++;
  if (await runSQL(lifePurposeOptionsSQL, 'Adding missing Life Purpose Explorer options')) {
    successCount++;
  }
  
  console.log('\n📊 Database Improvements Summary');
  console.log('================================');
  console.log(`✅ Successful operations: ${successCount}/${totalOperations}`);
  console.log(`🎯 Success rate: ${Math.round((successCount / totalOperations) * 100)}%`);
  
  if (successCount === totalOperations) {
    console.log('\n🎉 All database improvements applied successfully!');
    console.log('   • Visitor session tracking enabled');
    console.log('   • User progress tracking implemented');
    console.log('   • Admin analytics dashboard ready');
    console.log('   • Assessment options completed');
  } else {
    console.log('\n⚠️  Some operations failed. Check the errors above.');
  }
  
  return successCount === totalOperations;
}

// Run the improvements
applyDatabaseImprovements()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
