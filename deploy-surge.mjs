#!/usr/bin/env node

/**
 * Surge.sh Deployment Script
 * Simple, fast deployment to Surge.sh hosting
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

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

async function deploySurge() {
  const startTime = Date.now();
  
  log('cyan', '🚀 SURGE.SH DEPLOYMENT\n');

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

    // Step 2: Install Surge if needed
    info('2. Setting up Surge.sh...');
    try {
      execSync('npx surge --version', { stdio: 'pipe' });
      success('Surge.sh is ready');
    } catch {
      info('Installing Surge.sh...');
      execSync('npm install -g surge', { stdio: 'inherit' });
      success('Surge.sh installed');
    }

    // Step 3: Generate unique domain
    const randomId = randomBytes(4).toString('hex');
    const domain = `newomen-${randomId}.surge.sh`;
    
    info('3. Deploying to Surge.sh...');
    info(`Domain: ${domain}`);

    // Step 4: Create CNAME file for custom domain
    writeFileSync('dist/CNAME', domain);

    // Step 5: Deploy
    try {
      execSync(`echo "\\n\\n" | npx surge dist ${domain}`, { 
        stdio: 'inherit',
        shell: true 
      });
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      log('green', '\n🎉 DEPLOYMENT SUCCESSFUL!\n');
      success(`✅ Deployed in ${duration} seconds`);
      success(`✅ Application is live at: https://${domain}`);
      
      log('cyan', '\n🔗 YOUR LIVE URLS:');
      info(`• Main App: https://${domain}`);
      info(`• Admin Panel: https://${domain}/admin`);
      info(`• Authentication: https://${domain}/auth`);
      
      log('cyan', '\n🎯 NEXT STEPS:');
      info('1. Open your live application in browser');
      info('2. Test user registration and login');
      info('3. Configure OpenAI API key in admin panel');
      info('4. Test chat functionality');
      info('5. Share your live app with users!');

      // Generate deployment info
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        duration: `${duration}s`,
        platform: 'surge.sh',
        domain: domain,
        url: `https://${domain}`,
        status: 'success',
        features: {
          frontend: 'deployed',
          backend: 'supabase',
          functions: '24 edge functions',
          database: 'production ready',
          mobile: 'fully responsive'
        }
      };

      writeFileSync('surge-deployment.json', JSON.stringify(deploymentInfo, null, 2));
      success('Deployment info saved to surge-deployment.json');

    } catch (deployError) {
      error('Surge deployment failed');
      throw deployError;
    }

  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    
    log('cyan', '\n🔧 ALTERNATIVE OPTIONS:');
    info('1. Try Netlify: netlify deploy --prod --dir=dist');
    info('2. Try manual upload to any static hosting');
    info('3. Use the local preview: http://localhost:4173');
    
    process.exit(1);
  }
}

deploySurge();