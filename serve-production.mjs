#!/usr/bin/env node

/**
 * Production Server Script
 * Serve the built application with production settings
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  try {
    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': filePath.includes('/assets/') 
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
}

function startServer() {
  const PORT = process.env.PORT || 3000;
  const DIST_DIR = join(__dirname, 'dist');
  
  if (!existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run: npm run build');
    process.exit(1);
  }

  const server = createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Handle SPA routing - serve index.html for non-asset requests
    if (!filePath.startsWith('/assets/') && !filePath.includes('.')) {
      filePath = '/index.html';
    }
    
    const fullPath = join(DIST_DIR, filePath);
    
    // Security: ensure we're serving from dist directory only
    if (!fullPath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    
    if (existsSync(fullPath)) {
      serveFile(fullPath, res);
    } else {
      // For SPA, serve index.html for unknown routes
      serveFile(join(DIST_DIR, 'index.html'), res);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    log('cyan', '\n🚀 NEWOMEN PLATFORM - PRODUCTION SERVER\n');
    log('cyan', '=====================================\n');
    
    success(`✅ Server running on port ${PORT}`);
    success(`✅ Local access: http://localhost:${PORT}`);
    success(`✅ Network access: http://0.0.0.0:${PORT}`);
    
    log('cyan', '\n🔗 APPLICATION URLS:');
    info(`• Main App: http://localhost:${PORT}`);
    info(`• Admin Panel: http://localhost:${PORT}/admin`);
    info(`• Authentication: http://localhost:${PORT}/auth`);
    
    log('cyan', '\n📱 MOBILE TESTING:');
    info('• Open on your phone using network IP');
    info('• Test touch interactions and responsiveness');
    info('• Verify chat interface works properly');
    
    log('cyan', '\n🎯 NEXT STEPS:');
    info('1. Open http://localhost:3000 in browser');
    info('2. Test user registration and login');
    info('3. Configure OpenAI API key in admin panel');
    info('4. Test all features thoroughly');
    info('5. Deploy to production hosting when ready');
    
    log('cyan', '\n🛑 Press Ctrl+C to stop the server');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('cyan', '\n\n👋 Shutting down server...');
    server.close(() => {
      success('✅ Server stopped gracefully');
      process.exit(0);
    });
  });
}

// Start the server
startServer();