#!/usr/bin/env node

/**
 * Vercel Environment Setup Script
 * Configures environment variables for Vercel deployment
 */

import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}\n🔧 ${msg}${colors.reset}`)
};

class VercelEnvSetup {
  constructor() {
    this.requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    this.optionalVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_AI_API_KEY',
      'VITE_APP_URL',
      'VITE_ENVIRONMENT'
    ];
    
    this.envVars = {};
  }

  // Load environment variables from files
  loadEnvironmentVariables() {
    log.header('Loading Environment Variables');
    
    // Load from .env.local first
    if (existsSync('.env.local')) {
      config({ path: '.env.local' });
      log.success('Loaded .env.local');
    }
    
    // Load from .env as fallback
    if (existsSync('.env')) {
      config({ path: '.env' });
      log.success('Loaded .env');
    }
    
    // Store all environment variables
    this.envVars = { ...process.env };
  }

  // Validate required environment variables
  validateEnvironment() {
    log.header('Validating Environment Variables');
    
    const missingRequired = [];
    const missingOptional = [];
    
    // Check required variables
    this.requiredVars.forEach(varName => {
      if (this.envVars[varName]) {
        log.success(`${varName} is set`);
      } else {
        missingRequired.push(varName);
        log.error(`${varName} is missing (required)`);
      }
    });
    
    // Check optional variables
    this.optionalVars.forEach(varName => {
      if (this.envVars[varName]) {
        log.success(`${varName} is set`);
      } else {
        missingOptional.push(varName);
        log.warning(`${varName} is not set (optional)`);
      }
    });
    
    if (missingRequired.length > 0) {
      log.error(`Missing ${missingRequired.length} required environment variables`);
      log.error('Please set these variables in your .env.local file or Vercel dashboard');
      return false;
    }
    
    if (missingOptional.length > 0) {
      log.warning(`${missingOptional.length} optional variables not set`);
      log.warning('Some features may not work without these variables');
    }
    
    return true;
  }

  // Check if Vercel CLI is available
  checkVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      log.success('Vercel CLI is installed');
      return true;
    } catch (error) {
      log.error('Vercel CLI is not installed');
      log.info('Install with: npm install -g vercel');
      return false;
    }
  }

  // Set environment variables in Vercel
  async setVercelEnvironmentVariables() {
    log.header('Setting Vercel Environment Variables');
    
    if (!this.checkVercelCLI()) {
      return false;
    }

    const allVars = [...this.requiredVars, ...this.optionalVars];
    let setCount = 0;
    
    for (const varName of allVars) {
      const value = this.envVars[varName];
      
      if (value) {
        try {
          // Check if variable already exists
          try {
            const existingValue = execSync(`vercel env ls production`, { encoding: 'utf8' });
            if (existingValue.includes(varName)) {
              log.info(`${varName} already exists in Vercel`);
              continue;
            }
          } catch (error) {
            // Variable doesn't exist, continue to set it
          }
          
          // Set the environment variable
          execSync(`echo "${value}" | vercel env add ${varName} production`, { stdio: 'pipe' });
          log.success(`Set ${varName} in Vercel`);
          setCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          log.warning(`Failed to set ${varName}: ${error.message}`);
        }
      }
    }
    
    log.success(`Successfully set ${setCount} environment variables in Vercel`);
    return true;
  }

  // Generate deployment configuration
  generateDeploymentConfig() {
    log.header('Generating Deployment Configuration');
    
    const config = {
      buildTime: new Date().toISOString(),
      environment: 'production',
      requiredVars: this.requiredVars,
      setVars: this.requiredVars.filter(varName => this.envVars[varName]),
      optionalVars: this.optionalVars.filter(varName => this.envVars[varName]),
      vercelProject: this.envVars.VERCEL_PROJECT_ID || 'unknown',
      deploymentReady: this.requiredVars.every(varName => this.envVars[varName])
    };
    
    console.log('\n📊 Deployment Configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    return config;
  }

  // Main setup process
  async setup() {
    log.info('🚀 Setting up Vercel environment for Newomen Platform...\n');
    
    try {
      // Load environment variables
      this.loadEnvironmentVariables();
      
      // Validate environment
      const isValid = this.validateEnvironment();
      
      if (!isValid) {
        log.error('Environment validation failed');
        process.exit(1);
      }
      
      // Set Vercel environment variables
      await this.setVercelEnvironmentVariables();
      
      // Generate deployment configuration
      const config = this.generateDeploymentConfig();
      
      if (config.deploymentReady) {
        log.success('\n🎉 Vercel environment setup completed successfully!');
        log.info('You can now run: npm run deploy:vercel');
      } else {
        log.warning('\n⚠️ Setup completed with warnings');
        log.warning('Some required variables are missing');
      }
      
    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run setup if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new VercelEnvSetup();
  setup.setup().catch(error => {
    console.error('Setup process failed:', error);
    process.exit(1);
  });
}

export { VercelEnvSetup };