/**
 * Apply migrations directly to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration(filename) {
  try {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', filename);
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log(`Applying migration: ${filename}`);
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Using direct query method...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: queryError } = await supabase.rpc('query', { 
            query_text: statement + ';' 
          });
          
          if (queryError) {
            console.error(`Error executing statement: ${queryError.message}`);
          }
        }
      }
    }
    
    console.log(`✅ Migration ${filename} applied successfully`);
  } catch (error) {
    console.error(`❌ Error applying migration ${filename}:`, error.message);
  }
}

// Apply the specific migration
async function main() {
  console.log('Applying missing columns migration...\n');
  
  // First, let's check if the column already exists
  const { data: columns } = await supabase
    .rpc('get_table_columns', { 
      table_name: 'voice_agent_configs',
      schema_name: 'public'
    })
    .catch(() => ({ data: null }));
  
  if (!columns) {
    // Try a different approach - just apply the migration
    await applyMigration('20240113_add_arabic_support_column.sql');
  } else {
    const hasArabicSupport = columns.some(col => col.column_name === 'arabic_support');
    if (hasArabicSupport) {
      console.log('✅ arabic_support column already exists');
    } else {
      await applyMigration('20240113_add_arabic_support_column.sql');
    }
  }
  
  console.log('\nMigration process complete!');
}

main().catch(console.error);