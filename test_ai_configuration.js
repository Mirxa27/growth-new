#!/usr/bin/env node

/**
 * AI Configuration Test Script
 * Run this to verify your AI provider settings are working correctly
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';

// Configuration
const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

// Get OpenAI key from environment or prompt user
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

console.log(chalk.bold.cyan('\n🔧 AI Configuration Test Tool\n'));
console.log(chalk.gray('This tool will verify your AI provider settings and database configuration.\n'));

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results
const results = {
  supabase: { status: 'pending', message: '' },
  tables: { status: 'pending', message: '', details: [] },
  openai: { status: 'pending', message: '' },
  voice: { status: 'pending', message: '' }
};

async function testSupabaseConnection() {
  const spinner = ora('Testing Supabase connection...').start();
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      results.supabase.status = 'error';
      results.supabase.message = `Connection failed: ${error.message}`;
      spinner.fail(chalk.red('Supabase connection failed'));
    } else {
      results.supabase.status = 'success';
      results.supabase.message = 'Connected successfully';
      spinner.succeed(chalk.green('Supabase connection successful'));
    }
  } catch (error) {
    results.supabase.status = 'error';
    results.supabase.message = error.message;
    spinner.fail(chalk.red('Supabase connection error'));
  }
}

async function testDatabaseTables() {
  const spinner = ora('Checking database tables...').start();
  
  const requiredTables = [
    'voice_sessions',
    'voice_agent_configs',
    'system_settings',
    'profiles',
    'assessments'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        results.tables.details.push({
          table,
          exists: false,
          error: error.message
        });
        allTablesExist = false;
        console.log(chalk.yellow(`  ⚠ Table '${table}' is missing or inaccessible`));
      } else {
        results.tables.details.push({
          table,
          exists: true
        });
        console.log(chalk.green(`  ✓ Table '${table}' exists`));
      }
    } catch (error) {
      results.tables.details.push({
        table,
        exists: false,
        error: error.message
      });
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    results.tables.status = 'success';
    results.tables.message = 'All required tables exist';
    spinner.succeed(chalk.green('All database tables are ready'));
  } else {
    results.tables.status = 'error';
    results.tables.message = 'Some tables are missing';
    spinner.fail(chalk.red('Some database tables are missing'));
    console.log(chalk.yellow('\n  Run the migration SQL in fix_voice_sessions_migration.sql'));
  }
}

async function testOpenAIConnection() {
  const spinner = ora('Testing OpenAI API connection...').start();
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('YOUR_API_KEY')) {
    results.openai.status = 'error';
    results.openai.message = 'OpenAI API key not configured';
    spinner.fail(chalk.red('OpenAI API key not configured'));
    console.log(chalk.yellow('  Add your OpenAI API key to .env file'));
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const hasGPT4 = data.data?.some(m => m.id.includes('gpt-4'));
      const hasRealtime = data.data?.some(m => m.id.includes('realtime'));
      
      results.openai.status = 'success';
      results.openai.message = `Connected (${data.data?.length || 0} models available)`;
      spinner.succeed(chalk.green('OpenAI API connection successful'));
      
      if (hasGPT4) {
        console.log(chalk.green('  ✓ GPT-4 models available'));
      }
      if (hasRealtime) {
        console.log(chalk.green('  ✓ Realtime models available'));
      } else {
        console.log(chalk.yellow('  ⚠ Realtime models not available (may need access)'));
      }
    } else {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      results.openai.status = 'error';
      results.openai.message = `API error: ${error.error?.message || response.statusText}`;
      spinner.fail(chalk.red('OpenAI API connection failed'));
      
      if (response.status === 401) {
        console.log(chalk.yellow('  Invalid API key'));
      } else if (response.status === 429) {
        console.log(chalk.yellow('  Rate limit exceeded or quota reached'));
      }
    }
  } catch (error) {
    results.openai.status = 'error';
    results.openai.message = `Connection error: ${error.message}`;
    spinner.fail(chalk.red('Failed to connect to OpenAI'));
  }
}

async function testVoiceConfiguration() {
  const spinner = ora('Checking voice agent configuration...').start();
  
  try {
    const { data, error } = await supabase
      .from('voice_agent_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error && error.code === 'PGRST116') {
      results.voice.status = 'warning';
      results.voice.message = 'No active voice configuration found';
      spinner.warn(chalk.yellow('No active voice configuration'));
      console.log(chalk.yellow('  A default configuration will be created'));
    } else if (error) {
      results.voice.status = 'error';
      results.voice.message = `Database error: ${error.message}`;
      spinner.fail(chalk.red('Failed to check voice configuration'));
    } else if (data) {
      results.voice.status = 'success';
      results.voice.message = `Active config: ${data.name}`;
      spinner.succeed(chalk.green('Voice configuration found'));
      console.log(chalk.gray(`  Name: ${data.name}`));
      console.log(chalk.gray(`  Model: ${data.model}`));
      console.log(chalk.gray(`  Voice: ${data.voice}`));
    }
  } catch (error) {
    results.voice.status = 'error';
    results.voice.message = error.message;
    spinner.fail(chalk.red('Voice configuration check failed'));
  }
}

function printSummary() {
  console.log(chalk.bold.cyan('\n📊 Test Summary\n'));
  
  const getStatusSymbol = (status) => {
    switch(status) {
      case 'success': return chalk.green('✓');
      case 'warning': return chalk.yellow('⚠');
      case 'error': return chalk.red('✗');
      default: return chalk.gray('○');
    }
  };
  
  console.log(`${getStatusSymbol(results.supabase.status)} Supabase: ${results.supabase.message}`);
  console.log(`${getStatusSymbol(results.tables.status)} Database: ${results.tables.message}`);
  console.log(`${getStatusSymbol(results.openai.status)} OpenAI: ${results.openai.message}`);
  console.log(`${getStatusSymbol(results.voice.status)} Voice: ${results.voice.message}`);
  
  // Overall status
  const hasErrors = Object.values(results).some(r => r.status === 'error');
  const hasWarnings = Object.values(results).some(r => r.status === 'warning');
  
  console.log(chalk.bold.cyan('\n🎯 Overall Status\n'));
  
  if (hasErrors) {
    console.log(chalk.red('❌ Configuration has errors that need to be fixed'));
    console.log(chalk.yellow('\nNext Steps:'));
    
    if (results.tables.status === 'error') {
      console.log(chalk.yellow('1. Run the migration SQL in Supabase SQL Editor'));
    }
    if (results.openai.status === 'error') {
      console.log(chalk.yellow('2. Add your OpenAI API key to .env file'));
    }
    console.log(chalk.yellow('3. Restart your application'));
  } else if (hasWarnings) {
    console.log(chalk.yellow('⚠️  Configuration is mostly ready with some warnings'));
  } else {
    console.log(chalk.green('✅ All systems are operational!'));
    console.log(chalk.gray('\nYour AI voice agent is ready to use.'));
  }
}

async function runTests() {
  console.log(chalk.gray('Starting tests...\n'));
  
  await testSupabaseConnection();
  await testDatabaseTables();
  await testOpenAIConnection();
  await testVoiceConfiguration();
  
  printSummary();
  
  // Export results
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    results,
    environment: {
      supabaseUrl: SUPABASE_URL,
      hasOpenAIKey: !!OPENAI_API_KEY && !OPENAI_API_KEY.includes('YOUR_API_KEY')
    }
  };
  
  console.log(chalk.gray('\n💾 Full report saved to: ai-test-results.json\n'));
  
  const fs = await import('fs');
  fs.writeFileSync('ai-test-results.json', JSON.stringify(report, null, 2));
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('Test script failed:'), error);
  process.exit(1);
});