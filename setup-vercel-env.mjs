#!/usr/bin/env node

/**
 * Vercel Environment Setup Script
 * Helps configure environment variables for Vercel deployment
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';

const REQUIRED_VARS = [
  'VITE_OPENAI_API_KEY',
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY'
];

const OPTIONAL_VARS = [
  'VITE_OPENAI_ORGANIZATION_ID',
  'VITE_OPENAI_MODEL',
  'VITE_ENABLE_VOICE_CHAT',
  'VITE_ENABLE_AI_ASSESSMENT',
  'VITE_ENABLE_COMMUNITY',
  'VITE_APP_NAME',
  'VITE_APP_VERSION'
];

async function main() {
  console.log(chalk.blue.bold('\n🚀 Vercel Environment Setup\n'));

  try {
    // Check if .env.local exists
    let envVars = {};
    if (existsSync('.env.local')) {
      console.log(chalk.green('✅ Found .env.local file'));
      const envContent = readFileSync('.env.local', 'utf-8');
      envVars = parseEnvFile(envContent);
    } else if (existsSync('.env')) {
      console.log(chalk.green('✅ Found .env file'));
      const envContent = readFileSync('.env', 'utf-8');
      envVars = parseEnvFile(envContent);
    } else {
      console.log(chalk.yellow('⚠️  No .env file found'));
      console.log('Create .env.local with your environment variables');
      console.log('Use .env.example as a template\n');
    }

    // Check current Vercel environment
    console.log(chalk.blue('\n📋 Checking current Vercel environment...\n'));
    
    try {
      const vercelEnv = execSync('vercel env ls', { encoding: 'utf-8' });
      console.log('Current Vercel environment variables:');
      console.log(vercelEnv);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not fetch Vercel environment (vercel CLI not installed or not logged in)'));
      console.log('Install Vercel CLI: npm i -g vercel');
      console.log('Login: vercel login\n');
    }

    // Validate required variables
    console.log(chalk.blue('🔍 Validating configuration...\n'));
    
    const missingRequired = [];
    const configuredVars = [];
    
    REQUIRED_VARS.forEach(varName => {
      const value = envVars[varName] || process.env[varName];
      if (!value || value === 'your-openai-api-key-here') {
        missingRequired.push(varName);
        console.log(chalk.red(`❌ ${varName}: Missing or placeholder`));
      } else {
        configuredVars.push(varName);
        console.log(chalk.green(`✅ ${varName}: Configured`));
      }
    });

    OPTIONAL_VARS.forEach(varName => {
      const value = envVars[varName] || process.env[varName];
      if (value) {
        console.log(chalk.cyan(`ℹ️  ${varName}: ${value}`));
      } else {
        console.log(chalk.gray(`⚪ ${varName}: Not set (optional)`));
      }
    });

    // Show setup commands
    if (missingRequired.length > 0) {
      console.log(chalk.yellow('\n⚠️  Missing required environment variables:'));
      missingRequired.forEach(varName => {
        console.log(chalk.yellow(`   • ${varName}`));
      });
      
      console.log(chalk.blue('\n📝 Setup commands for Vercel:'));
      console.log(chalk.gray('Run these commands to set up your environment:\n'));
      
      if (missingRequired.includes('VITE_OPENAI_API_KEY')) {
        console.log(chalk.cyan('# Set OpenAI API Key'));
        console.log('vercel env add VITE_OPENAI_API_KEY');
        console.log('# Enter your sk-... key when prompted\n');
      }
      
      if (missingRequired.includes('VITE_SUPABASE_URL')) {
        console.log(chalk.cyan('# Set Supabase URL'));
        console.log('vercel env add VITE_SUPABASE_URL');
        console.log('# Enter your https://...supabase.co URL\n');
      }
      
      if (missingRequired.includes('VITE_SUPABASE_ANON_KEY')) {
        console.log(chalk.cyan('# Set Supabase Anonymous Key'));
        console.log('vercel env add VITE_SUPABASE_ANON_KEY');
        console.log('# Enter your Supabase anon key\n');
      }
      
      console.log(chalk.cyan('# Redeploy after setting variables'));
      console.log('vercel --prod\n');
    } else {
      console.log(chalk.green('\n🎉 All required environment variables are configured!'));
      console.log(chalk.blue('Ready for deployment to Vercel\n'));
    }

    // Show helpful links
    console.log(chalk.blue('🔗 Helpful Links:'));
    console.log(chalk.cyan('   • Vercel Dashboard: https://vercel.com/dashboard'));
    console.log(chalk.cyan('   • OpenAI API Keys: https://platform.openai.com/api-keys'));
    console.log(chalk.cyan('   • Supabase Dashboard: https://supabase.com/dashboard'));
    console.log(chalk.cyan('   • Configuration Page: /configuration (after deployment)\n'));

    // Show current status
    console.log(chalk.blue('📊 Current Status:'));
    console.log(chalk.green(`   ✅ ${configuredVars.length} required variables configured`));
    console.log(chalk.yellow(`   ⚠️  ${missingRequired.length} required variables missing`));
    console.log(chalk.gray(`   ℹ️  ${OPTIONAL_VARS.filter(v => envVars[v] || process.env[v]).length} optional variables set\n`));

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    process.exit(1);
  }
}

function parseEnvFile(content) {
  const vars = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  
  return vars;
}

// Run the setup
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});