#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Production Supabase configuration
const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0MDA4MywiZXhwIjoyMDUxNTE2MDgzfQ.WdR7Ql-r3u6OAUGAhqRLNrqvuNNg7vkq2g7KPPEjpDk';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyDatabaseSetup() {
  try {
    console.log('🚀 Starting Growth Echo Nexus database setup...');
    
    // Read the complete SQL setup script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'COMPLETE_DATABASE_SETUP.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: queryData, error: queryError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          if (queryError && queryError.code !== 'PGRST116') {
            throw queryError;
          }
          
          // Execute using raw SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }
        
        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        errorCount++;
        console.warn(`⚠️  Statement ${i + 1} failed: ${error.message}`);
        
        // Continue with non-critical errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('does not exist') &&
            !error.message.includes('permission denied')) {
          console.error(`❌ Critical error in statement ${i + 1}:`, error.message);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Database Setup Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️  Warnings/Skipped: ${errorCount}`);
    
    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
    } else {
      console.log(`📋 Found ${tables.length} tables in public schema`);
      const expectedTables = [
        'profiles', 'assessments', 'assessment_questions', 'assessment_options',
        'assessment_results', 'admin_ai_providers', 'voice_agent_configs',
        'voice_sessions', 'posts', 'post_likes', 'post_comments',
        'library_items', 'user_library_progress'
      ];
      
      const existingTables = tables.map(t => t.table_name);
      const createdTables = expectedTables.filter(table => existingTables.includes(table));
      
      console.log(`✅ Created tables: ${createdTables.join(', ')}`);
      
      if (createdTables.length >= 10) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('🚀 Your Growth Echo Nexus application is now ready to use!');
      } else {
        console.log('\n⚠️  Some tables may not have been created. Check the logs above.');
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your Supabase credentials');
    console.error('2. Ensure you have sufficient permissions');
    console.error('3. Try running the script again');
    process.exit(1);
  }
}

// Alternative method using individual table creation
async function createTablesIndividually() {
  console.log('\n🔄 Trying alternative approach: Creating tables individually...');
  
  const tableDefinitions = [
    {
      name: 'profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT,
          full_name TEXT,
          username TEXT UNIQUE,
          avatar_url TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'assessments',
      sql: `
        CREATE TABLE IF NOT EXISTS public.assessments (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
          category TEXT DEFAULT 'general',
          created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          estimated_time INTEGER DEFAULT 10,
          personality_type TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'assessment_questions',
      sql: `
        CREATE TABLE IF NOT EXISTS public.assessment_questions (
          id BIGSERIAL PRIMARY KEY,
          assessment_id BIGINT REFERENCES public.assessments(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'scale', 'free_text')),
          position INTEGER DEFAULT 1,
          scale_min INTEGER DEFAULT 1,
          scale_max INTEGER DEFAULT 5,
          scale_labels JSONB,
          is_required BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'assessment_options',
      sql: `
        CREATE TABLE IF NOT EXISTS public.assessment_options (
          id BIGSERIAL PRIMARY KEY,
          question_id BIGINT REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
          option_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT false,
          position INTEGER DEFAULT 1,
          feedback TEXT,
          scoring_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }
  ];
  
  for (const table of tableDefinitions) {
    try {
      console.log(`📝 Creating table: ${table.name}`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: table.sql })
      });
      
      if (response.ok) {
        console.log(`✅ Table ${table.name} created successfully`);
      } else {
        console.warn(`⚠️  Table ${table.name} creation failed or already exists`);
      }
      
    } catch (error) {
      console.warn(`⚠️  Error creating table ${table.name}:`, error.message);
    }
  }
}

// Run the setup
applyDatabaseSetup()
  .then(() => {
    console.log('\n🎯 Database setup process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    // Try alternative approach
    createTablesIndividually()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
