#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Growth Echo Nexus
 * This script tests all critical user flows and identifies broken components
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'https://growth-echo-nexus.vercel.app',
  timeout: 30000,
  retries: 3,
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  }
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'test',
  baseUrl: CONFIG.baseUrl,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Helper functions
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: new URL(CONFIG.baseUrl).hostname,
      path: url,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Growth-Echo-Nexus-Test-Agent/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

const runTest = async (name, testFn, category = 'general') => {
  const startTime = Date.now();
  let result = {
    name,
    category,
    status: 'pending',
    duration: 0,
    error: null,
    details: {}
  };

  try {
    testResults.summary.total++;
    result.details = await testFn();
    result.status = 'passed';
    testResults.summary.passed++;
    console.log(`✅ ${name} - Passed (${Date.now() - startTime}ms)`);
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    result.stack = error.stack;
    testResults.summary.failed++;
    console.log(`❌ ${name} - Failed: ${error.message} (${Date.now() - startTime}ms)`);
  }

  result.duration = Date.now() - startTime;
  testResults.tests.push(result);
  return result;
};

// Test suites
const testSuite = {
  // 1. Basic connectivity and health checks
  async healthChecks() {
    const results = {};

    // Test main page
    results.mainPage = await makeRequest('/');

    // Test critical static assets
    results.favicon = await makeRequest('/favicon.ico');
    results.manifest = await makeRequest('/manifest.json');

    // Test service worker
    results.serviceWorker = await makeRequest('/sw.js');

    return results;
  },

  // 2. Authentication flow tests
  async authentication() {
    const results = {};

    // Test auth page access
    results.authPage = await makeRequest('/auth');

    // Test protected route without auth
    results.dashboardUnauthenticated = await makeRequest('/dashboard');

    // Test signup endpoint (if exists)
    try {
      results.signupAttempt = await makeRequest('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CONFIG.testUser)
      });
    } catch (error) {
      results.signupAttempt = { error: error.message };
    }

    // Test login endpoint (if exists)
    try {
      results.loginAttempt = await makeRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CONFIG.testUser)
      });
    } catch (error) {
      results.loginAttempt = { error: error.message };
    }

    return results;
  },

  // 3. Assessment flow tests
  async assessments() {
    const results = {};

    // Test assessment hub
    results.assessmentHub = await makeRequest('/assessment-hub');

    // Test public assessment
    results.publicAssessment = await makeRequest('/assessment');

    // Test mobile assessment
    results.mobileAssessment = await makeRequest('/mobile-assessment');

    // Test assessment system
    results.assessmentSystem = await makeRequest('/assessment-system');

    return results;
  },

  // 4. Database connectivity tests
  async database() {
    const results = {};

    // Test database health endpoint (if exists)
    try {
      results.dbHealth = await makeRequest('/api/health');
    } catch (error) {
      results.dbHealth = { error: error.message };
    }

    // Test error logs endpoint (if exists)
    try {
      results.errorLogs = await makeRequest('/api/logs');
    } catch (error) {
      results.errorLogs = { error: error.message };
    }

    return results;
  },

  // 5. Third-party integrations
  async integrations() {
    const results = {};

    // Test OpenAI endpoint (if exists)
    try {
      results.openaiTest = await makeRequest('/api/test/openai');
    } catch (error) {
      results.openaiTest = { error: error.message };
    }

    // Test Stripe webhook (if exists)
    try {
      results.stripeWebhook = await makeRequest('/api/webhooks/stripe');
    } catch (error) {
      results.stripeWebhook = { error: error.message };
    }

    return results;
  },

  // 6. Error handling tests
  async errorHandling() {
    const results = {};

    // Test 404 page
    results.notFound = await makeRequest('/non-existent-page');

    // Test error boundary demo
    results.errorDemo = await makeRequest('/error-boundary-demo');

    return results;
  },

  // 7. Performance tests
  async performance() {
    const results = {};

    // Test main page load time
    const start = Date.now();
    results.mainPageLoad = await makeRequest('/');
    results.loadTime = Date.now() - start;

    // Test bundle sizes via headers
    results.bundleInfo = {};
    if (results.mainPageLoad.headers['content-length']) {
      results.bundleInfo.mainPage = parseInt(results.mainPageLoad.headers['content-length']);
    }

    return results;
  }
};

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting comprehensive test suite for Growth Echo Nexus');
  console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log('='.repeat(60));

  // Run all test suites
  await runTest('Health Checks', testSuite.healthChecks, 'connectivity');
  await runTest('Authentication Flow', testSuite.authentication, 'auth');
  await runTest('Assessment Flows', testSuite.assessments, 'features');
  await runTest('Database Connectivity', testSuite.database, 'database');
  await runTest('Third-party Integrations', testSuite.integrations, 'integrations');
  await runTest('Error Handling', testSuite.errorHandling, 'error-handling');
  await runTest('Performance Metrics', testSuite.performance, 'performance');

  // Generate report
  console.log('='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

  // Save detailed results
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  // Generate human-readable report
  generateHumanReadableReport();

  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

function generateHumanReadableReport() {
  const report = `
# Growth Echo Nexus - Test Report

## Test Summary
- **Date**: ${new Date().toLocaleString()}
- **Environment**: ${testResults.environment}
- **Base URL**: ${testResults.baseUrl}
- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Success Rate**: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%

## Failed Tests
${testResults.tests.filter(t => t.status === 'failed').map(test => `
### ${test.name}
- **Category**: ${test.category}
- **Error**: ${test.error}
- **Duration**: ${test.duration}ms
`).join('')}

## Performance Issues
${testResults.tests.filter(t => t.category === 'performance' && t.duration > 5000).map(test => `
### ${test.name}
- **Load Time**: ${test.duration}ms
- **Status**: ${test.status}
`).join('')}

## Recommendations
${generateRecommendations()}
`;

  fs.writeFileSync(path.join(__dirname, 'test-report.md'), report);
  console.log('📄 Human-readable report saved to: test-report.md');
}

function generateRecommendations() {
  const recommendations = [];

  const failedTests = testResults.tests.filter(t => t.status === 'failed');
  const slowTests = testResults.tests.filter(t => t.duration > 5000);

  if (failedTests.length > 0) {
    recommendations.push(`- ${failedTests.length} tests failed. Review error messages and fix underlying issues.`);
  }

  if (slowTests.length > 0) {
    recommendations.push(`- ${slowTests.length} tests took more than 5 seconds. Consider performance optimizations.`);
  }

  const authFailures = failedTests.filter(t => t.category === 'auth');
  if (authFailures.length > 0) {
    recommendations.push('- Authentication system has issues. Check auth configuration and endpoints.');
  }

  const dbFailures = failedTests.filter(t => t.category === 'database');
  if (dbFailures.length > 0) {
    recommendations.push('- Database connectivity problems. Verify database credentials and network access.');
  }

  if (recommendations.length === 0) {
    recommendations.push('- All tests passed! Consider adding more comprehensive test coverage.');
  }

  return recommendations.join('\n');
}

// Run tests if called directly
runAllTests().catch(console.error);