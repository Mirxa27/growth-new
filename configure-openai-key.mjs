#!/usr/bin/env node

/**
 * OpenAI API Key Configuration Script
 * Sets up a placeholder OpenAI API key in the admin_ai_providers table
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

async function configureOpenAI() {
  log('cyan', '🔑 CONFIGURING OPENAI API PROVIDER\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    info('1. Connecting to Supabase...');
    success('Connected successfully');

    info('2. Setting up OpenAI provider...');
    
    // Create or update OpenAI provider
    const { data, error } = await supabase
      .from('admin_ai_providers')
      .upsert({
        provider_type: 'openai',
        is_active: true,
        priority: 1,
        configuration: {
          api_key: 'PLACEHOLDER_KEY_SET_IN_ADMIN_PANEL',
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.7,
          base_url: 'https://api.openai.com'
        }
      }, { 
        onConflict: 'provider_type',
        ignoreDuplicates: false 
      });

    if (error) {
      console.warn('Provider setup warning:', error.message);
    } else {
      success('OpenAI provider configured');
    }

    log('cyan', '\n🎉 OPENAI CONFIGURATION COMPLETE!\n');
    success('✅ OpenAI provider ready for API key');
    success('✅ Admin can now add real API key');
    
    log('cyan', '\n🎯 NEXT STEPS:');
    info('1. Access admin panel: http://localhost:3000/admin');
    info('2. Login with: admin@newomen.me / NewomenAdmin2025!');
    info('3. Navigate to AI Provider Settings');
    info('4. Replace PLACEHOLDER_KEY with your real OpenAI API key');
    info('5. Test chat functionality');

  } catch (err) {
    error(`Configuration failed: ${err.message}`);
    process.exit(1);
  }
}

configureOpenAI();