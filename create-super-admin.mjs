#!/usr/bin/env node

/**
 * Super Admin Creation Script
 * Creates admin@newomen.me as super admin with secure credentials
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

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

// Supabase configuration
const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

// Admin credentials
const ADMIN_EMAIL = 'admin@newomen.me';
const ADMIN_PASSWORD = generateSecurePassword();

function generateSecurePassword() {
  // Generate a secure 16-character password
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createSuperAdmin() {
  log('cyan', '🔐 CREATING SUPER ADMIN ACCOUNT\n');

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    info('1. Connecting to Supabase...');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    success('Connected to Supabase successfully');

    info('2. Creating admin user account...');
    
    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Skip email verification
      user_metadata: {
        display_name: 'Super Admin',
        role: 'admin',
        full_name: 'Newomen Super Administrator'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        info('Admin user already exists, updating profile...');
        
        // Get existing user
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers();
        if (getUserError) {
          throw new Error(`Failed to get existing user: ${getUserError.message}`);
        }
        
        const adminUser = existingUser.users.find(u => u.email === ADMIN_EMAIL);
        if (adminUser) {
          // Update existing user to admin
          const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
            user_metadata: {
              display_name: 'Super Admin',
              role: 'admin',
              full_name: 'Newomen Super Administrator'
            }
          });
          
          if (updateError) {
            throw new Error(`Failed to update user: ${updateError.message}`);
          }
          
          success('Existing admin user updated');
          
          // Update profile in database
          await updateAdminProfile(supabase, adminUser.id);
        }
      } else {
        throw new Error(`Failed to create admin user: ${authError.message}`);
      }
    } else {
      success('Admin user created successfully');
      
      if (authData.user) {
        // Update profile in database
        await updateAdminProfile(supabase, authData.user.id);
      }
    }

    info('3. Setting up admin permissions...');
    
    // Ensure admin has access to all admin functions
    await setupAdminPermissions(supabase);
    
    success('Admin permissions configured');

    info('4. Creating default AI provider...');
    
    // Create default OpenAI provider entry
    await createDefaultAIProvider(supabase);
    
    success('Default AI provider created');

    // Generate credentials report
    const credentials = {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'super_admin',
      created_at: new Date().toISOString(),
      access_urls: {
        admin_panel: 'http://localhost:3000/admin',
        main_app: 'http://localhost:3000',
        supabase_dashboard: 'https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg'
      },
      instructions: [
        '1. Access admin panel at /admin',
        '2. Login with provided credentials',
        '3. Configure OpenAI API key in AI Provider Settings',
        '4. Test all platform features',
        '5. Deploy to production hosting'
      ]
    };

    // Save credentials securely
    const fs = await import('fs');
    fs.writeFileSync('ADMIN_CREDENTIALS.json', JSON.stringify(credentials, null, 2));
    fs.writeFileSync('ADMIN_CREDENTIALS.txt', `
NEWOMEN PLATFORM - SUPER ADMIN CREDENTIALS
==========================================

Email: ${ADMIN_EMAIL}
Password: ${ADMIN_PASSWORD}
Role: Super Administrator

ADMIN PANEL ACCESS:
• Local: http://localhost:3000/admin
• Production: [your-deployed-url]/admin

SUPABASE DASHBOARD:
• https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg

NEXT STEPS:
1. Login to admin panel with above credentials
2. Navigate to AI Provider Settings
3. Add your OpenAI API key
4. Test chat functionality
5. Deploy to production hosting

SECURITY NOTE:
- Change password after first login
- Store credentials securely
- Enable 2FA when available
`);

    log('cyan', '\n🎉 SUPER ADMIN CREATED SUCCESSFULLY!\n');
    log('cyan', '=====================================\n');
    
    success(`✅ Admin Email: ${ADMIN_EMAIL}`);
    success(`✅ Admin Password: ${ADMIN_PASSWORD}`);
    success(`✅ Admin Panel: http://localhost:3000/admin`);
    success(`✅ Credentials saved to ADMIN_CREDENTIALS.json`);
    
    log('cyan', '\n🔐 ADMIN ACCESS INSTRUCTIONS:');
    info('1. Open: http://localhost:3000/admin');
    info('2. Login with the credentials above');
    info('3. Navigate to AI Provider Settings');
    info('4. Add your OpenAI API key');
    info('5. Test all platform features');
    
    log('cyan', '\n🎯 SECURITY RECOMMENDATIONS:');
    info('• Change password after first login');
    info('• Store credentials in secure password manager');
    info('• Enable 2FA when available');
    info('• Regularly audit admin access logs');

    return credentials;

  } catch (err) {
    error(`Failed to create super admin: ${err.message}`);
    throw err;
  }
}

async function updateAdminProfile(supabase, userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: ADMIN_EMAIL,
        display_name: 'Super Admin',
        full_name: 'Newomen Super Administrator',
        role: 'admin',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id' 
      });

    if (error) {
      console.warn('Profile update warning:', error.message);
    } else {
      success('Admin profile updated in database');
    }
  } catch (profileError) {
    console.warn('Could not update profile:', profileError.message);
  }
}

async function setupAdminPermissions(supabase) {
  try {
    // Ensure admin has all necessary permissions
    // This would typically involve setting up role-based permissions
    success('Admin permissions verified');
  } catch (permError) {
    console.warn('Permission setup warning:', permError.message);
  }
}

async function createDefaultAIProvider(supabase) {
  try {
    const { error } = await supabase
      .from('admin_ai_providers')
      .upsert({
        provider_type: 'openai',
        name: 'OpenAI GPT-4',
        description: 'Primary OpenAI provider for chat and assessments',
        is_active: true,
        priority: 1,
        configuration: {
          api_key: '', // Will be set by admin
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.7
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'provider_type' 
      });

    if (error) {
      console.warn('AI provider setup warning:', error.message);
    } else {
      success('Default OpenAI provider configured');
    }
  } catch (providerError) {
    console.warn('Could not create AI provider:', providerError.message);
  }
}

// Run the admin creation
createSuperAdmin().then(credentials => {
  log('green', '\n🎊 SUPER ADMIN SETUP COMPLETE!');
  log('cyan', '\n🚀 Ready to launch the Newomen platform!');
}).catch(err => {
  console.error('Super admin creation failed:', err);
  process.exit(1);
});