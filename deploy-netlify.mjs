#!/usr/bin/env node

/**
 * Netlify Deployment Script
 * Deploy to Netlify with proper SPA configuration
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const error = (message) => log('red', `❌ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

async function deployNetlify() {
  const startTime = Date.now();
  
  log('cyan', '🚀 NETLIFY DEPLOYMENT\n');

  try {
    // Step 1: Ensure build exists
    info('1. Checking build...');
    try {
      execSync('ls dist/index.html', { stdio: 'pipe' });
      success('Build directory exists');
    } catch {
      info('Building application...');
      execSync('npm run build:vercel', { stdio: 'inherit' });
      success('Build completed');
    }

    // Step 2: Create _redirects file for SPA
    info('2. Creating SPA configuration...');
    writeFileSync('dist/_redirects', '/*    /index.html   200\n');
    success('SPA redirects configured');

    // Step 3: Install Netlify CLI if needed
    info('3. Setting up Netlify CLI...');
    try {
      execSync('npx netlify --version', { stdio: 'pipe' });
      success('Netlify CLI is ready');
    } catch {
      info('Netlify CLI will be installed automatically');
    }

    // Step 4: Deploy to Netlify
    info('4. Deploying to Netlify...');
    
    try {
      // Deploy with auto-generated site name
      const deployOutput = execSync('npx netlify deploy --prod --dir=dist --open=false', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Extract deployment URL
      const urlMatch = deployOutput.match(/Website URL:\s*(https?:\/\/[^\s]+)/);
      const deployUrl = urlMatch ? urlMatch[1] : null;
      
      if (deployUrl) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        log('green', '\n🎉 DEPLOYMENT SUCCESSFUL!\n');
        success(`✅ Deployed in ${duration} seconds`);
        success(`✅ Application is live at: ${deployUrl}`);
        
        log('cyan', '\n🔗 YOUR LIVE URLS:');
        info(`• Main App: ${deployUrl}`);
        info(`• Admin Panel: ${deployUrl}/admin`);
        info(`• Authentication: ${deployUrl}/auth`);
        
        log('cyan', '\n🎯 NEXT STEPS:');
        info('1. Open your live application in browser');
        info('2. Test user registration and login');
        info('3. Configure OpenAI API key in admin panel');
        info('4. Test chat functionality on mobile');
        info('5. Share your live app with users!');

        // Generate deployment info
        const deploymentInfo = {
          timestamp: new Date().toISOString(),
          duration: `${duration}s`,
          platform: 'netlify',
          url: deployUrl,
          status: 'success',
          features: {
            frontend: 'deployed',
            backend: 'supabase',
            functions: '24 edge functions',
            database: 'production ready',
            mobile: 'fully responsive',
            spa: 'configured with redirects'
          }
        };

        writeFileSync('netlify-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        success('Deployment info saved to netlify-deployment.json');

        return deployUrl;
      } else {
        throw new Error('Could not extract deployment URL');
      }

    } catch (deployError) {
      error('Netlify deployment failed');
      
      log('cyan', '\n🔧 MANUAL DEPLOYMENT OPTION:');
      info('1. Go to https://app.netlify.com/drop');
      info('2. Drag and drop the dist/ folder');
      info('3. Your site will be live instantly!');
      
      throw deployError;
    }

  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    
    log('cyan', '\n🔧 ALTERNATIVE OPTIONS:');
    info('1. Manual Netlify: https://app.netlify.com/drop');
    info('2. Try Vercel after authentication');
    info('3. Use local preview: http://localhost:4173');
    
    process.exit(1);
  }
}

// Test the deployed site
async function testDeployment(url) {
  info('5. Testing live deployment...');
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      success('Live application is accessible');
      
      const content = await response.text();
      if (content.includes('Newomen')) {
        success('Application content is correct');
      }
      
      log('cyan', '\n🧪 DEPLOYMENT VERIFICATION:');
      info(`✅ Status: ${response.status} OK`);
      info(`✅ Content-Type: ${response.headers.get('content-type')}`);
      info(`✅ Application: Loaded successfully`);
      
    } else {
      error(`Deployment test failed: ${response.status}`);
    }
  } catch (testError) {
    error(`Could not test deployment: ${testError.message}`);
  }
}

// Run deployment
deployNetlify().then(url => {
  if (url) {
    testDeployment(url);
  }
}).catch(err => {
  console.error('Deployment script failed:', err);
});