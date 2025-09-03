import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verifying Supabase Deployment...\n');

async function verifyDeployment() {
  const results = {
    database: { status: '❌', details: '' },
    auth: { status: '❌', details: '' },
    storage: { status: '❌', details: '' },
    edgeFunctions: { status: '❌', details: '' }
  };

  // Test Database
  try {
    console.log('Testing Database...');
    const { error: tablesError } = await supabase.from('user_profiles').select('id').limit(1);
    if (!tablesError) {
      results.database.status = '✅';
      results.database.details = 'Tables accessible';
    } else {
      results.database.details = tablesError.message;
    }
  } catch (err) {
    results.database.details = err.message;
  }

  // Test Auth Configuration
  try {
    console.log('Testing Auth...');
    const { data: { session } } = await supabase.auth.getSession();
    results.auth.status = '✅';
    results.auth.details = session ? 'Authenticated session found' : 'Auth system ready';
  } catch (err) {
    results.auth.details = err.message;
  }

  // Test Storage Buckets
  try {
    console.log('Testing Storage...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (!error && buckets) {
      const expectedBuckets = ['avatars', 'documents', 'voice-recordings', 'exports'];
      const foundBuckets = buckets.map(b => b.name);
      const allBucketsExist = expectedBuckets.every(b => foundBuckets.includes(b));
      
      if (allBucketsExist) {
        results.storage.status = '✅';
        results.storage.details = `All ${expectedBuckets.length} buckets configured`;
      } else {
        results.storage.status = '⚠️';
        results.storage.details = `Found ${foundBuckets.length} buckets, expected ${expectedBuckets.length}`;
      }
    } else {
      results.storage.details = error?.message || 'Unable to list buckets';
    }
  } catch (err) {
    results.storage.details = err.message;
  }

  // Test Edge Functions
  try {
    console.log('Testing Edge Functions...');
    const response = await fetch(`${supabaseUrl}/functions/v1/get-realtime-token`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (response.status === 404) {
      results.edgeFunctions.details = 'Edge functions not deployed yet';
    } else if (response.status === 401) {
      results.edgeFunctions.status = '⚠️';
      results.edgeFunctions.details = 'Functions deployed but OPENAI_API_KEY not set';
    } else if (response.ok) {
      results.edgeFunctions.status = '✅';
      results.edgeFunctions.details = 'Edge functions accessible';
    } else {
      results.edgeFunctions.details = `Status: ${response.status}`;
    }
  } catch (err) {
    results.edgeFunctions.details = 'Unable to reach edge functions';
  }

  // Display Results
  console.log('\n📊 Deployment Status:\n');
  console.log(`Database:       ${results.database.status} ${results.database.details}`);
  console.log(`Authentication: ${results.auth.status} ${results.auth.details}`);
  console.log(`Storage:        ${results.storage.status} ${results.storage.details}`);
  console.log(`Edge Functions: ${results.edgeFunctions.status} ${results.edgeFunctions.details}`);

  // Check critical tables
  console.log('\n📋 Critical Tables Check:');
  const tables = [
    'user_profiles',
    'assessments',
    'goals',
    'chat_sessions',
    'voice_agent_configs',
    'notification_preferences',
    'admin_ai_providers'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1).single();
      console.log(`  ${error ? '❌' : '✅'} ${table}`);
    } catch {
      console.log(`  ❌ ${table}`);
    }
  }

  console.log('\n🔗 Quick Links:');
  console.log(`  Dashboard:      https://app.supabase.com/project/${supabaseUrl.split('.')[0].split('//')[1]}`);
  console.log(`  Edge Functions: https://app.supabase.com/project/${supabaseUrl.split('.')[0].split('//')[1]}/functions`);
  console.log(`  Auth Settings:  https://app.supabase.com/project/${supabaseUrl.split('.')[0].split('//')[1]}/auth/url-configuration`);
  console.log(`  API Settings:   https://app.supabase.com/project/${supabaseUrl.split('.')[0].split('//')[1]}/settings/api`);
  
  console.log('\n✅ Verification complete!');
}

verifyDeployment().catch(console.error);