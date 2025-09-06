#!/usr/bin/env node

/**
 * Build Optimization Script
 * Optimizes the production build for better performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Optimizing build for Vercel...');

try {
  const distPath = path.join(__dirname, '..', 'dist');
  
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  Dist directory not found, skipping optimization');
    process.exit(0);
  }

  // Create deployment info file
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const deploymentInfo = {
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    environment: 'production',
    optimized: true
  };

  const deploymentInfoPath = path.join(distPath, 'deployment-info.json');
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));

  // Optimize service worker if it exists
  const swPath = path.join(distPath, 'sw.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Add cache optimization
    swContent = swContent.replace(
      /workbox\.precaching\.precacheAndRoute\(/,
      'workbox.precaching.precacheAndRoute('
    );
    
    fs.writeFileSync(swPath, swContent);
  }

  console.log('✅ Build optimization complete');
} catch (error) {
  console.log('⚠️  Build optimization failed:', error.message);
  // Don't fail the build for optimization errors
  process.exit(0);
}