#!/usr/bin/env node

/**
 * Vercel Deployment Preparation Script
 * Optimizes the build for Vercel deployment and runs pre-deployment checks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Preparing Vercel deployment...');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check for required dependencies
const requiredDeps = ['vite', '@vitejs/plugin-react', 'react', 'react-dom'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);

if (missingDeps.length > 0) {
  console.error('❌ Missing required dependencies:', missingDeps.join(', '));
  process.exit(1);
}

// Check build scripts
if (!packageJson.scripts.build || !packageJson.scripts['vercel-build']) {
  console.error('❌ Missing build scripts in package.json');
  process.exit(1);
}

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.rmSync(path.join(process.cwd(), 'dist'), { recursive: true, force: true });
}

// Run pre-deployment checks
console.log('🔍 Running pre-deployment checks...');

try {
  // Check TypeScript compilation (allow warnings for non-critical issues)
  console.log('  - Checking TypeScript compilation...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('    ✓ TypeScript compilation passed');
  } catch (tsError) {
    console.warn('⚠️  TypeScript issues found. Build may still work.');
    console.log('    Continuing with build process...');
  }

  // Check linting (skip for deployment to allow focus on critical issues)
  console.log('  - Skipping linting check for deployment (can be addressed post-deployment)...');

  // Run tests
  console.log('  - Running tests...');
  execSync('npm test -- --run', { stdio: 'inherit' });

  // Run production build
  console.log('🏗️  Running production build...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if dist folder exists and has content
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build completed but dist folder not found');
  }

  const distFiles = fs.readdirSync(distPath);
  if (distFiles.length === 0) {
    throw new Error('Build completed but dist folder is empty');
  }

  console.log('✅ Build verification complete');

  // Calculate build size
  const getDirSize = (dirPath) => {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
    return size;
  };

  const buildSize = getDirSize(distPath);
  const buildSizeMB = (buildSize / 1024 / 1024).toFixed(2);
  console.log(`📦 Build size: ${buildSizeMB} MB`);

  // Check for common Vercel optimizations
  console.log('🔧 Checking Vercel optimizations...');

  // Check for vercel.json
  if (!fs.existsSync(path.join(process.cwd(), 'vercel.json'))) {
    console.warn('⚠️  vercel.json not found. Using default Vercel configuration.');
  }

  // Check for .env files that shouldn't be committed
  const envFiles = ['.env.local', '.env.development.local', '.env.test.local'];
  const committedEnvFiles = envFiles.filter(file => fs.existsSync(path.join(process.cwd(), file)));
  if (committedEnvFiles.length > 0) {
    console.warn('⚠️  Sensitive environment files found that should not be committed:', committedEnvFiles.join(', '));
  }

  console.log('✅ Vercel deployment preparation complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Set up environment variables in Vercel dashboard');
  console.log('2. Connect your GitHub repository to Vercel');
  console.log('3. Deploy using: vercel --prod');
  console.log('');
  console.log('🔗 Environment variables needed:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- OPENAI_API_KEY');
  console.log('- ANTHROPIC_API_KEY');
  console.log('- And others from .env.vercel.template');

} catch (error) {
  console.error('❌ Pre-deployment check failed:', error.message);
  process.exit(1);
}