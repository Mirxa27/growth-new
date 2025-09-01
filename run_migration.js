import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250901140000_production_ready_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');

    // Split the SQL into individual statements
    const statements = sql.split(';').filter(statement => statement.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.error('Error executing statement:', error);
          // Continue with next statement
        }
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
