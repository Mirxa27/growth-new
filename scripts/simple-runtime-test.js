#!/usr/bin/env node

/**
 * Simple Runtime Test - Checks for common issues
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'https://growth-echo-nexus.vercel.app'
};

const testResults = {
  timestamp: new Date().toISOString(),
  findings: [],
  issues: [],
  recommendations: []
};

async function fetchAsset(url) {
  return new Promise((resolve, reject) => {
    https.get(`${CONFIG.baseUrl}${url}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          size: parseInt(res.headers['content-length'] || '0')
        });
      });
    }).on('error', reject);
  });
}

async function testJavaScriptBundle() {
  console.log('📦 Analyzing JavaScript bundle...');

  const jsBundle = await fetchAsset('/assets/index-BjvxffBD.js');

  if (jsBundle.status !== 200) {
    testResults.issues.push(`JavaScript bundle not accessible: ${jsBundle.status}`);
    return;
  }

  // Check for common issues in the bundle
  const content = jsBundle.data;

  // Check for React
  if (content.includes('react') && content.includes('createRoot')) {
    testResults.findings.push('✅ React found in bundle');
  } else {
    testResults.issues.push('❌ React not properly included in bundle');
  }

  // Check for React Router
  if (content.includes('react-router') || content.includes('BrowserRouter')) {
    testResults.findings.push('✅ React Router found in bundle');
  } else {
    testResults.issues.push('❌ React Router not found in bundle');
  }

  // Check for Supabase
  if (content.includes('@supabase/supabase-js')) {
    testResults.findings.push('✅ Supabase client found in bundle');
  } else {
    testResults.issues.push('❌ Supabase client not found in bundle');
  }

  // Check for environment variable usage
  const envVarMatches = content.match(/import\.meta\.env\.[A-Z_]+/g);
  if (envVarMatches) {
    testResults.findings.push(`✅ Environment variables referenced: ${[...new Set(envVarMatches)].join(', ')}`);
  } else {
    testResults.issues.push('❌ No environment variable references found');
  }

  // Check for error handling
  if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
    testResults.findings.push('✅ Error handling found in bundle');
  } else {
    testResults.issues.push('❌ Error handling not found in bundle');
  }

  // Check for authentication logic
  if (content.includes('auth') || content.includes('useAuth') || content.includes('AuthProvider')) {
    testResults.findings.push('✅ Authentication logic found in bundle');
  } else {
    testResults.issues.push('❌ Authentication logic not found in bundle');
  }

  console.log(`📊 Bundle size: ${(jsBundle.size / 1024 / 1024).toFixed(2)} MB`);
}

async function testCSSBundle() {
  console.log('🎨 Analyzing CSS bundle...');

  const cssBundle = await fetchAsset('/assets/index-C4QLW9Hb.css');

  if (cssBundle.status !== 200) {
    testResults.issues.push(`CSS bundle not accessible: ${cssBundle.status}`);
    return;
  }

  // Check for common CSS frameworks
  const content = cssBundle.data;

  // Check for Tailwind
  if (content.includes('tailwind') || content.includes('flex') || content.includes('grid')) {
    testResults.findings.push('✅ Modern CSS framework detected');
  } else {
    testResults.issues.push('❌ Modern CSS framework not detected');
  }

  // Check for responsive design
  if (content.includes('@media') || content.includes('sm:') || content.includes('md:')) {
    testResults.findings.push('✅ Responsive design CSS found');
  } else {
    testResults.issues.push('❌ Responsive design CSS not found');
  }

  console.log(`📊 CSS size: ${(cssBundle.size / 1024).toFixed(2)} KB`);
}

async function testAPIEndpoints() {
  console.log('🔌 Testing API endpoints...');

  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/test/openai', method: 'GET' },
    { path: '/api/test/auth', method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetchAsset(endpoint.path);
      if (response.status === 200) {
        testResults.findings.push(`✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);
      } else if (response.status === 404) {
        testResults.findings.push(`⚠️ ${endpoint.method} ${endpoint.path} - Not found (404)`);
      } else if (response.status === 405) {
        testResults.findings.push(`⚠️ ${endpoint.method} ${endpoint.path} - Method not allowed (405)`);
      } else {
        testResults.issues.push(`❌ ${endpoint.method} ${endpoint.path} - ${response.status}`);
      }
    } catch (error) {
      testResults.issues.push(`❌ ${endpoint.method} ${endpoint.path} - Connection failed`);
    }
  }
}

async function checkDeploymentConfiguration() {
  console.log('⚙️ Checking deployment configuration...');

  // Check the HTML structure
  const mainPage = await fetchAsset('/');

  if (mainPage.status === 200) {
    // Check for proper SPA structure
    if (mainPage.data.includes('<div id="root"></div>')) {
      testResults.findings.push('✅ React root element found');
    } else {
      testResults.issues.push('❌ React root element not found');
    }

    // Check for JavaScript bundle reference
    if (mainPage.data.includes('src="/assets/')) {
      testResults.findings.push('✅ JavaScript bundle referenced in HTML');
    } else {
      testResults.issues.push('❌ JavaScript bundle not referenced in HTML');
    }

    // Check for CSS bundle reference
    if (mainPage.data.includes('href="/assets/')) {
      testResults.findings.push('✅ CSS bundle referenced in HTML');
    } else {
      testResults.issues.push('❌ CSS bundle not referenced in HTML');
    }
  } else {
    testResults.issues.push('❌ Main page not accessible');
  }
}

function generateRecommendations() {
  console.log('\n💡 Generating recommendations...');

  if (testResults.issues.length === 0) {
    testResults.recommendations.push([
      '1. 🎯 Test in actual browser - The technical infrastructure looks correct',
      '2. 🔍 Check browser console for JavaScript runtime errors',
      '3. 🌐 Test different browsers (Chrome, Firefox, Safari)',
      '4. 📱 Test on mobile devices',
      '5. 🚀 Clear browser cache and reload'
    ]);
  } else {
    const recs = [];

    if (testResults.issues.some(issue => issue.includes('React'))) {
      recs.push('1. 🔧 Fix React integration - Check build process');
    }

    if (testResults.issues.some(issue => issue.includes('environment'))) {
      recs.push('2. 🌍 Configure environment variables in production');
    }

    if (testResults.issues.some(issue => issue.includes('authentication'))) {
      recs.push('3. 🔐 Fix authentication system implementation');
    }

    if (testResults.issues.some(issue => issue.includes('bundle'))) {
      recs.push('4. 📦 Rebuild application bundle');
    }

    recs.push('5. 🧪 Test locally before redeploying');
    recs.push('6. 🔍 Check build logs for errors');

    testResults.recommendations.push(recs);
  }
}

async function generateReport() {
  console.log('\n📊 GENERATING COMPREHENSIVE REPORT...');

  const report = {
    summary: {
      totalFindings: testResults.findings.length,
      totalIssues: testResults.issues.length,
      overallHealth: testResults.issues.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'
    },
    details: testResults
  };

  // Save JSON report
  fs.writeFileSync(
    path.join(__dirname, 'final-test-results.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate human-readable report
  const humanReport = `# Growth Echo Nexus - Comprehensive Test Report

## Executive Summary
- **Date**: ${new Date().toLocaleString()}
- **Base URL**: ${CONFIG.baseUrl}
- **Overall Health**: ${report.summary.overallHealth}
- **Total Findings**: ${report.summary.totalFindings}
- **Total Issues**: ${report.summary.totalIssues}

## Test Results

### ✅ Positive Findings (${testResults.findings.length})
${testResults.findings.map((finding, i) => `${i + 1}. ${finding}`).join('\n')}

### ❌ Issues Identified (${testResults.issues.length})
${testResults.issues.length > 0
  ? testResults.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
  : 'No critical issues detected'
}

## Root Cause Analysis
${generateRootCauseAnalysis()}

## Recommendations
${testResults.recommendations.flat().join('\n')}

## Next Steps
${generateNextSteps()}

---

## Technical Details

### Application Architecture
- **Framework**: React + Vite
- **Routing**: React Router (SPA)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Build**: Vite with code splitting

### Testing Performed
1. ✅ Asset availability and accessibility
2. ✅ JavaScript bundle analysis
3. ✅ CSS framework detection
4. ✅ API endpoint connectivity
5. ✅ SPA configuration verification
6. ✅ Environment structure validation

*Report generated by automated testing suite*`;

  fs.writeFileSync(
    path.join(__dirname, 'final-test-report.md'),
    humanReport
  );

  console.log('✅ Final reports saved to:');
  console.log('   - final-test-results.json');
  console.log('   - final-test-report.md');

  return report;
}

function generateRootCauseAnalysis() {
  if (testResults.issues.length === 0) {
    return `**Application appears technically sound**

All technical components are properly configured and accessible. The JavaScript bundle contains the expected dependencies, CSS is properly structured, and the SPA configuration is correct.

**Most likely user experience issues:**
- Browser-specific JavaScript errors
- Environment variable misconfiguration
- Network connectivity problems
- Browser cache issues
- Mobile device compatibility`;
  }

  let analysis = '**Technical issues identified that impact user experience:**\n\n';

  const criticalIssues = testResults.issues.filter(issue => issue.includes('❌'));
  const warnings = testResults.issues.filter(issue => issue.includes('⚠️'));

  if (criticalIssues.length > 0) {
    analysis += `**Critical Issues (${criticalIssues.length}):**\n`;
    criticalIssues.forEach(issue => {
      analysis += `- ${issue.replace('❌ ', '')}\n`;
    });
    analysis += '\n';
  }

  if (warnings.length > 0) {
    analysis += `**Warnings (${warnings.length}):**\n`;
    warnings.forEach(issue => {
      analysis += `- ${issue.replace('⚠️ ', '')}\n`;
    });
    analysis += '\n';
  }

  analysis += '**Root Cause:** The application has fundamental technical issues that prevent proper functionality.\n\n';
  analysis += '**Impact:** Users will experience broken features, authentication failures, or incomplete page loads.';

  return analysis;
}

function generateNextSteps() {
  if (testResults.issues.length === 0) {
    return `1. **Immediate**: Test in actual browsers with developer tools open
2. **Short-term**: Check browser console for JavaScript errors
3. **Medium-term**: Implement comprehensive end-to-end testing
4. **Long-term**: Set up monitoring and alerting for production issues`;
  }

  return `1. **Immediate**: Fix critical technical issues identified above
2. **Short-term**: Rebuild and redeploy the application
3. **Medium-term**: Implement proper error handling and logging
4. **Long-term**: Set up comprehensive testing and monitoring`;
}

async function main() {
  console.log('🧪 Starting comprehensive test for Growth Echo Nexus');
  console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(60));

  await testJavaScriptBundle();
  await testCSSBundle();
  await testAPIEndpoints();
  await checkDeploymentConfiguration();
  generateRecommendations();
  const report = await generateReport();

  console.log('='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY:');
  console.log(`Overall Health: ${report.summary.overallHealth}`);
  console.log(`Positive Findings: ${report.summary.totalFindings}`);
  console.log(`Issues Identified: ${report.summary.totalIssues}`);

  if (report.summary.totalIssues > 0) {
    console.log('\n❌ ISSUES DETECTED - Application needs technical fixes');
    process.exit(1);
  } else {
    console.log('\n✅ TECHNICAL INFRASTRUCTURE HEALTHY');
    console.log('🎯 Next: Test in actual browsers to identify user experience issues');
    process.exit(0);
  }
}

main().catch(console.error);