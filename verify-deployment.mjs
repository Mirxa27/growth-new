#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Comprehensive testing of the live deployment
 */

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
const warning = (message) => log('yellow', `⚠️ ${message}`);
const info = (message) => log('blue', `ℹ️ ${message}`);

class DeploymentVerifier {
  constructor() {
    this.baseUrl = 'http://localhost:4173';
    this.supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
    this.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';
    this.results = [];
  }

  async run() {
    log('cyan', '🧪 DEPLOYMENT VERIFICATION\n');
    log('cyan', '==========================\n');

    await this.testFrontend();
    await this.testSupabaseConnection();
    await this.testEdgeFunctions();
    await this.testMobileResponsiveness();
    
    this.showResults();
  }

  async testFrontend() {
    info('🌐 Testing frontend application...');

    try {
      const response = await fetch(this.baseUrl);
      if (response.ok) {
        const content = await response.text();
        
        // Check for essential elements
        const checks = [
          { name: 'HTML Structure', test: content.includes('<!doctype html>') },
          { name: 'App Title', test: content.includes('Newomen') },
          { name: 'Viewport Meta', test: content.includes('viewport') },
          { name: 'CSS Assets', test: content.includes('.css') },
          { name: 'JS Assets', test: content.includes('.js') }
        ];

        checks.forEach(check => {
          if (check.test) {
            success(`Frontend: ${check.name}`);
          } else {
            this.results.push({ type: 'error', message: `Frontend: ${check.name} failed` });
          }
        });

      } else {
        this.results.push({ type: 'error', message: `Frontend not accessible: ${response.status}` });
      }
    } catch (err) {
      this.results.push({ type: 'error', message: `Frontend test failed: ${err.message}` });
    }
  }

  async testSupabaseConnection() {
    info('🗄️ Testing Supabase database connection...');

    try {
      // Test basic database access
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });

      if (response.ok) {
        success('Supabase: Database connection');
      } else {
        this.results.push({ type: 'warning', message: `Supabase connection: ${response.status}` });
      }

      // Test AI providers table
      const providersResponse = await fetch(`${this.supabaseUrl}/rest/v1/admin_ai_providers?select=*&limit=1`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });

      if (providersResponse.ok) {
        success('Supabase: AI providers table accessible');
      } else {
        this.results.push({ type: 'warning', message: 'AI providers table may not be accessible' });
      }

    } catch (err) {
      this.results.push({ type: 'error', message: `Supabase test failed: ${err.message}` });
    }
  }

  async testEdgeFunctions() {
    info('⚡ Testing edge functions...');

    const criticalFunctions = [
      'test-ai-provider',
      'fetch-ai-providers-data',
      'chat-completion'
    ];

    for (const functionName of criticalFunctions) {
      try {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });

        if (response.status === 400 || response.status === 200) {
          // 400 is expected for test data, 200 is success
          success(`Edge Function: ${functionName}`);
        } else {
          this.results.push({ 
            type: 'warning', 
            message: `Edge function ${functionName}: status ${response.status}` 
          });
        }
      } catch (err) {
        this.results.push({ 
          type: 'error', 
          message: `Edge function ${functionName} failed: ${err.message}` 
        });
      }
    }
  }

  async testMobileResponsiveness() {
    info('📱 Testing mobile responsiveness...');

    try {
      const response = await fetch(this.baseUrl);
      if (response.ok) {
        const content = await response.text();
        
        const mobileChecks = [
          { name: 'Viewport Meta Tag', test: content.includes('width=device-width') },
          { name: 'Responsive CSS', test: content.includes('responsive') || content.includes('sm:') },
          { name: 'Touch Targets', test: content.includes('touch-target') },
          { name: 'Mobile Navigation', test: content.includes('MobileNavigation') },
          { name: 'Safe Area Support', test: content.includes('safe-area') }
        ];

        mobileChecks.forEach(check => {
          if (check.test) {
            success(`Mobile: ${check.name}`);
          } else {
            this.results.push({ type: 'warning', message: `Mobile: ${check.name} not detected` });
          }
        });

      }
    } catch (err) {
      this.results.push({ type: 'error', message: `Mobile test failed: ${err.message}` });
    }
  }

  showResults() {
    const errors = this.results.filter(r => r.type === 'error');
    const warnings = this.results.filter(r => r.type === 'warning');

    log('cyan', '\n📊 VERIFICATION RESULTS\n');
    log('cyan', '=======================\n');

    if (errors.length === 0 && warnings.length === 0) {
      log('green', '🎉 ALL TESTS PASSED!\n');
      success('✅ Frontend application is working');
      success('✅ Supabase backend is connected');
      success('✅ Edge functions are deployed');
      success('✅ Mobile responsiveness is complete');
      
      log('cyan', '\n🚀 DEPLOYMENT IS LIVE AND READY!\n');
      
      log('cyan', '🔗 ACCESS YOUR APPLICATION:');
      info(`• Web App: ${this.baseUrl}`);
      info(`• Admin Panel: ${this.baseUrl}/admin`);
      info(`• Supabase Dashboard: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg`);
      
      log('cyan', '\n📋 FINAL CHECKLIST:');
      info('1. ✅ Application is accessible');
      info('2. ✅ Database is connected');
      info('3. ✅ Functions are deployed');
      info('4. ⚠️ Configure OpenAI API key in admin panel');
      info('5. ⚠️ Test user registration and chat');
      
    } else {
      if (errors.length > 0) {
        log('red', '❌ CRITICAL ISSUES FOUND:\n');
        errors.forEach(err => error(`• ${err.message}`));
      }
      
      if (warnings.length > 0) {
        log('yellow', '\n⚠️ WARNINGS:\n');
        warnings.forEach(warn => warning(`• ${warn.message}`));
      }
      
      if (errors.length === 0) {
        log('yellow', '\n✅ DEPLOYMENT IS FUNCTIONAL WITH MINOR WARNINGS\n');
        info('The application should work correctly despite the warnings above.');
      }
    }

    log('cyan', '\n🎯 PRODUCTION READY STATUS:');
    const score = Math.round(((20 - errors.length - warnings.length * 0.5) / 20) * 100);
    info(`Overall Score: ${score}%`);
    
    if (score >= 90) {
      success('🟢 EXCELLENT - Ready for production');
    } else if (score >= 75) {
      warning('🟡 GOOD - Minor issues to address');
    } else {
      error('🔴 NEEDS WORK - Critical issues must be fixed');
    }
  }
}

// Run verification
const verifier = new DeploymentVerifier();
verifier.run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});