#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = __dirname;

console.log('🚀 Starting Vercel deployment process...');

// Step 1: Clean and prepare
console.log('🧹 Cleaning previous builds...');
try {
  execSync('npm run clean', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.log('Clean command not found or failed, continuing...');
}

// Step 2: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Fix TailwindCSS issues
console.log('🎨 Fixing TailwindCSS classes...');
try {
  // Replace problematic gradient classes with standard ones
  const filesToFix = [
    'src/pages/AdminDashboard.tsx',
    'src/components/admin/AdminDashboard.tsx',
    'src/styles/admin-responsive.css'
  ];

  filesToFix.forEach(file => {
    try {
      const filePath = join(rootDir, file);
      let content = readFileSync(filePath, 'utf8');
      
      // Replace gradient classes
      content = content.replace(
        /bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100/g,
        'bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10'
      );
      content = content.replace(
        /from-primary\/\d+/g,
        'from-purple-500/10'
      );
      content = content.replace(
        /via-secondary\/\d+/g,
        'via-blue-500/10'
      );
      content = content.replace(
        /to-accent\/\d+/g,
        'to-pink-500/10'
      );
      
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    } catch (err) {
      console.log(`⚠️  Could not fix ${file}: ${err.message}`);
    }
  });
} catch (error) {
  console.error('⚠️  TailwindCSS fix failed:', error.message);
}

// Step 4: Build the project
console.log('🔨 Building project...');
try {
  execSync('NODE_ENV=production npm run build:vercel', { 
    stdio: 'inherit', 
    cwd: rootDir,
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 5: Verify build output
console.log('🔍 Verifying build output...');
try {
  const indexHtml = readFileSync(join(rootDir, 'dist/index.html'), 'utf8');
  if (indexHtml.includes('<div id="root">')) {
    console.log('✅ Build verification passed!');
  } else {
    throw new Error('index.html does not contain root div');
  }
} catch (error) {
  console.error('❌ Build verification failed:', error.message);
  process.exit(1);
}

// Step 6: Deploy to Vercel (if vercel CLI is available)
console.log('🚀 Attempting Vercel deployment...');
try {
  execSync('vercel --prod --yes', { stdio: 'inherit', cwd: rootDir });
  console.log('🎉 Deployment completed successfully!');
} catch (error) {
  console.log('⚠️  Vercel CLI not available or deployment failed.');
  console.log('📋 Manual deployment steps:');
  console.log('1. Install Vercel CLI: npm i -g vercel');
  console.log('2. Run: vercel --prod');
  console.log('3. Or deploy via Vercel dashboard');
}

console.log('\n🎉 Deployment process completed!');
console.log('📂 Build files are ready in ./dist directory');
console.log('🔗 Your app is ready for production!');