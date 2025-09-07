// Content script for Chrome Extension MV3
// Note: Content scripts can't use ES modules directly, so we'll use dynamic imports

// Prevent multiple injections
if (!window.__growthEchoInjected) {
  window.__growthEchoInjected = true;
  
  // Wait for DOM to be ready
  const initializeExtension = async () => {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalidated');
        return;
      }

      // Dynamic import of utils since content scripts don't support ES modules
      let utils;
      try {
        utils = await import(chrome.runtime.getURL('utils.js'));
        await utils.ensureSettingsLoaded();
      } catch (importError) {
        console.warn('Failed to import utils, using fallback:', importError);
        // Fallback: directly use chrome.storage
        await new Promise((resolve) => {
          chrome.storage.sync.get(['openai_api_key', 'openai_base_url', 'openai_model'], () => resolve());
        });
      }
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
      const performHealthCheck = () => {
        try {
          chrome.runtime.sendMessage({ type: 'healthcheck' }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Background unavailable:', chrome.runtime.lastError.message);
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
      };

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

    } catch (error) {
      console.error('Content script initialization failed:', error);
    }
  };

  // Initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    // DOM is already ready
    initializeExtension();
  }
}

