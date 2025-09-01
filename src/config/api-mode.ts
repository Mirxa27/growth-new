/**
 * API Mode Configuration
 * Determines whether to use direct API calls (with client-side key) or proxy through Edge Functions
 */

export type ApiMode = 'direct' | 'proxy';

export interface ApiModeConfig {
  mode: ApiMode;
  useProxy: boolean;
  requiresAuth: boolean;
}

/**
 * Determine the API mode based on environment and configuration
 */
export function getApiMode(): ApiModeConfig {
  // Check if we have a client-side API key
  const hasClientKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  
  // Check if proxy mode is explicitly enabled
  const forceProxy = import.meta.env.VITE_USE_OPENAI_PROXY === 'true';
  
  // In production, always use proxy for security
  const isProduction = import.meta.env.PROD;
  
  // Check if we're on a deployment (Vercel, Netlify, etc)
  const isDeployed = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1') &&
                     !window.location.hostname.includes('192.168.');
  
  // Determine mode - prefer proxy for security
  if (forceProxy || isProduction || isDeployed || !hasClientKey) {
    return {
      mode: 'proxy',
      useProxy: true,
      requiresAuth: true,
    };
  }
  
  // Only use direct mode in local development with API key
  return {
    mode: 'direct',
    useProxy: false,
    requiresAuth: false,
  };
}

/**
 * Check if OpenAI features are available
 */
export function isOpenAIAvailable(): boolean {
  const apiMode = getApiMode();
  
  if (apiMode.mode === 'proxy') {
    // Proxy mode requires authentication
    return true; // Will be checked at runtime
  }
  
  // Direct mode requires API key
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}