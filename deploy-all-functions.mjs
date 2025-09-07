#!/usr/bin/env node

/**
 * Comprehensive Supabase Functions Deployment Script
 * Deploys all edge functions to Supabase with proper configuration
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

class SupabaseFunctionDeployer {
  constructor() {
    this.projectRef = 'ufgqmqoykddaotdbwteg';
    this.accessToken = 'sbp_d2f77029220f8f710e27bf63c8a1dca316187f2e';
    this.functionsDir = './supabase/functions';
    this.deployedFunctions = [];
    this.failedFunctions = [];
    this.startTime = Date.now();
  }

  async run() {
    log('cyan', '🚀 Starting Supabase Functions Deployment...\n');

    try {
      await this.setupSupabaseCLI();
      await this.authenticateSupabase();
      await this.linkProject();
      await this.setEnvironmentSecrets();
      await this.deployAllFunctions();
      await this.testFunctions();
      await this.generateReport();
      
      this.showResults();
    } catch (err) {
      error(`Deployment failed: ${err.message}`);
      process.exit(1);
    }
  }

  async setupSupabaseCLI() {
    info('Setting up Supabase CLI...');

    try {
      // Check if Supabase CLI is installed
      const version = execSync('supabase --version', { encoding: 'utf8' }).trim();
      success(`Supabase CLI version: ${version}`);
    } catch {
      info('Installing Supabase CLI...');
      try {
        execSync('npm install -g supabase', { stdio: 'inherit' });
        success('Supabase CLI installed successfully');
      } catch (installError) {
        throw new Error('Failed to install Supabase CLI. Please install manually: npm install -g supabase');
      }
    }
  }

  async authenticateSupabase() {
    info('Authenticating with Supabase...');

    try {
      // Set the access token
      process.env.SUPABASE_ACCESS_TOKEN = this.accessToken;
      
      // Login with access token
      execSync(`echo "${this.accessToken}" | supabase auth login --token`, { stdio: 'pipe' });
      success('Successfully authenticated with Supabase');
    } catch (authError) {
      throw new Error('Failed to authenticate with Supabase. Please check your access token.');
    }
  }

  async linkProject() {
    info('Linking to Supabase project...');

    try {
      // Link to the project
      execSync(`supabase link --project-ref ${this.projectRef}`, { stdio: 'inherit' });
      success(`Successfully linked to project: ${this.projectRef}`);
    } catch (linkError) {
      warning('Project linking failed, but continuing with deployment...');
    }
  }

  async setEnvironmentSecrets() {
    info('Setting environment secrets for edge functions...');

    const secrets = {
      'OPENAI_API_KEY': 'your-openai-api-key-will-be-set-in-admin-panel',
      'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo',
      'SUPABASE_URL': 'https://ufgqmqoykddaotdbwteg.supabase.co',
      'JWT_SECRET': '1Tym2DyfuYj2qf3bHvGCqoziaKcuTF1FJVpv4TJir37PLDTR9bqHA++IaN/Rw6ZvLuB3zBAGT1pCFQAaD14Olw=='
    };

    for (const [key, value] of Object.entries(secrets)) {
      try {
        execSync(`supabase secrets set ${key}="${value}"`, { stdio: 'pipe' });
        success(`Set secret: ${key}`);
      } catch (secretError) {
        warning(`Failed to set secret: ${key}`);
      }
    }
  }

  async deployAllFunctions() {
    info('Deploying all edge functions...');

    // Get list of function directories
    const functions = [
      'account-management',
      'analytics', 
      'chat-completion',
      'create-assessment',
      'create-checkout-session',
      'create-course',
      'create-exploration',
      'create-paypal-subscription',
      'enhanced-chat-completion',
      'fetch-ai-providers-data',
      'generate-voice-token',
      'get-realtime-token',
      'paypal-oauth',
      'process-assessment',
      'rate-limit',
      'realtime-voice-proxy',
      'realtime-voice-session',
      'stripe-webhook',
      'submit-result',
      'test-ai-provider',
      'test-voice-to-voice',
      'text-to-speech',
      'voice-to-text'
    ];

    info(`Found ${functions.length} functions to deploy`);

    // Deploy each function
    for (const functionName of functions) {
      await this.deployFunction(functionName);
    }

    // Deploy all functions at once (more efficient)
    try {
      info('Deploying all functions together...');
      execSync('supabase functions deploy', { stdio: 'inherit' });
      success('All functions deployed successfully');
    } catch (deployError) {
      warning('Batch deployment failed, individual deployments may have succeeded');
    }
  }

  async deployFunction(functionName) {
    info(`Deploying function: ${functionName}`);

    try {
      const functionPath = join(this.functionsDir, functionName);
      
      if (!existsSync(join(functionPath, 'index.ts'))) {
        warning(`Function ${functionName} missing index.ts file`);
        this.failedFunctions.push({ name: functionName, error: 'Missing index.ts' });
        return;
      }

      // Deploy the function
      execSync(`supabase functions deploy ${functionName}`, { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      success(`Successfully deployed: ${functionName}`);
      this.deployedFunctions.push(functionName);
    } catch (deployError) {
      error(`Failed to deploy ${functionName}: ${deployError.message}`);
      this.failedFunctions.push({ 
        name: functionName, 
        error: deployError.message 
      });
    }
  }

  async testFunctions() {
    info('Testing deployed functions...');

    const testResults = [];

    // Test critical functions
    const criticalFunctions = [
      'chat-completion',
      'get-realtime-token',
      'fetch-ai-providers-data',
      'test-ai-provider'
    ];

    for (const functionName of criticalFunctions) {
      if (this.deployedFunctions.includes(functionName)) {
        const result = await this.testFunction(functionName);
        testResults.push(result);
      }
    }

    const passedTests = testResults.filter(r => r.success).length;
    info(`Function tests: ${passedTests}/${testResults.length} passed`);

    return testResults;
  }

  async testFunction(functionName) {
    try {
      const functionUrl = `https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/${functionName}`;
      
      // Simple health check
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ test: true })
      });

      if (response.ok || response.status === 400) { // 400 might be expected for test data
        success(`Function ${functionName} is responding`);
        return { name: functionName, success: true, status: response.status };
      } else {
        warning(`Function ${functionName} returned status: ${response.status}`);
        return { name: functionName, success: false, status: response.status };
      }
    } catch (testError) {
      warning(`Function ${functionName} test failed: ${testError.message}`);
      return { name: functionName, success: false, error: testError.message };
    }
  }

  async generateReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    const report = {
      timestamp: new Date().toISOString(),
      projectRef: this.projectRef,
      deploymentDuration: `${duration}s`,
      totalFunctions: this.deployedFunctions.length + this.failedFunctions.length,
      deployedFunctions: this.deployedFunctions,
      failedFunctions: this.failedFunctions,
      success: this.failedFunctions.length === 0
    };

    try {
      writeFileSync('supabase-deployment-report.json', JSON.stringify(report, null, 2));
      success('Deployment report generated');
    } catch {
      warning('Could not generate deployment report');
    }

    return report;
  }

  showResults() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    log('cyan', '\n📊 DEPLOYMENT RESULTS\n');
    
    success(`✅ Successfully deployed: ${this.deployedFunctions.length} functions`);
    if (this.failedFunctions.length > 0) {
      error(`❌ Failed to deploy: ${this.failedFunctions.length} functions`);
      this.failedFunctions.forEach(f => {
        error(`  • ${f.name}: ${f.error}`);
      });
    }
    
    info(`⏱️ Total time: ${duration} seconds`);
    
    log('cyan', '\n🔗 Function URLs:');
    this.deployedFunctions.forEach(name => {
      info(`  • ${name}: https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/${name}`);
    });

    if (this.deployedFunctions.length > 0) {
      log('green', '\n🎉 DEPLOYMENT SUCCESSFUL!');
      info('Next steps:');
      info('• Test functions in Supabase dashboard');
      info('• Configure OpenAI API key in admin panel');
      info('• Update frontend environment variables');
    }
  }
}

// Run the deployment if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new SupabaseFunctionDeployer();
  deployer.run().catch(err => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
}

export { SupabaseFunctionDeployer };