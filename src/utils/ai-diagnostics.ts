/**
 * AI Provider Diagnostics Tool
 * Comprehensive analysis and troubleshooting for AI configurations
 */

import { env } from '@/config/environment';
import { voiceService } from '@/services';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  fix?: string;
}

export class AIDiagnostics {
  private results: DiagnosticResult[] = [];

  /**
   * Run complete diagnostics
   */
  async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];
    
    logger.info('Starting AI Provider Diagnostics...', 'Diagnostics');
    
    // 1. Check environment configuration
    await this.checkEnvironmentConfig();
    
    // 2. Check OpenAI configuration
    await this.checkOpenAIConfig();
    
    // 3. Check Supabase configuration
    await this.checkSupabaseConfig();
    
    // 4. Check voice agent configuration
    await this.checkVoiceAgentConfig();
    
    // 5. Check database tables
    await this.checkDatabaseTables();
    
    // 6. Check network connectivity
    await this.checkNetworkConnectivity();
    
    // 7. Check browser compatibility
    this.checkBrowserCompatibility();
    
    // 8. Generate summary
    this.generateSummary();
    
    return this.results;
  }

  /**
   * Check environment configuration
   */
  private async checkEnvironmentConfig(): Promise<void> {
    logger.debug('Checking environment configuration...', 'Diagnostics');
    
    // Check if .env file exists
    const hasEnvFile = await this.checkEnvFile();
    
    // Check OpenAI API key
    if (!env.openai.apiKey || env.openai.apiKey === 'sk-proj-REPLACE_WITH_YOUR_KEY') {
      this.results.push({
        category: 'Environment',
        status: 'error',
        message: 'OpenAI API key not configured',
        details: {
          current: env.openai.apiKey ? 'Placeholder value detected' : 'Not set',
          required: true
        },
        fix: 'Add your OpenAI API key to .env file: VITE_OPENAI_API_KEY=sk-...'
      });
    } else {
      this.results.push({
        category: 'Environment',
        status: 'success',
        message: 'OpenAI API key is configured',
        details: {
          keyPrefix: env.openai.apiKey.substring(0, 10) + '...'
        }
      });
    }
    
    // Check Supabase configuration
    if (!env.supabase.url || !env.supabase.anonKey) {
      this.results.push({
        category: 'Environment',
        status: 'error',
        message: 'Supabase configuration missing',
        fix: 'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
      });
    } else {
      this.results.push({
        category: 'Environment',
        status: 'success',
        message: 'Supabase configuration is present',
        details: {
          url: env.supabase.url
        }
      });
    }
  }

  /**
   * Check if .env file exists
   */
  private async checkEnvFile(): Promise<boolean> {
    try {
      // Check if we have any environment variables set
      const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
      const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;
      
      if (!hasOpenAI && !hasSupabase) {
        this.results.push({
          category: 'Environment',
          status: 'error',
          message: '.env file not found or not loaded',
          fix: 'Create a .env file in the project root with required variables'
        });
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check OpenAI configuration and connectivity
   */
  private async checkOpenAIConfig(): Promise<void> {
    logger.debug('Checking OpenAI configuration...', 'Diagnostics');
    
    if (!env.openai.apiKey || env.openai.apiKey.includes('REPLACE')) {
      this.results.push({
        category: 'OpenAI',
        status: 'error',
        message: 'OpenAI API key not properly configured',
        fix: 'Please add a valid OpenAI API key to your .env file'
      });
      return;
    }
    
    try {
      // Test OpenAI API connection
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${env.openai.apiKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          category: 'OpenAI',
          status: 'success',
          message: 'OpenAI API connection successful',
          details: {
            modelsAvailable: data.data?.length || 0,
            hasRealtimeModel: data.data?.some((m: any) => m.id.includes('realtime'))
          }
        });
      } else {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        this.results.push({
          category: 'OpenAI',
          status: 'error',
          message: 'OpenAI API connection failed',
          details: {
            status: response.status,
            error: error.error?.message
          },
          fix: 'Check if your API key is valid and has proper permissions'
        });
      }
    } catch (error) {
      this.results.push({
        category: 'OpenAI',
        status: 'error',
        message: 'Failed to connect to OpenAI API',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        fix: 'Check your internet connection and API key'
      });
    }
  }

  /**
   * Check Supabase configuration
   */
  private async checkSupabaseConfig(): Promise<void> {
    logger.debug('Checking Supabase configuration...', 'Diagnostics');
    
    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        this.results.push({
          category: 'Supabase',
          status: 'error',
          message: 'Supabase connection failed',
          details: { error: error.message },
          fix: 'Check Supabase URL and anon key in .env file'
        });
      } else {
        this.results.push({
          category: 'Supabase',
          status: 'success',
          message: 'Supabase connection successful'
        });
      }
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        this.results.push({
          category: 'Supabase',
          status: 'warning',
          message: 'No active user session',
          fix: 'User needs to be logged in for full functionality'
        });
      }
    } catch (error) {
      this.results.push({
        category: 'Supabase',
        status: 'error',
        message: 'Supabase configuration error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Check voice agent configuration
   */
  private async checkVoiceAgentConfig(): Promise<void> {
    logger.debug('Checking voice agent configuration...', 'Diagnostics');
    
    // Check if voice is enabled
    if (!voiceService.isVoiceEnabled()) {
      this.results.push({
        category: 'Voice Agent',
        status: 'error',
        message: 'Voice features are disabled',
        details: {
          hasApiKey: !!env.openai.apiKey,
          featureEnabled: env.features.voiceChat
        },
        fix: 'Ensure OpenAI API key is set and VITE_ENABLE_VOICE_CHAT=true'
      });
      return;
    }
    
    // Get active voice configuration
    const { data: config, error } = await voiceService.getActiveConfig();
    
    if (error) {
      this.results.push({
        category: 'Voice Agent',
        status: 'error',
        message: 'Failed to load voice configuration',
        details: { error: error.message },
        fix: 'Check database connection and voice_agent_configs table'
      });
    } else if (config) {
      this.results.push({
        category: 'Voice Agent',
        status: 'success',
        message: 'Voice configuration loaded',
        details: {
          name: config.name,
          model: config.model,
          voice: config.voice,
          isActive: config.is_active
        }
      });
      
      // Test the configuration
      if (config.id) {
        const testResult = await voiceService.testConfiguration(config.id);
        if (testResult.data?.success) {
          this.results.push({
            category: 'Voice Agent',
            status: 'success',
            message: 'Voice configuration test passed',
            details: testResult.data
          });
        } else {
          this.results.push({
            category: 'Voice Agent',
            status: 'error',
            message: 'Voice configuration test failed',
            details: testResult.data,
            fix: 'Check OpenAI API key and model availability'
          });
        }
      }
    } else {
      this.results.push({
        category: 'Voice Agent',
        status: 'warning',
        message: 'No voice configuration found',
        fix: 'Create a voice configuration in the admin panel'
      });
    }
    
    // Check microphone permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.results.push({
        category: 'Voice Agent',
        status: 'success',
        message: 'Microphone access granted'
      });
    } catch (error) {
      this.results.push({
        category: 'Voice Agent',
        status: 'warning',
        message: 'Microphone access not granted',
        details: { error: error instanceof Error ? error.message : 'Permission denied' },
        fix: 'Grant microphone permission when prompted'
      });
    }
  }

  /**
   * Check database tables
   */
  private async checkDatabaseTables(): Promise<void> {
    logger.debug('Checking database tables...', 'Diagnostics');
    
    const requiredTables = [
      'voice_agent_configs',
      'voice_sessions',
      'profiles',
      'assessments',
      'community_posts'
    ];
    
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        
        if (error) {
          this.results.push({
            category: 'Database',
            status: 'error',
            message: `Table '${table}' is not accessible`,
            details: { error: error.message },
            fix: `Run migrations to create the ${table} table`
          });
        } else {
          this.results.push({
            category: 'Database',
            status: 'success',
            message: `Table '${table}' is accessible`
          });
        }
      } catch (error) {
        this.results.push({
          category: 'Database',
          status: 'error',
          message: `Failed to check table '${table}'`,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<void> {
    logger.debug('Checking network connectivity...', 'Diagnostics');
    
    // Check OpenAI endpoint
    try {
      const response = await fetch('https://api.openai.com/v1/models', { method: 'HEAD' });
      if (response.ok || response.status === 401) { // 401 is expected without auth
        this.results.push({
          category: 'Network',
          status: 'success',
          message: 'OpenAI API endpoint is reachable'
        });
      } else {
        this.results.push({
          category: 'Network',
          status: 'warning',
          message: 'OpenAI API endpoint returned unexpected status',
          details: { status: response.status }
        });
      }
    } catch (error) {
      this.results.push({
        category: 'Network',
        status: 'error',
        message: 'Cannot reach OpenAI API endpoint',
        details: { error: error instanceof Error ? error.message : 'Network error' },
        fix: 'Check internet connection and firewall settings'
      });
    }
    
    // Check WebSocket support for Realtime API
    if ('WebSocket' in window) {
      this.results.push({
        category: 'Network',
        status: 'success',
        message: 'WebSocket support available'
      });
    } else {
      this.results.push({
        category: 'Network',
        status: 'error',
        message: 'WebSocket not supported',
        fix: 'Voice features require WebSocket support. Please use a modern browser.'
      });
    }
  }

  /**
   * Check browser compatibility
   */
  private checkBrowserCompatibility(): void {
    logger.debug('Checking browser compatibility...', 'Diagnostics');
    
    const requirements = [
      { feature: 'WebSocket', supported: 'WebSocket' in window },
      { feature: 'AudioContext', supported: 'AudioContext' in window || 'webkitAudioContext' in window },
      { feature: 'MediaDevices', supported: 'mediaDevices' in navigator },
      { feature: 'getUserMedia', supported: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices }
    ];
    
    requirements.forEach(req => {
      if (req.supported) {
        this.results.push({
          category: 'Browser',
          status: 'success',
          message: `${req.feature} is supported`
        });
      } else {
        this.results.push({
          category: 'Browser',
          status: 'error',
          message: `${req.feature} is not supported`,
          fix: 'Please use a modern browser like Chrome, Firefox, or Safari'
        });
      }
    });
  }

  /**
   * Generate diagnostic summary
   */
  private generateSummary(): void {
    const errors = this.results.filter(r => r.status === 'error');
    const warnings = this.results.filter(r => r.status === 'warning');
    const successes = this.results.filter(r => r.status === 'success');
    
    logger.info('Diagnostic Summary', 'Diagnostics', {
      success: successes.length,
      warnings: warnings.length,
      errors: errors.length
    });
    
    if (errors.length > 0) {
      logger.warn('Required Fixes', 'Diagnostics', errors.map(e => ({
        message: e.message,
        fix: e.fix
      })));
    }
    
    this.results.push({
      category: 'Summary',
      status: errors.length === 0 ? 'success' : 'error',
      message: `Diagnostics complete: ${errors.length} errors, ${warnings.length} warnings`,
      details: {
        totalChecks: this.results.length - 1,
        errors: errors.length,
        warnings: warnings.length,
        successes: successes.length
      }
    });
  }

  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Get formatted HTML report
   */
  getHTMLReport(): string {
    let html = '<div class="diagnostic-report">';
    html += '<h2>AI Provider Diagnostic Report</h2>';
    
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      html += `<div class="category">`;
      html += `<h3>${category}</h3>`;
      
      categoryResults.forEach(result => {
        const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        html += `<div class="result ${result.status}">`;
        html += `<span class="icon">${icon}</span>`;
        html += `<span class="message">${result.message}</span>`;
        
        if (result.fix) {
          html += `<div class="fix">Fix: ${result.fix}</div>`;
        }
        
        if (result.details) {
          html += `<details><summary>Details</summary><pre>${JSON.stringify(result.details, null, 2)}</pre></details>`;
        }
        
        html += '</div>';
      });
      
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }
}

// Export singleton instance
export const aiDiagnostics = new AIDiagnostics();