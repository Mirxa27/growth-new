import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeployment() {
  console.log('🧪 Testing Newomen.me Deployment...\n');

  // Test 1: Check if we can connect to Supabase
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return;
  }

  // Test 2: Check if public assessments are accessible
  console.log('2️⃣ Testing Public Assessments...');
  try {
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('id, title, type, visibility')
      .eq('visibility', 'public')
      .limit(10);

    if (error) throw error;

    if (assessments && assessments.length > 0) {
      console.log(`✅ Found ${assessments.length} public assessments:`);
      assessments.forEach(a => console.log(`   - ${a.title} (${a.type})`));
    } else {
      console.log('⚠️  No public assessments found. Run migrations first.');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to fetch assessments:', error.message);
    console.log('   Make sure to run the migrations first.\n');
  }

  // Test 3: Check if edge function is deployed
  console.log('3️⃣ Testing Edge Function...');
  try {
    const testParams = {
      topic: 'Test Assessment',
      type: 'quiz',
      provider: 'openai',
      model: 'gpt-4o-mini',
      questionCount: 3,
      difficulty: 'beginner',
      category: 'test'
    };

    const { data, error } = await supabase.functions.invoke('create-assessment', {
      body: testParams
    });

    if (error) throw error;

    if (data?.generated_content) {
      console.log('✅ Edge function is working!');
      console.log(`   Generated: ${data.generated_content.title}`);
    } else {
      console.log('⚠️  Edge function returned unexpected response');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Edge function test failed:', error.message);
    console.log('   Make sure to deploy the edge function and set API keys.\n');
  }

  // Test 4: Check database tables
  console.log('4️⃣ Checking Database Tables...');
  const requiredTables = [
    'assessments',
    'assessment_questions',
    'assessment_options',
    'assessment_results',
    'admin_logs'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}' not found`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message);
    }
  }

  console.log('\n📊 Deployment Test Summary:');
  console.log('- If all tests pass, your deployment is ready!');
  console.log('- If any tests fail, check the deployment guide for troubleshooting.');
  console.log('\n🔗 Next steps:');
  console.log('1. Access your app at your deployment URL');
  console.log('2. Test the free assessments without logging in');
  console.log('3. Create an account and test private assessments');
  console.log('4. Log in as admin to test AI content generation');
}

testDeployment().catch(console.error);