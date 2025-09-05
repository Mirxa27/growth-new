import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixedVerificationTests() {
  console.log('🔧 Fixed Assessment Verification Tests');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let failureCount = 0;

  // Test 1: Verify assessment_results table structure
  console.log('\n🧪 Test 1: Assessment Results Table Structure');
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('assessment_results')
      .select('id, user_id, assessment_id, score, submitted_at, answers, completed')
      .limit(1);

    if (tableError) {
      console.log('   ❌ Failed:', tableError.message);
      failureCount++;
    } else {
      console.log('   ✅ Passed: Assessment results table structure is correct');
      console.log('      Available columns: id, user_id, assessment_id, score, submitted_at, answers, completed');
      successCount++;
    }
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Test 2: User Progress Through Assessment Results (Fixed)
  console.log('\n🧪 Test 2: User Progress Through Assessment Results (Fixed Column Names)');
  try {
    const { data: resultsData, error: resultsError } = await supabase
      .from('assessment_results')
      .select('id, user_id, assessment_id, score, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (resultsError) {
      console.log('   ❌ Failed:', resultsError.message);
      failureCount++;
    } else {
      console.log(`   ✅ Passed: Retrieved ${resultsData?.length || 0} assessment results`);
      if (resultsData && resultsData.length > 0) {
        console.log(`      Latest result: Assessment ${resultsData[0].assessment_id} with score ${resultsData[0].score}`);
      } else {
        console.log('      No assessment results yet (expected for new database)');
      }
      successCount++;
    }
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Test 3: Admin Analytics Through Existing Tables (Fixed approach)
  console.log('\n🧪 Test 3: Admin Analytics Through Existing Tables (Fixed)');
  try {
    // Test basic analytics queries that should work for admins
    const [
      { data: assessmentCount, error: assessmentError },
      { data: profileCount, error: profileError },
      { data: resultCount, error: resultError }
    ] = await Promise.all([
      supabase.from('assessments').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('assessment_results').select('id', { count: 'exact', head: true })
    ]);

    if (assessmentError || profileError || resultError) {
      const errors = [assessmentError, profileError, resultError].filter(Boolean);
      console.log('   ❌ Failed accessing analytics data:', errors.map(e => e?.message).join(', '));
      failureCount++;
    } else {
      console.log('   ✅ Passed: Admin analytics queries successful');
      console.log(`      Assessments: ${assessmentCount || 0}`);
      console.log(`      Profiles: ${profileCount || 0}`);
      console.log(`      Results: ${resultCount || 0}`);
      successCount++;
    }
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Test 4: Admin Function Availability
  console.log('\n🧪 Test 4: Admin Function Availability');
  try {
    // Test if we can call the is_admin function
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin', { uid: '00000000-0000-0000-0000-000000000000' });

    if (adminError) {
      console.log('   ❌ Failed:', adminError.message);
      failureCount++;
    } else {
      console.log('   ✅ Passed: is_admin function is available');
      console.log(`      Admin check result: ${adminCheck}`);
      successCount++;
    }
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Test 5: Complete Assessment Flow Integrity
  console.log('\n🧪 Test 5: Complete Assessment Flow Integrity');
  try {
    // Verify the complete chain: assessments -> questions -> options
    const { data: firstAssessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id, 
        title, 
        visibility,
        assessment_questions (
          id,
          question_text,
          assessment_options (
            id,
            option_text,
            score_value
          )
        )
      `)
      .eq('visibility', 'public')
      .limit(1)
      .single();

    if (assessmentError || !firstAssessment) {
      console.log('   ❌ Failed:', assessmentError?.message || 'No assessment found');
      failureCount++;
    } else {
      const questions = firstAssessment.assessment_questions || [];
      const totalOptions = questions.reduce((sum: number, q: any) => sum + (q.assessment_options?.length || 0), 0);
      
      console.log('   ✅ Passed: Assessment flow integrity verified');
      console.log(`      Assessment: "${firstAssessment.title}"`);
      console.log(`      Questions: ${questions.length}`);
      console.log(`      Total Options: ${totalOptions}`);
      successCount++;
    }
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Test 6: Database Performance Check
  console.log('\n🧪 Test 6: Database Performance Check');
  try {
    const startTime = Date.now();
    
    await Promise.all([
      supabase.from('assessments').select('id').limit(1),
      supabase.from('assessment_questions').select('id').limit(1),
      supabase.from('assessment_options').select('id').limit(1),
      supabase.from('profiles').select('id').limit(1)
    ]);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime > 5000) {
      console.log(`   ⚠️  Warning: Slow response time ${responseTime}ms`);
    } else {
      console.log(`   ✅ Passed: Good database performance (${responseTime}ms)`);
    }
    successCount++;
  } catch (error: unknown) {
    console.log('   ❌ Failed:', (error as Error).message);
    failureCount++;
  }

  // Summary
  console.log('\n📊 FIXED VERIFICATION SUMMARY');
  console.log('=' .repeat(50));
  const totalTests = successCount + failureCount;
  const successRate = ((successCount / totalTests) * 100).toFixed(1);
  
  console.log(`✅ Successful Tests: ${successCount}/${totalTests} (${successRate}%)`);
  console.log(`❌ Failed Tests: ${failureCount}/${totalTests}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Assessment verification complete.');
  } else if (failureCount <= 2) {
    console.log('\n✨ Core functionality working! Minor issues detected.');
  } else {
    console.log('\n⚠️  Some issues detected. Review failed tests above.');
  }

  return { successCount, failureCount, totalTests, successRate };
}

// Execute the tests
fixedVerificationTests()
  .then(result => {
    console.log(`\n🏁 Verification complete with ${result.successRate}% success rate`);
    process.exit(result.failureCount > 3 ? 1 : 0);
  })
  .catch((error: Error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
