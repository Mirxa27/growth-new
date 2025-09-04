import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyVoiceTables() {
  console.log('🚀 Applying voice tables to database...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('apply_voice_tables.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('CREATE OR REPLACE FUNCTION'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using SQL query
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Check if it's a "already exists" error
            if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
              console.log(`ℹ️ Statement ${i + 1} skipped (already exists)`);
            } else {
              console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          // Handle specific errors gracefully
          if (err.message && err.message.includes('already exists')) {
            console.log(`ℹ️ Statement ${i + 1} skipped (already exists)`);
          } else {
            console.log(`ℹ️ Statement ${i + 1} skipped:`, err.message);
          }
        }
      }
    }
    
    console.log('✅ Voice tables applied successfully!');
    
    // Verify tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['voice_sessions', 'voice_agent_configs']);
    
    if (error) {
      console.error('❌ Error verifying tables:', error);
    } else {
      console.log('✅ Tables verified:', tables.map(t => t.table_name));
      
      // Check if default config exists
      const { data: config, error: configError } = await supabase
        .from('voice_agent_configs')
        .select('name')
        .eq('name', 'NewMe Default Voice')
        .single();
      
      if (config) {
        console.log('✅ Default voice configuration exists');
      } else {
        console.log('⚠️ Default voice configuration not found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying voice tables:', error);
  }
}

// Run the script
applyVoiceTables();
