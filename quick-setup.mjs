#!/usr/bin/env node

/**
 * Quick Setup Script for Development
 * Installs minimal dependencies and prepares environment
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Setting up Growth New development environment...\n');

try {
  // Check if we have basic files
  if (!existsSync('package.json')) {
    throw new Error('package.json not found');
  }

  // Create basic .env.local if it doesn't exist
  if (!existsSync('.env.local')) {
    console.log('📝 Creating .env.local...');
    
    const envTemplate = readFileSync('.env', 'utf-8');
    writeFileSync('.env.local', envTemplate);
    
    console.log('✅ Created .env.local\n');
  }

  // Install minimal dependencies
  console.log('📦 Installing essential dependencies...');
  
  // Try different npm approaches
  const installCommands = [
    'npm install --no-optional --no-audit --no-fund --legacy-peer-deps',
    'npm install --force --no-optional',
    'npm install --legacy-peer-deps'
  ];

  let installSuccess = false;
  
  for (const cmd of installCommands) {
    try {
      console.log(`Trying: ${cmd}`);
      execSync(cmd, { stdio: 'inherit', timeout: 120000 });
      installSuccess = true;
      break;
    } catch (error) {
      console.log(`Failed with: ${cmd}`);
      continue;
    }
  }

  if (!installSuccess) {
    throw new Error('Failed to install dependencies with all methods');
  }

  console.log('✅ Dependencies installed successfully\n');

  // Try to run type check
  console.log('🔍 Running type check...');
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit', timeout: 60000 });
    console.log('✅ Type check passed\n');
  } catch (error) {
    console.log('⚠️  Type check failed, continuing anyway\n');
  }

  // Try to build
  console.log('🏗️  Testing build...');
  
  try {
    execSync('npm run build', { stdio: 'inherit', timeout: 120000 });
    console.log('✅ Build successful!\n');
  } catch (error) {
    console.log('⚠️  Build failed, will need manual fixes\n');
  }

  console.log('🎉 Setup complete! Next steps:');
  console.log('1. Configure your environment variables in .env.local');
  console.log('2. Set up your Supabase database');
  console.log('3. Add your OpenAI API key');
  console.log('4. Run: npm run dev\n');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\nTry manual installation:');
  console.log('1. npm install --legacy-peer-deps');
  console.log('2. npm run dev');
  process.exit(1);
}