#!/usr/bin/env node

/**
 * Test Admin Function Script
 * Tests the is_admin() database function
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';
const ADMIN_EMAIL = 'admin@newomen.me';

async function testAdminFunction() {
  console.log('🧪 Testing admin function...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    console.log(`Testing is_admin() function for user: ${adminUser.id}`);

    // Test the is_admin function
    const { data, error } = await supabase
      .rpc('is_admin', { uid: adminUser.id });

    if (error) {
      console.error('❌ is_admin function error:', error.message);
      
      // Try to create the function
      console.log('🔧 Creating is_admin function...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
        RETURNS boolean
        LANGUAGE sql
        STABLE SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = uid AND role = 'admin'
          );
        $$;
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      if (createError) {
        console.warn('Could not create function via RPC:', createError.message);
      } else {
        console.log('✅ is_admin function created');
        
        // Test again
        const { data: testData, error: testError } = await supabase
          .rpc('is_admin', { uid: adminUser.id });
        
        if (testError) {
          console.error('❌ Function still not working:', testError.message);
        } else {
          console.log('✅ is_admin function result:', testData);
        }
      }
    } else {
      console.log('✅ is_admin function result:', data);
    }

    // Also test direct profile query
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', adminUser.id)
      .single();

    console.log('✅ Direct profile query:', profile);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAdminFunction();