#!/usr/bin/env node

/**
 * Deployment Readiness Checker
 * Verifies if the project is ready for deployment
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Checking deployment readiness...\n');

// Check critical files
const criticalFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/App.tsx',
  'src/main.tsx',
  'index.html',
  '.env'
];

console.log('📁 Checking critical files:');
let allFilesExist = true;

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Missing critical files. Cannot deploy.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔐 Checking environment variables:');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';

let allEnvVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const hasVar = envContent.includes(varName + '=') && !envContent.includes(varName + '=your-');
  console.log(`${hasVar ? '✅' : '⚠️ '} ${varName}`);
  if (!hasVar) allEnvVarsPresent = false;
});

// Check package.json structure
console.log('\n📦 Checking package.json:');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  console.log(`✅ Name: ${pkg.name}`);
  console.log(`✅ Version: ${pkg.version}`);
  console.log(`${pkg.scripts.build ? '✅' : '❌'} Build script`);
  console.log(`${pkg.scripts['build:vercel'] ? '✅' : '❌'} Vercel build script`);
  console.log(`${pkg.dependencies.react ? '✅' : '❌'} React dependency`);
  console.log(`${pkg.dependencies.vite ? '❌' : '✅'} Vite (should be in devDependencies)`);
  console.log(`${pkg.devDependencies.vite ? '✅' : '❌'} Vite in devDependencies`);
  
} catch (error) {
  console.log('❌ Invalid package.json');
  process.exit(1);
}

// Summary
console.log('\n📊 Deployment Summary:');

if (allFilesExist && allEnvVarsPresent) {
  console.log('🎉 Project appears ready for deployment!');
  console.log('\n🚀 Next steps:');
  console.log('1. Set up Vercel project: vercel');
  console.log('2. Configure environment variables in Vercel dashboard');
  console.log('3. Deploy: vercel --prod');
  process.exit(0);
} else {
  console.log('⚠️  Project needs configuration before deployment:');
  
  if (!allFilesExist) {
    console.log('- Fix missing critical files');
  }
  
  if (!allEnvVarsPresent) {
    console.log('- Configure environment variables in .env');
    console.log('- Add environment variables to Vercel project');
  }
  
  console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions');
  process.exit(1);
}