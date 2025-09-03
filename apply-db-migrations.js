const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('Applying database migrations...');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./FIX_ERRORS_MIGRATION.sql', 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      const sqlStatement = statement + ';';
      console.log(`Executing: ${sqlStatement.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: sqlStatement
      }).catch(async (err) => {
        // If RPC doesn't exist, try using direct query
        const { data, error } = await supabase
          .from('_dummy_')
          .select(supabase.sql`${sqlStatement}`);
        return { data, error };
      });
      
      if (error) {
        console.error(`Error executing statement: ${error.message}`);
        // Continue with next statement even if this one fails
      } else {
        console.log('✓ Statement executed successfully');
      }
    }
    
    console.log('\nMigrations completed!');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
  }
}

// Apply individual fixes
async function applyIndividualFixes() {
  console.log('\nApplying individual fixes...');
  
  try {
    // Fix 1: Ensure notification_preferences table has proper setup
    console.log('Checking notification_preferences...');
    const { data: prefCheck, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1);
    
    if (prefError && prefError.code === '42P01') {
      console.log('Table does not exist, will be created by migration');
    } else {
      console.log('✓ notification_preferences table exists');
    }
    
    // Fix 2: Check if user has notification preferences
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userPrefs, error: userPrefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!userPrefs && !userPrefsError) {
        console.log('Creating default notification preferences for user...');
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            preferences: {
              email: {
                enabled: true,
                frequency: "immediate",
                categories: ["achievement", "message", "system"]
              },
              push: {
                enabled: true,
                categories: ["info", "success", "warning", "error", "achievement", "message", "reminder", "system"]
              },
              inApp: {
                enabled: true,
                sound: true,
                vibration: true
              }
            }
          });
        
        if (insertError) {
          console.error('Failed to create preferences:', insertError);
        } else {
          console.log('✓ Created default notification preferences');
        }
      }
    }
    
    // Fix 3: Deploy edge functions secrets
    console.log('\nNote: Edge function secrets need to be set via Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/functions');
    console.log('2. Add the following secrets:');
    console.log('   - OPENAI_API_KEY: Your OpenAI API key');
    console.log('   - STRIPE_SECRET_KEY: Your Stripe secret key (if using payments)');
    console.log('   - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (if using payments)');
    
  } catch (error) {
    console.error('Failed to apply individual fixes:', error);
  }
}

// Run migrations
applyMigrations().then(() => {
  applyIndividualFixes();
});