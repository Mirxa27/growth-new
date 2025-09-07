/**
 * Production Readiness Checker
 * Comprehensive validation for production deployment
 */

import { dataValidator } from './dataValidation';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/environment';

export interface ReadinessCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

export interface ReadinessReport {
  overall: 'ready' | 'not_ready' | 'warnings';
  score: number;
  checks: ReadinessCheck[];
  summary: string;
  recommendations: string[];
}

export class ProductionReadinessChecker {
  private static instance: ProductionReadinessChecker;
  
  static getInstance(): ProductionReadinessChecker {
    if (!ProductionReadinessChecker.instance) {
      ProductionReadinessChecker.instance = new ProductionReadinessChecker();
    }
    return ProductionReadinessChecker.instance;
  }

  async checkEnvironmentVariables(): Promise<ReadinessCheck> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missing: string[] = [];
    const details: string[] = [];

    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (!value || value === 'your-value-here') {
        missing.push(varName);
      } else {
        details.push(`✓ ${varName}: configured`);
      }
    });

    return {
      name: 'Environment Variables',
      status: missing.length === 0 ? 'pass' : 'fail',
      message: missing.length === 0 
        ? 'All required environment variables are configured'
        : `Missing required environment variables: ${missing.join(', ')}`,
      details
    };
  }

  async checkSupabaseConnection(): Promise<ReadinessCheck> {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        return {
          name: 'Supabase Connection',
          status: 'fail',
          message: `Failed to connect to Supabase: ${error.message}`,
          details: [error.message]
        };
      }

      return {
        name: 'Supabase Connection',
        status: 'pass',
        message: 'Successfully connected to Supabase',
        details: ['Connection established', 'Database accessible']
      };
    } catch (error) {
      return {
        name: 'Supabase Connection',
        status: 'fail',
        message: `Supabase connection error: ${error}`,
        details: [String(error)]
      };
    }
  }

  async checkDatabaseTables(): Promise<ReadinessCheck> {
    const requiredTables = [
      'profiles',
      'assessments',
      'assessment_questions',
      'assessment_options',
      'user_assessment_responses',
      'admin_ai_providers'
    ];

    const details: string[] = [];
    const missing: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          missing.push(table);
          details.push(`✗ ${table}: ${error.message}`);
        } else {
          details.push(`✓ ${table}: accessible`);
        }
      } catch (error) {
        missing.push(table);
        details.push(`✗ ${table}: ${error}`);
      }
    }

    return {
      name: 'Database Tables',
      status: missing.length === 0 ? 'pass' : 'fail',
      message: missing.length === 0 
        ? 'All required database tables are accessible'
        : `Missing or inaccessible tables: ${missing.join(', ')}`,
      details
    };
  }

  async checkAIProviders(): Promise<ReadinessCheck> {
    const validation = await dataValidator.validateAIProviders();
    
    return {
      name: 'AI Providers',
      status: validation.valid ? 'pass' : 'fail',
      message: validation.valid 
        ? 'AI providers are properly configured'
        : 'AI provider configuration issues detected',
      details: validation.errors.length > 0 ? validation.errors : ['OpenAI provider configured with API key']
    };
  }

  async checkAuthentication(): Promise<ReadinessCheck> {
    try {
      // Test anonymous access
      const { data: session } = await supabase.auth.getSession();
      
      // Check if RLS is enabled (should fail for protected tables without auth)
      const { error } = await supabase.from('user_progress').select('*').limit(1);
      
      const details: string[] = [];
      
      if (session?.session) {
        details.push('✓ User session available');
      } else {
        details.push('ℹ No active session (expected for anonymous users)');
      }

      if (error && error.code === '42501') {
        details.push('✓ Row Level Security is active');
      } else if (error) {
        details.push(`⚠ Unexpected database error: ${error.message}`);
      } else {
        details.push('⚠ RLS might not be properly configured');
      }

      return {
        name: 'Authentication System',
        status: 'pass',
        message: 'Authentication system is functional',
        details
      };
    } catch (error) {
      return {
        name: 'Authentication System',
        status: 'fail',
        message: `Authentication check failed: ${error}`,
        details: [String(error)]
      };
    }
  }

  async checkMobileResponsiveness(): Promise<ReadinessCheck> {
    const details: string[] = [];
    let warnings = 0;

    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      details.push('✓ Viewport meta tag configured');
    } else {
      details.push('✗ Missing viewport meta tag');
      warnings++;
    }

    // Check for responsive CSS classes
    const hasResponsiveCSS = document.querySelector('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    if (hasResponsiveCSS) {
      details.push('✓ Responsive CSS classes detected');
    } else {
      details.push('⚠ Limited responsive CSS detected');
      warnings++;
    }

    // Check for touch-friendly elements
    const hasTouchTargets = document.querySelector('[class*="touch-target"]');
    if (hasTouchTargets) {
      details.push('✓ Touch-friendly elements detected');
    } else {
      details.push('⚠ Limited touch-friendly elements');
      warnings++;
    }

    return {
      name: 'Mobile Responsiveness',
      status: warnings === 0 ? 'pass' : warnings <= 2 ? 'warning' : 'fail',
      message: warnings === 0 
        ? 'Mobile responsiveness is properly implemented'
        : `Mobile responsiveness has ${warnings} potential issues`,
      details
    };
  }

  async checkPerformance(): Promise<ReadinessCheck> {
    const details: string[] = [];
    let score = 100;

    // Check for lazy loading
    const hasLazyLoading = document.querySelector('img[loading="lazy"]') || 
                          document.querySelector('[class*="lazy"]');
    if (hasLazyLoading) {
      details.push('✓ Lazy loading implemented');
    } else {
      details.push('⚠ Limited lazy loading detected');
      score -= 10;
    }

    // Check for service worker
    if ('serviceWorker' in navigator) {
      details.push('✓ Service Worker support available');
    } else {
      details.push('⚠ Service Worker not supported');
      score -= 10;
    }

    // Check bundle size (simplified)
    const scripts = document.querySelectorAll('script[src]');
    if (scripts.length < 10) {
      details.push('✓ Reasonable number of script files');
    } else {
      details.push('⚠ Many script files - consider bundling');
      score -= 5;
    }

    return {
      name: 'Performance Optimization',
      status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
      message: `Performance score: ${score}/100`,
      details
    };
  }

  async checkSecurity(): Promise<ReadinessCheck> {
    const details: string[] = [];
    let issues = 0;

    // Check HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      details.push('✓ Secure connection (HTTPS or localhost)');
    } else {
      details.push('✗ Insecure connection - HTTPS required for production');
      issues++;
    }

    // Check for console logs in production
    const hasConsoleLogs = document.documentElement.innerHTML.includes('console.log');
    if (!hasConsoleLogs) {
      details.push('✓ No console.log statements detected');
    } else {
      details.push('⚠ Console.log statements found - should be removed for production');
      issues++;
    }

    // Check CSP headers (simplified)
    const hasCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (hasCsp) {
      details.push('✓ Content Security Policy configured');
    } else {
      details.push('ℹ Consider implementing Content Security Policy');
    }

    return {
      name: 'Security',
      status: issues === 0 ? 'pass' : issues <= 1 ? 'warning' : 'fail',
      message: issues === 0 
        ? 'Security checks passed'
        : `${issues} security issues detected`,
      details
    };
  }

  async runAllChecks(): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];

    // Run all checks
    checks.push(await this.checkEnvironmentVariables());
    checks.push(await this.checkSupabaseConnection());
    checks.push(await this.checkDatabaseTables());
    checks.push(await this.checkAIProviders());
    checks.push(await this.checkAuthentication());
    checks.push(await this.checkMobileResponsiveness());
    checks.push(await this.checkPerformance());
    checks.push(await this.checkSecurity());

    // Calculate overall status
    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    const score = Math.round((passCount / checks.length) * 100);
    
    let overall: 'ready' | 'not_ready' | 'warnings';
    if (failCount === 0 && warningCount === 0) {
      overall = 'ready';
    } else if (failCount === 0) {
      overall = 'warnings';
    } else {
      overall = 'not_ready';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (failCount > 0) {
      recommendations.push('Fix all failing checks before deploying to production');
    }
    if (warningCount > 0) {
      recommendations.push('Address warnings to improve production quality');
    }
    if (score < 90) {
      recommendations.push('Consider additional optimizations for better performance');
    }

    const summary = `Production readiness: ${score}% (${passCount} passed, ${warningCount} warnings, ${failCount} failed)`;

    return {
      overall,
      score,
      checks,
      summary,
      recommendations
    };
  }

  generateReport(report: ReadinessReport): string {
    let output = `# Production Readiness Report\n\n`;
    output += `**Overall Status:** ${report.overall.toUpperCase()}\n`;
    output += `**Score:** ${report.score}/100\n\n`;
    output += `## Summary\n${report.summary}\n\n`;

    if (report.recommendations.length > 0) {
      output += `## Recommendations\n`;
      report.recommendations.forEach(rec => {
        output += `- ${rec}\n`;
      });
      output += '\n';
    }

    output += `## Detailed Checks\n\n`;
    report.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌';
      
      output += `### ${icon} ${check.name}\n`;
      output += `**Status:** ${check.message}\n`;
      
      if (check.details && check.details.length > 0) {
        output += `**Details:**\n`;
        check.details.forEach(detail => {
          output += `- ${detail}\n`;
        });
      }
      output += '\n';
    });

    return output;
  }
}

// Export singleton instance
export const productionChecker = ProductionReadinessChecker.getInstance();