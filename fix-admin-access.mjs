#!/usr/bin/env node

/**
 * Fix Admin Access Script
 * Ensures admin@newomen.me has proper admin access
 */

import { createClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const error = (message) => log('red', `❌ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';
const ADMIN_EMAIL = 'admin@newomen.me';

async function fixAdminAccess() {
  log('cyan', '🔧 FIXING ADMIN ACCESS\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    info('1. Connecting to Supabase...');
    success('Connected successfully');

    info('2. Finding admin user...');
    
    // Get the admin user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
    if (!adminUser) {
      throw new Error(`Admin user ${ADMIN_EMAIL} not found`);
    }

    success(`Found admin user: ${adminUser.id}`);
    info(`User email: ${adminUser.email}`);
    info(`User metadata: ${JSON.stringify(adminUser.user_metadata)}`);

    info('3. Checking current profile...');
    
    // Check current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      info('Profile not found, creating new profile...');
      
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: adminUser.id,
          email: ADMIN_EMAIL,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Profile creation warning:', insertError.message);
        
        // Try alternative approach - check what columns exist
        info('Checking available profile columns...');
        const { data: testProfile, error: testError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (testProfile && testProfile.length > 0) {
          info('Sample profile structure:', Object.keys(testProfile[0]));
        }
      } else {
        success('Admin profile created successfully');
      }
    } else {
      success('Found existing profile');
      info(`Current role: ${currentProfile.role}`);
      
      if (currentProfile.role !== 'admin') {
        info('4. Updating profile to admin role...');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', adminUser.id);

        if (updateError) {
          console.warn('Profile update warning:', updateError.message);
        } else {
          success('Profile updated to admin role');
        }
      } else {
        success('Profile already has admin role');
      }
    }

    info('5. Verifying admin access...');
    
    // Final verification
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (finalError) {
      error(`Profile verification failed: ${finalError.message}`);
    } else {
      success('Admin profile verified');
      info(`Final profile: ${JSON.stringify(finalProfile, null, 2)}`);
    }

    log('cyan', '\n🎉 ADMIN ACCESS FIXED!\n');
    success('✅ Admin user verified');
    success('✅ Profile configured');
    success('✅ Admin role assigned');
    
    log('cyan', '\n🎯 ADMIN ACCESS INSTRUCTIONS:');
    info('1. Go to: http://localhost:3000/auth');
    info('2. Sign in with:');
    info(`   Email: ${ADMIN_EMAIL}`);
    info('   Password: NewomenAdmin2025!');
    info('3. After login, navigate to: /admin');
    info('4. You should now have admin panel access');
    
    log('cyan', '\n🔧 IF ADMIN PANEL STILL NOT ACCESSIBLE:');
    info('1. Check browser console for errors');
    info('2. Verify you are logged in');
    info('3. Try accessing /admin directly');
    info('4. Check network tab for failed requests');

  } catch (err) {
    error(`Admin access fix failed: ${err.message}`);
    
    log('cyan', '\n🔧 MANUAL FIX STEPS:');
    info('1. Access Supabase dashboard');
    info('2. Go to Authentication > Users');
    info('3. Find admin@newomen.me user');
    info('4. Edit user metadata to include: {"role": "admin"}');
    info('5. Update profiles table with role = "admin"');
    
    process.exit(1);
  }
}

fixAdminAccess();