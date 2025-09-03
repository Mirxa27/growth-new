#!/usr/bin/env node

/**
 * Pre-deployment checks and fixes
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Running pre-deployment checks...\n'));

let hasErrors = false;
let hasWarnings = false;

// Check 1: Environment variables
console.log(chalk.yellow('1. Checking environment variables...'));
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const envFile = '.env';
if (!fs.existsSync(envFile)) {
  console.log(chalk.red('   ❌ .env file not found'));
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  requiredEnvVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      console.log(chalk.red(`   ❌ Missing required env var: ${varName}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`   ✅ ${varName} is set`));
    }
  });
}

// Check 2: Dependencies
console.log(chalk.yellow('\n2. Checking dependencies...'));
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const requiredDeps = ['react', 'react-dom', '@supabase/supabase-js', 'openai'];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      console.log(chalk.red(`   ❌ Missing dependency: ${dep}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`   ✅ ${dep} is installed`));
    }
  });
} catch (error) {
  console.log(chalk.red('   ❌ Failed to read package.json'));
  hasErrors = true;
}

// Check 3: TypeScript errors
console.log(chalk.yellow('\n3. Checking for TypeScript errors...'));
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log(chalk.green('   ✅ No TypeScript errors'));
} catch (error) {
  console.log(chalk.yellow('   ⚠️  TypeScript errors detected (non-blocking)'));
  hasWarnings = true;
}

// Check 4: Required files
console.log(chalk.yellow('\n4. Checking required files...'));
const requiredFiles = [
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'tsconfig.json'
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(chalk.red(`   ❌ Missing required file: ${file}`));
    hasErrors = true;
  } else {
    console.log(chalk.green(`   ✅ ${file} exists`));
  }
});

// Check 5: Build output
console.log(chalk.yellow('\n5. Checking build configuration...'));
const viteConfig = fs.readFileSync('vite.config.ts', 'utf-8');
if (!viteConfig.includes('build:')) {
  console.log(chalk.yellow('   ⚠️  Build configuration might need review'));
  hasWarnings = true;
} else {
  console.log(chalk.green('   ✅ Build configuration found'));
}

// Check 6: Security
console.log(chalk.yellow('\n6. Security checks...'));
const suspiciousPatterns = [
  /VITE_.*_SECRET/,
  /VITE_.*_PRIVATE/,
  /password\s*=\s*["'][^"']+["']/i
];

const checkFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(chalk.red(`   ❌ Potential security issue in ${filePath}`));
        hasErrors = true;
      }
    });
  }
};

checkFile('.env');
checkFile('.env.production');

if (!hasErrors && !fs.existsSync('.env').toString().includes('SECRET')) {
  console.log(chalk.green('   ✅ No obvious security issues found'));
}

// Summary
console.log(chalk.blue('\n📊 Summary:'));
if (hasErrors) {
  console.log(chalk.red(`   ❌ ${hasErrors ? 'Errors found - deployment may fail' : ''}`));
  process.exit(1);
} else if (hasWarnings) {
  console.log(chalk.yellow('   ⚠️  Warnings found - review recommended'));
} else {
  console.log(chalk.green('   ✅ All checks passed!'));
}

// Offer fixes
if (hasErrors || hasWarnings) {
  console.log(chalk.blue('\n🔧 Suggested fixes:'));
  console.log('   1. Copy .env.example to .env and fill in values');
  console.log('   2. Run: npm install');
  console.log('   3. Fix TypeScript errors: npx tsc --noEmit');
  console.log('   4. Review security warnings');
}

console.log(chalk.blue('\n✨ Pre-deployment check complete!\n'));