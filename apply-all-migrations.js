import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🚀 Starting migration process...');
  
  const migrationFiles = [
    '20250901130000_complete_assessment_system.sql',
    '20250901130001_assessment_stored_procedures.sql',
    '20250901180000_enhanced_free_assessments.sql',
    '20250901190000_user_assessments_comprehensive.sql'
  ];

  for (const file of migrationFiles) {
    try {
      console.log(`\n📄 Applying migration: ${file}`);
      const sqlContent = await fs.readFile(
        path.join(__dirname, 'supabase', 'migrations', file),
        'utf8'
      );

      // Split by semicolons but not those within strings or comments
      const statements = sqlContent
        .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip empty statements or comments
        if (!statement || statement.match(/^\s*--/)) continue;

        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement
          });

          if (error) {
            // If exec_sql doesn't exist, try direct query
            const { error: queryError } = await supabase
              .from('_migrations')
              .select('*')
              .limit(1);
            
            if (queryError?.message?.includes('exec_sql')) {
              console.log(`⚠️  Cannot execute SQL directly. Please run this migration manually.`);
              console.log(`Statement ${i + 1}/${statements.length} needs manual execution.`);
            } else {
              throw error;
            }
          } else {
            process.stdout.write('.');
          }
        } catch (err) {
          console.error(`\n❌ Error in statement ${i + 1}:`, err.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
      
      console.log(`\n✅ Migration ${file} processed`);
    } catch (error) {
      console.error(`\n❌ Error reading migration ${file}:`, error.message);
    }
  }

  console.log('\n✨ Migration process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. If any migrations failed, run them manually in Supabase SQL editor');
  console.log('2. Deploy the edge function: npm run deploy:functions');
  console.log('3. Set up API keys in Supabase Dashboard > Settings > Edge Functions');
}

// Create a simpler version that generates a combined SQL file
async function generateCombinedMigration() {
  console.log('\n📦 Generating combined migration file...');
  
  const migrationFiles = [
    '20250901130000_complete_assessment_system.sql',
    '20250901130001_assessment_stored_procedures.sql',
    '20250901180000_enhanced_free_assessments.sql',
    '20250901190000_user_assessments_comprehensive.sql'
  ];

  let combinedSql = '-- Combined Assessment System Migrations\n';
  combinedSql += '-- Generated on ' + new Date().toISOString() + '\n\n';

  for (const file of migrationFiles) {
    try {
      const sqlContent = await fs.readFile(
        path.join(__dirname, 'supabase', 'migrations', file),
        'utf8'
      );
      
      combinedSql += `\n-- =====================================\n`;
      combinedSql += `-- Migration: ${file}\n`;
      combinedSql += `-- =====================================\n\n`;
      combinedSql += sqlContent;
      combinedSql += '\n\n';
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  await fs.writeFile('combined-assessments-migration.sql', combinedSql);
  console.log('✅ Combined migration file created: combined-assessments-migration.sql');
  console.log('📋 Copy and paste this file content into Supabase SQL editor to apply all migrations.');
}

// Run both functions
(async () => {
  await generateCombinedMigration();
  
  if (process.argv.includes('--apply')) {
    await applyMigrations();
  } else {
    console.log('\n💡 To attempt automatic migration, run: node apply-all-migrations.js --apply');
  }
})();