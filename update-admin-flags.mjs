#!/usr/bin/env node

/**
 * Update Admin Flags Script
 * Ensures all admin flags are properly set
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';
const ADMIN_EMAIL = 'admin@newomen.me';

async function updateAdminFlags() {
  console.log('🔧 Updating admin flags...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Update all admin flags
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        is_admin: true,
        is_admin_backup: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.id);

    if (error) {
      console.warn('Update warning:', error.message);
    } else {
      console.log('✅ Admin flags updated successfully');
    }

    // Verify the update
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    console.log('✅ Updated profile:', JSON.stringify(profile, null, 2));

  } catch (err) {
    console.error('❌ Update failed:', err.message);
  }
}

updateAdminFlags();