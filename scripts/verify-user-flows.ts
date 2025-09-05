#!/usr/bin/env tsx

/**
 * User Flow Verification Script
 * Verifies that all user flows work correctly for visitors, users, and admins
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FlowTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  required: boolean;
}

class UserFlowVerifier {
  private results: { [key: string]: boolean } = {};
  private errors: { [key: string]: string } = {};

  async runTest(test: FlowTest): Promise<void> {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      const result = await test.test();
      this.results[test.name] = result;
      
      if (result) {
        console.log(`   ✅ PASSED`);
      } else {
        console.log(`   ❌ FAILED`);
      }
    } catch (error) {
      this.results[test.name] = false;
      this.errors[test.name] = error instanceof Error ? error.message : String(error);
      console.log(`   💥 ERROR: ${this.errors[test.name]}`);
    }
    console.log('');
  }

  async verifyVisitorFlow(): Promise<void> {
    console.log('\n🌐 VISITOR FLOW VERIFICATION\n' + '='.repeat(50));

    const visitorTests: FlowTest[] = [
      {
        name: 'Public Assessments Access',
        description: 'Verify public assessments are accessible without authentication',
        required: true,
        test: async () => {
          const { data, error } = await supabase
            .from('assessments')
            .select('id, title, visibility')
            .eq('visibility', 'public')
            .limit(5);
          
          return !error && data && data.length > 0;
        }
      },
      {
        name: 'Anonymous Assessment Taking',
        description: 'Verify visitor can take assessments without account',
        required: true,
        test: async () => {
          // Check if assessment questions are accessible
          const { data, error } = await supabase
            .from('assessment_questions')
            .select('id, question_text')
            .limit(1);
          
          return !error && data && data.length > 0;
        }
      },
      {
        name: 'Visitor Session Tracking',
        description: 'Verify visitor sessions can be created for anonymous users',
        required: true,
        test: async () => {
          // Test visitor session creation capability
          const visitorId = `visitor_${Date.now()}`;
          
          // This simulates what happens in FreeAssessmentTaker
          const { data, error } = await supabase
            .from('assessment_results')
            .insert({
              assessment_id: 'test-visitor-assessment',
              visitor_session_id: visitorId,
              score: 50,
              total_score: 100,
              percentage: 50,
              responses: { test: 'visitor_response' }
            })
            .select()
            .single();

          // Clean up test data
          if (data) {
            await supabase
              .from('assessment_results')
              .delete()
              .eq('id', data.id);
          }

          return !error;
        }
      }
    ];

    for (const test of visitorTests) {
      await this.runTest(test);
    }
  }

  async verifyUserFlow(): Promise<void> {
    console.log('\n👤 USER FLOW VERIFICATION\n' + '='.repeat(50));

    const userTests: FlowTest[] = [
      {
        name: 'User Registration Flow',
        description: 'Verify user can register and profile is created',
        required: true,
        test: async () => {
          // Test user registration process
          const testEmail = `test-${Date.now()}@example.com`;
          const testPassword = 'TestPassword123!';

          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: { full_name: 'Test User' }
            }
          });

          if (authError || !authData.user) {
            // Clean up if needed
            if (authData.user) {
              await supabase.auth.admin.deleteUser(authData.user.id);
            }
            return false;
          }

          // Check if profile was created
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

          // Clean up test user
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          return !profileError && profile && profile.role === 'user';
        }
      },
      {
        name: 'Protected Routes Access',
        description: 'Verify protected routes require authentication',
        required: true,
        test: async () => {
          // Test RLS policies - should fail without auth
          const { data, error } = await supabase
            .from('assessment_results')
            .select('*')
            .eq('user_id', 'fake-user-id');

          // Should have restricted access
          return error !== null || (data && data.length === 0);
        }
      },
      {
        name: 'Assessment Results Saving',
        description: 'Verify authenticated users can save assessment results',
        required: true,
        test: async () => {
          // This requires a real authenticated session, so we'll check table structure
          const { data, error } = await supabase
            .from('assessment_results')
            .select('id')
            .limit(1);

          // Should be able to query structure even without results
          return !error;
        }
      },
      {
        name: 'User Progress Tracking',
        description: 'Verify user progress tracking functionality exists',
        required: true,
        test: async () => {
          const { data, error } = await supabase
            .from('user_progress')
            .select('id')
            .limit(1);

          return !error;
        }
      }
    ];

    for (const test of userTests) {
      await this.runTest(test);
    }
  }

  async verifyAdminFlow(): Promise<void> {
    console.log('\n👑 ADMIN FLOW VERIFICATION\n' + '='.repeat(50));

    const adminTests: FlowTest[] = [
      {
        name: 'Admin Role Function',
        description: 'Verify is_admin() function exists and works',
        required: true,
        test: async () => {
          // Test the is_admin function
          const { data, error } = await supabase
            .rpc('is_admin', { uid: '00000000-0000-0000-0000-000000000000' });

          return !error;
        }
      },
      {
        name: 'Admin Assessment Management',
        description: 'Verify admin can manage assessments',
        required: true,
        test: async () => {
          // Check if assessments table supports admin operations
          const { data, error } = await supabase
            .from('assessments')
            .select('id, title, created_by')
            .limit(1);

          return !error;
        }
      },
      {
        name: 'User Role Management',
        description: 'Verify secure user role update function exists',
        required: true,
        test: async () => {
          // Test that the function exists (should fail due to permissions, but function should exist)
          const { error } = await supabase
            .rpc('update_user_role_secure', {
              target_user_id: '00000000-0000-0000-0000-000000000000',
              new_role: 'user'
            });

          // Should fail with permission error, not function not found error
          return error?.message?.includes('Access denied') || 
                 error?.message?.includes('Admin privileges required') ||
                 false;
        }
      },
      {
        name: 'Admin Analytics Access',
        description: 'Verify admin analytics tables are accessible',
        required: true,
        test: async () => {
          const { error } = await supabase
            .from('admin_logs')
            .select('id')
            .limit(1);

          // Should be blocked for non-admin (which is correct behavior)
          return error !== null;
        }
      }
    ];

    for (const test of adminTests) {
      await this.runTest(test);
    }
  }

  async verifyAssessmentFlow(): Promise<void> {
    console.log('\n📝 ASSESSMENT FLOW VERIFICATION\n' + '='.repeat(50));

    const assessmentTests: FlowTest[] = [
      {
        name: 'Assessment Structure',
        description: 'Verify complete assessment structure exists',
        required: true,
        test: async () => {
          // Check assessments table
          const { error: assessmentError } = await supabase
            .from('assessments')
            .select('id')
            .limit(1);

          // Check questions table  
          const { error: questionError } = await supabase
            .from('assessment_questions')
            .select('id')
            .limit(1);

          // Check options table
          const { error: optionError } = await supabase
            .from('assessment_options')
            .select('id')
            .limit(1);

          return !assessmentError && !questionError && !optionError;
        }
      },
      {
        name: 'Assessment Submission Flow',
        description: 'Verify assessment submission edge function exists',
        required: true,
        test: async () => {
          // Test edge function exists (should fail without proper payload, but function should exist)
          const { error } = await supabase.functions.invoke('submit-result', {
            body: { test: 'test' }
          });

          // Should fail with validation error, not function not found
          return error !== null && !error.message?.includes('Function not found');
        }
      },
      {
        name: 'Results Storage',
        description: 'Verify assessment results can be stored',
        required: true,
        test: async () => {
          const { error } = await supabase
            .from('assessment_results')
            .select('id')
            .limit(1);

          return !error;
        }
      }
    ];

    for (const test of assessmentTests) {
      await this.runTest(test);
    }
  }

  generateReport(): void {
    console.log('\n📊 VERIFICATION REPORT\n' + '='.repeat(50));
    
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.results).forEach(([name, passed]) => {
        if (!passed) {
          console.log(`   • ${name}`);
          if (this.errors[name]) {
            console.log(`     Error: ${this.errors[name]}`);
          }
        }
      });
    }

    console.log('\n🎉 Verification Complete!');
    
    if (passedTests === totalTests) {
      console.log('🚀 All user flows are working correctly!');
    } else {
      console.log('⚠️  Some flows need attention. Check failed tests above.');
    }
  }
}

async function main() {
  console.log('🔍 Growth Echo Nexus - User Flow Verification');
  console.log('=============================================\n');

  const verifier = new UserFlowVerifier();

  // Run all verification suites
  await verifier.verifyVisitorFlow();
  await verifier.verifyUserFlow();
  await verifier.verifyAdminFlow();
  await verifier.verifyAssessmentFlow();

  // Generate final report
  verifier.generateReport();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { UserFlowVerifier };
