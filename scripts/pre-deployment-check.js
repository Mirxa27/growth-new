#!/usr/bin/env node

/**
 * Pre-deployment Check Script
 * Validates the build and configuration before deployment
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { config } from 'dotenv';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}\n🔍 ${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.magenta}   ${msg}${colors.reset}`)
};

class DeploymentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = resolve(process.cwd());
  }

  // Check if file exists and log result
  checkFile(filePath, required = true, description = '') {
    const fullPath = join(this.projectRoot, filePath);
    const exists = existsSync(fullPath);
    
    if (exists) {
      log.success(`${description || filePath} exists`);
      return true;
    } else {
      const message = `${description || filePath} is missing`;
      if (required) {
        this.errors.push(message);
        log.error(message);
      } else {
        this.warnings.push(message);
        log.warning(message);
      }
      return false;
    }
  }

  // Check directory and its contents
  checkDirectory(dirPath, required = true, description = '') {
    const fullPath = join(this.projectRoot, dirPath);
    const exists = existsSync(fullPath);
    
    if (exists) {
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        log.success(`${description || dirPath} directory exists`);
        return true;
      } else {
        const message = `${description || dirPath} exists but is not a directory`;
        this.errors.push(message);
        log.error(message);
        return false;
      }
    } else {
      const message = `${description || dirPath} directory is missing`;
      if (required) {
        this.errors.push(message);
        log.error(message);
      } else {
        this.warnings.push(message);
        log.warning(message);
      }
      return false;
    }
  }

  // Check package.json and dependencies
  checkPackageJson() {
    log.header('Checking package.json and dependencies');
    
    if (!this.checkFile('package.json', true, 'package.json')) {
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf8'));
      
      // Check required scripts
      const requiredScripts = ['build', 'dev', 'preview'];
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          log.success(`Script "${script}" is defined`);
        } else {
          const message = `Required script "${script}" is missing`;
          this.errors.push(message);
          log.error(message);
        }
      });

      // Check required dependencies
      const requiredDeps = ['react', 'react-dom', 'vite', '@supabase/supabase-js'];
      requiredDeps.forEach(dep => {
        if ((packageJson.dependencies && packageJson.dependencies[dep]) ||
            (packageJson.devDependencies && packageJson.devDependencies[dep])) {
          log.success(`Dependency "${dep}" is installed`);
        } else {
          const message = `Required dependency "${dep}" is missing`;
          this.errors.push(message);
          log.error(message);
        }
      });

      // Check Capacitor dependencies for mobile
      const capacitorDeps = ['@capacitor/core', '@capacitor/ios'];
      let hasCapacitor = false;
      capacitorDeps.forEach(dep => {
        if ((packageJson.dependencies && packageJson.dependencies[dep]) ||
            (packageJson.devDependencies && packageJson.devDependencies[dep])) {
          hasCapacitor = true;
        }
      });
      
      if (hasCapacitor) {
        log.success('Capacitor dependencies found - mobile support enabled');
      } else {
        log.warning('Capacitor dependencies not found - mobile features may not work');
      }

      return true;
    } catch (error) {
      const message = `Failed to parse package.json: ${error.message}`;
      this.errors.push(message);
      log.error(message);
      return false;
    }
  }

  // Check TypeScript configuration
  checkTypeScriptConfig() {
    log.header('Checking TypeScript configuration');
    
    this.checkFile('tsconfig.json', true, 'TypeScript config');
    this.checkFile('tsconfig.app.json', false, 'App TypeScript config');
    this.checkFile('tsconfig.node.json', false, 'Node TypeScript config');
    
    return true;
  }

  // Check Vite configuration
  checkViteConfig() {
    log.header('Checking Vite configuration');
    
    const viteConfigs = ['vite.config.ts', 'vite.config.js'];
    let hasViteConfig = false;
    
    viteConfigs.forEach(config => {
      if (this.checkFile(config, false, 'Vite config')) {
        hasViteConfig = true;
      }
    });
    
    if (!hasViteConfig) {
      const message = 'No Vite configuration file found';
      this.errors.push(message);
      log.error(message);
    }
    
    return hasViteConfig;
  }

  // Check environment configuration
  checkEnvironmentConfig() {
    log.header('Checking environment configuration');
    
    // Check for environment files
    this.checkFile('.env.example', false, 'Environment template');
    
    const hasEnvLocal = this.checkFile('.env.local', false, 'Local environment file');
    const hasEnv = this.checkFile('.env', false, 'Environment file');
    
    if (!hasEnvLocal && !hasEnv) {
      log.warning('No environment files found - make sure environment variables are set in Vercel');
    }

    // Load and validate environment variables
    try {
      config({ path: '.env.local' });
      config({ path: '.env' });
      
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ];
      
      requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
          log.success(`Environment variable ${envVar} is set`);
        } else {
          log.warning(`Environment variable ${envVar} is not set locally`);
        }
      });
      
      // Check optional but recommended variables
      const optionalEnvVars = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'VITE_APP_URL'
      ];
      
      optionalEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
          log.success(`Optional environment variable ${envVar} is set`);
        } else {
          log.warning(`Optional environment variable ${envVar} is not set`);
        }
      });
      
    } catch (error) {
      log.warning(`Could not load environment variables: ${error.message}`);
    }
    
    return true;
  }

  // Check source code structure
  checkSourceStructure() {
    log.header('Checking source code structure');
    
    // Check main directories
    this.checkDirectory('src', true, 'Source directory');
    this.checkDirectory('public', true, 'Public directory');
    this.checkDirectory('src/components', true, 'Components directory');
    this.checkDirectory('src/pages', false, 'Pages directory');
    this.checkDirectory('src/services', false, 'Services directory');
    this.checkDirectory('src/hooks', false, 'Hooks directory');
    
    // Check key files
    this.checkFile('src/main.tsx', true, 'Main entry point');
    this.checkFile('src/App.tsx', true, 'App component');
    this.checkFile('index.html', true, 'HTML template');
    
    // Check for critical components
    this.checkFile('src/integrations/supabase/client.ts', false, 'Supabase client');
    this.checkFile('src/components/ui', false, 'UI components directory');
    
    return true;
  }

  // Check build output
  checkBuildOutput() {
    log.header('Checking build output');
    
    if (!this.checkDirectory('dist', false, 'Build output directory')) {
      log.info('Build output not found - this is normal if you haven\'t built yet');
      return true;
    }
    
    // Check for key build files
    this.checkFile('dist/index.html', false, 'Built HTML file');
    this.checkDirectory('dist/assets', false, 'Built assets directory');
    
    // Check build size
    try {
      const distPath = join(this.projectRoot, 'dist');
      const stats = statSync(distPath);
      log.info(`Build directory exists (created: ${stats.mtime.toISOString()})`);
    } catch (error) {
      log.warning('Could not read build directory stats');
    }
    
    return true;
  }

  // Check Vercel configuration
  checkVercelConfig() {
    log.header('Checking Vercel configuration');
    
    if (this.checkFile('vercel.json', false, 'Vercel configuration')) {
      try {
        const vercelConfig = JSON.parse(readFileSync(join(this.projectRoot, 'vercel.json'), 'utf8'));
        
        // Check required Vercel settings
        if (vercelConfig.buildCommand) {
          log.success(`Build command configured: ${vercelConfig.buildCommand}`);
        } else {
          log.warning('No build command specified in vercel.json');
        }
        
        if (vercelConfig.outputDirectory) {
          log.success(`Output directory configured: ${vercelConfig.outputDirectory}`);
        } else {
          log.warning('No output directory specified in vercel.json');
        }
        
        if (vercelConfig.framework) {
          log.success(`Framework configured: ${vercelConfig.framework}`);
        }
        
        if (vercelConfig.rewrites) {
          log.success('URL rewrites configured for SPA');
        } else {
          log.warning('No URL rewrites configured - SPA routing may not work');
        }
        
      } catch (error) {
        log.warning(`Could not parse vercel.json: ${error.message}`);
      }
    }
    
    return true;
  }

  // Check mobile configuration
  checkMobileConfig() {
    log.header('Checking mobile configuration');
    
    if (this.checkFile('capacitor.config.ts', false, 'Capacitor configuration')) {
      this.checkDirectory('ios', false, 'iOS project directory');
      this.checkDirectory('android', false, 'Android project directory');
      
      if (this.checkDirectory('ios/App', false, 'iOS app directory')) {
        this.checkFile('ios/App/App/Info.plist', false, 'iOS Info.plist');
        this.checkFile('ios/App/App.xcodeproj/project.pbxproj', false, 'Xcode project file');
      }
      
      log.success('Mobile configuration appears to be set up');
    } else {
      log.info('No mobile configuration found - web-only deployment');
    }
    
    return true;
  }

  // Check security configuration
  checkSecurity() {
    log.header('Checking security configuration');
    
    // Check for security headers in Vercel config
    try {
      if (existsSync(join(this.projectRoot, 'vercel.json'))) {
        const vercelConfig = JSON.parse(readFileSync(join(this.projectRoot, 'vercel.json'), 'utf8'));
        
        if (vercelConfig.headers) {
          log.success('Security headers configured in vercel.json');
        } else {
          log.warning('No security headers configured');
        }
      }
    } catch (error) {
      log.warning('Could not check security headers configuration');
    }
    
    // Check for sensitive files that shouldn't be deployed
    const sensitiveFiles = ['.env', '.env.local', '.env.production'];
    sensitiveFiles.forEach(file => {
      if (existsSync(join(this.projectRoot, file))) {
        log.warning(`Sensitive file ${file} found - ensure it's in .gitignore`);
      }
    });
    
    // Check .gitignore
    if (this.checkFile('.gitignore', false, 'Git ignore file')) {
      try {
        const gitignore = readFileSync(join(this.projectRoot, '.gitignore'), 'utf8');
        const requiredIgnores = ['node_modules', 'dist', '.env.local', '.env'];
        
        requiredIgnores.forEach(ignore => {
          if (gitignore.includes(ignore)) {
            log.success(`${ignore} is properly ignored`);
          } else {
            log.warning(`${ignore} should be added to .gitignore`);
          }
        });
      } catch (error) {
        log.warning('Could not read .gitignore file');
      }
    }
    
    return true;
  }

  // Run all checks
  async runAllChecks() {
    log.info('🚀 Starting pre-deployment checks for Newomen Platform...\n');
    
    const checks = [
      () => this.checkPackageJson(),
      () => this.checkTypeScriptConfig(),
      () => this.checkViteConfig(),
      () => this.checkEnvironmentConfig(),
      () => this.checkSourceStructure(),
      () => this.checkBuildOutput(),
      () => this.checkVercelConfig(),
      () => this.checkMobileConfig(),
      () => this.checkSecurity()
    ];
    
    for (const check of checks) {
      try {
        await check();
      } catch (error) {
        const message = `Check failed: ${error.message}`;
        this.errors.push(message);
        log.error(message);
      }
    }
    
    // Summary
    console.log(`\n${colors.cyan}📊 Pre-deployment Check Summary${colors.reset}`);
    console.log('=====================================');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('All checks passed! ✨');
      console.log(`${colors.green}🎉 Your project is ready for deployment!${colors.reset}`);
      return true;
    } else {
      if (this.errors.length > 0) {
        console.log(`${colors.red}\n❌ Errors found (${this.errors.length}):${colors.reset}`);
        this.errors.forEach((error, index) => {
          console.log(`${colors.red}   ${index + 1}. ${error}${colors.reset}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log(`${colors.yellow}\n⚠️  Warnings (${this.warnings.length}):${colors.reset}`);
        this.warnings.forEach((warning, index) => {
          console.log(`${colors.yellow}   ${index + 1}. ${warning}${colors.reset}`);
        });
      }
      
      if (this.errors.length > 0) {
        console.log(`${colors.red}\n🚫 Please fix the errors before deploying.${colors.reset}`);
        return false;
      } else {
        console.log(`${colors.yellow}\n⚠️  You can proceed with deployment, but consider addressing the warnings.${colors.reset}`);
        return true;
      }
    }
  }
}

// Run the checks if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new DeploymentChecker();
  checker.runAllChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`${colors.red}💥 Check process failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export { DeploymentChecker };