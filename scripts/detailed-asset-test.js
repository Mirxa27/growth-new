#!/usr/bin/env node

/**
 * Detailed Asset Testing Script
 * Tests JavaScript bundles, CSS assets, and identifies specific failures
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'https://growth-echo-nexus.vercel.app',
  timeout: 30000
};

const results = {
  timestamp: new Date().toISOString(),
  assets: {},
  javascript: {},
  css: {},
  routes: {},
  issues: []
};

async function testAsset(url, type) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: new URL(CONFIG.baseUrl).hostname,
      path: url,
      method: 'GET',
      timeout: CONFIG.timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          size: parseInt(res.headers['content-length'] || '0'),
          contentType: res.headers['content-type'],
          data: data
        });
      });
    });

    req.on('error', () => resolve({ url, status: 'ERROR', error: 'Connection failed' }));
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', error: 'Request timeout' });
    });
    req.end();
  });
}

async function testMainPage() {
  console.log('🔍 Testing main page and extracting assets...');

  const mainPage = await testAsset('/', 'html');
  results.routes.main = mainPage;

  if (mainPage.status === 200) {
    // Extract JavaScript and CSS URLs from HTML
    const jsMatch = mainPage.data.match(/src="([^"]+\.js)"/);
    const cssMatch = mainPage.data.match(/href="([^"]+\.css)"/);

    if (jsMatch) {
      console.log(`📦 Found JS bundle: ${jsMatch[1]}`);
      const jsTest = await testAsset(jsMatch[1], 'javascript');
      results.javascript.main = jsTest;
    } else {
      results.issues.push('No JavaScript bundle found in main page');
    }

    if (cssMatch) {
      console.log(`🎨 Found CSS bundle: ${cssMatch[1]}`);
      const cssTest = await testAsset(cssMatch[1], 'css');
      results.css.main = cssTest;
    } else {
      results.issues.push('No CSS bundle found in main page');
    }

    // Check for critical React content
    if (!mainPage.data.includes('root') || !mainPage.data.includes('div id="root"')) {
      results.issues.push('React root div not found in HTML');
    }
  } else {
    results.issues.push(`Main page failed with status ${mainPage.status}`);
  }
}

async function testStaticAssets() {
  console.log('🔍 Testing static assets...');

  const assets = [
    '/favicon.ico',
    '/manifest.json',
    '/sw.js'
  ];

  for (const asset of assets) {
    const test = await testAsset(asset, 'static');
    results.assets[asset] = test;

    if (test.status !== 200) {
      results.issues.push(`Static asset ${asset} failed with status ${test.status}`);
    }
  }
}

async function testRouteBehavior() {
  console.log('🔍 Testing route behavior...');

  const routes = [
    '/dashboard',
    '/auth',
    '/assessment',
    '/admin',
    '/non-existent-route'
  ];

  for (const route of routes) {
    const test = await testAsset(route, 'route');
    results.routes[route] = test;

    if (test.status === 200) {
      // Check if it's returning the same content as main page (SPA behavior)
      if (test.data === results.routes.main?.data) {
        console.log(`✅ Route ${route} returns SPA shell (expected)`);
      } else {
        results.issues.push(`Route ${route} returns different content than main page`);
      }
    } else {
      results.issues.push(`Route ${route} failed with status ${test.status}`);
    }
  }
}

async function analyzeJavaScriptBundle() {
  console.log('🔍 Analyzing JavaScript bundle...');

  if (results.javascript.main && results.javascript.main.status === 200) {
    const jsContent = results.javascript.main.data;

    // Check for critical modules
    const criticalImports = [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ];

    for (const imp of criticalImports) {
      if (jsContent.includes(imp)) {
        console.log(`✅ Found critical import: ${imp}`);
      } else {
        results.issues.push(`Critical import missing: ${imp}`);
      }
    }

    // Check for React components
    if (jsContent.includes('createRoot') || jsContent.includes('ReactDOM')) {
      console.log('✅ React initialization found');
    } else {
      results.issues.push('React initialization not found');
    }

    // Check for routing
    if (jsContent.includes('BrowserRouter') || jsContent.includes('Router')) {
      console.log('✅ React Router found');
    } else {
      results.issues.push('React Router not found');
    }

    // Check bundle size
    const size = results.javascript.main.size;
    if (size < 50000) {
      results.issues.push(`JavaScript bundle suspiciously small: ${size} bytes`);
    } else {
      console.log(`📊 JavaScript bundle size: ${size} bytes`);
    }
  } else {
    results.issues.push('JavaScript bundle not accessible');
  }
}

async function generateReport() {
  console.log('\n📊 GENERATING DETAILED REPORT...');

  const report = {
    summary: {
      totalIssues: results.issues.length,
      criticalIssues: results.issues.filter(i =>
        i.includes('critical') ||
        i.includes('missing') ||
        i.includes('failed')
      ).length,
      assetsTested: Object.keys(results.assets).length +
                   Object.keys(results.javascript).length +
                   Object.keys(results.css).length,
      routesTested: Object.keys(results.routes).length
    },
    findings: results
  };

  // Save JSON report
  fs.writeFileSync(
    path.join(__dirname, 'detailed-test-results.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate human-readable report
  const humanReport = `# Growth Echo Nexus - Detailed Asset Test Report

## Test Summary
- **Date**: ${new Date().toLocaleString()}
- **Base URL**: ${CONFIG.baseUrl}
- **Assets Tested**: ${report.summary.assetsTested}
- **Routes Tested**: ${report.summary.routesTested}
- **Total Issues**: ${report.summary.totalIssues}
- **Critical Issues**: ${report.summary.criticalIssues}

## Critical Issues Found
${results.issues.length > 0
  ? results.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
  : 'No critical issues detected'
}

## Asset Analysis

### JavaScript Bundle
- **Status**: ${results.javascript.main?.status || 'NOT TESTED'}
- **Size**: ${results.javascript.main?.size || 0} bytes
- **Content Type**: ${results.javascript.main?.contentType || 'N/A'}

### CSS Bundle
- **Status**: ${results.css.main?.status || 'NOT TESTED'}
- **Size**: ${results.css.main?.size || 0} bytes
- **Content Type**: ${results.css.main?.contentType || 'N/A'}

### Static Assets
${Object.entries(results.assets).map(([path, test]) =>
  `- **${path}**: Status ${test.status}, Size ${test.size} bytes`
).join('\n')}

## Route Behavior
${Object.entries(results.routes).map(([route, test]) =>
  `- **${route}**: Status ${test.status}${test.status === 200 ? ' (SPA shell)' : ''}`
).join('\n')}

## Root Cause Analysis
${generateRootCauseAnalysis()}

## Recommendations
${generateRecommendations()}
`;

  fs.writeFileSync(
    path.join(__dirname, 'detailed-test-report.md'),
    humanReport
  );

  console.log('✅ Reports saved to:');
  console.log('   - detailed-test-results.json');
  console.log('   - detailed-test-report.md');

  return report;
}

function generateRootCauseAnalysis() {
  if (results.issues.length === 0) {
    return 'All assets are loading correctly. The application appears to be functioning properly.';
  }

  const missingImports = results.issues.filter(i => i.includes('missing'));
  const failedAssets = results.issues.filter(i => i.includes('failed'));
  const sizeIssues = results.issues.filter(i => i.includes('small'));

  let analysis = '';

  if (missingImports.length > 0) {
    analysis += '\n**Missing Dependencies**: The JavaScript bundle appears to be incomplete or corrupted.\n';
  }

  if (failedAssets.length > 0) {
    analysis += '\n**Asset Loading Failures**: Critical assets are not loading properly.\n';
  }

  if (sizeIssues.length > 0) {
    analysis += '\n**Bundle Size Issues**: The JavaScript bundle is suspiciously small, indicating build problems.\n';
  }

  if (results.javascript.main && results.javascript.main.status === 200 &&
      results.javascript.main.size < 100000) {
    analysis += '\n**Likely Root Cause**: The build process may have failed or produced an incomplete bundle. The JavaScript file is too small to contain a full React application.\n';
  }

  return analysis || 'No clear root cause identified from asset analysis.';
}

function generateRecommendations() {
  const recommendations = [];

  if (results.issues.length > 0) {
    recommendations.push('1. **Rebuild the application**: The current build appears to be incomplete or corrupted.');
    recommendations.push('2. **Check build logs**: Look for errors during the Vite build process.');
    recommendations.push('3. **Verify dependencies**: Ensure all npm dependencies are properly installed.');
    recommendations.push('4. **Test locally**: Run the application locally to verify it works before redeploying.');

    if (results.javascript.main && results.javascript.main.size < 50000) {
      recommendations.push('5. **Investigate build configuration**: Check Vite configuration for potential issues.');
    }
  } else {
    recommendations.push('1. **Browser testing**: The assets are loading correctly, test in actual browser.');
    recommendations.push('2. **Console logs**: Check browser developer tools for JavaScript runtime errors.');
    recommendations.push('3. **Network tab**: Verify all resources are loading without errors in browser.');
  }

  return recommendations.join('\n');
}

async function main() {
  console.log('🧪 Starting detailed asset test for Growth Echo Nexus');
  console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(60));

  await testMainPage();
  await testStaticAssets();
  await testRouteBehavior();
  await analyzeJavaScriptBundle();

  const report = await generateReport();

  console.log('='.repeat(60));
  console.log('📊 FINAL SUMMARY:');
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);

  if (report.summary.criticalIssues > 0) {
    console.log('❌ CRITICAL ISSUES DETECTED - Application is not functioning properly');
    process.exit(1);
  } else {
    console.log('✅ No critical issues found - Application appears to be working');
    process.exit(0);
  }
}

main().catch(console.error);