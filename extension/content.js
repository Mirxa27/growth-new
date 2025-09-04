// Content script - converted to avoid ES module issues
if (!window.__growthEchoInjected) {
  window.__growthEchoInjected = true;

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
    if (chrome.runtime.lastError) {
      console.warn('Background unavailable', chrome.runtime.lastError.message);
      return;
    }
    console.debug('background healthcheck', response);
    overlay.title = response?.status || 'ok';
  });
}

