#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the deployed application to ensure everything is working
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

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
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.VITE_APP_URL || 'http://localhost:5173';
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    try {
      log.info(`Testing: ${name}`);
      const result = await testFn();
      
      if (result === true) {
        log.success(`✓ ${name}`);
        this.results.passed++;
        this.results.tests.push({ name, status: 'passed' });
      } else if (result === 'warning') {
        log.warning(`⚠ ${name}`);
        this.results.warnings++;
        this.results.tests.push({ name, status: 'warning' });
      } else {
        log.error(`✗ ${name}`);
        this.results.failed++;
        this.results.tests.push({ name, status: 'failed', error: result });
      }
    } catch (error) {
      log.error(`✗ ${name}: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  async testHomepageLoad() {
    const response = await fetch(this.baseUrl);
    
    if (!response.ok) {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
    
    const html = await response.text();
    
    if (!html.includes('<div id="root">')) {
      return 'Missing root element in HTML';
    }
    
    if (!html.includes('Newomen')) {
      return 'Missing app title';
    }
    
    return true;
  }

  async testStaticAssets() {
    const assets = ['/symbol.svg', '/manifest.json'];
    
    for (const asset of assets) {
      const response = await fetch(`${this.baseUrl}${asset}`);
      if (!response.ok) {
        return `Asset ${asset} not found (${response.status})`;
      }
    }
    
    return true;
  }

  async testAPIEndpoint() {
    try {
      // Test Supabase connection
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return 'warning'; // Supabase URL not configured
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
        }
      });
      
      // 401 is expected for root endpoint without proper auth
      if (response.status === 401 || response.status === 404) {
        return true; // API is responding
      }
      
      if (!response.ok) {
        return `API returned ${response.status}`;
      }
      
      return true;
    } catch (error) {
      return `API connection failed: ${error.message}`;
    }
  }

  async testAssessmentsEndpoint() {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return 'warning';
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/assessments?select=id,title&is_public=eq.true&limit=1`, {
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length >= 0) {
          return true;
        }
      }
      
      return `Assessments endpoint returned ${response.status}`;
    } catch (error) {
      return `Assessments endpoint failed: ${error.message}`;
    }
  }

  async testPerformance() {
    const start = Date.now();
    const response = await fetch(this.baseUrl);
    const loadTime = Date.now() - start;
    
    if (!response.ok) {
      return `Page failed to load: ${response.status}`;
    }
    
    if (loadTime > 5000) {
      return `Page load time too slow: ${loadTime}ms`;
    }
    
    if (loadTime > 3000) {
      log.warning(`Page load time: ${loadTime}ms (consider optimization)`);
      return 'warning';
    }
    
    log.success(`Page load time: ${loadTime}ms`);
    return true;
  }

  async testSecurityHeaders() {
    const response = await fetch(this.baseUrl);
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    let missingHeaders = [];
    
    for (const header of securityHeaders) {
      if (!response.headers.get(header)) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      return `Missing security headers: ${missingHeaders.join(', ')}`;
    }
    
    return true;
  }

  async testMobileResponsiveness() {
    // This is a basic test - real mobile testing would require browser automation
    const response = await fetch(this.baseUrl);
    const html = await response.text();
    
    if (!html.includes('viewport')) {
      return 'Missing viewport meta tag';
    }
    
    if (!html.includes('mobile-web-app-capable')) {
      return 'warning'; // Mobile optimization not fully configured
    }
    
    return true;
  }

  async runAllTests() {
    log.header('Deployment Verification for Newomen Platform');
    log.info(`Testing deployment at: ${this.baseUrl}\n`);

    const tests = [
      ['Homepage Load', () => this.testHomepageLoad()],
      ['Static Assets', () => this.testStaticAssets()],
      ['API Connection', () => this.testAPIEndpoint()],
      ['Assessments Endpoint', () => this.testAssessmentsEndpoint()],
      ['Performance', () => this.testPerformance()],
      ['Security Headers', () => this.testSecurityHeaders()],
      ['Mobile Responsiveness', () => this.testMobileResponsiveness()]
    ];

    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn);
    }

    // Summary
    console.log(`\n${colors.cyan}📊 Verification Results${colors.reset}`);
    console.log('========================');
    log.success(`Passed: ${this.results.passed}`);
    if (this.results.warnings > 0) {
      log.warning(`Warnings: ${this.results.warnings}`);
    }
    if (this.results.failed > 0) {
      log.error(`Failed: ${this.results.failed}`);
    }

    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = Math.round((this.results.passed / totalTests) * 100);
    
    console.log(`\nSuccess Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      log.success('\n🎉 Deployment verification passed!');
      if (this.results.warnings > 0) {
        log.warning('Consider addressing the warnings for optimal performance.');
      }
      return true;
    } else {
      log.error('\n❌ Deployment verification failed!');
      log.error('Please fix the failed tests before proceeding.');
      return false;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2];
  const verifier = new DeploymentVerifier(baseUrl);
  
  verifier.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { DeploymentVerifier };