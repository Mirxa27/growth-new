/**
 * OpenAI Configuration Helper
 * Centralized configuration for all OpenAI services
 */

import { env } from '@/config/environment';

export interface OpenAIConfig {
  apiKey: string | undefined;
  organizationId?: string;
  chatModel: string;
  realtimeModel: string;
  temperature: number;
  maxTokens: number;
}

class OpenAIConfigManager {
  private config: OpenAIConfig | null = null;
  private apiKeySource: 'env' | 'localStorage' | 'systemSettings' | 'none' = 'none';

  /**
   * Initialize and validate OpenAI configuration
   */
  async initialize(): Promise<OpenAIConfig> {
    // Try multiple sources for API key
    let apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('OpenAI API key not found in any source');
    } else {
      console.log(`OpenAI API key loaded from: ${this.apiKeySource}`);
    }

    this.config = {
      apiKey,
      organizationId: env.openai.organizationId,
      chatModel: env.openai.model || 'gpt-4o-mini',
      realtimeModel: env.openai.realtimeModel || 'gpt-4o-realtime-preview-2024-10-01',
      temperature: env.openai.temperature || 0.7,
      maxTokens: env.openai.maxTokens || 2000
    };

    return this.config;
  }

  /**
   * Get API key from multiple sources
   */
  private getApiKey(): string | undefined {
    // 1. Try environment variable first
    if (env.openai.apiKey) {
      this.apiKeySource = 'env';
      return env.openai.apiKey;
    }

    // 2. Try import.meta.env directly (in case env config has issues)
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.apiKeySource = 'env';
      return import.meta.env.VITE_OPENAI_API_KEY;
    }

    // 3. Try localStorage (for admin-configured keys)
    const localKey = localStorage.getItem('openai_api_key');
    if (localKey) {
      this.apiKeySource = 'localStorage';
      return localKey;
    }

    // 4. No key found
    return undefined;
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIConfig {
    if (!this.config) {
      throw new Error('OpenAI configuration not initialized');
    }
    return this.config;
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    if (this.config) {
      this.config.apiKey = apiKey;
      localStorage.setItem('openai_api_key', apiKey);
      this.apiKeySource = 'localStorage';
    }
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return { valid: false, error: 'API key must start with "sk-"' };
    }
    
    if (apiKey.length < 40) {
      return { valid: false, error: 'API key appears to be too short' };
    }
    
    return { valid: true };
  }

  /**
   * Test API key
   */
  async testApiKey(apiKey?: string): Promise<{ success: boolean; error?: string }> {
    const keyToTest = apiKey || this.config?.apiKey;
    
    if (!keyToTest) {
      return { success: false, error: 'No API key to test' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${keyToTest}`
        }
      });

      if (response.status === 401) {
        return { success: false, error: 'Invalid API key or expired' };
      }
      
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded or quota reached' };
      }
      
      if (!response.ok) {
        return { success: false, error: `API error: ${response.statusText}` };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics(): Record<string, any> {
    return {
      hasApiKey: !!this.config?.apiKey,
      apiKeySource: this.apiKeySource,
      apiKeyPrefix: this.config?.apiKey?.substring(0, 7),
      apiKeyLength: this.config?.apiKey?.length,
      chatModel: this.config?.chatModel,
      realtimeModel: this.config?.realtimeModel,
      envVarExists: !!import.meta.env.VITE_OPENAI_API_KEY,
      localStorageExists: !!localStorage.getItem('openai_api_key')
    };
  }
}

// Export singleton instance
export const openAIConfig = new OpenAIConfigManager();

// Auto-initialize on import
openAIConfig.initialize().catch(console.error);