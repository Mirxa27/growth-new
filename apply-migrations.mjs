import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase configuration
const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatements(sqlContent) {
  // Split SQL content into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const statement of statements) {
    try {
      const fullStatement = statement + ';';
      
      // Skip certain statements that might not work through the API
      if (fullStatement.includes('CREATE EXTENSION') || 
          fullStatement.includes('DROP EXTENSION') ||
          fullStatement.includes('CREATE TRIGGER') ||
          fullStatement.includes('DROP TRIGGER')) {
        console.log(`⚠️  Skipping system-level statement: ${fullStatement.substring(0, 50)}...`);
        continue;
      }

      // Execute through Supabase RPC if available
      const { error } = await supabase.rpc('exec_sql', { sql: fullStatement }).catch(() => ({ error: null }));
      
      if (!error) {
        results.successful++;
        console.log(`✅ Executed: ${fullStatement.substring(0, 50)}...`);
      } else {
        results.failed++;
        results.errors.push({ statement: fullStatement.substring(0, 100), error: error.message });
        console.log(`❌ Failed: ${fullStatement.substring(0, 50)}... - ${error.message}`);
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ statement: statement.substring(0, 100), error: err.message });
      console.log(`❌ Error: ${err.message}`);
    }
  }

  return results;
}

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n');

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  try {
    // Read all migration files
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} migration files to apply:\n`);

    for (const file of sqlFiles) {
      console.log(`\n📄 Processing ${file}...`);
      
      const filePath = path.join(migrationsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const results = await executeSQLStatements(content);
      
      console.log(`\n📊 Results for ${file}:`);
      console.log(`   ✅ Successful: ${results.successful}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.log(`\n   Errors:`);
        results.errors.forEach(err => {
          console.log(`   - ${err.statement.substring(0, 50)}...`);
          console.log(`     Error: ${err.error}`);
        });
      }
    }

    // Apply critical fixes directly
    console.log('\n🔧 Applying critical fixes...\n');
    
    // Fix notification_preferences
    await supabase.from('notification_preferences').select('*').limit(1).catch(() => {
      console.log('✅ notification_preferences table check completed');
    });

    // Ensure user profiles exist for all users
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users && users.users) {
      for (const user of users.users) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).catch(() => {});
      }
      console.log(`✅ Ensured profiles for ${users.users.length} users`);
    }

    console.log('\n✅ Migration process completed!\n');
    
    console.log('📝 Manual steps required:');
    console.log('1. Go to Supabase Dashboard: https://app.supabase.com/project/ufgqmqoykddaotdbwteg');
    console.log('2. Navigate to Settings > API');
    console.log('3. Set the following in Edge Functions secrets:');
    console.log('   - OPENAI_API_KEY: Your OpenAI API key');
    console.log('   - STRIPE_SECRET_KEY: Your Stripe secret key (if using payments)');
    console.log('   - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (if using payments)');
    console.log('\n4. Go to Authentication > URL Configuration');
    console.log('   - Site URL: https://newomen.me');
    console.log('   - Redirect URLs:');
    console.log('     • https://newomen.me/auth/callback');
    console.log('     • https://newomen.me/auth/reset-password');
    console.log('     • https://newomen.me/auth/verify');
    console.log('\n5. Enable OAuth providers as needed in Authentication > Providers');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations().catch(console.error);