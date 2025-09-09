// Content script for Chrome Extension MV3
// Traditional script approach - no ES modules

// Prevent multiple injections
if (!window.__growthEchoInjected) {
  window.__growthEchoInjected = true;
  
  // Utility functions (inline to avoid import issues)
  function ensureSettingsLoaded() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['openai_api_key', 'openai_base_url', 'openai_model', 'supabase_url', 'supabase_anon_key', 'use_supabase_key'],
        () => resolve()
      );
    });
  }

  function getSetting(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => resolve(result?.[key]));
    });
  }

  function getSupabaseOpenAIKey() {
    return new Promise(async (resolve, reject) => {
      try {
        const supabaseUrl = await getSetting('supabase_url');
        const supabaseAnonKey = await getSetting('supabase_anon_key');
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase credentials not configured');
        }
        
        const response = await fetch(`${supabaseUrl}/rest/v1/admin_ai_providers?provider_type=eq.openai&is_active=eq.true&select=configuration&limit=1`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Supabase request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          throw new Error('No active OpenAI provider found');
        }
        
        const configuration = data[0].configuration;
        if (!configuration || !configuration.api_key) {
          throw new Error('OpenAI API key not found in provider configuration');
        }
        
        resolve(configuration.api_key);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Wait for DOM to be ready
  function initializeExtension() {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalidated');
        return;
      }

      ensureSettingsLoaded().then(() => {
        console.debug('content script loaded');

        // Only inject if not already present
        if (document.getElementById('growth-echo-overlay')) {
          return;
        }

        // Minimal overlay to confirm injection
        const overlay = document.createElement('div');
        overlay.id = 'growth-echo-overlay';
        overlay.style.cssText = `
          position: fixed !important;
          z-index: 2147483647 !important;
          right: 16px !important;
          bottom: 16px !important;
          padding: 8px 10px !important;
          border-radius: 999px !important;
          background: rgba(99,102,241,0.95) !important;
          color: #fff !important;
          font-size: 12px !important;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
          pointer-events: auto !important;
          user-select: none !important;
          transition: opacity 0.3s ease !important;
        `;
        overlay.textContent = 'Growth Echo Assistant';
        
        // Safe DOM insertion
        if (document.documentElement) {
          document.documentElement.appendChild(overlay);
        } else if (document.body) {
          document.body.appendChild(overlay);
        }

        // Health check with better error handling
        function performHealthCheck() {
          try {
            chrome.runtime.sendMessage({ type: 'healthcheck' }, (response) => {
              if (chrome.runtime.lastError) {
                // Silently handle - extension may not be active
                if (overlay.parentNode) {
                  overlay.style.background = 'rgba(239,68,68,0.95)';
                  overlay.title = 'Extension error: ' + chrome.runtime.lastError.message;
                }
                return;
              }
              
              if (response && overlay.parentNode) {
                console.debug('background healthcheck', response);
                overlay.title = `Status: ${response?.status || 'ok'}`;
                overlay.style.background = 'rgba(34,197,94,0.95)';
              }
            });
          } catch (error) {
            console.warn('Health check failed:', error);
          }
        }

        // Perform initial health check
        performHealthCheck();
        
        // Periodic health check (every 30 seconds)
        const healthCheckInterval = setInterval(() => {
          if (!chrome.runtime?.id || !overlay.parentNode) {
            clearInterval(healthCheckInterval);
            return;
          }
          performHealthCheck();
        }, 30000);

      }).catch(error => {
        console.error('Content script initialization failed:', error);
      });
    } catch (error) {
      console.error('Extension initialization failed:', error);
    }
  }

  // Initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    // DOM is already ready
    initializeExtension();
  }
}