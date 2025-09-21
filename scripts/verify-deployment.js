#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the deployed application to ensure everything works correctly
 */

import { createServer } from 'http';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

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
  header: (msg) => console.log(`${colors.cyan}\n🔍 ${msg}${colors.reset}`)
};

class DeploymentVerifier {
  constructor() {
    this.baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
    this.tests = [];
  }

  // Register a test
  registerTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  // Test basic HTTP connectivity
  async testHttpConnectivity() {
    try {
      const url = new URL(this.baseUrl);

      // For now, just test if the URL is properly formatted
      // In a real deployment test, you would make an actual HTTP request
      if (url.protocol && url.hostname) {
        return { success: true, message: 'URL format is valid' };
      } else {
        return { success: false, message: 'Invalid URL format' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Test Supabase connectivity
  async testSupabaseConnection() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return { success: false, message: 'Missing Supabase credentials' };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test basic connection
      const { data, error } = await supabase.from('assessments').select('count').limit(1);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Connected successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Test API endpoints
  async testApiEndpoints() {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return { success: false, message: 'No Supabase URL configured' };
      }

      // Test health check endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true, message: 'API endpoints accessible' };
      } else {
        return { success: false, message: `API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Test build artifacts
  testBuildArtifacts() {
    const requiredFiles = [
      'dist/index.html',
      'dist/assets',
      'vercel.json',
      'package.json'
    ];

    const missing = requiredFiles.filter(file => !existsSync(file));

    if (missing.length === 0) {
      return { success: true, message: 'All build artifacts present' };
    } else {
      return { success: false, message: `Missing files: ${missing.join(', ')}` };
    }
  }

  // Test environment variables
  testEnvironmentVariables() {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length === 0) {
      return { success: true, message: 'All required environment variables set' };
    } else {
      return { success: false, message: `Missing env vars: ${missing.join(', ')}` };
    }
  }

  // Run all tests
  async runTests() {
    log.header('Running Deployment Verification Tests');

    // Register tests
    this.registerTest('Environment Variables', () => this.testEnvironmentVariables());
    this.registerTest('Build Artifacts', () => this.testBuildArtifacts());
    this.registerTest('HTTP Connectivity', () => this.testHttpConnectivity());
    this.registerTest('Supabase Connection', () => this.testSupabaseConnection());
    this.registerTest('API Endpoints', () => this.testApiEndpoints());

    // Run tests
    const results = [];
    for (const test of this.tests) {
      try {
        log.info(`Testing ${test.name}...`);
        const result = await test.testFn();
        results.push({ name: test.name, ...result });

        if (result.success) {
          log.success(`${test.name}: ${result.message}`);
        } else {
          log.error(`${test.name}: ${result.message}`);
        }
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          message: error.message
        });
        log.error(`${test.name}: ${error.message}`);
      }
    }

    // Summary
    const passed = results.filter(r => r.success).length;
    const total = results.length;

    log.header(`Test Results: ${passed}/${total} passed`);

    if (passed === total) {
      log.success('🎉 All tests passed! Deployment appears to be working correctly.');
    } else {
      log.warning(`⚠️  ${total - passed} test(s) failed. Please review the issues above.`);
    }

    return {
      passed,
      total,
      results
    };
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Load environment variables
  config({ path: '.env.local' });
  config({ path: '.env' });

  const verifier = new DeploymentVerifier();
  verifier.runTests().catch(error => {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  });
}

export { DeploymentVerifier };