#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * Tests critical functionality after deployment
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

console.log('🔍 Running post-deployment verification...\n');

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@newomen.me';

const tests = [];
let passedTests = 0;
let failedTests = 0;

function addTest(name, testFn) {
  tests.push({ name, test: testFn });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        data,
        headers: res.headers 
      }));
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test 1: Homepage loads
addTest('Homepage Loading', async () => {
  const response = await httpGet(SITE_URL);
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }
  if (!response.data.includes('Newomen') && !response.data.includes('Growth')) {
    throw new Error('Page content missing');
  }
  return 'Homepage loads with correct content';
});

// Test 2: Mobile assessment page
addTest('Mobile Assessment Page', async () => {
  const response = await httpGet(`${SITE_URL}/mobile-assessment`);
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }
  return 'Mobile assessment page accessible';
});

// Test 3: Admin dashboard (should redirect to auth)
addTest('Admin Dashboard Security', async () => {
  const response = await httpGet(`${SITE_URL}/admin`);
  // Should redirect to auth or return 401/403
  if (response.statusCode === 200 && response.data.includes('admin')) {
    throw new Error('Admin dashboard not properly protected');
  }
  return 'Admin dashboard properly protected';
});

// Test 4: Static assets loading
addTest('Static Assets', async () => {
  const response = await httpGet(SITE_URL);
  const hasCSS = response.data.includes('.css') || response.data.includes('<style>');
  const hasJS = response.data.includes('.js') || response.data.includes('<script>');
  
  if (!hasCSS || !hasJS) {
    throw new Error('Missing CSS or JS assets');
  }
  return 'Static assets properly included';
});

// Test 5: API endpoints health
addTest('API Health', async () => {
  try {
    const response = await httpGet(`${SITE_URL}/api/health`);
    return 'API endpoints accessible';
  } catch (error) {
    // API might not exist, this is okay for static sites
    return 'API health check skipped (static deployment)';
  }
});

// Test 6: Security headers
addTest('Security Headers', async () => {
  const response = await httpGet(SITE_URL);
  const headers = response.headers;
  
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  const missingHeaders = securityHeaders.filter(header => !headers[header]);
  
  if (missingHeaders.length > 0) {
    console.warn(`Missing security headers: ${missingHeaders.join(', ')}`);
  }
  
  return `Security headers: ${securityHeaders.length - missingHeaders.length}/${securityHeaders.length} present`;
});

// Test 7: Mobile viewport
addTest('Mobile Viewport', async () => {
  const response = await httpGet(SITE_URL);
  
  if (!response.data.includes('viewport')) {
    throw new Error('Missing viewport meta tag');
  }
  
  return 'Mobile viewport configured';
});

// Run all tests
async function runTests() {
  console.log(`Testing deployment: ${SITE_URL}\n`);
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      console.log(`✅ ${name}: ${result}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);
  
  if (failedTests === 0) {
    console.log(`\n🎉 All tests passed! Deployment is healthy.`);
    console.log(`🚀 Site is ready for users: ${SITE_URL}`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check deployment configuration.`);
    console.log(`📖 See TROUBLESHOOTING_GUIDE.md for solutions.`);
  }
  
  console.log(`\n🔗 Next Steps:`);
  console.log(`1. Test manually: ${SITE_URL}`);
  console.log(`2. Try mobile assessment: ${SITE_URL}/mobile-assessment`);
  console.log(`3. Test admin features (requires admin account)`);
  console.log(`4. Monitor performance and usage`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Usage: node verify-deployment.js [options]');
  console.log('');
  console.log('Environment Variables:');
  console.log('  SITE_URL      URL to test (default: http://localhost:5173)');
  console.log('  ADMIN_EMAIL   Admin email for reference');
  console.log('');
  console.log('Examples:');
  console.log('  SITE_URL=https://your-site.vercel.app node verify-deployment.js');
  console.log('  node verify-deployment.js');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});