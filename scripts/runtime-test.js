#!/usr/bin/env node

/**
 * Runtime Environment Test
 * Simulates browser environment to detect JavaScript runtime errors
 */

import { JSDOM } from 'jsdom';
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
  runtimeErrors: [],
  consoleLogs: [],
  domErrors: [],
  envIssues: [],
  success: true
};

async function fetchJavaScriptBundle() {
  console.log('📦 Fetching JavaScript bundle...');

  return new Promise((resolve, reject) => {
    https.get(`${CONFIG.baseUrl}/assets/index-BjvxffBD.js`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch JS bundle: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchCSSBundle() {
  console.log('🎨 Fetching CSS bundle...');

  return new Promise((resolve, reject) => {
    https.get(`${CONFIG.baseUrl}/assets/index-C4QLW9Hb.css`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch CSS bundle: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function simulateBrowserEnvironment() {
  console.log('🌐 Simulating browser environment...');

  try {
    const jsCode = await fetchJavaScriptBundle();
    const cssCode = await fetchCSSBundle();

    // Create DOM environment
    const htmlTemplate = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Environment</title>
          <style>${cssCode}</style>
        </head>
        <body>
          <div id="root"></div>
          <script>`;

    const scriptContent = `
            // Mock browser APIs
            window.__INITIAL_ENVIRONMENT__ = {
              NODE_ENV: 'production',
              VITE_SUPABASE_URL: 'https://test.supabase.co',
              VITE_SUPABASE_ANON_KEY: 'test-key'
            };

            // Mock localStorage
            const mockStorage = {};
            window.localStorage = {
              getItem: (key) => mockStorage[key] || null,
              setItem: (key, value) => { mockStorage[key] = value.toString(); },
              removeItem: (key) => { delete mockStorage[key]; },
              clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
              length: Object.keys(mockStorage).length,
              key: (index) => Object.keys(mockStorage)[index]
            };

            // Mock sessionStorage
            window.sessionStorage = {
              getItem: (key) => mockStorage[key] || null,
              setItem: (key, value) => { mockStorage[key] = value.toString(); },
              removeItem: (key) => { delete mockStorage[key]; },
              clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
            };

            // Mock fetch API
            window.fetch = async (url, options = {}) => {
              console.log('[Fetch]', url, options);
              return {
                ok: true,
                status: 200,
                json: async () => ({ success: true }),
                text: async () => 'OK'
              };
            };

            // Mock WebSocket
            window.WebSocket = class {
              constructor(url) {
                console.log('[WebSocket] Connecting to:', url);
                setTimeout(() => {
                  this.onopen?.();
                }, 100);
              }
              send() {}
              close() {}
            };

            // Mock performance API
            window.performance = {
              now: () => Date.now(),
              mark: () => {},
              measure: () => {},
              getEntriesByType: () => []
            };

            // Mock intersection observer
            window.IntersectionObserver = class {
              constructor() {}
              observe() {}
              unobserve() {}
              disconnect() {}
            };

            // Mock resize observer
            window.ResizeObserver = class {
              constructor() {}
              observe() {}
              unobserve() {}
              disconnect() {}
            };

            // Mock mutation observer
            window.MutationObserver = class {
              constructor() {}
              observe() {}
              disconnect() {}
            };

            // Mock crypto API
            window.crypto = {
              getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) {
                  arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
              },
              subtle: {
                digest: async () => new Uint8Array(32)
              }
            };

            // Mock URL API
            window.URL = {
              createObjectURL: () => 'blob:test',
              revokeObjectURL: () => {}
            };

            // Mock geolocation
            window.navigator.geolocation = {
              getCurrentPosition: (success) => success({
                coords: { latitude: 0, longitude: 0 },
                timestamp: Date.now()
              }),
              watchPosition: () => 1,
              clearWatch: () => {}
            };

            // Mock notifications
            window.Notification = {
              permission: 'granted',
              requestPermission: async () => 'granted'
            };

            // Mock screen orientation
            window.screen = {
              orientation: {
                type: 'portrait-primary',
                lock: async () => {},
                unlock: () => {},
                addEventListener: () => {},
                removeEventListener: () => {}
              }
            };

            // Mock device motion/orientation
            window.DeviceMotionEvent = class {};
            window.DeviceOrientationEvent = class {};

            // Capture console output
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn,
              info: console.info
            };

            console.log = (...args) => {
              testResults.consoleLogs.push({ type: 'log', args: args.map(a => String(a)) });
              originalConsole.log(...args);
            };

            console.error = (...args) => {
              testResults.consoleLogs.push({ type: 'error', args: args.map(a => String(a)) });
              testResults.runtimeErrors.push(\`Console error: \${args.join(' ')}\`);
              originalConsole.error(...args);
            };

            console.warn = (...args) => {
              testResults.consoleLogs.push({ type: 'warn', args: args.map(a => String(a)) });
              originalConsole.warn(...args);
            };

            console.info = (...args) => {
              testResults.consoleLogs.push({ type: 'info', args: args.map(a => String(a)) });
              originalConsole.info(...args);
            };

            // Capture unhandled errors
            window.addEventListener('error', (event) => {
              testResults.runtimeErrors.push(\`Runtime error: \${event.message} at \${event.filename}:\${event.lineno}\`);
              testResults.success = false;
            });

            window.addEventListener('unhandledrejection', (event) => {
              testResults.runtimeErrors.push(\`Unhandled promise rejection: \${event.reason}\`);
              testResults.success = false;
            });
          </script>
        </body>
      </html>
    `;

    const dom = new JSDOM(htmlTemplate + scriptContent, {
            // Mock browser APIs
            window.__INITIAL_ENVIRONMENT__ = {
              NODE_ENV: 'production',
              VITE_SUPABASE_URL: 'https://test.supabase.co',
              VITE_SUPABASE_ANON_KEY: 'test-key'
            };

            // Mock localStorage
            const mockStorage = {};
            window.localStorage = {
              getItem: (key) => mockStorage[key] || null,
              setItem: (key, value) => { mockStorage[key] = value.toString(); },
              removeItem: (key) => { delete mockStorage[key]; },
              clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
              length: Object.keys(mockStorage).length,
              key: (index) => Object.keys(mockStorage)[index]
            };

            // Mock sessionStorage
            window.sessionStorage = {
              getItem: (key) => mockStorage[key] || null,
              setItem: (key, value) => { mockStorage[key] = value.toString(); },
              removeItem: (key) => { delete mockStorage[key]; },
              clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
            };

            // Mock fetch API
            window.fetch = async (url, options = {}) => {
              console.log('[Fetch]', url, options);
              return {
                ok: true,
                status: 200,
                json: async () => ({ success: true }),
                text: async () => 'OK'
              };
            };

            // Mock WebSocket
            window.WebSocket = class {
              constructor(url) {
                console.log('[WebSocket] Connecting to:', url);
                setTimeout(() => {
                  this.onopen?.();
                }, 100);
              }
              send() {}
              close() {}
            };

            // Mock performance API
            window.performance = {
              now: () => Date.now(),
              mark: () => {},
              measure: () => {},
              getEntriesByType: () => []
            };

            // Mock intersection observer
            window.IntersectionObserver = class {
              constructor() {}
              observe() {}
              unobserve() {}
              disconnect() {}
            };

            // Mock resize observer
            window.ResizeObserver = class {
              constructor() {}
              observe() {}
              unobserve() {}
              disconnect() {}
            };

            // Mock mutation observer
            window.MutationObserver = class {
              constructor() {}
              observe() {}
              disconnect() {}
            };

            // Mock crypto API
            window.crypto = {
              getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) {
                  arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
              },
              subtle: {
                digest: async () => new Uint8Array(32)
              }
            };

            // Mock URL API
            window.URL = {
              createObjectURL: () => 'blob:test',
              revokeObjectURL: () => {}
            };

            // Mock geolocation
            window.navigator.geolocation = {
              getCurrentPosition: (success) => success({
                coords: { latitude: 0, longitude: 0 },
                timestamp: Date.now()
              }),
              watchPosition: () => 1,
              clearWatch: () => {}
            };

            // Mock notifications
            window.Notification = {
              permission: 'granted',
              requestPermission: async () => 'granted'
            };

            // Mock screen orientation
            window.screen = {
              orientation: {
                type: 'portrait-primary',
                lock: async () => {},
                unlock: () => {},
                addEventListener: () => {},
                removeEventListener: () => {}
              }
            };

            // Mock device motion/orientation
            window.DeviceMotionEvent = class {};
            window.DeviceOrientationEvent = class {};

            // Capture console output
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn,
              info: console.info
            };

            console.log = (...args) => {
              testResults.consoleLogs.push({ type: 'log', args: args.map(a => String(a)) });
              originalConsole.log(...args);
            };

            console.error = (...args) => {
              testResults.consoleLogs.push({ type: 'error', args: args.map(a => String(a)) });
              testResults.runtimeErrors.push(`Console error: ${args.join(' ')}`);
              originalConsole.error(...args);
            };

            console.warn = (...args) => {
              testResults.consoleLogs.push({ type: 'warn', args: args.map(a => String(a)) });
              originalConsole.warn(...args);
            };

            console.info = (...args) => {
              testResults.consoleLogs.push({ type: 'info', args: args.map(a => String(a)) });
              originalConsole.info(...args);
            };

            // Capture unhandled errors
            window.addEventListener('error', (event) => {
              testResults.runtimeErrors.push(`Runtime error: ${event.message} at ${event.filename}:${event.lineno}`);
              testResults.success = false;
            });

            window.addEventListener('unhandledrejection', (event) => {
              testResults.runtimeErrors.push(`Unhandled promise rejection: ${event.reason}`);
              testResults.success = false;
            });
          </script>
        </body>
      </html>
    `, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      url: CONFIG.baseUrl
    });

    // Execute JavaScript in the DOM context
    try {
      dom.window.eval(jsCode);

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if React app mounted
      const rootElement = dom.window.document.getElementById('root');
      if (rootElement && rootElement.children.length > 0) {
        console.log('✅ React app mounted successfully');
        console.log(`🎯 Root element has ${rootElement.children.length} children`);

        // Check for common React elements
        const reactRoots = rootElement.querySelectorAll('[data-reactroot]');
        if (reactRoots.length > 0) {
          console.log('✅ React roots found');
        } else {
          testResults.domErrors.push('No React roots found in DOM');
        }

      } else {
        testResults.domErrors.push('React app did not mount - root element is empty');
        testResults.success = false;
      }

      // Check for error boundaries or fallback UI
      const errorElements = rootElement.querySelectorAll('[class*="error"], [class*="fallback"]');
      if (errorElements.length > 0) {
        console.log('⚠️  Error elements found in DOM');
        testResults.domErrors.push('Error boundaries or fallback UI are present');
      }

    } catch (error) {
      testResults.runtimeErrors.push(`JavaScript execution error: ${error.message}`);
      testResults.success = false;
    }

  } catch (error) {
    testResults.envIssues.push(`Environment setup error: ${error.message}`);
    testResults.success = false;
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');

  const requiredEnvVars = [
    'NODE_ENV',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      testResults.envIssues.push(`Missing environment variable: ${envVar}`);
    }
  }
}

async function generateReport() {
  console.log('\n📊 GENERATING RUNTIME TEST REPORT...');

  const report = {
    summary: {
      success: testResults.success,
      runtimeErrors: testResults.runtimeErrors.length,
      consoleLogs: testResults.consoleLogs.length,
      domErrors: testResults.domErrors.length,
      envIssues: testResults.envIssues.length
    },
    details: testResults
  };

  // Save JSON report
  fs.writeFileSync(
    path.join(__dirname, 'runtime-test-results.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate human-readable report
  const humanReport = `# Growth Echo Nexus - Runtime Test Report

## Test Summary
- **Date**: ${new Date().toLocaleString()}
- **Environment**: Node.js with JSDOM simulation
- **Overall Status**: ${testResults.success ? '✅ PASSED' : '❌ FAILED'}

## Issues Found

### Runtime Errors (${testResults.runtimeErrors.length})
${testResults.runtimeErrors.length > 0
  ? testResults.runtimeErrors.map((error, i) => `${i + 1}. ${error}`).join('\n')
  : 'No runtime errors detected'
}

### Console Output (${testResults.consoleLogs.length})
${testResults.consoleLogs.slice(0, 10).map((log, i) =>
  `${i + 1}. [${log.type.toUpperCase()}] ${log.args.join(' ')}`
).join('\n')}
${testResults.consoleLogs.length > 10 ? `... and ${testResults.consoleLogs.length - 10} more logs` : ''}

### DOM Issues (${testResults.domErrors.length})
${testResults.domErrors.length > 0
  ? testResults.domErrors.map((error, i) => `${i + 1}. ${error}`).join('\n')
  : 'No DOM issues detected'
}

### Environment Issues (${testResults.envIssues.length})
${testResults.envIssues.length > 0
  ? testResults.envIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
  : 'No environment issues detected'
}

## Analysis
${generateAnalysis()}

## Recommendations
${generateRecommendations()}

---

*This test simulates a browser environment using JSDOM. Some browser-specific APIs may behave differently in a real browser.*`;

  fs.writeFileSync(
    path.join(__dirname, 'runtime-test-report.md'),
    humanReport
  );

  console.log('✅ Runtime test reports saved to:');
  console.log('   - runtime-test-results.json');
  console.log('   - runtime-test-report.md');

  return report;
}

function generateAnalysis() {
  if (testResults.success) {
    return 'The application appears to be working correctly in the simulated environment. No runtime errors were detected, and the React app mounted successfully.';
  }

  let analysis = '';

  if (testResults.runtimeErrors.length > 0) {
    analysis += '\n**Runtime Errors Present**: The JavaScript code is encountering errors during execution.';
  }

  if (testResults.domErrors.length > 0) {
    analysis += '\n**DOM Issues**: The React application may not be mounting correctly or is showing error states.';
  }

  if (testResults.envIssues.length > 0) {
    analysis += '\n**Environment Configuration**: Missing environment variables may be causing issues.';
  }

  if (testResults.consoleLogs.length === 0) {
    analysis += '\n**Silent Application**: No console output detected, which may indicate the app is not initializing properly.';
  }

  return analysis || 'No specific issues identified, but the application is not functioning as expected.';
}

function generateRecommendations() {
  const recommendations = [];

  if (!testResults.success) {
    if (testResults.runtimeErrors.length > 0) {
      recommendations.push('1. **Check JavaScript dependencies**: Ensure all imports are correct and dependencies are installed.');
      recommendations.push('2. **Browser testing**: Test in a real browser to see actual error messages.');
      recommendations.push('3. **Console inspection**: Use browser dev tools to check for runtime errors.');
    }

    if (testResults.domErrors.length > 0) {
      recommendations.push('4. **React mounting**: Verify that the React app is mounting correctly.');
      recommendations.push('5. **Error boundaries**: Check if error boundaries are catching and suppressing errors.');
    }

    if (testResults.envIssues.length > 0) {
      recommendations.push('6. **Environment variables**: Ensure all required environment variables are set in production.');
    }

    recommendations.push('7. **Local testing**: Run the application locally to verify it works before deploying.');
  } else {
    recommendations.push('1. **Real browser testing**: Verify in actual browsers (Chrome, Firefox, Safari).');
    recommendations.push('2. **Mobile testing**: Test on mobile devices and different screen sizes.');
    recommendations.push('3. **Network conditions**: Test with slow network connections.');
    recommendations.push('4. **User interactions**: Test actual user flows and interactions.');
  }

  return recommendations.join('\n');
}

async function main() {
  console.log('🧪 Starting runtime environment test for Growth Echo Nexus');
  console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
  console.log('='.repeat(60));

  checkEnvironmentVariables();
  await simulateBrowserEnvironment();
  const report = await generateReport();

  console.log('='.repeat(60));
  console.log('📊 RUNTIME TEST SUMMARY:');
  console.log(`Overall Status: ${report.summary.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Runtime Errors: ${report.summary.runtimeErrors}`);
  console.log(`DOM Issues: ${report.summary.domErrors}`);
  console.log(`Environment Issues: ${report.summary.envIssues}`);

  if (!testResults.success) {
    console.log('\n❌ RUNTIME ISSUES DETECTED');
    process.exit(1);
  } else {
    console.log('\n✅ RUNTIME TESTS PASSED');
    process.exit(0);
  }
}

main().catch(console.error);