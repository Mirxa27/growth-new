// Content script compatible with non-module execution (MV3)
// Avoid static imports to prevent "Cannot use import statement outside a module"
function ensureSettingsLoaded() {
  return new Promise((resolve) => {
    try {
      chrome.storage?.sync?.get(
        ['openai_api_key', 'openai_base_url', 'openai_model'],
        () => resolve()
      );
    } catch (_) {
      resolve();
    }
  });
}

function getSetting(key) {
  return new Promise((resolve) => {
    try {
      chrome.storage?.sync?.get([key], (result) => resolve(result?.[key]));
    } catch (_) {
      resolve(undefined);
    }
  });
}

if (!window.__growthEchoInjected) {
  window.__growthEchoInjected = true;
  (async () => {
    try {
      await ensureSettingsLoaded();
      console.debug('content script loaded');

      // Minimal overlay to confirm injection
      const overlay = document.createElement('div');
      overlay.id = 'growth-echo-overlay';
      overlay.style.position = 'fixed';
      overlay.style.zIndex = '2147483647';
      overlay.style.right = '16px';
      overlay.style.bottom = '16px';
      overlay.style.padding = '8px 10px';
      overlay.style.borderRadius = '999px';
      overlay.style.background = 'rgba(99,102,241,0.95)';
      overlay.style.color = '#fff';
      overlay.style.fontSize = '12px';
      overlay.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      overlay.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
      overlay.textContent = 'Growth Echo Assistant';
      document.documentElement.appendChild(overlay);

      // Example: ping background for login status or OpenAI health
      chrome.runtime.sendMessage({ type: 'healthcheck' }, (response) => {
        // Always touch lastError to prevent noisy "Unchecked runtime.lastError" logs
        if (chrome.runtime.lastError) {
          console.debug('Background not reachable or responded late:', chrome.runtime.lastError.message);
          return;
        }
        try {
          console.debug('background healthcheck', response);
          overlay.title = response?.status || 'ok';
        } catch (_) {
          // Ignore if overlay was removed due to navigation
        }
      });
    } catch (error) {
      console.error('Content init failed', error);
    }
  })();
}

