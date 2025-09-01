/**
 * Environment Configuration
 * Centralized configuration management with validation and type safety
 */

interface EnvironmentConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // OpenAI
  openai: {
    apiKey?: string;
    organizationId?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  
  // Application
  app: {
    url: string;
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  // Features
  features: {
    voiceChat: boolean;
    aiAssessment: boolean;
    community: boolean;
    analytics: boolean;
  };
  
  // Security
  security: {
    jwtSecret?: string;
    encryptionKey?: string;
    allowedOrigins: string[];
    csrfProtection: boolean;
  };
  
  // Rate Limiting
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

class EnvironmentService {
  private config: EnvironmentConfig;
  
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }
  
  private loadConfiguration(): EnvironmentConfig {
    const isDevelopment = import.meta.env.MODE === 'development';
    const isProduction = import.meta.env.MODE === 'production';
    
    return {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M',
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      },
      
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        organizationId: import.meta.env.VITE_OPENAI_ORGANIZATION_ID,
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000'),
        temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7'),
      },
      
      app: {
        url: import.meta.env.VITE_APP_URL || (isDevelopment ? 'http://localhost:5173' : window.location.origin),
        name: import.meta.env.VITE_APP_NAME || 'Life Navigation System',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: isProduction ? 'production' : isDevelopment ? 'development' : 'staging',
      },
      
      features: {
        voiceChat: import.meta.env.VITE_ENABLE_VOICE_CHAT === 'true',
        aiAssessment: import.meta.env.VITE_ENABLE_AI_ASSESSMENT !== 'false',
        community: import.meta.env.VITE_ENABLE_COMMUNITY !== 'false',
        analytics: !!import.meta.env.VITE_GA_TRACKING_ID || !!import.meta.env.VITE_MIXPANEL_TOKEN,
      },
      
      security: {
        jwtSecret: import.meta.env.VITE_JWT_SECRET,
        encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY,
        allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
        csrfProtection: import.meta.env.VITE_CSRF_PROTECTION !== 'false',
      },
      
      rateLimit: {
        requests: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS || '100'),
        windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '900000'),
      },
      
      logging: {
        level: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
        enabled: import.meta.env.VITE_DEBUG_MODE === 'true' || isDevelopment,
      },
    };
  }
  
  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Validate required Supabase configuration
    if (!this.config.supabase.url) {
      errors.push('Supabase URL is required');
    }
    
    if (!this.config.supabase.anonKey) {
      errors.push('Supabase Anonymous Key is required');
    }
    
    // Validate OpenAI configuration if voice chat is enabled
    if (this.config.features.voiceChat && !this.config.openai.apiKey) {
      console.warn('Voice chat is enabled but OpenAI API key is not configured. Voice features will be limited.');
    }
    
    // Validate security configuration for production
    if (this.config.app.environment === 'production') {
      if (!this.config.security.jwtSecret || this.config.security.jwtSecret.length < 32) {
        errors.push('JWT Secret must be at least 32 characters in production');
      }
      
      if (!this.config.security.encryptionKey || this.config.security.encryptionKey.length < 32) {
        errors.push('Encryption Key must be at least 32 characters in production');
      }
    }
    
    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      if (this.config.app.environment === 'production') {
        throw new Error('Invalid environment configuration: ' + errors.join(', '));
      }
    }
  }
  
  get supabase() {
    return this.config.supabase;
  }
  
  get openai() {
    return this.config.openai;
  }
  
  get app() {
    return this.config.app;
  }
  
  get features() {
    return this.config.features;
  }
  
  get security() {
    return this.config.security;
  }
  
  get rateLimit() {
    return this.config.rateLimit;
  }
  
  get logging() {
    return this.config.logging;
  }
  
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
  
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }
  
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }
  
  getApiUrl(path: string): string {
    const baseUrl = this.config.supabase.url;
    return `${baseUrl}${path}`;
  }
}

// Export singleton instance
export const env = new EnvironmentService();

// Export type for use in other modules
export type { EnvironmentConfig };