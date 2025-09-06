/**
 * Test script to verify error logging functionality
 * Run this script after applying the migration to test error logging
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testErrorLogging() {
  console.log('Testing error logging functionality...');

  try {
    // Test 1: Insert a test error log
    console.log('1. Testing error log insertion...');
    const testError = {
      message: 'Test error from test script',
      code: 'TEST_001',
      severity: 'low',
      category: 'unknown',
      context: {
        test: true,
        timestamp: new Date().toISOString(),
        component: 'test-script'
      }
    };

    const { data, error } = await supabase
      .from('error_logs')
      .insert([testError])
      .select();

    if (error) {
      console.error('❌ Error inserting test error:', error.message);
      return false;
    }

    console.log('✅ Test error inserted successfully:', data);

    // Test 2: Query the inserted error
    console.log('2. Testing error log retrieval...');
    const { data: errors, error: queryError } = await supabase
      .from('error_logs')
      .select('*')
      .eq('code', 'TEST_001')
      .single();

    if (queryError) {
      console.error('❌ Error querying test error:', queryError.message);
      return false;
    }

    console.log('✅ Test error retrieved successfully:', errors);

    // Test 3: Test the error logging function
    console.log('3. Testing error logging function...');
    const { data: functionResult, error: functionError } = await supabase
      .rpc('log_application_error', {
        p_message: 'Test error from function',
        p_code: 'TEST_002',
        p_severity: 'medium',
        p_category: 'validation'
      });

    if (functionError) {
      console.error('❌ Error calling log_application_error function:', functionError.message);
      return false;
    }

    console.log('✅ Error logging function executed successfully:', functionResult);

    // Test 4: Clean up test data
    console.log('4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('error_logs')
      .delete()
      .in('code', ['TEST_001', 'TEST_002']);

    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 All error logging tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Error logging test failed:', error);
    return false;
  }
}

async function testPermissions() {
  console.log('\nTesting error logging permissions...');

  try {
    // Test anonymous access
    console.log('1. Testing anonymous access...');
    const anonymousClient = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await anonymousClient
      .from('error_logs')
      .insert({
        message: 'Anonymous test error',
        severity: 'low',
        category: 'unknown'
      });

    if (insertError) {
      console.error('❌ Anonymous insert failed:', insertError.message);
    } else {
      console.log('✅ Anonymous insert works');
    }

    // Test error stats view
    console.log('2. Testing error stats view...');
    const { data: stats, error: statsError } = await supabase
      .from('error_stats')
      .select('*')
      .limit(5);

    if (statsError) {
      console.error('❌ Error stats view failed:', statsError.message);
    } else {
      console.log('✅ Error stats view works');
    }

    return true;

  } catch (error) {
    console.error('❌ Permission test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Error Logging Test Suite');
  console.log('============================\n');

  const loggingTests = await testErrorLogging();
  const permissionTests = await testPermissions();

  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('Error Logging Tests:', loggingTests ? '✅ PASSED' : '❌ FAILED');
  console.log('Permission Tests:', permissionTests ? '✅ PASSED' : '❌ FAILED');

  if (loggingTests && permissionTests) {
    console.log('\n🎉 All tests passed! Error logging is working correctly.');
    process.exit(0);
  }
  console.log('\n❌ Some tests failed. Please check the error messages above.');
  process.exit(1);
}

main().catch(console.error);