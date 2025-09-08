/**
 * Environment Validator Service
 * Validates and reports on environment configuration at startup
 */

import { env } from '@/config/environment';
import { toast } from '@/hooks/use-toast';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface ServiceStatus {
  name: string;
  status: 'configured' | 'missing' | 'invalid' | 'placeholder';
  required: boolean;
  message: string;
}

class EnvironmentValidatorService {
  private validationResults: ValidationResult | null = null;

  /**
   * Validate all environment configuration
   */
  async validateEnvironment(): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Validate OpenAI configuration
    const openaiStatus = this.validateOpenAI();
    if (openaiStatus.status === 'missing' && openaiStatus.required) {
      errors.push('OpenAI API key is required for AI features');
    } else if (openaiStatus.status === 'placeholder') {
      warnings.push('OpenAI API key is using placeholder value');
    } else if (openaiStatus.status === 'invalid') {
      errors.push('OpenAI API key format is invalid');
    }

    // Validate Supabase configuration
    const supabaseStatus = this.validateSupabase();
    if (supabaseStatus.status === 'missing') {
      errors.push('Supabase configuration is required');
    }

    // Validate feature flags
    const featureWarnings = this.validateFeatures();
    warnings.push(...featureWarnings);

    // Add recommendations
    if (env.openai.apiKey && !env.openai.organizationId) {
      recommendations.push('Consider setting VITE_OPENAI_ORGANIZATION_ID for better API management');
    }

    if (env.app.environment === 'production' && !env.security.jwtSecret) {
      recommendations.push('Set JWT_SECRET for enhanced security in production');
    }

    this.validationResults = {
      isValid: errors.length === 0,
      warnings,
      errors,
      recommendations
    };

    return this.validationResults;
  }

  /**
   * Get service status overview
   */
  getServiceStatus(): ServiceStatus[] {
    return [
      this.validateOpenAI(),
      this.validateSupabase(),
      this.validateVoiceFeatures(),
      this.validateAIFeatures()
    ];
  }

  /**
   * Validate OpenAI configuration
   */
  private validateOpenAI(): ServiceStatus {
    const apiKey = env.openai.apiKey;
    
    if (!apiKey) {
      return {
        name: 'OpenAI API',
        status: 'missing',
        required: true,
        message: 'API key not set. Set VITE_OPENAI_API_KEY in Vercel environment variables.'
      };
    }

    if (apiKey === 'your-openai-api-key-here') {
      return {
        name: 'OpenAI API',
        status: 'placeholder',
        required: true,
        message: 'Using placeholder API key. Replace with actual key from OpenAI.'
      };
    }

    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return {
        name: 'OpenAI API',
        status: 'invalid',
        required: true,
        message: 'API key format appears invalid. Should start with "sk-".'
      };
    }

    return {
      name: 'OpenAI API',
      status: 'configured',
      required: true,
      message: 'Configured and ready for use.'
    };
  }

  /**
   * Validate Supabase configuration
   */
  private validateSupabase(): ServiceStatus {
    const url = env.supabase.url;
    const key = env.supabase.anonKey;

    if (!url || !key) {
      return {
        name: 'Supabase Database',
        status: 'missing',
        required: true,
        message: 'Supabase URL or anonymous key not configured.'
      };
    }

    if (!url.includes('supabase.co')) {
      return {
        name: 'Supabase Database',
        status: 'invalid',
        required: true,
        message: 'Supabase URL format appears invalid.'
      };
    }

    return {
      name: 'Supabase Database',
      status: 'configured',
      required: true,
      message: 'Database connection configured.'
    };
  }

  /**
   * Validate voice features
   */
  private validateVoiceFeatures(): ServiceStatus {
    const isEnabled = env.features.voiceChat;
    const hasApiKey = env.openai.apiKey && env.openai.apiKey !== 'your-openai-api-key-here';

    if (isEnabled && !hasApiKey) {
      return {
        name: 'Voice Features',
        status: 'missing',
        required: false,
        message: 'Voice chat enabled but OpenAI API key missing.'
      };
    }

    if (!isEnabled) {
      return {
        name: 'Voice Features',
        status: 'missing',
        required: false,
        message: 'Voice chat disabled. Set VITE_ENABLE_VOICE_CHAT=true to enable.'
      };
    }

    return {
      name: 'Voice Features',
      status: 'configured',
      required: false,
      message: 'Voice chat ready and configured.'
    };
  }

  /**
   * Validate AI assessment features
   */
  private validateAIFeatures(): ServiceStatus {
    const isEnabled = env.features.aiAssessment;
    const hasApiKey = env.openai.apiKey && env.openai.apiKey !== 'your-openai-api-key-here';

    if (isEnabled && !hasApiKey) {
      return {
        name: 'AI Assessment',
        status: 'missing',
        required: false,
        message: 'AI assessment enabled but OpenAI API key missing.'
      };
    }

    return {
      name: 'AI Assessment',
      status: 'configured',
      required: false,
      message: 'AI assessment features ready.'
    };
  }

  /**
   * Validate feature flags
   */
  private validateFeatures(): string[] {
    const warnings: string[] = [];

    // Check for conflicting configurations
    if (env.features.voiceChat && !env.openai.apiKey) {
      warnings.push('Voice chat is enabled but no OpenAI API key is configured');
    }

    if (env.app.environment === 'production' && env.logging.enabled) {
      warnings.push('Debug logging is enabled in production environment');
    }

    return warnings;
  }

  /**
   * Show startup notification based on configuration
   */
  showStartupNotification(): void {
    if (!this.validationResults) {
      this.validateEnvironment().then(() => this.showStartupNotification());
      return;
    }

    const { errors, warnings } = this.validationResults;

    if (errors.length > 0) {
      toast({
        title: 'Configuration Required',
        description: `${errors.length} configuration error(s) found. Some features may be limited.`,
        variant: 'destructive',
        duration: 8000
      });
    } else if (warnings.length > 0) {
      toast({
        title: 'Configuration Notice',
        description: `${warnings.length} configuration warning(s). Check settings for optimal experience.`,
        variant: 'default',
        duration: 5000
      });
    } else {
      // Only show success in development
      if (env.isDevelopment()) {
        toast({
          title: 'Configuration Valid',
          description: 'All services configured and ready.',
          duration: 3000
        });
      }
    }
  }

  /**
   * Get configuration summary for display
   */
  getConfigurationSummary(): {
    environment: string;
    services: ServiceStatus[];
    features: { name: string; enabled: boolean }[];
    apiKeys: { name: string; configured: boolean }[];
  } {
    return {
      environment: env.app.environment,
      services: this.getServiceStatus(),
      features: [
        { name: 'Voice Chat', enabled: env.features.voiceChat },
        { name: 'AI Assessment', enabled: env.features.aiAssessment },
        { name: 'Community', enabled: env.features.community },
        { name: 'Analytics', enabled: env.features.analytics }
      ],
      apiKeys: [
        { name: 'OpenAI', configured: !!(env.openai.apiKey && env.openai.apiKey !== 'your-openai-api-key-here') },
        { name: 'Supabase', configured: !!(env.supabase.url && env.supabase.anonKey) }
      ]
    };
  }

  /**
   * Test API connectivity
   */
  async testConnectivity(): Promise<{ [service: string]: boolean }> {
    const results: { [service: string]: boolean } = {};

    // Test OpenAI
    try {
      if (env.openai.apiKey && env.openai.apiKey !== 'your-openai-api-key-here') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${env.openai.apiKey}` }
        });
        results.openai = response.ok;
      } else {
        results.openai = false;
      }
    } catch (error) {
      results.openai = false;
    }

    // Test Supabase
    try {
      const { error } = await supabase.from('assessments').select('count').limit(1);
      results.supabase = !error;
    } catch (error) {
      results.supabase = false;
    }

    return results;
  }

  /**
   * Get current validation results
   */
  getValidationResults(): ValidationResult | null {
    return this.validationResults;
  }
}

// Export singleton instance
export const environmentValidator = new EnvironmentValidatorService();

// Import supabase for testing
import { supabase } from '@/integrations/supabase/client';