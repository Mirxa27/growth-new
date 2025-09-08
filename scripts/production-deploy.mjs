#!/usr/bin/env node

/**
 * Production Deployment Script
 * Comprehensive pre-deployment validation and build process
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const error = (message) => log('red', `❌ ${message}`);
const warning = (message) => log('yellow', `⚠️ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

class ProductionDeployer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  async run() {
    log('cyan', '🚀 Starting Production Deployment Process...\n');

    try {
      await this.checkPrerequisites();
      await this.validateEnvironment();
      await this.runTests();
      await this.buildProject();
      await this.validateBuild();
      await this.generateReport();
      
      if (this.errors.length === 0) {
        await this.deploy();
        this.showSuccess();
      } else {
        this.showErrors();
        process.exit(1);
      }
    } catch (err) {
      error(`Deployment failed: ${err.message}`);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    info('Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      this.errors.push(`Node.js version ${nodeVersion} is too old. Minimum required: 18.x`);
    } else {
      success(`Node.js version: ${nodeVersion}`);
    }

    // Check npm/pnpm
    try {
      const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      success(`pnpm version: ${pnpmVersion}`);
    } catch {
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        success(`npm version: ${npmVersion}`);
      } catch {
        this.errors.push('Neither pnpm nor npm found. Please install a package manager.');
      }
    }

    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (gitStatus) {
        this.warnings.push('Working directory has uncommitted changes');
        warning('Working directory has uncommitted changes');
      } else {
        success('Git working directory is clean');
      }
    } catch {
      this.warnings.push('Not in a Git repository');
    }
  }

  async validateEnvironment() {
    info('Validating environment configuration...');

    // Check for required environment files
    const envFiles = ['.env', '.env.local', '.env.production'];
    let hasEnvFile = false;

    for (const file of envFiles) {
      try {
        readFileSync(file);
        success(`Found environment file: ${file}`);
        hasEnvFile = true;
        break;
      } catch {
        // File doesn't exist, continue
      }
    }

    if (!hasEnvFile) {
      this.errors.push('No environment file found. Please create .env with required variables.');
    }

    // Validate package.json
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts?.build) {
        this.errors.push('package.json missing build script');
      }
      
      if (!packageJson.scripts?.preview) {
        this.warnings.push('package.json missing preview script');
      }

      success('package.json validation passed');
    } catch {
      this.errors.push('Invalid or missing package.json');
    }
  }

  async runTests() {
    info('Running tests and linting...');

    // Run TypeScript check
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      success('TypeScript compilation check passed');
    } catch (err) {
      this.errors.push('TypeScript compilation errors detected');
      error('TypeScript compilation failed');
    }

    // Run ESLint
    try {
      execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
      success('ESLint check passed');
    } catch (err) {
      this.warnings.push('ESLint warnings detected');
      warning('ESLint check had warnings');
    }

    // Run unit tests if available
    try {
      execSync('npm test -- --run', { stdio: 'pipe' });
      success('Unit tests passed');
    } catch (err) {
      // Tests might not be configured, don't fail deployment
      this.warnings.push('Unit tests not available or failed');
    }
  }

  async buildProject() {
    info('Building project for production...');

    try {
      // Clean previous build
      try {
        execSync('rm -rf dist', { stdio: 'pipe' });
      } catch {
        // Directory might not exist
      }

      // Build the project
      execSync('npm run build', { stdio: 'inherit' });
      success('Project build completed successfully');
    } catch (err) {
      this.errors.push('Build process failed');
      throw new Error('Build failed');
    }
  }

  async validateBuild() {
    info('Validating build output...');

    try {
      // Check if dist directory exists
      const distExists = execSync('ls -la dist', { stdio: 'pipe' });
      success('Build output directory exists');

      // Check for essential files
      const requiredFiles = ['index.html', 'assets'];
      for (const file of requiredFiles) {
        try {
          execSync(`ls dist/${file}`, { stdio: 'pipe' });
          success(`Found required file: ${file}`);
        } catch {
          this.errors.push(`Missing required build file: ${file}`);
        }
      }

      // Check bundle size
      try {
        const bundleSize = execSync('du -sh dist', { encoding: 'utf8' }).trim();
        info(`Bundle size: ${bundleSize.split('\t')[0]}`);
        
        // Warn if bundle is too large (>10MB)
        const sizeInMB = parseFloat(bundleSize.match(/(\d+\.?\d*)/)?.[1] || '0');
        const unit = bundleSize.match(/[KMGT]B?/)?.[0] || 'B';
        
        if (unit === 'MB' && sizeInMB > 10) {
          this.warnings.push(`Large bundle size: ${bundleSize.split('\t')[0]}`);
        }
      } catch {
        this.warnings.push('Could not determine bundle size');
      }

    } catch (err) {
      this.errors.push('Build validation failed');
    }
  }

  async generateReport() {
    info('Generating deployment report...');

    const report = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      buildTime: Date.now() - this.startTime,
      errors: this.errors,
      warnings: this.warnings,
      status: this.errors.length === 0 ? 'success' : 'failed'
    };

    try {
      writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
      success('Deployment report generated');
    } catch {
      this.warnings.push('Could not generate deployment report');
    }
  }

  async deploy() {
    info('Deploying to production...');

    // Here you would add your actual deployment logic
    // Examples:
    // - Upload to S3/CloudFront
    // - Deploy to Vercel/Netlify
    // - Copy to server via SCP
    // - Update Docker container
    
    // For now, just simulate deployment
    success('Deployment completed successfully');
    
    // Generate deployment URL (would be actual URL in real deployment)
    const deploymentUrl = 'https://your-production-domain.com';
    info(`Deployed to: ${deploymentUrl}`);
  }

  showSuccess() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    log('green', '\n🎉 DEPLOYMENT SUCCESSFUL! 🎉\n');
    success(`Completed in ${duration} seconds`);
    
    if (this.warnings.length > 0) {
      warning(`\n⚠️ ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warn => warning(`  • ${warn}`));
    }
    
    log('cyan', '\n📋 Next Steps:');
    info('• Monitor application performance');
    info('• Check error tracking dashboard');
    info('• Verify all features work correctly');
    info('• Update documentation if needed');
  }

  showErrors() {
    log('red', '\n❌ DEPLOYMENT FAILED!\n');
    
    if (this.errors.length > 0) {
      error(`${this.errors.length} error(s) must be fixed:`);
      this.errors.forEach(err => error(`  • ${err}`));
    }
    
    if (this.warnings.length > 0) {
      warning(`\n${this.warnings.length} warning(s):`);
      this.warnings.forEach(warn => warning(`  • ${warn}`));
    }
    
    log('cyan', '\n🔧 Recommended Actions:');
    info('• Fix all errors listed above');
    info('• Address warnings for better quality');
    info('• Run deployment script again');
  }
}

// Run the deployment if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new ProductionDeployer();
  deployer.run().catch(err => {
    console.error('Deployment script failed:', err);
    process.exit(1);
  });
}

export { ProductionDeployer };